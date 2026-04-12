/**
 * VoiceVisualization.tsx — 3-layer voice feedback visualization
 *
 * Layer 1 (ambient, always on): Canvas waveform — voice + tanpura alignment.
 * Layer 2 (primary): Target swara as glowing circle, student pitch as dot with trail.
 * Layer 3 (precision): Cents needle (-50 to +50). Tap to expand on Beginner,
 *   always visible for Varistha+.
 *
 * All colors via CSS custom properties. Respects prefers-reduced-motion.
 * Touch targets >= 44px. Keyboard accessible.
 */

'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
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
  // Clamp to -50..+50, map to 0..100
  const clamped = Math.max(-50, Math.min(50, cents));
  return ((clamped + 50) / 100) * 100;
}

/** Map cents deviation to a vertical offset for the pitch dot. */
function centsToY(cents: number, height: number): number {
  const center = height / 2;
  const range = height * 0.35; // dot can move 35% above/below center
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

  // Spring-animated pitch dot position
  const dotY = useMotionValue(0);
  const springY = useSpring(dotY, { stiffness: 300, damping: 25 });

  const status = useMemo(
    () => getCentsStatus(feedback.centsDeviation),
    [feedback.centsDeviation],
  );

  const centsPos = useMemo(
    () => centsToPosition(feedback.centsDeviation),
    [feedback.centsDeviation],
  );

  // Update pitch dot Y position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dotY.set(centsToY(feedback.centsDeviation, rect.height));
  }, [feedback.centsDeviation, dotY]);

  // ---------------------------------------------------------------------------
  // Layer 1: Waveform canvas
  // ---------------------------------------------------------------------------

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
      ctx.globalAlpha = feedback.amplitude * 0.8;

      const historyLen = feedback.pitchHistory.length;
      for (let i = 0; i < historyLen; i++) {
        const entry = feedback.pitchHistory[i];
        if (!entry) continue;
        const x = (i / historyLen) * w;
        // Normalize Hz to a visual Y position
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const targetClassName = [
    styles.targetCircle,
    status === 'correct' && styles.targetCircleCorrect,
    status === 'in-progress' && styles.targetCircleInProgress,
    status === 'needs-work' && styles.targetCircleNeedsWork,
  ]
    .filter(Boolean)
    .join(' ');

  const needleClassName = [
    styles.centsNeedle,
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

        {/* Pitch dot */}
        {feedback.hz !== null && (
          <motion.div
            className={styles.pitchDot}
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
      </div>

      {/* Layer 3: Cents needle */}
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
          <div
            className={needleClassName}
            style={{ left: `${centsPos}%`, transform: 'translateX(-50%)' }}
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
