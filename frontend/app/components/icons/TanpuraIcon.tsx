/**
 * TanpuraIcon -- UI icon
 *
 * The 4-string mark: four vertical hairlines of slightly different
 * heights, converging at a bottom bridge point. Same as logo's
 * string element in isolation. The tanpura reduced to its essence.
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

export default function TanpuraIcon({
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
      {/* Four strings converging to bridge point
          Mirrors Logo.tsx proportions scaled to 24px viewBox */}

      {/* String 4 -- highest partial, faintest */}
      <line x1="7" y1="3" x2="12" y2="18" stroke={color} strokeWidth="0.75" strokeLinecap="round" opacity="0.25" />

      {/* String 3 -- third partial */}
      <line x1="9" y1="3" x2="12" y2="18" stroke={color} strokeWidth="0.75" strokeLinecap="round" opacity="0.4" />

      {/* String 2 -- Pa */}
      <line x1="15" y1="3" x2="12" y2="18" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />

      {/* String 1 -- Sa fundamental */}
      <line x1="17" y1="3" x2="12" y2="18" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="1" />

      {/* Bridge point */}
      <circle cx="12" cy="19" r="1.5" fill={color} />
    </svg>
  );
}
