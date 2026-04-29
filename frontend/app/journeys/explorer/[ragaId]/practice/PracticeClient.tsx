'use client';

/**
 * PracticeClient — Client component for guided raga practice.
 *
 * Wraps the GuidedPractice component with raga lookup, auth,
 * Sa frequency, and navigation.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getRagaById } from '@/engine/theory';
import { useAuth } from '../../../../lib/auth';
import { useGuidedPractice } from '../../../../lib/useGuidedPractice';
import GuidedPractice from '../../../../components/GuidedPractice';
import { saveSession, addXp, completeRiyaz } from '../../../../lib/supabase';
import styles from '../../../../styles/guided-practice.module.css';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PracticeClientProps {
  readonly ragaId: string;
}

export default function PracticeClient({ ragaId }: PracticeClientProps) {
  const router = useRouter();
  const raga = getRagaById(ragaId);
  const { profile, user } = useAuth();
  const saHz = profile?.saHz ?? 261.63;

  const controls = useGuidedPractice(
    raga!,
    saHz,
    'shishya',
    0, // previous-stars lookup deferred (T1.3 progression engine)
  );

  // Track session start time so we can compute duration on completion
  const startTimeRef = useRef<Date>(new Date());
  const persistedRef = useRef(false);

  // -------------------------------------------------------------------------
  // Tier 0 persistence — fire saveSession + addXp + completeRiyaz once when
  // the practice state machine reaches 'complete'. Identical to the lesson
  // path; a missed call here is the same retention regression as in beginner.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (controls.practiceState !== 'complete') return;
    if (persistedRef.current) return;
    if (!user?.id || !raga || !controls.overallResult) return;
    persistedRef.current = true;

    const endedAt = new Date();
    const startedAt = startTimeRef.current;
    const durationS = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
    const xpEarned = controls.overallResult.xpEarned ?? 0;
    const accuracy = controls.overallResult.overallScore ?? 0;

    void (async () => {
      try {
        await saveSession(user.id, {
          ragaId,
          duration: durationS,
          xpEarned,
          accuracy,
          pakadsFound: 0,
          startedAt,
          endedAt,
          journey: 'explorer',
        });
      } catch (err) {
        if (typeof console !== 'undefined') console.warn('saveSession failed:', err);
      }
      if (xpEarned > 0) {
        try {
          await addXp(user.id, xpEarned);
        } catch (err) {
          if (typeof console !== 'undefined') console.warn('addXp failed:', err);
        }
      }
      try {
        await completeRiyaz(user.id);
      } catch (err) {
        if (typeof console !== 'undefined') console.warn('completeRiyaz failed:', err);
      }
    })();
  }, [controls.practiceState, controls.overallResult, user?.id, raga, ragaId]);

  const handleExit = useCallback(() => {
    router.push(`/journeys/explorer/${ragaId}`);
  }, [router, ragaId]);

  if (!raga) {
    return (
      <div className={styles.page} role="region">
        <div className={styles.idleScreen}>
          <h1 className={styles.idleTitle}>Raga not found</h1>
          <p className={styles.idleSubtitle}>
            The raga &ldquo;{ragaId}&rdquo; is not in the current library.
          </p>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => router.push('/journeys/explorer')}
          >
            Back to Explorer
          </button>
        </div>
      </div>
    );
  }

  return (
    <GuidedPractice
      raga={raga}
      saHz={saHz}
      controls={controls}
      onExit={handleExit}
    />
  );
}
