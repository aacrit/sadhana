/**
 * PlayIcon -- UI icon
 *
 * An equilateral triangle with slightly rounded corners. Saffron
 * fill when active. The play symbol is universal but rendered here
 * with the rounded joins of the Ragamala system.
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

export default function PlayIcon({
  size = 24,
  color = 'currentColor',
  className,
  style,
  active = false,
}: IconProps) {
  const fillColor = active ? 'var(--accent, #E8871E)' : 'none';
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
      <path
        d="M7 4.5 L19 12 L7 19.5 Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fillColor}
      />
    </svg>
  );
}
