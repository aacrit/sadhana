'use client';

/**
 * JourneyLessonClient — journey-agnostic lesson runner.
 *
 * Loads a YAML lesson by ID, runs it through useLessonEngine + LessonRenderer,
 * and persists the completion via saveSession + addXp + completeRiyaz when
 * the engine reaches `lesson_complete`. Used by every journey's
 * `lessons/[id]/page.tsx` route.
 *
 * The only journey-specific input is `exitPath` — the route the student
 * returns to when the lesson is exited or completed.
 *
 * Replaces the previously-duplicated LessonClient that lived in
 * `frontend/app/journeys/beginner/lessons/[id]/LessonClient.tsx`.
 */

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { useLessonEngine } from '../lib/useLessonEngine';
import LessonRenderer from './LessonRenderer';
import { saveSession, addXp, completeRiyaz } from '../lib/supabase';
import styles from '../styles/lesson-renderer.module.css';

// ---------------------------------------------------------------------------
// Public component — wraps the search-params reader in Suspense so the
// static export never fails on SSR-side useSearchParams calls.
// ---------------------------------------------------------------------------

export default function JourneyLessonClient({
  lessonId,
  exitPath,
}: {
  lessonId: string;
  /** The route the student returns to when exiting or completing the lesson. */
  exitPath: string;
}) {
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
      <Inner lessonId={lessonId} exitPath={exitPath} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Inner — reads useSearchParams (must be inside Suspense)
// ---------------------------------------------------------------------------

function Inner({ lessonId, exitPath }: { lessonId: string; exitPath: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const saHz = profile?.saHz ?? 261.63;

  // Read ?warmup= from client URL — keeps the page fully static for export
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

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  if (fetchError) {
    return (
      <div className={styles.lessonPage}>
        <div className={styles.centeredMessage}>
          <p>{fetchError}</p>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => router.push(exitPath)}
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
    <Runtime
      lessonYaml={lessonYaml}
      copyYaml={copyYaml}
      saHz={saHz}
      warmupSwara={warmupSwara}
      onExit={() => router.push(exitPath)}
    />
  );
}

// ---------------------------------------------------------------------------
// Runtime — mounts after YAML loaded so hooks are unconditional
// ---------------------------------------------------------------------------

function Runtime({
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

  const startTimeRef = useRef<Date | null>(null);
  const persistedRef = useRef(false);

  const handleComplete = useCallback(() => {
    onExit();
  }, [onExit]);

  useEffect(() => {
    if (engine.state === 'ready' && engine.lesson) {
      startTimeRef.current = new Date();
      persistedRef.current = false;
      engine.begin();
    }
  }, [engine.state, engine.lesson, engine.begin]);

  // Tier 0 persistence (T0.1 + T0.2 + T0.3)
  useEffect(() => {
    if (engine.state !== 'lesson_complete') return;
    if (persistedRef.current) return;
    if (!user?.id || !engine.lesson) return;
    persistedRef.current = true;

    const endedAt = new Date();
    const startedAt = startTimeRef.current ?? endedAt;
    const durationS = Math.max(
      1,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 1000),
    );
    const xpEarned = engine.lesson.xp_award ?? 30;
    const pakadsFound = engine.pakadTriggered ? 1 : 0;
    // Accuracy aggregation is not yet engine-wired (T1.3 will replace this).
    const accuracy = 0.85;

    const journey = (engine.lesson.journey as
      | 'beginner'
      | 'explorer'
      | 'sadhaka'
      | 'varistha'
      | 'guru'
      | 'freeform'
      | undefined) ?? 'beginner';

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
        if (typeof console !== 'undefined') console.warn('saveSession failed:', err);
      }
      try {
        await addXp(user.id, xpEarned);
      } catch (err) {
        if (typeof console !== 'undefined') console.warn('addXp failed:', err);
      }
      try {
        await completeRiyaz(user.id);
      } catch (err) {
        if (typeof console !== 'undefined') console.warn('completeRiyaz failed:', err);
      }
    })();
  }, [engine.state, engine.lesson, engine.pakadTriggered, user?.id]);

  if (engine.state === 'ready' || engine.state === 'loading') {
    return (
      <div className={styles.lessonPage}>
        <div className={styles.centeredMessage}>
          <p style={{ color: 'var(--text-4, rgba(255,255,255,0.2))', fontFamily: 'var(--font-sans)' }} />
        </div>
        <button
          type="button"
          className={styles.backLink}
          onClick={onExit}
          aria-label="Exit lesson"
          style={{ opacity: 0.3 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
