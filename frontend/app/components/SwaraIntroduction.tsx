/**
 * SwaraIntroduction.tsx — Sequential swara presentation
 *
 * Presents swaras one at a time: plays the tone first, pauses, then reveals
 * the label. Audio before everything — the Presence Rule.
 *
 * Rendering: thin label overlay above Tantri. No swaraGrid or listeningDot —
 * Tantri is the primary visual surface. This component drives Tantri via
 * the onHighlightString callback, which the parent wires to Tantri's pitchHz.
 *
 * Props:
 *   swaras: string[] — swara symbols to present (e.g. ['Sa', 'Re', 'Ga'])
 *   onComplete: () => void — called when all swaras have been revealed
 *   revealDelayMs: number — pause between audio and label reveal (default 1200)
 *   onHighlightString: (swara: string) => void — drives Tantri string highlight
 *
 * Animation: Framer Motion fade + scale 0.8 -> 1.0 spring on each swara reveal.
 * Reduced-motion: swaras appear instantly, no scale animation.
 * SSR-safe: all browser APIs gated behind useEffect.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
// AnimatePresence removed — Tantri is the primary visual surface.
import styles from '../styles/lesson-renderer.module.css';

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
  /** Optional callback to play a swara tone. Called with the swara name when it becomes active. */
  onPlaySwara?: (swara: string) => void;
  /**
   * Drives Tantri string highlight. Called with the swara name whenever a new
   * swara becomes active. The parent converts swara→Hz and passes to Tantri
   * as pitchHz with pitchClarity=1.0 for a perfect-accuracy highlight.
   */
  onHighlightString?: (swara: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SwaraIntroduction({
  swaras,
  onComplete,
  audioFirst = true,
  revealDelayMs = 1200,
  onPlaySwara,
  onHighlightString,
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

  // Store callbacks in refs so advanceSwara doesn't depend on them.
  // Without this, inline arrow function props create new references every render,
  // causing advanceSwara to recreate and auto-advance timers to reset before
  // they complete — the "stuck at step 3" bug.
  const onPlaySwaraRef = useRef(onPlaySwara);
  onPlaySwaraRef.current = onPlaySwara;
  const onHighlightStringRef = useRef(onHighlightString);
  onHighlightStringRef.current = onHighlightString;

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

      // Trigger audio playback and Tantri highlight (via refs to avoid dep instability)
      if (onPlaySwaraRef.current) {
        onPlaySwaraRef.current(swaras[next]!);
      }
      if (onHighlightStringRef.current) {
        onHighlightStringRef.current(swaras[next]!);
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

  // Handle completion
  const handleComplete = useCallback(() => {
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete();
    }
  }, [onComplete]);

  // The active swara label — shown as thin overlay above Tantri
  const activeSwara = currentIndex >= 0 ? swaras[currentIndex] : null;

  return (
    <div
      className={styles.centeredMessage}
      role="region"
      aria-label="Swara introduction"
      aria-live="polite"
    >
      {/* Current swara label — Tantri is the primary visual surface */}
      {activeSwara && (
        <motion.p
          key={activeSwara}
          className={styles.practiceTarget}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
          exit={{ opacity: 0 }}
        >
          {activeSwara}
        </motion.p>
      )}

      {/* Continue button appears when all swaras are revealed */}
      {sequenceComplete && (
        <motion.button
          type="button"
          className={styles.actionButton}
          onClick={handleComplete}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          aria-label="Continue to next phase"
          style={{ marginTop: 'var(--space-4)' }}
        >
          Continue
        </motion.button>
      )}
    </div>
  );
}
