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
import { VoicePipeline } from '@/engine/voice/pipeline';
import type { VoiceEvent } from '@/engine/voice/pipeline';
import type { PitchResult } from '@/engine/analysis/pitch-mapping';
import type { PakadMatch } from '@/engine/analysis/phrase-recognition';
import type { Swara, Octave } from '@/engine/theory/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default Sa frequency: C4 in Hz. */
const DEFAULT_SA_HZ = 261.6256;

/** Number of stable pitch readings needed for Sa detection. */
const SA_DETECTION_READINGS = 5;

/** Minimum clarity for Sa detection readings. */
const SA_DETECTION_CLARITY = 0.85;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LessonAudioControls {
  // Tanpura
  startTanpura(): void;
  stopTanpura(): void;
  tanpuraActive: boolean;

  // Swara playback (for SwaraIntroduction + PhrasePlayback)
  playSwara(swara: string, durationMs?: number): Promise<void>;
  playPhrase(
    swaras: string[],
    noteDurationMs?: number,
    gapMs?: number,
  ): Promise<void>;
  stopPlayback(): void;

  // Sa detection
  startSaDetection(
    onCandidate: (hz: number, clarity: number) => void,
  ): Promise<void>;
  stopSaDetection(): void;

  // Voice pipeline (sing_sa, sing_aroha, pakad_watch phases)
  startVoicePipeline(
    onPitch: (result: PitchResult) => void,
    onPakad?: (match: PakadMatch) => void,
  ): Promise<void>;
  stopVoicePipeline(): void;
  pipelineActive: boolean;

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
 * @returns LessonAudioControls for the lesson UI to drive
 */
export function useLessonAudio(
  sa_hz: number = DEFAULT_SA_HZ,
  ragaId: string,
): LessonAudioControls {
  // -----------------------------------------------------------------------
  // State — only booleans the UI needs to render
  // -----------------------------------------------------------------------
  const [tanpuraActive, setTanpuraActive] = useState(false);
  const [pipelineActive, setPipelineActive] = useState(false);

  // -----------------------------------------------------------------------
  // Refs — audio objects must not trigger re-renders
  // -----------------------------------------------------------------------
  const tanpuraRef = useRef<TanpuraDrone | null>(null);
  const voicePipelineRef = useRef<VoicePipeline | null>(null);
  const saDetectionPipelineRef = useRef<VoicePipeline | null>(null);
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

  // -----------------------------------------------------------------------
  // Swara playback
  // -----------------------------------------------------------------------

  const playSwara = useCallback(
    async (swara: string, durationMs: number = 500): Promise<void> => {
      if (disposedRef.current) return;

      await ensureAudioReady();
      const { swara: swaraSymbol, octave } = parseSwaraName(swara);

      // Use enginePlaySwaraNote which respects the octave register.
      // This is critical for "Sa_upper" (taar octave) vs "Sa" (madhya).
      await enginePlaySwaraNote(
        { swara: swaraSymbol, octave },
        saHzRef.current,
        {
          duration: durationMs / 1000,
          volume: 0.5,
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

      // Create an AbortController so stopPlayback can interrupt the sequence
      const abort = new AbortController();
      playbackAbortRef.current = abort;

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
    async (onCandidate: (hz: number, clarity: number) => void): Promise<void> => {
      if (disposedRef.current) return;

      // Stop any existing Sa detection pipeline
      if (saDetectionPipelineRef.current) {
        saDetectionPipelineRef.current.stop();
        saDetectionPipelineRef.current = null;
      }

      const readings: { hz: number; clarity: number }[] = [];

      const pipeline = new VoicePipeline({
        sa_hz: saHzRef.current,
        // No ragaId — raw Hz detection only
        clarityThreshold: SA_DETECTION_CLARITY,
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

          readings.push({ hz: event.hz, clarity: event.clarity });

          if (readings.length >= SA_DETECTION_READINGS) {
            // Average the readings
            const avgHz =
              readings.reduce((sum, r) => sum + r.hz, 0) / readings.length;
            const avgClarity =
              readings.reduce((sum, r) => sum + r.clarity, 0) / readings.length;

            // Stop the detection pipeline
            pipeline.stop();
            saDetectionPipelineRef.current = null;

            // Report the candidate
            onCandidate(avgHz, avgClarity);
          }
        },
        onSilence: () => {
          // Silence during Sa detection is normal — student is preparing.
          // No action needed.
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
  }, []);

  // -----------------------------------------------------------------------
  // Voice pipeline (full — pitch + pakad)
  // -----------------------------------------------------------------------

  const startVoicePipeline = useCallback(
    async (
      onPitch: (result: PitchResult) => void,
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
        clarityThreshold: 0.85,
        onPitch: (event: VoiceEvent) => {
          if (disposedRef.current) return;
          if (event.type === 'pitch' && event.pitchResult) {
            onPitch(event.pitchResult);
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

    // Null out refs
    tanpuraRef.current = null;
    voicePipelineRef.current = null;
    saDetectionPipelineRef.current = null;
    playbackAbortRef.current = null;
  }, [stopPlayback, stopSaDetection, stopVoicePipeline, stopTanpura]);

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

  return {
    startTanpura,
    stopTanpura,
    tanpuraActive,
    playSwara,
    playPhrase,
    stopPlayback,
    startSaDetection,
    stopSaDetection,
    startVoicePipeline,
    stopVoicePipeline,
    pipelineActive,
    dispose,
  };
}

