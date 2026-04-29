'use client';

/**
 * PracticeReminder — opt-in daily practice nudge.
 *
 * T1.4 of the enhancement plan. We do not own a push backend (would break
 * the $0 constraint), so this component uses the local Notifications API
 * + a setInterval ticker that fires while the PWA is open. The trade-off
 * is honest: students who never re-open the app aren't notified. Students
 * who keep the PWA on their home screen and check it occasionally get a
 * raga-of-the-time-of-day nudge after their riyaz threshold passes.
 *
 * Notifications surface only when:
 *   - the user has explicitly granted Notification permission
 *   - they have NOT completed today's riyaz
 *   - the current hour matches a "prime hour" for their time-of-day raga
 *     (dawn = 6, afternoon = 14, evening = 18, night = 21)
 *   - we haven't already notified them today (de-duped via localStorage)
 *
 * The component renders nothing — it's a pure side-effect mount.
 */

import { useEffect, useRef } from 'react';
import { emit } from '../lib/telemetry';

const STORAGE_KEY = 'sadhana_last_reminder_date';

const PRIME_HOURS: Readonly<Record<string, number>> = {
  bhairav: 6,    // dawn
  bhimpalasi: 14, // afternoon
  bhoopali: 18,  // dusk
  yaman: 19,     // evening
  bageshri: 21,  // night
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function alreadyNotifiedToday(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === todayUtc();
  } catch {
    return false;
  }
}

function markNotified(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, todayUtc());
  } catch {
    // localStorage unavailable — degrade silently
  }
}

interface PracticeReminderProps {
  /** Whether the user has completed today's riyaz already (skip the nudge). */
  readonly riyazDone: boolean;
  /** Today's time-of-day raga ID (lowercase). */
  readonly todayRagaId: string;
  /** Display name of the raga (used in the notification body). */
  readonly todayRagaName: string;
}

export default function PracticeReminder({
  riyazDone,
  todayRagaId,
  todayRagaName,
}: PracticeReminderProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    if (riyazDone) return;
    if (alreadyNotifiedToday()) return;

    const primeHour = PRIME_HOURS[todayRagaId] ?? 18;

    const tick = () => {
      const now = new Date();
      const hour = now.getHours();
      // Fire within a 1-hour window starting at the prime hour. This way
      // a student who opens the PWA at 6:14 AM still gets the dawn
      // Bhairav nudge if their riyaz is undone.
      if (hour < primeHour || hour > primeHour + 1) return;
      if (alreadyNotifiedToday()) return;

      try {
        const n = new Notification(`${todayRagaName} waits`, {
          body: 'Today’s riyaz is unfinished. Five minutes is enough.',
          icon: '/sadhana/icons/icon-192.png',
          badge: '/sadhana/icons/icon-192.png',
          tag: 'sadhana-daily-riyaz',
        });
        // Auto-dismiss after 30s if the user doesn't act
        setTimeout(() => {
          try {
            n.close();
          } catch {
            // ignore
          }
        }, 30_000);
        markNotified();
      } catch {
        // Notification constructor can throw on Safari iOS or in restricted
        // contexts — degrade silently.
      }
    };

    // Fire once immediately in case we're already in the window
    tick();
    intervalRef.current = setInterval(tick, 5 * 60 * 1000); // every 5 min

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [riyazDone, todayRagaId, todayRagaName]);

  return null;
}

/**
 * Request Notification permission. Resolves to the granted state. Safe to
 * call in any context — gracefully no-ops in environments without the API.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined') return 'unsupported';
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      void emit('notification-permission-granted');
    } else if (result === 'denied') {
      void emit('notification-permission-denied');
    }
    return result;
  } catch {
    return 'denied';
  }
}
