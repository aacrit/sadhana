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

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthProvider, useAuth } from './lib/auth';
import { VoiceWaveProvider, useVoiceWave } from './lib/VoiceWaveContext';
import { useReducedMotion } from './lib/useReducedMotion';
import { getLevelTitle } from './lib/types';
import ScriptToggle from './components/ScriptToggle';
import ThemeToggle from './components/ThemeToggle';
import SaCalibrator from './components/SaCalibrator';
import AudioContextResumer from './components/AudioContextResumer';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorListener from './components/GlobalErrorListener';

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

/**
 * SaSeedBridge — seeds VoiceWaveContext.saHz from the user's stored profile.
 *
 * Runs once when the profile first loads. If the student has previously
 * calibrated their Sa (profile.saHz !== 261.63 default), the global
 * VoiceWave rendering uses the correct reference immediately on page load
 * rather than waiting for the lesson's sa_detection phase to fire.
 *
 * Must be mounted inside both AuthProvider and VoiceWaveProvider.
 */
function SaSeedBridge() {
  const { profile } = useAuth();
  const { setSaHz } = useVoiceWave();
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    if (!profile?.saHz) return;
    seededRef.current = true;
    setSaHz(profile.saHz);
  }, [profile?.saHz, setSaHz]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <VoiceWaveProvider>
            <ReducedMotionBridge />
            <LevelBridge />
            <SaSeedBridge />
            {/* Audit #1 — global AudioContext resume on visibilitychange.
                Critical for mobile where backgrounding suspends contexts. */}
            <AudioContextResumer />
            {/* Audit #13 — async error capture into the events table. */}
            <GlobalErrorListener />
            {children}
            <FloatingChrome />
          </VoiceWaveProvider>
        </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}

/**
 * FloatingChrome — Sa calibrator, ThemeToggle, ScriptToggle.
 *
 * Auto-hides when a practice session is active (analyser registered)
 * so the student's attention stays on Tantri and the music.
 */
function FloatingChrome() {
  const { analyser } = useVoiceWave();
  const isSessionActive = analyser !== null;

  return (
    <div
      style={{
        opacity: isSessionActive ? 0 : 1,
        pointerEvents: isSessionActive ? 'none' : 'auto',
        transition: 'opacity 0.6s ease-out',
      }}
    >
      <SaCalibratorGlobal />
      <ThemeToggle />
      <ScriptToggle />
    </div>
  );
}

/**
 * SaCalibratorGlobal — floating recalibrate button + modal.
 *
 * Renders on every page. The button only appears after the user has
 * a non-default Sa (i.e., they've calibrated at least once), or always
 * on lesson/practice pages. Clicking opens the SaCalibrator modal.
 */
function SaCalibratorGlobal() {
  const [open, setOpen] = useState(false);
  const { saHz } = useVoiceWave();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Recalibrate Sa (currently ${Math.round(saHz)} Hz)`}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--space-4) + 88px)',
          right: 'var(--space-4)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          height: 40,
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-3)',
          border: '1px solid rgba(232, 135, 30, 0.3)',
          color: 'var(--text-2)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          letterSpacing: '0.02em',
          transition: 'color var(--dur-fast), border-color var(--dur-fast), background var(--dur-fast)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <span style={{ color: '#E8871E', fontWeight: 600 }}>Sa</span>
        <span style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>
          {Math.round(saHz)} Hz
        </span>
      </button>
      <SaCalibrator open={open} onClose={() => setOpen(false)} />
    </>
  );
}
