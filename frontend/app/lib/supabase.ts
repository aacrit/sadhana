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
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
);

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a user profile by Supabase user ID.
 *
 * @param userId - The Supabase auth user ID.
 * @returns The user profile, or null if not found.
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, sa_hz, level, xp, streak, last_practice, riyaz_done, display_name')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    saHz: (data.sa_hz as number) ?? 261.63,
    level: (data.level as number) ?? 1,
    xp: (data.xp as number) ?? 0,
    streak: (data.streak as number) ?? 0,
    lastPractice: data.last_practice ? new Date(data.last_practice as string) : null,
    riyazDone: (data.riyaz_done as boolean) ?? false,
    displayName: data.display_name as string | undefined,
  };
}

/**
 * Save a completed practice session.
 *
 * @param userId - The Supabase auth user ID.
 * @param session - The session data to persist.
 */
export async function saveSession(
  userId: string,
  session: SessionData,
): Promise<void> {
  await supabase.from('sessions').insert({
    user_id: userId,
    raga_id: session.ragaId,
    duration: session.duration,
    xp_earned: session.xpEarned,
    accuracy: session.accuracy,
    pakads_found: session.pakadsFound,
    started_at: session.startedAt.toISOString(),
    ended_at: session.endedAt.toISOString(),
  });
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
 * Increment user XP and update last practice timestamp.
 *
 * @param userId - The Supabase auth user ID.
 * @param xpDelta - XP to add.
 */
export async function addXp(
  userId: string,
  xpDelta: number,
): Promise<void> {
  // Use RPC for atomic increment — avoids race conditions
  await supabase.rpc('increment_xp', {
    user_id: userId,
    xp_amount: xpDelta,
  });
}

/**
 * Mark today's riyaz as complete and bump streak if applicable.
 *
 * @param userId - The Supabase auth user ID.
 */
export async function completeRiyaz(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({
      riyaz_done: true,
      last_practice: new Date().toISOString(),
    })
    .eq('id', userId);
}

/**
 * Fetch recently practiced ragas for a user.
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
    .from('sessions')
    .select('raga_id, accuracy, ended_at')
    .eq('user_id', userId)
    .order('ended_at', { ascending: false })
    .limit(limit * 3); // fetch extra to deduplicate

  if (error || !data) return [];

  // Deduplicate by raga, keeping best accuracy and latest date
  const ragaMap = new Map<string, RecentRaga>();
  for (const row of data) {
    const ragaId = row.raga_id as string;
    const existing = ragaMap.get(ragaId);
    const accuracy = row.accuracy as number;
    const date = new Date(row.ended_at as string);

    if (!existing) {
      ragaMap.set(ragaId, {
        ragaId,
        ragaName: ragaId, // Caller enriches with engine data
        lastPracticed: date,
        bestAccuracy: accuracy,
      });
    } else if (accuracy > existing.bestAccuracy) {
      ragaMap.set(ragaId, { ...existing, bestAccuracy: accuracy });
    }
  }

  return Array.from(ragaMap.values()).slice(0, limit);
}
