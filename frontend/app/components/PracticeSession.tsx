/**
 * PracticeSession.tsx — The core practice component
 *
 * This is where students actually sing. The tanpura drones in the background,
 * the voice pipeline listens, and the 3-layer visualization responds.
 *
 * Props: ragaId, onComplete
 * Phases: preparing -> listening -> active -> pakad-moment -> completing -> complete
 *
 * Pakad recognition triggers a cinematic GSAP moment:
 *   - Background deepens to full indigo
 *   - Raga name appears large, center
 *   - Sargam notation below
 *   - Fades after 4s, toast remains at 40% opacity
 *
 * Keyboard accessible: spacebar toggles voice, escape ends session.
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRagaById } from '@/engine/theory';
import type { Raga } from '@/engine/theory/types';
import VoiceVisualization from './VoiceVisualization';
import TanpuraViz from './TanpuraViz';
import type { PracticePhase, VoiceFeedback, SessionData } from '../lib/types';
import styles from '../styles/practice-session.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PracticeSessionProps {
  /** The raga to practice. */
  ragaId: string;
  /** Called when the session completes. */
  onComplete?: (session: SessionData) => void;
}

// ---------------------------------------------------------------------------
// Default voice feedback (silent)
// ---------------------------------------------------------------------------

const SILENT_FEEDBACK: VoiceFeedback = {
  hz: null,
  centsDeviation: 0,
  targetSwara: 'Sa',
  detectedSwara: null,
  confidence: 0,
  amplitude: 0,
  pitchHistory: [],
};

// ---------------------------------------------------------------------------
// Timer formatting
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PracticeSession({
  ragaId,
  onComplete,
}: PracticeSessionProps) {
  const raga: Raga | undefined = useMemo(() => getRagaById(ragaId), [ragaId]);
  const [phase, setPhase] = useState<PracticePhase>('preparing');
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<VoiceFeedback>(SILENT_FEEDBACK);
  const [pakadDetected, setPakadDetected] = useState(false);
  const [pakadPhrase, setPakadPhrase] = useState('');
  const [showPakadOverlay, setShowPakadOverlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<Date>(new Date());

  // -- Timer --
  useEffect(() => {
    if (phase === 'active' || phase === 'listening') {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // -- Preparing phase: auto-transition after 2s --
  useEffect(() => {
    if (phase === 'preparing') {
      const timeout = setTimeout(() => setPhase('listening'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  // -- Keyboard controls --
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (phase === 'listening') {
          setPhase('active');
        } else if (phase === 'active') {
          setPhase('listening');
        }
      }
      if (e.key === 'Escape') {
        if (phase === 'active' || phase === 'listening') {
          setPhase('completing');
        }
      }
    },
    [phase],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // -- Pakad moment: cinematic reveal --
  const triggerPakadMoment = useCallback(
    (sargamNotation: string) => {
      if (pakadDetected) return; // Only first time per session
      setPakadDetected(true);
      setPakadPhrase(sargamNotation);
      setShowPakadOverlay(true);

      // Phase changes for 4s
      const prevPhase = phase;
      setPhase('pakad-moment');

      setTimeout(() => {
        setShowPakadOverlay(false);
        setPhase(prevPhase === 'pakad-moment' ? 'active' : prevPhase);
      }, 4000);
    },
    [pakadDetected, phase],
  );

  // -- Complete session --
  const completeSession = useCallback(() => {
    setPhase('complete');
    if (timerRef.current) clearInterval(timerRef.current);

    const session: SessionData = {
      ragaId,
      duration: elapsed,
      xpEarned: Math.floor(elapsed / 10), // 1 XP per 10 seconds
      accuracy: 0, // Placeholder — computed from voice pipeline stats
      pakadsFound: pakadDetected ? 1 : 0,
      startedAt: sessionStartRef.current,
      endedAt: new Date(),
    };

    onComplete?.(session);
  }, [ragaId, elapsed, pakadDetected, onComplete]);

  // -- Completing phase: auto-finish after 1s --
  useEffect(() => {
    if (phase === 'completing') {
      const timeout = setTimeout(completeSession, 1000);
      return () => clearTimeout(timeout);
    }
  }, [phase, completeSession]);

  // Expose triggerPakadMoment for voice pipeline integration
  // (In production, the voice pipeline would call this via a ref or context)
  void triggerPakadMoment;
  void setFeedback;

  // -- Fallback for unknown raga --
  if (!raga) {
    return (
      <div className={styles.session}>
        <p style={{ color: 'var(--text-3)', textAlign: 'center' }}>
          Raga not found: {ragaId}
        </p>
      </div>
    );
  }

  // -- Build current target swara for display --
  const currentTarget = feedback.targetSwara;
  const arohaDisplay = raga.aroha.map((n) => n.swara).join(' ');

  return (
    <div className={styles.session} role="main" aria-label={`Practice session: ${raga.name}`}>
      {/* Ambient tanpura background */}
      <TanpuraViz
        active={phase !== 'preparing' && phase !== 'complete'}
        voiceAmplitude={feedback.amplitude}
      />

      {/* Preparing state */}
      {phase === 'preparing' && (
        <div className={styles.preparing}>
          <p className={styles.preparingText}>Preparing tanpura...</p>
        </div>
      )}

      {/* Active/listening states */}
      {(phase === 'listening' ||
        phase === 'active' ||
        phase === 'pakad-moment') && (
        <>
          {/* Header: raga name + timer */}
          <header className={styles.sessionHeader}>
            <h1 className={styles.ragaName}>{raga.name}</h1>
            <time className={styles.timer} aria-label="Session timer">
              {formatTime(elapsed)}
            </time>
          </header>

          {/* Current swara target */}
          <div className={styles.targetSection}>
            <span className={styles.targetLabel}>Sing</span>
            <span className={styles.targetSwara}>{currentTarget}</span>
          </div>

          {/* Visualization */}
          <div className={styles.vizArea}>
            <VoiceVisualization feedback={feedback} />

            {/* Exercise prompt */}
            <div className={styles.prompt}>
              <p className={styles.promptText}>Follow the aroha</p>
              <p className={styles.promptSargam}>{arohaDisplay}</p>
            </div>
          </div>

          {/* Controls */}
          <nav className={styles.controls} aria-label="Session controls">
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => setPhase('completing')}
              aria-label="End session"
            >
              End
            </button>
            <button
              type="button"
              className={`${styles.controlButton} ${styles.controlButtonPrimary}`}
              onClick={() =>
                setPhase(phase === 'active' ? 'listening' : 'active')
              }
              aria-label={phase === 'active' ? 'Pause voice' : 'Start singing'}
            >
              {phase === 'active' ? 'Pause' : 'Sing'}
            </button>
          </nav>
        </>
      )}

      {/* Completing state */}
      {phase === 'completing' && (
        <div className={styles.preparing}>
          <p className={styles.preparingText}>Completing session...</p>
        </div>
      )}

      {/* Complete state */}
      {phase === 'complete' && (
        <div className={styles.complete}>
          <h2 className={styles.completeTitle}>Session complete</h2>
          <div className={styles.completeStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatTime(elapsed)}</span>
              <span className={styles.statLabel}>Duration</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {Math.floor(elapsed / 10)}
              </span>
              <span className={styles.statLabel}>XP earned</span>
            </div>
            {pakadDetected && (
              <div className={styles.stat}>
                <span className={styles.statValue} style={{ color: 'var(--accent)' }}>
                  1
                </span>
                <span className={styles.statLabel}>Pakad found</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pakad cinematic overlay */}
      <AnimatePresence>
        {showPakadOverlay && (
          <motion.div
            className={styles.pakadOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            aria-live="polite"
          >
            <motion.h2
              className={styles.pakadRaga}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {raga.name}
            </motion.h2>
            <motion.p
              className={styles.pakadSargam}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {pakadPhrase}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent pakad toast */}
      {pakadDetected && !showPakadOverlay && phase !== 'complete' && (
        <div className={styles.pakadToast} aria-live="polite">
          You sang the pakad of {raga.name}
        </div>
      )}
    </div>
  );
}
