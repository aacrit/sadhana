'use client';

/**
 * VoiceWave.tsx — Unified real-time voice waveform with swara markers.
 *
 * A single voice wave engine that renders across the entire app:
 *   - 'full': full-screen flowing waveform (freeform riyaz)
 *   - 'compact': horizontal strip (lessons, practice views)
 *   - 'ambient': background wind lines (home, navigation)
 *
 * When the VoicePipeline is active (AnalyserNode available via context),
 * renders actual mic time-domain data as flowing lines. When idle, renders
 * gentle sine waves that drift like wind (the TanpuraViz aesthetic).
 *
 * 12 swara frequency positions are shown as subtle horizontal guide marks,
 * mapping Hz positions relative to the student's Sa.
 *
 * Canvas-based, 60fps, DPR-aware, reduced-motion safe, SSR-safe.
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useVoiceWave } from '../lib/VoiceWaveContext';
import { SWARAS } from '@/engine/theory/swaras';
import styles from '../styles/voice-wave.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VoiceWaveVariant = 'full' | 'compact' | 'ambient';

interface VoiceWaveProps {
  /** Display variant controls size and detail level. */
  variant?: VoiceWaveVariant;
  /** Override Sa Hz (otherwise reads from VoiceWaveContext). */
  saHz?: number;
  /** Additional class name. */
  className?: string;
  /** Additional inline styles. */
  style?: CSSProperties;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of flowing wave lines to render. */
const NUM_LINES = 5;

/** Swara abbreviations for display on markers. */
const SWARA_LABELS: Record<string, string> = {
  Sa: 'S', Re_k: 'r', Re: 'R', Ga_k: 'g', Ga: 'G',
  Ma: 'M', Ma_t: 'M\u0305', Pa: 'P', Dha_k: 'd', Dha: 'D',
  Ni_k: 'n', Ni: 'N',
};

/** Line colors — each wave line fades from saffron to muted. */
const LINE_COLORS_NIGHT = [
  'rgba(232, 135, 30, 0.40)',  // saffron — primary
  'rgba(184, 169, 154, 0.25)',
  'rgba(184, 169, 154, 0.18)',
  'rgba(184, 169, 154, 0.12)',
  'rgba(184, 169, 154, 0.08)',
];

const LINE_COLORS_DAY = [
  'rgba(232, 135, 30, 0.35)',
  'rgba(74, 69, 83, 0.22)',
  'rgba(74, 69, 83, 0.16)',
  'rgba(74, 69, 83, 0.10)',
  'rgba(74, 69, 83, 0.06)',
];

/** Frequency range for the waveform display (vocal range). */
const FREQ_MIN = 80;   // Hz — below this is subsonic for voice
const FREQ_MAX = 1200;  // Hz — well above typical vocal Sa upper

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a frequency (Hz) to a Y position on the canvas. */
function hzToY(hz: number, height: number, padding: number): number {
  // Logarithmic scale: more natural for musical frequencies
  const logMin = Math.log2(FREQ_MIN);
  const logMax = Math.log2(FREQ_MAX);
  const logHz = Math.log2(Math.max(FREQ_MIN, Math.min(FREQ_MAX, hz)));
  // Invert: lower frequencies at bottom, higher at top
  const normalized = (logHz - logMin) / (logMax - logMin);
  return padding + (1 - normalized) * (height - 2 * padding);
}

/** Get current theme from DOM. */
function getTheme(): 'night' | 'day' {
  if (typeof document === 'undefined') return 'night';
  return document.documentElement.getAttribute('data-theme') === 'day' ? 'day' : 'night';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoiceWave({
  variant = 'ambient',
  saHz: propSaHz,
  className,
  style,
}: VoiceWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const waveformDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const { analyser, saHz: contextSaHz } = useVoiceWave();
  const saHz = propSaHz ?? contextSaHz;

  // Compute swara Y positions for markers
  const swaraMarkers = useMemo(() => {
    return SWARAS.map((s) => ({
      symbol: s.symbol,
      label: SWARA_LABELS[s.symbol] ?? s.sargamAbbr,
      hz: saHz * (s.ratioNumerator / s.ratioDenominator),
      achala: s.achala, // Sa and Pa are achala (immovable)
    }));
  }, [saHz]);

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();

    // Resize canvas to match display
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;
    const isNight = getTheme() === 'night';
    const colors = isNight ? LINE_COLORS_NIGHT : LINE_COLORS_DAY;
    const padding = variant === 'compact' ? 4 : 16;
    const showLabels = variant !== 'compact';

    ctx.clearRect(0, 0, w, h);

    // --- Swara markers (subtle horizontal lines) ---
    const markerAlpha = variant === 'full' ? 0.12 : variant === 'compact' ? 0.06 : 0.04;
    const labelAlpha = variant === 'full' ? 0.35 : 0.20;

    for (const marker of swaraMarkers) {
      if (marker.hz < FREQ_MIN || marker.hz > FREQ_MAX) continue;

      const y = hzToY(marker.hz, h, padding);

      // Horizontal guide line
      ctx.beginPath();
      ctx.strokeStyle = marker.achala
        ? (isNight ? `rgba(232, 135, 30, ${markerAlpha * 1.5})` : `rgba(232, 135, 30, ${markerAlpha * 1.2})`)
        : (isNight ? `rgba(184, 169, 154, ${markerAlpha})` : `rgba(74, 69, 83, ${markerAlpha})`);
      ctx.lineWidth = marker.achala ? 1 : 0.5;
      ctx.setLineDash(marker.achala ? [] : [4, 8]);
      ctx.moveTo(showLabels ? 24 : 0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      if (showLabels) {
        ctx.font = `${variant === 'full' ? 10 : 9}px var(--font-mono, monospace)`;
        ctx.fillStyle = marker.achala
          ? `rgba(232, 135, 30, ${labelAlpha * 1.3})`
          : (isNight ? `rgba(184, 169, 154, ${labelAlpha})` : `rgba(74, 69, 83, ${labelAlpha})`);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(marker.label, 4, y);
      }
    }

    // --- Waveform lines ---
    const hasLiveData = analyser !== null;
    let timeDomain: Float32Array | null = null;

    if (hasLiveData && analyser) {
      // Read real-time mic data from the shared AnalyserNode
      const bufferLen = analyser.fftSize;
      if (!waveformDataRef.current || waveformDataRef.current.length !== bufferLen) {
        waveformDataRef.current = new Float32Array(bufferLen);
      }
      analyser.getFloatTimeDomainData(waveformDataRef.current);
      timeDomain = waveformDataRef.current;
    }

    // Draw flowing wave lines
    for (let lineIdx = 0; lineIdx < NUM_LINES; lineIdx++) {
      ctx.beginPath();
      ctx.strokeStyle = colors[lineIdx] ?? colors[0]!;
      ctx.lineWidth = lineIdx === 0 ? 2 : 1.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const yCenter = h * (0.2 + lineIdx * 0.15);
      const baseFreq = 0.006 + lineIdx * 0.002;
      const phaseOffset = lineIdx * 1.2;
      const time = timeRef.current;

      for (let x = 0; x < w; x++) {
        const progress = x / w;
        // Envelope: fade at edges (sinusoidal window)
        const envelope = Math.sin(progress * Math.PI);

        let amplitude: number;

        if (hasLiveData && timeDomain) {
          // Map canvas x to waveform buffer index
          const bufIdx = Math.floor(progress * timeDomain.length);
          const sample = timeDomain[bufIdx] ?? 0;

          // Mix live data with gentle ambient motion
          const liveAmp = sample * (variant === 'full' ? 120 : variant === 'compact' ? 40 : 60);
          const ambientAmp = Math.sin(x * baseFreq + time * 0.4 + phaseOffset) *
            (variant === 'full' ? 6 : 3);

          amplitude = (liveAmp + ambientAmp) * envelope;
        } else {
          // Ambient: gentle flowing sine waves (wind lines)
          const wave1 = Math.sin(x * baseFreq + time * 0.5 + phaseOffset);
          const wave2 = Math.sin(x * baseFreq * 0.5 + time * 0.3 - phaseOffset * 0.7) * 0.5;
          const wave3 = Math.sin(x * baseFreq * 2.1 + time * 0.8 + lineIdx) * 0.2;

          const baseAmp = variant === 'full' ? 10 : variant === 'compact' ? 5 : 6;
          amplitude = (wave1 + wave2 + wave3) * baseAmp * envelope;
        }

        const y = yCenter + amplitude;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }
  }, [analyser, swaraMarkers, variant]);

  // -------------------------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Handle resize
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      // Reset canvas dimensions on next draw
      const c = canvasRef.current;
      if (c) {
        c.width = 0; // force re-init in draw()
      }
    });
    resizeObserver.observe(canvas);

    const animate = () => {
      if (reducedMotionRef.current) {
        // Static render once
        draw();
        return;
      }

      // Skip draw when tab is hidden — save CPU/battery on mobile
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      timeRef.current += 0.016;
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [draw]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const variantClass =
    variant === 'full'
      ? styles.full
      : variant === 'compact'
        ? styles.compact
        : styles.ambient;

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvas} ${variantClass} ${className ?? ''}`}
      aria-hidden="true"
      style={style}
    />
  );
}
