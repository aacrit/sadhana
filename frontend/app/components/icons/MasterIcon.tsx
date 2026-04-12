/**
 * MasterIcon -- Journey icon
 *
 * Abstract melodic contour: a single gesture that rises (aroha),
 * curves with a characteristic phrase, and descends (avaroha).
 * The line is drawn in one continuous stroke -- like a raga's
 * movement captured in a single breath.
 *
 * Musical truth: the master composes. A raga is not a scale but
 * a living gesture, and the master can express it in one line.
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

export default function MasterIcon({
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
      {/* Melodic contour -- ascending, characteristic curve, descending
          One continuous path expressing a raga's movement */}
      <path
        d="M8 48 C12 44, 16 36, 20 28 C24 20, 26 16, 30 14 C34 12, 36 16, 38 14 C40 12, 42 14, 44 18 C46 22, 48 30, 52 36 C54 40, 56 46, 58 48"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Start point -- Sa at rest */}
      <circle cx="8" cy="48" r="2" fill={color} opacity="0.6" />

      {/* Peak -- the characteristic turn of the phrase */}
      <circle cx="38" cy="14" r="1.5" fill={color} opacity="0.4" />

      {/* End point -- return to Sa */}
      <circle cx="58" cy="48" r="2" fill={color} opacity="0.6" />
    </svg>
  );
}
