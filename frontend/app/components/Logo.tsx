/**
 * Logo.tsx — The Sadhana mark: Tantri Resonance
 *
 * Five horizontal strings at just-intonation intervals — the pentatonic
 * field of Raga Bhoopali (Sa Re Ga Pa Dha), the first raga a student
 * encounters. Spacing follows logarithmic frequency ratios: acoustically
 * truthful, not decorative.
 *
 * The Sa string (lowest, thickest) carries a standing wave — the shape
 * of a sung note activating the instrument. A saffron terminus point
 * anchors the tonic at the left. Strings extend rightward without
 * boundary — the practice continues.
 *
 * Wordmark variant: "Sādhanā" in Cormorant Garamond with a hairline
 * string threading the baseline, Sa terminus at the 'S'. Icon and word
 * share the same visual grammar — they are one instrument.
 *
 * Sizes: 16px (3 strings, Sa point only) to 200px (full articulation
 * with standing wave, glow, all 5 strings at JI spacing).
 *
 * Works in Night mode (warm parchment strings on Deep Malachite) and
 * Day mode (dark ink strings on Ivory).
 */

'use client';

import { useId, type CSSProperties } from 'react';

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
// Props
// ---------------------------------------------------------------------------

interface LogoProps {
  /** Size in pixels (height). Default 40. */
  size?: number;
  /** 'full' shows mark + wordmark. 'icon' shows mark only. */
  variant?: 'full' | 'icon';
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
 * The displacement follows sin(pi * x/L) * amplitude, giving a single
 * antinode at center — the shape of a string vibrating at its fundamental.
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
    // Fundamental mode: sin(pi * t) — single antinode at center
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
// Component
// ---------------------------------------------------------------------------

export default function Logo({
  size = 40,
  variant = 'icon',
  className,
  style,
}: LogoProps) {
  // Unique prefix for SVG IDs (safe when multiple Logos on one page)
  const uid = useId().replace(/:/g, '');
  const ids = {
    saGlow: `sa-glow-${uid}`,
    fade: `string-fade-${uid}`,
    mask: `fade-mask-${uid}`,
    filter: `wave-glow-${uid}`,
  };

  const showWordmark = variant === 'full';

  // Icon viewBox: 64x64. Wordmark extends to 240x64.
  const iconWidth = 64;
  const totalWidth = showWordmark ? 240 : iconWidth;
  const svgWidth = showWordmark ? size * (totalWidth / 64) : size;

  // At very small sizes (< 24px), simplify to 3 strings
  const isCompact = size < 24;

  // String field geometry within the 64x64 icon area
  const fieldLeft = 12;     // Sa terminus point location
  const fieldRight = 62;    // Strings extend to right edge (no boundary)
  const fieldTop = 10;      // Top string (Dha)
  const fieldBottom = 54;   // Bottom string (Sa)
  const fieldHeight = fieldBottom - fieldTop;
  const fieldLength = fieldRight - fieldLeft;

  // String Y positions (inverted: Sa at bottom, Dha at top)
  const stringYs = STRING_POSITIONS.map(
    (pos) => fieldBottom - pos * fieldHeight,
  );

  // String visual properties
  // Sa and Pa are achala (immovable) — thicker
  const stringProps = [
    { label: 'Sa', width: 2.2, opacity: 0.85, isSa: true, isPa: false },
    { label: 'Re', width: 1.0, opacity: 0.45, isSa: false, isPa: false },
    { label: 'Ga', width: 1.0, opacity: 0.45, isSa: false, isPa: false },
    { label: 'Pa', width: 1.8, opacity: 0.65, isSa: false, isPa: true },
    { label: 'Dha', width: 1.0, opacity: 0.40, isSa: false, isPa: false },
  ];

  // Standing wave amplitude on Sa string (scales with size)
  const waveAmplitude = isCompact ? 0 : Math.min(4.5, size * 0.08);

  // Which strings to show at compact sizes
  const visibleStrings = isCompact
    ? [0, 3, 4] // Sa, Pa, Dha — the skeleton
    : [0, 1, 2, 3, 4]; // All five

  // Sa terminus point radius (scales slightly with size)
  const saPointR = isCompact ? 2.0 : 2.8;

  return (
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
        {/* Saffron glow for Sa terminus */}
        <radialGradient id={ids.saGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8871E" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#E8871E" stopOpacity="0" />
        </radialGradient>

        {/* Fade-out at right edge: strings dissolve into space */}
        <linearGradient id={ids.fade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopOpacity="1" />
          <stop offset="75%" stopOpacity="1" />
          <stop offset="100%" stopOpacity="0" />
        </linearGradient>

        {/* Mask for the rightward fade */}
        <mask id={ids.mask}>
          <rect
            x={fieldLeft}
            y="0"
            width={fieldLength}
            height="64"
            fill={`url(#${ids.fade})`}
          />
        </mask>

        {/* Standing wave glow filter — subtle, not heavy */}
        {!isCompact && (
          <filter id={ids.filter} x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* === STRING FIELD === */}
      <g mask={`url(#${ids.mask})`}>
        {visibleStrings.map((idx) => {
          const y = stringYs[idx]!;
          const props = stringProps[idx]!;

          if (idx === 0 && waveAmplitude > 0) {
            // Sa string: standing wave
            return (
              <g key={props.label}>
                {/* Wave glow (saffron, behind the main wave) */}
                <path
                  d={standingWavePath(fieldLeft, y, fieldLength, waveAmplitude)}
                  stroke="#E8871E"
                  strokeWidth={props.width + 1.5}
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.12}
                  filter={!isCompact ? `url(#${ids.filter})` : undefined}
                />
                {/* Main wave path */}
                <path
                  d={standingWavePath(fieldLeft, y, fieldLength, waveAmplitude)}
                  stroke="var(--text, #F0E6D3)"
                  strokeWidth={props.width}
                  strokeLinecap="round"
                  fill="none"
                  opacity={props.opacity}
                />
              </g>
            );
          }

          // Other strings: straight horizontal lines
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

      {/* === SA TERMINUS POINT === */}
      {/* Glow halo (only at non-compact sizes) */}
      {!isCompact && (
        <circle
          cx={fieldLeft}
          cy={stringYs[0]!}
          r={saPointR * 3}
          fill={`url(#${ids.saGlow})`}
        />
      )}
      {/* Solid saffron point */}
      <circle
        cx={fieldLeft}
        cy={stringYs[0]!}
        r={saPointR}
        fill="#E8871E"
      />

      {/* === PA TERMINUS POINT (subtle, smaller) === */}
      {!isCompact && (
        <circle
          cx={fieldLeft}
          cy={stringYs[3]!}
          r={1.5}
          fill="var(--text-2, #B8A99A)"
          opacity={0.6}
        />
      )}

      {/* === WORDMARK === */}
      {showWordmark && (
        <g>
          {/* Hairline string threading through the wordmark baseline */}
          <line
            x1={fieldRight + 2}
            y1={stringYs[0]!}
            x2={totalWidth - 4}
            y2={stringYs[0]!}
            stroke="var(--text-3, #7A6B5E)"
            strokeWidth="0.5"
            opacity="0.3"
          />

          {/* Wordmark text */}
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
            {/* Unicode: S + a with macron + dhana with macron on final a */}
            S&#x101;dhan&#x101;
          </text>

          {/* Sa point echo at start of wordmark — connecting icon to word */}
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
  );
}
