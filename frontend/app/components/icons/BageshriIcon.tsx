/**
 * BageshriIcon -- Raga icon
 *
 * A waning crescent containing a small dot -- the night raga,
 * introspective, the self watching from within. The crescent is
 * the moon in its late phase (second prahar of night). The dot
 * is the listener alone with the music.
 *
 * Musical truth: Bageshri is midnight intimacy. The crescent moon
 * is the traditional time marker. The single dot is the longing
 * self -- shringar in separation.
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

export default function BageshriIcon({
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
      {/* Waning crescent -- formed by overlapping two circles.
          The outer circle is the moon; a second circle masks the right side. */}
      <path
        d="M36 8 C22 12, 14 22, 14 32 C14 42, 22 52, 36 56 C28 50, 24 42, 24 32 C24 22, 28 14, 36 8 Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* The self -- small dot within the crescent's hollow */}
      <circle cx="30" cy="32" r="2" fill={color} opacity="0.6" />

      {/* Faint outer glow arc -- moonlight diffusion */}
      <path
        d="M40 12 C48 18, 52 24, 52 32 C52 40, 48 46, 40 52"
        stroke={color}
        strokeWidth="0.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />
    </svg>
  );
}
