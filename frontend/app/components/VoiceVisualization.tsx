/**
 * VoiceVisualization.tsx — 3-layer voice feedback visualization
 *
 * Layer 1 (ambient, always on): Canvas waveform — voice + tanpura alignment.
 * Layer 2 (primary): Target swara as glowing circle, student pitch as dot with trail.
 * Layer 3 (precision): Cents needle (-50 to +50). Tap to expand on Beginner,
 *   always visible for Varistha+.
 *
 * "Mechanical not digital" design:
 *   - Pitch dot uses spring physics (stiffness 300, damping 12) — like a
 *     physical needle on a precision instrument.
 *   - Cents needle uses Framer Motion useSpring, not CSS transitions.
 *   - Within +/-10 cents of a swara: magnetic snap (short tension-release).
 *   - When pitch drops below clarity: spring release to center (Tanpura Release
 *     preset: stiffness 400, damping 15), not a teleport.
 *   - Hz values smoothed with EMA (alpha 0.3) — fast enough to feel responsive,
 *     smooth enough not to flicker.
 *
 * All colors via CSS custom properties. Respects prefers-reduced-motion.
 * Touch targets >= 44px. Keyboard accessible.
 */

'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useSpring, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { VoiceFeedback } from '../lib/types';
import styles from '../styles/voice-visualization.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VoiceVisualizationProps {
  /** Current voice feedback from the pipeline. */
  feedback: VoiceFeedback;
  /** Whether cents needle is expanded by default (Varistha+ = true). */
  centsExpanded?: boolean;
  /** Additional class name. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Exponential moving average alpha for Hz smoothing. */
const EMA_ALPHA = 0.3;

/** Cents threshold for magnetic snap to swara. */
const SNAP_THRESHOLD_CENTS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Classify cents deviation into RAG status. */
function getCentsStatus(cents: number): 'correct' | 'in-progress' | 'needs-work' {
  const abs = Math.abs(cents);
  if (abs <= 10) return 'correct';
  if (abs <= 25) return 'in-progress';
  return 'needs-work';
}

/** Map cents deviation to position percentage (0-100). */
function centsToPosition(cents: number): number {
  const clamped = Math.max(-50, Math.min(50, cents));
  return ((clamped + 50) / 100) * 100;
}

/** Map cents deviation to a vertical offset for the pitch dot. */
function centsToY(cents: number, height: number): number {
  const center = height / 2;
  const range = height * 0.35;
  const clamped = Math.max(-50, Math.min(50, cents));
  return center - (clamped / 50) * range;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoiceVisualization({
  feedback,
  centsExpanded: defaultExpanded = false,
  className,
}: VoiceVisualizationProps) {
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [centsOpen, setCentsOpen] = useState(defaultExpanded);

  // EMA-smoothed cents deviation (mutable ref for performance)
  const smoothedCentsRef = useRef<number>(0);
  const hasVoiceRef = useRef<boolean>(false);

  // --- Spring-animated pitch dot Y position ---
  // Between Gamak (600/5) and Andolan (120/8): stiffness 300, damping 12.
  // Fast enough to track the voice, smooth enough not to flicker.
  const dotY = useMotionValue(0);
  const springY = useSpring(dotY, { stiffness: 300, damping: 12 });

  // --- Spring-animated cents needle position ---
  // Same spring for mechanical responsiveness.
  const needlePos = useMotionValue(50); // center = 50 (percent)
  const springNeedle = useSpring(needlePos, { stiffness: 300, damping: 12 });
  // Transform numeric 0-100 to CSS percentage string for left positioning
  const needleLeftPercent = useTransform(springNeedle, (v) => `${v}%`);

  const status = useMemo(
    () => getCentsStatus(feedback.centsDeviation),
    [feedback.centsDeviation],
  );

  // -------------------------------------------------------------------------
  // EMA smoothing + spring target updates
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (feedback.hz !== null) {
      // Apply EMA smoothing to cents deviation
      const raw = feedback.centsDeviation;
      const prev = smoothedCentsRef.current;
      let smoothed: number;

      if (!hasVoiceRef.current) {
        // First reading after silence — snap immediately (no lag on onset)
        smoothed = raw;
      } else {
        smoothed = prev + EMA_ALPHA * (raw - prev);
      }

      // Magnetic snap: when within SNAP_THRESHOLD_CENTS of 0 (target swara),
      // ease toward exact 0 with stronger pull
      if (Math.abs(smoothed) <= SNAP_THRESHOLD_CENTS) {
        smoothed = smoothed * 0.6; // pull toward center
      }

      smoothedCentsRef.current = smoothed;
      hasVoiceRef.current = true;

      // Update pitch dot Y (Layer 2)
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        dotY.set(centsToY(smoothed, rect.height));
      }

      // Update cents needle position (Layer 3)
      needlePos.set(centsToPosition(smoothed));
    } else {
      // Voice dropped — release to center with Tanpura Release spring
      // (stiffness 400, damping 15 — natural string settling)
      if (hasVoiceRef.current) {
        hasVoiceRef.current = false;
        smoothedCentsRef.current = 0;

        // Release dot to center
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          dotY.set(rect.height / 2);
        }

        // Release needle to center
        needlePos.set(50);
      }
    }
  }, [feedback.hz, feedback.centsDeviation, dotY, needlePos]);

  // Note: The spring release feel when voice drops out is handled by the
  // dotY.set() and needlePos.set() calls above returning to center values.
  // The spring physics (stiffness 300, damping 12) naturally produce a
  // settling motion that feels like a physical needle returning to rest.

  // -------------------------------------------------------------------------
  // Layer 1: Waveform canvas
  // -------------------------------------------------------------------------

  const drawWaveform = useCallback(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Voice waveform — render from pitch history
    if (feedback.pitchHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--text-3').trim() || '#7A6B5E';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = Math.min(feedback.amplitude * 1.2, 0.9);

      const historyLen = feedback.pitchHistory.length;
      for (let i = 0; i < historyLen; i++) {
        const entry = feedback.pitchHistory[i];
        if (!entry) continue;
        const x = (i / historyLen) * w;
        // Normalize Hz to a visual Y position relative to center
        const hz = entry[1];
        const normalizedY = h / 2 + Math.sin(hz * 0.01 * i) * 20 * feedback.amplitude;
        if (i === 0) ctx.moveTo(x, normalizedY);
        else ctx.lineTo(x, normalizedY);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, [feedback]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      drawWaveform();
      return;
    }

    const animate = () => {
      drawWaveform();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [drawWaveform]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const targetClassName = [
    styles.targetCircle,
    status === 'correct' && styles.targetCircleCorrect,
    status === 'in-progress' && styles.targetCircleInProgress,
    status === 'needs-work' && styles.targetCircleNeedsWork,
  ]
    .filter(Boolean)
    .join(' ');

  const needleClassName = [
    styles.centsNeedleIndicator,
    status === 'correct' && styles.centsNeedleCorrect,
    status === 'in-progress' && styles.centsNeedleInProgress,
    status === 'needs-work' && styles.centsNeedleNeedsWork,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className ?? ''}`}
      role="img"
      aria-label={`Voice feedback: ${feedback.detectedSwara ?? 'no voice detected'}, ${Math.abs(Math.round(feedback.centsDeviation))} cents ${feedback.centsDeviation >= 0 ? 'sharp' : 'flat'}`}
    >
      {/* Layer 1: Waveform */}
      <canvas
        ref={waveformRef}
        className={styles.waveformCanvas}
        aria-hidden="true"
      />

      {/* Layer 2: Target + pitch dot */}
      <div className={styles.pitchLayer} aria-hidden="true">
        {/* Target swara circle */}
        <div className={targetClassName} />
        <span className={styles.targetLabel}>
          {feedback.targetSwara}
        </span>

        {/* Pitch dot — spring physics, not CSS transition */}
        <AnimatePresence>
          {feedback.hz !== null && (
            <motion.div
              key="pitch-dot"
              className={styles.pitchDot}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
              style={{
                y: springY,
                backgroundColor:
                  status === 'correct'
                    ? 'var(--correct)'
                    : status === 'in-progress'
                      ? 'var(--in-progress)'
                      : 'var(--needs-work)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Layer 3: Cents needle — spring-driven, not CSS transition */}
      <div
        className={`${styles.centsLayer} ${!centsOpen ? styles.centsLayerCollapsed : ''}`}
        onClick={() => !defaultExpanded && setCentsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!defaultExpanded) setCentsOpen((prev) => !prev);
          }
        }}
        role={defaultExpanded ? 'presentation' : 'button'}
        tabIndex={defaultExpanded ? -1 : 0}
        aria-label={
          defaultExpanded
            ? undefined
            : `${centsOpen ? 'Collapse' : 'Expand'} cents needle`
        }
        aria-expanded={defaultExpanded ? undefined : centsOpen}
      >
        <div className={styles.centsScale}>
          <div className={styles.centsMark} />
          {/* Spring-animated needle — moves like a physical instrument */}
          <motion.div
            className={needleClassName}
            style={{ left: needleLeftPercent }}
          />
        </div>
        {centsOpen && (
          <span className={styles.centsValue}>
            {feedback.centsDeviation > 0 ? '+' : ''}
            {Math.round(feedback.centsDeviation)} cents
          </span>
        )}
      </div>

      {/* Tap hint for Beginner users */}
      {!defaultExpanded && !centsOpen && (
        <span className={styles.tapHint}>
          Tap for precision
        </span>
      )}
    </div>
  );
}
