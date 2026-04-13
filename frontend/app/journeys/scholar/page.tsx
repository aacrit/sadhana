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

        {/* Hindustani primary name — raga-name global class, responds to script toggle */}
        <h1 className={`${styles.journeyName} raga-name`}>
          Varistha
        </h1>

        {/* Devanagari secondary — hidden in romanized script mode */}
        <span className={`${styles.journeyDevanagari} swara-text devanagari-only`} aria-hidden="true">
          वरिष्ठ
        </span>

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

      {/* Gate panel — lock message + CTA */}
      <motion.div className={styles.gatePanel} variants={fadeUp} role="region" aria-label="Access gate">
        {/* Lock icon — SVG, no filled shapes */}
        <svg
          className={styles.gateLockIcon}
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="7"
            y="14"
            width="18"
            height="13"
            rx="2"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M11 14V10a5 5 0 0 1 10 0v4"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <circle
            cx="16"
            cy="20.5"
            r="1.5"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>

        <p className={styles.gateTitle}>
          Continue your practice to unlock this journey.
        </p>

        <p className={styles.gateDescription}>
          The Scholar journey opens when the engine recognises you as Varistha —
          a practitioner who has sung correctly across multiple ragas, returned
          consistently, and begun to hear the shrutis as distinct. There is no
          shortcut. The practice itself is the key.
        </p>

        <span className={styles.gateLevel} aria-label="Minimum level required: 4">
          min_level: 4 / Varistha
        </span>

        <Link href="/" className={styles.practiceLink}>
          Return to practice
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
      </motion.div>
    </motion.div>
  );
}
