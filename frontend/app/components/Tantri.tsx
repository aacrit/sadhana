'use client';

/**
 * Tantri (तन्त्री) — Interactive swara string instrument.
 *
 * THE interface layer between the music engine and the human ear.
 *
 * 12 horizontal strings, each representing a chromatic swara, positioned
 * by just-intonation frequency ratio on a logarithmic scale. Each string is:
 *
 *   INPUT  — vibrates when the student's voice is near that frequency.
 *            Color encodes accuracy (saffron=perfect, green=good, amber=close).
 *            Amplitude encodes vocal intensity.
 *
 *   OUTPUT — touch/click triggers harmonium synthesis of that swara.
 *            Spring physics: Kan snap on contact, Tanpura Release on release.
 *
 * Variants:
 *   - full:    Full-screen, all strings, labels, cinematic focus
 *   - compact: 120px strip, in-raga strings only, single-char labels
 *
 * The canvas renders at 60fps with standing-wave waveforms, sympathetic
 * vibrations, accuracy color encoding, and spring-physics interactions.
 */

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  memo,
} from 'react';

import {
  createTantriField,
  mapVoiceToStrings,
  updateFieldFromVoice,
  triggerString,
  releaseString,
  applyLevelVisibility,
  accuracyToColor,
  generateStringWaveform,
  SPRING_PRESETS,
} from '@/engine/interaction/tantri';
import type {
  TantriField,
  TantriStringState,
  TantriPlayEvent,
  TantriTimbre,
  AccuracyBand,
  VoiceMapResult,
} from '@/engine/interaction/tantri';
import type { Swara } from '@/engine/theory/types';
import type { Level } from '@/engine/analysis/pitch-mapping';

import styles from '../styles/tantri.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TantriProps {
  /** Student's Sa frequency in Hz. */
  saHz: number;

  /** Current raga ID (null for chromatic/freeform). */
  ragaId?: string | null;

  /** Student level for progressive string disclosure. */
  level?: Level;

  /** Sub-level within the journey tier (1-based). */
  subLevel?: number;

  /** Display variant. */
  variant?: 'full' | 'compact';

  /** AnalyserNode from the voice pipeline for real-time input. */
  analyser?: AnalyserNode | null;

  /**
   * Live pitch data from the voice pipeline.
   * When provided, Tantri uses this for accurate string mapping
   * instead of relying solely on the analyser's amplitude.
   */
  pitchHz?: number | null;

  /** Clarity of the pitch detection (0–1). */
  pitchClarity?: number;

  /** Callback when a string is triggered by touch/click. */
  onStringTrigger?: (event: TantriPlayEvent) => void;

  /**
   * TantriVoice(TM) — Instrument timbre for string touch playback.
   * 'harmonium' (default): existing harmonium synthesis
   * 'voice-male' / 'voice-female': vocal formant synthesis
   */
  timbre?: TantriTimbre;

  /**
   * Callback: fires when Tantri's activity state changes.
   * true = at least one string is vibrating (voice or touch).
   * Use to defocus surrounding UI for cinematic immersion.
   */
  onActivityChange?: (active: boolean) => void;

  /** Additional className. */
  className?: string;

  /** Inline styles. */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/** CSS variable name → resolved hex color (cached per render). */
const COLOR_CACHE: Record<string, string> = {};

/**
 * Resolved value of --font-sans (read once from computed style, cached).
 * Canvas cannot consume CSS variables directly; we read it once and store it.
 * Falls back to system-ui when the document is unavailable (SSR).
 */
let CANVAS_FONT_FAMILY = 'system-ui, sans-serif';

if (typeof document !== 'undefined') {
  const observer = new MutationObserver(() => {
    for (const key of Object.keys(COLOR_CACHE)) {
      delete COLOR_CACHE[key];
    }
    // Re-resolve font on theme/class change (Next.js may swap the variable)
    CANVAS_FONT_FAMILY =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--font-sans')
        .trim() || 'system-ui, sans-serif';
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-raga', 'class'],
  });
  // Initial read (executes after module load, before first render)
  CANVAS_FONT_FAMILY =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--font-sans')
      .trim() || 'system-ui, sans-serif';
}

function resolveColor(cssVar: string, fallback: string): string {
  if (COLOR_CACHE[cssVar]) return COLOR_CACHE[cssVar]!;

  if (typeof document === 'undefined') return fallback;

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();

  const resolved = value || fallback;
  COLOR_CACHE[cssVar] = resolved;
  return resolved;
}

/** Accuracy band → resolved color. */
function getAccuracyColor(band: AccuracyBand): string {
  switch (band) {
    case 'perfect':
      return resolveColor('--accent', '#E8871E');
    case 'good':
      return resolveColor('--correct', '#22C55E');
    case 'approaching':
      return resolveColor('--in-progress', '#F59E0B');
    case 'off':
      return resolveColor('--needs-work', '#EF4444');
    case 'rest':
      return resolveColor('--text-3', '#666666');
  }
}

// ---------------------------------------------------------------------------
// Canvas rendering
// ---------------------------------------------------------------------------

/** Padding from edges for string endpoints. */
const PADDING_X = 48;
const PADDING_Y_TOP = 24;
const PADDING_Y_BOTTOM = 24;
const LABEL_WIDTH = 40;

/** Get the Y position for a string based on its index among visible strings. */
function getStringY(
  visibleIndex: number,
  totalVisible: number,
  canvasHeight: number,
): number {
  if (totalVisible <= 1) return canvasHeight / 2;
  const usableHeight = canvasHeight - PADDING_Y_TOP - PADDING_Y_BOTTOM;
  return PADDING_Y_TOP + (visibleIndex / (totalVisible - 1)) * usableHeight;
}

/** Render a single string with its waveform. */
function renderString(
  ctx: CanvasRenderingContext2D,
  s: TantriStringState,
  y: number,
  canvasWidth: number,
  time: number,
  dpr: number,
): void {
  const x0 = PADDING_X + LABEL_WIDTH;
  const x1 = canvasWidth - PADDING_X;
  const stringWidth = x1 - x0;

  if (stringWidth <= 0) return;

  // String line width: thicker for visual prominence
  const baseWidth = s.achala ? 2.5 : 1.5;

  // Rest state opacity
  let baseOpacity: number;
  if (s.visibility === 'ghost') {
    baseOpacity = 0.08;
  } else if (s.visibility === 'hidden') {
    return; // Don't render hidden strings
  } else {
    baseOpacity = s.achala ? 0.25 : 0.6;
  }

  // Color: rest state uses neutral, active uses accuracy color
  const color = s.amplitude > 0.01
    ? getAccuracyColor(s.accuracyBand)
    : resolveColor('--text-3', '#666666');

  // Opacity: blend between rest and full based on amplitude
  const opacity = baseOpacity + s.amplitude * (1 - baseOpacity);

  ctx.save();

  // --- Draw the waveform ---
  if (s.amplitude > 0.005) {
    const numPoints = Math.min(250, Math.max(100, Math.floor(stringWidth / 2)));
    const waveform = generateStringWaveform(s, numPoints, time);
    const maxDisplacement = 18 * dpr; // Max visual displacement in pixels — generous for cinematic effect

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    // Touched strings pulse with a subtle shimmer (8Hz flicker)
    const touchPulse = s.touched ? 1 + 0.15 * Math.sin(time * 8 * Math.PI * 2) : 0;
    ctx.lineWidth = baseWidth * dpr * (1 + s.amplitude * 0.5 + touchPulse);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < numPoints; i++) {
      const x = x0 + (i / (numPoints - 1)) * stringWidth;
      const displacement = (waveform[i] ?? 0) * maxDisplacement;
      if (i === 0) {
        ctx.moveTo(x, y + displacement);
      } else {
        ctx.lineTo(x, y + displacement);
      }
    }
    ctx.stroke();

    // --- Glow effect for active strings ---
    // Perfect: large saffron glow. Good: softer green glow. Approaching: faint amber.
    // Uses shadowBlur instead of ctx.filter to avoid software rasterization.
    const glowBand = s.accuracyBand;
    const shouldGlow =
      (glowBand === 'perfect' && s.amplitude > 0.2) ||
      (glowBand === 'good' && s.amplitude > 0.3) ||
      (glowBand === 'approaching' && s.amplitude > 0.5);

    if (shouldGlow) {
      const glowIntensity = glowBand === 'perfect' ? 1.0
        : glowBand === 'good' ? 0.6
        : 0.3;
      const blurRadius = glowBand === 'perfect' ? 14 : glowBand === 'good' ? 8 : 4;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity * 0.4 * glowIntensity;
      ctx.lineWidth = (baseWidth + 3) * dpr;
      ctx.shadowColor = color;
      ctx.shadowBlur = blurRadius * dpr;

      for (let i = 0; i < numPoints; i++) {
        const x = x0 + (i / (numPoints - 1)) * stringWidth;
        const displacement = (waveform[i] ?? 0) * maxDisplacement;
        if (i === 0) {
          ctx.moveTo(x, y + displacement);
        } else {
          ctx.lineTo(x, y + displacement);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  } else {
    // Resting string — simple horizontal line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = baseOpacity;
    ctx.lineWidth = baseWidth * dpr;
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }

  // --- Terminus point for achala strings (Sa, Pa) ---
  if (s.achala) {
    ctx.beginPath();
    const pointColor = s.swara === 'Sa'
      ? resolveColor('--accent', '#E8871E')
      : resolveColor('--text-2', '#999999');
    ctx.fillStyle = pointColor;
    ctx.globalAlpha = opacity;
    const baseR = s.swara === 'Sa' ? 4 * dpr : 2.5 * dpr;
    // Subtle pulse when string is active
    const pulseR = s.amplitude > 0.1 ? baseR * (1 + s.amplitude * 0.4) : baseR;
    ctx.arc(x0, y, pulseR, 0, Math.PI * 2);
    ctx.fill();

    // Saffron glow halo on Sa when active
    if (s.swara === 'Sa' && s.amplitude > 0.2) {
      ctx.beginPath();
      ctx.fillStyle = pointColor;
      ctx.globalAlpha = s.amplitude * 0.15;
      ctx.arc(x0, y, pulseR * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // --- Swara label ---
  ctx.save();
  const isActive = s.amplitude > 0.01;
  const labelSize = isActive ? 12.5 : 11;
  const labelWeight = isActive ? '600' : '400';
  ctx.font = `${labelWeight} ${labelSize * dpr}px ${CANVAS_FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isActive ? color : resolveColor('--text-3', '#666666');
  ctx.globalAlpha = s.visibility === 'ghost' ? 0.3 : opacity;

  // Use sargam abbreviation for compact, full name for full
  const label = s.definition.sargamAbbr;
  ctx.fillText(label, x0 - 8, y);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Tantri = memo(function Tantri({
  saHz,
  ragaId = null,
  level = 'shishya',
  subLevel = 1,
  variant = 'full',
  analyser = null,
  pitchHz = null,
  pitchClarity = 0,
  onStringTrigger,
  timbre,
  onActivityChange,
  className,
  style,
}: TantriProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<TantriField | null>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);
  const analyserDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const touchedStringRef = useRef<number | null>(null);
  const pitchHzRef = useRef<number | null>(pitchHz);
  const pitchClarityRef = useRef(pitchClarity);

  // Keep pitch refs in sync with props
  pitchHzRef.current = pitchHz;
  pitchClarityRef.current = pitchClarity;

  // Track visible string indices for hit testing
  const visibleIndicesRef = useRef<number[]>([]);

  // Track activity state (any string vibrating)
  const wasActiveRef = useRef(false);

  // -----------------------------------------------------------------------
  // Create / update field
  // -----------------------------------------------------------------------
  useEffect(() => {
    const field = createTantriField(saHz, ragaId, level);
    applyLevelVisibility(field, subLevel);
    fieldRef.current = field;

    // Build visible indices
    const vis: number[] = [];
    for (let i = 0; i < field.strings.length; i++) {
      if (field.strings[i]!.visibility !== 'hidden') {
        vis.push(i);
      }
    }
    visibleIndicesRef.current = vis;
  }, [saHz, ragaId, level, subLevel]);

  // -----------------------------------------------------------------------
  // Analyser data buffer
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (analyser) {
      analyserDataRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
    } else {
      analyserDataRef.current = null;
    }
  }, [analyser]);

  // -----------------------------------------------------------------------
  // Animation loop
  // -----------------------------------------------------------------------
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const field = fieldRef.current;
    if (!canvas || !field) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width * dpr;
    const h = rect.height * dpr;

    // Resize canvas if needed
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    // Time delta
    const now = performance.now() / 1000;
    if (lastFrameRef.current > 0) {
      timeRef.current += now - lastFrameRef.current;
    }
    lastFrameRef.current = now;

    // --- Read voice data ---
    let voiceAmplitude = 0;
    let voiceMap: VoiceMapResult | null = null;

    // Get amplitude from analyser
    if (analyser && analyserDataRef.current) {
      analyser.getFloatTimeDomainData(analyserDataRef.current);
      let sum = 0;
      for (let i = 0; i < analyserDataRef.current.length; i++) {
        const v = analyserDataRef.current[i]!;
        sum += v * v;
      }
      voiceAmplitude = Math.min(Math.sqrt(sum / analyserDataRef.current.length) * 5, 1);
    }

    // Map pitch to strings (accurate, from voice pipeline)
    if (pitchHzRef.current && pitchHzRef.current > 0 && pitchClarityRef.current > 0) {
      voiceMap = mapVoiceToStrings(pitchHzRef.current, pitchClarityRef.current, field);
    }

    updateFieldFromVoice(field, voiceMap, voiceAmplitude);

    // --- Activity detection for cinematic defocus ---
    if (onActivityChange) {
      let isActive = false;
      for (let i = 0; i < field.strings.length; i++) {
        if (field.strings[i]!.amplitude > 0.05) {
          isActive = true;
          break;
        }
      }
      if (isActive !== wasActiveRef.current) {
        wasActiveRef.current = isActive;
        onActivityChange(isActive);
      }
    }

    // --- Clear and render ---
    ctx.clearRect(0, 0, w, h);

    const visibleIndices = visibleIndicesRef.current;
    const totalVisible = visibleIndices.length;

    for (let vi = 0; vi < totalVisible; vi++) {
      const idx = visibleIndices[vi]!;
      const s = field.strings[idx]!;
      const y = getStringY(vi, totalVisible, h / dpr) * dpr;
      renderString(ctx, s, y, w / dpr, timeRef.current, dpr);
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [analyser]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  // -----------------------------------------------------------------------
  // Touch / click interaction
  // -----------------------------------------------------------------------

  const getStringFromY = useCallback(
    (clientY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const y = clientY - rect.top;
      const h = rect.height;
      const visibleIndices = visibleIndicesRef.current;
      const totalVisible = visibleIndices.length;

      if (totalVisible === 0) return null;

      // Find the closest string to the touch point
      let closestIdx: number | null = null;
      let closestDist = Infinity;

      for (let vi = 0; vi < totalVisible; vi++) {
        const stringY = getStringY(vi, totalVisible, h);
        const dist = Math.abs(y - stringY);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = visibleIndices[vi]!;
        }
      }

      // Generous touch target (32px) for responsive interaction
      if (closestDist > 32) return null;
      return closestIdx;
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const field = fieldRef.current;
      if (!field) return;

      const idx = getStringFromY(e.clientY);
      if (idx === null) return;

      touchedStringRef.current = idx;
      const event = triggerString(idx, field);

      if (event && onStringTrigger) {
        onStringTrigger(timbre ? { ...event, timbre } : event);
      }
    },
    [getStringFromY, onStringTrigger],
  );

  const handlePointerUp = useCallback(() => {
    const field = fieldRef.current;
    if (!field || touchedStringRef.current === null) return;

    releaseString(touchedStringRef.current, field);
    touchedStringRef.current = null;
  }, []);

  const handlePointerLeave = useCallback(() => {
    const field = fieldRef.current;
    if (!field || touchedStringRef.current === null) return;

    releaseString(touchedStringRef.current, field);
    touchedStringRef.current = null;
  }, []);

  // -----------------------------------------------------------------------
  // External pitch update API
  // -----------------------------------------------------------------------
  // Expose a method for the parent to feed pitch data directly.
  // This gives accurate string mapping (vs. the raw analyser amplitude).

  const updateFromPitch = useCallback(
    (hz: number, clarity: number, amplitude: number) => {
      const field = fieldRef.current;
      if (!field) return;

      const voiceMap = mapVoiceToStrings(hz, clarity, field);
      updateFieldFromVoice(field, voiceMap, amplitude);
    },
    [],
  );

  // Attach to a ref so parent can call it
  const updateRef = useRef(updateFromPitch);
  updateRef.current = updateFromPitch;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const containerClass = [
    styles.tantri,
    variant === 'compact' ? styles.compact : styles.full,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClass}
      style={style}
      role="img"
      aria-label="Tantri — interactive swara strings"
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
});

export default Tantri;

/**
 * Hook to get a ref to Tantri's updateFromPitch method.
 * This allows the parent to feed pitch data directly for accurate
 * string mapping instead of relying solely on the analyser.
 */
export function useTantriPitchUpdate(): React.MutableRefObject<
  ((hz: number, clarity: number, amplitude: number) => void) | null
> {
  return useRef<((hz: number, clarity: number, amplitude: number) => void) | null>(null);
}
