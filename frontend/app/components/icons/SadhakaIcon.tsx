/**
 * SadhakaIcon -- "Three Strings Found"
 *
 * Three tanpura strings: Sa, Pa, Sa. The center string (Pa) has a
 * slightly heavier stroke weight -- it has been discovered. A small
 * oval resonance mark floats beside the Pa string. The peg circles
 * are now solid. Musical truth: Sadhaka has found the fifth, the
 * first harmonic relationship.
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

export default function SadhakaIcon({
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
      {/* Peg 1 -- Sa (left), solid */}
      <circle cx="22" cy="8" r="3" fill={color} />

      {/* Peg 2 -- Pa (center), solid */}
      <circle cx="32" cy="8" r="3" fill={color} />

      {/* Peg 3 -- Sa upper (right), solid */}
      <circle cx="42" cy="8" r="3" fill={color} />

      {/* String 1 -- Sa */}
      <line
        x1="22"
        y1="11"
        x2="22"
        y2="52"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* String 2 -- Pa (heavier, discovered) */}
      <line
        x1="32"
        y1="11"
        x2="32"
        y2="52"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* String 3 -- Sa upper */}
      <line
        x1="42"
        y1="11"
        x2="42"
        y2="52"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Bridge -- horizontal line connecting bases */}
      <line
        x1="20"
        y1="54"
        x2="44"
        y2="54"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Resonance mark beside Pa -- a small oval */}
      <ellipse
        cx="38"
        cy="32"
        rx="2.5"
        ry="4"
        stroke={color}
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
