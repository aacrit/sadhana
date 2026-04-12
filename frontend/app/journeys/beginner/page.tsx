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
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getRagaForTimeOfDay } from '@/engine/theory';
import { DEFAULT_USER, getLevelTitle, getLevelColor } from '../../lib/types';
import type { RecentRaga } from '../../lib/types';
import SwaraIntroduction from '../../components/SwaraIntroduction';
import PhrasePlayback from '../../components/PhrasePlayback';
import PakadMoment from '../../components/PakadMoment';
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
// Page component
// ---------------------------------------------------------------------------

export default function BeginnerPage() {
  const [view, setView] = useState<'home' | 'lesson'>('home');
  const [phase, setPhase] = useState<LessonPhase>('listen');
  const [pakadTriggered, setPakadTriggered] = useState(false);
  const [saHz, setSaHz] = useState(261.63);

  // Audio hook — provides tanpura, swara playback, voice pipeline
  const audio = useLessonAudio(saHz, 'bhoopali');

  // Track previous phase for cleanup
  const prevPhaseRef = useRef<LessonPhase>(phase);

  // Home view state
  const hour = new Date().getHours();
  const todayRaga = useMemo(() => getRagaForTimeOfDay(hour), [hour]);
  const timeLabel = getTimeOfDayLabel(hour);
  const user = DEFAULT_USER;
  const levelTitle = getLevelTitle(user.level);
  const levelColor = getLevelColor(user.level);
  const xpProgress = Math.min((user.xp % 100) / 100, 1);
  const recentRagas: RecentRaga[] = [];
  const isFirstTime = user.lastPractice === null;

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
  }, []);

  const exitLesson = useCallback(() => {
    audio.stopTanpura();
    audio.stopVoicePipeline();
    audio.stopPlayback();
    setView('home');
    setPhase('listen');
  }, [audio]);

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
        audio.startSaDetection((hz: number) => {
          setSaHz(hz);
          advancePhase();
        });
        break;

      case 'sing_sa':
      case 'sing_aroha':
        audio.startVoicePipeline(() => {
          // onPitch — pitch result available for visualization
        });
        break;

      case 'pakad_watch':
        audio.startVoicePipeline(
          () => {
            // onPitch
          },
          () => {
            // onPakad — pakad detected
            setPakadTriggered(true);
          },
        );
        break;

      case 'complete':
        audio.stopVoicePipeline();
        audio.stopTanpura();
        break;
    }
  }, [phase, view, audio, advancePhase]);

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
                <p>Whenever you are ready.</p>
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

            {/* SING AROHA — guided singing */}
            {phase === 'sing_aroha' && (
              <motion.div
                key="sing_aroha"
                {...phaseTransition}
                className={lessonStyles.centeredMessage}
              >
                <p>Follow the guide tone.</p>
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

            {/* PAKAD WATCH — free singing, passive recognition */}
            {phase === 'pakad_watch' && (
              <motion.div
                key="pakad_watch"
                {...phaseTransition}
                className={lessonStyles.centeredMessage}
              >
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
                    <span className={lessonStyles.statValue}>Day 1</span>
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
        <span className={homeStyles.riyazLabel}>{timeLabel} raga</span>
        <h2 className={homeStyles.riyazRaga}>{todayRaga.name}</h2>
        <p className={homeStyles.riyazDescription}>
          {todayRaga.description}
        </p>
        <span className={homeStyles.riyazTime}>
          Prahara {todayRaga.prahara.join(', ')}
        </span>
        {user.riyazDone ? (
          <span className={homeStyles.riyazDone}>
            Today&rsquo;s riyaz complete
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
              className={`${homeStyles.streakValue} ${user.streak > 0 ? homeStyles.streakValueActive : ''}`}
            >
              {user.streak}
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
