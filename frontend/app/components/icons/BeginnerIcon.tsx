/**
 * BeginnerIcon -- Journey icon
 *
 * A single hollow swara circle (Sa) with a tanpura drone wave
 * beneath it. The circle waits to be filled. Simple. Inviting.
 *
 * Musical truth: the beginner has one task -- find Sa. Everything
 * begins with that single frequency.
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

export default function BeginnerIcon({
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
      {/* Sa circle -- hollow, waiting */}
      <circle
        cx="32"
        cy="24"
        r="10"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Small Sa dot at center of circle */}
      <circle cx="32" cy="24" r="1.5" fill={color} opacity="0.4" />

      {/* Tanpura drone wave beneath */}
      <path
        d="M10 46 C16 42, 22 50, 28 46 C34 42, 40 50, 46 46 C52 42, 54 46, 54 46"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
