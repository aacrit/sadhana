/**
 * Master journey — locked placeholder (Guru)
 *
 * Guru (गुरु) — the teacher. Level 7 gate.
 * Warm dark ground (#12100A → #221E0E), gold zarr-kashi throughout.
 *
 * This page is not functional. No auth checks. No lesson loading.
 * It shows what waits at the highest level — composition, phrase generation,
 * the engine as instrument.
 *
 * Typography:
 *   Journey name    → Cormorant Garamond (raga-name global class)
 *   Devanagari      → Noto Serif Devanagari (swara-text devanagari-only)
 *   English label   → Inter, uppercase, tracked
 *   Feature text    → Inter
 *   Level mark      → IBM Plex Mono
 *
 * Gold rule: used ONLY as hairline borders and single-point marks (zarr-kashi).
 * Never as a fill. The .featureMark is a rotated-diamond outline only.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '../../styles/master.module.css';

// ---------------------------------------------------------------------------
// What this journey contains — concise, aspirational
// ---------------------------------------------------------------------------

const FEATURES = [
  'Composition tools: construct original bandish by assembling phrases the engine validates against raga grammar in real time.',
  'Phrase generation: given a raga, a mood (rasa), and a time constraint, the engine proposes phrase-level material for your riyaz.',
  'Teaching mode: annotate your own phrases, mark correct and incorrect passages, export sessions as study material.',
  'Raga analysis: sing freely; the engine identifies which raga your improvisation most closely inhabits and why.',
  'Full shruti palette: access all 22 shrutis as playable, singable targets — not just the 12 equal-tempered positions.',
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

export default function MasterPage() {
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
        <span className={styles.levelBadge} aria-label="Level: Guru">
          <span
            className="swara-text devanagari-only"
            aria-hidden="true"
          >
            गुरु
          </span>
          <span className="romanized-only">Guru</span>
        </span>

        {/* Primary name — romanized/devanagari swap (replace, not append) */}
        <h1 className={styles.journeyName}>
          <span className="romanized-only raga-name">Guru</span>
          <span className="devanagari-only raga-name">गुरु</span>
        </h1>

        {/* English tertiary */}
        <span className={styles.journeyEnglish}>Master</span>
      </motion.header>

      {/* Feature list — what the journey contains */}
      <motion.section
        className={styles.featureList}
        variants={staggerContainer}
        aria-label="Master journey capabilities"
      >
        {FEATURES.map((text, i) => (
          <motion.div
            key={i}
            className={styles.featureItem}
            variants={fadeUp}
          >
            {/* Diamond mark — zarr-kashi, outline only */}
            <span className={styles.featureMark} aria-hidden="true" />
            <p className={styles.featureText}>{text}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Lesson catalog — the Guru curriculum (10 lessons). Wired to
          /journeys/master/lessons/[id]. Level gating defers to T1.3's
          progression engine. */}
      <motion.section
        className={styles.lessonSection}
        variants={fadeUp}
        aria-label="Guru lessons"
      >
        <h2 className={styles.lessonHeading}>Guru lessons</h2>
        <p className={styles.lessonIntro}>
          Ten lessons that take you from Varistha to Guru. Bandish composition,
          modulation, taan patterns, and the complete rendering of a raga
          (alap → jod → jhala). The teaching exercise asks you to explain a
          raga back to the engine. Open mastery has no script.
        </p>
        <div className={styles.lessonGrid}>
          {[
            { id: 'guru-01-raga-id-advanced', num: 1, title: 'The Listening Guru', raga: 'Identification' },
            { id: 'guru-02-bandish', num: 2, title: 'The Fixed Composition', raga: 'Bandish' },
            { id: 'guru-03-bhairavi', num: 3, title: 'The Flexible Raga', raga: 'Bhairavi' },
            { id: 'guru-04-modulation', num: 4, title: 'Where One Becomes Another', raga: 'Modulation' },
            { id: 'guru-05-taan', num: 5, title: 'The Fast Run', raga: 'Taan' },
            { id: 'guru-06-kedar-hameer', num: 6, title: 'The Two Mas', raga: 'Kedar / Hameer' },
            { id: 'guru-07-sohini-marwa', num: 7, title: 'Same Constraint, Different Worlds', raga: 'Sohini / Marwa' },
            { id: 'guru-08-raga-rendering', num: 8, title: 'The Complete Rendering', raga: 'Alap—Jod—Jhala' },
            { id: 'guru-09-teaching', num: 9, title: 'The Guru Teaches', raga: 'Teaching' },
            { id: 'guru-10-open-mastery', num: 10, title: 'No Ceiling', raga: 'Open Mastery' },
          ].map((lesson) => (
            <Link
              key={lesson.id}
              href={`/journeys/master/lessons/${lesson.id}`}
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
