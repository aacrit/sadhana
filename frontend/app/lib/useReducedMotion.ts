'use client';

/**
 * useReducedMotion — Detects the user's prefers-reduced-motion preference.
 *
 * Returns true when the OS/browser is set to reduce motion.
 * Responds live to changes (e.g. user toggles their system setting mid-session).
 *
 * Usage in React components:
 *
 *   import { useReducedMotion } from '@/app/lib/useReducedMotion';
 *
 *   function MyComponent() {
 *     const reducedMotion = useReducedMotion();
 *     // Pass to Framer Motion:
 *     //   <motion.div animate={reducedMotion ? {} : { opacity: 1 }} />
 *     // Or suppress canvas animation loops, GSAP timelines, Three.js scenes, etc.
 *   }
 *
 * CSS counterpart (already present in tokens.css and every module):
 *   @media (prefers-reduced-motion: reduce) { ... }
 *
 * For the data-attribute bridge (global CSS + Framer Motion's MotionConfig),
 * see the ReducedMotionProvider component in app/components/ReducedMotionProvider.tsx.
 *
 * Affected code sites (as of 2026-04-12):
 *   - VoiceWave.tsx         — animation loop paused, static waveform shown
 *   - TanpuraViz.tsx        — static curve rendered, Three.js loop cancelled
 *   - VoiceVisualization.tsx — dot trail disabled, no animations
 *   - Tantri.tsx            — rAF loop should be gated; strings rendered statically
 *   - Any Framer Motion component — pass reducedMotion to disable spring transitions
 */

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  // Default: false (motion on). Server-side render is motion-on by default;
  // the effect below corrects this on the client before first paint via the
  // MediaQueryList check.
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia(QUERY);
    setReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}
