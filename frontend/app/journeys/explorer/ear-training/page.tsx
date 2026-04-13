/**
 * Explorer — Ear Training page
 *
 * Simple 10-round swara identification exercise.
 * The engine plays a random swara from the current time-of-day raga.
 * Student sees 4 swara name options (multiple choice).
 * Correct: saffron flash, +5 XP message.
 * Wrong: shows the correct answer, replays the swara.
 *
 * Progress bar at the top tracks rounds 1-10.
 * Session complete screen at the end with score summary.
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getRagaForTimeOfDay, getRagaSwaras } from '@/engine/theory';
import type { Raga, Swara } from '@/engine/theory/types';
import { useLessonAudio } from '../../../lib/lesson-audio';
import { useTimbreSelection } from '../../../components/VoiceTimbreSelector';
import styles from '../../../styles/ear-training.module.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_ROUNDS = 10;
const XP_PER_CORRECT = 5;
const OPTION_COUNT = 4;
const FEEDBACK_DELAY_MS = 1500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get a human-readable swara label. */
function swaraLabel(swara: Swara): string {
  return swara.replace('_k', ' (k)').replace('_t', ' (t)');
}

/** Shuffle an array (Fisher-Yates). */
function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

/** Pick n random items from an array, optionally excluding some. */
function pickRandom<T>(
  arr: readonly T[],
  n: number,
  exclude: Set<T> = new Set(),
): T[] {
  const filtered = arr.filter((item) => !exclude.has(item));
  const shuffled = shuffle(filtered);
  return shuffled.slice(0, n);
}

// All 12 swaras as fallback for distractors
const ALL_SWARAS: readonly Swara[] = [
  'Sa', 'Re_k', 'Re', 'Ga_k', 'Ga', 'Ma', 'Ma_t', 'Pa', 'Dha_k', 'Dha', 'Ni_k', 'Ni',
] as const;

// ---------------------------------------------------------------------------
// Round generation
// ---------------------------------------------------------------------------

interface Round {
  /** The correct swara to identify. */
  readonly correctSwara: Swara;
  /** The four options presented to the student. */
  readonly options: readonly Swara[];
}

/** Generate a round: pick a random raga swara as the answer, 3 distractors. */
function generateRound(ragaSwaras: readonly Swara[]): Round {
  if (ragaSwaras.length === 0) {
    // Fallback — should never happen with a valid raga
    return { correctSwara: 'Sa', options: ['Sa', 'Re', 'Ga', 'Pa'] };
  }

  // Pick the correct answer
  const correctIndex = Math.floor(Math.random() * ragaSwaras.length);
  const correctSwara = ragaSwaras[correctIndex]!;

  // Pick distractors: prefer raga swaras, fall back to all swaras
  const excludeSet = new Set<Swara>([correctSwara]);
  let distractors = pickRandom(ragaSwaras, OPTION_COUNT - 1, excludeSet);

  // If not enough raga swaras for distractors, pull from all swaras
  if (distractors.length < OPTION_COUNT - 1) {
    const stillNeeded = OPTION_COUNT - 1 - distractors.length;
    const moreExclude = new Set<Swara>([correctSwara, ...distractors]);
    const extra = pickRandom(ALL_SWARAS, stillNeeded, moreExclude);
    distractors = [...distractors, ...extra];
  }

  // Combine and shuffle
  const options = shuffle([correctSwara, ...distractors]);

  return { correctSwara, options };
}

/** Pre-generate all rounds for a session. */
function generateSession(raga: Raga): Round[] {
  const ragaSwaras = getRagaSwaras(raga);
  const rounds: Round[] = [];
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    rounds.push(generateRound(ragaSwaras));
  }
  return rounds;
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

type AnswerState = 'waiting' | 'correct' | 'wrong';

export default function EarTrainingPage() {
  const hour = new Date().getHours();
  const raga = useMemo(() => getRagaForTimeOfDay(hour), [hour]);

  // Session state
  const [rounds, setRounds] = useState<Round[]>(() => generateSession(raga));
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('waiting');
  const [selectedOption, setSelectedOption] = useState<Swara | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Audio — uses timbre from user preference (harmonium / voice-male / voice-female)
  const [timbre] = useTimbreSelection();
  const audio = useLessonAudio(261.63, raga.id, timbre);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (playingTimerRef.current) clearTimeout(playingTimerRef.current);
      audio.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Current round data
  const round = rounds[currentRound];

  // -------------------------------------------------------------------------
  // Play the current swara
  // -------------------------------------------------------------------------

  const playCurrentSwara = useCallback(() => {
    if (!round || isPlaying) return;
    setIsPlaying(true);
    audio.playSwara(round.correctSwara, 800).then(() => {
      playingTimerRef.current = setTimeout(() => {
        setIsPlaying(false);
        playingTimerRef.current = null;
      }, 200);
    });
  }, [audio, round, isPlaying]);

  // Auto-play the swara when a new round begins
  useEffect(() => {
    if (!sessionComplete && round) {
      // Small delay for the round transition
      const timer = setTimeout(() => {
        playCurrentSwara();
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, sessionComplete]);

  // -------------------------------------------------------------------------
  // Handle answer selection
  // -------------------------------------------------------------------------

  const handleAnswer = useCallback(
    (selected: Swara) => {
      if (answerState !== 'waiting' || !round) return;

      setSelectedOption(selected);

      if (selected === round.correctSwara) {
        setAnswerState('correct');
        setScore((prev) => prev + 1);

        // Advance after feedback delay
        feedbackTimerRef.current = setTimeout(() => {
          const nextRound = currentRound + 1;
          if (nextRound >= TOTAL_ROUNDS) {
            setSessionComplete(true);
          } else {
            setCurrentRound(nextRound);
            setAnswerState('waiting');
            setSelectedOption(null);
          }
          feedbackTimerRef.current = null;
        }, FEEDBACK_DELAY_MS);
      } else {
        setAnswerState('wrong');

        // Replay correct swara after a brief pause, then advance
        feedbackTimerRef.current = setTimeout(() => {
          audio.playSwara(round.correctSwara, 800);

          feedbackTimerRef.current = setTimeout(() => {
            const nextRound = currentRound + 1;
            if (nextRound >= TOTAL_ROUNDS) {
              setSessionComplete(true);
            } else {
              setCurrentRound(nextRound);
              setAnswerState('waiting');
              setSelectedOption(null);
            }
            feedbackTimerRef.current = null;
          }, FEEDBACK_DELAY_MS);
        }, 800);
      }
    },
    [answerState, round, currentRound, audio],
  );

  // -------------------------------------------------------------------------
  // Keyboard support for options
  // -------------------------------------------------------------------------

  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent, swara: Swara) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAnswer(swara);
      }
    },
    [handleAnswer],
  );

  // -------------------------------------------------------------------------
  // Restart session
  // -------------------------------------------------------------------------

  const restartSession = useCallback(() => {
    setRounds(generateSession(raga));
    setCurrentRound(0);
    setScore(0);
    setAnswerState('waiting');
    setSelectedOption(null);
    setSessionComplete(false);
  }, [raga]);

  // -------------------------------------------------------------------------
  // Render: Session complete
  // -------------------------------------------------------------------------

  if (sessionComplete) {
    const totalXp = score * XP_PER_CORRECT;
    const accuracy = Math.round((score / TOTAL_ROUNDS) * 100);

    return (
      <div className={styles.page} role="main" aria-label="Ear training results">
        <Link
          href="/journeys/explorer"
          className={styles.backLink}
          aria-label="Back to Explorer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Explorer
        </Link>

        <motion.div
          className={styles.completeScreen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className={styles.completeTitle}>Session Complete</h1>

          <div className={styles.completeStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {String(score)}/{String(TOTAL_ROUNDS)}
              </span>
              <span className={styles.statLabel}>Correct</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{String(accuracy)}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statValueAccent}`}>
                +{String(totalXp)} XP
              </span>
              <span className={styles.statLabel}>Earned</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <button
              type="button"
              className={styles.returnLink}
              onClick={restartSession}
            >
              Try Again
            </button>
            <Link href="/journeys/explorer" className={styles.returnLink}>
              Return
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Active round
  // -------------------------------------------------------------------------

  if (!round) return null;

  const progress = currentRound / TOTAL_ROUNDS;

  return (
    <div className={styles.page} role="main" aria-label="Ear training exercise">
      {/* Back navigation */}
      <Link
        href="/journeys/explorer"
        className={styles.backLink}
        aria-label="Back to Explorer"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Explorer
      </Link>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Ear Training</h1>
        <p className={styles.ragaLabel}>{raga.name}</p>
      </header>

      {/* Progress bar */}
      <div className={styles.progressBarContainer}>
        <div
          className={styles.progressBarTrack}
          role="progressbar"
          aria-valuenow={currentRound}
          aria-valuemin={0}
          aria-valuemax={TOTAL_ROUNDS}
          aria-label="Round progress"
        >
          <div
            className={styles.progressBarFill}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className={styles.progressLabel}>
          Round {String(currentRound + 1)} of {String(TOTAL_ROUNDS)}
        </p>
      </div>

      {/* Question area */}
      <div className={styles.questionArea}>
        <p className={styles.prompt}>Which swara is this?</p>

        {/* Listen button */}
        <button
          type="button"
          className={`${styles.listenButton} ${isPlaying ? styles.listenButtonPlaying : ''}`}
          onClick={playCurrentSwara}
          aria-label={isPlaying ? 'Playing swara' : 'Listen again'}
          disabled={isPlaying}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            {isPlaying ? (
              <>
                <rect x="7" y="5" width="5" height="18" rx="1.5" fill="currentColor" />
                <rect x="16" y="5" width="5" height="18" rx="1.5" fill="currentColor" />
              </>
            ) : (
              <path d="M8 4L22 14L8 24V4Z" fill="currentColor" />
            )}
          </svg>
        </button>

        {/* Options grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`round-${String(currentRound)}`}
            className={styles.optionsGrid}
            {...fadeUp}
            role="group"
            aria-label="Swara options"
          >
            {round.options.map((swara) => {
              let optionClass = styles.optionButton;

              if (answerState !== 'waiting' && selectedOption !== null) {
                if (swara === round.correctSwara) {
                  // Always highlight the correct answer
                  optionClass += ' ' + (swara === selectedOption ? styles.optionCorrect : styles.optionRevealCorrect);
                } else if (swara === selectedOption) {
                  optionClass += ' ' + styles.optionWrong;
                }
              }

              return (
                <button
                  key={swara}
                  type="button"
                  className={optionClass}
                  onClick={() => handleAnswer(swara)}
                  onKeyDown={(e) => handleOptionKeyDown(e, swara)}
                  disabled={answerState !== 'waiting'}
                  aria-label={`Select ${swaraLabel(swara)}`}
                >
                  {swaraLabel(swara)}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Feedback */}
        <div className={styles.feedback} aria-live="polite">
          {answerState === 'correct' && (
            <>
              <span className={styles.feedbackCorrect}>Correct</span>
              <span className={styles.feedbackXp}>+{String(XP_PER_CORRECT)} XP</span>
            </>
          )}
          {answerState === 'wrong' && round && (
            <span className={styles.feedbackWrong}>
              It was {swaraLabel(round.correctSwara)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
