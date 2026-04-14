'use client';

/**
 * PracticeClient — Client component for guided raga practice.
 *
 * Wraps the GuidedPractice component with raga lookup, auth,
 * Sa frequency, and navigation.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getRagaById } from '@/engine/theory';
import { useAuth } from '../../../../lib/auth';
import { useGuidedPractice } from '../../../../lib/useGuidedPractice';
import GuidedPractice from '../../../../components/GuidedPractice';
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
  const { profile } = useAuth();
  const saHz = profile?.saHz ?? 261.63;

  const controls = useGuidedPractice(
    raga!,
    saHz,
    'shishya',
    0, // TODO: fetch previous stars from Supabase
  );

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
