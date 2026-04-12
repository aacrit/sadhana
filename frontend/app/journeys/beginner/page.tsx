/**
 * Beginner journey — lesson B-01: Your First Raga (Bhoopali)
 *
 * Two views:
 *   1. Home view: daily riyaz card, progress, recent ragas (pre-lesson)
 *   2. Lesson view: phased lesson flow for beginner-01-bhoopali
 *
 * Lesson phases (from beginner-01-bhoopali.yaml):
 *   listen -> sa_calibration -> meet_bhoopali -> aroha_listen -> aroha_show
 *   -> avaroha_listen -> avaroha_show -> sing_sa -> sing_aroha -> pakad_watch
 *   -> complete
 *
 * Phase titles and copy are hard-coded from the copy YAML. The data layer
 * (Supabase) will replace these later.
 *
 * Progress dots at the bottom: one per phase, current = saffron.
 *
 * Voice visualization: rendered during sing_sa, sing_aroha, and pakad_watch
 * phases, receiving PitchResult mapped to VoiceFeedback.
 *
 * Mic permission: gated before the first voice phase (sing_sa). Permission
 * denied or prompt states are handled with appropriate UI.
 *
 * Daily riyaz: time-of-day raga selection with localStorage-based completion
 * tracking. After completion, shows "riyaz complete" state.
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getRagaForTimeOfDay } from '@/engine/theory';
import { DEFAULT_USER, getLevelTitle, getLevelColor } from '../../lib/types';
import type { VoiceFeedback, RecentRaga } from '../../lib/types';
import type { PitchResult } from '@/engine/analysis/pitch-mapping';
import { useAuth } from '../../lib/auth';
import {
  saveSession,
  completeRiyaz,
  addXp,
  updateSa,
  getRecentRagas,
} from '../../lib/supabase';
import SwaraIntroduction from '../../components/SwaraIntroduction';
import PhrasePlayback from '../../components/PhrasePlayback';
import PakadMoment from '../../components/PakadMoment';
import VoiceVisualization from '../../components/VoiceVisualization';
import { useLessonAudio } from '../../lib/lesson-audio';
import homeStyles from '../../styles/beginner.module.css';
import lessonStyles from '../../styles/beginner-lesson.module.css';

// ---------------------------------------------------------------------------
// Lesson phases
// ---------------------------------------------------------------------------

const LESSON_PHASES = [
  'listen',
  'sa_calibration',
  'meet_bhoopali',
  'aroha_listen',
  'aroha_show',
  'avaroha_listen',
  'avaroha_show',
  'sing_sa',
  'sing_aroha',
  'pakad_watch',
  'complete',
] as const;

type LessonPhase = (typeof LESSON_PHASES)[number];

// ---------------------------------------------------------------------------
// Phase copy (hard-coded from beginner-01-bhoopali-copy.yaml)
// ---------------------------------------------------------------------------

interface PhaseCopy {
  readonly screenTitle: string;
  readonly body: string;
}

const PHASE_COPY: Record<LessonPhase, PhaseCopy> = {
  listen: {
    screenTitle: 'Listen',
    body: 'Close your eyes.\nThe tanpura is playing. It will always be here with you.\nYou don\'t need to do anything yet.',
  },
  sa_calibration: {
    screenTitle: 'Find Your Sa',
    body: 'Sa is the home note. Everything starts and returns here.\nHum or sing a comfortable pitch. Hold it steady.',
  },
  meet_bhoopali: {
    screenTitle: 'Five Notes',
    body: 'This raga uses only five notes.\nListen to each one.',
  },
  aroha_listen: {
    screenTitle: 'Climbing Up',
    body: 'Listen to Bhoopali ascending. Twice.',
  },
  aroha_show: {
    screenTitle: 'Climbing Up',
    body: 'Sa Re Ga Pa Dha Sa.',
  },
  avaroha_listen: {
    screenTitle: 'Coming Down',
    body: 'Now descending. Twice.',
  },
  avaroha_show: {
    screenTitle: 'Coming Down',
    body: 'Sa Dha Pa Ga Re Sa.',
  },
  sing_sa: {
    screenTitle: 'Sing Sa',
    body: 'Just Sa. Hold it as long as you like.\nThe tanpura is with you.',
  },
  sing_aroha: {
    screenTitle: 'Sing the Ascent',
    body: 'Follow the guide tone up. One note at a time.\nDon\'t rush. Let each note land before moving on.',
  },
  pakad_watch: {
    screenTitle: 'Free Singing',
    body: 'Keep singing. Use the notes you\'ve learned.\nLet whatever wants to come, come.',
  },
  complete: {
    screenTitle: 'Session Complete',
    body: 'You\'ve met Bhoopali.\nAt dusk, when the last light turns gold \u2014 this raga is yours.',
  },
};

// ---------------------------------------------------------------------------
// Lesson data (from beginner-01-bhoopali.yaml)
// ---------------------------------------------------------------------------

const BHOOPALI_SWARAS = ['Sa', 'Re', 'Ga', 'Pa', 'Dha'];
const AROHA_PHRASE = ['Sa', 'Re', 'Ga', 'Pa', 'Dha', 'Sa_upper'];
const AVAROHA_PHRASE = ['Sa_upper', 'Dha', 'Pa', 'Ga', 'Re', 'Sa'];

// ---------------------------------------------------------------------------
// Home view animations
// ---------------------------------------------------------------------------

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// ---------------------------------------------------------------------------
// Phase content transition
// ---------------------------------------------------------------------------

const phaseTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
};

// ---------------------------------------------------------------------------
// Helper: time-of-day label
// ---------------------------------------------------------------------------

function getTimeOfDayLabel(hour: number): string {
  if (hour >= 6 && hour < 9) return 'Dawn';
  if (hour >= 9 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 15) return 'Afternoon';
  if (hour >= 15 && hour < 18) return 'Late afternoon';
  if (hour >= 18 && hour < 21) return 'Evening';
  if (hour >= 21) return 'Night';
  if (hour >= 0 && hour < 3) return 'Midnight';
  return 'Pre-dawn';
}

// ---------------------------------------------------------------------------
// Priority 3: PitchResult -> VoiceFeedback mapping
// ---------------------------------------------------------------------------

/** Default VoiceFeedback when no voice is active. */
const IDLE_VOICE_FEEDBACK: VoiceFeedback = {
  hz: null,
  centsDeviation: 0,
  targetSwara: 'Sa',
  detectedSwara: null,
  confidence: 0,
  amplitude: 0,
  pitchHistory: [],
};

/**
 * Maps a PitchResult from the voice pipeline to a VoiceFeedback for
 * the VoiceVisualization component.
 */
function pitchResultToFeedback(
  result: PitchResult,
  targetSwara: string,
): VoiceFeedback {
  return {
    hz: result.hz,
    centsDeviation: result.deviationCents,
    targetSwara,
    detectedSwara: result.nearestSwara,
    confidence: result.clarity,
    amplitude: result.accuracy,
    pitchHistory: [],
  };
}

// ---------------------------------------------------------------------------
// Priority 4: localStorage key for riyaz completion
// ---------------------------------------------------------------------------

const RIYAZ_DATE_KEY = 'sadhana_riyaz_date';

/** Get today's date as YYYY-MM-DD string. */
function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Check if today's riyaz has been completed (from localStorage). */
function isRiyazCompleteToday(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(RIYAZ_DATE_KEY) === getTodayString();
  } catch {
    return false;
  }
}

/** Mark today's riyaz as complete in localStorage. */
function markRiyazComplete(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RIYAZ_DATE_KEY, getTodayString());
  } catch {
    // localStorage unavailable — silently fail
  }
}

// ---------------------------------------------------------------------------
// Priority 8: Mic permission states
// ---------------------------------------------------------------------------

type MicPermission = 'unknown' | 'granted' | 'prompt' | 'denied';

/**
 * Queries the current microphone permission state.
 * Falls back to 'prompt' if the Permissions API is unavailable.
 */
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
    // Permissions API not available or microphone not queryable
  }
  return 'prompt';
}

/**
 * Attempts to acquire microphone access. Returns true on success.
 */
async function requestMicAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately release the stream — we just needed permission
    for (const track of stream.getTracks()) {
      track.stop();
    }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function BeginnerPage() {
  const { user: authUser, profile, refreshProfile } = useAuth();

  const [view, setView] = useState<'home' | 'lesson'>('home');
  const [phase, setPhase] = useState<LessonPhase>('listen');
  const [pakadTriggered, setPakadTriggered] = useState(false);
  const [saHz, setSaHz] = useState(261.63);

  // Sync Sa Hz from profile when it loads
  useEffect(() => {
    if (profile?.saHz) {
      setSaHz(profile.saHz);
    }
  }, [profile?.saHz]);

  // Track lesson start time for session duration calculation
  const lessonStartRef = useRef<Date | null>(null);

  // Priority 3: Voice feedback state for VoiceVisualization
  const [voiceFeedback, setVoiceFeedback] = useState<VoiceFeedback>(IDLE_VOICE_FEEDBACK);

  // Priority 4: Riyaz completion tracking
  const [riyazDone, setRiyazDone] = useState(false);

  // Priority 8: Mic permission state
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown');
  const [micGateActive, setMicGateActive] = useState(false);
  const [skipMic, setSkipMic] = useState(false);

  // Audio hook — provides tanpura, swara playback, voice pipeline
  const audio = useLessonAudio(saHz, 'bhoopali');

  // Track previous phase for cleanup
  const prevPhaseRef = useRef<LessonPhase>(phase);

  // Check riyaz completion status on mount (localStorage for guests, profile for signed-in)
  useEffect(() => {
    if (profile?.riyazDone) {
      setRiyazDone(true);
    } else {
      setRiyazDone(isRiyazCompleteToday());
    }
  }, [profile?.riyazDone]);

  // Home view state
  const hour = new Date().getHours();
  const todayRaga = useMemo(() => getRagaForTimeOfDay(hour), [hour]);
  const timeLabel = getTimeOfDayLabel(hour);
  const user = profile ?? DEFAULT_USER;
  const levelTitle = getLevelTitle(user.level);
  const levelColor = getLevelColor(user.level);
  const xpProgress = Math.min((user.xp % 100) / 100, 1);
  const isFirstTime = user.lastPractice === null;

  // Fetch recent ragas from Supabase for signed-in users
  const [recentRagas, setRecentRagas] = useState<RecentRaga[]>([]);
  useEffect(() => {
    if (authUser) {
      getRecentRagas(authUser.id, 3).then(setRecentRagas);
    }
  }, [authUser]);

  // Compute whether the voice phases should render VoiceVisualization
  const isVoicePhase = phase === 'sing_sa' || phase === 'sing_aroha' || phase === 'pakad_watch';

  // Determine the target swara label for the current voice phase
  const voiceTargetSwara = phase === 'sing_sa' ? 'Sa' : 'Sa';

  // ---------------------------------------------------------------------------
  // Phase navigation
  // ---------------------------------------------------------------------------

  const currentPhaseIndex = LESSON_PHASES.indexOf(phase);

  const advancePhase = useCallback(() => {
    const nextIndex = currentPhaseIndex + 1;
    if (nextIndex < LESSON_PHASES.length) {
      const nextPhase = LESSON_PHASES[nextIndex];
      if (nextPhase !== undefined) {
        setPhase(nextPhase);
      }
    }
  }, [currentPhaseIndex]);

  const startLesson = useCallback(() => {
    setView('lesson');
    setPhase('listen');
    setPakadTriggered(false);
    lessonStartRef.current = new Date();
  }, []);

  const exitLesson = useCallback(() => {
    audio.stopTanpura();
    audio.stopVoicePipeline();
    audio.stopPlayback();
    setView('home');
    setPhase('listen');
  }, [audio]);

  // ---------------------------------------------------------------------------
  // Priority 8: Mic permission gate — runs before voice phases
  // ---------------------------------------------------------------------------

  /** Attempt to start the voice pipeline with error handling. */
  const safeStartVoicePipeline = useCallback(
    async (
      onPitch: (result: PitchResult) => void,
      onPakad?: () => void,
    ) => {
      if (skipMic) return;

      try {
        await audio.startVoicePipeline(
          onPitch,
          onPakad ? () => onPakad() : undefined,
        );
      } catch {
        // Mic error — show denied UI
        setMicPermission('denied');
        setMicGateActive(true);
      }
    },
    [audio, skipMic],
  );

  /** Attempt to start Sa detection with error handling. */
  const safeStartSaDetection = useCallback(
    async (onCandidate: (hz: number, clarity: number) => void) => {
      try {
        await audio.startSaDetection(onCandidate);
      } catch {
        setMicPermission('denied');
        setMicGateActive(true);
      }
    },
    [audio],
  );

  /** Handle mic permission check before entering voice phases. */
  const checkMicPermission = useCallback(async (): Promise<boolean> => {
    if (skipMic) return false;

    const perm = await queryMicPermission();
    setMicPermission(perm);

    if (perm === 'granted') {
      return true;
    }

    if (perm === 'denied') {
      setMicGateActive(true);
      return false;
    }

    // perm === 'prompt' — show the prompt UI
    setMicGateActive(true);
    return false;
  }, [skipMic]);

  /** Handle granting mic access from the permission UI. */
  const handleGrantMic = useCallback(async () => {
    const granted = await requestMicAccess();
    if (granted) {
      setMicPermission('granted');
      setMicGateActive(false);
    } else {
      setMicPermission('denied');
    }
  }, []);

  /** Handle "Continue without mic" — skips all voice phases. */
  const handleSkipMic = useCallback(() => {
    setSkipMic(true);
    setMicGateActive(false);
  }, []);

  /** Handle "Try again" from denied state. */
  const handleRetryMic = useCallback(async () => {
    const perm = await queryMicPermission();
    setMicPermission(perm);
    if (perm === 'granted') {
      setMicGateActive(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Audio lifecycle — start/stop based on phase transitions
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    // Stop voice pipeline when leaving voice-active phases
    const voicePhases: LessonPhase[] = ['sa_calibration', 'sing_sa', 'sing_aroha', 'pakad_watch'];
    if (voicePhases.includes(prev) && !voicePhases.includes(phase)) {
      audio.stopVoicePipeline();
      audio.stopSaDetection();
      // Reset voice feedback to idle when leaving voice phases
      setVoiceFeedback(IDLE_VOICE_FEEDBACK);
    }

    // Phase-specific audio actions
    switch (phase) {
      case 'listen':
        // Start tanpura — it stays active for all subsequent phases
        if (view === 'lesson') {
          audio.startTanpura();
        }
        break;

      case 'sa_calibration':
        safeStartSaDetection((hz: number) => {
          setSaHz(hz);
          // Persist detected Sa to Supabase if signed in
          if (authUser) {
            updateSa(authUser.id, hz);
          }
          advancePhase();
        });
        break;

      case 'sing_sa':
      case 'sing_aroha': {
        // Priority 8: Check mic permission before first voice phase
        const startVoice = async () => {
          if (phase === 'sing_sa' && !skipMic) {
            const ok = await checkMicPermission();
            if (!ok && !skipMic) return; // mic gate active, wait for user action
          }

          // Priority 3: Wire PitchResult to VoiceFeedback
          await safeStartVoicePipeline((result: PitchResult) => {
            const target = phase === 'sing_sa' ? 'Sa' : 'Sa';
            setVoiceFeedback(pitchResultToFeedback(result, target));
          });
        };
        startVoice();
        break;
      }

      case 'pakad_watch': {
        // Priority 3: Wire PitchResult to VoiceFeedback + pakad detection
        const startPakadVoice = async () => {
          await safeStartVoicePipeline(
            (result: PitchResult) => {
              setVoiceFeedback(pitchResultToFeedback(result, result.nearestSwara));
            },
            () => {
              setPakadTriggered(true);
            },
          );
        };
        startPakadVoice();
        break;
      }

      case 'complete': {
        audio.stopVoicePipeline();
        audio.stopTanpura();
        setVoiceFeedback(IDLE_VOICE_FEEDBACK);
        // Priority 4: Mark riyaz as complete (localStorage for guests)
        markRiyazComplete();
        setRiyazDone(true);
        // Persist to Supabase if signed in
        if (authUser) {
          const now = new Date();
          const startedAt = lessonStartRef.current ?? now;
          const durationS = Math.round(
            (now.getTime() - startedAt.getTime()) / 1000,
          );
          saveSession(authUser.id, {
            ragaId: todayRaga.id ?? 'bhoopali',
            duration: durationS,
            xpEarned: 30,
            accuracy: 0,
            pakadsFound: pakadTriggered ? 1 : 0,
            startedAt,
            endedAt: now,
          });
          addXp(authUser.id, 30);
          completeRiyaz(authUser.id);
          // Refresh profile to show updated streak/XP
          refreshProfile();
        }
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, view, audio, advancePhase, safeStartVoicePipeline, safeStartSaDetection, checkMicPermission, skipMic, authUser]);

  // Priority 8: When mic permission is granted after gate, restart the voice phase
  useEffect(() => {
    if (micPermission !== 'granted' || micGateActive) return;
    const voicePhases: LessonPhase[] = ['sing_sa', 'sing_aroha', 'pakad_watch'];
    if (!voicePhases.includes(phase)) return;

    // Re-trigger the voice pipeline for the current phase
    const restartVoice = async () => {
      if (phase === 'pakad_watch') {
        await safeStartVoicePipeline(
          (result: PitchResult) => {
            setVoiceFeedback(pitchResultToFeedback(result, result.nearestSwara));
          },
          () => {
            setPakadTriggered(true);
          },
        );
      } else {
        await safeStartVoicePipeline((result: PitchResult) => {
          const target = phase === 'sing_sa' ? 'Sa' : 'Sa';
          setVoiceFeedback(pitchResultToFeedback(result, target));
        });
      }
    };
    restartVoice();
    // Only re-run when micPermission changes to granted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audio.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Pakad ceremony handler
  // ---------------------------------------------------------------------------

  const handlePakadDismiss = useCallback(() => {
    // Continue practice after the ceremony
  }, []);

  // Simulate pakad detection during pakad_watch phase (for demo purposes)
  // In production, the voice pipeline would trigger this
  const simulatePakad = useCallback(() => {
    setPakadTriggered(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Render: Lesson view
  // ---------------------------------------------------------------------------

  if (view === 'lesson') {
    const copy = PHASE_COPY[phase];

    return (
      <div className={lessonStyles.lessonPage} role="main" aria-label="Lesson: Your First Raga - Bhoopali">
        {/* Exit lesson */}
        <button
          type="button"
          className={lessonStyles.backLink}
          onClick={exitLesson}
          aria-label="Exit lesson"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Exit
        </button>

        {/* Phase header */}
        <header className={lessonStyles.phaseHeader} aria-live="polite">
          <h1 className={lessonStyles.phaseTitle}>{copy.screenTitle}</h1>
          <p className={lessonStyles.phaseBody}>{copy.body}</p>
        </header>

        {/* Phase content */}
        <div className={lessonStyles.phaseContent}>
          <AnimatePresence mode="wait">
            {/* LISTEN phase */}
            {phase === 'listen' && (
              <motion.div
                key="listen"
                {...phaseTransition}
                className={lessonStyles.centeredMessage}
              >
                <div className={lessonStyles.listenPulse} aria-label="Tanpura playing" />
                <button
                  type="button"
                  className={lessonStyles.actionButton}
                  onClick={advancePhase}
                  style={{ marginTop: 'var(--space-8)' }}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* SA CALIBRATION phase */}
            {phase === 'sa_calibration' && (
              <motion.div
                key="sa_calibration"
                {...phaseTransition}
                className={lessonStyles.centeredMessage}
              >
                <p>Sing or hum a comfortable note.</p>
                <button
                  type="button"
                  className={lessonStyles.actionButton}
                  onClick={advancePhase}
                  style={{ marginTop: 'var(--space-8)' }}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* MEET BHOOPALI phase — swara introduction */}
            {phase === 'meet_bhoopali' && (
              <motion.div key="meet_bhoopali" {...phaseTransition}>
                <SwaraIntroduction
                  swaras={BHOOPALI_SWARAS}
                  onComplete={advancePhase}
                  audioFirst={true}
                  revealDelayMs={1200}
                  onPlaySwara={(s) => { audio.playSwara(s); }}
                />
              </motion.div>
            )}

            {/* AROHA LISTEN — phrase playback, no labels */}
            {phase === 'aroha_listen' && (
              <motion.div key="aroha_listen" {...phaseTransition}>
                <PhrasePlayback
                  phrase={AROHA_PHRASE}
                  showLabels={false}
                  onComplete={advancePhase}
                  repeatCount={2}
                  onPlaySwara={(s) => { audio.playSwara(s); }}
                />
              </motion.div>
            )}

            {/* AROHA SHOW — phrase playback, with labels */}
            {phase === 'aroha_show' && (
              <motion.div key="aroha_show" {...phaseTransition}>
                <PhrasePlayback
                  phrase={AROHA_PHRASE}
                  showLabels={true}
                  onComplete={advancePhase}
                  repeatCount={1}
                  onPlaySwara={(s) => { audio.playSwara(s); }}
                />
              </motion.div>
            )}

            {/* AVAROHA LISTEN — descending phrase, no labels */}
            {phase === 'avaroha_listen' && (
              <motion.div key="avaroha_listen" {...phaseTransition}>
                <PhrasePlayback
                  phrase={AVAROHA_PHRASE}
                  showLabels={false}
                  onComplete={advancePhase}
                  repeatCount={2}
                  onPlaySwara={(s) => { audio.playSwara(s); }}
                />
              </motion.div>
            )}

            {/* AVAROHA SHOW — descending phrase, with labels */}
            {phase === 'avaroha_show' && (
              <motion.div key="avaroha_show" {...phaseTransition}>
                <PhrasePlayback
                  phrase={AVAROHA_PHRASE}
                  showLabels={true}
                  onComplete={advancePhase}
                  repeatCount={1}
                  onPlaySwara={(s) => { audio.playSwara(s); }}
                />
              </motion.div>
            )}

            {/* SING SA — first voice exercise */}
            {phase === 'sing_sa' && (
              <motion.div
                key="sing_sa"
                {...phaseTransition}
                className={lessonStyles.centeredMessage}
              >
                {/* Priority 8: Mic permission gate */}
                {micGateActive && !skipMic ? (
                  <div className={lessonStyles.micGate} role="alert">
                    {micPermission === 'denied' ? (
                      <>
                        <p className={lessonStyles.micGateText}>
                          Microphone access is needed to hear your singing.
                          Please allow microphone access in your browser settings.
                        </p>
                        <div className={lessonStyles.micGateActions}>
                          <button
                            type="button"
                            className={lessonStyles.actionButton}
                            onClick={handleRetryMic}
                          >
                            Try again
                          </button>
                          <button
                            type="button"
                            className={lessonStyles.actionButtonSecondary}
                            onClick={handleSkipMic}
                          >
                            Continue without mic
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className={lessonStyles.micGateText}>
                          Sadhana needs to hear you sing.
                        </p>
                        <div className={lessonStyles.micGateActions}>
                          <button
                            type="button"
                            className={lessonStyles.actionButton}
                            onClick={handleGrantMic}
                          >
                            Grant access
                          </button>
                          <button
                            type="button"
                            className={lessonStyles.actionButtonSecondary}
                            onClick={handleSkipMic}
                          >
                            Continue without mic
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <p>Whenever you are ready.</p>
                    {/* Priority 3: Voice visualization */}
                    <VoiceVisualization
                      feedback={isVoicePhase ? voiceFeedback : IDLE_VOICE_FEEDBACK}
                      className={lessonStyles.voiceViz}
                    />
                    <button
                      type="button"
                      className={lessonStyles.actionButton}
                      onClick={advancePhase}
                      style={{ marginTop: 'var(--space-4)' }}
                    >
                      Continue
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* SING AROHA — guided singing */}
            {phase === 'sing_aroha' && (
              <motion.div
                key="sing_aroha"
                {...phaseTransition}
                className={lessonStyles.centeredMessage}
              >
                <p>Follow the guide tone.</p>
                {/* Priority 3: Voice visualization */}
                <VoiceVisualization
                  feedback={isVoicePhase ? voiceFeedback : IDLE_VOICE_FEEDBACK}
                  className={lessonStyles.voiceViz}
                />
                <button
                  type="button"
                  className={lessonStyles.actionButton}
                  onClick={advancePhase}
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* PAKAD WATCH — free singing, passive recognition */}
            {phase === 'pakad_watch' && (
              <motion.div
                key="pakad_watch"
                {...phaseTransition}
                className={lessonStyles.centeredMessage}
              >
                {/* Priority 3: Voice visualization */}
                <VoiceVisualization
                  feedback={isVoicePhase ? voiceFeedback : IDLE_VOICE_FEEDBACK}
                  className={lessonStyles.voiceViz}
                />
                {!pakadTriggered && (
                  <button
                    type="button"
                    className={lessonStyles.actionButton}
                    onClick={simulatePakad}
                    style={{ marginBottom: 'var(--space-4)' }}
                    aria-label="Simulate pakad recognition (demo)"
                  >
                    Simulate Pakad
                  </button>
                )}
                <button
                  type="button"
                  className={lessonStyles.actionButton}
                  onClick={advancePhase}
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  Complete Session
                </button>
              </motion.div>
            )}

            {/* COMPLETE — session summary */}
            {phase === 'complete' && (
              <motion.div
                key="complete"
                {...phaseTransition}
                className={lessonStyles.completeScreen}
              >
                <h2 className={lessonStyles.completeTitle}>
                  {copy.screenTitle}
                </h2>
                <p className={lessonStyles.completeMessage}>
                  {copy.body}
                </p>
                <div className={lessonStyles.completeStats}>
                  <div className={lessonStyles.stat}>
                    <span className={`${lessonStyles.statValue} ${lessonStyles.statValueAccent}`}>
                      +30 XP
                    </span>
                    <span className={lessonStyles.statLabel}>Earned</span>
                  </div>
                  <div className={lessonStyles.stat}>
                    <span className={lessonStyles.statValue}>
                      Day {user.streak > 0 ? user.streak : 1}
                    </span>
                    <span className={lessonStyles.statLabel}>Streak</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={lessonStyles.actionButton}
                  onClick={exitLesson}
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  Return
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pakad ceremony overlay */}
        {pakadTriggered && phase === 'pakad_watch' && (
          <PakadMoment
            ragaName="Bhoopali"
            sargam="Ga Pa Dha Pa Ga"
            onDismiss={handlePakadDismiss}
          />
        )}

        {/* Progress dots */}
        {phase !== 'complete' && (
          <nav
            className={lessonStyles.progressDots}
            aria-label="Lesson progress"
          >
            {LESSON_PHASES.map((p, i) => {
              let dotClass = lessonStyles.progressDot;
              if (i === currentPhaseIndex) {
                dotClass += ' ' + lessonStyles.progressDotCurrent;
              } else if (i < currentPhaseIndex) {
                dotClass += ' ' + lessonStyles.progressDotComplete;
              }
              return (
                <div
                  key={p}
                  className={dotClass}
                  aria-label={`Phase ${String(i + 1)} of ${String(LESSON_PHASES.length)}${i === currentPhaseIndex ? ' (current)' : ''}`}
                />
              );
            })}
          </nav>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Home view
  // ---------------------------------------------------------------------------

  return (
    <motion.div
      className={homeStyles.page}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Back navigation */}
      <motion.div variants={fadeUp}>
        <Link href="/" className={homeStyles.backLink} aria-label="Back to journeys">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Journeys
        </Link>
      </motion.div>

      {/* Page title */}
      <motion.h1 className={homeStyles.title} variants={fadeUp}>
        Daily Riyaz
      </motion.h1>

      {/* Today's riyaz card */}
      <motion.section className={homeStyles.riyazCard} variants={fadeUp} aria-label="Today's practice">
        <span className={homeStyles.riyazLabel}>
          {riyazDone ? 'Riyaz complete' : `Today\u2019s riyaz`}
        </span>
        <h2 className={homeStyles.riyazRaga}>{todayRaga.name}</h2>
        <p className={homeStyles.riyazDescription}>
          {timeLabel} raga &middot; Prahara {todayRaga.prahara.join(', ')}
        </p>
        {riyazDone ? (
          <span className={homeStyles.riyazDone}>
            Today&rsquo;s riyaz complete &mdash; well done
          </span>
        ) : (
          <button
            className={homeStyles.beginButton}
            type="button"
            onClick={startLesson}
            aria-label={`Begin practice with raga ${todayRaga.name}`}
          >
            Begin
          </button>
        )}
      </motion.section>

      {/* Progress */}
      <motion.section
        className={homeStyles.progressSection}
        variants={fadeUp}
        aria-label="Your progress"
      >
        <h3 className={homeStyles.sectionTitle}>Progress</h3>
        <div className={homeStyles.progressRow}>
          <div className={homeStyles.levelBadge}>
            <span
              className={homeStyles.levelTitle}
              style={{ color: levelColor }}
            >
              {levelTitle}
            </span>
            <span className={homeStyles.levelNumber}>Lv {user.level}</span>
          </div>

          <div className={homeStyles.xpBar} role="progressbar" aria-valuenow={user.xp} aria-valuemin={0} aria-valuemax={100} aria-label="Experience points">
            <div
              className={homeStyles.xpFill}
              style={{ width: `${xpProgress * 100}%` }}
            />
          </div>
          <span className={homeStyles.xpLabel}>{user.xp} XP</span>

          <div className={homeStyles.streakBadge}>
            <span
              className={`${homeStyles.streakValue} ${(profile?.streak ?? user.streak) > 0 ? homeStyles.streakValueActive : ''}`}
            >
              {profile?.streak ?? user.streak}
            </span>
            <span className={homeStyles.streakText}>day streak</span>
          </div>
        </div>
      </motion.section>

      {/* Recently practiced */}
      <motion.section
        className={homeStyles.recentSection}
        variants={fadeUp}
        aria-label="Recently practiced ragas"
      >
        <h3 className={homeStyles.sectionTitle}>Recently practiced</h3>
        {recentRagas.length === 0 ? (
          <p className={homeStyles.emptyRecent}>
            No practice sessions yet. Begin your first riyaz above.
          </p>
        ) : (
          recentRagas.map((recent) => (
            <div key={recent.ragaId} className={homeStyles.recentCard}>
              <span className={homeStyles.recentRagaName}>{recent.ragaName}</span>
              <span className={homeStyles.recentAccuracy}>
                {Math.round(recent.bestAccuracy * 100)}%
              </span>
            </div>
          ))
        )}
      </motion.section>

      {/* First-time user callout */}
      {isFirstTime && (
        <motion.aside className={homeStyles.callout} variants={fadeUp} aria-label="About Sadhana">
          <h3 className={homeStyles.calloutTitle}>What is Sadhana?</h3>
          <p className={homeStyles.calloutText}>
            Sadhana means disciplined practice toward mastery. This is not a
            music theory course. You will sing. The tanpura will drone. The app
            will listen to your pitch in real time and guide you — not with
            words, but with sound. Five to fifteen minutes a day. One raga at a
            time. The tradition teaches through practice, not explanation.
          </p>
        </motion.aside>
      )}
    </motion.div>
  );
}
