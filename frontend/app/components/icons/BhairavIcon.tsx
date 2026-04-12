/**
 * BhairavIcon -- Raga icon
 *
 * A circle bisected by a horizontal line (the dawn horizon).
 * Above the line: faint radiating marks (first light).
 * Below the line: a subtle oscillation wave (andolan on Re komal).
 * The andolan is the signature -- the gentle trembling that
 * defines Bhairav's gravity.
 *
 * Musical truth: Bhairav is dawn. Re komal and Dha komal pull
 * the melody downward with andolan. The horizon divides
 * darkness from the first light.
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

export default function BhairavIcon({
  size = 24,
  color = 'currentColor',
  className,
  style,
}: IconProps) {
  // Default to the raga's palette rose, but fall back to currentColor
  const strokeColor = color === 'currentColor' ? 'currentColor' : color;

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
      {/* Main circle */}
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke={strokeColor}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Horizon line -- bisects circle */}
      <line
        x1="10"
        y1="32"
        x2="54"
        y2="32"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Radiating marks above horizon -- first light */}
      <line x1="32" y1="14" x2="32" y2="18" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="24" y1="17" x2="26" y2="20" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <line x1="40" y1="17" x2="38" y2="20" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" opacity="0.3" />

      {/* Andolan wave below horizon -- the komal swara oscillation */}
      <path
        d="M18 40 C22 38, 24 42, 28 40 C32 38, 34 42, 38 40 C42 38, 44 42, 46 40"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}
