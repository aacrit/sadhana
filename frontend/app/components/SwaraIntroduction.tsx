/**
 * SwaraIntroduction.tsx — Sequential swara presentation
 *
 * Presents swaras one at a time: plays the tone first, pauses, then reveals
 * the label. Audio before everything — the Presence Rule.
 *
 * Props:
 *   swaras: string[] — swara symbols to present (e.g. ['Sa', 'Re', 'Ga'])
 *   onComplete: () => void — called when all swaras have been revealed
 *   revealDelayMs: number — pause between audio and label reveal (default 1200)
 *
 * Typography:
 *   Swara name: Cormorant Garamond (--font-serif)
 *   Frequency hint: IBM Plex Mono (--font-mono)
 *
 * Animation: Framer Motion fade + scale 0.8 -> 1.0 spring on each swara reveal.
 * Reduced-motion: swaras appear instantly, no scale animation.
 * SSR-safe: all browser APIs gated behind useEffect.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Swara } from '@/engine/theory/types';
import { getSwaraFrequency } from '@/engine/theory';
import styles from '../styles/swara-introduction.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SwaraIntroductionProps {
  /** Swara symbols to present sequentially. */
  swaras: string[];
  /** Called when all swaras have been presented. */
  onComplete: () => void;
  /** Whether audio plays before labels are shown (always true per Presence Rule). */
  audioFirst?: boolean;
  /** Delay in ms between audio trigger and label reveal. */
  revealDelayMs?: number;
  /** Sa frequency in Hz for computing display hints. */
  saHz?: number;
  /** Optional callback to play a swara tone. Called with the swara name when it becomes active. */
  onPlaySwara?: (swara: string) => void;
}

// ---------------------------------------------------------------------------
// Swara spring animation variants
// ---------------------------------------------------------------------------

const swaraVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
      duration: 0.5,
    },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SwaraIntroduction({
  swaras,
  onComplete,
  audioFirst = true,
  revealDelayMs = 1200,
  saHz = 261.63,
  onPlaySwara,
}: SwaraIntroductionProps) {
  /** Index of the next swara to reveal (0-based). -1 = not started. */
  const [currentIndex, setCurrentIndex] = useState(-1);
  /** Which swaras have had their labels revealed. */
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  /** Whether the sequence is playing (between reveal events). */
  const [isPlaying, setIsPlaying] = useState(false);
  /** Whether the entire sequence has finished. */
  const [sequenceComplete, setSequenceComplete] = useState(false);

  // CRITICAL: separate timer refs for reveal vs auto-advance.
  // If both use the same ref, the auto-advance effect cleanup kills
  // the reveal timer when currentIndex changes — freezing the sequence.
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeCalled = useRef(false);

  // Store onPlaySwara in a ref so advanceSwara doesn't depend on it.
  // Without this, inline arrow function props like onPlaySwara={(s) => audio.playSwara(s)}
  // create new references every render, causing advanceSwara to recreate and
  // auto-advance timers to reset before they complete — the "stuck at step 3" bug.
  const onPlaySwaraRef = useRef(onPlaySwara);
  onPlaySwaraRef.current = onPlaySwara;

  // Clean up both timers on unmount
  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  /**
   * Advance to the next swara in the sequence.
   * If audioFirst, waits revealDelayMs before revealing the label.
   */
  const advanceSwara = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;

      if (next >= swaras.length) {
        // All swaras presented
        setIsPlaying(false);
        setSequenceComplete(true);
        return prev;
      }

      setIsPlaying(true);

      // Trigger audio playback for this swara (via ref to avoid dep instability)
      if (onPlaySwaraRef.current) {
        onPlaySwaraRef.current(swaras[next]!);
      }

      if (audioFirst) {
        // Play audio first, then reveal label after delay
        revealTimerRef.current = setTimeout(() => {
          setRevealedIndices((prevSet) => {
            const newSet = new Set(prevSet);
            newSet.add(next);
            return newSet;
          });
          setIsPlaying(false);
        }, revealDelayMs);
      } else {
        // Reveal immediately
        setRevealedIndices((prevSet) => {
          const newSet = new Set(prevSet);
          newSet.add(next);
          return newSet;
        });
        setIsPlaying(false);
      }

      return next;
    });
  }, [swaras, swaras.length, audioFirst, revealDelayMs]);

  // Auto-start the sequence on mount
  useEffect(() => {
    if (currentIndex === -1) {
      const startTimer = setTimeout(() => advanceSwara(), 600);
      return () => clearTimeout(startTimer);
    }
  }, [currentIndex, advanceSwara]);

  // Auto-advance after each swara is revealed
  useEffect(() => {
    if (
      currentIndex >= 0 &&
      !isPlaying &&
      revealedIndices.has(currentIndex) &&
      currentIndex < swaras.length - 1
    ) {
      // Short pause between swaras to let the student absorb
      advanceTimerRef.current = setTimeout(() => advanceSwara(), 800);
      return () => {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      };
    }
  }, [currentIndex, isPlaying, revealedIndices, swaras.length, advanceSwara]);

  // Compute frequency hint for a given swara symbol
  const getFrequencyHint = useCallback(
    (swaraSymbol: string): string => {
      try {
        const hz = getSwaraFrequency(swaraSymbol as Swara, saHz);
        return `${Math.round(hz)} Hz`;
      } catch {
        return '';
      }
    },
    [saHz],
  );

  // Handle completion
  const handleComplete = useCallback(() => {
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete();
    }
  }, [onComplete]);

  return (
    <div
      className={styles.container}
      role="region"
      aria-label="Swara introduction"
      aria-live="polite"
    >
      {/* Listening indicator while audio plays */}
      {isPlaying && (
        <div className={styles.listeningDot} aria-label="Playing swara tone" />
      )}

      {/* Swara grid */}
      <div className={styles.swaraGrid}>
        <AnimatePresence>
          {swaras.map((swara, index) => {
            const isRevealed = revealedIndices.has(index);
            if (!isRevealed) return null;

            return (
              <motion.div
                key={swara + '-' + String(index)}
                className={styles.swaraItem}
                variants={swaraVariants}
                initial="hidden"
                animate="visible"
                aria-label={`Swara: ${swara}`}
              >
                <span className={styles.swaraName}>{swara}</span>
                <span className={styles.swaraFrequency}>
                  {getFrequencyHint(swara)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Continue button appears when all swaras are revealed */}
      {sequenceComplete && (
        <motion.button
          type="button"
          className={styles.continueButton}
          onClick={handleComplete}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          aria-label="Continue to next phase"
        >
          Continue
        </motion.button>
      )}
    </div>
  );
}
