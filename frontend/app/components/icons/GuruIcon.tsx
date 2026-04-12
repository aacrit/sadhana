/**
 * GuruIcon -- "The Full Tanpura"
 *
 * A complete tanpura rendered as geometric line art: the gourd body
 * (teardrop), neck, four string lines, and the distinctive crown
 * peg box. Zarr-kashi: gold 1px hairlines only. At 200px it is
 * unmistakable. At 48px it remains readable.
 *
 * Musical truth: the Guru has become the instrument. The tanpura
 * is no longer external -- it is the practitioner's voice.
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

export default function GuruIcon({
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
      {/* Crown peg box */}
      <path
        d="M28 4 L36 4 L35 8 L29 8 Z"
        stroke={color}
        strokeWidth="1"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Tuning pegs -- four small horizontal marks */}
      <line x1="27" y1="5" x2="29" y2="5" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="27" y1="7" x2="29" y2="7" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="35" y1="5" x2="37" y2="5" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="35" y1="7" x2="37" y2="7" stroke={color} strokeWidth="1" strokeLinecap="round" />

      {/* Neck -- long thin rectangle */}
      <line
        x1="32"
        y1="8"
        x2="32"
        y2="36"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Gourd body -- teardrop/tumba shape */}
      <path
        d="M32 36 C24 38, 18 44, 18 50 C18 56, 24 60, 32 60 C40 60, 46 56, 46 50 C46 44, 40 38, 32 36 Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Four strings from pegs to bridge */}
      <line x1="29" y1="8" x2="29" y2="50" stroke={color} strokeWidth="0.5" opacity="0.6" strokeLinecap="round" />
      <line x1="31" y1="8" x2="31" y2="50" stroke={color} strokeWidth="0.5" opacity="0.6" strokeLinecap="round" />
      <line x1="33" y1="8" x2="33" y2="50" stroke={color} strokeWidth="0.5" opacity="0.6" strokeLinecap="round" />
      <line x1="35" y1="8" x2="35" y2="50" stroke={color} strokeWidth="0.5" opacity="0.6" strokeLinecap="round" />

      {/* Bridge -- small horizontal bar on the gourd */}
      <line
        x1="28"
        y1="50"
        x2="36"
        y2="50"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Gold accent -- single zarr-kashi hairline across the gourd */}
      <line
        x1="22"
        y1="48"
        x2="42"
        y2="48"
        stroke="var(--gold, #D4AF37)"
        strokeWidth="0.75"
        opacity="0.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
