/**
 * @module frontend/lib/supabase
 *
 * Supabase client singleton and typed query helpers.
 *
 * All data persistence flows through this module. The Supabase free tier
 * is the only backend — $0 constraint. The client is initialised once and
 * reused across the app.
 *
 * Environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anonymous/public key
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, SessionData, RecentRaga } from './types';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Production hard-error: a misconfigured deploy must never silently
 * fall back to placeholder credentials. The placeholder fallback is
 * kept ONLY for local development so `npm run dev` works without env.
 *
 * The check is gated on `typeof window !== 'undefined'` so the
 * static-export prerender (which runs in Node, with no browser) does
 * not crash when env vars are unset at build time. CI/CD builds run
 * the prerender first, then ship the bundle; the bundle then throws
 * loudly if the user's browser loads it without env vars baked in.
 *
 * In other words: the error fires when a real user opens a misconfigured
 * production site, not when CI runs `next build` to generate the static
 * pages. For static export, env vars must be inlined at build time via
 * NEXT_PUBLIC_SUPABASE_URL — if absent, every browser load will throw.
 */
if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  !supabaseUrl
) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is required in production. ' +
      'Set it in your build environment (GitHub Actions secret, Vercel env, etc).',
  );
}
if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  !supabaseAnonKey
) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY is required in production. ' +
      'Set it in your build environment.',
  );
}

/**
 * Singleton Supabase client.
 * In production, reads from env vars (hard-required above).
 * In development without Supabase, a placeholder URL is used —
 * the client is inert and queries fail safely.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
);

// ---------------------------------------------------------------------------
// Helpers: level text <-> number mapping
// ---------------------------------------------------------------------------

/** Map DB level text to the numeric level used in the UI. */
function levelTextToNumber(level: string): number {
  switch (level) {
    case 'shishya': return 1;
    case 'sadhaka': return 4;
    case 'varistha': return 7;
    case 'guru': return 10;
    default: return 1;
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a user profile by Supabase user ID.
 * Joins profiles with streaks table for streak data.
 *
 * @param userId - The Supabase auth user ID.
 * @returns The user profile, or null if not found.
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  // Fetch profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, sa_hz, level, xp, display_name, current_raga, updated_at')
    .eq('id', userId)
    .single();

  if (profileError || !profileData) return null;

  // Fetch streak data
  const { data: streakData } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_riyaz_date')
    .eq('user_id', userId)
    .single();

  // Determine if today's riyaz is done by checking last_riyaz_date
  const today = new Date().toISOString().slice(0, 10);
  const lastRiyazDate = streakData?.last_riyaz_date as string | null;
  const riyazDone = lastRiyazDate === today;

  // Map DB journey text to JourneyId (beginner/explorer/scholar/master)
  const rawJourney = (profileData as Record<string, unknown>).journey as string | undefined;
  const validJourneys = ['beginner', 'explorer', 'scholar', 'master', 'freeform'];
  const journey = rawJourney && validJourneys.includes(rawJourney)
    ? (rawJourney as import('./types').JourneyId)
    : null;

  return {
    id: profileData.id as string,
    saHz: Number(profileData.sa_hz) || 261.63,
    level: levelTextToNumber(profileData.level as string),
    xp: (profileData.xp as number) ?? 0,
    streak: (streakData?.current_streak as number) ?? 0,
    longestStreak: (streakData?.longest_streak as number) ?? 0,
    journey,
    currentRaga: (profileData.current_raga as string) ?? null,
    lastPractice: profileData.updated_at
      ? new Date(profileData.updated_at as string)
      : null,
    riyazDone,
    displayName: profileData.display_name as string | undefined,
  };
}

/**
 * Save a completed practice session and upsert raga_encounters.
 *
 * @param userId - The Supabase auth user ID.
 * @param session - The session data to persist.
 */
export async function saveSession(
  userId: string,
  session: SessionData,
): Promise<void> {
  // Fetch user's current Sa for the session record
  const { data: profileData } = await supabase
    .from('profiles')
    .select('sa_hz')
    .eq('id', userId)
    .single();

  const saHz = profileData ? Number(profileData.sa_hz) : 261.6256;

  // Insert session
  await supabase.from('sessions').insert({
    user_id: userId,
    raga_id: session.ragaId,
    sa_hz: saHz,
    duration_s: session.duration,
    xp_earned: session.xpEarned,
    avg_accuracy: session.accuracy,
    pakad_found: session.pakadsFound > 0,
    journey: session.journey ?? 'beginner',
    started_at: session.startedAt.toISOString(),
    ended_at: session.endedAt.toISOString(),
  });

  // Race-free upsert of raga_encounters.
  // The SELECT-then-INSERT-or-UPDATE pattern was vulnerable to a
  // TOCTOU race when two sessions for the same raga completed in
  // parallel — both could observe "no row" and both INSERT, or both
  // could read session_count=N and overwrite to N+1. The RPC does the
  // upsert atomically and returns the new session_count.
  const durationMinutes = Math.round(session.duration / 60);
  const { error: rpcError } = await supabase.rpc('increment_raga_session', {
    p_user_id: userId,
    p_raga_id: session.ragaId,
    p_minutes: durationMinutes,
    p_accuracy: session.accuracy,
    p_pakad_found: session.pakadsFound > 0,
  });

  if (rpcError) {
    // Fallback for environments where migration 003 has not yet been
    // applied. The fallback retains the original race window — log
    // loudly so deployment misalignment is obvious.
    if (typeof console !== 'undefined') {
      console.warn(
        'increment_raga_session RPC failed — falling back to client upsert. ' +
          'Apply migration 003 to remove this race window. Error:',
        rpcError.message,
      );
    }
    const { data: existingEncounter } = await supabase
      .from('raga_encounters')
      .select('id, session_count, total_minutes, best_accuracy, pakad_found')
      .eq('user_id', userId)
      .eq('raga_id', session.ragaId)
      .maybeSingle();

    if (existingEncounter) {
      const currentBest = Number(existingEncounter.best_accuracy) || 0;
      const currentPakad = existingEncounter.pakad_found as boolean;
      await supabase
        .from('raga_encounters')
        .update({
          session_count: (existingEncounter.session_count as number) + 1,
          total_minutes: (existingEncounter.total_minutes as number) + durationMinutes,
          best_accuracy: Math.max(currentBest, session.accuracy),
          pakad_found: currentPakad || session.pakadsFound > 0,
          last_practiced: new Date().toISOString(),
        })
        .eq('id', existingEncounter.id);
    } else {
      await supabase.from('raga_encounters').insert({
        user_id: userId,
        raga_id: session.ragaId,
        session_count: 1,
        total_minutes: durationMinutes,
        best_accuracy: session.accuracy,
        pakad_found: session.pakadsFound > 0,
        first_practiced: new Date().toISOString(),
        last_practiced: new Date().toISOString(),
      });
    }
  }
}

/**
 * Update the user's detected Sa reference pitch.
 *
 * @param userId - The Supabase auth user ID.
 * @param saHz - The new Sa frequency in Hz.
 */
export async function updateSa(
  userId: string,
  saHz: number,
): Promise<void> {
  await supabase
    .from('profiles')
    .update({ sa_hz: saHz })
    .eq('id', userId);
}

/**
 * Increment user XP and update current_raga on the profile.
 *
 * Note: uses direct update since the increment_xp RPC may not exist yet.
 * Falls back to a read-then-write if needed.
 *
 * @param userId - The Supabase auth user ID.
 * @param xpDelta - XP to add.
 */
export async function addXp(
  userId: string,
  xpDelta: number,
): Promise<void> {
  // Try RPC first (atomic increment)
  const { error } = await supabase.rpc('increment_xp', {
    p_user_id: userId,
    p_xp_delta: xpDelta,
  });

  // Fall back to read-then-write if RPC doesn't exist
  if (error) {
    const { data } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();

    if (data) {
      await supabase
        .from('profiles')
        .update({ xp: (data.xp as number) + xpDelta })
        .eq('id', userId);
    }
  }
}

/**
 * Number of milliseconds in one UTC day. Used for day-index math.
 * Using a fixed constant (rather than local-time setHours/getDate) makes
 * streak arithmetic timezone-independent — a student in IST and a student
 * in PST both get the same answer for "is this date one day after that one?"
 */
const MS_PER_DAY = 86_400_000;

/** YYYY-MM-DD in UTC for a given Date (or now()). */
function utcDayString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Integer UTC day index (days since 1970-01-01 UTC). */
function utcDayIndex(d: Date = new Date()): number {
  return Math.floor(d.getTime() / MS_PER_DAY);
}

/** Day index for a YYYY-MM-DD string (interpreted as UTC midnight). */
function utcDayIndexFromString(yyyyMmDd: string): number {
  // Construct as UTC midnight to avoid local-tz offsets shifting the day.
  return Math.floor(Date.parse(`${yyyyMmDd}T00:00:00Z`) / MS_PER_DAY);
}

/**
 * Mark today's riyaz as complete and update streak.
 *
 * Logic:
 *   - If last_riyaz_date was yesterday: increment current_streak
 *   - If last_riyaz_date was today: no-op (already done)
 *   - If gap > 1 day: reset current_streak to 1
 *   - Update longest_streak if current exceeds it
 *   - Set last_riyaz_date = today
 *
 * All date math uses UTC day indices so the streak is consistent across
 * timezones (a student travelling will never lose or gain a streak day
 * because of local clock differences).
 *
 * @param userId - The Supabase auth user ID.
 */
export async function completeRiyaz(userId: string): Promise<void> {
  const today = utcDayString();
  const todayIdx = utcDayIndex();

  // Fetch existing streak row
  const { data: streakData } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_riyaz_date, freezes_remaining, last_freeze_earned_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (!streakData) {
    // No streak row — create one (first riyaz ever)
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_riyaz_date: today,
      freezes_remaining: 0,
    });
    return;
  }

  const lastDate = streakData.last_riyaz_date as string | null;

  // Already done today — no-op
  if (lastDate === today) return;

  // Calculate gap in UTC days (timezone-independent)
  const oldStreak = streakData.current_streak as number;
  const oldFreezes = (streakData.freezes_remaining as number | null) ?? 0;
  let newStreak = 1;
  let newFreezes = oldFreezes;

  if (lastDate) {
    const lastIdx = utcDayIndexFromString(lastDate);
    const dayDiff = todayIdx - lastIdx;

    if (dayDiff === 1) {
      // Consecutive day — increment
      newStreak = oldStreak + 1;
    } else if (dayDiff === 2 && oldFreezes > 0) {
      // T1.4 — single missed day, freeze available. Consume one freeze
      // and continue the streak. The freeze covers exactly one day; a
      // gap of 3+ days still resets, even if more freezes remain.
      newStreak = oldStreak + 1;
      newFreezes = oldFreezes - 1;
    }
    // dayDiff > 2 OR (dayDiff === 2 && oldFreezes === 0): hard reset
    // dayDiff <= 0: clock skew or stale row — treat as fresh day
  }

  // T1.4 — freeze accrual: one freeze per 30 consecutive days, cap at 3.
  // Earned at every multiple of 30; tracked via last_freeze_earned_date so
  // the same milestone doesn't grant multiple freezes if a row is touched
  // more than once in a day.
  const lastFreezeEarned = streakData.last_freeze_earned_date as string | null;
  if (
    newStreak > 0 &&
    newStreak % 30 === 0 &&
    newFreezes < 3 &&
    lastFreezeEarned !== today
  ) {
    newFreezes = Math.min(3, newFreezes + 1);
  }

  const longestStreak = Math.max(
    streakData.longest_streak as number,
    newStreak,
  );

  const updatePayload: Record<string, unknown> = {
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_riyaz_date: today,
    freezes_remaining: newFreezes,
  };
  if (newFreezes > oldFreezes) {
    updatePayload.last_freeze_earned_date = today;
  }

  await supabase
    .from('streaks')
    .update(updatePayload)
    .eq('user_id', userId);
}

/**
 * Resolve the next lesson the student should resume.
 *
 * Reads `sessions` for the journey, finds the most recently *completed*
 * lesson by inspecting `raga_id` against the lesson catalog, and returns
 * the next lesson ID in sequence. If the student has never completed any
 * lesson in this journey, returns the first ID. If the student has
 * completed every lesson, returns the last ID (replay-the-final-test).
 *
 * The catalog is passed in by the caller so this stays journey-agnostic
 * — the same function backs Beginner, Sadhaka, Varistha, and Guru CTAs.
 *
 * Uses lesson IDs (not raga IDs) where possible. Sessions store raga_id
 * not lesson_id, so we match by walking the catalog. If multiple lessons
 * share a raga (none today, but planned), the catalog order disambiguates.
 *
 * @param userId — Supabase auth user ID. Pass null for guest mode.
 * @param catalog — Ordered array of `{ id, ragaId }` for the journey.
 * @returns The next lesson ID. Always returns a value (never undefined).
 */
export async function getNextLessonId(
  userId: string | null,
  catalog: ReadonlyArray<{ readonly id: string; readonly ragaId: string }>,
): Promise<string> {
  if (catalog.length === 0) {
    throw new Error('getNextLessonId: empty catalog');
  }
  if (!userId) return catalog[0]!.id;

  // Pull the last 200 sessions for this user — enough to cover any reasonable
  // beginner→sadhaka transition without overshooting the free-tier read budget.
  const { data, error } = await supabase
    .from('sessions')
    .select('raga_id, ended_at')
    .eq('user_id', userId)
    .order('ended_at', { ascending: false })
    .limit(200);

  if (error || !data || data.length === 0) return catalog[0]!.id;

  // Find the highest catalog index whose ragaId appears in the session list.
  // Walk catalog ascending so the result is the *furthest* lesson reached.
  const completedRagas = new Set<string>(
    data.map((row) => (row.raga_id as string | null) ?? '').filter(Boolean),
  );
  let furthestIdx = -1;
  for (let i = 0; i < catalog.length; i++) {
    if (completedRagas.has(catalog[i]!.ragaId)) {
      furthestIdx = i;
    }
  }

  if (furthestIdx < 0) return catalog[0]!.id;
  if (furthestIdx >= catalog.length - 1) return catalog[catalog.length - 1]!.id;
  return catalog[furthestIdx + 1]!.id;
}

/**
 * Fetch recently practiced ragas for a user from raga_encounters.
 *
 * @param userId - The Supabase auth user ID.
 * @param limit - Maximum number of results (default 5).
 * @returns Array of recently practiced ragas with best accuracy.
 */
export async function getRecentRagas(
  userId: string,
  limit = 5,
): Promise<RecentRaga[]> {
  const { data, error } = await supabase
    .from('raga_encounters')
    .select('raga_id, best_accuracy, last_practiced')
    .eq('user_id', userId)
    .order('last_practiced', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    ragaId: row.raga_id as string,
    ragaName: row.raga_id as string, // Caller enriches with engine data
    lastPracticed: new Date(row.last_practiced as string),
    bestAccuracy: Number(row.best_accuracy) || 0,
  }));
}

/**
 * Practice history: one entry per date with total minutes and session count.
 * Used by the profile heatmap visualization.
 *
 * @param userId - Supabase user ID
 * @param days - Number of days to look back (default: 90)
 * @returns Array of { date: string (YYYY-MM-DD), minutes: number, sessions: number }
 */
export async function getPracticeHistory(
  userId: string,
  days = 90,
): Promise<{ date: string; minutes: number; sessions: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('sessions')
    .select('started_at, duration_s')
    .eq('user_id', userId)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: true });

  if (error || !data) return [];

  // Group by date
  const byDate = new Map<string, { minutes: number; sessions: number }>();
  for (const row of data) {
    const date = new Date(row.started_at as string).toISOString().slice(0, 10);
    const entry = byDate.get(date) ?? { minutes: 0, sessions: 0 };
    entry.minutes += Math.round(Number(row.duration_s) / 60);
    entry.sessions += 1;
    byDate.set(date, entry);
  }

  return Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    minutes: v.minutes,
    sessions: v.sessions,
  }));
}

/**
 * Returns the swara the student struggled most with yesterday.
 *
 * Reads the `worst_swara` column from the most recent session that was
 * completed yesterday (not today). This field is populated by the client
 * at session end.
 *
 * Returns null if: no yesterday session exists, no worst_swara recorded,
 * or the user is unauthenticated.
 *
 * Used by the Return Note warmup feature (Cluster D).
 *
 * @param userId - Supabase user ID
 * @returns Swara symbol string or null
 */
export async function getYesterdayWorstSwara(
  userId: string,
): Promise<string | null> {
  // Compute yesterday's window in UTC so the lookup is consistent for
  // travelling users. Local-tz setHours math previously shifted the
  // window by up to ±14 hours, which silently dropped or duplicated
  // sessions at day boundaries.
  const todayIdx = utcDayIndex();
  const yesterdayStartMs = (todayIdx - 1) * MS_PER_DAY;
  const yesterdayEndMs = todayIdx * MS_PER_DAY;
  const yesterdayStart = new Date(yesterdayStartMs).toISOString();
  const yesterdayEnd = new Date(yesterdayEndMs).toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .select('worst_swara')
    .eq('user_id', userId)
    .not('worst_swara', 'is', null)
    .gte('started_at', yesterdayStart)
    .lt('started_at', yesterdayEnd)
    .order('started_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return (data[0]?.worst_swara as string) ?? null;
}
