/**
 * page.tsx — Journey selection screen
 *
 * The entry point to Sadhana. Shows all four journeys in a color-world
 * grid, the Freeform void portal below, the current time-of-day raga,
 * the user's streak, and the tanpura waveform as an ambient background.
 *
 * Auth state is handled by the AuthPill (layout.tsx).
 * No inline auth banner.
 *
 * Per-card color worlds: Beginner (saffron), Explorer (green),
 * Scholar (lapis), Master (gold). Freeform breaks the grid.
 *
 * Framer Motion spring physics:
 *   - Tanpura Release (400/15) for page-load card stagger
 *   - Andolan (120/8) for hover
 *   - Kan (1000/30) for press/tap
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from './components/Logo';
import TanpuraViz from './components/TanpuraViz';
import { getJourneyIcon } from './components/icons';
import FreeformIcon from './components/icons/FreeformIcon';
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
    name: 'Shishya',
    nameDevanagari: '\u0936\u093F\u0937\u094D\u092F',
    nameEnglish: 'Beginner',
    description:
      'Guided daily riyaz. Discover your Sa, sing with the tanpura, learn to hear the swaras.',
    accessible: true,
    minLevel: 0,
    path: '/journeys/beginner',
  },
  {
    id: 'explorer',
    name: 'Sadhaka',
    nameDevanagari: '\u0938\u093E\u0927\u0915',
    nameEnglish: 'Explorer',
    description:
      'Browse ragas by time and emotion. Ear training exercises. Build your phrase library.',
    accessible: true,
    minLevel: 0,
    path: '/journeys/explorer',
  },
  {
    id: 'scholar',
    name: 'Varistha',
    nameDevanagari: '\u0935\u0930\u093F\u0937\u094D\u0920',
    nameEnglish: 'Scholar',
    description:
      'Full raga grammar. Shruti analysis. Deep theory. The engine speaks to you directly.',
    accessible: true,
    minLevel: 0,
    path: '/journeys/scholar',
  },
  {
    id: 'master',
    name: 'Guru',
    nameDevanagari: '\u0917\u0941\u0930\u0941',
    nameEnglish: 'Master',
    description:
      'Composition. Phrase generation. Teaching tools. The engine becomes your instrument.',
    accessible: true,
    minLevel: 0,
    path: '/journeys/master',
  },
];

// ---------------------------------------------------------------------------
// Per-card CSS class map
// ---------------------------------------------------------------------------

const CARD_CLASS_MAP: Record<string, string | undefined> = {
  beginner: styles.cardBeginner,
  explorer: styles.cardExplorer,
  scholar: styles.cardScholar,
  master: styles.cardMaster,
};

// ---------------------------------------------------------------------------
// Animation variants — Tanpura Release spring (400/15)
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
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

const iconVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
      delay: i * 0.08 + 0.04,
    },
  }),
};

const freeformVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
      delay: 0.15 + (4 * 0.08) + 0.12,
    },
  },
};

const freeformIconVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
      delay: 0.15 + (4 * 0.08) + 0.12 + 0.04,
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
  const riyazDone = profile?.riyazDone ?? false;

  // Suppress unused variable warnings — isGuest is consumed
  // by the AuthPill (via layout.tsx), not on the page directly.
  void isGuest;

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

      {/* Daily goal ring */}
      {user && (
        <div className={styles.dailyGoal}>
          <svg className={styles.goalRing} width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
            <circle className={styles.goalRingBg} cx="18" cy="18" r="15" />
            <circle
              className={`${styles.goalRingFill} ${riyazDone ? styles.goalRingDone : ''}`}
              cx="18"
              cy="18"
              r="15"
              strokeDasharray={2 * Math.PI * 15}
              strokeDashoffset={riyazDone ? 0 : 2 * Math.PI * 15 * 0.75}
              transform="rotate(-90 18 18)"
            />
          </svg>
          <div className={styles.goalText}>
            <span className={styles.goalLabel}>Today&rsquo;s riyaz</span>
            <span className={`${styles.goalStatus} ${riyazDone ? styles.goalStatusDone : ''}`}>
              {riyazDone ? 'Complete' : 'Not yet — begin when ready'}
            </span>
          </div>
        </div>
      )}

      {/* Today's raga */}
      <div className={styles.todayRaga}>
        <span className={styles.todayLabel}>Today&rsquo;s raga</span>
        <h2 className={`${styles.todayName} raga-name`}>{todayRaga.name}</h2>
        {todayRaga.nameDevanagari && (
          <span className={`${styles.todayDevanagari} devanagari-only`}>{todayRaga.nameDevanagari}</span>
        )}
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
        {JOURNEYS.map((journey, i) => {
          const isLocked = !journey.accessible;
          const JourneyIcon = getJourneyIcon(journey.id);
          const cardClass = CARD_CLASS_MAP[journey.id] || '';

          // Card content — shared between locked and linked states
          const cardContent = (
            <>
              {JourneyIcon && (
                <motion.div
                  className={styles.journeyIconWrap}
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  <JourneyIcon
                    size={48}
                    color={isLocked ? 'var(--text-3)' : 'var(--text-2)'}
                  />
                </motion.div>
              )}
              <span className={`${styles.journeyName} raga-name`}>{journey.name}</span>
              <span className={`${styles.journeyDevanagari} swara-text devanagari-only`}>
                {journey.nameDevanagari}
              </span>
              <span className={styles.journeyEnglish}>
                {journey.nameEnglish}
              </span>
              <p className={styles.journeyDescription}>
                {journey.description}
              </p>
              {isLocked && (
                <span className={styles.journeyLockMessage}>
                  Coming soon — reach {journey.minLevel <= 4 ? 'Sadhaka' : 'Varistha'} level
                </span>
              )}
            </>
          );

          if (isLocked) {
            return (
              <motion.div
                key={journey.id}
                variants={cardVariants}
                role="listitem"
              >
                <Link
                  href={journey.path}
                  className={`${styles.journeyCard} ${styles.journeyCardLocked} ${cardClass}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {cardContent}
                </Link>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={journey.id}
              variants={cardVariants}
              role="listitem"
              whileHover={{
                scale: 1.015,
                transition: {
                  type: 'spring',
                  stiffness: 120,
                  damping: 8,
                },
              }}
              whileTap={{
                scale: 0.98,
                y: 2,
                transition: {
                  type: 'spring',
                  stiffness: 1000,
                  damping: 30,
                },
              }}
            >
              <Link
                href={journey.path}
                className={`${styles.journeyCard} ${cardClass}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {cardContent}
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Freeform Riyaz — standalone card, full-width void portal */}
      <motion.div
        variants={freeformVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', maxWidth: 'var(--max-width)', padding: '0 var(--space-4)' }}
        whileHover={{
          scale: 1.01,
          transition: {
            type: 'spring',
            stiffness: 120,
            damping: 8,
          },
        }}
        whileTap={{
          scale: 0.99,
          transition: {
            type: 'spring',
            stiffness: 1000,
            damping: 30,
          },
        }}
      >
        <Link
          href="/journeys/freeform"
          className={styles.freeformCard}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <motion.div
            className={styles.freeformIconWrap}
            variants={freeformIconVariants}
            initial="hidden"
            animate="visible"
          >
            <FreeformIcon size={40} color="var(--text-3)" />
          </motion.div>
          <span className={`${styles.freeformName} raga-name`}>Swatantra Riyaz</span>
          <span className={`${styles.freeformDevanagari} swara-text devanagari-only`}>{'\u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930 \u0930\u093F\u092F\u093E\u091C\u093C'}</span>
          <span className={styles.freeformEnglish}>Freeform</span>
          <p className={styles.freeformDescription}>
            No goals. No exercises. Just you and the raga.
          </p>
        </Link>
      </motion.div>
    </div>
  );
}
