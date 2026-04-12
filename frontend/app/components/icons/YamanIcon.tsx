/**
 * YamanIcon -- Raga icon
 *
 * A pointed Mughal ogee arch with one node deliberately displaced
 * upward -- the tivra Ma that elevates Yaman above all other evening
 * ragas. Seven arc segments (sampoorna = 7 swaras), the fourth
 * broken from the pattern.
 *
 * Musical truth: Yaman is evening devotion. The ogee arch is Mughal
 * architecture at dusk. The displaced fourth (Ma tivra) is the one
 * alteration that transforms Bilawal into aspiration.
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

export default function YamanIcon({
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
      {/* Ogee arch -- pointed arch form from Mughal architecture */}
      <path
        d="M12 54 C12 40, 18 28, 24 20 C28 14, 30 10, 32 8 C34 10, 36 14, 40 20 C46 28, 52 40, 52 54"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Base line */}
      <line
        x1="12"
        y1="54"
        x2="52"
        y2="54"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Seven node marks along the arch -- swaras
          The 4th (Ma position) is displaced upward */}
      <circle cx="14" cy="50" r="1.5" fill={color} opacity="0.5" />
      <circle cx="19" cy="38" r="1.5" fill={color} opacity="0.5" />
      <circle cx="24" cy="26" r="1.5" fill={color} opacity="0.5" />
      {/* Ma tivra -- displaced upward, breaking the curve */}
      <circle cx="29" cy="12" r="2" fill={color} opacity="0.9" />
      <circle cx="40" cy="26" r="1.5" fill={color} opacity="0.5" />
      <circle cx="45" cy="38" r="1.5" fill={color} opacity="0.5" />
      <circle cx="50" cy="50" r="1.5" fill={color} opacity="0.5" />

      {/* Inner light point at apex -- devotional aspiration */}
      <circle cx="32" cy="8" r="1.5" fill={color} opacity="0.7" />
    </svg>
  );
}
