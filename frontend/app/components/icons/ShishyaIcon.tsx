/**
 * ShishyaIcon -- "The Empty String"
 *
 * A single tanpura string: one vertical line with a hollow tuning peg
 * circle at top and a bridge dot at bottom. Two sine arcs diverge from
 * the string's center -- vibration potential, not yet actualized.
 * Nothing is filled. It is all possibility.
 *
 * Musical truth: Shishya is the student who has just touched the
 * instrument. The string vibrates but has not yet found Sa.
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

export default function ShishyaIcon({
  size = 24,
  color = 'currentColor',
  className,
  style,
}: IconProps) {
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
      {/* Tuning peg -- hollow circle at top */}
      <circle
        cx="32"
        cy="8"
        r="4"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Main string -- single vertical line */}
      <line
        x1="32"
        y1="12"
        x2="32"
        y2="52"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Bridge dot at bottom */}
      <circle
        cx="32"
        cy="56"
        r="2.5"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Vibration arc -- left sine diverging from center */}
      <path
        d="M32 26 C28 28, 24 30, 22 32 C20 34, 22 36, 24 38"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* Vibration arc -- right sine diverging from center */}
      <path
        d="M32 26 C36 28, 40 30, 42 32 C44 34, 42 36, 40 38"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
