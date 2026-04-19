/**
 * PhrasePlayback.tsx — Sequential phrase presentation layer above Tantri.
 *
 * Sequences through swaras, calling onPlaySwara for audio and onHighlightString
 * to drive Tantri string highlighting. Renders only a minimal current-swara
 * label overlay — Tantri is the primary visual surface.
 *
 * Props:
 *   phrase: string[] — swara symbols in order
 *   showLabels: boolean — kept for API compat; labels shown in phrase row only
 *   onComplete: () => void — called when the full phrase playback finishes
 *   repeatCount: number — how many times to play the phrase (default 1)
 *   noteDurationMs: number — duration of each note in ms (default 800)
 *   onHighlightString: (swara: string) => void — drives Tantri string highlight
 *
 * Accessibility: phrase content announced via aria-live region.
 * Keyboard: spacebar to replay.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/lesson-renderer.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PhrasePlaybackProps {
  /** Swara symbols in the phrase, e.g. ['Sa', 'Re', 'Ga', 'Pa', 'Dha', 'Sa'] */
  phrase: string[];
  /** Whether to show swara labels in the phrase row. */
  showLabels: boolean;
  /** Called when all repetitions of the phrase have completed. */
  onComplete: () => void;
  /** Number of times to repeat the phrase. */
  repeatCount?: number;
  /** Duration of each note in milliseconds. */
  noteDurationMs?: number;
  /** Optional callback to play an individual swara tone. Called with swara name on each note. */
  onPlaySwara?: (swara: string) => void;
  /**
   * Drives Tantri string highlight. Called with the swara name whenever a note
   * becomes active. The parent converts swara→Hz and passes to Tantri as
   * pitchHz with pitchClarity=1.0 for a perfect-accuracy highlight.
   */
  onHighlightString?: (swara: string) => void;
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
  onHighlightString,
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
  // Store callbacks in refs to avoid dep instability in playPhrase
  const onPlaySwaraRef = useRef(onPlaySwara);
  onPlaySwaraRef.current = onPlaySwara;
  const onHighlightStringRef = useRef(onHighlightString);
  onHighlightStringRef.current = onHighlightString;

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

      // Trigger audio playback and Tantri highlight (via refs for dep stability)
      if (onPlaySwaraRef.current && phrase[currentNote]) {
        onPlaySwaraRef.current(phrase[currentNote]);
      }
      if (onHighlightStringRef.current && phrase[currentNote]) {
        onHighlightStringRef.current(phrase[currentNote]);
      }

      noteIndex += 1;

      // Schedule next note
      timerRef.current = setTimeout(playNext, noteDurationMs);
    };

    // Start after a brief delay
    timerRef.current = setTimeout(playNext, 300);
  }, [phrase, phrase.length, repeatCount, noteDurationMs]);

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

  // Handle continue — fires immediately whether playback is done or still running.
  // Clears any pending timer so mid-playback clicks don't double-fire.
  const handleContinue = useCallback(() => {
    if (!completeCalled.current) {
      completeCalled.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      onComplete();
    }
  }, [onComplete]);

  const activeSwara = activeIndex >= 0 ? phrase[activeIndex] : null;

  return (
    <div
      className={styles.centeredMessage}
      role="region"
      aria-label={`Phrase: ${phrase.join(' ')}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        {activeSwara ? `Playing: ${activeSwara}` : ''}
      </div>

      {/* Phrase row — minimal label sequence above Tantri.
          Tantri string highlighting is the primary visual feedback. */}
      <div className={styles.phraseRow} aria-hidden="true">
        {phrase.map((swara, index) => (
          <span
            key={swara + '-' + String(index)}
            className={
              index === activeIndex
                ? `${styles.phraseNote} ${styles.phraseNoteActive}`
                : styles.phraseNote
            }
          >
            {showLabels ? swara : '\u2022'}
          </span>
        ))}
      </div>

      {/* Continue is always available — skips remaining repeats and advances.
          Visible immediately at low opacity; becomes full opacity once all
          repetitions finish, so the natural flow still rewards listening. */}
      <motion.button
        type="button"
        className={styles.actionButton}
        onClick={handleContinue}
        initial={{ opacity: 0 }}
        animate={{ opacity: allComplete ? 1 : 0.35 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        aria-label="Continue to next phase"
        style={{ marginTop: 'var(--space-4)' }}
      >
        Continue
      </motion.button>
    </div>
  );
}
