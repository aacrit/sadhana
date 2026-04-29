/**
 * @module engine/analysis/pitch-mapping
 *
 * Maps a detected pitch (Hz) to the nearest swara in just intonation,
 * accounting for raga context, shruti variants, and student level.
 *
 * This is the bridge between the voice pipeline (which produces raw Hz)
 * and the musical world (which speaks in swaras, shrutis, and cents).
 *
 * The mapping process:
 *   1. Compute cents from Sa:  1200 * log2(hz / sa_hz)
 *   2. Normalise to one octave: cents mod 1200
 *   3. Find nearest principal swara (from swaras.ts)
 *   4. Find nearest shruti (from just-intonation.ts) for finer resolution
 *   5. Check raga validity — is this swara in the current raga?
 *   6. Score accuracy based on student level tolerance
 *
 * The result is a PitchResult: everything the UI needs to give feedback.
 */

import type { Swara, Raga, SwaraNote, Ornament } from '../theory/types';
import { SWARAS, SWARA_MAP, getSwaraBySymbol } from '../theory/swaras';
import { SHRUTIS, nearestShruti, nearestSwara as nearestPrincipalSwara } from '../physics/just-intonation';
import type { Shruti, SwaraName, PrincipalSwara } from '../physics/just-intonation';
import { ratioToCents } from '../physics/harmonics';
import { getRagaById, getRagaSwaras } from '../theory/ragas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Student level, determining pitch accuracy tolerance.
 *
 * Shishya (beginner): +/-35 cents — forgiving but still musical
 * Sadhaka (practitioner): +/-20 cents — moderate
 * Varistha (advanced): +/-12 cents — tight
 * Guru (master): +/-8 cents — near-perfect intonation required
 *
 * Acoustics-engineer audit: the legacy tolerance of 50 cents at shishya was
 * a quarter-tone — admitting non-musical pitch as "correct." The tightened
 * thresholds keep the beginner experience kind (35c is still ~1/3 of a
 * semitone) while requiring the student's pitch to actually live near the
 * target swara.
 */
export type Level = 'shishya' | 'sadhaka' | 'varistha' | 'guru';

/**
 * Tolerance in cents for each level.
 */
export const LEVEL_TOLERANCE: Readonly<Record<Level, number>> = {
  shishya: 35,
  sadhaka: 20,
  varistha: 12,
  guru: 8,
};

/**
 * The complete result of mapping a detected pitch to the musical domain.
 * This is what flows from the voice pipeline to the UI.
 */
export interface PitchResult {
  /** The detected frequency in Hz. */
  readonly hz: number;
  /** Cents above Sa (normalised to 0-1200, accounting for octave). */
  readonly centsFromSa: number;
  /** The nearest principal swara (12-swara system). */
  readonly nearestSwara: Swara;
  /** The nearest shruti (22-shruti system) for finer microtonal context. */
  readonly nearestShruti: Shruti;
  /** Deviation from the nearest swara in cents. + = sharp, - = flat. */
  readonly deviationCents: number;
  /** Pitch detection clarity (0-1), passed through from the detector. */
  readonly clarity: number;
  /** Is this swara valid in the current raga? (true if no raga specified) */
  readonly inRagaContext: boolean;
  /** If the raga context expects an ornament on this swara, its name. */
  readonly expectedOrnament?: Ornament;
  /** Accuracy score (0-1) for the current level tolerance. */
  readonly accuracy: number;
}

// ---------------------------------------------------------------------------
// Swara name bridging
// ---------------------------------------------------------------------------

/**
 * Map from engine Swara symbols (Re_k) to just-intonation SwaraName (Re_komal).
 * The two naming schemes diverge for historical reasons; this bridge is needed.
 */
const SWARA_TO_SWARANAME: Readonly<Record<Swara, SwaraName>> = {
  Sa: 'Sa',
  Re_k: 'Re_komal',
  Re: 'Re',
  Ga_k: 'Ga_komal',
  Ga: 'Ga',
  Ma: 'Ma',
  Ma_t: 'Ma_tivra',
  Pa: 'Pa',
  Dha_k: 'Dha_komal',
  Dha: 'Dha',
  Ni_k: 'Ni_komal',
  Ni: 'Ni',
};

const SWARANAME_TO_SWARA: Readonly<Record<SwaraName, Swara>> = {
  Sa: 'Sa',
  Re_komal: 'Re_k',
  Re: 'Re',
  Ga_komal: 'Ga_k',
  Ga: 'Ga',
  Ma: 'Ma',
  Ma_tivra: 'Ma_t',
  Pa: 'Pa',
  Dha_komal: 'Dha_k',
  Dha: 'Dha',
  Ni_komal: 'Ni_k',
  Ni: 'Ni',
};

/**
 * Convert an engine Swara to a just-intonation SwaraName.
 */
export function swaraToSwaraName(swara: Swara): SwaraName {
  return SWARA_TO_SWARANAME[swara];
}

/**
 * Convert a just-intonation SwaraName to an engine Swara.
 */
export function swaraNameToSwara(name: SwaraName): Swara {
  return SWARANAME_TO_SWARA[name];
}

// ---------------------------------------------------------------------------
// Core mapping
// ---------------------------------------------------------------------------

/**
 * Maps a detected pitch in Hz to a complete PitchResult.
 *
 * This is the primary function called by the voice pipeline on every
 * pitch detection frame. It must be fast (< 0.5ms on mid-range hardware).
 *
 * @param hz - Detected frequency in Hz (must be > 0)
 * @param saHz - The student's chosen Sa frequency in Hz
 * @param clarity - Pitch detection clarity (0-1) from the detector
 * @param ragaId - Optional raga ID for context-aware mapping
 * @param level - Student level for accuracy scoring (default: shishya)
 * @returns A complete PitchResult
 */
export function mapPitchToSwara(
  hz: number,
  saHz: number,
  clarity: number = 1,
  ragaId?: string,
  level: Level = 'shishya',
): PitchResult {
  if (!Number.isFinite(hz) || !Number.isFinite(saHz) || hz <= 0 || saHz <= 0) {
    throw new RangeError('Frequencies must be finite positive numbers');
  }

  // Step 1: Compute raw cents from Sa
  const rawCents = ratioToCents(hz / saHz);

  // Step 2: Normalise to [0, 1200) — one octave
  let centsFromSa = rawCents % 1200;
  if (centsFromSa < 0) centsFromSa += 1200;

  // Step 3: Find nearest principal swara
  const { swara: nearestPSwara, deviation: deviationCents } =
    nearestPrincipalSwara(centsFromSa);
  const nearestSwaraSymbol = swaraNameToSwara(nearestPSwara.name);

  // Step 4: Find nearest shruti for finer resolution
  const shruti = nearestShruti(centsFromSa);

  // Step 5: Check raga context
  const raga = ragaId ? getRagaById(ragaId) : undefined;
  const inRagaContext = raga ? isValidInRaga(nearestSwaraSymbol, raga) : true;

  // Step 6: Check for expected ornament in raga context
  const expectedOrnament = raga
    ? getExpectedOrnament(nearestSwaraSymbol, raga)
    : undefined;

  // Step 7: Compute accuracy score
  const accuracy = getAccuracyScore(deviationCents, level);

  return {
    hz,
    centsFromSa,
    nearestSwara: nearestSwaraSymbol,
    nearestShruti: shruti,
    deviationCents,
    clarity,
    inRagaContext,
    expectedOrnament,
    accuracy,
  };
}

// ---------------------------------------------------------------------------
// Raga validation
// ---------------------------------------------------------------------------

/**
 * Checks whether a swara is valid in a given raga.
 *
 * A swara is valid if it appears in the raga's aroha or avaroha.
 * A swara listed in varjit (forbidden) is explicitly invalid.
 * Sa is always valid.
 *
 * @param swara - The swara to check
 * @param raga - The raga to check against
 * @returns true if the swara is valid in this raga
 */
export function isValidInRaga(swara: Swara, raga: Raga): boolean {
  // Sa is always valid in every raga
  if (swara === 'Sa') return true;

  // If explicitly forbidden, it is invalid
  if (raga.varjit.includes(swara)) return false;

  // Check if it appears in aroha or avaroha
  const ragaSwaras = getRagaSwaras(raga);
  return ragaSwaras.includes(swara);
}

/**
 * Returns the expected ornament for a swara in a given raga, if any.
 *
 * Uses the raga's `ornamentMap` field when available, which provides
 * musicologically accurate per-swara ornament expectations. Falls back
 * to a minimal hardcoded table for ragas that haven't been annotated yet.
 *
 * For example, Re_k in Bhairav is expected to be sung with andolan.
 * This information is used by the feedback system to give raga-specific
 * guidance.
 */
function getExpectedOrnament(swara: Swara, raga: Raga): Ornament | undefined {
  // Use the raga's ornamentMap if available (preferred — musicologically complete)
  if (raga.ornamentMap) {
    const ornaments = raga.ornamentMap[swara];
    if (ornaments && ornaments.length > 0) {
      // Return the first (primary) ornament for this swara
      return ornaments[0];
    }
    return undefined;
  }

  // Fallback: minimal hardcoded expectations for ragas without ornamentMap
  const expectations: Record<string, Record<string, Ornament>> = {
    bhairav: {
      Re_k: 'andolan',
      Dha_k: 'andolan',
    },
    yaman: {
      Ga: 'meend',
    },
  };

  return expectations[raga.id]?.[swara];
}

// ---------------------------------------------------------------------------
// Accuracy scoring
// ---------------------------------------------------------------------------

/**
 * Computes an accuracy score (0 to 1) based on the deviation in cents
 * and the student's level tolerance.
 *
 * The score follows a smooth curve:
 *   - At 0 cents deviation: score = 1.0 (perfect)
 *   - At tolerance boundary: score = 0.5 (passing)
 *   - At 2x tolerance: score approaches 0
 *
 * We use a Gaussian-like curve: score = exp(-(deviation^2) / (2 * sigma^2))
 * where sigma is calibrated so that score = 0.5 at the tolerance boundary.
 *
 * This is more musical than a hard cutoff: a student 1 cent off should
 * score nearly perfect, not have the same score as someone 49 cents off.
 *
 * @param deviationCents - The deviation from the target swara in cents
 * @param level - The student's current level
 * @returns Score from 0 to 1
 */
export function getAccuracyScore(deviationCents: number, level: Level): number {
  const tolerance = LEVEL_TOLERANCE[level];

  // sigma calibrated so exp(-(tolerance^2)/(2*sigma^2)) = 0.5
  // => sigma = tolerance / sqrt(2 * ln(2))
  const sigma = tolerance / Math.sqrt(2 * Math.LN2);

  const score = Math.exp(-(deviationCents * deviationCents) / (2 * sigma * sigma));

  return Math.max(0, Math.min(1, score));
}

/**
 * Determines if a pitch is "correct" for the current level.
 * A simple threshold: accuracy >= 0.5 means the deviation is within tolerance.
 */
export function isPitchCorrect(deviationCents: number, level: Level): boolean {
  return Math.abs(deviationCents) <= LEVEL_TOLERANCE[level];
}

// ---------------------------------------------------------------------------
// Utility: find nearest raga-valid swara
// ---------------------------------------------------------------------------

/**
 * Given a cents position, find the nearest swara that is valid in the
 * given raga. This is useful when the nearest absolute swara is forbidden
 * in the raga — we want to find the nearest *allowed* swara instead.
 *
 * @param centsFromSa - Cents position (0-1200)
 * @param raga - The raga context
 * @returns The nearest valid swara and its deviation
 */
export function nearestValidSwaraInRaga(
  centsFromSa: number,
  raga: Raga,
): { swara: Swara; deviationCents: number } {
  const ragaSwaras = getRagaSwaras(raga);

  let bestSwara: Swara = 'Sa';
  let bestDeviation = Infinity;

  for (const swaraSymbol of ragaSwaras) {
    const def = getSwaraBySymbol(swaraSymbol);
    if (!def) continue;

    const swaraCents = def.centsFromSa;
    const deviation = centsFromSa - swaraCents;

    // Check direct and octave-wrapped distances
    const candidates = [deviation, deviation - 1200, deviation + 1200];
    for (const d of candidates) {
      if (Math.abs(d) < Math.abs(bestDeviation)) {
        bestDeviation = d;
        bestSwara = swaraSymbol;
      }
    }
  }

  return { swara: bestSwara, deviationCents: bestDeviation };
}
