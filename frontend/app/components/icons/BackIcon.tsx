/**
 * BackIcon -- UI icon
 *
 * Not a generic chevron. A meend curve: a graceful arc that starts
 * going right and curves back left -- referencing the meend ornament
 * (glide back to a lower swara). More expressive than a flat arrow.
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

export default function BackIcon({
  size = 24,
  color = 'currentColor',
  className,
  style,
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* Meend curve -- glides from right to left with a graceful arc */}
      <path
        d="M17 8 C14 8, 10 9, 8 12 C6 15, 7 18, 7 18"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Arrow tip at the end of the meend */}
      <path
        d="M10 16 L7 18 L9 20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
