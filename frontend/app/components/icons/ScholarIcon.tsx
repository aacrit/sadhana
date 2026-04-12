/**
 * ScholarIcon -- Journey icon
 *
 * A shruti mandala: a circle divided into 22 segments (the 22 shrutis)
 * with an inner ring marking the 12 chromatic swaras. The mathematical
 * order of Indian tuning made visible as a clock face.
 *
 * Musical truth: the scholar perceives the 22-shruti system -- the
 * micro-tonal architecture that Western 12-TET cannot express.
 */

'use client';

import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  variant?: 'outline' | 'filled';
  className?: string;
  style?: CSSProperties;
}

export default function ScholarIcon({
  size = 24,
  color = 'currentColor',
  className,
  style,
}: IconProps) {
  const cx = 32;
  const cy = 32;
  const outerR = 24;
  const innerR = 16;
  const tickOuter = 21;

  // 22 shruti tick marks
  const shrutiTicks = Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * 2 * Math.PI - Math.PI / 2;
    return {
      x1: cx + tickOuter * Math.cos(angle),
      y1: cy + tickOuter * Math.sin(angle),
      x2: cx + outerR * Math.cos(angle),
      y2: cy + outerR * Math.sin(angle),
    };
  });

  // 12 swara marks on inner ring
  const swaraDots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + innerR * Math.cos(angle),
      y: cy + innerR * Math.sin(angle),
      // Sa (0) and Pa (7) are achala -- immovable, so slightly larger
      isMajor: i === 0 || i === 7,
    };
  });

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* Outer circle */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Inner circle */}
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        stroke={color}
        strokeWidth="0.75"
        fill="none"
        opacity="0.4"
      />

      {/* 22 shruti tick marks */}
      {shrutiTicks.map((tick, i) => (
        <line
          key={`shruti-${String(i)}`}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={color}
          strokeWidth="0.75"
          strokeLinecap="round"
          opacity="0.5"
        />
      ))}

      {/* 12 swara dots on inner ring */}
      {swaraDots.map((dot, i) => (
        <circle
          key={`swara-${String(i)}`}
          cx={dot.x}
          cy={dot.y}
          r={dot.isMajor ? 2 : 1.25}
          fill={color}
          opacity={dot.isMajor ? 1 : 0.6}
        />
      ))}
    </svg>
  );
}
