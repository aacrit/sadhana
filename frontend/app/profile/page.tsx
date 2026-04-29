'use client';

/**
 * Profile page -- Sadhana
 *
 * Displays the practitioner's identity, XP, streak, Sa reference,
 * recent ragas, level progression, and a contextual Hindustani
 * classical encouragement message.
 *
 * Auth-aware:
 *   - Signed in: full profile from Supabase
 *   - Guest: prompt to sign in
 *   - Loading: saffron pulse dot
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/auth';
import { getRecentRagas, getPracticeHistory, updateSa } from '../lib/supabase';
import { useVoiceWave } from '../lib/VoiceWaveContext';
import { emit } from '../lib/telemetry';
import { getLevelTitle } from '../lib/types';
import type { LevelTitle, RecentRaga } from '../lib/types';
import { getLevelIcon } from '../components/icons';
import styles from './profile.module.css';

// ---------------------------------------------------------------------------
// Level color raw values (for inline styles on the badge)
// ---------------------------------------------------------------------------

const LEVEL_BADGE_COLORS: Record<LevelTitle, string> = {
  Shishya: '#0A1A14',
  Sadhaka: '#2D6A4F',
  Varistha: '#1E3A5F',
  Guru: '#D4AF37',
};

// XP thresholds for level progression
const LEVEL_THRESHOLDS = [
  { title: 'Shishya' as const, xp: 0 },
  { title: 'Sadhaka' as const, xp: 500 },
  { title: 'Varistha' as const, xp: 2000 },
  { title: 'Guru' as const, xp: 8000 },
];

// ---------------------------------------------------------------------------
// Encouragement messages
// ---------------------------------------------------------------------------

function getEncouragement(streak: number, levelTitle: LevelTitle): string {
  // Level messages override streak messages at Sadhaka+
  if (levelTitle === 'Guru') {
    return 'You have become the instrument.';
  }
  if (levelTitle === 'Varistha') {
    return 'At this depth, silence between swaras becomes grammar.';
  }
  if (levelTitle === 'Sadhaka') {
    return 'Shishya sees notes. Sadhaka hears intervals.';
  }

  // Streak-based messages for Shishya
  if (streak >= 30) {
    return 'The raga lives inside you now. Practice is remembering.';
  }
  if (streak >= 14) {
    return 'A shruti is not a note. You are beginning to understand the difference.';
  }
  if (streak >= 7) {
    return 'Seven days of Sa. The tanpura has learned your breath.';
  }
  if (streak >= 3) {
    return 'Riyaz becomes ritual. Ritual becomes nature.';
  }
  if (streak >= 1) {
    return 'The first note is always the hardest. You have found it.';
  }
  return 'The raga does not ask for perfection. It asks for return.';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, profile, loading, isGuest, signOut, refreshProfile } = useAuth();
  // Preserve the legacy `user` reference for downstream code that still
  // reads it (the rename above keeps the rest of the file unchanged).
  const user = authUser;

  const [recentRagas, setRecentRagas] = useState<RecentRaga[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<
    { date: string; minutes: number; sessions: number }[]
  >([]);

  // Fetch recent ragas and practice history for signed-in users
  useEffect(() => {
    if (user) {
      getRecentRagas(user.id, 3).then(setRecentRagas);
      getPracticeHistory(user.id, 90).then(setPracticeHistory);
    }
  }, [user]);

  // Derived values
  const levelTitle = useMemo(
    () => (profile ? getLevelTitle(profile.level) : 'Shishya'),
    [profile],
  );

  const encouragement = useMemo(
    () => getEncouragement(profile?.streak ?? 0, levelTitle),
    [profile, levelTitle],
  );

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div
            className={styles.loadingDot}
            role="status"
            aria-label="Loading profile"
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Guest state
  // -------------------------------------------------------------------------

  if (!user || isGuest) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push('/')}
            aria-label="Back to home"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 5L7 10L12 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className={styles.guestContainer}>
            <h1 className={styles.guestHeading}>
              You are practicing as a guest.
            </h1>
            <p className={styles.guestText}>
              Sign in to save your progress, streaks, and Sa reference.
            </p>
            <Link href="/auth" className={styles.guestLink}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Authenticated state
  // -------------------------------------------------------------------------

  const displayName = profile?.displayName || 'Practitioner';
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const longestStreak = profile?.longestStreak ?? 0;
  const saHz = profile?.saHz ?? 261.63;
  const journey = profile?.journey;

  // T4.4: Sa manual override. The auto-detector misreads bass/child voices,
  // breathy timbres, and noisy mic input. Once a wrong Sa is stored, every
  // future lesson is wrong. Surface a manual entry so the student can fix
  // it from the profile without re-running the calibrator.
  const { setSaHz: setVoiceSaHz } = useVoiceWave();
  const [saEditOpen, setSaEditOpen] = useState(false);
  const [saInput, setSaInput] = useState<string>(saHz.toFixed(2));
  const [saError, setSaError] = useState<string | null>(null);
  const [saSaving, setSaSaving] = useState(false);

  const handleSaCommit = useCallback(async () => {
    setSaError(null);
    const parsed = Number(saInput);
    if (!Number.isFinite(parsed) || parsed < 70 || parsed > 530) {
      setSaError('Enter a frequency between 70 Hz and 530 Hz.');
      return;
    }
    if (!authUser?.id) {
      setSaError('Sign in to save Sa.');
      return;
    }
    setSaSaving(true);
    try {
      await updateSa(authUser.id, parsed);
      setVoiceSaHz(parsed);
      void emit('sa-manual-override', { hz: parsed });
      await refreshProfile();
      setSaEditOpen(false);
    } catch (err) {
      setSaError(err instanceof Error ? err.message : 'Failed to save Sa.');
    } finally {
      setSaSaving(false);
    }
  }, [saInput, authUser?.id, setVoiceSaHz, refreshProfile]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <div className={styles.page} data-raga={profile?.currentRaga ?? undefined}>
      <div className={styles.container}>
        {/* Back arrow */}
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.push('/')}
          aria-label="Back to home"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 5L7 10L12 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Section 1: Identity */}
        <header className={styles.header}>
          <div className={styles.nameRow}>
            <h1 className={styles.displayName}>{displayName}</h1>
            <span
              className={styles.levelBadge}
              style={{
                backgroundColor: LEVEL_BADGE_COLORS[levelTitle],
                border:
                  levelTitle === 'Shishya'
                    ? '1px solid var(--border)'
                    : 'none',
              }}
            >
              {(() => {
                const LevelIcon = getLevelIcon(levelTitle);
                return LevelIcon ? (
                  <LevelIcon size={16} color="rgba(255,255,255,0.92)" />
                ) : null;
              })()}
              {levelTitle}
            </span>
          </div>
          {journey && (
            <span className={styles.journeyPath}>
              {capitalize(journey)} journey
            </span>
          )}
        </header>

        {/* Section 2: XP + Streak */}
        <div className={styles.statsBlock}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>XP</span>
            <span className={styles.statValue}>{xp}</span>
          </div>

          <div className={styles.statItem}>
            <span className={styles.statLabel}>Day streak</span>
            <div className={styles.streakRow}>
              {/* Geometric streak mark: vertical taper */}
              <svg
                className={styles.streakMark}
                width="8"
                height="20"
                viewBox="0 0 8 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 0L6.5 14L4 20L1.5 14Z"
                  fill={streak > 0 ? 'var(--accent)' : 'var(--text-3)'}
                />
              </svg>
              <span
                className={`${styles.statValue} ${streak > 0 ? styles.statValueActive : ''}`}
              >
                {streak}
              </span>
            </div>
          </div>
        </div>

        {longestStreak > 0 && (
          <span className={styles.streakSub}>
            Longest: {longestStreak} days
          </span>
        )}

        <div className={styles.saRow}>
          <span className={styles.saHz}>
            Sa = {saHz.toFixed(1)} Hz
          </span>
          {!saEditOpen && (
            <button
              type="button"
              className={styles.saEditButton}
              onClick={() => {
                setSaInput(saHz.toFixed(2));
                setSaError(null);
                setSaEditOpen(true);
              }}
              aria-label="Set Sa frequency manually"
            >
              Set manually
            </button>
          )}
          {saEditOpen && (
            <div className={styles.saEditPanel} role="group" aria-label="Manual Sa frequency entry">
              <label className={styles.saEditLabel} htmlFor="sa-input">
                Sa frequency (Hz)
              </label>
              <input
                id="sa-input"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="70"
                max="530"
                value={saInput}
                onChange={(e) => setSaInput(e.target.value)}
                className={styles.saEditInput}
                disabled={saSaving}
              />
              <div className={styles.saEditActions}>
                <button
                  type="button"
                  className={styles.saEditPrimary}
                  onClick={handleSaCommit}
                  disabled={saSaving}
                >
                  {saSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className={styles.saEditSecondary}
                  onClick={() => {
                    setSaEditOpen(false);
                    setSaError(null);
                  }}
                  disabled={saSaving}
                >
                  Cancel
                </button>
              </div>
              {saError && (
                <p className={styles.saEditError} role="alert">
                  {saError}
                </p>
              )}
              <p className={styles.saEditHint}>
                Range: 70 Hz (low bass) – 530 Hz (high soprano).
                Common values: C4 = 261.63, G3 = 196, D4 = 293.66.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Encouragement */}
        <p className={styles.encouragement}>{encouragement}</p>

        {/* Section 4: Recent ragas */}
        <section
          className={styles.recentSection}
          aria-label="Recently practiced ragas"
        >
          <span className={styles.sectionLabel}>Recent ragas</span>
          {recentRagas.length > 0 ? (
            <div className={styles.ragaChips}>
              {recentRagas.map((raga) => (
                <div key={raga.ragaId} className={styles.ragaChip}>
                  <span className={styles.ragaChipName}>
                    {capitalize(raga.ragaName)}
                  </span>
                  <span
                    className={styles.ragaChipDot}
                    aria-hidden="true"
                  />
                  <span className={styles.ragaChipTime}>
                    {daysAgo(raga.lastPracticed)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noRagas}>
              No ragas practiced yet. Begin your first riyaz.
            </p>
          )}
        </section>

        {/* Section 5: Practice heatmap */}
        {practiceHistory.length > 0 && (
          <section
            className={styles.heatmapSection}
            aria-label="Practice history"
          >
            <span className={styles.sectionLabel}>Last 90 days</span>
            <div className={styles.heatmapGrid} role="img" aria-label="Practice heatmap showing activity over the last 90 days">
              {(() => {
                // Build 91-day grid (13 weeks)
                const today = new Date();
                const cells: { date: string; minutes: number; sessions: number }[] = [];
                const historyMap = new Map(
                  practiceHistory.map((h) => [h.date, h]),
                );

                for (let i = 90; i >= 0; i--) {
                  const d = new Date(today);
                  d.setDate(d.getDate() - i);
                  const key = d.toISOString().slice(0, 10);
                  const entry = historyMap.get(key);
                  cells.push({
                    date: key,
                    minutes: entry?.minutes ?? 0,
                    sessions: entry?.sessions ?? 0,
                  });
                }

                return cells.map((cell) => {
                  let level = 0;
                  if (cell.minutes >= 30) level = 4;
                  else if (cell.minutes >= 15) level = 3;
                  else if (cell.minutes >= 5) level = 2;
                  else if (cell.minutes > 0) level = 1;

                  return (
                    <div
                      key={cell.date}
                      className={styles.heatmapCell}
                      data-level={level}
                      title={`${cell.date}: ${cell.minutes} min, ${cell.sessions} session${cell.sessions !== 1 ? 's' : ''}`}
                    />
                  );
                });
              })()}
            </div>
            <div className={styles.heatmapMeta}>
              <span className={styles.heatmapTotal}>
                {practiceHistory.reduce((sum, h) => sum + h.sessions, 0)} sessions
              </span>
              <div className={styles.heatmapLegend}>
                <span className={styles.heatmapLegendLabel}>Less</span>
                <div className={styles.heatmapLegendCell} data-level={0} />
                <div className={styles.heatmapLegendCell} data-level={1} />
                <div className={styles.heatmapLegendCell} data-level={2} />
                <div className={styles.heatmapLegendCell} data-level={3} />
                <div className={styles.heatmapLegendCell} data-level={4} />
                <span className={styles.heatmapLegendLabel}>More</span>
              </div>
            </div>
          </section>
        )}

        {/* Section 6: Level progression */}
        <section
          className={styles.levelSection}
          aria-label="Level progression"
        >
          <span className={styles.sectionLabel}>Progression</span>
          <div className={styles.levelTrack} role="list">
            {LEVEL_THRESHOLDS.map((node, index) => {
              const isCurrent = levelTitle === node.title;
              const isCompleted =
                LEVEL_THRESHOLDS.findIndex(
                  (t) => t.title === levelTitle,
                ) > index;
              const isFuture = !isCurrent && !isCompleted;

              return (
                <div
                  key={node.title}
                  className={styles.levelNode}
                  role="listitem"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span
                    className={`${styles.levelDot} ${
                      isCurrent
                        ? styles.levelDotCurrent
                        : isCompleted
                          ? styles.levelDotCompleted
                          : styles.levelDotFuture
                    }`}
                    style={
                      isCurrent
                        ? { background: LEVEL_BADGE_COLORS[node.title] }
                        : undefined
                    }
                  >
                    {(() => {
                      const NodeIcon = getLevelIcon(node.title);
                      return NodeIcon ? (
                        <NodeIcon
                          size={isCurrent ? 28 : 20}
                          color={
                            isFuture
                              ? 'var(--text-3)'
                              : 'rgba(255,255,255,0.9)'
                          }
                        />
                      ) : null;
                    })()}
                  </span>
                  <div className={styles.levelInfo}>
                    <span
                      className={`${styles.levelName} ${
                        isFuture ? styles.levelNameDim : ''
                      }`}
                    >
                      {node.title}
                    </span>
                    {index > 0 && (
                      <span className={styles.levelThreshold}>
                        {node.xp.toLocaleString()} XP
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 7: Privacy + sign out */}
        <Link
          href="/profile/privacy"
          className={styles.privacyLink}
        >
          Your data and privacy
        </Link>

        <button
          type="button"
          className={styles.signOutButton}
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
