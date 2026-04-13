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

        {/* Hindustani primary name — raga-name global class, responds to script toggle */}
        <h1 className={`${styles.journeyName} raga-name`}>
          Guru
        </h1>

        {/* Devanagari secondary — hidden in romanized script mode */}
        <span className={`${styles.journeyDevanagari} swara-text devanagari-only`} aria-hidden="true">
          गुरु
        </span>

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

      {/* Horizon panel — what this journey will contain */}
      <motion.div className={styles.gatePanel} variants={fadeUp} role="region" aria-label="Journey status">
        <p className={styles.gateTitle}>
          This journey is being built.
        </p>

        <p className={styles.gateDescription}>
          The Master journey will contain composition tools, phrase generation,
          teaching mode, and the full 22-shruti palette. The engine becomes
          your instrument. Content is arriving with each update.
        </p>

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
