/**
 * @module engine/analysis/raga-grammar
 *
 * Validates a sequence of sung swaras against a raga's melodic grammar.
 *
 * A raga is not just a scale. It has rules:
 *   - Certain swaras are forbidden (varjit)
 *   - The ascending pattern (aroha) and descending pattern (avaroha) may differ
 *   - The vadi (king note) should receive emphasis
 *   - Certain phrases (pakad) are expected
 *   - Certain transitions may be prohibited even if both swaras are present
 *
 * This module encodes these rules and validates student input against them,
 * producing a GrammarResult that scores the phrase and lists any violations.
 *
 * The grammar checker is called by the voice pipeline to provide real-time
 * feedback on melodic correctness, and by the accuracy scorer to evaluate
 * complete practice sessions.
 */

import type { Swara, Raga, SwaraNote } from '../theory/types';
import { getRagaSwaras } from '../theory/ragas';
import { SWARA_MAP } from '../theory/swaras';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A violation of raga grammar rules.
 */
export interface GrammarViolation {
  /** The type of violation. */
  readonly type:
    | 'forbidden_swara'
    | 'aroha_violated'
    | 'avaroha_violated'
    | 'vadi_ignored';
  /** The swara that caused the violation (or is missing). */
  readonly swara: Swara;
  /** Human-readable message explaining the violation. */
  readonly message: string;
  /** Index in the input sequence where the violation was detected. */
  readonly index: number;
}

/**
 * The result of validating a phrase against raga grammar.
 */
export interface GrammarResult {
  /** Whether the phrase is grammatically valid (no violations). */
  readonly valid: boolean;
  /** All detected violations. */
  readonly violations: readonly GrammarViolation[];
  /** Overall grammar score (0 to 1). 1 = perfect. */
  readonly score: number;
}

// ---------------------------------------------------------------------------
// Core validation
// ---------------------------------------------------------------------------

/**
 * Validates a sequence of swaras against a raga's grammatical rules.
 *
 * Checks performed:
 * 1. Forbidden swara check — are any varjit swaras used?
 * 2. Ascending movement check — when pitch rises, does it follow aroha?
 * 3. Descending movement check — when pitch falls, does it follow avaroha?
 * 4. Vadi emphasis check — is the vadi note present in longer phrases?
 *
 * @param swaras - The sequence of swaras sung by the student
 * @param raga - The raga to validate against
 * @returns A GrammarResult with validity, violations, and score
 */
export function validatePhrase(swaras: readonly Swara[], raga: Raga): GrammarResult {
  if (swaras.length === 0) {
    return { valid: true, violations: [], score: 1 };
  }

  const violations: GrammarViolation[] = [];

  // Check 1: Forbidden swaras
  violations.push(...checkForbiddenSwaras(swaras, raga));

  // Check 2 & 3: Aroha and avaroha movement
  violations.push(...checkMovement(swaras, raga));

  // Check 4: Vadi emphasis (only for phrases of 8+ swaras)
  if (swaras.length >= 8) {
    violations.push(...checkVadiEmphasis(swaras, raga));
  }

  // Compute score: start at 1, deduct for violations
  const score = computeScore(violations, swaras.length);

  return {
    valid: violations.length === 0,
    violations,
    score,
  };
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

/**
 * Checks for forbidden swaras (varjit) in the sequence.
 *
 * @param swaras - The sung swara sequence
 * @param raga - The raga to check against
 * @returns Array of forbidden swara violations
 */
export function checkForbiddenSwaras(
  swaras: readonly Swara[],
  raga: Raga,
): GrammarViolation[] {
  const violations: GrammarViolation[] = [];

  for (let i = 0; i < swaras.length; i++) {
    const swara = swaras[i]!;
    if (raga.varjit.includes(swara)) {
      const def = SWARA_MAP[swara];
      violations.push({
        type: 'forbidden_swara',
        swara,
        message: `${def.name} (${def.sargamAbbr}) is forbidden in ${raga.name}`,
        index: i,
      });
    }
  }

  return violations;
}

/**
 * Checks ascending and descending movement against aroha/avaroha rules.
 *
 * When a raga defines vakra (oblique) movement patterns, those specific
 * sequences are allowed even when they would otherwise violate strict
 * aroha/avaroha ordering. For example, Bhimpalasi's Ma-Ga(k)-Ma-Pa is
 * a valid vakra descent-then-ascent that the aroha check alone would reject.
 *
 * A transition from swara A to swara B is "allowed" if both A and B
 * appear in the aroha (for ascending) or avaroha (for descending) and
 * they appear in the correct order, OR if the transition is part of a
 * defined vakra pattern.
 */
function checkMovement(
  swaras: readonly Swara[],
  raga: Raga,
): GrammarViolation[] {
  const violations: GrammarViolation[] = [];

  const arohaSwaras = raga.aroha.map((n) => n.swara);
  const avarohaSwaras = raga.avaroha.map((n) => n.swara);

  // Pre-compute vakra swara sequences for fast subsequence matching
  const vakraSequences: readonly Swara[][] = (raga.vakra ?? []).map(
    (pattern) => pattern.map((note) => note.swara),
  );

  for (let i = 1; i < swaras.length; i++) {
    const prev = swaras[i - 1]!;
    const curr = swaras[i]!;

    // Skip if same swara (repetition is always allowed)
    if (prev === curr) continue;

    // Check if this transition is part of a vakra pattern
    if (isPartOfVakra(swaras, i, vakraSequences)) continue;

    // Determine direction by comparing cents positions
    const prevCents = getCentsForSwara(prev);
    const currCents = getCentsForSwara(curr);

    if (prevCents === undefined || currCents === undefined) continue;

    const ascending = currCents > prevCents;

    if (ascending) {
      // Check if this ascending transition exists in the aroha
      if (!isTransitionAllowed(prev, curr, arohaSwaras)) {
        if (!arohaSwaras.includes(curr) && !raga.varjit.includes(curr)) {
          const def = SWARA_MAP[curr];
          violations.push({
            type: 'aroha_violated',
            swara: curr,
            message: `${def.name} (${def.sargamAbbr}) is not in the ascending pattern of ${raga.name}`,
            index: i,
          });
        }
      }
    } else {
      // Check if this descending transition exists in the avaroha
      if (!isTransitionAllowed(prev, curr, avarohaSwaras)) {
        if (!avarohaSwaras.includes(curr) && !raga.varjit.includes(curr)) {
          const def = SWARA_MAP[curr];
          violations.push({
            type: 'avaroha_violated',
            swara: curr,
            message: `${def.name} (${def.sargamAbbr}) is not in the descending pattern of ${raga.name}`,
            index: i,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Checks if the transition at position `index` in the swara sequence
 * is part of a defined vakra pattern for this raga.
 *
 * We look for any vakra pattern whose swara sequence appears as a
 * subsequence starting at or before the current position.
 */
function isPartOfVakra(
  swaras: readonly Swara[],
  index: number,
  vakraSequences: readonly (readonly Swara[])[],
): boolean {
  for (const pattern of vakraSequences) {
    if (pattern.length < 2) continue;

    // Try matching the pattern starting at each position that could
    // include the current index
    for (let start = Math.max(0, index - pattern.length + 1); start <= index; start++) {
      if (start + pattern.length > swaras.length) continue;

      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (swaras[start + j] !== pattern[j]) {
          match = false;
          break;
        }
      }

      if (match) return true;
    }
  }

  return false;
}

/**
 * Checks whether the vadi (most important swara) appears in a long phrase.
 *
 * In a phrase of 8+ swaras, if the vadi is never used, this is a soft
 * violation — the student is not emphasising the raga's tonal centre.
 */
function checkVadiEmphasis(
  swaras: readonly Swara[],
  raga: Raga,
): GrammarViolation[] {
  const vadiCount = swaras.filter((s) => s === raga.vadi).length;

  if (vadiCount === 0) {
    const def = SWARA_MAP[raga.vadi];
    return [
      {
        type: 'vadi_ignored',
        swara: raga.vadi,
        message: `The vadi ${def.name} (${def.sargamAbbr}) was not used. In ${raga.name}, ${def.sargamAbbr} should receive emphasis.`,
        index: -1,
      },
    ];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Gets the cents-from-Sa position for a swara, for comparison purposes.
 */
function getCentsForSwara(swara: Swara): number | undefined {
  const def = SWARA_MAP[swara];
  return def?.centsFromSa;
}

/**
 * Checks if a transition from swaraA to swaraB exists in a given
 * scale sequence (aroha or avaroha).
 *
 * The transition is "allowed" if both swaras appear in the sequence
 * and swaraA comes before swaraB (for aroha) or after (for avaroha).
 * We also allow transitions where one swara is Sa (the tonic is always
 * a valid starting/ending point).
 */
function isTransitionAllowed(
  from: Swara,
  to: Swara,
  scaleSequence: readonly Swara[],
): boolean {
  // Sa transitions are always allowed
  if (from === 'Sa' || to === 'Sa') return true;

  const fromIndex = scaleSequence.indexOf(from);
  const toIndex = scaleSequence.indexOf(to);

  // If either swara is not in this scale direction, the transition
  // is potentially invalid (but not necessarily — vakra ragas can
  // have swaras in one direction that are absent in the other)
  if (fromIndex === -1 || toIndex === -1) return false;

  // The 'from' should come before 'to' in the sequence
  return fromIndex < toIndex;
}

/**
 * Computes an overall grammar score from violations.
 *
 * Scoring:
 *   - forbidden_swara: -0.25 per occurrence (serious violation)
 *   - aroha_violated / avaroha_violated: -0.10 per occurrence
 *   - vadi_ignored: -0.15 (one-time penalty)
 *
 * Score is clamped to [0, 1].
 */
function computeScore(violations: readonly GrammarViolation[], phraseLength: number): number {
  if (violations.length === 0) return 1;

  let penalty = 0;

  for (const v of violations) {
    switch (v.type) {
      case 'forbidden_swara':
        penalty += 0.25;
        break;
      case 'aroha_violated':
      case 'avaroha_violated':
        penalty += 0.10;
        break;
      case 'vadi_ignored':
        penalty += 0.15;
        break;
    }
  }

  // Scale penalty by phrase length — a single mistake in a long phrase
  // is less serious than in a short one
  const scaleFactor = Math.max(1, phraseLength / 4);
  const scaledPenalty = penalty / scaleFactor;

  return Math.max(0, Math.min(1, 1 - scaledPenalty));
}
