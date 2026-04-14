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
 *   - portal:  Centered band (~40vh), guitar-like, with integrated pitch trail
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

  /** Display variant. 'portal' = centered narrow band with integrated pitch trail. */
  variant?: 'full' | 'portal' | 'compact';

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

  /** Callback when a string is released (pointer up/leave). */
  onStringRelease?: (event: TantriPlayEvent) => void;

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

/**
 * Cached font strings for canvas label rendering.
 * Two variants (active / inactive) × DPR. Rebuilt on font/DPR change.
 * Eliminates template literal concatenation per string per frame.
 */
let _fontCacheDpr = 0;
let _fontActive = '';
let _fontInactive = '';

function getLabelFont(isActive: boolean, dpr: number): string {
  if (dpr !== _fontCacheDpr) {
    _fontCacheDpr = dpr;
    _fontActive = `600 ${12.5 * dpr}px ${CANVAS_FONT_FAMILY}`;
    _fontInactive = `400 ${11 * dpr}px ${CANVAS_FONT_FAMILY}`;
  }
  return isActive ? _fontActive : _fontInactive;
}

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
    // Invalidate font cache so it rebuilds with new family
    _fontCacheDpr = 0;
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

/** Resolve a numeric CSS token (e.g. '--tantri-string-rest-opacity: 0.5'). */
const NUM_CACHE: Record<string, number> = {};
function resolveNum(cssVar: string, fallback: number): number {
  if (NUM_CACHE[cssVar] !== undefined) return NUM_CACHE[cssVar]!;
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
  const parsed = parseFloat(raw);
  const resolved = Number.isFinite(parsed) ? parsed : fallback;
  NUM_CACHE[cssVar] = resolved;
  return resolved;
}

// Invalidate NUM_CACHE alongside COLOR_CACHE on theme/raga change
if (typeof document !== 'undefined') {
  const numObserver = new MutationObserver(() => {
    for (const key of Object.keys(NUM_CACHE)) delete NUM_CACHE[key];
  });
  numObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-raga', 'class'],
  });
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
      return resolveColor('--text-3', '#7A6B5E');
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

// ---------------------------------------------------------------------------
// Pitch trail (voice → flowing line between strings)
// ---------------------------------------------------------------------------

/** Maximum trail length in frames (~1.5s at 60fps). */
const PITCH_TRAIL_MAX = 90;

interface PitchTrailPoint {
  /** Canvas-space Y position (mapped from Hz). */
  y: number;
  /** Animation timestamp. */
  time: number;
  /** Accuracy band for color. */
  band: AccuracyBand;
  /** Voice amplitude (0-1). */
  amp: number;
}

/**
 * Render the pitch trail — a flowing line that shows the voice pitch
 * position relative to the strings. Drawn BEHIND the strings so it
 * feels like part of the instrument, not an overlay.
 */
function renderPitchTrail(
  ctx: CanvasRenderingContext2D,
  trail: PitchTrailPoint[],
  canvasWidth: number,
  dpr: number,
  time: number,
): void {
  if (trail.length < 2) return;

  const x0 = (PADDING_X + LABEL_WIDTH) * dpr;
  const x1 = (canvasWidth - PADDING_X) * dpr;
  const trailWidth = x1 - x0;
  if (trailWidth <= 0) return;

  ctx.save();

  // Draw the trail as a line flowing from right (newest) to left (oldest)
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < trail.length; i++) {
    const prev = trail[i - 1]!;
    const curr = trail[i]!;

    // Horizontal position: newest point at right edge, oldest at left
    const progress = i / trail.length;
    const prevProgress = (i - 1) / trail.length;

    const px = x0 + prevProgress * trailWidth;
    const cx = x0 + progress * trailWidth;

    // Y position already in canvas space (from dpr-scaled string positions)
    const py = prev.y;
    const cy = curr.y;

    // Age-based fade: oldest points are most transparent
    const age = (time - curr.time);
    const fadeAlpha = Math.max(0, 1 - age / 1.5) * curr.amp;

    if (fadeAlpha < 0.02) continue;

    // Color from accuracy band
    const color = getAccuracyColor(curr.band);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = fadeAlpha * 0.5;
    ctx.lineWidth = (2 + curr.amp * 3) * dpr;
    ctx.moveTo(px, py);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }

  // Glow on the newest point (current pitch position)
  const newest = trail[trail.length - 1]!;
  if (newest.amp > 0.05) {
    const nx = x1; // rightmost position
    const ny = newest.y;
    const glowColor = getAccuracyColor(newest.band);

    ctx.beginPath();
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = newest.amp * 0.6;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12 * dpr;
    ctx.arc(nx, ny, (4 + newest.amp * 4) * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  ctx.restore();
}

/**
 * Get the Y position for a string based on its index among visible strings.
 * Sa (index 0, lowest pitch) at the bottom, Ni (highest pitch) at the top.
 * This matches natural musical intuition: low sounds low, high sounds high.
 */
function getStringY(
  visibleIndex: number,
  totalVisible: number,
  canvasHeight: number,
): number {
  if (totalVisible <= 1) return canvasHeight / 2;
  const usableHeight = canvasHeight - PADDING_Y_TOP - PADDING_Y_BOTTOM;
  // Invert: index 0 (Sa) goes to the bottom, last index (Ni) goes to the top
  const invertedIndex = totalVisible - 1 - visibleIndex;
  return PADDING_Y_TOP + (invertedIndex / (totalVisible - 1)) * usableHeight;
}

/**
 * Render a single string with its waveform.
 * When voice data is available and the string is voice-active,
 * the actual mic waveform is blended onto the string.
 */
function renderString(
  ctx: CanvasRenderingContext2D,
  s: TantriStringState,
  y: number,
  canvasWidth: number,
  time: number,
  dpr: number,
  voiceData?: Float32Array | null,
): void {
  const x0 = PADDING_X + LABEL_WIDTH;
  const x1 = canvasWidth - PADDING_X;
  const stringWidth = x1 - x0;

  if (stringWidth <= 0) return;

  // String line width from CSS tokens
  const baseWidth = s.achala
    ? resolveNum('--tantri-string-sa-width', 2)
    : resolveNum('--tantri-string-default-width', 1);

  // Rest state opacity from CSS tokens
  let baseOpacity: number;
  if (s.visibility === 'ghost') {
    baseOpacity = resolveNum('--tantri-string-ghost-opacity', 0.08);
  } else if (s.visibility === 'hidden') {
    return; // Don't render hidden strings
  } else {
    baseOpacity = s.achala
      ? resolveNum('--tantri-string-achala-opacity', 0.15)
      : resolveNum('--tantri-string-rest-opacity', 0.5);
  }

  // Color: rest state uses neutral, active uses accuracy color
  const color = s.amplitude > 0.01
    ? getAccuracyColor(s.accuracyBand)
    : resolveColor('--text-3', '#7A6B5E');

  // Opacity: blend between rest and full based on amplitude
  const opacity = baseOpacity + s.amplitude * (1 - baseOpacity);

  ctx.save();

  // --- Draw the waveform ---
  if (s.amplitude > 0.005) {
    // Cap numPoints at 200: visually indistinguishable from higher counts for a
    // smooth standing wave, but reduces worst-case draw calls by ~6x on wide
    // screens (previously could reach 1200+ on a 2560px display).
    const numPoints = Math.min(200, Math.max(100, Math.floor(stringWidth / 2)));
    // generateStringWaveform writes into s._waveformBuffer — zero allocation on hot path.
    const syntheticWave = generateStringWaveform(s, numPoints, time);
    const maxDisplacement = 18 * dpr; // Max visual displacement in pixels — generous for cinematic effect

    // blendedDisplacements holds the final per-point pixel displacement values.
    // We compute these once and reuse the same values for both the primary stroke
    // and the glow pass, eliminating the second full-path lineTo loop.
    // Pre-allocated on the string state — resized only when numPoints changes
    // (canvas resize, infrequent). Eliminates per-frame Float64Array allocation.
    let blendedDisplacements: Float64Array;
    if (s._blendBufferSize === numPoints && s._blendBuffer !== null) {
      blendedDisplacements = s._blendBuffer;
    } else {
      blendedDisplacements = new Float64Array(numPoints);
      s._blendBuffer = blendedDisplacements;
      s._blendBufferSize = numPoints;
    }
    // Voice data is relevant when: analyser has data, string is voice-driven (not touched),
    // amplitude is meaningful, AND the string has an active accuracy band (not decaying)
    const hasVoiceData = voiceData && voiceData.length > 0 && !s.touched &&
      s.amplitude > 0.05 && s.accuracyBand !== 'rest';

    if (hasVoiceData) {
      // Sample voice waveform data evenly across the string
      const step = voiceData.length / numPoints;
      for (let i = 0; i < numPoints; i++) {
        const voiceSample = voiceData[Math.floor(i * step)] ?? 0;
        // Standing-wave envelope: nodes at endpoints (physical correctness)
        const x = i / (numPoints - 1);
        const envelope = Math.sin(Math.PI * x);
        // Blend: voice waveform (scaled by clarity-weighted amplitude) + subtle synthetic undertone
        // Use voiceAmplitude directly (already clarity-weighted), not s.amplitude which double-attenuates
        const voiceContribution = voiceSample * envelope * 4;
        const syntheticContribution = (syntheticWave[i] ?? 0) * 0.15;
        blendedDisplacements[i] = (voiceContribution + syntheticContribution) * maxDisplacement;
      }
    } else {
      // Touched or no voice data: use synthetic standing wave
      for (let i = 0; i < numPoints; i++) {
        blendedDisplacements[i] = (syntheticWave[i] ?? 0) * maxDisplacement;
      }
    }

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    // Touched strings pulse with a subtle shimmer (8Hz flicker)
    const touchPulse = s.touched ? 1 + 0.15 * Math.sin(time * 8 * Math.PI * 2) : 0;
    // Voice-active strings shimmer when accuracy is good/perfect AND string is actively voiced
    // (accuracyBand is now reset to 'rest' immediately on decay, so this naturally stops)
    const isVoiceMatched = !s.touched && s.amplitude > 0.08 &&
      s.accuracyBand !== 'rest' &&
      (s.accuracyBand === 'perfect' || s.accuracyBand === 'good');
    const voiceShimmer = isVoiceMatched
      ? 0.4 * s.amplitude + 0.1 * Math.sin(time * 6 * Math.PI * 2) * s.amplitude
      : 0;
    ctx.lineWidth = baseWidth * dpr * (1 + s.amplitude * 0.5 + touchPulse + voiceShimmer);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < numPoints; i++) {
      const x = x0 + (i / (numPoints - 1)) * stringWidth;
      const displacement = blendedDisplacements[i]!;
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
    // Reuses blendedDisplacements from the primary pass — no second waveform loop.
    const glowBand = s.accuracyBand;
    // Lower thresholds for voice-matched strings so they glow like click
    const shouldGlow =
      (glowBand === 'perfect' && s.amplitude > 0.08) ||
      (glowBand === 'good' && s.amplitude > 0.12) ||
      (glowBand === 'approaching' && s.amplitude > 0.4);

    if (shouldGlow) {
      // Voice-matched: stronger glow intensity to match click visual
      const voiceBoost = isVoiceMatched ? 1.3 : 1.0;
      const glowIntensity = (glowBand === 'perfect' ? 1.0
        : glowBand === 'good' ? 0.7
        : 0.3) * voiceBoost;
      const blurRadius = glowBand === 'perfect' ? 16 : glowBand === 'good' ? 10 : 5;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity * 0.4 * glowIntensity;
      ctx.lineWidth = (baseWidth + 3) * dpr;
      ctx.shadowColor = color;
      ctx.shadowBlur = blurRadius * dpr;

      // Reuse blendedDisplacements — same waveform shape, no recomputation.
      for (let i = 0; i < numPoints; i++) {
        const x = x0 + (i / (numPoints - 1)) * stringWidth;
        const displacement = blendedDisplacements[i]!;
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
      : resolveColor('--text-2', '#B8A99A');
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
  ctx.font = getLabelFont(isActive, dpr);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isActive ? color : resolveColor('--text-3', '#7A6B5E');
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
  onStringRelease,
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
  /** Pitch trail ring buffer for the portal variant's integrated waveform. */
  const pitchTrailRef = useRef<PitchTrailPoint[]>([]);

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

    // Get amplitude from analyser, weighted by pitch clarity
    if (analyser && analyserDataRef.current) {
      analyser.getFloatTimeDomainData(analyserDataRef.current);
      let sum = 0;
      for (let i = 0; i < analyserDataRef.current.length; i++) {
        const v = analyserDataRef.current[i]!;
        sum += v * v;
      }
      const rawRms = Math.sqrt(sum / analyserDataRef.current.length);
      // Weight by clarity: noise (low clarity) suppressed, clear pitch (high clarity) passes through
      const clarityWeight = pitchClarityRef.current > 0 ? pitchClarityRef.current : 0.1;
      voiceAmplitude = Math.min(rawRms * 5 * clarityWeight, 1);
    }

    // Map pitch to strings (accurate, from voice pipeline)
    const hz = pitchHzRef.current;
    const cl = pitchClarityRef.current;
    if (hz && Number.isFinite(hz) && hz > 0 && cl > 0) {
      voiceMap = mapVoiceToStrings(hz, cl, field);
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

    // --- Pitch trail: record current pitch position ---
    if (variant === 'portal' && voiceMap && voiceMap.primaryIndex >= 0 && voiceAmplitude > 0.03) {
      // Map the primary string's visible index to a Y position
      const visIdx = visibleIndices.indexOf(voiceMap.primaryIndex);
      if (visIdx >= 0) {
        // Compute Y in CSS-space, then scale to canvas-space consistently
        const cssH = h / dpr;
        const baseY = getStringY(visIdx, totalVisible, cssH) * dpr;
        // Offset by cents deviation for smooth interpolation between strings
        const centsOffset = voiceMap.centsDev;
        // Each string is separated by ~spacing in CSS pixels (then scaled)
        const spacing = totalVisible > 1
          ? (cssH - PADDING_Y_TOP - PADDING_Y_BOTTOM) / (totalVisible - 1)
          : 0;
        // Cents per string gap varies, but ~100 is typical; use a scaled offset
        const pixelOffset = spacing > 0 ? (centsOffset / 100) * spacing * -0.5 * dpr : 0;
        const trailY = baseY + pixelOffset;

        pitchTrailRef.current.push({
          y: trailY,
          time: timeRef.current,
          band: voiceMap.accuracyBand,
          amp: voiceAmplitude,
        });
        // Trim trail to max length — splice in place instead of slice + allocate
        const excess = pitchTrailRef.current.length - PITCH_TRAIL_MAX;
        if (excess > 0) {
          pitchTrailRef.current.splice(0, excess);
        }
      }
    } else if (variant === 'portal') {
      // Fade trail naturally — don't add new points but keep old ones
      // They'll fade via age in renderPitchTrail
    }

    // --- Render pitch trail BEHIND strings (portal variant) ---
    if (variant === 'portal' && pitchTrailRef.current.length > 1) {
      renderPitchTrail(ctx, pitchTrailRef.current, w / dpr, dpr, timeRef.current);
    }

    // Pass voice time-domain data to renderString for real-time waveform
    const voiceWaveData = analyserDataRef.current;

    for (let vi = 0; vi < totalVisible; vi++) {
      const idx = visibleIndices[vi]!;
      const s = field.strings[idx]!;
      const y = getStringY(vi, totalVisible, h / dpr) * dpr;
      renderString(ctx, s, y, w / dpr, timeRef.current, dpr, voiceWaveData);
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [analyser, variant]);

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

      // Dynamic hit threshold: generous for full/portal, tight for compact
      const threshold = Math.min(32, Math.max(12, (h / totalVisible) * 0.4));
      if (closestDist > threshold) return null;
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
    [getStringFromY, onStringTrigger, timbre],
  );

  const handlePointerUp = useCallback(() => {
    const field = fieldRef.current;
    if (!field || touchedStringRef.current === null) return;

    const idx = touchedStringRef.current;
    const s = field.strings[idx];
    if (s && onStringRelease) {
      onStringRelease({
        swara: s.swara,
        octave: 'madhya',
        hz: s.hz,
        velocity: 0,
        timbre,
      });
    }

    releaseString(idx, field);
    touchedStringRef.current = null;
  }, [onStringRelease, timbre]);

  const handlePointerLeave = useCallback(() => {
    const field = fieldRef.current;
    if (!field || touchedStringRef.current === null) return;

    const idx = touchedStringRef.current;
    const s = field.strings[idx];
    if (s && onStringRelease) {
      onStringRelease({
        swara: s.swara,
        octave: 'madhya',
        hz: s.hz,
        velocity: 0,
        timbre,
      });
    }

    releaseString(idx, field);
    touchedStringRef.current = null;
  }, [onStringRelease, timbre]);

  // -----------------------------------------------------------------------
  // Keyboard navigation — arrow keys select strings, Enter/Space triggers
  // -----------------------------------------------------------------------

  const focusedStringRef = useRef<number>(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const field = fieldRef.current;
      if (!field) return;

      const visibleIndices = visibleIndicesRef.current;
      if (visibleIndices.length === 0) return;

      const currentFocus = focusedStringRef.current;
      const currentVisIdx = visibleIndices.indexOf(currentFocus);
      const safeVisIdx = currentVisIdx >= 0 ? currentVisIdx : 0;

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          // Move to next higher-pitched string (higher visible index)
          const nextVisIdx = Math.min(safeVisIdx + 1, visibleIndices.length - 1);
          focusedStringRef.current = visibleIndices[nextVisIdx]!;
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          // Move to next lower-pitched string
          const prevVisIdx = Math.max(safeVisIdx - 1, 0);
          focusedStringRef.current = visibleIndices[prevVisIdx]!;
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          const idx = focusedStringRef.current;
          const event = triggerString(idx, field);
          if (event && onStringTrigger) {
            onStringTrigger(timbre ? { ...event, timbre } : event);
          }
          // Auto-release after a short delay (keyboard pluck)
          setTimeout(() => {
            const f = fieldRef.current;
            if (!f) return;
            const s = f.strings[idx];
            if (s && onStringRelease) {
              onStringRelease({
                swara: s.swara,
                octave: 'madhya',
                hz: s.hz,
                velocity: 0,
                timbre,
              });
            }
            releaseString(idx, f);
          }, 200);
          break;
        }
      }
    },
    [onStringTrigger, onStringRelease, timbre],
  );

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
    variant === 'compact' ? styles.compact : variant === 'portal' ? styles.portal : styles.full,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Build aria description from visible strings
  const ariaDesc = fieldRef.current
    ? `${visibleIndicesRef.current.length} swara strings. Use arrow keys to navigate, Enter to pluck.`
    : 'Tantri instrument loading';

  return (
    <div
      className={containerClass}
      style={style}
      role="application"
      aria-label="Tantri — interactive swara strings"
      aria-roledescription="musical instrument"
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        role="group"
        aria-label={ariaDesc}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        style={{ touchAction: 'none', outline: 'none' }}
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
