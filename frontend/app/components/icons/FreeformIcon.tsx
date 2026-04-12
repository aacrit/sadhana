/**
 * FreeformIcon -- Journey icon
 *
 * An open spiral that starts from a Sa point and spirals outward
 * without closing. Pure possibility, no grammar, no end.
 *
 * Musical truth: freeform riyaz has no goal except presence.
 * The spiral expands like a voice finding its range.
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

export default function FreeformIcon({
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
      {/* Sa point -- center origin */}
      <circle cx="32" cy="32" r="2" fill={color} />

      {/* Open spiral -- Archimedean, never closing */}
      <path
        d="M32 32 C34 30, 36 30, 37 32 C38 34, 36 36, 34 37 C31 38, 28 36, 27 33 C26 29, 28 26, 32 25 C37 24, 40 27, 41 32 C42 38, 38 42, 32 43 C25 44, 20 39, 19 32 C18 24, 23 18, 32 17 C41 16, 48 22, 49 32"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
