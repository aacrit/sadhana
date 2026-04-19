'use client';

/**
 * LessonClient — client component that loads a YAML lesson by ID
 * and renders it via useLessonEngine + LessonRenderer.
 *
 * useSearchParams() is used to read ?warmup= for the Return Note feature.
 * It is isolated in LessonClientInner, which is wrapped in <Suspense> here
 * so the static export stays at 83/83 pages.
 */

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../lib/auth';
import { useLessonEngine } from '../../../../lib/useLessonEngine';
import LessonRenderer from '../../../../components/LessonRenderer';
import Tantri from '../../../../components/Tantri';
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
  const engine = useLessonEngine(lessonYaml, copyYaml, saHz, warmupSwara);
  const { profile } = useAuth();

  const handleComplete = useCallback(() => {
    onExit();
  }, [onExit]);

  // Ready state — show lesson info + begin button
  if (engine.state === 'ready' && engine.lesson) {
    return (
      <div className={styles.lessonPage} data-raga={engine.lesson.raga_id}>
        <Tantri
          saHz={saHz}
          ragaId={engine.lesson.raga_id}
          level="shishya"
          subLevel={1}
          variant="full"
          style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
        />
        <motion.div
          className={styles.centeredMessage}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ zIndex: 2 }}
        >
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-light)',
            color: 'var(--text)',
            marginBottom: 'var(--space-2)',
          }}>
            {engine.lesson.meta.title}
          </h1>
          {engine.lesson.meta.subtitle && (
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-3)',
              marginBottom: 'var(--space-6)',
            }}>
              {engine.lesson.meta.subtitle}
            </p>
          )}
          <button
            type="button"
            className={styles.actionButton}
            onClick={engine.begin}
          >
            Begin
          </button>
        </motion.div>
      </div>
    );
  }

  // Active lesson — LessonRenderer handles all phase rendering
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
