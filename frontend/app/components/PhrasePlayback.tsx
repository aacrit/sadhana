/**
 * PhrasePlayback.tsx — Sequential phrase dot visualization
 *
 * Displays a sequence of swara dots that light up in order as the phrase plays.
 * Each dot is a 40px circle; the active dot lights up saffron (#E8871E).
 * Labels appear below each dot only when showLabels is true.
 *
 * Props:
 *   phrase: string[] — swara symbols in order
 *   showLabels: boolean — whether to display swara names below dots
 *   onComplete: () => void — called when the full phrase playback finishes
 *   repeatCount: number — how many times to play the phrase (default 1)
 *   noteDurationMs: number — duration of each note in ms (default 800)
 *
 * Audio: In production, each dot activation triggers Tone.js synthesis.
 * Currently simulated with timers for visual sequencing.
 *
 * Accessibility: Dots are decorative (aria-hidden), phrase content announced
 * via aria-live region. Keyboard: spacebar to replay.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/phrase-playback.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PhrasePlaybackProps {
  /** Swara symbols in the phrase, e.g. ['Sa', 'Re', 'Ga', 'Pa', 'Dha', 'Sa'] */
  phrase: string[];
  /** Whether to show swara labels below dots. */
  showLabels: boolean;
  /** Called when all repetitions of the phrase have completed. */
  onComplete: () => void;
  /** Number of times to repeat the phrase. */
  repeatCount?: number;
  /** Duration of each note in milliseconds. */
  noteDurationMs?: number;
  /** Optional callback to play an individual swara tone. Called with swara name on each note. */
  onPlaySwara?: (swara: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhrasePlayback({
  phrase,
  showLabels,
  onComplete,
  repeatCount = 1,
  noteDurationMs = 800,
  onPlaySwara,
}: PhrasePlaybackProps) {
  /** Index of the currently active dot (-1 = none active). */
  const [activeIndex, setActiveIndex] = useState(-1);
  /** Set of indices that have already been played in the current repetition. */
  const [playedIndices, setPlayedIndices] = useState<Set<number>>(new Set());
  /** Whether the phrase is currently playing. */
  const [isPlaying, setIsPlaying] = useState(false);
  /** Whether all repetitions are complete. */
  const [allComplete, setAllComplete] = useState(false);
  /** Current repetition count (0-based). */
  const currentRepRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeCalled = useRef(false);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /**
   * Play the phrase through once, lighting up dots sequentially.
   */
  const playPhrase = useCallback(() => {
    setIsPlaying(true);
    setPlayedIndices(new Set());
    setActiveIndex(-1);

    let noteIndex = 0;

    const playNext = () => {
      if (noteIndex >= phrase.length) {
        // Repetition complete
        setActiveIndex(-1);
        currentRepRef.current += 1;

        if (currentRepRef.current >= repeatCount) {
          // All repetitions done
          setIsPlaying(false);
          setAllComplete(true);
          return;
        }

        // Pause between repetitions, then replay
        timerRef.current = setTimeout(() => {
          setPlayedIndices(new Set());
          noteIndex = 0;
          playNext();
        }, noteDurationMs);
        return;
      }

      const currentNote = noteIndex;
      setActiveIndex(currentNote);
      setPlayedIndices((prev) => {
        const next = new Set(prev);
        next.add(currentNote);
        return next;
      });

      // Trigger audio playback for this note
      if (onPlaySwara && phrase[currentNote]) {
        onPlaySwara(phrase[currentNote]);
      }

      noteIndex += 1;

      // Schedule next note
      timerRef.current = setTimeout(playNext, noteDurationMs);
    };

    // Start after a brief delay
    timerRef.current = setTimeout(playNext, 300);
  }, [phrase, phrase.length, repeatCount, noteDurationMs, onPlaySwara]);

  // Auto-start on mount
  useEffect(() => {
    playPhrase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle keyboard replay
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Spacebar') && !isPlaying) {
        e.preventDefault();
        currentRepRef.current = 0;
        setAllComplete(false);
        completeCalled.current = false;
        playPhrase();
      }
    },
    [isPlaying, playPhrase],
  );

  // Handle continue
  const handleContinue = useCallback(() => {
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete();
    }
  }, [onComplete]);

  return (
    <div
      className={styles.container}
      role="region"
      aria-label={`Phrase: ${phrase.join(' ')}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        {activeIndex >= 0 && phrase[activeIndex]
          ? `Playing: ${phrase[activeIndex]}`
          : ''}
      </div>

      {/* Dot row */}
      <div className={styles.dotsRow} aria-hidden="true">
        {phrase.map((swara, index) => {
          const isActive = index === activeIndex;
          const isPlayed = playedIndices.has(index) && !isActive;

          const dotClassName = [
            styles.dot,
            isActive && styles.dotActive,
            isPlayed && styles.dotPlayed,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={swara + '-' + String(index)} className={styles.dotWrapper}>
              <div className={dotClassName} />
              {showLabels && (
                <span className={styles.dotLabel}>{swara}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue button after playback completes */}
      {allComplete && (
        <motion.button
          type="button"
          className={styles.actionButton}
          onClick={handleContinue}
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
