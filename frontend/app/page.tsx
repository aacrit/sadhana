/**
 * page.tsx — Journey selection screen
 *
 * Redesigned: status bar + accordion journey deck + freeform strip.
 * Stacked card deck — one expanded at a time, others collapsed.
 * Icon inline left of title, Devanagari replaces romanized (not appends).
 *
 * Framer Motion spring physics:
 *   - Tanpura Release (400/15) for page-load stagger
 *   - Andolan (120/8) for hover
 *   - Kan (1000/30) for press/tap
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './components/Logo';
import BrandLoader from './components/BrandLoader';
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
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
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

const expandVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { type: 'spring' as const, stiffness: 400, damping: 30 },
      opacity: { duration: 0.15 },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { type: 'spring' as const, stiffness: 300, damping: 25 },
      opacity: { duration: 0.25, delay: 0.05 },
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

  // Expanded journey card — default to beginner (Shishya), or current progress
  const defaultJourney = useMemo(() => {
    const level = profile?.level ?? 1;
    if (level >= 7) return 'master';
    if (level >= 4) return 'scholar';
    if (level >= 2) return 'explorer';
    return 'beginner';
  }, [profile?.level]);

  const [expandedId, setExpandedId] = useState<string>(defaultJourney);

  // Update expanded card when profile loads
  useEffect(() => {
    setExpandedId(defaultJourney);
  }, [defaultJourney]);

  void isGuest;

  // Loading state
  if (loading) {
    return (
      <BrandLoader loading={true} tagline="Disciplined practice toward mastery" />
    );
  }

  return (
    <div className={styles.page} data-raga={todayRaga.id}>
      {/* Ambient tanpura waveform background */}
      <TanpuraViz active={false} />

      {/* Header: logo */}
      <motion.header
        className={styles.header}
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <Logo size="xl" variant="full" animate />
      </motion.header>

      {/* Status bar: streak | today's raga | daily goal */}
      <motion.div
        className={styles.statusBar}
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Streak */}
        <div className={styles.statusCell}>
          <span className={`${styles.statusValue} ${streak > 0 ? styles.statusValueAccent : ''}`}>
            {streak}
          </span>
          <span className={styles.statusLabel}>day streak</span>
        </div>

        {/* Today's raga — center, prominent */}
        <div className={styles.statusCenter}>
          <span className={styles.statusLabel}>Today&rsquo;s raga</span>
          <span className={styles.todayName}>
            <span className="romanized-only raga-name">{todayRaga.name}</span>
            {todayRaga.nameDevanagari && (
              <span className="devanagari-only raga-name">{todayRaga.nameDevanagari}</span>
            )}
          </span>
        </div>

        {/* Daily goal / XP */}
        <div className={styles.statusCell}>
          {user ? (
            <>
              <svg className={styles.goalRing} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                <circle className={styles.goalRingBg} cx="14" cy="14" r="11" />
                <circle
                  className={`${styles.goalRingFill} ${riyazDone ? styles.goalRingDone : ''}`}
                  cx="14"
                  cy="14"
                  r="11"
                  strokeDasharray={2 * Math.PI * 11}
                  strokeDashoffset={riyazDone ? 0 : 2 * Math.PI * 11 * 0.75}
                  transform="rotate(-90 14 14)"
                />
              </svg>
              {xp > 0 && (
                <span className={styles.statusLabel}>{xp} XP</span>
              )}
            </>
          ) : (
            <span className={`${styles.statusValue} ${riyazDone ? styles.statusValueDone : ''}`}>
              {riyazDone ? 'Done' : 'Ready'}
            </span>
          )}
          <span className={styles.statusLabel}>riyaz</span>
        </div>
      </motion.div>

      {/* Recently practiced (inline pills) */}
      {recentRagas.length > 0 && (
        <div className={styles.recentRagas}>
          {recentRagas.map((raga) => (
            <span key={raga.ragaId} className={styles.recentRagaName}>
              {raga.ragaName}
            </span>
          ))}
        </div>
      )}

      {/* Journey deck — accordion cards */}
      <motion.div
        className={styles.journeyDeck}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        role="list"
        aria-label="Choose your journey"
      >
        {JOURNEYS.map((journey, i) => {
          const isExpanded = expandedId === journey.id;
          const JourneyIcon = getJourneyIcon(journey.id);
          const cardClass = CARD_CLASS_MAP[journey.id] || '';

          return (
            <motion.div
              key={journey.id}
              variants={cardVariants}
              role="listitem"
              className={styles.deckSlot}
            >
              {/* Card header — always visible */}
              <button
                type="button"
                className={`${styles.deckCard} ${cardClass} ${isExpanded ? styles.deckCardExpanded : ''}`}
                onClick={() => setExpandedId(isExpanded ? '' : journey.id)}
                aria-expanded={isExpanded}
                aria-controls={`journey-${journey.id}`}
              >
                <div className={styles.deckCardHeader}>
                  {JourneyIcon && (
                    <motion.div
                      className={styles.deckIcon}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 0.8, scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                        delay: i * 0.06 + 0.04,
                      }}
                    >
                      <JourneyIcon
                        size={isExpanded ? 32 : 24}
                        color="currentColor"
                      />
                    </motion.div>
                  )}

                  <div className={styles.deckTitles}>
                    {/* Primary name — romanized/devanagari swap */}
                    <span className={styles.deckName}>
                      <span className="romanized-only raga-name">{journey.name}</span>
                      <span className="devanagari-only raga-name">{journey.nameDevanagari}</span>
                    </span>

                    {/* English subtitle */}
                    <span className={styles.deckEnglish}>{journey.nameEnglish}</span>
                  </div>

                  {/* Expand chevron */}
                  <svg
                    className={`${styles.deckChevron} ${isExpanded ? styles.deckChevronOpen : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    id={`journey-${journey.id}`}
                    className={`${styles.deckBody} ${cardClass}`}
                    variants={expandVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    style={{ overflow: 'hidden' }}
                  >
                    <p className={styles.deckDescription}>
                      {journey.description}
                    </p>
                    <Link
                      href={journey.path}
                      className={styles.deckEnter}
                    >
                      Enter
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Freeform strip — always accessible at the bottom */}
      <motion.div
        className={styles.freeformStrip}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 15,
          delay: 0.4,
        }}
      >
        <Link
          href="/journeys/freeform"
          className={styles.freeformLink}
        >
          <FreeformIcon size={24} color="var(--text-3)" />
          <span className={styles.freeformName}>
            <span className="romanized-only raga-name">Swatantra Riyaz</span>
            <span className="devanagari-only raga-name">{'\u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930 \u0930\u093F\u092F\u093E\u091C\u093C'}</span>
          </span>
          <span className={styles.freeformLabel}>Freeform</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={styles.freeformArrow}>
            <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </motion.div>
    </div>
  );
}
