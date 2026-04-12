/**
 * Beginner journey home — the daily riyaz entry point.
 *
 * Shows:
 * - Today's riyaz (raga for current time of day) with "Begin" button
 * - Progress: current level, XP bar, streak
 * - Recently practiced ragas
 * - "What is Sadhana?" callout for first-time users
 *
 * Framer Motion layout animations with stagger.
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getRagaForTimeOfDay } from '@/engine/theory';
import { DEFAULT_USER, getLevelTitle, getLevelColor } from '../../lib/types';
import type { RecentRaga } from '../../lib/types';
import styles from '../../styles/beginner.module.css';

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
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
// Prahara label
// ---------------------------------------------------------------------------

function getTimeOfDayLabel(hour: number): string {
  if (hour >= 6 && hour < 9) return 'Dawn';
  if (hour >= 9 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 15) return 'Afternoon';
  if (hour >= 15 && hour < 18) return 'Late afternoon';
  if (hour >= 18 && hour < 21) return 'Evening';
  if (hour >= 21) return 'Night';
  if (hour >= 0 && hour < 3) return 'Midnight';
  return 'Pre-dawn';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BeginnerPage() {
  const hour = new Date().getHours();
  const todayRaga = useMemo(() => getRagaForTimeOfDay(hour), [hour]);
  const timeLabel = getTimeOfDayLabel(hour);

  // Placeholder state — will be hydrated from Supabase
  const user = DEFAULT_USER;
  const levelTitle = getLevelTitle(user.level);
  const levelColor = getLevelColor(user.level);
  const xpProgress = Math.min((user.xp % 100) / 100, 1);

  // Placeholder recent ragas — empty for first-time user
  const recentRagas: RecentRaga[] = [];

  const isFirstTime = user.lastPractice === null;

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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Journeys
        </Link>
      </motion.div>

      {/* Page title */}
      <motion.h1 className={styles.title} variants={fadeUp}>
        Daily Riyaz
      </motion.h1>

      {/* Today's riyaz card */}
      <motion.section className={styles.riyazCard} variants={fadeUp} aria-label="Today's practice">
        <span className={styles.riyazLabel}>{timeLabel} raga</span>
        <h2 className={styles.riyazRaga}>{todayRaga.name}</h2>
        <p className={styles.riyazDescription}>
          {todayRaga.description}
        </p>
        <span className={styles.riyazTime}>
          Prahara {todayRaga.prahara.join(', ')}
        </span>
        {user.riyazDone ? (
          <span className={styles.riyazDone}>
            Today&rsquo;s riyaz complete
          </span>
        ) : (
          <button
            className={styles.beginButton}
            type="button"
            aria-label={`Begin practice with raga ${todayRaga.name}`}
          >
            Begin
          </button>
        )}
      </motion.section>

      {/* Progress */}
      <motion.section
        className={styles.progressSection}
        variants={fadeUp}
        aria-label="Your progress"
      >
        <h3 className={styles.sectionTitle}>Progress</h3>
        <div className={styles.progressRow}>
          <div className={styles.levelBadge}>
            <span
              className={styles.levelTitle}
              style={{ color: levelColor }}
            >
              {levelTitle}
            </span>
            <span className={styles.levelNumber}>Lv {user.level}</span>
          </div>

          <div className={styles.xpBar} role="progressbar" aria-valuenow={user.xp} aria-valuemin={0} aria-valuemax={100} aria-label="Experience points">
            <div
              className={styles.xpFill}
              style={{ width: `${xpProgress * 100}%` }}
            />
          </div>
          <span className={styles.xpLabel}>{user.xp} XP</span>

          <div className={styles.streakBadge}>
            <span
              className={`${styles.streakValue} ${user.streak > 0 ? styles.streakValueActive : ''}`}
            >
              {user.streak}
            </span>
            <span className={styles.streakText}>day streak</span>
          </div>
        </div>
      </motion.section>

      {/* Recently practiced */}
      <motion.section
        className={styles.recentSection}
        variants={fadeUp}
        aria-label="Recently practiced ragas"
      >
        <h3 className={styles.sectionTitle}>Recently practiced</h3>
        {recentRagas.length === 0 ? (
          <p className={styles.emptyRecent}>
            No practice sessions yet. Begin your first riyaz above.
          </p>
        ) : (
          recentRagas.map((recent) => (
            <div key={recent.ragaId} className={styles.recentCard}>
              <span className={styles.recentRagaName}>{recent.ragaName}</span>
              <span className={styles.recentAccuracy}>
                {Math.round(recent.bestAccuracy * 100)}%
              </span>
            </div>
          ))
        )}
      </motion.section>

      {/* First-time user callout */}
      {isFirstTime && (
        <motion.aside className={styles.callout} variants={fadeUp} aria-label="About Sadhana">
          <h3 className={styles.calloutTitle}>What is Sadhana?</h3>
          <p className={styles.calloutText}>
            Sadhana means disciplined practice toward mastery. This is not a
            music theory course. You will sing. The tanpura will drone. The app
            will listen to your pitch in real time and guide you — not with
            words, but with sound. Five to fifteen minutes a day. One raga at a
            time. The tradition teaches through practice, not explanation.
          </p>
        </motion.aside>
      )}
    </motion.div>
  );
}
