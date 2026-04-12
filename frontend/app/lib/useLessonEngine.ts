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
  targetSwara: 'Sa',
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

/**
 * React hook that drives the lesson state machine.
 *
 * @param lessonYaml - Raw YAML string for the lesson
 * @param copyYaml - Optional copy overlay YAML string
 * @param initialSaHz - Student's Sa frequency (default C4)
 */
export function useLessonEngine(
  lessonYaml: string,
  copyYaml?: string,
  initialSaHz: number = 261.63,
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

  // -----------------------------------------------------------------------
  // Parse YAML
  // -----------------------------------------------------------------------
  useEffect(() => {
    try {
      const def = loadLesson(lessonYaml, copyYaml);
      setLesson(def);
      setState('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lesson');
      setState('error');
    }
  }, [lessonYaml, copyYaml]);

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

  const exitLesson = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    audio.stopTanpura();
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

    // Stop previous voice pipeline
    audio.stopVoicePipeline();
    audio.stopSaDetection();

    switch (currentPhase.type) {
      case 'tanpura_drone': {
        audio.startTanpura();
        // Auto-advance after duration_s
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

        // Auto-advance for timed phases
        if (currentPhase.duration_s) {
          timerRef.current = setTimeout(() => {
            advancePhase();
          }, currentPhase.duration_s * 1000);
        }
        break;
      }

      case 'session_summary': {
        // Stop all audio
        audio.stopVoicePipeline();
        // Fade tanpura over 2 seconds
        setTimeout(() => audio.stopTanpura(), 2000);
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
    exitLesson,
    setSaHz,
    grantMic,
    skipMic,
    retryMic,

    audio,
  };
}
