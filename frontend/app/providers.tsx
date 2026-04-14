'use client';

/**
 * Client-side providers wrapper.
 *
 * layout.tsx is a server component (required for metadata export).
 * All client-side context providers are composed here and rendered
 * as a single client boundary in the layout.
 *
 * Floating chrome rendered here (rather than layout.tsx) so each component
 * can call client-side hooks (usePathname, useAuth, useReducedMotion):
 *   - ScriptToggle    bottom-right
 *   - ThemeToggle     bottom-right, above ScriptToggle
 *   - ReducedMotion   sets data-reduced-motion on <html> for CSS + Framer Motion
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthProvider, useAuth } from './lib/auth';
import { VoiceWaveProvider } from './lib/VoiceWaveContext';
import { useReducedMotion } from './lib/useReducedMotion';
import { getLevelTitle } from './lib/types';
import ScriptToggle from './components/ScriptToggle';
import ThemeToggle from './components/ThemeToggle';
import VoiceWave from './components/VoiceWave';

/**
 * ReducedMotionBridge — sets data-reduced-motion="true"|"false" on <html>.
 *
 * This lets CSS rules and Framer Motion's MotionConfig read the preference
 * without each leaf component needing the hook. Example CSS usage:
 *
 *   [data-reduced-motion="true"] .my-animated-el {
 *     animation: none;
 *     transition: none;
 *   }
 *
 * Framer Motion usage (in any client component):
 *   import { useReducedMotion } from '@/app/lib/useReducedMotion';
 *   const reduced = useReducedMotion();
 *   <motion.div transition={reduced ? { duration: 0 } : springPreset} />
 */
function ReducedMotionBridge() {
  const reduced = useReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reduced ? 'true' : 'false';
  }, [reduced]);

  return null;
}

/**
 * LevelBridge — sets data-level on <html> from user profile.
 *
 * The interface deepens invisibly as the student progresses:
 * Shishya (base) → Sadhaka (warmer borders) → Varistha (lapis precision)
 * → Guru (zarr-kashi gold hairlines). No announcements.
 */
function LevelBridge() {
  const { profile } = useAuth();

  useEffect(() => {
    const level = profile?.level ?? 1;
    const title = getLevelTitle(level).toLowerCase();
    document.documentElement.dataset.level = title;
  }, [profile?.level]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <VoiceWaveProvider>
          <ReducedMotionBridge />
          <LevelBridge />
          <VoiceWave variant="ambient" />
          {children}
          <ThemeToggle />
          <ScriptToggle />
        </VoiceWaveProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
