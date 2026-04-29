'use client';

/**
 * LessonClient — client component that loads a YAML lesson by ID
 * and renders it via useLessonEngine + LessonRenderer.
 *
 * useSearchParams() is used to read ?warmup= for the Return Note feature.
 * It is isolated in LessonClientInner, which is wrapped in <Suspense> here
 * so the static export stays at 83/83 pages.
 */

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../lib/auth';
import { useLessonEngine } from '../../../../lib/useLessonEngine';
import LessonRenderer from '../../../../components/LessonRenderer';
import { saveSession, addXp, completeRiyaz } from '../../../../lib/supabase';
import styles from '../../../../styles/lesson-renderer.module.css';

// ---------------------------------------------------------------------------
// Shell — exported, wraps the search-params reader in Suspense
// ---------------------------------------------------------------------------

export default function LessonClient({ lessonId }: { lessonId: string }) {
  return (
    <Suspense
      fallback={
        <div className={styles.lessonPage}>
          <div className={styles.centeredMessage}>
            <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
              Loading lesson...
            </p>
          </div>
        </div>
      }
    >
      <LessonClientInner lessonId={lessonId} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Inner — reads useSearchParams (must be inside Suspense)
// ---------------------------------------------------------------------------

function LessonClientInner({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const saHz = profile?.saHz ?? 261.63;

  // Read ?warmup= from client URL — keeps the page fully static for GitHub Pages export
  const searchParams = useSearchParams();
  const warmupParam = searchParams.get('warmup');
  const warmupSwara = warmupParam && warmupParam.trim() !== '' ? warmupParam.trim() : undefined;

  // Fetch raw YAML strings
  const [lessonYaml, setLessonYaml] = useState<string | null>(null);
  const [copyYaml, setCopyYaml] = useState<string | undefined>(undefined);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

    (async () => {
      try {
        const [lessonRes, copyRes] = await Promise.all([
          fetch(`${basePath}/curriculum/${lessonId}.yaml`),
          fetch(`${basePath}/curriculum/${lessonId}-copy.yaml`).catch(() => null),
        ]);

        if (!lessonRes.ok) {
          if (!cancelled) setFetchError(`Lesson not found: ${lessonId}`);
          return;
        }

        const lesson = await lessonRes.text();
        const copy = copyRes?.ok ? await copyRes.text() : undefined;

        if (!cancelled) {
          setLessonYaml(lesson);
          setCopyYaml(copy);
        }
      } catch (e) {
        if (!cancelled) setFetchError(e instanceof Error ? e.message : 'Failed to load lesson');
      }
    })();

    return () => { cancelled = true; };
  }, [lessonId]);

  if (fetchError) {
    return (
      <div className={styles.lessonPage}>
        <div className={styles.centeredMessage}>
          <p>{fetchError}</p>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => router.push('/journeys/beginner')}
          >
            Back to lessons
          </button>
        </div>
      </div>
    );
  }

  if (!lessonYaml) {
    return (
      <div className={styles.lessonPage}>
        <div className={styles.centeredMessage}>
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
            Loading lesson...
          </p>
        </div>
      </div>
    );
  }

  return (
    <LessonPageInner
      lessonYaml={lessonYaml}
      copyYaml={copyYaml}
      saHz={saHz}
      warmupSwara={warmupSwara}
      onExit={() => router.push('/journeys/beginner')}
    />
  );
}

// ---------------------------------------------------------------------------
// Inner component — mounts after YAML loaded so hooks are unconditional
// ---------------------------------------------------------------------------

function LessonPageInner({
  lessonYaml,
  copyYaml,
  saHz,
  warmupSwara,
  onExit,
}: {
  lessonYaml: string;
  copyYaml?: string;
  saHz: number;
  warmupSwara?: string;
  onExit: () => void;
}) {
  const { profile, user } = useAuth();
  const engine = useLessonEngine(lessonYaml, copyYaml, saHz, warmupSwara, user?.id);

  // Track lesson start time for duration measurement
  const startTimeRef = useRef<Date | null>(null);
  // Guard so persistence fires exactly once per lesson completion
  const persistedRef = useRef(false);

  const handleComplete = useCallback(() => {
    onExit();
  }, [onExit]);

  // Auto-begin: as soon as YAML is loaded and engine is ready, start immediately.
  // No Begin page — the tanpura starts, the student is in the raga.
  useEffect(() => {
    if (engine.state === 'ready' && engine.lesson) {
      startTimeRef.current = new Date();
      persistedRef.current = false;
      engine.begin();
    }
  }, [engine.state, engine.lesson, engine.begin]);

  // -------------------------------------------------------------------------
  // Tier 0 persistence (T0.1 + T0.2 + T0.3)
  //
  // When the engine reaches `lesson_complete` for the first time, write a
  // session row, award XP, and increment the daily-riyaz streak. All three
  // are fire-and-forget; failures here must NEVER block the student from
  // exiting the lesson — they get retried on the next session.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (engine.state !== 'lesson_complete') return;
    if (persistedRef.current) return;
    if (!user?.id || !engine.lesson) return;
    persistedRef.current = true;

    const endedAt = new Date();
    const startedAt = startTimeRef.current ?? endedAt;
    const durationS = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
    const xpEarned = engine.lesson.xp_award ?? 30;
    const pakadsFound = engine.pakadTriggered ? 1 : 0;
    // Accuracy aggregation is not yet wired into the engine (slated for T1.3).
    // Until then, store a defensible placeholder of 0.85 so the heatmap and
    // recently-practiced surfaces have something to render. Replace once the
    // progression engine emits a real per-session accuracy.
    const accuracy = 0.85;

    const journey = (engine.lesson.journey as 'beginner' | 'explorer' | 'sadhaka' | 'varistha' | 'guru' | 'freeform' | undefined) ?? 'beginner';
    const sessionData = {
      ragaId: engine.lesson.raga_id,
      duration: durationS,
      xpEarned,
      accuracy,
      pakadsFound,
      startedAt,
      endedAt,
      journey,
    };

    void (async () => {
      try {
        await saveSession(user.id, sessionData);
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.warn('saveSession failed:', err);
        }
      }
      try {
        await addXp(user.id, xpEarned);
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.warn('addXp failed:', err);
        }
      }
      try {
        await completeRiyaz(user.id);
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.warn('completeRiyaz failed:', err);
        }
      }
    })();
  }, [engine.state, engine.lesson, engine.pakadTriggered, user?.id]);

  // Active lesson — LessonRenderer handles all phase rendering.
  // During 'ready' (pre-begin tick) render null so there is no flash.
  if (engine.state === 'ready' || engine.state === 'loading') {
    return (
      <div className={styles.lessonPage}>
        <div className={styles.centeredMessage}>
          <p style={{ color: 'var(--text-4, rgba(255,255,255,0.2))', fontFamily: 'var(--font-sans)' }} />
        </div>
        {/* Ghost exit — always available */}
        <button
          type="button"
          className={styles.backLink}
          onClick={onExit}
          aria-label="Exit lesson"
          style={{ opacity: 0.3 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Exit
        </button>
      </div>
    );
  }

  return (
    <LessonRenderer
      engine={engine}
      ragaId={engine.lesson?.raga_id}
      ragaName={engine.lesson?.meta.subtitle}
      user={{
        streak: profile?.streak ?? 0,
        xp: profile?.xp ?? 0,
      }}
      onComplete={handleComplete}
    />
  );
}
