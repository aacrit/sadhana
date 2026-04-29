'use client';

/**
 * SwaraComparison — A/B side-by-side swara presentation.
 *
 * Used by:
 *   - `swara_introduction` phase with `presentation: 'comparison'` and exactly
 *     two swaras (e.g. Re vs Re_k in Bhairav, Ma vs Ma_t in Yaman).
 *   - the `swara_comparison` phase type (Cluster F), which carries `swara_a`
 *     and `swara_b` directly.
 *
 * Two cards. Each card carries the swara label (Devanagari/romanized via
 * the existing token pipeline) and a Listen button. The student plays each
 * tone independently and as many times as they like, then continues.
 */

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/lesson-renderer.module.css';

const phaseTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const } },
};

interface SwaraComparisonProps {
  readonly phaseId: string;
  readonly swaraA: string;
  readonly swaraB: string;
  readonly instruction?: string;
  readonly onAdvance: () => void;
  readonly onPlaySwara: (swara: string) => void;
  readonly onHighlightString?: (swara: string) => void;
}

export default function SwaraComparison({
  phaseId,
  swaraA,
  swaraB,
  instruction,
  onAdvance,
  onPlaySwara,
  onHighlightString,
}: SwaraComparisonProps) {
  const [heard, setHeard] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });

  const playA = useCallback(() => {
    onPlaySwara(swaraA);
    onHighlightString?.(swaraA);
    setHeard((prev) => ({ ...prev, a: true }));
  }, [onPlaySwara, onHighlightString, swaraA]);

  const playB = useCallback(() => {
    onPlaySwara(swaraB);
    onHighlightString?.(swaraB);
    setHeard((prev) => ({ ...prev, b: true }));
  }, [onPlaySwara, onHighlightString, swaraB]);

  const bothHeard = heard.a && heard.b;

  return (
    <motion.div key={phaseId} {...phaseTransition} className={styles.centeredMessage}>
      {instruction && <p className={styles.phaseInstruction}>{instruction}</p>}

      <div className={styles.comparisonRow} role="group" aria-label="Compare swaras">
        <div className={styles.comparisonCard}>
          <span className={`${styles.comparisonLabel} swara-name`}>{swaraA}</span>
          <button
            type="button"
            className={styles.actionButtonSecondary}
            onClick={playA}
            aria-label={`Play ${swaraA}`}
          >
            {heard.a ? 'Play again' : 'Listen'}
          </button>
        </div>
        <span className={styles.comparisonDivider} aria-hidden="true">vs</span>
        <div className={styles.comparisonCard}>
          <span className={`${styles.comparisonLabel} swara-name`}>{swaraB}</span>
          <button
            type="button"
            className={styles.actionButtonSecondary}
            onClick={playB}
            aria-label={`Play ${swaraB}`}
          >
            {heard.b ? 'Play again' : 'Listen'}
          </button>
        </div>
      </div>

      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
        style={{ marginTop: 'var(--space-4)', opacity: bothHeard ? 1 : 0.55 }}
      >
        Continue
      </button>
    </motion.div>
  );
}
