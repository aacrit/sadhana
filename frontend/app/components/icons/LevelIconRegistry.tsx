/**
 * LevelIconRegistry -- Maps level titles to their icon components.
 *
 * Usage:
 *   import { getLevelIcon } from './icons';
 *   const Icon = getLevelIcon('Shishya');
 *   <Icon size={48} />
 */

'use client';

import type { ComponentType, CSSProperties } from 'react';
import ShishyaIcon from './ShishyaIcon';
import SadhakaIcon from './SadhakaIcon';
import VarishtaIcon from './VarishtaIcon';
import GuruIcon from './GuruIcon';

interface IconProps {
  size?: number;
  color?: string;
  variant?: 'outline' | 'filled';
  className?: string;
  style?: CSSProperties;
}

const LEVEL_ICONS: Record<string, ComponentType<IconProps>> = {
  Shishya: ShishyaIcon,
  Sadhaka: SadhakaIcon,
  Varistha: VarishtaIcon,
  Guru: GuruIcon,
};

/**
 * Get the icon component for a level by its title.
 * Returns undefined if no icon exists for the given level.
 */
export function getLevelIcon(levelTitle: string): ComponentType<IconProps> | undefined {
  return LEVEL_ICONS[levelTitle];
}

interface LevelIconRegistryProps {
  levelTitle: string;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders the appropriate level icon for a given level title.
 * Returns null if no icon is registered for that level.
 */
export default function LevelIconRegistry({
  levelTitle,
  size = 48,
  color,
  className,
  style,
}: LevelIconRegistryProps) {
  const Icon = LEVEL_ICONS[levelTitle];
  if (!Icon) return null;
  return <Icon size={size} color={color} className={className} style={style} />;
}
