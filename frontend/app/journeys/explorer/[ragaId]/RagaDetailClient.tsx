'use client';

/**
 * RagaDetailClient — Explorer raga detail view (client component)
 *
 * Deep exploration of a single raga: name, metadata, description,
 * aroha/avaroha with swara dots, pakad phrases with play buttons,
 * and a collapsible Western bridge section.
 *
 * Extracted from page.tsx so generateStaticParams can live in the
 * server component page wrapper (Next.js 15 requirement).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getRagaById } from '@/engine/theory';
import type { SwaraNote, Prahara, Rasa, RagaJati } from '@/engine/theory/types';
import { useLessonAudio } from '../../../lib/lesson-audio';
import styles from '../../../styles/explorer-detail.module.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function jatiToLabel(jati: RagaJati): string {
  const labels: Record<RagaJati, string> = {
    audava: 'Audava (5)',
    shadava: 'Shadava (6)',
    sampoorna: 'Sampoorna (7)',
  };
  return labels[jati];
}

/** Format a SwaraNote for sargam display. */
function formatSwaraNote(note: SwaraNote): string {
  let display: string = note.swara;
  display = display.replace('_k', '(k)').replace('_t', '(t)');
  if (note.octave === 'taar') display = display + "'";
  if (note.octave === 'mandra') display = '.' + display;
  return display;
}

/** Format a phrase (array of SwaraNote) into sargam string. */
function formatPhrase(phrase: readonly SwaraNote[]): string {
  return phrase.map(formatSwaraNote).join(' ');
}

/** Convert a SwaraNote array to playback name strings. */
function notesToPlaybackNames(notes: readonly SwaraNote[]): string[] {
  return notes.map((note) => {
    if (note.octave === 'taar' && note.swara === 'Sa') return 'Sa_upper';
    return note.swara;
  });
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
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
// Client component
// ---------------------------------------------------------------------------

interface RagaDetailClientProps {
  readonly ragaId: string;
}

export default function RagaDetailClient({ ragaId }: RagaDetailClientProps) {
  const raga = getRagaById(ragaId);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [westernOpen, setWesternOpen] = useState(false);

  const audio = useLessonAudio(261.63, ragaId);
  const playingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (playingTimeoutRef.current) clearTimeout(playingTimeoutRef.current);
      audio.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playNotes = useCallback(
    (notes: readonly SwaraNote[], id: string) => {
      if (playingId === id) {
        audio.stopPlayback();
        setPlayingId(null);
        if (playingTimeoutRef.current) {
          clearTimeout(playingTimeoutRef.current);
          playingTimeoutRef.current = null;
        }
        return;
      }

      audio.stopPlayback();
      if (playingTimeoutRef.current) {
        clearTimeout(playingTimeoutRef.current);
      }

      setPlayingId(id);

      const names = notesToPlaybackNames(notes);
      audio.playPhrase(names, 600, 80).then(() => {
        playingTimeoutRef.current = setTimeout(() => {
          setPlayingId(null);
          playingTimeoutRef.current = null;
        }, 200);
      });
    },
    [audio, playingId],
  );

  if (!raga) {
    return (
      <div className={styles.page} role="main">
        <Link href="/journeys/explorer" className={styles.backLink} aria-label="Back to Explorer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Explorer
        </Link>
        <h1 className={styles.ragaName}>Raga not found</h1>
        <p className={styles.description}>
          The raga &ldquo;{ragaId}&rdquo; is not in the current library.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.page}
      data-raga={ragaId}
      variants={stagger}
      initial="hidden"
      animate="visible"
      role="main"
      aria-label={`Raga ${raga.name}`}
    >
      <motion.div variants={fadeUp}>
        <Link href="/journeys/explorer" className={styles.backLink} aria-label="Back to Explorer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Explorer
        </Link>
      </motion.div>

      <motion.header className={styles.ragaHeader} variants={fadeUp}>
        <h1 className={styles.ragaName}>{raga.name}</h1>
        <p className={styles.ragaDevanagari}>{raga.nameDevanagari}</p>
      </motion.header>

      <motion.div className={styles.metaRow} variants={fadeUp}>
        <span className={styles.metaTag}>
          <span className={styles.metaTagLabel}>Time: </span>
          {praharaToTimeLabel(raga.prahara)}
        </span>
        {raga.rasa.map((r) => (
          <span key={r} className={styles.metaTag}>
            <span className={styles.metaTagLabel}>Rasa: </span>
            {rasaToLabel(r)}
          </span>
        ))}
        <span className={styles.metaTag}>
          <span className={styles.metaTagLabel}>Thaat: </span>
          {raga.thaat.charAt(0).toUpperCase() + raga.thaat.slice(1)}
        </span>
        <span className={styles.metaTag}>
          <span className={styles.metaTagLabel}>Jati: </span>
          {jatiToLabel(raga.jati.aroha)}-{jatiToLabel(raga.jati.avaroha)}
        </span>
      </motion.div>

      <motion.p className={styles.description} variants={fadeUp}>
        {raga.description}
      </motion.p>

      <motion.section className={styles.section} variants={fadeUp} aria-label="Ascending and descending scales">
        <h2 className={styles.sectionTitle}>Aroha &amp; Avaroha</h2>
        <div className={styles.scaleRow}>
          <div className={styles.scaleItem}>
            <span className={styles.scaleLabel}>Ascending</span>
            <div className={styles.swaraDots} aria-label="Aroha swaras">
              {raga.aroha.map((note, i) => {
                const isVadi = note.swara === raga.vadi;
                const isSamvadi = note.swara === raga.samvadi;
                let dotClass = styles.swaraDot;
                if (isVadi) dotClass += ' ' + styles.swaraDotVadi;
                else if (isSamvadi) dotClass += ' ' + styles.swaraDotSamvadi;
                return (
                  <div key={note.swara + '-' + note.octave + '-' + String(i)} className={styles.swaraDotWrapper}>
                    <div className={dotClass} />
                    <span className={styles.swaraLabel}>{formatSwaraNote(note)}</span>
                    {note.octave !== 'madhya' && (
                      <span className={styles.octaveLabel}>{note.octave === 'taar' ? 'taar' : 'mandra'}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className={`${styles.scalePlayButton} ${playingId === 'aroha' ? styles.scalePlayButtonActive : ''}`}
              onClick={() => playNotes(raga.aroha, 'aroha')}
              aria-label={playingId === 'aroha' ? 'Stop aroha playback' : 'Play aroha'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                {playingId === 'aroha' ? (
                  <>
                    <rect x="3" y="2" width="3" height="10" rx="0.5" fill="currentColor" />
                    <rect x="8" y="2" width="3" height="10" rx="0.5" fill="currentColor" />
                  </>
                ) : (
                  <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="currentColor" />
                )}
              </svg>
              {playingId === 'aroha' ? 'Stop' : 'Play'}
            </button>
          </div>

          <div className={styles.scaleItem}>
            <span className={styles.scaleLabel}>Descending</span>
            <div className={styles.swaraDots} aria-label="Avaroha swaras">
              {raga.avaroha.map((note, i) => {
                const isVadi = note.swara === raga.vadi;
                const isSamvadi = note.swara === raga.samvadi;
                let dotClass = styles.swaraDot;
                if (isVadi) dotClass += ' ' + styles.swaraDotVadi;
                else if (isSamvadi) dotClass += ' ' + styles.swaraDotSamvadi;
                return (
                  <div key={note.swara + '-' + note.octave + '-' + String(i)} className={styles.swaraDotWrapper}>
                    <div className={dotClass} />
                    <span className={styles.swaraLabel}>{formatSwaraNote(note)}</span>
                    {note.octave !== 'madhya' && (
                      <span className={styles.octaveLabel}>{note.octave === 'taar' ? 'taar' : 'mandra'}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className={`${styles.scalePlayButton} ${playingId === 'avaroha' ? styles.scalePlayButtonActive : ''}`}
              onClick={() => playNotes(raga.avaroha, 'avaroha')}
              aria-label={playingId === 'avaroha' ? 'Stop avaroha playback' : 'Play avaroha'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                {playingId === 'avaroha' ? (
                  <>
                    <rect x="3" y="2" width="3" height="10" rx="0.5" fill="currentColor" />
                    <rect x="8" y="2" width="3" height="10" rx="0.5" fill="currentColor" />
                  </>
                ) : (
                  <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="currentColor" />
                )}
              </svg>
              {playingId === 'avaroha' ? 'Stop' : 'Play'}
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section className={styles.section} variants={fadeUp} aria-label="Characteristic phrases">
        <h2 className={styles.sectionTitle}>Pakad — Characteristic Phrases</h2>
        <div className={styles.pakadList}>
          {raga.pakad.map((phrase, i) => {
            const phraseId = `pakad-${String(i)}`;
            const isPlayingPhrase = playingId === phraseId;
            return (
              <div key={phraseId} className={styles.pakadItem}>
                <span className={styles.pakadSargam}>{formatPhrase(phrase)}</span>
                <button
                  type="button"
                  className={`${styles.pakadPlayButton} ${isPlayingPhrase ? styles.pakadPlayButtonActive : ''}`}
                  onClick={() => playNotes(phrase, phraseId)}
                  aria-label={isPlayingPhrase ? `Stop phrase ${String(i + 1)}` : `Play phrase ${String(i + 1)}: ${formatPhrase(phrase)}`}
                >
                  {isPlayingPhrase ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="3" y="2.5" width="3.5" height="11" rx="0.5" fill="currentColor" />
                      <rect x="9.5" y="2.5" width="3.5" height="11" rx="0.5" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 2.5L13 8L4 13.5V2.5Z" fill="currentColor" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </motion.section>

      {raga.westernBridge && (
        <motion.div className={styles.westernBridge} variants={fadeUp}>
          <button
            type="button"
            className={styles.westernToggle}
            onClick={() => setWesternOpen(!westernOpen)}
            aria-expanded={westernOpen}
            aria-controls="western-bridge-content"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className={`${styles.westernToggleIcon} ${westernOpen ? styles.westernToggleIconOpen : ''}`}
            >
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            For reference — not the frame
          </button>
          {westernOpen && (
            <p id="western-bridge-content" className={styles.westernContent} role="region">
              {raga.westernBridge}
            </p>
          )}
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <Link href="/journeys/explorer" className={styles.backLink} aria-label="Back to Explorer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Explorer
        </Link>
      </motion.div>
    </motion.div>
  );
}
