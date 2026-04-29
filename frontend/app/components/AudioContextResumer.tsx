'use client';

/**
 * AudioContextResumer — global audio-lifecycle guard (audit #1).
 *
 * The single most likely cause of week-1 churn on mobile: iOS Safari and
 * Chrome on Android (with battery saver) suspend AudioContexts when the
 * tab is backgrounded, the screen locks, or the user switches apps.
 * `audioContext.resume()` is called once at start in pipeline.ts and
 * tanpura.ts; nothing wakes them back up. The student returns to the app
 * and the tanpura is silent, the pitch detector produces no events, the
 * lesson is dead with no error and no recovery affordance.
 *
 * This component:
 *   1. Listens for `visibilitychange` and window `focus`.
 *   2. On return-to-foreground, walks every live AudioContext registered
 *      via `registerAudioContext()` and calls `resume()`.
 *   3. If a context refuses to resume after one attempt, surfaces a
 *      "Tap to resume" overlay (Safari may require a fresh user gesture).
 *   4. Emits `audio-context-failed` telemetry when resume errors occur.
 *
 * Mounted at the root of the app (in providers.tsx).
 */

import { useEffect, useState, useCallback } from 'react';
import { emit, emitError } from '../lib/telemetry';
import { getRegisteredContexts } from '../lib/audio-context-registry';

export default function AudioContextResumer() {
  const [needsGesture, setNeedsGesture] = useState(false);

  const tryResumeAll = useCallback(async (origin: string) => {
    const ctxs = getRegisteredContexts();
    if (ctxs.length === 0) return;
    let stillSuspended = false;
    for (const ctx of ctxs) {
      if (!ctx) continue;
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
          if (ctx.state === 'suspended') stillSuspended = true;
        } catch (err) {
          stillSuspended = true;
          emitError('audio-context-failed', err, { origin, state: ctx.state });
        }
      }
    }
    if (stillSuspended) {
      setNeedsGesture(true);
      void emit('audio-context-suspended', { origin });
    } else {
      setNeedsGesture(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void tryResumeAll('visibilitychange');
      }
    };
    const onFocus = () => {
      void tryResumeAll('focus');
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [tryResumeAll]);

  const handleResumeClick = useCallback(async () => {
    // User-gesture path — Safari requires a touch/click to resume after
    // long suspension. This is the explicit fallback.
    await tryResumeAll('user-gesture');
  }, [tryResumeAll]);

  if (!needsGesture) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 26, 20, 0.92)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <button
        type="button"
        onClick={handleResumeClick}
        style={{
          padding: '1rem 2.5rem',
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          fontWeight: 300,
          color: '#E8871E',
          background: 'transparent',
          border: '1px solid #E8871E',
          borderRadius: 999,
          cursor: 'pointer',
          letterSpacing: '0.06em',
        }}
        aria-label="Tap to resume audio"
      >
        Tap to resume
      </button>
    </div>
  );
}
