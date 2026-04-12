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
 * Singleton Supabase client.
 * In production, reads from env vars. In development without Supabase,
 * the client is still created but queries will fail gracefully.
 *
 * When no Supabase URL is configured (local dev / static build),
 * a placeholder URL is used. The client is inert — queries fail safely.
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

  return {
    id: profileData.id as string,
    saHz: Number(profileData.sa_hz) || 261.63,
    level: levelTextToNumber(profileData.level as string),
    xp: (profileData.xp as number) ?? 0,
    streak: (streakData?.current_streak as number) ?? 0,
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
    journey: 'beginner',
    started_at: session.startedAt.toISOString(),
    ended_at: session.endedAt.toISOString(),
  });

  // Upsert raga_encounters: increment session_count, update last_practiced
  const { data: existingEncounter } = await supabase
    .from('raga_encounters')
    .select('id, session_count, total_minutes, best_accuracy, pakad_found')
    .eq('user_id', userId)
    .eq('raga_id', session.ragaId)
    .single();

  const durationMinutes = Math.round(session.duration / 60);

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
    user_id: userId,
    xp_amount: xpDelta,
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
 * Mark today's riyaz as complete and update streak.
 *
 * Logic:
 *   - If last_riyaz_date was yesterday: increment current_streak
 *   - If last_riyaz_date was today: no-op (already done)
 *   - If gap > 1 day: reset current_streak to 1
 *   - Update longest_streak if current exceeds it
 *   - Set last_riyaz_date = today
 *
 * @param userId - The Supabase auth user ID.
 */
export async function completeRiyaz(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  // Fetch existing streak row
  const { data: streakData } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_riyaz_date')
    .eq('user_id', userId)
    .single();

  if (!streakData) {
    // No streak row — create one (first riyaz ever)
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_riyaz_date: today,
    });
    return;
  }

  const lastDate = streakData.last_riyaz_date as string | null;

  // Already done today — no-op
  if (lastDate === today) return;

  // Calculate if yesterday
  let newStreak = 1;
  if (lastDate) {
    const lastMs = new Date(lastDate).getTime();
    const todayMs = new Date(today).getTime();
    const dayDiff = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      // Consecutive day — increment
      newStreak = (streakData.current_streak as number) + 1;
    }
    // dayDiff > 1: gap, reset to 1 (already set above)
  }

  const longestStreak = Math.max(
    streakData.longest_streak as number,
    newStreak,
  );

  await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_riyaz_date: today,
    })
    .eq('user_id', userId);
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
