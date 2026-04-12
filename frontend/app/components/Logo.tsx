/**
 * Logo.tsx — The Sadhana mark
 *
 * Four tanpura strings (overtone series) converging to a Sa point.
 * Open arc behind them: 225-315 degrees, top quadrant missing — the
 * practice still to come.
 *
 * Saffron on the fundamental string and Sa point only — earned color.
 * Deep indigo strings at decreasing opacity — harmonic depth.
 *
 * Works from 16px (favicon) to 200px (splash). Pure SVG, no raster.
 */

'use client';

import type { CSSProperties } from 'react';

interface LogoProps {
  /** Size in pixels. Default 40. */
  size?: number;
  /** 'full' shows mark + wordmark. 'icon' shows mark only. */
  variant?: 'full' | 'icon';
  /** Additional class name. */
  className?: string;
  /** Additional inline styles. */
  style?: CSSProperties;
}

export default function Logo({
  size = 40,
  variant = 'icon',
  className,
  style,
}: LogoProps) {
  const showWordmark = variant === 'full';
  // When showing wordmark, the total SVG is wider
  const viewBoxWidth = showWordmark ? 180 : 64;
  const svgWidth = showWordmark ? size * (180 / 64) : size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${viewBoxWidth} 64`}
      width={svgWidth}
      height={size}
      fill="none"
      role="img"
      aria-label="Sadhana"
      className={className}
      style={style}
    >
      {/* Arc — 225 to 315 degrees (bottom-left to bottom-right, open at top) */}
      <path
        d={describeArc(32, 32, 28, 225, 315)}
        stroke="var(--text-3, #7A6B5E)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* String 4 — highest partial, faintest */}
      <line
        x1="20" y1="8"
        x2="32" y2="48"
        stroke="var(--text-3, #7A6B5E)"
        strokeWidth="1"
        opacity="0.25"
      />

      {/* String 3 — third partial */}
      <line
        x1="25" y1="8"
        x2="32" y2="48"
        stroke="var(--text-3, #7A6B5E)"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* String 2 — second partial (Pa) */}
      <line
        x1="39" y1="8"
        x2="32" y2="48"
        stroke="var(--text-2, #B8A99A)"
        strokeWidth="1.2"
        opacity="0.6"
      />

      {/* String 1 — fundamental (Sa), saffron */}
      <line
        x1="44" y1="8"
        x2="32" y2="48"
        stroke="#E8871E"
        strokeWidth="1.5"
        opacity="1"
      />

      {/* Sa point — convergence, saffron */}
      <circle
        cx="32"
        cy="48"
        r="2.5"
        fill="#E8871E"
      />

      {/* Wordmark */}
      {showWordmark && (
        <text
          x="72"
          y="40"
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontSize="22"
          fontWeight="400"
          letterSpacing="0.04em"
          fill="var(--text, #F0E6D3)"
        >
          Sadhana
        </text>
      )}
    </svg>
  );
}

/**
 * Describe an SVG arc path from startAngle to endAngle (degrees).
 * 0 degrees = 3 o'clock, angles go clockwise.
 */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  // Sweep > 180 degrees?
  const diff = endAngle - startAngle;
  const largeArc = diff > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}
