/**
 * ExplorerIcon -- Journey icon
 *
 * Five dots (five ragas) in a radial arrangement connected to a
 * center point (the explorer). One connection line is brighter than
 * the others -- the current raga. A constellation of musical
 * discovery.
 *
 * Musical truth: the explorer moves between ragas, building a map
 * of relationships. Each raga is a star in their sky.
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

// 5 points arranged in a pentagon around center
function pentagonPoint(index: number, cx: number, cy: number, r: number) {
  const angle = (index / 5) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export default function ExplorerIcon({
  size = 24,
  color = 'currentColor',
  className,
  style,
}: IconProps) {
  const cx = 32;
  const cy = 32;
  const r = 18;

  const points = Array.from({ length: 5 }, (_, i) => pentagonPoint(i, cx, cy, r));

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
      {/* Connection lines from center to each raga point */}
      {points.map((point, i) => (
        <line
          key={`line-${String(i)}`}
          x1={cx}
          y1={cy}
          x2={point.x}
          y2={point.y}
          stroke={color}
          strokeWidth={i === 0 ? '1.5' : '0.75'}
          strokeLinecap="round"
          opacity={i === 0 ? 0.9 : 0.3}
        />
      ))}

      {/* Center dot -- the explorer */}
      <circle cx={cx} cy={cy} r="3" fill={color} />

      {/* Five raga dots */}
      {points.map((point, i) => (
        <circle
          key={`dot-${String(i)}`}
          cx={point.x}
          cy={point.y}
          r="2.5"
          stroke={color}
          strokeWidth="1.5"
          fill={i === 0 ? color : 'none'}
          opacity={i === 0 ? 1 : 0.6}
        />
      ))}
    </svg>
  );
}
