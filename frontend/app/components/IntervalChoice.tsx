'use client';

/**
 * IntervalChoice — listen-then-choose interval ear training.
 *
 * Used by `interval_exercise` phase (Cluster F). Picks one interval at random
 * from `interval_pool`, plays it `play_count` times, then presents the pool
 * as multiple choice. After `rounds` correct selections (or skip), advances.
 *
 * If `answer_mode` is anything other than `listen_then_choose` the phase falls
 * back to a single Listen + Continue (used for `mode: sing` variants which
 * are handled by LessonPracticeSurface elsewhere).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LessonPhase } from '../lib/lesson-loader';
import type { LessonEngineControls } from '../lib/useLessonEngine';
import styles from '../styles/lesson-renderer.module.css';

const phaseTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const } },
};

interface IntervalChoiceProps {
  readonly phase: LessonPhase;
  readonly engine: LessonEngineControls;
  readonly onAdvance: () => void;
}

function intervalKey(pair: readonly [string, string]): string {
  return `${pair[0]}-${pair[1]}`;
}

export default function IntervalChoice({
  phase,
  engine,
  onAdvance,
}: IntervalChoiceProps) {
  const pool = phase.interval_pool ?? [];
  const totalRounds = phase.rounds ?? Math.min(pool.length, 4);
  const playCount = phase.play_count ?? 2;

  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<readonly [string, string] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const playingRef = useRef(false);

  // Pick a random interval at the start of each round
  useEffect(() => {
    if (round >= totalRounds) return;
    if (pool.length === 0) {
      onAdvance();
      return;
    }
    const idx = Math.floor(Math.random() * pool.length);
    const next = pool[idx]!;
    setTarget(next);
    setPicked(null);
    // Auto-play after a beat
    const t = setTimeout(() => playInterval(next), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const playInterval = useCallback(async (pair: readonly [string, string]) => {
    if (playingRef.current) return;
    playingRef.current = true;
    try {
      for (let i = 0; i < playCount; i++) {
        await engine.audio.playPhrase([pair[0], pair[1]], 700, 120);
        if (i < playCount - 1) await sleep(350);
      }
    } finally {
      playingRef.current = false;
    }
  }, [engine.audio, playCount]);

  const handleChoice = useCallback((pair: readonly [string, string]) => {
    if (!target || picked !== null) return;
    setPicked(intervalKey(pair));
    const isCorrect = intervalKey(pair) === intervalKey(target);
    if (isCorrect) setCorrectCount((c) => c + 1);

    // Brief feedback, then next round
    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        onAdvance();
      } else {
        setRound((r) => r + 1);
      }
    }, 1200);
  }, [target, picked, round, totalRounds, onAdvance]);

  if (pool.length === 0) {
    return (
      <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
        <button type="button" className={styles.actionButton} onClick={onAdvance}>
          Continue
        </button>
      </motion.div>
    );
  }

  const targetKey = target ? intervalKey(target) : null;

  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <p className={styles.phaseMeta}>
        Round {round + 1} / {totalRounds} · {correctCount} correct
      </p>
      {phase.instruction && (
        <p className={styles.phaseInstruction}>{phase.instruction.trim()}</p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          className={styles.actionButtonSecondary}
          onClick={() => target && playInterval(target)}
          disabled={picked !== null}
        >
          Listen again
        </button>
      </div>

      <div className={styles.choiceRow} role="group" aria-label="Choose the interval you heard">
        {pool.map((pair) => {
          const key = intervalKey(pair);
          const isPicked = picked === key;
          const isCorrect = picked !== null && key === targetKey;
          const cls = isCorrect ? styles.choiceCorrect
            : isPicked && key !== targetKey ? styles.choiceWrong : '';
          return (
            <button
              key={key}
              type="button"
              className={`${styles.choiceButton} ${cls}`}
              onClick={() => handleChoice(pair)}
              disabled={picked !== null}
              aria-label={`${pair[0]} to ${pair[1]}`}
            >
              {pair[0]} → {pair[1]}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
        style={{ marginTop: 'var(--space-2)', opacity: 0.55 }}
      >
        Skip
      </button>
    </motion.div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
