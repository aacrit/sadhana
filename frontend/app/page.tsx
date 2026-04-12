/**
 * page.tsx — Journey selection screen
 *
 * The entry point to Sadhana. Shows all four journeys, the current
 * time-of-day raga, the user's streak, and the tanpura waveform
 * as an ambient background.
 *
 * Auth-aware:
 *   - Shows real XP, level, streak from profile if signed in
 *   - Falls back to zeros for guests
 *   - Shows a non-blocking sign-in banner if not authenticated and not guest
 *   - Loading state: pulsing saffron dot
 *
 * Beginner: fully accessible.
 * Explorer: partially accessible.
 * Scholar/Master: locked behind level gate.
 *
 * Framer Motion: journeys animate in with stagger.
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from './components/Logo';
import TanpuraViz from './components/TanpuraViz';
import { useAuth } from './lib/auth';
import { getRecentRagas } from './lib/supabase';
import { getRagaForTimeOfDay } from '@/engine/theory';
import type { JourneyMeta, RecentRaga } from './lib/types';
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
// Guest flag helper
// ---------------------------------------------------------------------------

function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('sadhana_guest') === 'true';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { user, profile, loading, isGuest } = useAuth();

  // Determine today's raga based on the current hour
  const todayRaga = useMemo(() => {
    const hour = new Date().getHours();
    return getRagaForTimeOfDay(hour);
  }, []);

  // Recent ragas (fetched from Supabase for signed-in users)
  const [recentRagas, setRecentRagas] = useState<RecentRaga[]>([]);

  useEffect(() => {
    if (user) {
      getRecentRagas(user.id, 3).then(setRecentRagas);
    }
  }, [user]);

  // Use profile data if available, otherwise fall back to defaults
  const streak = profile?.streak ?? 0;
  const xp = profile?.xp ?? 0;

  // Show auth banner if not signed in and not in guest mode
  const showAuthBanner = !loading && !user && !isGuest && !isGuestMode();

  // Loading state
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingDot} aria-label="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} data-raga={todayRaga.id}>
      {/* Ambient tanpura waveform background */}
      <TanpuraViz active={false} />

      {/* Auth banner (non-blocking) */}
      {showAuthBanner && (
        <Link href="/auth" className={styles.authBanner}>
          <span className={styles.authBannerText}>
            Sign in to save your progress
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      )}

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

      {/* XP display (only if signed in and has XP) */}
      {user && xp > 0 && (
        <div className={styles.xpDisplay}>
          <span className={styles.xpValue}>{xp}</span>
          <span className={styles.xpUnit}>XP</span>
        </div>
      )}

      {/* Recently practiced ragas */}
      {recentRagas.length > 0 && (
        <div className={styles.recentRagas}>
          <span className={styles.recentLabel}>Recently practiced</span>
          <div className={styles.recentList}>
            {recentRagas.map((raga) => (
              <span key={raga.ragaId} className={styles.recentRagaName}>
                {raga.ragaName}
              </span>
            ))}
          </div>
        </div>
      )}

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

      {/* Freeform Riyaz — standalone card, separate from structured journeys */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', maxWidth: 'var(--max-width)', padding: '0 var(--space-4)' }}
      >
        <Link
          href="/journeys/freeform"
          className={styles.freeformCard}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <span className={styles.freeformName}>Freeform Riyaz</span>
          <span className={styles.freeformSanskrit}>Swatantra</span>
          <p className={styles.freeformDescription}>
            No goals. No exercises. Just you and the raga.
          </p>
        </Link>
      </motion.div>
    </div>
  );
}
