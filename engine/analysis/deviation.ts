/**
 * @module engine/analysis/deviation
 *
 * Controlled-deviation analyzer (T2.2 of the enhancement plan).
 *
 * In Hindustani vocal tradition certain ragas allow a forbidden swara to
 * appear briefly as a passing or fleeting tone, without "leaving" the raga.
 * Bhairavi's flexibility is the canonical case: a sung tivra Ma may touch
 * the phrase for ≤ 300ms before resolving back to shuddha Ma. Hold tivra
 * Ma longer and you've left Bhairavi.
 *
 * This analyzer takes a pitch history, an allowed-deviation specification,
 * and returns a verdict on whether each occurrence of the deviation swara
 * was sung within its role:
 *   - 'fleeting' — touched for ≤ max_duration_ms; passes
 *   - 'passing'  — touched for ≤ max_duration_ms; passes
 *   - 'held'     — sustained beyond the threshold; fails
 *
 * Output includes per-occurrence verdicts plus a summary score.
 */

import { getSwaraFrequency } from '../theory/swaras';
import type { Swara } from '../theory/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type DeviationRole = 'passing' | 'fleeting' | 'held';

export interface AllowedDeviation {
  readonly swara: Swara;
  readonly role: DeviationRole;
  readonly maxDurationMs: number;
}

export interface DeviationConfig {
  readonly saHz: number;
  readonly allowed: readonly AllowedDeviation[];
  readonly toleranceCents?: number;
}

export interface DeviationOccurrence {
  readonly swara: Swara;
  readonly startT: number;
  readonly endT: number;
  readonly durationMs: number;
  /** Verdict: did this occurrence stay within its allowed role? */
  readonly verdict: 'pass' | 'fail';
  /** Reason text — diagnostic for the UI. */
  readonly reason: string;
}

export interface DeviationResult {
  readonly occurrences: readonly DeviationOccurrence[];
  /** Fraction of occurrences that pass. 1.0 if no occurrences. */
  readonly score: number;
  readonly passes: number;
  readonly fails: number;
}

const DEFAULT_TOLERANCE = 25;
const MIN_OCCURRENCE_MS = 50;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a pitch history for occurrences of allowed deviation swaras and
 * verdict each one against its role.
 */
export function analyzeDeviation(
  history: readonly (readonly [number, number])[],
  config: DeviationConfig,
): DeviationResult {
  if (history.length === 0) {
    return { occurrences: [], score: 1, passes: 0, fails: 0 };
  }
  const tolerance = config.toleranceCents ?? DEFAULT_TOLERANCE;

  // Pre-compute target Hz for each allowed deviation.
  const targets = config.allowed.map((d) => {
    try {
      return { ...d, hz: getSwaraFrequency(d.swara, config.saHz) };
    } catch {
      return { ...d, hz: 0 };
    }
  });

  const occurrences: DeviationOccurrence[] = [];

  // Track current run of "on a deviation swara"
  let activeIdx: number | null = null;
  let runStartT = 0;
  let runEndT = 0;

  const closeRun = () => {
    if (activeIdx === null) return;
    const t = targets[activeIdx];
    if (!t) {
      activeIdx = null;
      return;
    }
    const durationMs = runEndT - runStartT;
    if (durationMs >= MIN_OCCURRENCE_MS) {
      const passed = durationMs <= t.maxDurationMs;
      occurrences.push({
        swara: t.swara,
        startT: runStartT,
        endT: runEndT,
        durationMs,
        verdict: passed ? 'pass' : 'fail',
        reason: passed
          ? `${t.role} touch — ${Math.round(durationMs)}ms ≤ ${t.maxDurationMs}ms allowed`
          : `held ${Math.round(durationMs)}ms — ${t.role} role allows ≤ ${t.maxDurationMs}ms`,
      });
    }
    activeIdx = null;
  };

  for (const entry of history) {
    if (!entry) continue;
    const [t, hz] = entry;
    if (!Number.isFinite(t) || !Number.isFinite(hz) || hz <= 0) {
      closeRun();
      continue;
    }

    // Find a matching deviation target within tolerance
    let matchIdx: number | null = null;
    let bestCents = Infinity;
    for (let i = 0; i < targets.length; i++) {
      const tg = targets[i];
      if (!tg || tg.hz <= 0) continue;
      const cents = Math.abs(1200 * Math.log2(hz / tg.hz));
      if (cents <= tolerance && cents < bestCents) {
        matchIdx = i;
        bestCents = cents;
      }
    }

    if (matchIdx !== null) {
      if (activeIdx === matchIdx) {
        runEndT = t;
      } else {
        closeRun();
        activeIdx = matchIdx;
        runStartT = t;
        runEndT = t;
      }
    } else {
      closeRun();
    }
  }
  closeRun();

  const passes = occurrences.filter((o) => o.verdict === 'pass').length;
  const fails = occurrences.length - passes;
  const score = occurrences.length === 0 ? 1 : passes / occurrences.length;

  return { occurrences, score, passes, fails };
}
