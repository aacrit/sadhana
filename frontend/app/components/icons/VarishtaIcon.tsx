/**
 * VarishtaIcon -- "The Shruti Web"
 *
 * Seven nodes (the 7 shuddha swaras) arranged on a circle, connected
 * by lines showing primary harmonic relationships: Sa-Pa (3:2),
 * Sa-Ma (4:3), Sa-Ga (5:4), Re-Dha (5:3). A containing circle holds
 * them. The web is precise, angular -- the mathematical order of
 * Indian tuning made visible.
 *
 * Musical truth: Varistha perceives the harmonic web, not just
 * individual swaras. Every note is a ratio, every interval a
 * relationship.
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

// 7 swaras placed evenly around a circle, starting from top (12 o'clock)
// Sa at top, then clockwise: Re, Ga, Ma, Pa, Dha, Ni
function swaraPosition(index: number, cx: number, cy: number, r: number) {
  const angle = (index / 7) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export default function VarishtaIcon({
  size = 24,
  color = 'currentColor',
  className,
  style,
}: IconProps) {
  const cx = 32;
  const cy = 32;
  const r = 20;
  const nodeR = 2.5;

  // Swara positions: 0=Sa, 1=Re, 2=Ga, 3=Ma, 4=Pa, 5=Dha, 6=Ni
  const nodes = Array.from({ length: 7 }, (_, i) => swaraPosition(i, cx, cy, r));

  // Harmonic connections: Sa-Pa (0-4), Sa-Ma (0-3), Sa-Ga (0-2), Re-Dha (1-5)
  const connections: [number, number][] = [
    [0, 4], // Sa-Pa: perfect fifth 3:2
    [0, 3], // Sa-Ma: perfect fourth 4:3
    [0, 2], // Sa-Ga: major third 5:4
    [1, 5], // Re-Dha: fifth relationship
  ];

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
      {/* Containing circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r + 6}
        stroke={color}
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />

      {/* Harmonic connection lines */}
      {connections.map(([a, b]) => {
        const nodeA = nodes[a];
        const nodeB = nodes[b];
        if (!nodeA || !nodeB) return null;
        return (
          <line
            key={`${String(a)}-${String(b)}`}
            x1={nodeA.x}
            y1={nodeA.y}
            x2={nodeB.x}
            y2={nodeB.y}
            stroke={color}
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.5"
          />
        );
      })}

      {/* Perimeter connections (adjacent swaras) */}
      {nodes.map((node, i) => {
        const next = nodes[(i + 1) % 7]!;
        return (
          <line
            key={`edge-${String(i)}`}
            x1={node.x}
            y1={node.y}
            x2={next.x}
            y2={next.y}
            stroke={color}
            strokeWidth="0.75"
            strokeLinecap="round"
            opacity="0.25"
          />
        );
      })}

      {/* Swara nodes */}
      {nodes.map((node, i) => (
        <circle
          key={`node-${String(i)}`}
          cx={node.x}
          cy={node.y}
          r={i === 0 ? nodeR + 0.5 : nodeR}
          fill={i === 0 ? color : 'none'}
          stroke={color}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
