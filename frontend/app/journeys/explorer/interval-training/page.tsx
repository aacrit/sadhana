/**
 * Explorer -- Interval Training (Binaural Ear Training)
 *
 * Plays two swaras -- first as reference, then the target -- and asks
 * the student to identify the interval (the second swara).
 *
 * Uses stereo panning: reference swara (Sa) plays center, target swara
 * plays center after a beat gap. In "binaural" rounds (advanced), both
 * swaras play simultaneously -- Sa in the left ear, target in the right
 * -- training the student to separate and identify pitches heard together.
 *
 * 10 rounds per session. Raga-aware: intervals drawn from the current
 * time-of-day raga's swara set.
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getRagaForTimeOfDay, getRagaSwaras } from '@/engine/theory';
import type { Raga, Swara } from '@/engine/theory/types';
import { getSwaraFrequency } from '@/engine/theory/swaras';
import { SWARA_MAP } from '@/engine/theory/swaras';
import styles from '../../../styles/ear-training.module.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_ROUNDS = 10;
const XP_PER_CORRECT = 8;
const OPTION_COUNT = 4;
const FEEDBACK_DELAY_MS = 1500;
const DEFAULT_SA_HZ = 261.63;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlayMode = 'sequential' | 'binaural';

interface Round {
  /** The reference swara (always Sa for now). */
  readonly reference: Swara;
  /** The target swara the student must identify. */
  readonly target: Swara;
  /** 4 options including the correct answer. */
  readonly options: readonly Swara[];
  /** How the two swaras are presented. */
  readonly mode: PlayMode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function swaraLabel(swara: Swara): string {
  const def = SWARA_MAP[swara];
  return def ? def.sargamAbbr : swara.replace('_k', ' (k)').replace('_t', ' (t)');
}

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

function pickRandom<T>(
  arr: readonly T[],
  n: number,
  exclude: Set<T> = new Set(),
): T[] {
  const filtered = arr.filter((item) => !exclude.has(item));
  return shuffle(filtered).slice(0, n);
}

const ALL_SWARAS: readonly Swara[] = [
  'Sa', 'Re_k', 'Re', 'Ga_k', 'Ga', 'Ma', 'Ma_t', 'Pa', 'Dha_k', 'Dha', 'Ni_k', 'Ni',
];

// ---------------------------------------------------------------------------
// Round generation
// ---------------------------------------------------------------------------

function generateRound(ragaSwaras: readonly Swara[], roundIndex: number): Round {
  // Exclude Sa from target options (it's the reference)
  const targets = ragaSwaras.filter((s) => s !== 'Sa');
  if (targets.length === 0) {
    return { reference: 'Sa', target: 'Pa', options: ['Re', 'Ga', 'Pa', 'Dha'], mode: 'sequential' };
  }

  const target = targets[Math.floor(Math.random() * targets.length)]!;
  const excludeSet = new Set<Swara>([target, 'Sa']);
  let distractors = pickRandom(targets, OPTION_COUNT - 1, excludeSet);

  if (distractors.length < OPTION_COUNT - 1) {
    const moreExclude = new Set<Swara>([target, 'Sa', ...distractors]);
    const extra = pickRandom(ALL_SWARAS.filter((s) => s !== 'Sa'), OPTION_COUNT - 1 - distractors.length, moreExclude);
    distractors = [...distractors, ...extra];
  }

  const options = shuffle([target, ...distractors]);

  // Binaural mode for rounds 6-10 (after student has warmed up with sequential)
  const mode: PlayMode = roundIndex >= 5 ? 'binaural' : 'sequential';

  return { reference: 'Sa', target, options, mode };
}

function generateSession(raga: Raga): Round[] {
  const ragaSwaras = getRagaSwaras(raga);
  return Array.from({ length: TOTAL_ROUNDS }, (_, i) => generateRound(ragaSwaras, i));
}

// ---------------------------------------------------------------------------
// Web Audio stereo playback
// ---------------------------------------------------------------------------

let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new AudioContext();
  }
  return _ctx;
}

/**
 * Play a single swara tone with optional stereo panning.
 * Uses 3-partial additive synthesis for a warm, harmonium-like timbre.
 */
function playTone(
  hz: number,
  durationSec: number,
  pan: number = 0, // -1 = left, 0 = center, 1 = right
  volume: number = 0.35,
): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const partials = [1, 2, 3, 4];
  const weights = [1.0, 0.5, 0.25, 0.12];

  const panner = ctx.createStereoPanner();
  panner.pan.value = pan;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(volume, now + 0.06);
  masterGain.gain.setValueAtTime(volume, now + durationSec - 0.1);
  masterGain.gain.linearRampToValueAtTime(0, now + durationSec);

  masterGain.connect(panner);
  panner.connect(ctx.destination);

  const oscillators: OscillatorNode[] = [];

  for (let i = 0; i < partials.length; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz * partials[i]!;

    const gain = ctx.createGain();
    gain.gain.value = weights[i]! * 0.15;

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
    oscillators.push(osc);
  }

  return new Promise((resolve) => {
    const first = oscillators[0];
    if (first) {
      first.onended = () => {
        panner.disconnect();
        masterGain.disconnect();
        resolve();
      };
    } else {
      resolve();
    }
  });
}

/**
 * Play an interval: reference then target (sequential),
 * or both simultaneously with stereo separation (binaural).
 */
async function playInterval(
  saHz: number,
  reference: Swara,
  target: Swara,
  mode: PlayMode,
): Promise<void> {
  const refHz = getSwaraFrequency(reference, saHz, 'madhya');
  const targetHz = getSwaraFrequency(target, saHz, 'madhya');

  if (mode === 'binaural') {
    // Play both simultaneously: reference left, target right
    await Promise.all([
      playTone(refHz, 1.2, -0.8),
      playTone(targetHz, 1.2, 0.8),
    ]);
  } else {
    // Sequential: reference first, then target
    await playTone(refHz, 0.7, 0);
    await new Promise((r) => setTimeout(r, 200));
    await playTone(targetHz, 0.9, 0);
  }
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
// Page
// ---------------------------------------------------------------------------

type AnswerState = 'waiting' | 'correct' | 'wrong';

export default function IntervalTrainingPage() {
  const hour = new Date().getHours();
  const raga = useMemo(() => getRagaForTimeOfDay(hour), [hour]);

  const [rounds, setRounds] = useState<Round[]>(() => generateSession(raga));
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('waiting');
  const [selectedOption, setSelectedOption] = useState<Swara | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const round = rounds[currentRound];

  // Play the current interval
  const playCurrentInterval = useCallback(() => {
    if (!round || isPlaying) return;
    setIsPlaying(true);
    playInterval(DEFAULT_SA_HZ, round.reference, round.target, round.mode).then(() => {
      setIsPlaying(false);
    });
  }, [round, isPlaying]);

  // Auto-play on new round
  useEffect(() => {
    if (!sessionComplete && round) {
      const timer = setTimeout(() => {
        playCurrentInterval();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, sessionComplete]);

  // Handle answer
  const handleAnswer = useCallback(
    (selected: Swara) => {
      if (answerState !== 'waiting' || !round) return;
      setSelectedOption(selected);

      if (selected === round.target) {
        setAnswerState('correct');
        setScore((prev) => prev + 1);

        feedbackTimerRef.current = setTimeout(() => {
          const next = currentRound + 1;
          if (next >= TOTAL_ROUNDS) {
            setSessionComplete(true);
          } else {
            setCurrentRound(next);
            setAnswerState('waiting');
            setSelectedOption(null);
          }
          feedbackTimerRef.current = null;
        }, FEEDBACK_DELAY_MS);
      } else {
        setAnswerState('wrong');

        // Replay the correct interval after a pause
        feedbackTimerRef.current = setTimeout(() => {
          playInterval(DEFAULT_SA_HZ, round.reference, round.target, 'sequential');

          feedbackTimerRef.current = setTimeout(() => {
            const next = currentRound + 1;
            if (next >= TOTAL_ROUNDS) {
              setSessionComplete(true);
            } else {
              setCurrentRound(next);
              setAnswerState('waiting');
              setSelectedOption(null);
            }
            feedbackTimerRef.current = null;
          }, FEEDBACK_DELAY_MS);
        }, 800);
      }
    },
    [answerState, round, currentRound],
  );

  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent, swara: Swara) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAnswer(swara);
      }
    },
    [handleAnswer],
  );

  const restartSession = useCallback(() => {
    setRounds(generateSession(raga));
    setCurrentRound(0);
    setScore(0);
    setAnswerState('waiting');
    setSelectedOption(null);
    setSessionComplete(false);
  }, [raga]);

  // -------------------------------------------------------------------------
  // Session complete
  // -------------------------------------------------------------------------

  if (sessionComplete) {
    const totalXp = score * XP_PER_CORRECT;
    const accuracy = Math.round((score / TOTAL_ROUNDS) * 100);

    return (
      <div className={styles.page} role="region" aria-label="Interval training results">
        <Link
          href="/journeys/explorer"
          className={styles.backLink}
          aria-label="Back to Explorer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
              <span className={styles.statValue}>{String(score)}/{String(TOTAL_ROUNDS)}</span>
              <span className={styles.statLabel}>Correct</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{String(accuracy)}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statValueAccent}`}>+{String(totalXp)} XP</span>
              <span className={styles.statLabel}>Earned</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <button type="button" className={styles.returnLink} onClick={restartSession}>
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
  // Active round
  // -------------------------------------------------------------------------

  if (!round) return null;

  const progress = currentRound / TOTAL_ROUNDS;

  return (
    <div className={styles.page} role="region" aria-label="Interval training exercise">
      <Link
        href="/journeys/explorer"
        className={styles.backLink}
        aria-label="Back to Explorer"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Explorer
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Interval Training</h1>
        <p className={styles.ragaLabel}>
          {raga.name} {round.mode === 'binaural' ? '(binaural)' : '(sequential)'}
        </p>
      </header>

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

      <div className={styles.questionArea}>
        <p className={styles.prompt}>
          {round.mode === 'binaural'
            ? 'Sa is in your left ear. What swara is in your right?'
            : 'Sa plays first. Which swara follows?'}
        </p>

        <button
          type="button"
          className={`${styles.listenButton} ${isPlaying ? styles.listenButtonPlaying : ''}`}
          onClick={playCurrentInterval}
          aria-label={isPlaying ? 'Playing interval' : 'Listen again'}
          disabled={isPlaying}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
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

        <AnimatePresence mode="wait">
          <motion.div
            key={`round-${String(currentRound)}`}
            className={styles.optionsGrid}
            {...fadeUp}
            role="group"
            aria-label="Interval options"
          >
            {round.options.map((swara) => {
              let optionClass = styles.optionButton;

              if (answerState !== 'waiting' && selectedOption !== null) {
                if (swara === round.target) {
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

        <div className={styles.feedback} aria-live="polite">
          {answerState === 'correct' && (
            <>
              <span className={styles.feedbackCorrect}>Correct</span>
              <span className={styles.feedbackXp}>+{String(XP_PER_CORRECT)} XP</span>
            </>
          )}
          {answerState === 'wrong' && round && (
            <span className={styles.feedbackWrong}>
              It was {swaraLabel(round.target)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
