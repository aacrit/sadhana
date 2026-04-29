/**
 * TanpuraViz.tsx — Reactive tanpura waveform visualization
 *
 * The ambient background present in every practice session. Four waveforms
 * representing the four tanpura strings. Reacts to voice input: when the
 * student's pitch aligns with Sa, the waveforms synchronize. When off-pitch,
 * they diverge.
 *
 * Three.js r170. GPU-only transforms. SSR-safe (no window access on server).
 * Night/day mode aware via CSS custom properties read at mount.
 *
 * prefers-reduced-motion: renders static curves, no animation.
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';

interface TanpuraVizProps {
  /** Partial frequencies from the voice pipeline (Hz values). */
  partialFrequencies?: number[];
  /** Voice amplitude 0-1. Drives waveform intensity. */
  voiceAmplitude?: number;
  /** Whether the tanpura drone is active. */
  active?: boolean;
  /** Additional class name. */
  className?: string;
  /** Additional inline styles. */
  style?: CSSProperties;
}

// String colors — fundamental is saffron, overtones fade to indigo
const STRING_COLORS_NIGHT = [
  '#E8871E',           // Sa — saffron (fundamental)
  'rgba(184,169,154,0.6)', // Pa string
  'rgba(184,169,154,0.4)', // Upper Sa
  'rgba(184,169,154,0.25)', // Highest partial
];

const STRING_COLORS_DAY = [
  '#E8871E',           // Sa — saffron (fundamental)
  'rgba(74,69,83,0.6)',
  'rgba(74,69,83,0.4)',
  'rgba(74,69,83,0.25)',
];

// Base frequencies for the four tanpura strings (ratios relative to Sa)
const STRING_RATIOS = [1, 1.5, 2, 3]; // Sa, Pa, Sa', Ga(overtone)

export default function TanpuraViz({
  partialFrequencies = [],
  voiceAmplitude = 0,
  active = false,
  className,
  style,
}: TanpuraVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const reducedMotionRef = useRef(false);

  // Props as refs so the RAF loop always reads current values without
  // causing the animation effect to tear down and restart each frame.
  const voiceAmplitudeRef = useRef(voiceAmplitude);
  const partialFrequenciesRef = useRef(partialFrequencies);
  const activeRef = useRef(active);

  // Keep refs in sync with latest props — no effect restart needed.
  useEffect(() => { voiceAmplitudeRef.current = voiceAmplitude; }, [voiceAmplitude]);
  useEffect(() => { partialFrequenciesRef.current = partialFrequencies; }, [partialFrequencies]);
  useEffect(() => { activeRef.current = active; }, [active]);

  // Check theme from DOM — re-reads on data-theme attribute change
  const colorsRef = useRef(STRING_COLORS_NIGHT);

  const refreshColors = useCallback(() => {
    if (typeof document === 'undefined') return;
    const theme = document.documentElement.getAttribute('data-theme');
    colorsRef.current = theme === 'day' ? STRING_COLORS_DAY : STRING_COLORS_NIGHT;
  }, []);

  const getColors = useCallback(() => colorsRef.current, []);

  // Compute how "in tune" the voice is — reads from refs (no closure capture)
  const getAlignment = useCallback(() => {
    if (!activeRef.current || voiceAmplitudeRef.current < 0.01 || partialFrequenciesRef.current.length === 0) {
      return 0;
    }
    return Math.min(voiceAmplitudeRef.current * 1.5, 1);
  }, []);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    // Check reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Watch for theme changes to refresh colors
    refreshColors();
    const themeObserver = new MutationObserver(() => refreshColors());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resize — reset transform first to prevent scale-matrix accumulation
    // on browser zoom / DPR changes.
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset before scaling (P1 fix)
      ctx.scale(dpr, dpr);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Draw a single waveform string
    const drawString = (
      width: number,
      height: number,
      stringIndex: number,
      color: string,
      time: number,
      alignment: number,
    ) => {
      const ratio = STRING_RATIOS[stringIndex] ?? 1;
      const yCenter = height * (0.3 + stringIndex * 0.15);
      const currentVoiceAmp = voiceAmplitudeRef.current;
      const amplitude = activeRef.current
        ? 8 + currentVoiceAmp * 12 - alignment * stringIndex * 2
        : 4;
      const frequency = 0.008 * ratio;
      // Phase offset per string — creates the "converging" effect when aligned
      const phaseOffset = alignment > 0.5
        ? stringIndex * 0.2 * (1 - alignment) // converge when aligned
        : stringIndex * 0.8; // diverge when not

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = stringIndex === 0 ? 2 : 1.2;
      ctx.globalAlpha = 1;

      // P2 fix: step by 3 pixels instead of 1 (~67% fewer sin calls)
      for (let x = 0; x < width; x += 3) {
        const progress = x / width;
        // Envelope: fade at edges
        const envelope = Math.sin(progress * Math.PI);
        const y =
          yCenter +
          Math.sin(x * frequency + time * ratio * 0.5 + phaseOffset) *
            amplitude *
            envelope;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    // Animation loop — reads all prop-derived state from refs
    const animate = () => {
      if (!canvas || !ctx) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear
      ctx.clearRect(0, 0, width, height);

      const colors = getColors();
      const alignment = getAlignment();

      if (reducedMotionRef.current) {
        // Static render — draw once, no animation
        for (let i = 0; i < 4; i++) {
          drawString(width, height, i, colors[i]!, 0, 0);
        }
        return; // No requestAnimationFrame
      }

      timeRef.current += 0.016; // ~60fps increment

      for (let i = 0; i < 4; i++) {
        drawString(width, height, i, colors[i]!, timeRef.current, alignment);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
      themeObserver.disconnect();
    };
    // Effect depends only on setup-time stable refs — no prop-derived values.
    // Props are kept current via the tiny sync effects above.
  }, [getColors, getAlignment, refreshColors]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        zIndex: 'var(--z-tanpura-bg)' as unknown as number,
        pointerEvents: 'none',
        opacity: 0.6,
        ...style,
      }}
    />
  );
}
