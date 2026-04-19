'use client';

/**
 * @module frontend/lib/useLessonEngine
 *
 * React hook that drives the lesson state machine.
 *
 * States: LOADING -> READY -> PHASE_ACTIVE[n] -> PHASE_COMPLETE[n] -> LESSON_COMPLETE
 *
 * This hook manages:
 *   - Loading the YAML lesson via lesson-loader
 *   - Phase progression (advance, skip, exit)
 *   - Audio lifecycle (tanpura, voice pipeline) tied to phase transitions
 *   - Mic permission gating before voice phases
 *   - Session data collection (duration, accuracy, pakad detection)
 *   - Persistence to Supabase on completion
 *
 * The hook returns state + controls that the LessonRenderer component consumes.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { LessonDef, LessonPhase, PhaseType } from './lesson-loader';
import { loadLesson } from './lesson-loader';
import { useLessonAudio } from './lesson-audio';
import type { PitchResult } from '@/engine/analysis/pitch-mapping';
import type { PakadMatch } from '@/engine/analysis/phrase-recognition';
import type { VoiceFeedback } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LessonState =
  | 'loading'
  | 'error'
  | 'ready'
  | 'phase_active'
  | 'phase_complete'
  | 'lesson_complete';

export type MicPermission = 'unknown' | 'granted' | 'prompt' | 'denied';

export interface PhaseContext {
  /** The current phase definition. */
  readonly phase: LessonPhase;
  /** Index of the current phase (0-based). */
  readonly phaseIndex: number;
  /** Total number of phases. */
  readonly totalPhases: number;
  /** Whether this phase requires voice input. */
  readonly isVoicePhase: boolean;
}

export interface LessonSessionData {
  readonly ragaId: string;
  readonly duration: number;
  readonly xpEarned: number;
  readonly accuracy: number;
  readonly pakadsFound: number;
  readonly startedAt: Date;
  readonly endedAt: Date;
}

/** IDLE feedback when no voice is active. */
const IDLE_VOICE_FEEDBACK: VoiceFeedback = {
  hz: null,
  centsDeviation: 0,
  targetSwara: '',
  detectedSwara: null,
  confidence: 0,
  amplitude: 0,
  pitchHistory: [],
};

/** Phase types that require voice input (mic access). */
const VOICE_PHASE_TYPES: readonly PhaseType[] = [
  'sa_detection',
  'pitch_exercise',
  'phrase_exercise',
  'call_response',
  'passive_phrase_recognition',
  'ornament_exercise',
  'andolan',
  'meend',
];

export interface LessonEngineControls {
  // State
  readonly state: LessonState;
  readonly error: string | null;
  readonly lesson: LessonDef | null;
  readonly phaseContext: PhaseContext | null;
  readonly voiceFeedback: VoiceFeedback;
  readonly pakadTriggered: boolean;
  readonly saHz: number;
  readonly micPermission: MicPermission;
  readonly micGateActive: boolean;

  // Actions
  begin(): void;
  advancePhase(): void;
  goBackPhase(): void;
  exitLesson(): void;
  setSaHz(hz: number): void;
  grantMic(): Promise<void>;
  skipMic(): void;
  retryMic(): Promise<void>;

  // Audio passthrough
  readonly audio: ReturnType<typeof useLessonAudio>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isVoicePhaseType(type: PhaseType): boolean {
  return VOICE_PHASE_TYPES.includes(type);
}

async function queryMicPermission(): Promise<MicPermission> {
  try {
    if (navigator.permissions) {
      const status = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      if (status.state === 'granted') return 'granted';
      if (status.state === 'denied') return 'denied';
      return 'prompt';
    }
  } catch {
    // Permissions API not available
  }
  return 'prompt';
}

async function requestMicAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return true;
  } catch {
    return false;
  }
}

function pitchResultToFeedback(
  result: PitchResult,
  targetSwara: string,
  pitchHistory?: readonly [number, number][],
): VoiceFeedback {
  return {
    hz: result.hz,
    centsDeviation: result.deviationCents,
    targetSwara,
    detectedSwara: result.nearestSwara,
    confidence: result.clarity,
    amplitude: result.accuracy,
    pitchHistory: pitchHistory ?? [],
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Warmup phase factory
// ---------------------------------------------------------------------------

/**
 * Builds a synthetic pitch_exercise phase for the Return Note warmup.
 * Silent: no screenTitle, no body, no instruction — the swara appears on
 * Tantri without announcement. 60-second duration with mastery auto-advance
 * at 8 consecutive seconds within ±25 cents.
 */
function buildWarmupPhase(swara: string): LessonPhase {
  return {
    id: `__warmup_${swara}`,
    type: 'pitch_exercise',
    target_swara: swara,
    duration_s: 60,
    screenTitle: undefined,
    body: undefined,
    instruction: undefined,
  } as LessonPhase;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that drives the lesson state machine.
 *
 * @param lessonYaml - Raw YAML string for the lesson
 * @param copyYaml - Optional copy overlay YAML string
 * @param initialSaHz - Student's Sa frequency (default C4)
 * @param warmupSwara - Optional swara from ?warmup= URL param — injects a
 *   silent 60-second pitch_exercise at phase index 0 (Return Note feature).
 */
export function useLessonEngine(
  lessonYaml: string,
  copyYaml?: string,
  initialSaHz: number = 261.63,
  warmupSwara?: string,
): LessonEngineControls {
  // -----------------------------------------------------------------------
  // Core state
  // -----------------------------------------------------------------------
  const [state, setState] = useState<LessonState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonDef | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [saHz, setSaHz] = useState(initialSaHz);
  const [voiceFeedback, setVoiceFeedback] = useState<VoiceFeedback>(IDLE_VOICE_FEEDBACK);
  const [pakadTriggered, setPakadTriggered] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown');
  const [micGateActive, setMicGateActive] = useState(false);
  const [skipMicFlag, setSkipMicFlag] = useState(false);

  const startTimeRef = useRef<Date | null>(null);
  const prevPhaseIndexRef = useRef(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Warmup mastery tracking — consecutive milliseconds within ±25 cents
  const warmupMasteryMsRef = useRef(0);
  const warmupLastTickRef = useRef<number | null>(null);

  // -----------------------------------------------------------------------
  // Parse YAML (+ optional warmup injection)
  // -----------------------------------------------------------------------
  useEffect(() => {
    try {
      const def = loadLesson(lessonYaml, copyYaml);
      if (warmupSwara) {
        const warmupPhase = buildWarmupPhase(warmupSwara);
        // Prepend the warmup phase; LessonDef.phases is readonly so spread into new array
        const patchedDef = { ...def, phases: [warmupPhase, ...def.phases] };
        setLesson(patchedDef as typeof def);
      } else {
        setLesson(def);
      }
      setState('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lesson');
      setState('error');
    }
  }, [lessonYaml, copyYaml, warmupSwara]);

  // -----------------------------------------------------------------------
  // Audio hook
  // -----------------------------------------------------------------------
  const ragaId = lesson?.raga_id ?? 'bhoopali';
  const audio = useLessonAudio(saHz, ragaId);

  // -----------------------------------------------------------------------
  // Derived state
  // -----------------------------------------------------------------------
  const currentPhase = lesson?.phases[phaseIndex] ?? null;
  const isVoicePhase = currentPhase ? isVoicePhaseType(currentPhase.type) : false;

  const phaseContext = useMemo((): PhaseContext | null => {
    if (!lesson || !currentPhase) return null;
    return {
      phase: currentPhase,
      phaseIndex,
      totalPhases: lesson.phases.length,
      isVoicePhase,
    };
  }, [lesson, currentPhase, phaseIndex, isVoicePhase]);

  // -----------------------------------------------------------------------
  // Phase navigation
  // -----------------------------------------------------------------------

  const begin = useCallback(() => {
    if (!lesson) return;
    setPhaseIndex(0);
    setPakadTriggered(false);
    setVoiceFeedback(IDLE_VOICE_FEEDBACK);
    startTimeRef.current = new Date();
    setState('phase_active');
  }, [lesson]);

  const advancePhase = useCallback(() => {
    if (!lesson) return;

    // Clear any running timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const nextIndex = phaseIndex + 1;
    if (nextIndex < lesson.phases.length) {
      setState('phase_complete');
      // Auto-advance after 500ms pause (per spec)
      timerRef.current = setTimeout(() => {
        setPhaseIndex(nextIndex);
        setState('phase_active');
      }, 500);
    } else {
      setState('lesson_complete');
    }
  }, [lesson, phaseIndex]);

  const goBackPhase = useCallback(() => {
    if (!lesson || phaseIndex <= 0) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setPhaseIndex(phaseIndex - 1);
    setState('phase_active');
  }, [lesson, phaseIndex]);

  const exitLesson = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    audio.stopTanpura();
    audio.stopTala();
    audio.stopVoicePipeline();
    audio.stopPlayback();
    setVoiceFeedback(IDLE_VOICE_FEEDBACK);
    setState('ready');
    setPhaseIndex(0);
  }, [audio]);

  // -----------------------------------------------------------------------
  // Mic permission
  // -----------------------------------------------------------------------

  const grantMic = useCallback(async () => {
    const granted = await requestMicAccess();
    if (granted) {
      setMicPermission('granted');
      setMicGateActive(false);
    } else {
      setMicPermission('denied');
    }
  }, []);

  const skipMic = useCallback(() => {
    setSkipMicFlag(true);
    setMicGateActive(false);
  }, []);

  const retryMic = useCallback(async () => {
    const perm = await queryMicPermission();
    setMicPermission(perm);
    if (perm === 'granted') {
      setMicGateActive(false);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Phase audio lifecycle
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (state !== 'phase_active' || !currentPhase || !lesson) return;

    // Prevent re-running for the same phase
    if (prevPhaseIndexRef.current === phaseIndex) return;
    prevPhaseIndexRef.current = phaseIndex;

    // Stop previous voice pipeline and reset feedback
    audio.stopVoicePipeline();
    audio.stopSaDetection();
    setVoiceFeedback(IDLE_VOICE_FEEDBACK);

    switch (currentPhase.type) {
      case 'tanpura_drone': {
        // Start the tanpura drone — this also resumes the AudioContext
        audio.startTanpura();
        if (currentPhase.duration_s) {
          timerRef.current = setTimeout(() => {
            advancePhase();
          }, currentPhase.duration_s * 1000);
        }
        break;
      }

      case 'sa_detection': {
        if (skipMicFlag) {
          advancePhase();
          break;
        }
        audio.startSaDetection((hz: number) => {
          setSaHz(hz);
          advancePhase();
        }).catch(() => {
          setMicPermission('denied');
          setMicGateActive(true);
        });
        break;
      }

      case 'pitch_exercise':
      case 'phrase_exercise':
      case 'passive_phrase_recognition': {
        if (skipMicFlag) break;

        // Reset warmup mastery tracking when a new phase starts
        warmupMasteryMsRef.current = 0;
        warmupLastTickRef.current = null;
        const isWarmupPhase = currentPhase.id.startsWith('__warmup_');
        const WARMUP_MASTERY_MS = 8000; // 8 consecutive seconds
        const WARMUP_CENTS_TOLERANCE = 25;

        const startVoice = async () => {
          const perm = await queryMicPermission();
          setMicPermission(perm);

          if (perm !== 'granted') {
            setMicGateActive(true);
            return;
          }

          try {
            await audio.startVoicePipeline(
              (result: PitchResult, pitchHistory?: readonly [number, number][]) => {
                const target = currentPhase.target_swara ?? result.nearestSwara;
                setVoiceFeedback(pitchResultToFeedback(result, target, pitchHistory));

                // Warmup mastery: track consecutive time within ±25 cents
                if (isWarmupPhase) {
                  const now = Date.now();
                  const withinBand = Math.abs(result.deviationCents) <= WARMUP_CENTS_TOLERANCE
                    && result.clarity > 0.4;
                  if (withinBand) {
                    if (warmupLastTickRef.current !== null) {
                      warmupMasteryMsRef.current += now - warmupLastTickRef.current;
                    }
                    warmupLastTickRef.current = now;
                    if (warmupMasteryMsRef.current >= WARMUP_MASTERY_MS) {
                      // Mastery achieved — clear the 60s fallback timer and advance
                      if (timerRef.current) {
                        clearTimeout(timerRef.current);
                        timerRef.current = null;
                      }
                      warmupMasteryMsRef.current = 0;
                      warmupLastTickRef.current = null;
                      advancePhase();
                    }
                  } else {
                    // Reset streak — must be consecutive
                    warmupMasteryMsRef.current = 0;
                    warmupLastTickRef.current = null;
                  }
                }
              },
              currentPhase.watch_for_pakad
                ? () => setPakadTriggered(true)
                : undefined,
            );
          } catch {
            setMicPermission('denied');
            setMicGateActive(true);
          }
        };
        startVoice();

        // Auto-advance for timed phases (warmup: 60s fallback if no mastery)
        if (currentPhase.duration_s) {
          timerRef.current = setTimeout(() => {
            advancePhase();
          }, currentPhase.duration_s * 1000);
        }
        break;
      }

      case 'session_summary': {
        // Stop all audio — lesson is over
        audio.stopVoicePipeline();
        audio.stopTanpura();
        audio.stopTala();
        setVoiceFeedback(IDLE_VOICE_FEEDBACK);
        break;
      }

      // swara_introduction, phrase_playback, call_response:
      // These are driven by their components calling advancePhase on completion
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, phaseIndex, currentPhase?.type]);

  // -----------------------------------------------------------------------
  // Re-start voice when mic is granted after gate
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (micPermission !== 'granted' || micGateActive) return;
    if (!currentPhase || !isVoicePhase || skipMicFlag) return;

    const restartVoice = async () => {
      try {
        await audio.startVoicePipeline(
          (result: PitchResult, pitchHistory?: readonly [number, number][]) => {
            const target = currentPhase.target_swara ?? result.nearestSwara;
            setVoiceFeedback(pitchResultToFeedback(result, target, pitchHistory));
          },
          currentPhase.watch_for_pakad
            ? () => setPakadTriggered(true)
            : undefined,
        );
      } catch {
        // Silently fail — user chose to continue
      }
    };
    restartVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micPermission]);

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------
  useEffect(() => {
    return () => {
      audio.dispose();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------

  return {
    state,
    error,
    lesson,
    phaseContext,
    voiceFeedback,
    pakadTriggered,
    saHz,
    micPermission,
    micGateActive,

    begin,
    advancePhase,
    goBackPhase,
    exitLesson,
    setSaHz,
    grantMic,
    skipMic,
    retryMic,

    audio,
  };
}
