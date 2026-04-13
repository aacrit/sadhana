/**
 * Logo.tsx -- The Sadhana mark: Tantri Resonance
 *
 * Five horizontal strings at just-intonation intervals -- the pentatonic
 * field of Raga Bhoopali (Sa Re Ga Pa Dha), the first raga a student
 * encounters. Spacing follows logarithmic frequency ratios: acoustically
 * truthful, not decorative.
 *
 * The Sa string (lowest, thickest) carries a standing wave -- the shape
 * of a sung note activating the instrument. A saffron terminus point
 * anchors the tonic at the left. Strings extend rightward without
 * boundary -- the practice continues.
 *
 * Motion physics (from Ragamala motion grammar):
 *   Loading:  Sa wave oscillates via CSS @keyframes (zero JS, ~0.5Hz)
 *   Hover:    Strings brighten, Sa glow intensifies (Andolan: 120/8)
 *   Press:    Kan snap (1000/30) -- strings contract momentarily
 *   Idle:     Subtle phase drift on standing wave (~0.5Hz), barely perceptible
 *
 * Size presets:
 *   favicon (16px) -- 3 strings, Sa point only, no wave
 *   nav     (32px) -- 5 strings, simplified wave, interactive
 *   header  (48px) -- full articulation, interactive
 *   hero    (96px) -- full articulation with enhanced glow
 *   splash (200px) -- full articulation, maximum detail
 *
 * Wordmark variant: "Sadhana" in Cormorant Garamond with a hairline
 * string threading the baseline, Sa terminus at the 'S'.
 *
 * Works in Night mode (warm parchment strings on Deep Malachite) and
 * Day mode (dark ink strings on Ivory).
 */

'use client';

import { useId, useMemo, type CSSProperties } from 'react';
import { motion, useSpring, useTransform, type MotionValue } from 'framer-motion';

// ---------------------------------------------------------------------------
// Just-intonation frequency ratios for Bhoopali pentatonic
// Sa=1, Re=9/8, Ga=5/4, Pa=3/2, Dha=5/3
// Mapped to vertical position via log2(ratio) normalized to [0, 1]
// ---------------------------------------------------------------------------

const BHOOPALI_RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
const LOG2_MAX = Math.log2(5 / 3); // ~0.737

/** Normalized Y positions (0=Sa at bottom, 1=Dha at top) */
const STRING_POSITIONS = BHOOPALI_RATIOS.map((r) => Math.log2(r) / LOG2_MAX);

// ---------------------------------------------------------------------------
// Spring physics presets (from Ragamala motion grammar)
// ---------------------------------------------------------------------------

const SPRING_PRESETS = {
  /** Andolan -- subtle shake, breath, barely perceptible */
  andolan: { stiffness: 120, damping: 8, mass: 1 },
  /** Kan -- grace note, instantaneous snap */
  kan: { stiffness: 1000, damping: 30, mass: 1 },
  /** Tanpura Release -- long decay, natural string settling */
  tanpuraRelease: { stiffness: 400, damping: 15, mass: 1 },
  /** Meend -- glide between swaras, smooth, no overshoot */
  meend: { stiffness: 80, damping: 20, mass: 1 },
} as const;

// ---------------------------------------------------------------------------
// Size presets
// ---------------------------------------------------------------------------

export type LogoSizePreset = 'favicon' | 'nav' | 'header' | 'hero' | 'splash';

const SIZE_PRESETS: Record<LogoSizePreset, number> = {
  favicon: 16,
  nav: 32,
  header: 48,
  hero: 96,
  splash: 200,
};

// Base opacities per string index (used for both static and animated paths)
const BASE_OPACITIES = [0.85, 0.45, 0.45, 0.65, 0.40];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LogoProps {
  /** Size in pixels (height), or a named preset. Default 40. */
  size?: number | LogoSizePreset;
  /** 'full' shows mark + wordmark. 'icon' shows mark only. */
  variant?: 'full' | 'icon';
  /** When true, the Sa standing wave animates (CSS keyframes, zero JS). */
  loading?: boolean;
  /** When true, hover/press physics are active. Default: true for sizes >= 24px. */
  interactive?: boolean;
  /** Additional class name. */
  className?: string;
  /** Additional inline styles. */
  style?: CSSProperties;
}

// ---------------------------------------------------------------------------
// Standing wave path generator
// ---------------------------------------------------------------------------

/**
 * Generate an SVG path for a standing wave (fundamental mode).
 * Displacement follows sin(pi * x/L) * amplitude -- a single
 * antinode at center, the shape of a string vibrating at its fundamental.
 */
function standingWavePath(
  x0: number,
  y: number,
  length: number,
  amplitude: number,
  segments: number = 48,
): string {
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = x0 + t * length;
    const displacement = amplitude * Math.sin(Math.PI * t);
    if (i === 0) {
      points.push(`M ${x.toFixed(2)} ${(y - displacement).toFixed(2)}`);
    } else {
      points.push(`L ${x.toFixed(2)} ${(y - displacement).toFixed(2)}`);
    }
  }
  return points.join(' ');
}

// ---------------------------------------------------------------------------
// CSS keyframes for zero-JS wave animation
// Scoped by uid. Translates the wave group vertically for a breathing
// effect (idle) or a pronounced oscillation (loading). No JS RAF needed.
// ---------------------------------------------------------------------------

function getWaveKeyframes(uid: string, amplitude: number): string {
  const drift = Math.max(0.3, amplitude * 0.15);
  return `
    @keyframes sadhana-wave-drift-${uid} {
      0%, 100% { transform: translateY(0px); }
      25% { transform: translateY(${drift.toFixed(2)}px); }
      50% { transform: translateY(0px); }
      75% { transform: translateY(-${drift.toFixed(2)}px); }
    }
    @keyframes sadhana-wave-loading-${uid} {
      0%, 100% { transform: translateY(${(-amplitude * 0.5).toFixed(2)}px); }
      50% { transform: translateY(${(amplitude * 0.5).toFixed(2)}px); }
    }
    @keyframes sadhana-glow-pulse-${uid} {
      0%, 100% { opacity: 0.08; }
      50% { opacity: 0.18; }
    }
  `;
}

// ---------------------------------------------------------------------------
// Sub-component: Interactive strings (motion-driven)
// Isolated so that all hooks are called unconditionally at the top level.
// ---------------------------------------------------------------------------

interface InteractiveStringsProps {
  visibleStrings: number[];
  stringYs: number[];
  fieldLeft: number;
  fieldRight: number;
  fieldLength: number;
  waveAmplitude: number;
  filterUrl: string;
  loading: boolean;
  uid: string;
  /** Hover spring value (0=idle, 1=hovered) */
  hoverValue: MotionValue<number>;
}

function InteractiveStrings({
  visibleStrings,
  stringYs,
  fieldLeft,
  fieldRight,
  fieldLength,
  waveAmplitude,
  filterUrl,
  loading,
  uid,
  hoverValue,
}: InteractiveStringsProps) {
  // All hooks called unconditionally at the top level of this component
  const stringOpacityMultiplier = useTransform(hoverValue, [0, 1], [1, 1.4]);

  // Pre-compute derived opacity MotionValues for each of the 5 strings
  const saOpacity = useTransform(stringOpacityMultiplier, (v) =>
    Math.min(1, BASE_OPACITIES[0]! * v),
  );
  const reOpacity = useTransform(stringOpacityMultiplier, (v) =>
    Math.min(1, BASE_OPACITIES[1]! * v),
  );
  const gaOpacity = useTransform(stringOpacityMultiplier, (v) =>
    Math.min(1, BASE_OPACITIES[2]! * v),
  );
  const paOpacity = useTransform(stringOpacityMultiplier, (v) =>
    Math.min(1, BASE_OPACITIES[3]! * v),
  );
  const dhaOpacity = useTransform(stringOpacityMultiplier, (v) =>
    Math.min(1, BASE_OPACITIES[4]! * v),
  );
  const opacityByIndex = [saOpacity, reOpacity, gaOpacity, paOpacity, dhaOpacity];

  // Glow opacity reacts to hover
  const waveGlowOpacity = useTransform(hoverValue, [0, 1], [0.12, 0.25]);

  // String widths and properties (same as the static version)
  const stringProps = [
    { label: 'Sa', width: 2.2, isSa: true, isPa: false },
    { label: 'Re', width: 1.0, isSa: false, isPa: false },
    { label: 'Ga', width: 1.0, isSa: false, isPa: false },
    { label: 'Pa', width: 1.8, isSa: false, isPa: true },
    { label: 'Dha', width: 1.0, isSa: false, isPa: false },
  ];

  // Animation styles
  const idleDrift = `sadhana-wave-drift-${uid} 2s ease-in-out infinite`;
  const loadingAnim = `sadhana-wave-loading-${uid} 2s ease-in-out infinite`;
  const glowPulse = `sadhana-glow-pulse-${uid} 2s ease-in-out infinite`;

  const waveAnimStyle: CSSProperties = loading
    ? { animation: loadingAnim }
    : { animation: idleDrift };

  const glowAnimStyle: CSSProperties = loading
    ? { animation: glowPulse }
    : {};

  return (
    <>
      {visibleStrings.map((idx) => {
        const y = stringYs[idx]!;
        const props = stringProps[idx]!;
        const opacity = opacityByIndex[idx]!;

        if (idx === 0 && waveAmplitude > 0) {
          // Sa string: standing wave with CSS animation
          const wavePath = standingWavePath(
            fieldLeft,
            y,
            fieldLength,
            waveAmplitude,
          );
          return (
            <g key={props.label}>
              <g style={waveAnimStyle}>
                {/* Wave glow (saffron, behind the main wave) */}
                <g style={glowAnimStyle}>
                  <motion.path
                    d={wavePath}
                    stroke="#E8871E"
                    strokeWidth={props.width + 1.5}
                    strokeLinecap="round"
                    fill="none"
                    style={{ opacity: waveGlowOpacity }}
                    filter={filterUrl}
                  />
                </g>
                {/* Main wave path */}
                <motion.path
                  d={wavePath}
                  stroke="var(--text, #F0E6D3)"
                  strokeWidth={props.width}
                  strokeLinecap="round"
                  fill="none"
                  style={{ opacity }}
                />
              </g>
            </g>
          );
        }

        // Other strings: straight horizontal lines
        return (
          <motion.line
            key={props.label}
            x1={fieldLeft}
            y1={y}
            x2={fieldRight}
            y2={y}
            stroke={
              props.isPa
                ? 'var(--text-2, #B8A99A)'
                : 'var(--text, #F0E6D3)'
            }
            strokeWidth={props.width}
            strokeLinecap="round"
            style={{ opacity }}
          />
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Interactive Sa glow (motion-driven)
// ---------------------------------------------------------------------------

interface InteractiveSaGlowProps {
  cx: number;
  cy: number;
  r: number;
  gradientUrl: string;
  hoverValue: MotionValue<number>;
}

function InteractiveSaGlow({
  cx,
  cy,
  r,
  gradientUrl,
  hoverValue,
}: InteractiveSaGlowProps) {
  const glowScale = useTransform(hoverValue, [0, 1], [1, 1.35]);
  const glowOpacity = useTransform(hoverValue, [0, 1], [0.4, 0.7]);

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={gradientUrl}
      style={{
        scale: glowScale,
        opacity: glowOpacity,
        transformOrigin: `${cx}px ${cy}px`,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Logo({
  size: sizeProp = 40,
  variant = 'icon',
  loading = false,
  interactive: interactiveProp,
  className,
  style,
}: LogoProps) {
  // Resolve size from preset or number
  const size = typeof sizeProp === 'string' ? SIZE_PRESETS[sizeProp] : sizeProp;

  // Unique prefix for SVG IDs (safe when multiple Logos on one page)
  const uid = useId().replace(/:/g, '');
  const ids = useMemo(
    () => ({
      saGlow: `sa-glow-${uid}`,
      fade: `string-fade-${uid}`,
      mask: `fade-mask-${uid}`,
      filter: `wave-glow-${uid}`,
    }),
    [uid],
  );

  const showWordmark = variant === 'full';

  // At very small sizes (< 24px), simplify to 3 strings
  const isCompact = size < 24;

  // Interactive defaults to true for non-compact sizes
  const interactive = interactiveProp ?? !isCompact;

  // Icon viewBox: 64x64. Wordmark extends to 240x64.
  const totalWidth = showWordmark ? 240 : 64;
  const svgWidth = showWordmark ? size * (totalWidth / 64) : size;

  // String field geometry within the 64x64 icon area
  const fieldLeft = 12;
  const fieldRight = 62;
  const fieldTop = 10;
  const fieldBottom = 54;
  const fieldHeight = fieldBottom - fieldTop;
  const fieldLength = fieldRight - fieldLeft;

  // String Y positions (inverted: Sa at bottom, Dha at top)
  const stringYs = STRING_POSITIONS.map(
    (pos) => fieldBottom - pos * fieldHeight,
  );

  // Standing wave amplitude on Sa string (scales with size)
  const waveAmplitude = isCompact ? 0 : Math.min(4.5, size * 0.08);

  // Which strings to show at compact sizes
  const visibleStrings = isCompact
    ? [0, 3, 4] // Sa, Pa, Dha -- the skeleton
    : [0, 1, 2, 3, 4]; // All five

  // Sa terminus point radius
  const saPointR = isCompact ? 2.0 : 2.8;

  // CSS keyframes (scoped, injected once)
  const keyframesCSS = useMemo(
    () => getWaveKeyframes(uid, waveAmplitude),
    [uid, waveAmplitude],
  );

  // --- Framer Motion springs (always created to satisfy hooks rules) ---
  const hoverSpring = useSpring(0, SPRING_PRESETS.andolan);
  const pressSpring = useSpring(0, SPRING_PRESETS.kan);
  const pressScale = useTransform(pressSpring, [0, 1], [1, 0.965]);

  // --- Event handlers ---
  const handleHoverStart = () => { hoverSpring.set(1); };
  const handleHoverEnd = () => { hoverSpring.set(0); };
  const handleTapStart = () => { pressSpring.set(1); };
  const handleTap = () => { pressSpring.set(0); };
  const handleTapCancel = () => { pressSpring.set(0); };

  // -----------------------------------------------------------------------
  // Static string props (used when non-interactive)
  // -----------------------------------------------------------------------
  const staticStringProps = [
    { label: 'Sa', width: 2.2, opacity: 0.85, isSa: true, isPa: false },
    { label: 'Re', width: 1.0, opacity: 0.45, isSa: false, isPa: false },
    { label: 'Ga', width: 1.0, opacity: 0.45, isSa: false, isPa: false },
    { label: 'Pa', width: 1.8, opacity: 0.65, isSa: false, isPa: true },
    { label: 'Dha', width: 1.0, opacity: 0.40, isSa: false, isPa: false },
  ];

  // CSS animation styles for static (non-interactive) wave
  const idleDrift = `sadhana-wave-drift-${uid} 2s ease-in-out infinite`;
  const loadingAnim = `sadhana-wave-loading-${uid} 2s ease-in-out infinite`;
  const glowPulse = `sadhana-glow-pulse-${uid} 2s ease-in-out infinite`;
  const staticWaveStyle: CSSProperties = loading
    ? { animation: loadingAnim }
    : { animation: idleDrift };
  const staticGlowStyle: CSSProperties = loading
    ? { animation: glowPulse }
    : {};

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <>
      {/* Inject scoped keyframes (no-op at compact sizes where wave is hidden) */}
      {!isCompact && (
        <style dangerouslySetInnerHTML={{ __html: keyframesCSS }} />
      )}

      {interactive ? (
        /* ------- INTERACTIVE VARIANT: motion.svg with spring physics ------ */
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${totalWidth} 64`}
          width={svgWidth}
          height={size}
          fill="none"
          role="img"
          aria-label="Sadhana"
          className={className}
          tabIndex={0}
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
          onTapStart={handleTapStart}
          onTap={handleTap}
          onTapCancel={handleTapCancel}
          style={{ scale: pressScale, cursor: 'pointer', ...style }}
        >
          {/* --- Defs --- */}
          <defs>
            <radialGradient id={ids.saGlow} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E8871E" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E8871E" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={ids.fade} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopOpacity="1" />
              <stop offset="75%" stopOpacity="1" />
              <stop offset="100%" stopOpacity="0" />
            </linearGradient>
            <mask id={ids.mask}>
              <rect
                x={fieldLeft}
                y="0"
                width={fieldLength}
                height="64"
                fill={`url(#${ids.fade})`}
              />
            </mask>
            {!isCompact && (
              <filter
                id={ids.filter}
                x="-20%"
                y="-100%"
                width="140%"
                height="300%"
              >
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )}
          </defs>

          {/* --- String field (interactive) --- */}
          <g mask={`url(#${ids.mask})`}>
            <InteractiveStrings
              visibleStrings={visibleStrings}
              stringYs={stringYs}
              fieldLeft={fieldLeft}
              fieldRight={fieldRight}
              fieldLength={fieldLength}
              waveAmplitude={waveAmplitude}
              filterUrl={`url(#${ids.filter})`}
              loading={loading}
              uid={uid}
              hoverValue={hoverSpring}
            />
          </g>

          {/* --- Sa terminus glow (interactive) --- */}
          {!isCompact && (
            <InteractiveSaGlow
              cx={fieldLeft}
              cy={stringYs[0]!}
              r={saPointR * 3}
              gradientUrl={`url(#${ids.saGlow})`}
              hoverValue={hoverSpring}
            />
          )}

          {/* Solid saffron point */}
          <circle cx={fieldLeft} cy={stringYs[0]!} r={saPointR} fill="#E8871E" />

          {/* Pa terminus point */}
          {!isCompact && (
            <circle
              cx={fieldLeft}
              cy={stringYs[3]!}
              r={1.5}
              fill="var(--text-2, #B8A99A)"
              opacity={0.6}
            />
          )}

          {/* Wordmark */}
          {showWordmark && (
            <g>
              <line
                x1={fieldRight + 2}
                y1={stringYs[0]!}
                x2={totalWidth - 4}
                y2={stringYs[0]!}
                stroke="var(--text-3, #7A6B5E)"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <text
                x={fieldRight + 12}
                y={stringYs[0]! + 1}
                fontFamily="'Cormorant Garamond', Georgia, serif"
                fontSize="21"
                fontWeight="400"
                letterSpacing="0.06em"
                fill="var(--text, #F0E6D3)"
                dominantBaseline="middle"
                textAnchor="start"
              >
                S&#x101;dhan&#x101;
              </text>
              <circle
                cx={fieldRight + 6}
                cy={stringYs[0]!}
                r="1.5"
                fill="#E8871E"
                opacity="0.5"
              />
            </g>
          )}
        </motion.svg>
      ) : (
        /* ------- STATIC VARIANT: plain <svg>, CSS-only animation --------- */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${totalWidth} 64`}
          width={svgWidth}
          height={size}
          fill="none"
          role="img"
          aria-label="Sadhana"
          className={className}
          style={style}
        >
          <defs>
            <radialGradient id={ids.saGlow} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E8871E" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E8871E" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={ids.fade} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopOpacity="1" />
              <stop offset="75%" stopOpacity="1" />
              <stop offset="100%" stopOpacity="0" />
            </linearGradient>
            <mask id={ids.mask}>
              <rect
                x={fieldLeft}
                y="0"
                width={fieldLength}
                height="64"
                fill={`url(#${ids.fade})`}
              />
            </mask>
            {!isCompact && (
              <filter
                id={ids.filter}
                x="-20%"
                y="-100%"
                width="140%"
                height="300%"
              >
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )}
          </defs>

          {/* --- String field (static) --- */}
          <g mask={`url(#${ids.mask})`}>
            {visibleStrings.map((idx) => {
              const y = stringYs[idx]!;
              const props = staticStringProps[idx]!;

              if (idx === 0 && waveAmplitude > 0) {
                const wavePath = standingWavePath(
                  fieldLeft,
                  y,
                  fieldLength,
                  waveAmplitude,
                );
                return (
                  <g key={props.label}>
                    <g style={staticWaveStyle}>
                      <g style={staticGlowStyle}>
                        <path
                          d={wavePath}
                          stroke="#E8871E"
                          strokeWidth={props.width + 1.5}
                          strokeLinecap="round"
                          fill="none"
                          opacity={0.12}
                          filter={`url(#${ids.filter})`}
                        />
                      </g>
                      <path
                        d={wavePath}
                        stroke="var(--text, #F0E6D3)"
                        strokeWidth={props.width}
                        strokeLinecap="round"
                        fill="none"
                        opacity={props.opacity}
                      />
                    </g>
                  </g>
                );
              }

              return (
                <line
                  key={props.label}
                  x1={fieldLeft}
                  y1={y}
                  x2={fieldRight}
                  y2={y}
                  stroke={
                    props.isPa
                      ? 'var(--text-2, #B8A99A)'
                      : 'var(--text, #F0E6D3)'
                  }
                  strokeWidth={props.width}
                  strokeLinecap="round"
                  opacity={props.opacity}
                />
              );
            })}
          </g>

          {/* Sa terminus glow */}
          {!isCompact && (
            <circle
              cx={fieldLeft}
              cy={stringYs[0]!}
              r={saPointR * 3}
              fill={`url(#${ids.saGlow})`}
            />
          )}

          {/* Solid saffron point */}
          <circle cx={fieldLeft} cy={stringYs[0]!} r={saPointR} fill="#E8871E" />

          {/* Pa terminus point */}
          {!isCompact && (
            <circle
              cx={fieldLeft}
              cy={stringYs[3]!}
              r={1.5}
              fill="var(--text-2, #B8A99A)"
              opacity={0.6}
            />
          )}

          {/* Wordmark */}
          {showWordmark && (
            <g>
              <line
                x1={fieldRight + 2}
                y1={stringYs[0]!}
                x2={totalWidth - 4}
                y2={stringYs[0]!}
                stroke="var(--text-3, #7A6B5E)"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <text
                x={fieldRight + 12}
                y={stringYs[0]! + 1}
                fontFamily="'Cormorant Garamond', Georgia, serif"
                fontSize="21"
                fontWeight="400"
                letterSpacing="0.06em"
                fill="var(--text, #F0E6D3)"
                dominantBaseline="middle"
                textAnchor="start"
              >
                S&#x101;dhan&#x101;
              </text>
              <circle
                cx={fieldRight + 6}
                cy={stringYs[0]!}
                r="1.5"
                fill="#E8871E"
                opacity="0.5"
              />
            </g>
          )}
        </svg>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// LogoMark -- Icon only, no wordmark, minimal wrapper
// For tight spaces: favicons, tab icons, mobile status bar, loading spinners.
// ---------------------------------------------------------------------------

export interface LogoMarkProps {
  /** Size in pixels or named preset. Default 32. */
  size?: number | LogoSizePreset;
  /** When true, the Sa standing wave animates. */
  loading?: boolean;
  /** Additional class name. */
  className?: string;
  /** Additional inline styles. */
  style?: CSSProperties;
}

export function LogoMark({
  size = 32,
  loading = false,
  className,
  style,
}: LogoMarkProps) {
  return (
    <Logo
      size={size}
      variant="icon"
      loading={loading}
      interactive={false}
      className={className}
      style={style}
    />
  );
}
