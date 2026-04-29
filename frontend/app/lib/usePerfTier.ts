'use client';

/**
 * usePerfTier — detects whether the current device is "low-tier" so
 * heavy visual paths can degrade gracefully (audit #10).
 *
 * Low-tier signals (any one is enough):
 *   - navigator.deviceMemory ≤ 2 GB
 *   - navigator.hardwareConcurrency ≤ 4 cores
 *   - User Agent indicates Android <= 10 (a heuristic for old chipsets)
 *   - Save-Data header set (user opted into reduced data)
 *
 * Returns 'low' | 'standard'. Tantri uses this to drop sympathetic-
 * string animation, halve standing-wave segment count, and disable
 * parallax — keeping 60fps achievable on sub-$200 Androids that make
 * up the majority of the addressable Indian market.
 *
 * Default: 'standard' on first render (avoid SSR mismatch). The hook
 * upgrades to 'low' on the client if signals match.
 */

import { useEffect, useState } from 'react';

export type PerfTier = 'low' | 'standard';

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
  connection?: NetworkInformationLike;
}

export function detectPerfTier(): PerfTier {
  if (typeof navigator === 'undefined') return 'standard';
  const nav = navigator as NavigatorWithDeviceMemory;

  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) {
    return 'low';
  }
  if (
    typeof nav.hardwareConcurrency === 'number' &&
    nav.hardwareConcurrency > 0 &&
    nav.hardwareConcurrency <= 4
  ) {
    return 'low';
  }
  if (nav.connection?.saveData === true) return 'low';
  if (nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g') {
    return 'low';
  }
  // Crude UA check: Android 10 or older. Modern phones report Android 11+.
  const ua = nav.userAgent ?? '';
  const m = ua.match(/Android (\d+)/);
  if (m && parseInt(m[1] ?? '99', 10) <= 10) return 'low';

  return 'standard';
}

export function usePerfTier(): PerfTier {
  const [tier, setTier] = useState<PerfTier>('standard');

  useEffect(() => {
    setTier(detectPerfTier());
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.perfTier = detectPerfTier();
    }
  }, []);

  return tier;
}
