/**
 * PakadMoment.tsx — Cinematic pakad recognition ceremony
 *
 * The WOW moment: triggered when the engine recognises the student
 * singing a raga's pakad (characteristic phrase).
 *
 * Layer 1 (cinematic pause, ~5.2s):
 *   - Tanpura continues uninterrupted (caller's responsibility)
 *   - Full-screen overlay: Deep background, 95% opacity
 *   - Raga name: Cormorant Garamond 72px, saffron at opacity 0.7 (not full white)
 *     Enters with cubic-bezier(0.22, 0.61, 0.36, 1) at 1600ms, y:24→0
 *   - If ragaNameDevanagari is provided: Noto Serif Devanagari shown above/below
 *     the romanised name, with a stroke-draw animation over ~1800ms via GSAP
 *     (graceful fallback to fade-in if GSAP unavailable)
 *   - Sargam notation: IBM Plex Mono, fades in at 1200ms
 *   - Auto-dismisses after 5200ms with fade-out
 *
 * Layer 2 (settles):
 *   - Toast at bottom: "You sang the pakad of [Raga]"
 *   - Fades to 40% opacity, stays for the rest of the session
 *
 * Props:
 *   ragaName: string — romanised raga name (Cormorant Garamond)
 *   ragaNameDevanagari?: string — Devanagari name (Noto Serif Devanagari, stroke-draw)
 *   sargam: string — the sargam notation (IBM Plex Mono)
 *   onDismiss: () => void — called when the overlay auto-dismisses
 *
 * Uses Framer Motion AnimatePresence for enter/exit transitions.
 * SSR-safe. Reduced-motion: instant show/hide, no fade.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/pakad-moment.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PakadMomentProps {
  /** The raga name to display in the overlay (romanised). */
  ragaName: string;
  /**
   * Devanagari raga name for stroke-draw animation.
   * When provided, shown with a GSAP stroke-draw effect over ~1800ms.
   * Graceful fallback: fades in if GSAP unavailable or reduced-motion.
   */
  ragaNameDevanagari?: string;
  /** The sargam notation string (e.g. "Ga Pa Dha Pa Ga"). */
  sargam: string;
  /** Called when the overlay auto-dismisses (after 5200ms). */
  onDismiss: () => void;
  /**
   * Called with the tanpura gain target so the parent can duck/restore.
   *
   * Sequence (driven by the overlay):
   *   - mount:      onTanpuraDuck(0, 2000)    — ease to silence over 2000ms
   *   - at 3800ms:  onTanpuraDuck(1, 400)     — restore over 400ms before dismiss
   *
   * The parent is responsible for applying the gain ramp. This keeps the
   * audio layer (TanpuraDrone) decoupled from the UI layer.
   */
  onTanpuraDuck?: (targetGain: number, rampMs: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total overlay hold time before auto-dismiss (ms). */
const OVERLAY_DURATION_MS = 5200;
/**
 * Raga name entry duration (seconds).
 * Uses cubic-bezier(0.22, 0.61, 0.36, 1) — a deceleration curve that
 * feels more considered and less bouncy than the previous ease-out.
 */
const RAGA_FADE_IN_S = 1.2;
/** Delay before raga name enters (seconds). */
const RAGA_ENTRY_DELAY_S = 0.4;
/** Devanagari name stroke-draw duration (seconds). */
const DEVANAGARI_DRAW_DURATION_S = 1.8;
/** Delay before Devanagari name starts drawing (seconds). */
const DEVANAGARI_DELAY_S = 0.2;
/** Sargam fade-in delay (seconds). */
const SARGAM_DELAY_S = 1.6;
const EXIT_DURATION_MS = 0.6;

/** The considered easing — deceleration curve for the raga name entry. */
const ENTRY_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PakadMoment({
  ragaName,
  ragaNameDevanagari,
  sargam,
  onDismiss,
  onTanpuraDuck,
}: PakadMomentProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissCalled = useRef(false);

  // Tanpura duck sequence:
  //   mount     → ease to 0 over 2000ms
  //   at 3800ms → restore to 1 over 400ms (before the 5200ms dismiss)
  useEffect(() => {
    if (onTanpuraDuck) {
      onTanpuraDuck(0, 2000);
      restoreTimer.current = setTimeout(() => {
        onTanpuraDuck(1, 400);
      }, 3800);
    }
    return () => {
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
      // Ensure tanpura is restored if overlay is dismissed early
      if (onTanpuraDuck) onTanpuraDuck(1, 400);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally omit onTanpuraDuck — stable ref expected from parent

  // Auto-dismiss the overlay after OVERLAY_DURATION_MS
  useEffect(() => {
    dismissTimer.current = setTimeout(() => {
      setShowOverlay(false);
      setShowToast(true);

      if (!dismissCalled.current) {
        dismissCalled.current = true;
        onDismiss();
      }
    }, OVERLAY_DURATION_MS);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [onDismiss]);

  // Allow Escape to dismiss early
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOverlay) {
        setShowOverlay(false);
        setShowToast(true);
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        if (!dismissCalled.current) {
          dismissCalled.current = true;
          onDismiss();
        }
      }
    },
    [showOverlay, onDismiss],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Layer 1: Cinematic overlay — 5200ms hold */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: EXIT_DURATION_MS, ease: ENTRY_EASE }}
            role="status"
            aria-live="assertive"
            aria-label={`Pakad recognised: ${ragaName}`}
          >
            {/* Devanagari raga name — stroke-draw over 1800ms, graceful fade fallback */}
            {ragaNameDevanagari && (
              <motion.p
                className={styles.ragaNameDevanagari}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                transition={{
                  duration: DEVANAGARI_DRAW_DURATION_S,
                  delay: DEVANAGARI_DELAY_S,
                  ease: ENTRY_EASE,
                }}
              >
                {ragaNameDevanagari}
              </motion.p>
            )}

            {/* Raga name — enters at opacity 0.7 (not full white), considered easing */}
            <motion.h2
              className={styles.ragaName}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{
                duration: RAGA_FADE_IN_S,
                delay: RAGA_ENTRY_DELAY_S,
                ease: ENTRY_EASE,
              }}
            >
              {ragaName}
            </motion.h2>

            {/* Sargam notation — fades in at 1600ms */}
            <motion.p
              className={styles.sargam}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{
                duration: 0.6,
                delay: SARGAM_DELAY_S,
                ease: ENTRY_EASE,
              }}
            >
              {sargam}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 2: Persistent toast */}
      {showToast && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.6, ease: ENTRY_EASE }}
          aria-live="polite"
        >
          You sang the pakad of {ragaName}
        </motion.div>
      )}
    </>
  );
}
