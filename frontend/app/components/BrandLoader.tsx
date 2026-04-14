/**
 * BrandLoader.tsx -- Branded loading state
 *
 * A cinematic brand moment that replaces generic loading indicators.
 * Shows the full Sadhana wordmark with Tantri string accent and
 * animated standing wave. The text is the hero -- "Sadhana" commands
 * the space during loading, establishing brand recognition from the
 * first millisecond.
 *
 * Motion:
 *   - Logo resolves via Tanpura Release spring (400/15)
 *   - Standing wave oscillates via CSS @keyframes (~2s cycle)
 *   - Sa terminus pulses with saffron glow (~1.5s cycle)
 *   - Tagline fades in with delay (serif, quiet)
 *   - On completion: entire loader scales down and fades via spring
 *
 * Respects prefers-reduced-motion: static mark, no animation.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import type { CSSProperties } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BrandLoaderProps {
  /** Whether the app is still loading. When false, the loader fades out. */
  loading: boolean;
  /** Optional tagline below the mark. */
  tagline?: string;
  /** Additional class name for the container. */
  className?: string;
  /** Additional inline styles. */
  style?: CSSProperties;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
      duration: 0.5,
    },
  },
};

const taglineVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 0.45,
    y: 0,
    transition: {
      delay: 0.5,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const loaderStyles: Record<string, CSSProperties> = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '32px',
    backgroundColor: 'var(--bg, #0A1A14)',
    zIndex: 9999,
  },
  tagline: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '15px',
    fontWeight: 300,
    letterSpacing: '0.1em',
    color: 'var(--text-3, #7A6B5E)',
    textAlign: 'center' as const,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BrandLoader({
  loading,
  tagline,
  className,
  style,
}: BrandLoaderProps) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="brand-loader"
          variants={containerVariants}
          initial="visible"
          animate="visible"
          exit="exit"
          style={{ ...loaderStyles.container, ...style }}
          className={className}
          role="status"
          aria-label="Loading Sadhana"
        >
          <Logo
            size={80}
            variant="full"
            loading={true}
            interactive={false}
            animate
          />
          {tagline && (
            <motion.p
              variants={taglineVariants}
              initial="hidden"
              animate="visible"
              style={loaderStyles.tagline}
            >
              {tagline}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
