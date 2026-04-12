/**
 * page.tsx — Journey selection screen
 *
 * The entry point to Sadhana. Shows all four journeys, the current
 * time-of-day raga, the user's streak, and the tanpura waveform
 * as an ambient background.
 *
 * Beginner: fully accessible.
 * Explorer: partially accessible.
 * Scholar/Master: locked behind level gate.
 *
 * Framer Motion: journeys animate in with stagger.
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from './components/Logo';
import TanpuraViz from './components/TanpuraViz';
import { getRagaForTimeOfDay } from '@/engine/theory';
import type { JourneyMeta } from './lib/types';
import styles from './styles/home.module.css';

// ---------------------------------------------------------------------------
// Journey definitions
// ---------------------------------------------------------------------------

const JOURNEYS: JourneyMeta[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    nameSanskrit: 'Arambh',
    description:
      'Guided daily riyaz. Discover your Sa, sing with the tanpura, learn to hear the swaras.',
    accessible: true,
    minLevel: 0,
    path: '/journeys/beginner',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    nameSanskrit: 'Anveshana',
    description:
      'Browse ragas by time and emotion. Ear training exercises. Build your phrase library.',
    accessible: true,
    minLevel: 0,
    path: '/journeys/explorer',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    nameSanskrit: 'Vidvan',
    description:
      'Full raga grammar. Shruti analysis. Deep theory. The engine speaks to you directly.',
    accessible: false,
    minLevel: 4,
    path: '/journeys/scholar',
  },
  {
    id: 'master',
    name: 'Master',
    nameSanskrit: 'Acharya',
    description:
      'Composition. Phrase generation. Teaching tools. The engine becomes your instrument.',
    accessible: false,
    minLevel: 7,
    path: '/journeys/master',
  },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  // Determine today's raga based on the current hour
  const todayRaga = useMemo(() => {
    const hour = new Date().getHours();
    return getRagaForTimeOfDay(hour);
  }, []);

  // Placeholder streak — will be hydrated from Supabase
  const streak = 0;

  return (
    <div className={styles.page}>
      {/* Ambient tanpura waveform background */}
      <TanpuraViz active={false} />

      {/* Header: logo + tagline */}
      <motion.header
        className={styles.header}
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <Logo size={48} variant="full" />
        <p className={styles.tagline}>
          Disciplined practice toward mastery
        </p>
      </motion.header>

      {/* Streak indicator */}
      <div className={styles.streak}>
        <span
          className={`${styles.streakCount} ${streak > 0 ? styles.streakActive : ''}`}
        >
          {streak}
        </span>
        <span className={styles.streakLabel}>day streak</span>
      </div>

      {/* Today's raga */}
      <div className={styles.todayRaga}>
        <span className={styles.todayLabel}>Today&rsquo;s raga</span>
        <h2 className={styles.todayName}>{todayRaga.name}</h2>
      </div>

      {/* Journey selection grid */}
      <motion.div
        className={styles.journeyGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        role="list"
        aria-label="Choose your journey"
      >
        {JOURNEYS.map((journey) => {
          const isLocked = !journey.accessible;

          const card = (
            <motion.div
              key={journey.id}
              className={`${styles.journeyCard} ${isLocked ? styles.journeyCardLocked : ''}`}
              variants={cardVariants}
              role="listitem"
            >
              <span className={styles.journeyName}>{journey.name}</span>
              <span className={styles.journeySanskrit}>
                {journey.nameSanskrit}
              </span>
              <p className={styles.journeyDescription}>
                {journey.description}
              </p>
              {isLocked && (
                <span className={styles.journeyLockMessage}>
                  Coming soon — reach Sadhaka level
                </span>
              )}
            </motion.div>
          );

          if (isLocked) return card;

          return (
            <Link
              key={journey.id}
              href={journey.path}
              className={styles.journeyCard}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <motion.div variants={cardVariants} role="listitem">
                <span className={styles.journeyName}>{journey.name}</span>
                <span className={styles.journeySanskrit}>
                  {journey.nameSanskrit}
                </span>
                <p className={styles.journeyDescription}>
                  {journey.description}
                </p>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
