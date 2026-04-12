/**
 * CentsNeedle -- Precision pitch feedback component
 *
 * A geometric needle that rotates from -90 degrees (left, -50 cents)
 * to +90 degrees (right, +50 cents), with 0 degrees = vertical
 * (perfectly in tune). Arc marks at -50, -25, 0, +25, +50.
 *
 * The needle position is controlled by the `cents` prop (-50 to 50).
 * This maps directly to the voice pipeline's deviation output.
 */

'use client';

import type { CSSProperties } from 'react';

interface CentsNeedleProps {
  /** Cents deviation from target. -50 to 50. */
  cents?: number;
  /** Size in pixels. Default 24. */
  size?: number;
  /** Stroke color. Default currentColor. */
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export default function CentsNeedle({
  cents = 0,
  size = 24,
  color = 'currentColor',
  className,
  style,
}: CentsNeedleProps) {
  // Clamp cents to [-50, 50] and map to degrees [-90, 90]
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const degrees = (clampedCents / 50) * 90;

  const cx = 32;
  const cy = 48;
  const needleLength = 30;
  const arcR = 34;

  // Tick mark positions: -50, -25, 0, +25, +50
  const tickAngles = [-90, -45, 0, 45, 90];
  const tickLabels = ['-50', '-25', '0', '+25', '+50'];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 56"
      width={size * (64 / 56)}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* Arc guide */}
      <path
        d={`M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy}`}
        stroke={color}
        strokeWidth="0.75"
        fill="none"
        opacity="0.2"
      />

      {/* Tick marks */}
      {tickAngles.map((angle, i) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const innerR = arcR - 4;
        const outerR = arcR;
        const x1 = cx + innerR * Math.cos(rad);
        const y1 = cy + innerR * Math.sin(rad);
        const x2 = cx + outerR * Math.cos(rad);
        const y2 = cy + outerR * Math.sin(rad);
        const labelR = arcR + 6;
        const lx = cx + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);

        return (
          <g key={tickLabels[i]}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={angle === 0 ? '1.5' : '0.75'}
              strokeLinecap="round"
              opacity={angle === 0 ? 0.8 : 0.4}
            />
            {/* Labels only at extremes and center for readability */}
            {(i === 0 || i === 2 || i === 4) && (
              <text
                x={lx}
                y={ly}
                fill={color}
                fontSize="5"
                fontFamily="var(--font-mono, monospace)"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity="0.5"
              >
                {tickLabels[i]}
              </text>
            )}
          </g>
        );
      })}

      {/* Needle -- rotates around pivot */}
      <g transform={`rotate(${String(degrees)}, ${String(cx)}, ${String(cy)})`}>
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - needleLength}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* Center pivot circle */}
      <circle cx={cx} cy={cy} r="2.5" fill={color} />
    </svg>
  );
}
