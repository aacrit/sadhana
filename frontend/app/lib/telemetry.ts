/**
 * @module frontend/lib/telemetry
 *
 * T3.4 — lightweight client telemetry. Emits an event row to the
 * `events` table (migration 004). Fire-and-forget: failures log to
 * console but never throw to the caller.
 *
 * Usage:
 *
 *   import { emit } from '@/app/lib/telemetry';
 *
 *   emit('lesson-started', { lessonId, journey });
 *   emit('phase-skipped', { phase: 'sa_detection', reason: 'mic-denied' });
 *
 * Events are user-scoped; RLS on the table ensures users only see
 * their own. The progress-analyst agent reads from here.
 *
 * Sentry would be the natural choice, but breaks the $0 constraint —
 * this is the self-hosted alternative. Queries against the `events`
 * table are bounded by the free-tier read budget; we keep events small
 * and indexed on (user_id, created_at).
 */

import { supabase } from './supabase';

export type EventName =
  // Lesson lifecycle
  | 'lesson-started'
  | 'lesson-completed'
  | 'lesson-exited'
  | 'phase-skipped'
  // Voice pipeline
  | 'mic-denied'
  | 'mic-granted'
  | 'sa-calibrated'
  | 'sa-manual-override'
  // Progression
  | 'level-gate-earned'
  | 'pakad-recognised'
  // PWA
  | 'pwa-installed'
  | 'notification-permission-granted'
  | 'notification-permission-denied'
  // Errors / friction
  | 'error'
  | 'audio-context-failed'
  // Custom (analyst extension)
  | string;

export interface EmitOptions {
  /** Override the implicit user. Default: read from supabase.auth.getUser(). */
  readonly userId?: string;
  /** Skip the network call but still log to console (useful in tests). */
  readonly dryRun?: boolean;
}

/**
 * Emit a telemetry event. Returns a promise that resolves when the row
 * is persisted (or fails silently). Do not await unless you need to.
 */
export async function emit(
  name: EventName,
  payload?: Record<string, unknown>,
  options: EmitOptions = {},
): Promise<void> {
  if (options.dryRun) {
    if (typeof console !== 'undefined') {
      console.debug('[telemetry:dryRun]', name, payload);
    }
    return;
  }

  let userId = options.userId;
  if (!userId) {
    try {
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id;
    } catch {
      // Auth not available; don't emit anonymous events
      return;
    }
  }
  if (!userId) return;

  try {
    await supabase.from('events').insert({
      user_id: userId,
      name,
      payload: payload ?? null,
    });
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.warn('[telemetry] emit failed:', name, err);
    }
  }
}

/**
 * Emit an error event with stack trace. Convenience wrapper around emit().
 */
export function emitError(
  origin: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  void emit('error', { origin, message, stack, ...extra });
}
