/**
 * Explorer journey — landing page
 *
 * Browse ragas by time of day and emotional essence.
 * Five ragas displayed as cards with play buttons and explore links.
 * Filter chips narrow the view by prahara or rasa.
 * Ear training CTA at the bottom.
 *
 * All audio triggered via useLessonAudio hook — same pattern as beginner.
 * Aroha phrases play when the user taps the play button on a raga card.
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RAGA_LIST,
  getRagasByPrahara,
  getRagasByRasa,
  getArohaCount,
} from '@/engine/theory';
import type { Raga, Prahara, Rasa, SwaraNote } from '@/engine/theory/types';
import { useLessonAudio } from '../../lib/lesson-audio';
import { useTimbreSelection } from '../../components/VoiceTimbreSelector';
import { getRagaIcon } from '../../components/icons';
import styles from '../../styles/explorer.module.css';

// ---------------------------------------------------------------------------
// Filter definitions
// ---------------------------------------------------------------------------

interface TimeFilter {
  readonly label: string;
  readonly prahara: Prahara;
}

const TIME_FILTERS: readonly TimeFilter[] = [
  { label: 'Dawn', prahara: 1 },
  { label: 'Afternoon', prahara: 3 },
  { label: 'Dusk', prahara: 4 },
  { label: 'Evening', prahara: 5 },
  { label: 'Night', prahara: 7 },
] as const;

interface RasaFilter {
  readonly label: string;
  readonly rasa: Rasa;
}

const RASA_FILTERS: readonly RasaFilter[] = [
  { label: 'Shant', rasa: 'shant' },
  { label: 'Karuna', rasa: 'karuna' },
  { label: 'Shringar', rasa: 'shringar' },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get a human-readable time-of-day label for a raga's prahara list. */
function praharaToTimeLabel(praharas: readonly Prahara[]): string {
  const labels: Record<number, string> = {
    1: 'Dawn',
    2: 'Morning',
    3: 'Afternoon',
    4: 'Late afternoon',
    5: 'Evening',
    6: 'Late evening',
    7: 'Midnight',
    8: 'Pre-dawn',
  };
  return praharas.map((p) => labels[p] ?? `Prahara ${String(p)}`).join(', ');
}

/** Get a human-readable rasa label. */
function rasaToLabel(rasa: Rasa): string {
  const labels: Record<Rasa, string> = {
    shant: 'Shant',
    karuna: 'Karuna',
    shringar: 'Shringar',
    veer: 'Veer',
    adbhut: 'Adbhut',
    bhayanak: 'Bhayanak',
    raudra: 'Raudra',
    bibhatsa: 'Bibhatsa',
    hasya: 'Hasya',
  };
  return labels[rasa];
}

/** Format a SwaraNote for display (e.g. "Ga" or "Sa'" for taar). */
function formatSwara(note: SwaraNote): string {
  // Clean up suffix: _k = komal, _t = tivra
  let display = note.swara.replace('_k', '').replace('_t', '');
  // Add komal/tivra marker
  if (note.swara.endsWith('_k')) display = display.toLowerCase();
  if (note.swara.endsWith('_t')) display = display + '*';
  // Add octave marker
  if (note.octave === 'taar') display = display + "'";
  if (note.octave === 'mandra') display = '.' + display;
  return display;
}

/** Convert a raga's aroha into swara name strings for playback. */
function arohaToPlaybackNames(raga: Raga): string[] {
  return raga.aroha.map((note) => {
    if (note.octave === 'taar' && note.swara === 'Sa') return 'Sa_upper';
    return note.swara;
  });
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
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
// Page component
// ---------------------------------------------------------------------------

export default function ExplorerPage() {
  // Filter state: multiple chips can be active
  const [activeTimeFilters, setActiveTimeFilters] = useState<Set<Prahara>>(
    new Set(),
  );
  const [activeRasaFilters, setActiveRasaFilters] = useState<Set<Rasa>>(
    new Set(),
  );

  // Currently playing raga ID (for play button state)
  const [playingRagaId, setPlayingRagaId] = useState<string | null>(null);

  // Timbre selection — persisted to localStorage
  const [timbre] = useTimbreSelection();

  // Audio hook — default Sa and no specific raga for the landing page
  const audio = useLessonAudio(261.63, 'bhoopali', timbre);
  const playingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playingTimeoutRef.current) clearTimeout(playingTimeoutRef.current);
      audio.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Filter logic
  // -------------------------------------------------------------------------

  const toggleTimeFilter = useCallback((prahara: Prahara) => {
    setActiveTimeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(prahara)) {
        next.delete(prahara);
      } else {
        next.add(prahara);
      }
      return next;
    });
  }, []);

  const toggleRasaFilter = useCallback((rasa: Rasa) => {
    setActiveRasaFilters((prev) => {
      const next = new Set(prev);
      if (next.has(rasa)) {
        next.delete(rasa);
      } else {
        next.add(rasa);
      }
      return next;
    });
  }, []);

  // Compute filtered ragas
  const filteredRagas = useMemo(() => {
    let result: readonly Raga[] = RAGA_LIST;

    if (activeTimeFilters.size > 0) {
      // Union: show ragas matching ANY active time filter
      const timeMatches = new Set<string>();
      for (const prahara of activeTimeFilters) {
        for (const raga of getRagasByPrahara(prahara)) {
          timeMatches.add(raga.id);
        }
      }
      result = result.filter((r) => timeMatches.has(r.id));
    }

    if (activeRasaFilters.size > 0) {
      // Union: show ragas matching ANY active rasa filter
      const rasaMatches = new Set<string>();
      for (const rasa of activeRasaFilters) {
        for (const raga of getRagasByRasa(rasa)) {
          rasaMatches.add(raga.id);
        }
      }
      result = result.filter((r) => rasaMatches.has(r.id));
    }

    return result;
  }, [activeTimeFilters, activeRasaFilters]);

  // -------------------------------------------------------------------------
  // Play aroha on card
  // -------------------------------------------------------------------------

  const handlePlayAroha = useCallback(
    (raga: Raga) => {
      if (playingRagaId === raga.id) {
        // Already playing — stop
        audio.stopPlayback();
        setPlayingRagaId(null);
        if (playingTimeoutRef.current) {
          clearTimeout(playingTimeoutRef.current);
          playingTimeoutRef.current = null;
        }
        return;
      }

      // Stop any existing playback
      audio.stopPlayback();
      if (playingTimeoutRef.current) {
        clearTimeout(playingTimeoutRef.current);
      }

      setPlayingRagaId(raga.id);

      const names = arohaToPlaybackNames(raga);
      audio.playPhrase(names, 500, 50).then(() => {
        // Clear playing state after phrase completes
        playingTimeoutRef.current = setTimeout(() => {
          setPlayingRagaId(null);
          playingTimeoutRef.current = null;
        }, 200);
      });
    },
    [audio, playingRagaId],
  );

  // -------------------------------------------------------------------------
  // Keyboard handler for play buttons
  // -------------------------------------------------------------------------

  const handlePlayKeyDown = useCallback(
    (e: React.KeyboardEvent, raga: Raga) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handlePlayAroha(raga);
      }
    },
    [handlePlayAroha],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <motion.div
      className={styles.page}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Back navigation */}
      <motion.div variants={fadeUp}>
        <Link href="/" className={styles.backLink} aria-label="Back to journeys">
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
          Journeys
        </Link>
      </motion.div>

      {/* Header */}
      <motion.header className={styles.header} variants={fadeUp}>
        <h1 className={`${styles.title} raga-name`}>Sadhaka</h1>
        <span className={`${styles.titleDevanagari} swara-text devanagari-only`}>{'\u0938\u093E\u0927\u0915'}</span>
        <span className={styles.titleEnglish}>Explorer</span>
        <p className={styles.subtitle}>
          Five ragas. Five moods. Five times of day.
        </p>
      </motion.header>

      {/* Filter bar */}
      <motion.div
        className={styles.filterBar}
        variants={fadeUp}
        role="group"
        aria-label="Filter ragas"
      >
        {/* Time of day filters */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel} id="filter-time-label">
            Time of day
          </span>
          <div
            className={styles.chipRow}
            role="group"
            aria-labelledby="filter-time-label"
          >
            {TIME_FILTERS.map((filter) => {
              const isActive = activeTimeFilters.has(filter.prahara);
              return (
                <button
                  key={filter.label}
                  type="button"
                  className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                  onClick={() => toggleTimeFilter(filter.prahara)}
                  aria-pressed={isActive}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rasa filters */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel} id="filter-rasa-label">
            Rasa
          </span>
          <div
            className={styles.chipRow}
            role="group"
            aria-labelledby="filter-rasa-label"
          >
            {RASA_FILTERS.map((filter) => {
              const isActive = activeRasaFilters.has(filter.rasa);
              return (
                <button
                  key={filter.label}
                  type="button"
                  className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                  onClick={() => toggleRasaFilter(filter.rasa)}
                  aria-pressed={isActive}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Raga grid */}
      <motion.div
        className={styles.ragaGrid}
        variants={staggerContainer}
        role="list"
        aria-label="Ragas"
      >
        {filteredRagas.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No ragas match the selected filters. Try adjusting your selection.
            </p>
          </div>
        ) : (
          filteredRagas.map((raga) => {
            const swaraCount = getArohaCount(raga);
            const isPlaying = playingRagaId === raga.id;

            const RagaIcon = getRagaIcon(raga.id);

            return (
              <motion.article
                key={raga.id}
                className={styles.ragaCard}
                variants={fadeUp}
                role="listitem"
              >
                {RagaIcon && (
                  <div className={styles.ragaIconWrap}>
                    <RagaIcon size={40} color="var(--text-2)" />
                  </div>
                )}
                <h2 className={`${styles.ragaName} raga-name`}>{raga.name}</h2>
                <span className={`${styles.ragaDevanagari} devanagari-only`}>
                  {raga.nameDevanagari}
                </span>

                <div className={styles.ragaMeta}>
                  <span className={styles.ragaMetaTag}>
                    {praharaToTimeLabel(raga.prahara)}
                  </span>
                  {raga.rasa.map((r) => (
                    <span key={r} className={styles.ragaMetaTag}>
                      {rasaToLabel(r)}
                    </span>
                  ))}
                </div>

                <span className={styles.ragaSwaraCount}>
                  {String(swaraCount)} swaras
                </span>

                <div className={styles.cardActions}>
                  {/* Play aroha button */}
                  <button
                    type="button"
                    className={`${styles.playButton} ${isPlaying ? styles.playButtonActive : ''}`}
                    onClick={() => handlePlayAroha(raga)}
                    onKeyDown={(e) => handlePlayKeyDown(e, raga)}
                    aria-label={
                      isPlaying
                        ? `Stop playing ${raga.name} aroha`
                        : `Play ${raga.name} aroha`
                    }
                  >
                    {isPlaying ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="4"
                          y="3"
                          width="3.5"
                          height="12"
                          rx="1"
                          fill="currentColor"
                        />
                        <rect
                          x="10.5"
                          y="3"
                          width="3.5"
                          height="12"
                          rx="1"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 3.5L14 9L5 14.5V3.5Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Explore link */}
                  <Link
                    href={`/journeys/explorer/${raga.id}`}
                    className={styles.exploreLink}
                  >
                    Explore
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 3L9 7L5 11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </motion.article>
            );
          })
        )}
      </motion.div>

      {/* Ear training CTA */}
      <motion.section
        className={styles.earTrainingSection}
        variants={fadeUp}
        aria-label="Ear training"
      >
        <h2 className={`${styles.earTrainingTitle} raga-name`}>Ear Training</h2>
        <p className={styles.earTrainingDescription}>
          Can you recognise a swara by its sound alone? Test yourself with 10
          rounds of swara identification.
        </p>
        <Link
          href="/journeys/explorer/ear-training"
          className={styles.earTrainingLink}
        >
          Begin Training
        </Link>
      </motion.section>
    </motion.div>
  );
}
