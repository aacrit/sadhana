/**
 * JourneyIconRegistry -- Maps journey IDs to their icon components.
 *
 * Usage:
 *   import { getJourneyIcon } from './icons';
 *   const Icon = getJourneyIcon('beginner');
 *   <Icon size={64} />
 */

'use client';

import type { ComponentType, CSSProperties } from 'react';
import BeginnerIcon from './BeginnerIcon';
import ExplorerIcon from './ExplorerIcon';
import ScholarIcon from './ScholarIcon';
import MasterIcon from './MasterIcon';
import FreeformIcon from './FreeformIcon';

interface IconProps {
  size?: number;
  color?: string;
  variant?: 'outline' | 'filled';
  className?: string;
  style?: CSSProperties;
}

const JOURNEY_ICONS: Record<string, ComponentType<IconProps>> = {
  beginner: BeginnerIcon,
  explorer: ExplorerIcon,
  scholar: ScholarIcon,
  master: MasterIcon,
  freeform: FreeformIcon,
};

/**
 * Get the icon component for a journey by its ID.
 * Returns undefined if no icon exists for the given journey.
 */
export function getJourneyIcon(journeyId: string): ComponentType<IconProps> | undefined {
  return JOURNEY_ICONS[journeyId];
}

interface JourneyIconRegistryProps {
  journeyId: string;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders the appropriate journey icon for a given journey ID.
 * Returns null if no icon is registered for that journey.
 */
export default function JourneyIconRegistry({
  journeyId,
  size = 64,
  color,
  className,
  style,
}: JourneyIconRegistryProps) {
  const Icon = JOURNEY_ICONS[journeyId];
  if (!Icon) return null;
  return <Icon size={size} color={color} className={className} style={style} />;
}
