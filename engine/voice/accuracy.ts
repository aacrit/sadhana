/**
 * @module engine/voice/accuracy
 *
 * Session and phrase accuracy scoring.
 *
 * This module takes a sequence of VoiceEvents from a practice session
 * and produces a comprehensive accuracy score. The score is not just
 * "were you on pitch?" — it evaluates:
 *
 *   1. Pitch accuracy — how close to the correct swara frequencies?
 *   2. Raga compliance — were correct swaras used, forbidden ones avoided?
 *   3. Pakad recognition — did the student produce recognisable phrases?
 *   4. Session statistics — duration, note count, consistency
 *
 * The scoring system is calibrated to be encouraging at lower levels
 * (Shishya gets generous tolerance) and demanding at higher levels
 * (Guru requires near-perfect intonation and raga awareness).
 */

import type { Swara, Raga, SwaraNote } from '../theory/types';
import type { VoiceEvent } from './pipeline';
import type { Level, PitchResult } from '../analysis/pitch-mapping';
import { getAccuracyScore, LEVEL_TOLERANCE, isValidInRaga } from '../analysis/pitch-mapping';
import { validatePhrase } from '../analysis/raga-grammar';
import { SWARA_MAP } from '../theory/swaras';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Statistics for a practice session.
 */
export interface SessionStats {
  /** Total duration of the session in seconds. */
  readonly durationSeconds: number;
  /** Total number of pitch events (frames where a pitch was detected). */
  readonly totalPitchEvents: number;
  /** Number of events classified as silence. */
  readonly silenceEvents: number;
  /** Number of events classified as noise (no clear pitch). */
  readonly noiseEvents: number;
  /** Distinct swaras used in the session. */
  readonly distinctSwaras: readonly Swara[];
  /** Most frequently sung swara (the student's "gravitational centre"). */
  readonly dominantSwara: Swara;
  /** Average clarity of pitch detections. */
  readonly averageClarity: number;
  /** Percentage of time spent singing (vs. silence/noise). */
  readonly singingPercentage: number;
}

/**
 * The comprehensive accuracy score for a practice session.
 */
export interface AccuracyScore {
  /** Overall score (0 to 1). Weighted combination of all sub-scores. */
  readonly overall: number;
  /** Pitch accuracy sub-score (0 to 1). How close to correct frequencies? */
  readonly pitchAccuracy: number;
  /** Raga compliance sub-score (0 to 1). Were correct swaras used? */
  readonly ragaCompliance: number;
  /** Number of pakad phrases recognised during the session. */
  readonly pakadsFound: number;
  /** Session statistics. */
  readonly sessionStats: SessionStats;
}

// ---------------------------------------------------------------------------
// Session scoring
// ---------------------------------------------------------------------------

/**
 * Scores a complete practice session.
 *
 * Takes all VoiceEvents from the session and produces a comprehensive
 * AccuracyScore. This is called when the student ends a practice session.
 *
 * @param events - All VoiceEvents from the session
 * @param raga - The raga being practiced
 * @param level - The student's current level
 * @param pakadsFound - Number of pakad detections during the session
 * @returns A comprehensive AccuracyScore
 */
export function scoreSession(
  events: readonly VoiceEvent[],
  raga: Raga,
  level: Level,
  pakadsFound: number = 0,
): AccuracyScore {
  if (events.length === 0) {
    return {
      overall: 0,
      pitchAccuracy: 0,
      ragaCompliance: 0,
      pakadsFound,
      sessionStats: emptyStats(),
    };
  }

  // Separate pitch events from silence/noise
  const pitchEvents = events.filter((e) => e.type === 'pitch' && e.hz != null);
  const silenceEvents = events.filter((e) => e.type === 'silence');
  const noiseEvents = events.filter((e) => e.type === 'noise');

  // Compute session statistics
  const sessionStats = computeSessionStats(
    events,
    pitchEvents,
    silenceEvents.length,
    noiseEvents.length,
  );

  // Pitch accuracy: average accuracy across all pitch events
  const pitchAccuracy = computePitchAccuracy(pitchEvents, level);

  // Raga compliance: check which swaras were used
  const ragaCompliance = computeRagaCompliance(pitchEvents, raga);

  // Overall score: weighted combination
  // Pitch accuracy is most important, then raga compliance, then pakads
  const pakadBonus = Math.min(pakadsFound * 0.05, 0.15); // Up to 15% bonus
  const overall = Math.min(
    1,
    pitchAccuracy * 0.55 + ragaCompliance * 0.35 + pakadBonus + 0.10 * sessionStats.singingPercentage,
  );

  return {
    overall,
    pitchAccuracy,
    ragaCompliance,
    pakadsFound,
    sessionStats,
  };
}

/**
 * Scores a single phrase against a target phrase.
 *
 * Used for exercises where the student must reproduce a specific sequence
 * of swaras. Compares the detected swaras to the expected swaras in order.
 *
 * @param events - VoiceEvents from the phrase attempt
 * @param targetPhrase - The expected SwaraNote sequence
 * @param saHz - Sa frequency for reference
 * @param level - Student level for tolerance
 * @returns Score from 0 to 1
 */
export function scorePhrase(
  events: readonly VoiceEvent[],
  targetPhrase: readonly SwaraNote[],
  saHz: number,
  level: Level = 'shishya',
): number {
  if (targetPhrase.length === 0 || events.length === 0) return 0;

  // Extract the swara sequence from events (collapse repeats)
  const detectedSwaras = extractSwaraSequence(events);

  if (detectedSwaras.length === 0) return 0;

  const targetSwaras = targetPhrase.map((n) => n.swara);

  // Score has two components:
  // 1. Sequence accuracy — did they sing the right swaras in order?
  // 2. Pitch accuracy — how well-tuned were the detected pitches?

  const sequenceScore = computeSequenceMatch(detectedSwaras, targetSwaras);
  const pitchScore = computePitchAccuracy(
    events.filter((e) => e.type === 'pitch'),
    level,
  );

  // Weighted: sequence matters more than exact tuning for phrase exercises
  return sequenceScore * 0.6 + pitchScore * 0.4;
}

// ---------------------------------------------------------------------------
// Internal scoring functions
// ---------------------------------------------------------------------------

/**
 * Computes pitch accuracy as the average accuracy score across all
 * pitch events.
 */
function computePitchAccuracy(
  pitchEvents: readonly VoiceEvent[],
  level: Level,
): number {
  if (pitchEvents.length === 0) return 0;

  let totalAccuracy = 0;

  for (const event of pitchEvents) {
    if (event.accuracy != null) {
      totalAccuracy += event.accuracy;
    } else if (event.deviationCents != null) {
      totalAccuracy += getAccuracyScore(event.deviationCents, level);
    }
  }

  return totalAccuracy / pitchEvents.length;
}

/**
 * Computes raga compliance: what fraction of detected swaras are valid
 * in the current raga?
 */
function computeRagaCompliance(
  pitchEvents: readonly VoiceEvent[],
  raga: Raga,
): number {
  if (pitchEvents.length === 0) return 0;

  let validCount = 0;

  for (const event of pitchEvents) {
    if (event.swara && isValidInRaga(event.swara, raga)) {
      validCount++;
    }
  }

  return validCount / pitchEvents.length;
}

/**
 * Computes how well a detected swara sequence matches a target sequence.
 * Uses Longest Common Subsequence (LCS) for tolerance of extra/missing notes.
 *
 * @returns Score from 0 to 1
 */
function computeSequenceMatch(
  detected: readonly Swara[],
  target: readonly Swara[],
): number {
  if (target.length === 0) return 0;

  const lcsLength = longestCommonSubsequence(detected, target);

  // Score based on how much of the target was matched
  return lcsLength / target.length;
}

/**
 * LCS (Longest Common Subsequence) length.
 * Standard dynamic programming approach.
 */
function longestCommonSubsequence(a: readonly Swara[], b: readonly Swara[]): number {
  const m = a.length;
  const n = b.length;

  // Use 1D DP for space efficiency
  const prev = new Array<number>(n + 1).fill(0);
  const curr = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = (prev[j - 1] ?? 0) + 1;
      } else {
        curr[j] = Math.max(prev[j] ?? 0, curr[j - 1] ?? 0);
      }
    }
    // Copy curr to prev
    for (let j = 0; j <= n; j++) {
      prev[j] = curr[j] ?? 0;
    }
  }

  return curr[n] ?? 0;
}

/**
 * Extracts a swara sequence from VoiceEvents, collapsing consecutive
 * repetitions of the same swara into single entries.
 */
function extractSwaraSequence(events: readonly VoiceEvent[]): Swara[] {
  const result: Swara[] = [];

  for (const event of events) {
    if (event.type === 'pitch' && event.swara) {
      if (result.length === 0 || result[result.length - 1] !== event.swara) {
        result.push(event.swara);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Session statistics
// ---------------------------------------------------------------------------

function computeSessionStats(
  allEvents: readonly VoiceEvent[],
  pitchEvents: readonly VoiceEvent[],
  silenceCount: number,
  noiseCount: number,
): SessionStats {
  if (allEvents.length === 0) return emptyStats();

  // Duration: from first to last event timestamp
  const firstTime = allEvents[0]!.timestamp;
  const lastTime = allEvents[allEvents.length - 1]!.timestamp;
  const durationSeconds = Math.max(0, lastTime - firstTime);

  // Distinct swaras
  const swaraSet = new Set<Swara>();
  for (const event of pitchEvents) {
    if (event.swara) swaraSet.add(event.swara);
  }
  const distinctSwaras = Array.from(swaraSet);

  // Dominant swara
  const swaraCounts = new Map<Swara, number>();
  for (const event of pitchEvents) {
    if (event.swara) {
      swaraCounts.set(event.swara, (swaraCounts.get(event.swara) ?? 0) + 1);
    }
  }
  let dominantSwara: Swara = 'Sa';
  let maxCount = 0;
  for (const [swara, count] of swaraCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominantSwara = swara;
    }
  }

  // Average clarity
  let totalClarity = 0;
  let clarityCount = 0;
  for (const event of pitchEvents) {
    if (event.clarity != null) {
      totalClarity += event.clarity;
      clarityCount++;
    }
  }
  const averageClarity = clarityCount > 0 ? totalClarity / clarityCount : 0;

  // Singing percentage
  const singingPercentage =
    allEvents.length > 0 ? pitchEvents.length / allEvents.length : 0;

  return {
    durationSeconds,
    totalPitchEvents: pitchEvents.length,
    silenceEvents: silenceCount,
    noiseEvents: noiseCount,
    distinctSwaras,
    dominantSwara,
    averageClarity,
    singingPercentage,
  };
}

function emptyStats(): SessionStats {
  return {
    durationSeconds: 0,
    totalPitchEvents: 0,
    silenceEvents: 0,
    noiseEvents: 0,
    distinctSwaras: [],
    dominantSwara: 'Sa',
    averageClarity: 0,
    singingPercentage: 0,
  };
}
