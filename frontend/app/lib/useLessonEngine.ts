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
import { updateSa } from './supabase';
import type { PitchResult } from '@/engine/analysis/pitch-mapping';
import type { PakadMatch } from '@/engine/analysis/phrase-recognition';
import type { VoiceFeedback } from './types';
import { emit } from './telemetry';

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
  'sing_along',
  'call_response',
  'mastery_challenge',
  'passive_phrase_recognition',
  'ornament_exercise',
  'andolan',
  'meend',
  // T2.3 — tala exercises need raw mic input for onset detection. The voice
  // pipeline's analyser is the audio source TalaPhase pulls time-domain
  // samples from to score student claps against beat times.
  'tala_exercise',
  'tala_melody_exercise',
];

/**
 * Per-phase tanpura presence map.
 *
 * The tanpura NEVER stops — silence breaks the ritual (music-director ruling).
 * It only changes presence. Floor is 0.15 (never below).
 *
 * Gain values are multipliers on the tanpura base volume (0.3):
 *   1.0 × 0.3 = 0.30 absolute (full presence)
 *   0.75 × 0.3 = 0.225 (sa_detection — audible reference, student not yet singing)
 *   0.55 × 0.3 = 0.165 (free singing — student's voice must be audible over drone)
 *   0.22 × 0.3 = 0.066 (instruction / pitch_exercise — student focused, not singing)
 *   0.18 × 0.3 = 0.054 (phrase playback — harmonium demo must be heard clearly)
 *   0.15 = absolute floor (never below this)
 *
 * Any phase type not in the map defaults to INSTRUCTION_GAIN (0.22).
 */
const FULL_GAIN = 1.0;         // tanpura_drone — student is actively listening to drone
const SA_DETECTION_GAIN = 0.85;    // tanpura audible; student hasn't started singing yet
const FREE_SING_GAIN = 0.55;       // passive_phrase_recognition — student singing freely
const PAKAD_SWELL_GAIN = 0.65;     // pakad_recognition_moment — swell on recognition
const INSTRUCTION_GAIN = 0.22;     // chrome / instructions / exercise setup
const DEMO_GAIN = 0.18;            // phrase playback / harmonium demo playing
const VOICE_EXERCISE_GAIN = 0.22;  // pitch_exercise, call_response — student singing
const TANPURA_FLOOR = 0.15;        // absolute minimum — never below this

const PHASE_TANPURA_GAIN: Readonly<Partial<Record<PhaseType, number>>> = {
  // Full presence — student is listening to the drone as the primary sound
  tanpura_drone: FULL_GAIN,
  session_summary: FULL_GAIN,

  // Sa detection — drone is the reference; student hasn't yet started singing
  sa_detection: SA_DETECTION_GAIN,

  // Free singing — student's voice carries, drone supports but doesn't compete
  passive_phrase_recognition: FREE_SING_GAIN,

  // Demo / instruction phases — harmonium or explanation must be heard clearly
  phrase_playback: DEMO_GAIN,
  swara_introduction: DEMO_GAIN,
  ornament_exercise: DEMO_GAIN,
  andolan: DEMO_GAIN,
  meend: DEMO_GAIN,

  // Voice exercise — student singing, needs to hear themselves
  pitch_exercise: VOICE_EXERCISE_GAIN,
  phrase_exercise: VOICE_EXERCISE_GAIN,
  sing_along: VOICE_EXERCISE_GAIN,
  call_response: VOICE_EXERCISE_GAIN,
  mastery_challenge: VOICE_EXERCISE_GAIN,
};

/**
 * Crossfade duration for tanpura gain changes.
 * 800ms (per music-director spec — unhurried shift in presence, not a cut).
 */
const TANPURA_GAIN_RAMP_MS = 800;

/**
 * Resolve the tanpura target gain for a phase. Honors the per-phase
 * `tanpura_presence` YAML override, then falls back to the default map,
 * then to INSTRUCTION_GAIN for unknown phase types.
 * Always clamps to ≥ TANPURA_FLOOR — the drone never stops.
 * The `tanpura_presence: 'off'` override is ignored (deprecated — silence
 * breaks the ritual).
 */
function resolveTanpuraGain(phase: LessonPhase): number {
  if (phase.tanpura_presence === 'full') return FULL_GAIN;
  if (phase.tanpura_presence === 'duck') return VOICE_EXERCISE_GAIN;
  // 'off' is deprecated — map to floor rather than 0
  if (phase.tanpura_presence === 'off') return TANPURA_FLOOR;
  const mapped = PHASE_TANPURA_GAIN[phase.type];
  return Math.max(TANPURA_FLOOR, mapped ?? INSTRUCTION_GAIN);
}

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
 * @param userId - Optional Supabase user ID for persisting Sa detection results.
 *   When provided, any in-lesson Sa detection result is written to Supabase
 *   immediately so future lessons don't re-prompt.
 */
export function useLessonEngine(
  lessonYaml: string,
  copyYaml?: string,
  initialSaHz: number = 261.63,
  warmupSwara?: string,
  userId?: string,
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
  // Stable ref to advancePhase so the phase-audio effect always sees the
  // latest callback without needing it in the effect's dependency array
  // (adding it would cause the effect to re-fire on every phaseIndex change).
  const advancePhaseRef = useRef<() => void>(() => {});

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
    // Reset the phase-dedup guard so the phase-audio effect re-fires for
    // phase 0 even if the student previously completed phase 0 and re-begins.
    prevPhaseIndexRef.current = -1;
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
      // Zero-pause transition: set phase index and active state in the same tick.
      // The 500ms pause has been removed — phase transitions are instant.
      // AnimatePresence handles the visual cross-fade (≤180ms enter + 150ms exit).
      setPhaseIndex(nextIndex);
      setState('phase_active');
    } else {
      setState('lesson_complete');
    }
  }, [lesson, phaseIndex]);

  // Keep the ref in sync with the latest advancePhase closure so the
  // phase-audio effect can call advancePhaseRef.current() and always
  // invoke the up-to-date version without a stale closure.
  advancePhaseRef.current = advancePhase;

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
    // Reset the phase-dedup guard so the phase-audio effect re-fires for
    // phase 0 when the student begins again after exiting.
    prevPhaseIndexRef.current = -1;
  }, [audio]);

  // -----------------------------------------------------------------------
  // Mic permission
  // -----------------------------------------------------------------------

  const grantMic = useCallback(async () => {
    const granted = await requestMicAccess();
    if (granted) {
      setMicPermission('granted');
      setMicGateActive(false);
      void emit('mic-granted');
    } else {
      setMicPermission('denied');
      void emit('mic-denied');
    }
  }, []);

  const skipMic = useCallback(() => {
    setSkipMicFlag(true);
    setMicGateActive(false);
    void emit('phase-skipped', { reason: 'mic-denied-skip' });
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

    // Duck or restore the tanpura for this phase. No-op if the drone is not
    // running — calling on every phase transition is safe. 800ms ramp so the
    // shift in presence feels like a natural change in focus (music-director spec).
    //
    // Note: the tanpura itself is started by the first `tanpura_drone` phase
    // (typically phase 0) and plays continuously for the rest of the lesson.
    // Only the gain changes as the student moves between listening and
    // focus phases. Gain never drops below TANPURA_FLOOR (0.15).
    const targetGain = resolveTanpuraGain(currentPhase);
    audio.setTanpuraGain(targetGain, TANPURA_GAIN_RAMP_MS);

    switch (currentPhase.type) {
      case 'tanpura_drone': {
        // Start the tanpura drone — this also resumes the AudioContext
        audio.startTanpura();
        if (currentPhase.duration_s) {
          timerRef.current = setTimeout(() => {
            advancePhaseRef.current();
          }, currentPhase.duration_s * 1000);
        }
        break;
      }

      case 'sa_detection': {
        if (skipMicFlag) {
          advancePhaseRef.current();
          break;
        }
        // skip_if: 'sa_already_set' — advance immediately when the student
        // already has a calibrated Sa (any value other than the C4 default).
        // This prevents re-prompting returning students on every lesson open.
        if (currentPhase.skip_if === 'sa_already_set' && saHz !== 261.6256) {
          advancePhaseRef.current();
          break;
        }
        audio.startSaDetection((hz: number) => {
          setSaHz(hz);
          // Persist to Supabase so future lessons skip re-calibration.
          // Fire-and-forget — do not block phase advance on network.
          if (userId) {
            updateSa(userId, hz).catch(() => {
              // Silently ignore network errors — local state is already updated.
            });
          }
          advancePhaseRef.current();
        }).catch(() => {
          setMicPermission('denied');
          setMicGateActive(true);
        });
        break;
      }

      case 'pitch_exercise':
      case 'phrase_exercise':
      case 'sing_along':
      case 'call_response':
      case 'mastery_challenge':
      case 'tala_exercise':
      case 'tala_melody_exercise':
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
                      // Use ref to avoid capturing a stale advancePhase closure
                      advancePhaseRef.current();
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
            advancePhaseRef.current();
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
