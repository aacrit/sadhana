/**
 * Scholar journey — locked placeholder (Varistha)
 *
 * Varistha (वरिष्ठ) — the advanced practitioner. Level 4 gate.
 * Lapis ground, gold zarr-kashi hairlines.
 *
 * This page is not functional. No auth checks. No lesson loading.
 * It shows what is waiting when the student has earned it — full raga
 * grammar, shruti analysis, the engine speaking directly.
 *
 * Typography:
 *   Journey name    → Cormorant Garamond (raga-name global class)
 *   Devanagari      → Noto Serif Devanagari (swara-text devanagari-only)
 *   English label   → Inter, uppercase, tracked
 *   Feature text    → Inter
 *   Level mark      → IBM Plex Mono
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '../../styles/scholar.module.css';

// ---------------------------------------------------------------------------
// What this journey contains — concise, aspirational
// ---------------------------------------------------------------------------

const FEATURES = [
  "Full raga grammar: every swara's role in the ascending and descending phrase, the permitted ornaments, the forbidden approaches.",
  'Shruti analysis: the engine maps your pitch to all 22 shrutis and shows exactly which variant you are singing — Shuddh Gandhar or Antara?',
  'Raga phrase library: characteristic phrases (pakad) of each raga, with sung demonstrations and notation.',
  'Thaat relationships: see how the 10 parent scales connect, where ragas overlap, and where they diverge.',
  "Deep theory notes: the engine's musicological objects rendered as readable scholarship, not software documentation.",
] as const;

// ---------------------------------------------------------------------------
// Animation variants — headerVariants (page.tsx pattern)
// ---------------------------------------------------------------------------

const headerVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
    },
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ScholarPage() {
  return (
    <motion.div
      className={styles.page}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Back navigation */}
      <motion.div variants={headerVariants} style={{ width: '100%' }}>
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

      {/* Header — three-voice naming */}
      <motion.header className={styles.header} variants={fadeUp}>
        {/* Level badge */}
        <span className={styles.levelBadge} aria-label="Level: Varistha">
          <span
            className="swara-text devanagari-only"
            aria-hidden="true"
          >
            वरिष्ठ
          </span>
          <span className="romanized-only">Varistha</span>
        </span>

        {/* Primary name — romanized/devanagari swap (replace, not append) */}
        <h1 className={styles.journeyName}>
          <span className="romanized-only raga-name">Varistha</span>
          <span className="devanagari-only raga-name">वरिष्ठ</span>
        </h1>

        {/* English tertiary */}
        <span className={styles.journeyEnglish}>Scholar</span>
      </motion.header>

      {/* Feature list — what the journey contains */}
      <motion.section
        className={styles.featureList}
        variants={staggerContainer}
        aria-label="Scholar journey capabilities"
      >
        {FEATURES.map((text, i) => (
          <motion.div
            key={i}
            className={styles.featureItem}
            variants={fadeUp}
          >
            <span className={styles.featureMark} aria-hidden="true" />
            <p className={styles.featureText}>{text}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Engine reference — surfaces the engine's swara/shruti definitions
          as readable scholarship. T2.4 of the enhancement plan. */}
      <motion.section
        className={styles.lessonSection}
        variants={fadeUp}
        aria-label="Engine reference"
      >
        <h2 className={styles.lessonHeading}>Engine reference</h2>
        <p className={styles.lessonIntro}>
          The engine&rsquo;s twelve swaras as they exist in code — exact
          ratios, cents from Sa, deviation from equal temperament, every one
          playable. Read music theory the way a musicologist would.
        </p>
        <Link
          href="/journeys/scholar/reference"
          className={styles.lessonTile}
          style={{ maxWidth: 320, margin: '0 auto' }}
        >
          <span className={styles.lessonNum}>00</span>
          <span className={styles.lessonTitle}>The 12 swaras</span>
          <span className={styles.lessonRaga}>Reference</span>
        </Link>
      </motion.section>

      {/* Lesson catalog — the Varistha curriculum (11 lessons). Wired to
          /journeys/scholar/lessons/[id]. Level gating (require completion of
          Sadhaka challenge) is enforced by T1.3's progression engine; for
          now, lessons are reachable but the engine logs progress so the gate
          can be applied later. */}
      <motion.section
        className={styles.lessonSection}
        variants={fadeUp}
        aria-label="Varistha lessons"
      >
        <h2 className={styles.lessonHeading}>Varistha lessons</h2>
        <p className={styles.lessonIntro}>
          Eleven lessons. Each takes a single raga or technique and explores
          it deeply. Marwa, Darbari, Puriya Dhanashri, Malkauns, Todi — the
          masters&rsquo; ragas. Then a tala integration session, and a
          challenge that opens the Guru gate.
        </p>
        <div className={styles.lessonGrid}>
          {[
            { id: 'varistha-01-marwa', num: 1, title: 'The Absent Fifth', raga: 'Marwa' },
            { id: 'varistha-02-raga-comparison', num: 2, title: 'Same Thaat, Different Worlds', raga: 'Comparison' },
            { id: 'varistha-03-darbari', num: 3, title: 'The Profound Andolan', raga: 'Darbari' },
            { id: 'varistha-04-composition', num: 4, title: 'Creating Valid Phrases', raga: 'Composition' },
            { id: 'varistha-05-puriya-dhanashri', num: 5, title: 'Evening Tension', raga: 'Puriya Dhanashri' },
            { id: 'varistha-06-ornament-mastery', num: 6, title: 'Where Ornaments Belong', raga: 'Ornaments' },
            { id: 'varistha-07-malkauns', num: 7, title: 'Power in Five Notes', raga: 'Malkauns' },
            { id: 'varistha-08-shruti', num: 8, title: 'The 22 Positions', raga: 'Shruti' },
            { id: 'varistha-09-todi', num: 9, title: 'Chromatic Density', raga: 'Todi' },
            { id: 'varistha-10-tala-integration', num: 10, title: 'Melody Meets Rhythm', raga: 'Tala' },
            { id: 'varistha-11-challenge', num: 11, title: 'Varistha Challenge', raga: 'Mastery' },
          ].map((lesson) => (
            <Link
              key={lesson.id}
              href={`/journeys/scholar/lessons/${lesson.id}`}
              className={styles.lessonTile}
            >
              <span className={styles.lessonNum}>{String(lesson.num).padStart(2, '0')}</span>
              <span className={styles.lessonTitle}>{lesson.title}</span>
              <span className={styles.lessonRaga}>{lesson.raga}</span>
            </Link>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
