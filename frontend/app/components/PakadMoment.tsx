/**
 * PakadMoment.tsx — Cinematic pakad recognition ceremony
 *
 * The WOW moment: triggered when the engine recognises the student
 * singing a raga's pakad (characteristic phrase).
 *
 * Layer 1 (cinematic pause, ~4s):
 *   - Tanpura continues uninterrupted
 *   - Full-screen overlay: Deep Indigo, 95% opacity
 *   - Raga name: Cormorant Garamond 72px, saffron, fades in over 800ms
 *   - Sargam notation: IBM Plex Mono 18px, white, fades in at 1200ms
 *   - Auto-dismisses after 4000ms with fade-out
 *
 * Layer 2 (settles):
 *   - Toast at bottom: "You just sang the pakad of [Raga]"
 *   - Fades to 40% opacity, stays for the rest of the session
 *
 * Props:
 *   ragaName: string — the raga name to display (Cormorant Garamond)
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
  /** The raga name to display in the overlay. */
  ragaName: string;
  /** The sargam notation string (e.g. "Ga Pa Dha Pa Ga"). */
  sargam: string;
  /** Called when the overlay auto-dismisses (after 4000ms). */
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERLAY_DURATION_MS = 4000;
const RAGA_FADE_IN_MS = 0.8;
const SARGAM_DELAY_MS = 1.2;
const EXIT_DURATION_MS = 0.6;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PakadMoment({
  ragaName,
  sargam,
  onDismiss,
}: PakadMomentProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissCalled = useRef(false);

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
      {/* Layer 1: Cinematic overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: EXIT_DURATION_MS, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="assertive"
            aria-label={`Pakad recognised: ${ragaName}`}
          >
            {/* Raga name — fades in over 800ms */}
            <motion.h2
              className={styles.ragaName}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: RAGA_FADE_IN_MS,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {ragaName}
            </motion.h2>

            {/* Sargam notation — fades in at 1200ms */}
            <motion.p
              className={styles.sargam}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{
                duration: 0.6,
                delay: SARGAM_DELAY_MS,
                ease: [0.16, 1, 0.3, 1],
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
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          aria-live="polite"
        >
          You sang the pakad of {ragaName}
        </motion.div>
      )}
    </>
  );
}
