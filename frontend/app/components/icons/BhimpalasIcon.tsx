/**
 * BhimpalasIcon -- Raga icon
 *
 * An asymmetric teardrop form. The left side (ascending, audava = 5
 * swaras) is thinner. The right side (descending, sampoorna = 7
 * swaras) is fuller. The asymmetry IS the musical truth: what goes
 * up in five comes down in seven. Bhimpalasi's vakra (crooked)
 * movement creates this visual weight.
 *
 * Musical truth: Bhimpalasi ascends with 5 notes but descends with
 * 7. The afternoon raga's longing is in the descent -- more notes,
 * more weight, more pathos.
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

export default function BhimpalasIcon({
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
      {/* Asymmetric teardrop: thin ascent (left), full descent (right)
          The form is deliberately off-center -- heavier on the right */}
      <path
        d="M30 10 C26 18, 20 28, 18 36 C16 44, 20 54, 32 56 C44 58, 50 46, 48 36 C46 26, 40 16, 36 10 C34 6, 31 6, 30 10 Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner line suggesting the vakra (crooked) movement path */}
      <path
        d="M30 18 C28 24, 24 32, 26 40 C28 46, 34 48, 38 42 C42 36, 40 26, 36 18"
        stroke={color}
        strokeWidth="0.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />

      {/* Weight point at bottom -- the gravity of descent */}
      <circle cx="32" cy="52" r="2" fill={color} opacity="0.5" />
    </svg>
  );
}
