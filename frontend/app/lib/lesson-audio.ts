'use client';

/**
 * @module frontend/lib/lesson-audio
 *
 * React hook and audio manager for lesson playback and voice pipeline.
 *
 * This module provides the `useLessonAudio` hook which wires together:
 *   - TanpuraDrone (continuous reference drone)
 *   - SwaraSynth playback (individual swaras and phrases via swara-voice)
 *   - Sa detection (calibrating the student's tonic from voice input)
 *   - VoicePipeline (real-time pitch detection, swara mapping, pakad recognition)
 *
 * All Tone.js and Web Audio API usage is confined to event handlers and
 * useEffect — never at module top level — for SSR safety with Next.js.
 *
 * Audio objects are stored in useRef to avoid re-renders on audio state changes.
 * Only the boolean flags (tanpuraActive, pipelineActive) are in useState because
 * the UI needs to reflect those states.
 */

import { useRef, useState, useCallback, useEffect } from 'react';

import { TanpuraDrone } from '@/engine/synthesis/tanpura';
import {
  playSwaraNote as enginePlaySwaraNote,
  ensureAudioReady,
} from '@/engine/synthesis/swara-voice';
import type { InstrumentTimbre } from '@/engine/synthesis/swara-voice';
import { TalaPlayer } from '@/engine/synthesis/tala-engine';
import type { TalaId } from '@/engine/synthesis/tala-engine';
import { VoicePipeline } from '@/engine/voice/pipeline';
import type { VoiceEvent } from '@/engine/voice/pipeline';
import type { PitchResult } from '@/engine/analysis/pitch-mapping';
import type { PakadMatch } from '@/engine/analysis/phrase-recognition';
import type { Swara, Octave } from '@/engine/theory/types';
import type { TantriTimbre } from '@/engine/interaction/tantri';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default Sa frequency: C4 in Hz. */
const DEFAULT_SA_HZ = 261.6256;

/**
 * Number of sustained holds needed for Sa detection.
 * The student sings Sa 5 times, each hold sustained for SA_HOLD_FRAMES.
 */
const SA_DETECTION_HOLDS = 5;

/** Frames (at ~60fps) of stable pitch to count as one sustained hold (~0.75s). */
const SA_HOLD_FRAMES = 45;

/** Maximum cents deviation within a hold to remain "stable". */
const SA_HOLD_STABILITY_CENTS = 120;

/**
 * Initial minimum clarity for Sa detection readings.
 *
 * Pitchy's McLeod Pitch Method clarity on real-world sung vowels typically
 * lands between 0.55 and 0.85 — hardcoded high thresholds (0.80+) would
 * reject a clean sung tone from a slightly breathy voice. We start at 0.55
 * (a reasonable per-sample floor for pitched material) and auto-relax it
 * toward SA_DETECTION_CLARITY_FLOOR when no hold completes in the first
 * few seconds of active singing.
 */
const SA_DETECTION_CLARITY_INITIAL = 0.55;

/**
 * Hard floor that clarity relaxation will never go below. Anything lower
 * admits too much non-pitched material (breath noise, consonants).
 */
const SA_DETECTION_CLARITY_FLOOR = 0.40;

/**
 * Cadence for progressive clarity relaxation. Every RELAX_EVERY_MS with
 * no completed hold, drop the threshold by RELAX_STEP down to the floor.
 * Total span: 0.55 → 0.40 in (0.55−0.40)/0.05 × 2s = 6s.
 */
const SA_DETECTION_RELAX_EVERY_MS = 2000;
const SA_DETECTION_RELAX_STEP = 0.05;

/**
 * If the student has been in the Sa-detection phase for this long with no
 * completed hold, we surface a warning to the console so this regresses
 * loudly in future, rather than silently stalling. Does NOT affect the UI.
 */
const SA_DETECTION_WARN_AFTER_MS = 5000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LessonAudioControls {
  // Tanpura
  startTanpura(): void;
  stopTanpura(): void;
  setTanpuraVolume(volume: number): void;
  /**
   * Smoothly ramp the tanpura master gain to a target value.
   * Used by the lesson engine to duck the drone during focus phases
   * (sa_detection, pitch_exercise, call_response, etc.) and restore
   * full presence during listening phases (tanpura_drone, session_summary).
   *
   * No-op if the tanpura is not running — safe to call at every phase
   * transition without knowing whether the drone was started.
   *
   * @param gain - Target master volume in [0, 1].
   * @param rampMs - Ramp duration in milliseconds. Default 400.
   */
  setTanpuraGain(gain: number, rampMs?: number): void;
  tanpuraActive: boolean;

  // Tabla / Tala
  startTala(talaId?: TalaId, tempo?: number): void;
  stopTala(): void;
  talaActive: boolean;

  // Swara playback (for SwaraIntroduction + PhrasePlayback)
  playSwara(swara: string, durationMs?: number): Promise<void>;
  playPhrase(
    swaras: string[],
    noteDurationMs?: number,
    gapMs?: number,
  ): Promise<void>;
  stopPlayback(): void;

  // Sa detection — 5 sustained holds
  startSaDetection(
    onCandidate: (hz: number, clarity: number) => void,
    onProgress?: (hold: number, total: number, currentHz: number) => void,
  ): Promise<void>;
  stopSaDetection(): void;

  // Voice pipeline (sing_sa, sing_aroha, pakad_watch phases)
  startVoicePipeline(
    onPitch: (result: PitchResult, pitchHistory?: readonly [number, number][]) => void,
    onPakad?: (match: PakadMatch) => void,
  ): Promise<void>;
  stopVoicePipeline(): void;
  pipelineActive: boolean;

  // AnalyserNode for VoiceWave visualization
  getAnalyserNode(): AnalyserNode | null;

  // Cleanup
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses a swara name from the lesson YAML into a typed Swara + Octave pair.
 *
 * The YAML uses names like "Sa", "Re", "Ga", "Pa", "Dha", "Sa_upper".
 * "Sa_upper" maps to (Sa, taar). All others default to madhya octave.
 */
function parseSwaraName(name: string): { swara: Swara; octave: Octave } {
  if (name === 'Sa_upper') {
    return { swara: 'Sa', octave: 'taar' };
  }
  // Validate against known swara symbols. The YAML only uses shuddha
  // swaras for Bhoopali (Sa, Re, Ga, Pa, Dha), but this handles all.
  return { swara: name as Swara, octave: 'madhya' };
}

/**
 * Promise-based sleep utility.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook providing audio controls for a lesson.
 *
 * Manages the lifecycle of the tanpura drone, swara playback, Sa detection,
 * and the full voice pipeline. All audio resources are cleaned up when the
 * component unmounts.
 *
 * @param sa_hz - The student's Sa frequency in Hz (default: C4 = 261.6256)
 * @param ragaId - The raga being practiced (e.g. 'bhoopali')
 * @param timbre - Instrument timbre: 'harmonium' (default), 'piano', or 'guitar'
 * @returns LessonAudioControls for the lesson UI to drive
 */
export function useLessonAudio(
  sa_hz: number = DEFAULT_SA_HZ,
  ragaId: string,
  timbre: TantriTimbre = 'harmonium',
): LessonAudioControls {
  // -----------------------------------------------------------------------
  // State — only booleans the UI needs to render
  // -----------------------------------------------------------------------
  const [tanpuraActive, setTanpuraActive] = useState(false);
  const [talaActive, setTalaActive] = useState(false);
  const [pipelineActive, setPipelineActive] = useState(false);

  // -----------------------------------------------------------------------
  // Refs — audio objects must not trigger re-renders
  // -----------------------------------------------------------------------
  const tanpuraRef = useRef<TanpuraDrone | null>(null);
  const talaPlayerRef = useRef<TalaPlayer | null>(null);
  const talaCtxRef = useRef<AudioContext | null>(null);
  const voicePipelineRef = useRef<VoicePipeline | null>(null);
  const saDetectionPipelineRef = useRef<VoicePipeline | null>(null);
  const saDetectionTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackAbortRef = useRef<AbortController | null>(null);
  const disposedRef = useRef(false);

  // Store sa_hz in a ref so callbacks always see the latest value
  const saHzRef = useRef(sa_hz);
  saHzRef.current = sa_hz;

  // -----------------------------------------------------------------------
  // Tanpura
  // -----------------------------------------------------------------------

  const startTanpura = useCallback(() => {
    if (disposedRef.current) return;

    // Create a new TanpuraDrone if we do not have one or if it was stopped
    if (!tanpuraRef.current || !tanpuraRef.current.isRunning()) {
      tanpuraRef.current = new TanpuraDrone({
        sa_hz: saHzRef.current,
        volume: 0.3,
      });
    }

    tanpuraRef.current.start().then(() => {
      if (!disposedRef.current) {
        setTanpuraActive(true);
      }
    });
  }, []);

  const stopTanpura = useCallback(() => {
    if (tanpuraRef.current && tanpuraRef.current.isRunning()) {
      tanpuraRef.current.stop();
    }
    setTanpuraActive(false);
  }, []);

  const setTanpuraVolume = useCallback((volume: number) => {
    if (tanpuraRef.current && tanpuraRef.current.isRunning()) {
      tanpuraRef.current.setVolume(volume);
    }
  }, []);

  const setTanpuraGain = useCallback((gain: number, rampMs: number = 400) => {
    // Clamp to [0, 1] and no-op if tanpura is not running — calling this
    // at every phase transition is safe even before the drone has started.
    if (!tanpuraRef.current || !tanpuraRef.current.isRunning()) return;
    const clamped = Math.max(0, Math.min(1, gain));
    tanpuraRef.current.setVolume(clamped, rampMs);
  }, []);

  // -----------------------------------------------------------------------
  // Tabla / Tala
  // -----------------------------------------------------------------------

  const startTala = useCallback((talaId: TalaId = 'teentaal', tempo: number = 80) => {
    if (disposedRef.current) return;

    const startAsync = async () => {
      await ensureAudioReady();

      // Reuse the existing tala AudioContext if it is still open.
      // Creating a new AudioContext on every call leaks OS audio resources
      // because the browser caps the number of simultaneous contexts.
      if (!talaCtxRef.current || talaCtxRef.current.state === 'closed') {
        talaCtxRef.current = new AudioContext();
      }
      const ctx = talaCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      if (talaPlayerRef.current) {
        talaPlayerRef.current.dispose();
      }
      talaPlayerRef.current = new TalaPlayer(ctx, saHzRef.current);
      talaPlayerRef.current.startTheka(talaId, tempo);
      if (!disposedRef.current) {
        setTalaActive(true);
      }
    };
    startAsync();
  }, []);

  const stopTala = useCallback(() => {
    if (talaPlayerRef.current) {
      talaPlayerRef.current.stopTheka();
      talaPlayerRef.current.dispose();
      talaPlayerRef.current = null;
    }
    // Close the AudioContext so the OS audio resource is released.
    // A new one will be created on the next startTala call.
    if (talaCtxRef.current && talaCtxRef.current.state !== 'closed') {
      talaCtxRef.current.close().catch(() => { /* ignore close errors */ });
      talaCtxRef.current = null;
    }
    setTalaActive(false);
  }, []);

  // -----------------------------------------------------------------------
  // Swara playback
  // -----------------------------------------------------------------------

  // Store timbre in a ref so callbacks always see the latest value
  const timbreRef = useRef(timbre);
  timbreRef.current = timbre;

  const playSwara = useCallback(
    async (swara: string, durationMs: number = 500): Promise<void> => {
      if (disposedRef.current) return;

      const { swara: swaraSymbol, octave } = parseSwaraName(swara);
      const currentTimbre = timbreRef.current as InstrumentTimbre;

      await ensureAudioReady();
      await enginePlaySwaraNote(
        { swara: swaraSymbol, octave },
        saHzRef.current,
        {
          duration: durationMs / 1000,
          volume: 0.5,
          timbre: currentTimbre,
        },
      );
    },
    [],
  );

  const playPhrase = useCallback(
    async (
      swaras: string[],
      noteDurationMs: number = 500,
      gapMs: number = 50,
    ): Promise<void> => {
      if (disposedRef.current) return;

      const abort = new AbortController();
      playbackAbortRef.current = abort;

      const currentTimbre = timbreRef.current as InstrumentTimbre;
      await ensureAudioReady();

      for (const swaraName of swaras) {
        if (abort.signal.aborted || disposedRef.current) break;

        const { swara: swaraSymbol, octave } = parseSwaraName(swaraName);

        await enginePlaySwaraNote(
          { swara: swaraSymbol, octave },
          saHzRef.current,
          {
            duration: noteDurationMs / 1000,
            volume: 0.5,
            timbre: currentTimbre,
          },
        );

        if (gapMs > 0 && !abort.signal.aborted && !disposedRef.current) {
          await sleep(gapMs);
        }
      }

      playbackAbortRef.current = null;
    },
    [],
  );

  const stopPlayback = useCallback(() => {
    if (playbackAbortRef.current) {
      playbackAbortRef.current.abort();
      playbackAbortRef.current = null;
    }
  }, []);

  // -----------------------------------------------------------------------
  // Sa detection
  // -----------------------------------------------------------------------

  const startSaDetection = useCallback(
    async (
      onCandidate: (hz: number, clarity: number) => void,
      onProgress?: (hold: number, total: number, currentHz: number) => void,
    ): Promise<void> => {
      if (disposedRef.current) return;

      // Stop any existing Sa detection pipeline
      if (saDetectionPipelineRef.current) {
        saDetectionPipelineRef.current.stop();
        saDetectionPipelineRef.current = null;
      }

      // Completed holds — each is the average Hz + average clarity of a sustained tone
      const completedHolds: Array<{ hz: number; clarity: number }> = [];

      // Current hold tracking
      let holdFrames = 0;
      let holdSum = 0;
      let holdClaritySum = 0;
      let holdAnchorHz = 0; // first Hz of current hold attempt

      // Auto-calibration: if no hold completes within a few seconds of active
      // signal, progressively relax the per-sample clarity threshold. A silent
      // mic still never false-positives because the hold stability gate
      // (SA_HOLD_FRAMES × SA_HOLD_STABILITY_CENTS) continues to apply.
      const sessionStart = (typeof performance !== 'undefined'
        ? performance.now()
        : Date.now());
      let lastRelaxAt = sessionStart;
      let warned = false;

      // Clear any stale auto-relax tick from a previous call
      if (saDetectionTickRef.current !== null) {
        clearInterval(saDetectionTickRef.current);
        saDetectionTickRef.current = null;
      }

      saDetectionTickRef.current = setInterval(() => {
        if (disposedRef.current) return;
        if (completedHolds.length > 0) return; // progress made; don't relax further
        const now = (typeof performance !== 'undefined'
          ? performance.now()
          : Date.now());
        const elapsed = now - sessionStart;

        if (now - lastRelaxAt >= SA_DETECTION_RELAX_EVERY_MS) {
          const current = pipeline.getClarityThreshold();
          const next = Math.max(
            SA_DETECTION_CLARITY_FLOOR,
            current - SA_DETECTION_RELAX_STEP,
          );
          if (next < current) {
            pipeline.setClarityThreshold(next);
          }
          lastRelaxAt = now;
        }

        if (!warned && elapsed >= SA_DETECTION_WARN_AFTER_MS) {
          warned = true;
          // Surface loudly so this regression is visible in production logs.
          // eslint-disable-next-line no-console
          console.warn(
            '[lesson-audio] Sa detection: no candidate passed the clarity gate ' +
            `in ${String(Math.round(elapsed))}ms. ` +
            `Current threshold: ${pipeline.getClarityThreshold().toFixed(2)}. ` +
            'Auto-relaxing toward ' + SA_DETECTION_CLARITY_FLOOR.toFixed(2) + '. ' +
            'If this fires often, check mic gain, browser DSP, or whether the ' +
            'student is singing at all.',
          );
        }
      }, 250);

      const pipeline = new VoicePipeline({
        sa_hz: saHzRef.current,
        // No ragaId — raw Hz detection only
        clarityThreshold: SA_DETECTION_CLARITY_INITIAL,
        onPitch: (event: VoiceEvent) => {
          if (
            disposedRef.current ||
            event.type !== 'pitch' ||
            !event.hz ||
            !event.clarity
          ) {
            return;
          }

          // Only accept readings within a reasonable vocal range (80-1000 Hz)
          if (event.hz < 80 || event.hz > 1000) return;

          // Check if this frame is stable relative to the hold anchor
          if (holdFrames === 0) {
            // Start a new hold attempt
            holdAnchorHz = event.hz;
            holdSum = event.hz;
            holdClaritySum = event.clarity;
            holdFrames = 1;
          } else {
            // Check stability: is this pitch within tolerance of the anchor?
            const cents = 1200 * Math.log2(event.hz / holdAnchorHz);
            if (Math.abs(cents) <= SA_HOLD_STABILITY_CENTS) {
              // Still stable — accumulate
              holdSum += event.hz;
              holdClaritySum += event.clarity;
              holdFrames++;
            } else {
              // Pitch drifted too far — restart hold
              holdAnchorHz = event.hz;
              holdSum = event.hz;
              holdClaritySum = event.clarity;
              holdFrames = 1;
            }
          }

          // Check if we have enough frames for a complete hold
          if (holdFrames >= SA_HOLD_FRAMES) {
            const avgHz = holdSum / holdFrames;
            const avgClarity = holdClaritySum / holdFrames;
            completedHolds.push({ hz: avgHz, clarity: avgClarity });
            onProgress?.(completedHolds.length, SA_DETECTION_HOLDS, avgHz);

            // Reset for next hold
            holdFrames = 0;
            holdSum = 0;
            holdClaritySum = 0;
            holdAnchorHz = 0;

            if (completedHolds.length >= SA_DETECTION_HOLDS) {
              // All holds complete — compute final Sa as median by Hz.
              // Clarity reported as the mean of the accepted holds: reflects
              // the true confidence of the detection. A bright sung tone gives
              // ~0.95+; a breathy or uncertain tone lands ~0.60–0.75. The
              // caller can threshold on this (>= 0.7 typical) rather than
              // trusting a hardcoded 1.0.
              const sortedByHz = [...completedHolds].sort((a, b) => a.hz - b.hz);
              const median = sortedByHz[Math.floor(sortedByHz.length / 2)]!;
              const meanClarity =
                completedHolds.reduce((s, h) => s + h.clarity, 0) /
                completedHolds.length;

              // Stop the detection pipeline
              pipeline.stop();
              saDetectionPipelineRef.current = null;
              if (saDetectionTickRef.current !== null) {
                clearInterval(saDetectionTickRef.current);
                saDetectionTickRef.current = null;
              }

              // Report the candidate
              onCandidate(median.hz, meanClarity);
            }
          }
        },
        onSilence: () => {
          // Silence resets the current hold — student paused between attempts
          holdFrames = 0;
          holdSum = 0;
          holdClaritySum = 0;
          holdAnchorHz = 0;
        },
      });

      saDetectionPipelineRef.current = pipeline;
      await pipeline.start();
    },
    [],
  );

  const stopSaDetection = useCallback(() => {
    if (saDetectionPipelineRef.current) {
      saDetectionPipelineRef.current.stop();
      saDetectionPipelineRef.current = null;
    }
    if (saDetectionTickRef.current !== null) {
      clearInterval(saDetectionTickRef.current);
      saDetectionTickRef.current = null;
    }
  }, []);

  // -----------------------------------------------------------------------
  // Voice pipeline (full — pitch + pakad)
  // -----------------------------------------------------------------------

  const startVoicePipeline = useCallback(
    async (
      onPitch: (result: PitchResult, pitchHistory?: readonly [number, number][]) => void,
      onPakad?: (match: PakadMatch) => void,
    ): Promise<void> => {
      if (disposedRef.current) return;

      // Stop any existing pipeline
      if (voicePipelineRef.current) {
        voicePipelineRef.current.stop();
        voicePipelineRef.current = null;
      }

      const pipeline = new VoicePipeline({
        sa_hz: saHzRef.current,
        ragaId,
        level: 'shishya',
        clarityThreshold: 0.70,
        onPitch: (event: VoiceEvent) => {
          if (disposedRef.current) return;
          if (event.type === 'pitch' && event.pitchResult) {
            onPitch(event.pitchResult, event.pitchHistory);
          }
        },
        onSilence: () => {
          // Silence during practice — no action. The UI can infer
          // silence from the absence of pitch events.
        },
        onPakadDetected: onPakad,
      });

      voicePipelineRef.current = pipeline;
      await pipeline.start();

      if (!disposedRef.current) {
        setPipelineActive(true);
      }
    },
    [ragaId],
  );

  const stopVoicePipeline = useCallback(() => {
    if (voicePipelineRef.current) {
      voicePipelineRef.current.stop();
      voicePipelineRef.current = null;
    }
    setPipelineActive(false);
  }, []);

  // -----------------------------------------------------------------------
  // Dispose — called in useEffect cleanup
  // -----------------------------------------------------------------------

  const dispose = useCallback(() => {
    disposedRef.current = true;

    // Stop all audio systems
    stopPlayback();
    stopSaDetection();
    stopVoicePipeline();
    stopTanpura();
    stopTala();

    // Null out refs
    tanpuraRef.current = null;
    talaPlayerRef.current = null;
    talaCtxRef.current = null;
    voicePipelineRef.current = null;
    saDetectionPipelineRef.current = null;
    saDetectionTickRef.current = null;
    playbackAbortRef.current = null;
  }, [stopPlayback, stopSaDetection, stopVoicePipeline, stopTanpura, stopTala]);

  // -----------------------------------------------------------------------
  // Auto-cleanup on unmount
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  // -----------------------------------------------------------------------
  // Return controls
  // -----------------------------------------------------------------------

  const getAnalyserNode = useCallback((): AnalyserNode | null => {
    return voicePipelineRef.current?.getAnalyserNode() ?? null;
  }, []);

  return {
    startTanpura,
    stopTanpura,
    setTanpuraVolume,
    setTanpuraGain,
    tanpuraActive,
    startTala,
    stopTala,
    talaActive,
    playSwara,
    playPhrase,
    stopPlayback,
    startSaDetection,
    stopSaDetection,
    startVoicePipeline,
    stopVoicePipeline,
    pipelineActive,
    getAnalyserNode,
    dispose,
  };
}

