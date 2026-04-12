/**
 * BhoopaliIcon -- Raga icon
 *
 * A regular pentagon: five vertices, five swaras, pure pentatonic
 * symmetry. The most balanced geometric form for a pentatonic raga.
 * Lines radiate from each vertex toward center. All shuddha = pure
 * geometry, no distortion. The simplest icon -- the entry point.
 *
 * Musical truth: Bhoopali uses five shuddha swaras. No komal, no
 * tivra. Five-fold symmetry is its visual truth.
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

function pentagonVertex(index: number, cx: number, cy: number, r: number) {
  const angle = (index / 5) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export default function BhoopaliIcon({
  size = 24,
  color = 'currentColor',
  className,
  style,
}: IconProps) {
  const cx = 32;
  const cy = 33; // slightly lower to visually center the pentagon
  const r = 20;

  const vertices = Array.from({ length: 5 }, (_, i) => pentagonVertex(i, cx, cy, r));

  // Pentagon path
  const pentPath =
    vertices.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x} ${v.y}`).join(' ') + ' Z';

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
      {/* Pentagon outline */}
      <path
        d={pentPath}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Radiating lines from vertices to center */}
      {vertices.map((v, i) => (
        <line
          key={`ray-${String(i)}`}
          x1={v.x}
          y1={v.y}
          x2={cx}
          y2={cy}
          stroke={color}
          strokeWidth="0.75"
          strokeLinecap="round"
          opacity="0.25"
        />
      ))}

      {/* Vertex dots -- the five swaras */}
      {vertices.map((v, i) => (
        <circle
          key={`v-${String(i)}`}
          cx={v.x}
          cy={v.y}
          r="2"
          fill={color}
          opacity="0.7"
        />
      ))}
    </svg>
  );
}
