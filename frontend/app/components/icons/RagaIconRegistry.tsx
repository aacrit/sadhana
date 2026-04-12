/**
 * RagaIconRegistry -- Maps raga IDs to their icon components.
 *
 * Usage:
 *   import { getRagaIcon } from './icons';
 *   const Icon = getRagaIcon('bhairav');
 *   <Icon size={48} />
 */

'use client';

import type { ComponentType, CSSProperties } from 'react';
import BhairavIcon from './BhairavIcon';
import YamanIcon from './YamanIcon';
import BhoopaliIcon from './BhoopaliIcon';
import BhimpalasIcon from './BhimpalasIcon';
import BageshriIcon from './BageshriIcon';

interface IconProps {
  size?: number;
  color?: string;
  variant?: 'outline' | 'filled';
  className?: string;
  style?: CSSProperties;
}

const RAGA_ICONS: Record<string, ComponentType<IconProps>> = {
  bhairav: BhairavIcon,
  yaman: YamanIcon,
  bhoopali: BhoopaliIcon,
  bhimpalasi: BhimpalasIcon,
  bageshri: BageshriIcon,
};

/**
 * Get the icon component for a raga by its ID.
 * Returns undefined if no icon exists for the given raga.
 */
export function getRagaIcon(ragaId: string): ComponentType<IconProps> | undefined {
  return RAGA_ICONS[ragaId];
}

interface RagaIconRegistryProps {
  ragaId: string;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders the appropriate raga icon for a given raga ID.
 * Returns null if no icon is registered for that raga.
 */
export default function RagaIconRegistry({
  ragaId,
  size = 48,
  color,
  className,
  style,
}: RagaIconRegistryProps) {
  const Icon = RAGA_ICONS[ragaId];
  if (!Icon) return null;
  return <Icon size={size} color={color} className={className} style={style} />;
}
