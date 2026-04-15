/**
 * Beginner journey — home view
 *
 * Daily riyaz card, progress, recent ragas, and lesson catalog.
 * All lessons route to /journeys/beginner/lessons/[id] which uses
 * the YAML-driven LessonClient + useLessonEngine + LessonRenderer system.
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getRagaForTimeOfDay } from '@/engine/theory';
import { DEFAULT_USER, getLevelTitle, getLevelColor } from '../../lib/types';
import type { RecentRaga } from '../../lib/types';
import { useAuth } from '../../lib/auth';
import { getRecentRagas } from '../../lib/supabase';
import homeStyles from '../../styles/beginner.module.css';

// ---------------------------------------------------------------------------
// Beginner lesson catalog (matches YAML files in content/curriculum/)
// ---------------------------------------------------------------------------

const BEGINNER_LESSONS = [
  { id: 'beginner-01-bhoopali', num: 1, title: 'Your First Raga', subtitle: 'Meet the five notes of Bhoopali', raga: 'Bhoopali', accent: '#E8871E' },
  { id: 'beginner-02-sa-pa-drone', num: 2, title: 'Sa and Pa', subtitle: 'The anchor and its perfect fifth', raga: 'Drone', accent: '#B8A99A' },
  { id: 'beginner-03-yaman', num: 3, title: 'Evening Light', subtitle: 'Tivra Ma opens the evening sky', raga: 'Yaman', accent: '#C17817' },
  { id: 'beginner-04-bhairav', num: 4, title: 'Dawn Austerity', subtitle: 'Komal Re and Dha at first light', raga: 'Bhairav', accent: '#A0522D' },
  { id: 'beginner-05-bhimpalasi', num: 5, title: 'Afternoon Longing', subtitle: 'The pull of komal Ni and Ga', raga: 'Bhimpalasi', accent: '#8B6914' },
  { id: 'beginner-06-bageshri', num: 6, title: 'Night Intimacy', subtitle: 'Soft curves in the dark hours', raga: 'Bageshri', accent: '#4A6741' },
  { id: 'beginner-07-consolidation', num: 7, title: 'Five Ragas', subtitle: 'Hear them side by side', raga: 'Review', accent: '#7A6B5E' },
  { id: 'beginner-08-challenge', num: 8, title: 'Shishya Challenge', subtitle: 'Prove your ear', raga: 'Mastery', accent: '#D4AF37' },
] as const;

// ---------------------------------------------------------------------------
// Raga → lesson ID mapping for daily riyaz
// ---------------------------------------------------------------------------

const RAGA_TO_LESSON: Record<string, string> = {
  bhoopali: 'beginner-01-bhoopali',
  yaman: 'beginner-03-yaman',
  bhairav: 'beginner-04-bhairav',
  bhimpalasi: 'beginner-05-bhimpalasi',
  bageshri: 'beginner-06-bageshri',
};

// ---------------------------------------------------------------------------
// Helpers
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

const RIYAZ_DATE_KEY = 'sadhana_riyaz_date';

function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isRiyazCompleteToday(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(RIYAZ_DATE_KEY) === getTodayString();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Animations
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
// Page component
// ---------------------------------------------------------------------------

export default function BeginnerPage() {
  const { user: authUser, profile } = useAuth();

  // Riyaz completion tracking
  const [riyazDone, setRiyazDone] = useState(false);

  useEffect(() => {
    if (profile?.riyazDone) {
      setRiyazDone(true);
    } else {
      setRiyazDone(isRiyazCompleteToday());
    }
  }, [profile?.riyazDone]);

  // Today's raga and lesson
  const hour = new Date().getHours();
  const todayRaga = useMemo(() => getRagaForTimeOfDay(hour), [hour]);
  const todayLessonId = RAGA_TO_LESSON[todayRaga.id] ?? 'beginner-01-bhoopali';
  const timeLabel = getTimeOfDayLabel(hour);

  // User profile
  const user = profile ?? DEFAULT_USER;
  const levelTitle = getLevelTitle(user.level);
  const levelColor = getLevelColor(user.level);
  const xpProgress = Math.min((user.xp % 100) / 100, 1);
  const isFirstTime = user.lastPractice === null;

  // Recent ragas
  const [recentRagas, setRecentRagas] = useState<RecentRaga[]>([]);
  useEffect(() => {
    if (authUser) {
      getRecentRagas(authUser.id, 3).then(setRecentRagas);
    }
  }, [authUser]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <motion.div
      className={homeStyles.page}
      data-raga={todayRaga.id}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Back navigation */}
      <motion.div variants={fadeUp}>
        <Link href="/" className={homeStyles.backLink} aria-label="Back to journeys">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Journeys
        </Link>
      </motion.div>

      {/* Page title */}
      <motion.h1 className={`${homeStyles.title} raga-name`} variants={fadeUp}>
        Shishya
      </motion.h1>
      <motion.span className={`${homeStyles.titleDevanagari} swara-text devanagari-only`} variants={fadeUp}>
        {'\u0936\u093F\u0937\u094D\u092F'}
      </motion.span>
      <motion.span className={homeStyles.titleEnglish} variants={fadeUp}>
        Daily Riyaz
      </motion.span>

      {/* Today's riyaz card */}
      <motion.section className={homeStyles.riyazCard} variants={fadeUp} aria-label="Today's practice">
        <span className={homeStyles.riyazLabel}>
          {riyazDone ? 'Riyaz complete' : `Today\u2019s riyaz`}
        </span>
        <h2 className={`${homeStyles.riyazRaga} raga-name`}>{todayRaga.name}</h2>
        <p className={homeStyles.riyazDescription}>
          {timeLabel} raga &middot; Prahara {todayRaga.prahara.join(', ')}
        </p>
        {riyazDone ? (
          <span className={homeStyles.riyazDone}>
            Today&rsquo;s riyaz complete &mdash; well done
          </span>
        ) : (
          <Link
            href={`/journeys/beginner/lessons/${todayLessonId}`}
            className={homeStyles.beginButton}
            aria-label={`Begin practice with raga ${todayRaga.name}`}
          >
            Begin
          </Link>
        )}
      </motion.section>

      {/* Progress */}
      <motion.section
        className={homeStyles.progressSection}
        variants={fadeUp}
        aria-label="Your progress"
      >
        <h3 className={homeStyles.sectionTitle}>Progress</h3>
        <div className={homeStyles.progressRow}>
          <div className={homeStyles.levelBadge}>
            <span
              className={homeStyles.levelTitle}
              style={{ color: levelColor }}
            >
              {levelTitle}
            </span>
            <span className={homeStyles.levelNumber}>Lv {user.level}</span>
          </div>

          <div className={homeStyles.xpBar} role="progressbar" aria-valuenow={user.xp} aria-valuemin={0} aria-valuemax={100} aria-label="Experience points">
            <div
              className={homeStyles.xpFill}
              style={{ width: `${xpProgress * 100}%` }}
            />
          </div>
          <span className={homeStyles.xpLabel}>{user.xp} XP</span>

          <div className={homeStyles.streakBadge}>
            <span
              className={`${homeStyles.streakValue} ${(profile?.streak ?? user.streak) > 0 ? homeStyles.streakValueActive : ''}`}
            >
              {profile?.streak ?? user.streak}
            </span>
            <span className={homeStyles.streakText}>day streak</span>
          </div>
        </div>
      </motion.section>

      {/* Recently practiced */}
      <motion.section
        className={homeStyles.recentSection}
        variants={fadeUp}
        aria-label="Recently practiced ragas"
      >
        <h3 className={homeStyles.sectionTitle}>Recently practiced</h3>
        {recentRagas.length === 0 ? (
          <p className={homeStyles.emptyRecent}>
            No practice sessions yet. Begin your first riyaz above.
          </p>
        ) : (
          recentRagas.map((recent) => (
            <div key={recent.ragaId} className={homeStyles.recentCard}>
              <span className={homeStyles.recentRagaName}>{recent.ragaName}</span>
              <span className={homeStyles.recentAccuracy}>
                {Math.round(recent.bestAccuracy * 100)}%
              </span>
            </div>
          ))
        )}
      </motion.section>

      {/* Lesson catalog */}
      <motion.section
        className={homeStyles.lessonSection}
        variants={fadeUp}
        aria-label="Beginner lessons"
      >
        <h3 className={homeStyles.sectionTitle}>Lessons</h3>
        <div className={homeStyles.lessonGrid}>
          {BEGINNER_LESSONS.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/journeys/beginner/lessons/${lesson.id}`}
              className={homeStyles.lessonTile}
            >
              <span
                className={homeStyles.lessonAccent}
                style={{ background: lesson.accent }}
              />
              <span className={homeStyles.lessonNum}>{String(lesson.num).padStart(2, '0')}</span>
              <div className={homeStyles.lessonText}>
                <span className={homeStyles.lessonTitle}>{lesson.title}</span>
                <span className={homeStyles.lessonSubtitle}>{lesson.subtitle}</span>
              </div>
              <span className={homeStyles.lessonRaga}>{lesson.raga}</span>
              <svg className={homeStyles.lessonArrow} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* First-time user callout */}
      {isFirstTime && (
        <motion.aside className={homeStyles.callout} variants={fadeUp} aria-label="About Sadhana">
          <h3 className={homeStyles.calloutTitle}>What is Sadhana?</h3>
          <p className={homeStyles.calloutText}>
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
