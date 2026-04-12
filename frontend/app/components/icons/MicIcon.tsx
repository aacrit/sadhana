/**
 * MicIcon -- UI icon
 *
 * Minimal microphone: rounded rectangle body, a small arc below
 * for the pickup stand, and optional sound wave arcs on each side
 * when active. Saffron when listening.
 */

'use client';

import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  variant?: 'outline' | 'filled';
  className?: string;
  style?: CSSProperties;
  active?: boolean;
}

export default function MicIcon({
  size = 24,
  color = 'currentColor',
  className,
  style,
  active = false,
}: IconProps) {
  const strokeColor = active ? 'var(--accent, #E8871E)' : color;

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
      {/* Mic body -- rounded rectangle */}
      <rect
        x="9"
        y="2"
        width="6"
        height="12"
        rx="3"
        stroke={strokeColor}
        strokeWidth="1.5"
        fill="none"
      />

      {/* Pickup arc below the body */}
      <path
        d="M6 12 C6 16.4, 8.7 19, 12 19 C15.3 19, 18 16.4, 18 12"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Stand line */}
      <line
        x1="12"
        y1="19"
        x2="12"
        y2="22"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Sound wave arcs -- only when active */}
      {active && (
        <>
          <path
            d="M4 9 C3 10.5, 3 13, 4 14.5"
            stroke={strokeColor}
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M20 9 C21 10.5, 21 13, 20 14.5"
            stroke={strokeColor}
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
        </>
      )}
    </svg>
  );
}
