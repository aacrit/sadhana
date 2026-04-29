/**
 * @module engine/analysis/modulation
 *
 * Detects the moment a sung phrase modulates from one raga to another by
 * locating the first occurrence of a "transition swara" — a swara that is
 * present in raga B but absent (or different) in raga A.
 *
 * Used by Guru-04 (yaman → yaman_kalyan) and similar lessons. The analyzer
 * is pure: given a pitch history (timestamp + Hz pairs), the Sa frequency,
 * and the configured `transition_swara`, it returns the first timestamp at
 * which the pitch matches the transition swara within `tolerance_cents`.
 *
 * No DOM dependencies. Runs in any JS environment.
 */

import { getSwaraFrequency } from '../theory/swaras';
import type { Swara } from '../theory/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ModulationConfig {
  readonly transitionSwara: Swara;
  readonly saHz: number;
  readonly toleranceCents?: number;
  /** Minimum duration (ms) the student must stay on the transition swara
   *  for it to count as a real modulation rather than a passing touch. */
  readonly minDurationMs?: number;
}

export interface ModulationResult {
  /** Timestamp of the modulation in ms (relative to history[0].t), or null
   *  if no modulation was detected. */
  readonly transitionAt: number | null;
  /** Number of consecutive samples on the transition swara at the moment
   *  of detection. */
  readonly samples: number;
  /** Cents deviation from perfect at the moment of detection (signed). */
  readonly arrivalCents: number;
}

const DEFAULT_TOLERANCE = 30;
const DEFAULT_MIN_DURATION_MS = 250;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect the first occurrence of the transition swara in a pitch history.
 *
 * @param history — array of [timestamp_ms, hz] pairs in ascending time order.
 * @param config  — transition swara + Sa + thresholds.
 */
export function detectModulation(
  history: readonly (readonly [number, number])[],
  config: ModulationConfig,
): ModulationResult {
  if (history.length === 0) {
    return { transitionAt: null, samples: 0, arrivalCents: 0 };
  }
  const tolerance = config.toleranceCents ?? DEFAULT_TOLERANCE;
  const minDurationMs = config.minDurationMs ?? DEFAULT_MIN_DURATION_MS;

  let targetHz: number;
  try {
    targetHz = getSwaraFrequency(config.transitionSwara, config.saHz);
  } catch {
    return { transitionAt: null, samples: 0, arrivalCents: 0 };
  }

  // Walk the history. Track consecutive on-target samples; when the run
  // exceeds minDurationMs, declare the modulation at the start of that run.
  let runStartT: number | null = null;
  let runStartIdx = -1;
  let runSamples = 0;
  let lastCents = 0;

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    if (!entry) continue;
    const [t, hz] = entry;
    if (!Number.isFinite(t) || !Number.isFinite(hz) || hz <= 0) {
      runStartT = null;
      runSamples = 0;
      continue;
    }
    const cents = 1200 * Math.log2(hz / targetHz);
    if (Math.abs(cents) <= tolerance) {
      if (runStartT === null) {
        runStartT = t;
        runStartIdx = i;
      }
      runSamples++;
      lastCents = cents;
      if (t - runStartT >= minDurationMs) {
        return { transitionAt: runStartT, samples: runSamples, arrivalCents: cents };
      }
    } else {
      runStartT = null;
      runSamples = 0;
    }
    void runStartIdx;
  }

  return { transitionAt: null, samples: 0, arrivalCents: lastCents };
}
