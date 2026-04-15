/**
 * page.tsx — Journey selection screen
 *
 * Stacked card deck: cards layered like playing cards with physical depth.
 * The active card is on top, fully visible. Others peek out below showing
 * just their title strip. Click a peeking card to bring it to top.
 *
 * Framer Motion spring physics for card transitions.
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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

const CARD_CLASS_MAP: Record<string, string | undefined> = {
  beginner: styles.cardBeginner,
  explorer: styles.cardExplorer,
  scholar: styles.cardScholar,
  master: styles.cardMaster,
};

/** Height of a peeking card tab in px */
const PEEK_HEIGHT = 44;

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const headerVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { user, profile, loading, isGuest } = useAuth();

  const todayRaga = useMemo(() => {
    const hour = new Date().getHours();
    return getRagaForTimeOfDay(hour);
  }, []);

  const [recentRagas, setRecentRagas] = useState<RecentRaga[]>([]);

  useEffect(() => {
    if (user) {
      getRecentRagas(user.id, 3).then(setRecentRagas);
    }
  }, [user]);

  const streak = profile?.streak ?? 0;
  const xp = profile?.xp ?? 0;
  const riyazDone = profile?.riyazDone ?? false;

  // Active card index — default based on user level
  const defaultIndex = useMemo(() => {
    const level = profile?.level ?? 1;
    if (level >= 7) return 3; // master
    if (level >= 4) return 2; // scholar
    if (level >= 2) return 1; // explorer
    return 0; // beginner
  }, [profile?.level]);

  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  useEffect(() => {
    setActiveIndex(defaultIndex);
  }, [defaultIndex]);

  void isGuest;

  if (loading) {
    return <BrandLoader loading={true} tagline="Disciplined practice toward mastery" />;
  }

  // Calculate how many cards are below the active one (peeking out)
  const cardsBelow = JOURNEYS.length - 1 - activeIndex;
  const cardsAbove = activeIndex;

  return (
    <div className={styles.page} data-raga={todayRaga.id}>
      <TanpuraViz active={false} />

      {/* Header */}
      <motion.header
        className={styles.header}
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <Logo size="xl" variant="full" animate />
      </motion.header>

      {/* Status bar */}
      <motion.div
        className={styles.statusBar}
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.statusCell}>
          <span className={`${styles.statusValue} ${streak > 0 ? styles.statusValueAccent : ''}`}>
            {streak}
          </span>
          <span className={styles.statusLabel}>day streak</span>
        </div>

        <div className={styles.statusCenter}>
          <span className={styles.statusLabel}>Today&rsquo;s raga</span>
          <span className={styles.todayName}>
            <span className="romanized-only raga-name">{todayRaga.name}</span>
            {todayRaga.nameDevanagari && (
              <span className="devanagari-only raga-name">{todayRaga.nameDevanagari}</span>
            )}
          </span>
        </div>

        <div className={styles.statusCell}>
          {user ? (
            <>
              <svg className={styles.goalRing} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                <circle className={styles.goalRingBg} cx="14" cy="14" r="11" />
                <circle
                  className={`${styles.goalRingFill} ${riyazDone ? styles.goalRingDone : ''}`}
                  cx="14" cy="14" r="11"
                  strokeDasharray={2 * Math.PI * 11}
                  strokeDashoffset={riyazDone ? 0 : 2 * Math.PI * 11 * 0.75}
                  transform="rotate(-90 14 14)"
                />
              </svg>
              {xp > 0 && <span className={styles.statusLabel}>{xp} XP</span>}
            </>
          ) : (
            <span className={`${styles.statusValue} ${riyazDone ? styles.statusValueDone : ''}`}>
              {riyazDone ? 'Done' : 'Ready'}
            </span>
          )}
          <span className={styles.statusLabel}>riyaz</span>
        </div>
      </motion.div>

      {/* Recently practiced */}
      {recentRagas.length > 0 && (
        <div className={styles.recentRagas}>
          {recentRagas.map((raga) => (
            <span key={raga.ragaId} className={styles.recentRagaName}>
              {raga.ragaName}
            </span>
          ))}
        </div>
      )}

      {/* ================================================================
          CARD DECK — stacked like playing cards
          Active card is fully visible. Cards above/below peek out as tabs.
          ================================================================ */}
      <div
        className={styles.deckContainer}
        role="list"
        aria-label="Choose your journey"
        style={{
          // Reserve space: active card + peek tabs above + peek tabs below
          paddingBottom: cardsBelow * PEEK_HEIGHT,
          paddingTop: cardsAbove * PEEK_HEIGHT,
        }}
      >
        {JOURNEYS.map((journey, i) => {
          const isActive = i === activeIndex;
          const JourneyIcon = getJourneyIcon(journey.id);
          const cardClass = CARD_CLASS_MAP[journey.id] || '';

          // Position: cards above active peek upward, cards below peek downward
          let yOffset = 0;
          let zIndex = 0;

          if (i < activeIndex) {
            // Card above active — peek tab at the top
            yOffset = (i - activeIndex) * PEEK_HEIGHT;
            zIndex = i;
          } else if (i === activeIndex) {
            // Active card — centered
            yOffset = 0;
            zIndex = JOURNEYS.length;
          } else {
            // Card below active — peek tab at the bottom
            yOffset = (i - activeIndex) * PEEK_HEIGHT;
            zIndex = JOURNEYS.length - i;
          }

          return (
            <motion.div
              key={journey.id}
              role="listitem"
              className={`${styles.deckCard} ${cardClass} ${isActive ? styles.deckCardActive : ''}`}
              animate={{
                y: yOffset,
                scale: isActive ? 1 : 0.97,
                opacity: 1,
              }}
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 28,
              }}
              style={{
                zIndex,
                position: 'absolute',
                top: cardsAbove * PEEK_HEIGHT,
                left: 0,
                right: 0,
                cursor: isActive ? 'default' : 'pointer',
              }}
              onClick={() => {
                if (!isActive) setActiveIndex(i);
              }}
            >
              {/* Card header — visible on both active and peeking states */}
              <div className={styles.cardHeader}>
                {JourneyIcon && (
                  <div className={styles.cardIcon}>
                    <JourneyIcon
                      size={isActive ? 28 : 22}
                      color="currentColor"
                    />
                  </div>
                )}
                <div className={styles.cardTitles}>
                  <span className={styles.cardName}>
                    <span className="romanized-only raga-name">{journey.name}</span>
                    <span className="devanagari-only raga-name">{journey.nameDevanagari}</span>
                  </span>
                  <span className={styles.cardEnglish}>{journey.nameEnglish}</span>
                </div>
              </div>

              {/* Card body — only rendered on the active card */}
              {isActive && (
                <motion.div
                  className={styles.cardBody}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <p className={styles.cardDescription}>
                    {journey.description}
                  </p>
                  <Link href={journey.path} className={styles.cardEnter}>
                    Enter
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Freeform strip */}
      <motion.div
        className={styles.freeformStrip}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.4 }}
      >
        <Link href="/journeys/freeform" className={styles.freeformLink}>
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
