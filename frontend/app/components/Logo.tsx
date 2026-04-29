/**
 * Logo.tsx -- The Sadhana Brand Mark (Redesigned)
 *
 * The wordmark IS the brand. "Sadhana" in Cormorant Garamond commands
 * the space. The Devanagari "sadhana" is an equal partner, not a
 * subtitle. The Tantri strings (Bhoopali pentatonic at just-intonation
 * intervals) serve as a resonant accent band beneath -- connecting the
 * brand to the instrument, but never competing with the text.
 *
 * The design philosophy: an instrument, not a tech product.
 *
 * Three variants:
 *   full     -- Large wordmark + Devanagari + Tantri string accent
 *   wordmark -- Text only (Sadhana + Devanagari)
 *   compact  -- Tantri mark only (icon contexts, favicon, loading)
 *
 * Size presets:
 *   xs    (24px)  -- Compact mark only, minimal detail
 *   sm    (32px)  -- Navigation, small contexts
 *   md    (48px)  -- Header standard
 *   lg    (80px)  -- Hero sections
 *   xl   (120px)  -- Splash, landing
 *   xxl  (200px)  -- Maximum detail, cinematic
 *   hero (400px)  -- Home page hero, maximum impact
 *
 * Motion physics (Ragamala spring grammar):
 *   Load:   Strings resolve via Tanpura Release (400/15), text fades up
 *   Hover:  Standing wave intensifies via Andolan (120/8)
 *   Press:  Kan snap (1000/30)
 *   Idle:   Subtle Sa glow pulse (~1.5s), wave drift (~2s)
 *
 * Works on Night (#0A1A14) and Day (#F5F0E8) backgrounds.
 * Respects prefers-reduced-motion.
 */

'use client';

import { useId, useMemo, type CSSProperties } from 'react';
import { motion, useSpring, useTransform, type MotionValue } from 'framer-motion';

// ---------------------------------------------------------------------------
// Just-intonation frequency ratios for Bhoopali pentatonic
// Sa=1, Re=9/8, Ga=5/4, Pa=3/2, Dha=5/3
// Mapped to vertical position via log2(ratio) normalized to [0, 1]
// ---------------------------------------------------------------------------

const BHOOPALI_RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
const LOG2_MAX = Math.log2(5 / 3); // ~0.737

/** Normalized Y positions (0=Sa at bottom, 1=Dha at top) */
const STRING_POSITIONS = BHOOPALI_RATIOS.map((r) => Math.log2(r) / LOG2_MAX);

// ---------------------------------------------------------------------------
// Spring physics presets (from Ragamala motion grammar)
// ---------------------------------------------------------------------------

const SPRING_PRESETS = {
  andolan: { stiffness: 120, damping: 8, mass: 1 },
  kan: { stiffness: 1000, damping: 30, mass: 1 },
  tanpuraRelease: { stiffness: 400, damping: 15, mass: 1 },
} as const;

// ---------------------------------------------------------------------------
// Size presets
// ---------------------------------------------------------------------------

export type LogoSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'hero';

const SIZE_PRESETS: Record<LogoSizePreset, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 80,
  xl: 120,
  xxl: 200,
  hero: 400,
};

// Legacy preset mapping for backward compatibility
// B8 fix: 'hero' renamed to 'heroLegacy' — SIZE_PRESETS.hero (400px) takes precedence.
const LEGACY_PRESETS: Record<string, number> = {
  favicon: 16,
  nav: 32,
  header: 48,
  heroLegacy: 96,
  splash: 200,
};

// String visual properties
const STRING_PROPS = [
  { label: 'Sa', width: 2.2, opacity: 0.85, isSa: true, isPa: false },
  { label: 'Re', width: 1.0, opacity: 0.45, isSa: false, isPa: false },
  { label: 'Ga', width: 1.0, opacity: 0.45, isSa: false, isPa: false },
  { label: 'Pa', width: 1.8, opacity: 0.65, isSa: false, isPa: true },
  { label: 'Dha', width: 1.0, opacity: 0.40, isSa: false, isPa: false },
];

const BASE_OPACITIES = STRING_PROPS.map((s) => s.opacity);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type LogoVariant = 'full' | 'wordmark' | 'compact' | 'icon';

export interface LogoProps {
  /** Size in pixels (height), or a named preset. Default 48. */
  size?: number | LogoSizePreset | 'favicon' | 'nav' | 'header' | 'hero' | 'splash';
  /** 'full' = text + mark, 'wordmark' = text only, 'compact'/'icon' = mark only. */
  variant?: LogoVariant;
  /** When true, the Sa standing wave animates (CSS keyframes). */
  loading?: boolean;
  /** When true, hover/press spring physics are active. Default: true for sizes >= 24px. */
  interactive?: boolean;
  /** Show the load-in animation. Default false. */
  animate?: boolean;
  /** Additional class name. */
  className?: string;
  /** Additional inline styles. */
  style?: CSSProperties;
}

// ---------------------------------------------------------------------------
// Standing wave path generator
// ---------------------------------------------------------------------------

function standingWavePath(
  x0: number,
  y: number,
  length: number,
  amplitude: number,
  segments: number = 48,
): string {
  const points: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = x0 + t * length;
    const displacement = amplitude * Math.sin(Math.PI * t);
    if (i === 0) {
      points.push(`M ${x.toFixed(2)} ${(y - displacement).toFixed(2)}`);
    } else {
      points.push(`L ${x.toFixed(2)} ${(y - displacement).toFixed(2)}`);
    }
  }
  return points.join(' ');
}

// ---------------------------------------------------------------------------
// CSS keyframes (scoped by uid)
// ---------------------------------------------------------------------------

function getKeyframes(uid: string, amplitude: number): string {
  const drift = Math.max(0.3, amplitude * 0.15);
  return `
    @keyframes sadhana-wave-drift-${uid} {
      0%, 100% { transform: translateY(0px); }
      25% { transform: translateY(${drift.toFixed(2)}px); }
      50% { transform: translateY(0px); }
      75% { transform: translateY(-${drift.toFixed(2)}px); }
    }
    @keyframes sadhana-wave-loading-${uid} {
      0%, 100% { transform: translateY(${(-amplitude * 0.5).toFixed(2)}px); }
      50% { transform: translateY(${(amplitude * 0.5).toFixed(2)}px); }
    }
    @keyframes sadhana-glow-pulse-${uid} {
      0%, 100% { opacity: 0.15; }
      50% { opacity: 0.35; }
    }
    @keyframes sadhana-sa-pulse-${uid} {
      0%, 100% { r: ${(amplitude > 0 ? 2.8 : 2).toFixed(1)}; opacity: 0.6; }
      50% { r: ${(amplitude > 0 ? 3.4 : 2.4).toFixed(1)}; opacity: 1; }
    }
    @keyframes sadhana-text-glow-${uid} {
      0%, 100% { opacity: 0.03; }
      50% { opacity: 0.08; }
    }
  `;
}

// ---------------------------------------------------------------------------
// Sub-component: Interactive string accent (motion-driven)
// ---------------------------------------------------------------------------

interface StringAccentProps {
  visibleStrings: number[];
  stringYs: number[];
  fieldLeft: number;
  fieldRight: number;
  fieldLength: number;
  waveAmplitude: number;
  filterUrl: string;
  loading: boolean;
  uid: string;
  hoverValue: MotionValue<number>;
}

function StringAccent({
  visibleStrings,
  stringYs,
  fieldLeft,
  fieldRight,
  fieldLength,
  waveAmplitude,
  filterUrl,
  loading,
  uid,
  hoverValue,
}: StringAccentProps) {
  const stringOpacityMultiplier = useTransform(hoverValue, [0, 1], [1, 1.4]);

  // P5 fix: single useTransform returning number[] avoids hooks-in-map violation.
  const opacitiesMotion = useTransform(
    stringOpacityMultiplier,
    (v: number) => BASE_OPACITIES.map((base) => Math.min(1, base * v)),
  );

  // Derive per-string MotionValues by transforming the array output.
  const opacity0 = useTransform(opacitiesMotion, (arr: number[]) => arr[0] ?? BASE_OPACITIES[0]!);
  const opacity1 = useTransform(opacitiesMotion, (arr: number[]) => arr[1] ?? BASE_OPACITIES[1]!);
  const opacity2 = useTransform(opacitiesMotion, (arr: number[]) => arr[2] ?? BASE_OPACITIES[2]!);
  const opacity3 = useTransform(opacitiesMotion, (arr: number[]) => arr[3] ?? BASE_OPACITIES[3]!);
  const opacity4 = useTransform(opacitiesMotion, (arr: number[]) => arr[4] ?? BASE_OPACITIES[4]!);
  const opacityByIndex = [opacity0, opacity1, opacity2, opacity3, opacity4];

  const waveGlowOpacity = useTransform(hoverValue, [0, 1], [0.12, 0.3]);

  const idleDrift = `sadhana-wave-drift-${uid} 2s ease-in-out infinite`;
  const loadingAnim = `sadhana-wave-loading-${uid} 2s ease-in-out infinite`;
  const glowPulse = `sadhana-glow-pulse-${uid} 1.5s ease-in-out infinite`;

  const waveAnimStyle: CSSProperties = loading
    ? { animation: loadingAnim }
    : { animation: idleDrift };

  const glowAnimStyle: CSSProperties = { animation: glowPulse };

  return (
    <>
      {visibleStrings.map((idx) => {
        const y = stringYs[idx]!;
        const props = STRING_PROPS[idx]!;
        const opacity = opacityByIndex[idx]!;

        if (idx === 0 && waveAmplitude > 0) {
          const wavePath = standingWavePath(fieldLeft, y, fieldLength, waveAmplitude);
          return (
            <g key={props.label}>
              <g style={waveAnimStyle}>
                <g style={glowAnimStyle}>
                  <motion.path
                    d={wavePath}
                    stroke="#E8871E"
                    strokeWidth={props.width + 1.5}
                    strokeLinecap="round"
                    fill="none"
                    style={{ opacity: waveGlowOpacity }}
                    filter={filterUrl}
                  />
                </g>
                <motion.path
                  d={wavePath}
                  stroke="var(--text, #F0E6D3)"
                  strokeWidth={props.width}
                  strokeLinecap="round"
                  fill="none"
                  style={{ opacity }}
                />
              </g>
            </g>
          );
        }

        return (
          <motion.line
            key={props.label}
            x1={fieldLeft}
            y1={y}
            x2={fieldRight}
            y2={y}
            stroke={
              props.isPa ? 'var(--text-2, #B8A99A)' : 'var(--text, #F0E6D3)'
            }
            strokeWidth={props.width}
            strokeLinecap="round"
            style={{ opacity }}
          />
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Interactive Sa glow
// ---------------------------------------------------------------------------

interface SaGlowProps {
  cx: number;
  cy: number;
  r: number;
  gradientUrl: string;
  hoverValue: MotionValue<number>;
}

function SaGlow({ cx, cy, r, gradientUrl, hoverValue }: SaGlowProps) {
  const glowScale = useTransform(hoverValue, [0, 1], [1, 1.5]);
  const glowOpacity = useTransform(hoverValue, [0, 1], [0.5, 0.8]);

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={gradientUrl}
      style={{
        scale: glowScale,
        opacity: glowOpacity,
        transformOrigin: `${cx}px ${cy}px`,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Compact mark (icon variant) -- used for small sizes
// ---------------------------------------------------------------------------

function CompactMark({
  size,
  loading,
  uid,
  ids,
  hoverSpring,
  pressScale,
  interactive,
  handleHoverStart,
  handleHoverEnd,
  handleTapStart,
  handleTap,
  handleTapCancel,
  className,
  style,
}: {
  size: number;
  loading: boolean;
  uid: string;
  ids: { saGlow: string; fade: string; mask: string; filter: string };
  hoverSpring: MotionValue<number>;
  pressScale: MotionValue<number>;
  interactive: boolean;
  handleHoverStart: () => void;
  handleHoverEnd: () => void;
  handleTapStart: () => void;
  handleTap: () => void;
  handleTapCancel: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const isCompact = size < 24;
  const fieldLeft = 12;
  const fieldRight = 62;
  const fieldTop = 10;
  const fieldBottom = 54;
  const fieldHeight = fieldBottom - fieldTop;
  const fieldLength = fieldRight - fieldLeft;
  const stringYs = STRING_POSITIONS.map((pos) => fieldBottom - pos * fieldHeight);
  const waveAmplitude = isCompact ? 0 : Math.min(4.5, size * 0.08);
  const visibleStrings = isCompact ? [0, 3, 4] : [0, 1, 2, 3, 4];
  const saPointR = isCompact ? 2.0 : 2.8;

  const keyframesCSS = useMemo(
    () => getKeyframes(uid, waveAmplitude),
    [uid, waveAmplitude],
  );

  const idleDrift = `sadhana-wave-drift-${uid} 2s ease-in-out infinite`;
  const loadingAnim = `sadhana-wave-loading-${uid} 2s ease-in-out infinite`;
  const glowPulse = `sadhana-glow-pulse-${uid} 1.5s ease-in-out infinite`;
  const staticWaveStyle: CSSProperties = loading
    ? { animation: loadingAnim }
    : { animation: idleDrift };
  const staticGlowStyle: CSSProperties = { animation: glowPulse };

  const content = (
    <>
      {!isCompact && (
        <style dangerouslySetInnerHTML={{ __html: keyframesCSS }} />
      )}
      <defs>
        <radialGradient id={ids.saGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8871E" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#E8871E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ids.fade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopOpacity="1" />
          <stop offset="75%" stopOpacity="1" />
          <stop offset="100%" stopOpacity="0" />
        </linearGradient>
        <mask id={ids.mask}>
          <rect x={fieldLeft} y="0" width={fieldLength} height="64" fill={`url(#${ids.fade})`} />
        </mask>
        {!isCompact && (
          <filter id={ids.filter} x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g mask={`url(#${ids.mask})`}>
        {interactive ? (
          <StringAccent
            visibleStrings={visibleStrings}
            stringYs={stringYs}
            fieldLeft={fieldLeft}
            fieldRight={fieldRight}
            fieldLength={fieldLength}
            waveAmplitude={waveAmplitude}
            filterUrl={`url(#${ids.filter})`}
            loading={loading}
            uid={uid}
            hoverValue={hoverSpring}
          />
        ) : (
          visibleStrings.map((idx) => {
            const y = stringYs[idx]!;
            const props = STRING_PROPS[idx]!;
            if (idx === 0 && waveAmplitude > 0) {
              const wavePath = standingWavePath(fieldLeft, y, fieldLength, waveAmplitude);
              return (
                <g key={props.label}>
                  <g style={staticWaveStyle}>
                    <g style={staticGlowStyle}>
                      <path
                        d={wavePath}
                        stroke="#E8871E"
                        strokeWidth={props.width + 1.5}
                        strokeLinecap="round"
                        fill="none"
                        opacity={0.12}
                        filter={`url(#${ids.filter})`}
                      />
                    </g>
                    <path
                      d={wavePath}
                      stroke="var(--text, #F0E6D3)"
                      strokeWidth={props.width}
                      strokeLinecap="round"
                      fill="none"
                      opacity={props.opacity}
                    />
                  </g>
                </g>
              );
            }
            return (
              <line
                key={props.label}
                x1={fieldLeft}
                y1={y}
                x2={fieldRight}
                y2={y}
                stroke={props.isPa ? 'var(--text-2, #B8A99A)' : 'var(--text, #F0E6D3)'}
                strokeWidth={props.width}
                strokeLinecap="round"
                opacity={props.opacity}
              />
            );
          })
        )}
      </g>

      {!isCompact && interactive && (
        <SaGlow
          cx={fieldLeft}
          cy={stringYs[0]!}
          r={saPointR * 3}
          gradientUrl={`url(#${ids.saGlow})`}
          hoverValue={hoverSpring}
        />
      )}
      {!isCompact && !interactive && (
        <circle
          cx={fieldLeft}
          cy={stringYs[0]!}
          r={saPointR * 3}
          fill={`url(#${ids.saGlow})`}
        />
      )}

      <circle cx={fieldLeft} cy={stringYs[0]!} r={saPointR} fill="#E8871E" />

      {!isCompact && (
        <circle
          cx={fieldLeft}
          cy={stringYs[3]!}
          r={1.5}
          fill="var(--text-2, #B8A99A)"
          opacity={0.6}
        />
      )}
    </>
  );

  if (interactive) {
    return (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        role="img"
        aria-label="Sadhana"
        className={className}
        tabIndex={0}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        onTapStart={handleTapStart}
        onTap={handleTap}
        onTapCancel={handleTapCancel}
        style={{ scale: pressScale, cursor: 'pointer', ...style }}
      >
        {content}
      </motion.svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="Sadhana"
      className={className}
      style={style}
    >
      {content}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Full logo (text-dominant with string accent) -- REDESIGNED
//
// The text IS the brand. "Sadhana" in large Cormorant Garamond dominates.
// The Devanagari sits as an equal partner. The Tantri strings are a
// subtle resonant accent band beneath, not the primary element.
//
// ViewBox layout (proportional, responsive):
//   0-56:   "Sadhana" wordmark -- large, tracked, commanding
//   56-80:  Devanagari -- slightly smaller, same visual weight
//   82-108: Tantri string accent band (if showing)
// ---------------------------------------------------------------------------

function FullLogo({
  size,
  showDevanagari,
  showStrings,
  loading,
  animate,
  uid,
  ids,
  hoverSpring,
  pressScale,
  interactive,
  handleHoverStart,
  handleHoverEnd,
  handleTapStart,
  handleTap,
  handleTapCancel,
  className,
  style,
}: {
  size: number;
  showDevanagari: boolean;
  showStrings: boolean;
  loading: boolean;
  animate: boolean;
  uid: string;
  ids: { saGlow: string; fade: string; mask: string; filter: string };
  hoverSpring: MotionValue<number>;
  pressScale: MotionValue<number>;
  interactive: boolean;
  handleHoverStart: () => void;
  handleHoverEnd: () => void;
  handleTapStart: () => void;
  handleTap: () => void;
  handleTapCancel: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  // Scale font size relative to the component's rendered height.
  // The viewBox is defined for a "standard" height of 120 units.
  // At size=80 (lg), the wordmark should be visually large and commanding.
  // At size=200+ (xxl/hero), it should be enormous.

  // ViewBox dimensions -- fixed coordinate space
  const vbWidth = 480;

  // Layout constants in viewBox coordinates
  const primaryFontSize = 72; // "Sadhana" -- large, commanding
  const devanagariFontSize = 28;
  const primaryY = 56;
  const devanagariY = showDevanagari ? 86 : 0;
  const stringAreaTop = showDevanagari ? 100 : 72;
  const stringAreaHeight = showStrings ? 22 : 0;
  const vbHeight = showStrings
    ? stringAreaTop + stringAreaHeight + 8
    : (showDevanagari ? 96 : 68);
  const aspectRatio = vbWidth / vbHeight;
  const svgWidth = size * aspectRatio;

  // String field within the viewbox (full width, thin band)
  const sFieldLeft = 24;
  const sFieldRight = 456;
  const sFieldLength = sFieldRight - sFieldLeft;
  const sFieldBottom = stringAreaTop + stringAreaHeight;
  const sFieldHeight = stringAreaHeight;
  const stringYs = STRING_POSITIONS.map(
    (pos) => sFieldBottom - pos * sFieldHeight,
  );
  const waveAmplitude = showStrings ? Math.min(3.5, size * 0.04) : 0;

  const keyframesCSS = useMemo(
    () => getKeyframes(uid, waveAmplitude),
    [uid, waveAmplitude],
  );

  // Static animation styles
  const idleDrift = `sadhana-wave-drift-${uid} 2s ease-in-out infinite`;
  const loadingAnim = `sadhana-wave-loading-${uid} 2s ease-in-out infinite`;
  const glowPulse = `sadhana-glow-pulse-${uid} 1.5s ease-in-out infinite`;
  const textGlowPulse = `sadhana-text-glow-${uid} 3s ease-in-out infinite`;
  const waveAnimStyle: CSSProperties = loading
    ? { animation: loadingAnim }
    : { animation: idleDrift };
  const glowAnimStyle: CSSProperties = { animation: glowPulse };

  // Hover-driven text glow
  const textGlowOpacity = useTransform(hoverSpring, [0, 1], [0, 0.12]);

  const content = (
    <>
      {/* P5 fix: keyframesCSS is already memoized on [uid, waveAmplitude].
           When !showStrings, waveAmplitude is 0, so keyframesCSS == getKeyframes(uid, 0). */}
      <style dangerouslySetInnerHTML={{ __html: keyframesCSS }} />
      <defs>
        <radialGradient id={ids.saGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8871E" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#E8871E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ids.fade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopOpacity="1" />
          <stop offset="75%" stopOpacity="1" />
          <stop offset="100%" stopOpacity="0" />
        </linearGradient>
        <mask id={ids.mask}>
          <rect x={sFieldLeft} y="0" width={sFieldLength} height={vbHeight} fill={`url(#${ids.fade})`} />
        </mask>
        {showStrings && (
          <filter id={ids.filter} x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* -- Primary wordmark: "Sadhana" -- THE HERO -- */}
      <text
        x={vbWidth / 2}
        y={primaryY}
        fontSize={primaryFontSize}
        fontWeight="400"
        letterSpacing="0.08em"
        fill="var(--text, #F0E6D3)"
        textAnchor="middle"
        dominantBaseline="auto"
        style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
      >
        S&#x101;dhan&#x101;
      </text>

      {/* Subtle ambient saffron glow behind the wordmark -- breathing */}
      <text
        x={vbWidth / 2}
        y={primaryY}
        fontSize={primaryFontSize}
        fontWeight="400"
        letterSpacing="0.08em"
        fill="#E8871E"
        textAnchor="middle"
        dominantBaseline="auto"
        opacity={0.04}
        style={{ fontFamily: 'var(--font-serif), Georgia, serif', animation: textGlowPulse }}
        aria-hidden="true"
      />

      {/* Hover text glow -- saffron warmth on interaction */}
      {interactive && (
        <motion.text
          x={vbWidth / 2}
          y={primaryY}
          fontSize={primaryFontSize}
          fontWeight="400"
          letterSpacing="0.08em"
          fill="#E8871E"
          textAnchor="middle"
          dominantBaseline="auto"
          style={{ fontFamily: 'var(--font-serif), Georgia, serif', opacity: textGlowOpacity }}
          aria-hidden="true"
        >
          S&#x101;dhan&#x101;
        </motion.text>
      )}

      {/* Saffron accent dot -- a tiny Sa marker beside the S */}
      <circle
        cx={vbWidth / 2 - 148}
        cy={primaryY + 4}
        r="2.5"
        fill="#E8871E"
        opacity={0.6}
      />

      {/* -- Devanagari -- treated as an equal, not a subtitle -- */}
      {showDevanagari && (
        <text
          x={vbWidth / 2}
          y={devanagariY}
          fontSize={devanagariFontSize}
          fontWeight="400"
          letterSpacing="0.12em"
          fill="var(--text-2, #B8A99A)"
          textAnchor="middle"
          dominantBaseline="auto"
          opacity={0.75}
          style={{ fontFamily: 'var(--font-devanagari), serif' }}
        >
          {'\u0938\u093E\u0927\u0928\u093E'}
        </text>
      )}

      {/* -- Tantri string accent band -- */}
      {showStrings && (
        <g mask={`url(#${ids.mask})`}>
          {interactive ? (
            <StringAccent
              visibleStrings={[0, 1, 2, 3, 4]}
              stringYs={stringYs}
              fieldLeft={sFieldLeft}
              fieldRight={sFieldRight}
              fieldLength={sFieldLength}
              waveAmplitude={waveAmplitude}
              filterUrl={`url(#${ids.filter})`}
              loading={loading}
              uid={uid}
              hoverValue={hoverSpring}
            />
          ) : (
            [0, 1, 2, 3, 4].map((idx) => {
              const y = stringYs[idx]!;
              const props = STRING_PROPS[idx]!;
              if (idx === 0 && waveAmplitude > 0) {
                const wavePath = standingWavePath(sFieldLeft, y, sFieldLength, waveAmplitude);
                return (
                  <g key={props.label}>
                    <g style={waveAnimStyle}>
                      <g style={glowAnimStyle}>
                        <path
                          d={wavePath}
                          stroke="#E8871E"
                          strokeWidth={props.width + 1}
                          strokeLinecap="round"
                          fill="none"
                          opacity={0.12}
                          filter={`url(#${ids.filter})`}
                        />
                      </g>
                      <path
                        d={wavePath}
                        stroke="var(--text, #F0E6D3)"
                        strokeWidth={props.width}
                        strokeLinecap="round"
                        fill="none"
                        opacity={props.opacity}
                      />
                    </g>
                  </g>
                );
              }
              return (
                <line
                  key={props.label}
                  x1={sFieldLeft}
                  y1={y}
                  x2={sFieldRight}
                  y2={y}
                  stroke={props.isPa ? 'var(--text-2, #B8A99A)' : 'var(--text, #F0E6D3)'}
                  strokeWidth={props.width * 0.8}
                  strokeLinecap="round"
                  opacity={props.opacity * 0.7}
                />
              );
            })
          )}
        </g>
      )}

      {/* Sa terminus point on the string accent */}
      {showStrings && (
        <>
          {interactive ? (
            <SaGlow
              cx={sFieldLeft}
              cy={stringYs[0]!}
              r={6}
              gradientUrl={`url(#${ids.saGlow})`}
              hoverValue={hoverSpring}
            />
          ) : (
            <circle
              cx={sFieldLeft}
              cy={stringYs[0]!}
              r={6}
              fill={`url(#${ids.saGlow})`}
            />
          )}
          <circle cx={sFieldLeft} cy={stringYs[0]!} r={2.2} fill="#E8871E" />
        </>
      )}
    </>
  );

  if (interactive) {
    return (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        width={svgWidth}
        height={size}
        fill="none"
        role="img"
        aria-label="Sadhana"
        className={className}
        tabIndex={0}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        onTapStart={handleTapStart}
        onTap={handleTap}
        onTapCancel={handleTapCancel}
        style={{ scale: pressScale, cursor: 'pointer', ...style }}
        {...(animate
          ? {
              initial: { opacity: 0, y: 12 },
              animate: {
                opacity: 1,
                y: 0,
                transition: {
                  type: 'spring' as const,
                  stiffness: 400,
                  damping: 15,
                  delay: 0.08,
                },
              },
            }
          : {})}
      >
        {content}
      </motion.svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      width={svgWidth}
      height={size}
      fill="none"
      role="img"
      aria-label="Sadhana"
      className={className}
      style={style}
    >
      {content}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Logo({
  size: sizeProp = 48,
  variant = 'full',
  loading = false,
  interactive: interactiveProp,
  animate = false,
  className,
  style,
}: LogoProps) {
  // Resolve size from preset or number
  const size =
    typeof sizeProp === 'string'
      ? SIZE_PRESETS[sizeProp as LogoSizePreset] ??
        LEGACY_PRESETS[sizeProp] ??
        48
      : sizeProp;

  // Normalize variant: 'icon' maps to 'compact' for backward compat
  const resolvedVariant: LogoVariant =
    variant === 'icon' ? 'compact' : variant;

  const uid = useId().replace(/:/g, '');
  const ids = useMemo(
    () => ({
      saGlow: `sa-glow-${uid}`,
      fade: `string-fade-${uid}`,
      mask: `fade-mask-${uid}`,
      filter: `wave-glow-${uid}`,
    }),
    [uid],
  );

  // Interactive defaults to true for non-tiny sizes
  const interactive = interactiveProp ?? size >= 24;

  // --- Framer Motion springs (always created to satisfy hooks rules) ---
  const hoverSpring = useSpring(0, SPRING_PRESETS.andolan);
  const pressSpring = useSpring(0, SPRING_PRESETS.kan);
  const pressScale = useTransform(pressSpring, [0, 1], [1, 0.965]);

  const handleHoverStart = () => { hoverSpring.set(1); };
  const handleHoverEnd = () => { hoverSpring.set(0); };
  const handleTapStart = () => { pressSpring.set(1); };
  const handleTap = () => { pressSpring.set(0); };
  const handleTapCancel = () => { pressSpring.set(0); };

  // Decide what to show based on variant and size
  if (resolvedVariant === 'compact') {
    return (
      <CompactMark
        size={size}
        loading={loading}
        uid={uid}
        ids={ids}
        hoverSpring={hoverSpring}
        pressScale={pressScale}
        interactive={interactive}
        handleHoverStart={handleHoverStart}
        handleHoverEnd={handleHoverEnd}
        handleTapStart={handleTapStart}
        handleTap={handleTap}
        handleTapCancel={handleTapCancel}
        className={className}
        style={style}
      />
    );
  }

  // Full and wordmark variants
  const showDevanagari = size >= 36;
  const showStrings = resolvedVariant === 'full' && size >= 36;

  return (
    <FullLogo
      size={size}
      showDevanagari={showDevanagari}
      showStrings={showStrings}
      loading={loading}
      animate={animate}
      uid={uid}
      ids={ids}
      hoverSpring={hoverSpring}
      pressScale={pressScale}
      interactive={interactive}
      handleHoverStart={handleHoverStart}
      handleHoverEnd={handleHoverEnd}
      handleTapStart={handleTapStart}
      handleTap={handleTap}
      handleTapCancel={handleTapCancel}
      className={className}
      style={style}
    />
  );
}

// ---------------------------------------------------------------------------
// LogoMark -- Icon only, no wordmark, minimal wrapper
// Backward compatible export for existing usage.
// ---------------------------------------------------------------------------

export interface LogoMarkProps {
  /** Size in pixels or named preset. Default 32. */
  size?: number | LogoSizePreset | 'favicon' | 'nav' | 'header' | 'hero' | 'splash';
  /** When true, the Sa standing wave animates. */
  loading?: boolean;
  /** Additional class name. */
  className?: string;
  /** Additional inline styles. */
  style?: CSSProperties;
}

export function LogoMark({
  size = 32,
  loading = false,
  className,
  style,
}: LogoMarkProps) {
  return (
    <Logo
      size={size}
      variant="compact"
      loading={loading}
      interactive={false}
      className={className}
      style={style}
    />
  );
}
