/**
 * @module engine/analysis/phrase-recognition
 *
 * Pakad recognition — THE WOW FEATURE.
 *
 * When a student is singing and happens to produce a sequence of swaras
 * that matches a raga's pakad (characteristic phrase), this module detects
 * it and fires a recognition event.
 *
 * "You just sang the pakad of Yaman."
 *
 * This is not just feedback — it is a moment of magic. The student may not
 * have intended to sing a pakad. They may not even know what a pakad is yet.
 * But the engine recognised it, and in that moment, the student understands
 * something deep about raga identity without being told.
 *
 * The recognition algorithm:
 *   1. Maintain a rolling buffer of the last N detected swaras.
 *   2. For each raga in the search set, check each pakad phrase.
 *   3. A pakad matches if the recent swaras contain the pakad as a
 *      subsequence with some tolerance for:
 *      - Repeated swaras (e.g., Ga Ga Ga counts as Ga)
 *      - Brief passing tones (a fast touch of an adjacent swara)
 *   4. Return the best match with a confidence score.
 *
 * Matching is done on swara identity only, ignoring octave. This is a
 * simplification — a future version could consider octave for more
 * precise matching — but for the recognition moment, swara identity
 * is sufficient and far more forgiving for beginners.
 */

import type { Swara, Raga, SwaraNote } from '../theory/types';
import { SWARA_MAP } from '../theory/swaras';
import { RAGA_LIST, RAGAS } from '../theory/ragas';

// ---------------------------------------------------------------------------
// Primed expected phrase — lesson set-up, not lottery
// ---------------------------------------------------------------------------

/**
 * Represents a primed expected phrase: a specific pakad the lesson has
 * asked the engine to watch for within a time window.
 *
 * When primed, pakad recognition fires if the student produces the phrase
 * within `windowMs` milliseconds of the prime call. This turns pakad
 * recognition from a lottery into a pedagogically structured "set-up moment":
 * the lesson silently prepares the engine, then lets the student sing freely.
 * If they naturally return to the phrase within the window, Layer 1 fires.
 */
export interface PrimedPhrase {
  /** The phrase swaras to watch for. */
  readonly phrase: readonly SwaraNote[];
  /** The raga this phrase belongs to (for display). */
  readonly ragaId: string;
  /** Timestamp (ms since epoch) when the prime was set. */
  readonly primedAt: number;
  /** Window in milliseconds from primedAt during which the match can fire. */
  readonly windowMs: number;
  /** Whether the phrase has already been matched (prevents re-firing). */
  matched: boolean;
}

/** Module-level primed phrase state. One phrase primed at a time. */
let _primedPhrase: PrimedPhrase | null = null;

/**
 * Primes the engine to watch for a specific pakad phrase within a time window.
 *
 * Called by lesson phases (e.g., the final free-singing phase of each beginner
 * lesson) to set up the pakad recognition moment. The lesson silently loads the
 * expected phrase; if the student sings it within `windowMs` ms, the match fires.
 *
 * This is not a guarantee — the student must actually sing the phrase. But the
 * lesson context means the student has just been practising exactly these swaras,
 * so a natural return within 45s is likely for students who are engaged.
 *
 * @param phrase  - The pakad phrase to watch for (array of SwaraNote)
 * @param ragaId  - The raga this phrase belongs to
 * @param windowMs - Detection window in ms (default: 45000 — 45 seconds)
 */
export function primeExpectedPhrase(
  phrase: readonly SwaraNote[],
  ragaId: string,
  windowMs: number = 45_000,
): void {
  _primedPhrase = {
    phrase,
    ragaId,
    primedAt: Date.now(),
    windowMs,
    matched: false,
  };
}

/**
 * Clears any currently primed phrase.
 * Call when a phase ends or when the lesson transitions.
 */
export function clearPrimedPhrase(): void {
  _primedPhrase = null;
}

/**
 * Returns the currently primed phrase, or null if none is set.
 */
export function getPrimedPhrase(): PrimedPhrase | null {
  return _primedPhrase;
}

/**
 * Checks whether the recently sung swaras match the primed expected phrase,
 * and the prime is still within its window.
 *
 * If matched, marks the phrase as matched (won't fire again) and returns
 * the PakadMatch. Returns null if no prime is set, the window has expired,
 * the phrase was already matched, or the swaras don't match.
 *
 * @param recentSwaras - Recently sung swaras (newest last)
 * @param minConfidence - Minimum match confidence (default: 0.65)
 */
export function checkPrimedPhrase(
  recentSwaras: readonly Swara[],
  minConfidence: number = 0.65,
): PakadMatch | null {
  if (!_primedPhrase) return null;
  if (_primedPhrase.matched) return null;

  const elapsed = Date.now() - _primedPhrase.primedAt;
  if (elapsed > _primedPhrase.windowMs) {
    // Window expired — clear to avoid stale state
    _primedPhrase = null;
    return null;
  }

  const raga = RAGAS[_primedPhrase.ragaId];
  if (!raga) return null;

  const result = recognizePakad(recentSwaras, [raga], minConfidence);
  if (result) {
    _primedPhrase.matched = true;
    return result;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The result of a successful pakad match.
 */
export interface PakadMatch {
  /** Whether a pakad was matched. */
  readonly matched: boolean;
  /** The raga whose pakad was matched. */
  readonly ragaId: string;
  /** The raga's display name. */
  readonly ragaName: string;
  /** The matched pakad phrase (with octave information). */
  readonly pakadPhrase: readonly SwaraNote[];
  /** Confidence score (0 to 1). Higher = more exact match. */
  readonly confidence: number;
  /** The pakad in sargam notation, for display. */
  readonly sargamNotation: string;
}

// ---------------------------------------------------------------------------
// Pakad recognition
// ---------------------------------------------------------------------------

/**
 * Attempts to recognise a pakad in a sequence of recently sung swaras.
 *
 * Searches all ragas in the provided list (or the full registry if none
 * specified). Returns the best match, or null if no pakad is recognised.
 *
 * @param recentSwaras - The last N detected swaras (newest last).
 *                        Minimum 3 swaras needed for a meaningful match.
 * @param ragas - Optional subset of ragas to search. Defaults to all.
 * @param minConfidence - Minimum confidence threshold (default: 0.7).
 * @returns The best PakadMatch, or null if no match meets the threshold.
 */
export function recognizePakad(
  recentSwaras: readonly Swara[],
  ragas?: readonly Raga[],
  minConfidence: number = 0.7,
): PakadMatch | null {
  if (recentSwaras.length < 3) return null;

  const searchRagas = ragas ?? RAGA_LIST;

  // Collapse consecutive duplicates: [Ga, Ga, Ga, Re, Re, Sa] -> [Ga, Re, Sa]
  const collapsed = collapseRepeats(recentSwaras);

  let bestMatch: PakadMatch | null = null;

  for (const raga of searchRagas) {
    for (const pakadPhrase of raga.pakad) {
      const pakadSwaras = pakadPhrase.map((n) => n.swara);

      // Need at least 3 swaras in the pakad to be meaningful
      if (pakadSwaras.length < 3) continue;

      const confidence = matchPakad(collapsed, pakadSwaras);

      if (confidence >= minConfidence) {
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            matched: true,
            ragaId: raga.id,
            ragaName: raga.name,
            pakadPhrase,
            confidence,
            sargamNotation: pakadToSargam(pakadPhrase),
          };
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Searches for a pakad within a specific raga only.
 * Useful when the student is practicing a known raga and we want to
 * detect its characteristic phrases specifically.
 *
 * @param recentSwaras - Recent swara sequence
 * @param ragaId - The raga to search within
 * @param minConfidence - Minimum confidence (default: 0.7). Tightened from
 *                        the previous 0.6 in the rev-9 audit: single-raga
 *                        recognition is the moment the student earns the
 *                        "you sang the pakad of X" cinematic, and the bar
 *                        for that moment must be high enough that a casual
 *                        scale traversal does not trigger it.
 * @returns PakadMatch or null
 */
export function recognizePakadInRaga(
  recentSwaras: readonly Swara[],
  ragaId: string,
  minConfidence: number = 0.7,
): PakadMatch | null {
  const raga = RAGAS[ragaId];
  if (!raga) return null;

  return recognizePakad(recentSwaras, [raga], minConfidence);
}

// ---------------------------------------------------------------------------
// Matching algorithm
// ---------------------------------------------------------------------------

/**
 * Computes a match confidence between a sung sequence and a target pakad.
 *
 * The algorithm looks for the pakad as a contiguous subsequence within
 * the recent swaras. It allows some tolerance:
 *   - Exact match: confidence = 1.0
 *   - Match with 1 extra passing tone inserted: confidence ~ 0.85
 *   - Match with transposition of adjacent swaras: confidence ~ 0.75
 *
 * We use a sliding window approach: try every position in the recent
 * swaras where the pakad could start, and return the best confidence.
 *
 * @param sung - The collapsed (no repeats) sequence of sung swaras
 * @param target - The pakad swaras to match against
 * @returns Confidence score (0 to 1)
 */
function matchPakad(
  sung: readonly Swara[],
  target: readonly Swara[],
): number {
  if (target.length === 0) return 0;
  if (sung.length < target.length) return 0;

  let bestConfidence = 0;

  // Sliding window: try every possible starting position
  // The window is slightly larger than the target to allow for inserted tones
  const maxExtraLength = Math.ceil(target.length * 0.5);
  const windowSize = target.length + maxExtraLength;

  for (let start = 0; start <= sung.length - target.length; start++) {
    const end = Math.min(start + windowSize, sung.length);
    const window = sung.slice(start, end);

    const confidence = computeSubsequenceMatch(window, target);
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
    }
  }

  return bestConfidence;
}

/**
 * Computes how well a window of sung swaras matches a target pakad,
 * treating the target as a subsequence that should be found within
 * the window.
 *
 * Perfect match (window === target): 1.0
 * Every extra swara in the window reduces confidence slightly.
 *
 * @param window - A slice of the sung sequence
 * @param target - The pakad to find
 * @returns Confidence (0 to 1)
 */
function computeSubsequenceMatch(
  window: readonly Swara[],
  target: readonly Swara[],
): number {
  // Try to find target as a subsequence of window
  let targetIdx = 0;
  let windowIdx = 0;
  let extraSwaras = 0;

  while (targetIdx < target.length && windowIdx < window.length) {
    if (window[windowIdx] === target[targetIdx]) {
      targetIdx++;
      windowIdx++;
    } else {
      // This swara in the window is not part of the pakad
      extraSwaras++;
      windowIdx++;
    }
  }

  // Did we match all target swaras?
  if (targetIdx < target.length) {
    // Incomplete match — check how much we matched
    const matchedFraction = targetIdx / target.length;
    // Only return a score if we matched at least 70% of the target
    return matchedFraction >= 0.7 ? matchedFraction * 0.6 : 0;
  }

  // Full subsequence match achieved. Score based on how clean it was.
  // No extra swaras = 1.0. Extra swaras reduce confidence.
  const extraPenalty = extraSwaras / target.length;
  const confidence = Math.max(0, 1 - extraPenalty * 0.3);

  return confidence;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Collapses consecutive repeated swaras into single instances.
 * [Ga, Ga, Re, Re, Re, Sa] => [Ga, Re, Sa]
 *
 * This is essential because a student may sustain a swara for multiple
 * detection frames, producing repeated entries. We want to match the
 * melodic contour, not the duration pattern.
 */
function collapseRepeats(swaras: readonly Swara[]): Swara[] {
  if (swaras.length === 0) return [];

  const result: Swara[] = [swaras[0]!];
  for (let i = 1; i < swaras.length; i++) {
    if (swaras[i] !== swaras[i - 1]) {
      result.push(swaras[i]!);
    }
  }
  return result;
}

/**
 * Converts a pakad phrase (SwaraNote[]) to sargam notation string.
 *
 * Uses the sargam abbreviation from each swara definition, with octave
 * indicators:
 *   - mandra: dot below (we use a period prefix: .S, .R)
 *   - madhya: no mark (S, R, G)
 *   - taar: apostrophe suffix (S', R', G')
 *
 * @param phrase - The pakad phrase
 * @returns Human-readable sargam notation
 */
export function pakadToSargam(phrase: readonly SwaraNote[]): string {
  return phrase
    .map((note) => {
      const def = SWARA_MAP[note.swara];
      const abbr = def.sargamAbbr;

      switch (note.octave) {
        case 'mandra':
          return `.${abbr}`;
        case 'taar':
          return `${abbr}'`;
        default:
          return abbr;
      }
    })
    .join(' ');
}
