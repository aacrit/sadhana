/**
 * just-intonation.ts — The 22 Shrutis and Just Intonation System
 *
 * Hindustani classical music is built on just intonation, not equal temperament.
 * The difference is fundamental:
 *
 *   Equal temperament: divide the octave into 12 equal semitones of 100 cents each.
 *   Every interval is slightly "wrong" — a compromise for keyboard instruments.
 *
 *   Just intonation: intervals are exact frequency ratios — small whole numbers.
 *   5:4 is a pure major third. 3:2 is a pure fifth. No compromise.
 *
 * The Natya Shastra (c. 200 BCE - 200 CE) codified 22 shrutis (microtonal
 * intervals) within the octave. These are not arbitrary cultural choices.
 * They emerge from the harmonic series: every shruti is a ratio of small
 * integers, and its musical character — consonant, tense, bright, dark —
 * is a direct consequence of how its partials align with Sa's partials.
 *
 * The 12 principal swaras used in modern Hindustani practice are a subset
 * of these 22 shrutis. Different ragas may use subtly different intonations
 * of the "same" swara — this is what gives each raga its distinct color.
 * A komal Ga in Bhairav is not identical to komal Ga in Kafi. The shruti
 * system captures this.
 *
 * REFERENCE: Levy & Reinhard, "Comprehensive Just Intonation";
 *            Daniélou, "Music and the Power of Sound";
 *            Jairazbhoy, "The Rāgs of North Indian Music"
 *
 * @module engine/physics/just-intonation
 */

import { ratioToCents } from './harmonics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * An exact frequency ratio represented as a fraction p/q.
 * Using integer numerator and denominator preserves mathematical precision
 * that floating-point division would lose.
 */
export interface Ratio {
  /** Numerator */
  readonly p: number;
  /** Denominator */
  readonly q: number;
}

/**
 * A single shruti — one of the 22 microtonal positions in the octave.
 */
export interface Shruti {
  /** Shruti number (1-22, following Natya Shastra enumeration) */
  readonly number: number;
  /** Sanskrit name of this shruti */
  readonly name: string;
  /** Exact frequency ratio from Sa */
  readonly ratio: Ratio;
  /** Cents from Sa (computed from ratio: 1200 * log2(p/q)) */
  readonly cents: number;
  /** Nearest equal-temperament step in cents (0, 100, 200, ..., 1100) */
  readonly equalTempCents: number;
  /** Deviation from equal temperament in cents (cents - equalTempCents) */
  readonly deviation: number;
  /** The principal swara this shruti is associated with, if any */
  readonly swara: SwaraName | null;
}

/**
 * The 12 principal swara names used in Hindustani classical music.
 */
export type SwaraName =
  | 'Sa'
  | 'Re_komal'
  | 'Re'
  | 'Ga_komal'
  | 'Ga'
  | 'Ma'
  | 'Ma_tivra'
  | 'Pa'
  | 'Dha_komal'
  | 'Dha'
  | 'Ni_komal'
  | 'Ni';

/**
 * A principal swara with its frequency data and shruti mapping.
 */
export interface PrincipalSwara {
  /** Swara identifier */
  readonly name: SwaraName;
  /** Full Sanskrit name */
  readonly sanskrit: string;
  /** Devanagari name */
  readonly devanagari: string;
  /** Sargam abbreviation (S, r, R, g, G, m, M, P, d, D, n, N) */
  readonly sargam: string;
  /** Exact just-intonation ratio from Sa */
  readonly ratio: Ratio;
  /** Cents from Sa */
  readonly cents: number;
  /** Equal temperament cents */
  readonly equalTempCents: number;
  /** Deviation from equal temperament */
  readonly deviation: number;
  /** Which shruti number(s) this swara maps to */
  readonly shrutiNumbers: ReadonlyArray<number>;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Compute cents for a ratio, rounded to 2 decimal places for display. */
function computeCents(ratio: Ratio): number {
  return ratioToCents(ratio.p / ratio.q);
}

/** Find nearest equal-temp step. */
function nearestEqualTemp(cents: number): number {
  return Math.round(cents / 100) * 100;
}

/** Build a Shruti object from its core data. */
function makeShruti(
  num: number,
  name: string,
  p: number,
  q: number,
  swara: SwaraName | null,
): Shruti {
  const ratio: Ratio = { p, q };
  const cents = computeCents(ratio);
  const equalTempCents = nearestEqualTemp(cents);
  const deviation = cents - equalTempCents;
  return { number: num, name, ratio, cents, equalTempCents, deviation, swara };
}

// ---------------------------------------------------------------------------
// The 22 Shrutis
// ---------------------------------------------------------------------------

/**
 * All 22 shrutis of the Hindustani system.
 *
 * The enumeration follows the traditional scheme from the Natya Shastra
 * and Sangita Ratnakara. The ratios are from the standard 5-limit just
 * intonation system used in Hindustani music, where all ratios are
 * products of powers of 2, 3, and 5.
 *
 * Different treatises number the shrutis slightly differently. We follow
 * the widely-accepted scheme where shruti 1 = Sa (unison) and shruti 22
 * is the last position before the upper Sa.
 *
 * The 22 shrutis are NOT equally spaced. They cluster around the 12
 * principal swara positions, with some swaras having 2 shruti variants
 * (e.g., two slightly different positions for komal Re, depending on raga)
 * and others having a single fixed position (Sa and Pa are immovable).
 */
export const SHRUTIS: ReadonlyArray<Shruti> = [
  //  #   Name                        p    q    swara
  makeShruti(1,  'Chandovati',         1,   1,   'Sa'),         // 0.00 cents — Sa (immovable)
  makeShruti(2,  'Dayavati',           256, 243, null),         // 90.22 cents — between Sa and Re komal
  makeShruti(3,  'Ranjani',            16,  15,  'Re_komal'),   // 111.73 cents — Re komal (standard)
  makeShruti(4,  'Ratika',             10,  9,   null),         // 182.40 cents — between Re komal and Re
  makeShruti(5,  'Raudri',             9,   8,   'Re'),         // 203.91 cents — Re shuddha
  makeShruti(6,  'Krodha',             32,  27,  null),         // 294.13 cents — low Ga komal
  makeShruti(7,  'Vajrika',            6,   5,   'Ga_komal'),   // 315.64 cents — Ga komal (standard)
  makeShruti(8,  'Prasarini',          5,   4,   'Ga'),         // 386.31 cents — Ga shuddha
  makeShruti(9,  'Priti',              81,  64,  null),         // 407.82 cents — high Ga / low Ma
  makeShruti(10, 'Marjani',            4,   3,   'Ma'),         // 498.04 cents — Ma shuddha
  makeShruti(11, 'Kshiti',             27,  20,  null),         // 519.55 cents — high Ma shuddha
  makeShruti(12, 'Rakta',              45,  32,  'Ma_tivra'),   // 590.22 cents — Ma tivra
  makeShruti(13, 'Sandipani',          729, 512, null),         // 611.73 cents — high Ma tivra
  makeShruti(14, 'Alapini',            3,   2,   'Pa'),         // 701.96 cents — Pa (immovable)
  makeShruti(15, 'Madanti',            128, 81,  null),         // 792.18 cents — between Pa and Dha komal
  makeShruti(16, 'Rohini',             8,   5,   'Dha_komal'),  // 813.69 cents — Dha komal
  makeShruti(17, 'Ramya',              5,   3,   'Dha'),        // 884.36 cents — Dha shuddha
  makeShruti(18, 'Ugra',               27,  16,  null),         // 905.87 cents — high Dha
  makeShruti(19, 'Kshobhini',          16,  9,   'Ni_komal'),   // 996.09 cents — Ni komal
  makeShruti(20, 'Tivra',              9,   5,   null),         // 1017.60 cents — high Ni komal
  makeShruti(21, 'Kumudvati',          15,  8,   'Ni'),         // 1088.27 cents — Ni shuddha
  makeShruti(22, 'Manda',              243, 128, null),         // 1109.78 cents — high Ni shuddha
] as const;

// ---------------------------------------------------------------------------
// The 12 Principal Swaras
// ---------------------------------------------------------------------------

/**
 * The 12 principal swaras of Hindustani classical music mapped to their
 * just-intonation ratios.
 *
 * These are the "standard" positions. In practice, a raga may use a
 * slightly different shruti for a given swara name. The raga-specific
 * shruti selection is handled by the theory/ layer; this layer provides
 * the canonical reference positions.
 *
 * Notation convention for sargam:
 *   Lowercase = komal (flat) or tivra: r, g, m (tivra), d, n
 *   Uppercase = shuddha (natural): S, R, G, M (shuddha), P, D, N
 *
 * Wait — in Hindustani sargam convention the tivra Ma is the *raised*
 * variant, so in written sargam it is often shown as M̃ or m̄. We use
 * 'M\u0303' (M with tilde) in display but 'Ma_tivra' in code.
 */
export const PRINCIPAL_SWARAS: ReadonlyArray<PrincipalSwara> = [
  {
    name: 'Sa',
    sanskrit: 'Shadja',
    devanagari: 'षड्ज',
    sargam: 'S',
    ratio: { p: 1, q: 1 },
    cents: 0,
    equalTempCents: 0,
    deviation: 0,
    shrutiNumbers: [1],
  },
  {
    name: 'Re_komal',
    sanskrit: 'Komal Rishabh',
    devanagari: 'कोमल ऋषभ',
    sargam: 'r',
    ratio: { p: 16, q: 15 },
    cents: computeCents({ p: 16, q: 15 }),
    equalTempCents: 100,
    deviation: computeCents({ p: 16, q: 15 }) - 100,
    shrutiNumbers: [2, 3],
  },
  {
    name: 'Re',
    sanskrit: 'Shuddha Rishabh',
    devanagari: 'शुद्ध ऋषभ',
    sargam: 'R',
    ratio: { p: 9, q: 8 },
    cents: computeCents({ p: 9, q: 8 }),
    equalTempCents: 200,
    deviation: computeCents({ p: 9, q: 8 }) - 200,
    shrutiNumbers: [4, 5],
  },
  {
    name: 'Ga_komal',
    sanskrit: 'Komal Gandhar',
    devanagari: 'कोमल गान्धार',
    sargam: 'g',
    ratio: { p: 6, q: 5 },
    cents: computeCents({ p: 6, q: 5 }),
    equalTempCents: 300,
    deviation: computeCents({ p: 6, q: 5 }) - 300,
    shrutiNumbers: [6, 7],
  },
  {
    name: 'Ga',
    sanskrit: 'Shuddha Gandhar',
    devanagari: 'शुद्ध गान्धार',
    sargam: 'G',
    ratio: { p: 5, q: 4 },
    cents: computeCents({ p: 5, q: 4 }),
    equalTempCents: 400,
    deviation: computeCents({ p: 5, q: 4 }) - 400,
    shrutiNumbers: [8, 9],
  },
  {
    name: 'Ma',
    sanskrit: 'Shuddha Madhyam',
    devanagari: 'शुद्ध मध्यम',
    sargam: 'm',
    ratio: { p: 4, q: 3 },
    cents: computeCents({ p: 4, q: 3 }),
    equalTempCents: 500,
    deviation: computeCents({ p: 4, q: 3 }) - 500,
    shrutiNumbers: [10, 11],
  },
  {
    name: 'Ma_tivra',
    sanskrit: 'Tivra Madhyam',
    devanagari: 'तीव्र मध्यम',
    sargam: 'M',
    ratio: { p: 45, q: 32 },
    cents: computeCents({ p: 45, q: 32 }),
    equalTempCents: 600,
    deviation: computeCents({ p: 45, q: 32 }) - 600,
    shrutiNumbers: [12, 13],
  },
  {
    name: 'Pa',
    sanskrit: 'Pancham',
    devanagari: 'पञ्चम',
    sargam: 'P',
    ratio: { p: 3, q: 2 },
    cents: computeCents({ p: 3, q: 2 }),
    equalTempCents: 700,
    deviation: computeCents({ p: 3, q: 2 }) - 700,
    shrutiNumbers: [14],
  },
  {
    name: 'Dha_komal',
    sanskrit: 'Komal Dhaivat',
    devanagari: 'कोमल धैवत',
    sargam: 'd',
    ratio: { p: 8, q: 5 },
    cents: computeCents({ p: 8, q: 5 }),
    equalTempCents: 800,
    deviation: computeCents({ p: 8, q: 5 }) - 800,
    shrutiNumbers: [15, 16],
  },
  {
    name: 'Dha',
    sanskrit: 'Shuddha Dhaivat',
    devanagari: 'शुद्ध धैवत',
    sargam: 'D',
    ratio: { p: 5, q: 3 },
    cents: computeCents({ p: 5, q: 3 }),
    equalTempCents: 900,
    deviation: computeCents({ p: 5, q: 3 }) - 900,
    shrutiNumbers: [17, 18],
  },
  {
    name: 'Ni_komal',
    sanskrit: 'Komal Nishad',
    devanagari: 'कोमल निषाद',
    sargam: 'n',
    ratio: { p: 16, q: 9 },
    cents: computeCents({ p: 16, q: 9 }),
    equalTempCents: 1000,
    deviation: computeCents({ p: 16, q: 9 }) - 1000,
    shrutiNumbers: [19, 20],
  },
  {
    name: 'Ni',
    sanskrit: 'Shuddha Nishad',
    devanagari: 'शुद्ध निषाद',
    sargam: 'N',
    ratio: { p: 15, q: 8 },
    cents: computeCents({ p: 15, q: 8 }),
    equalTempCents: 1100,
    deviation: computeCents({ p: 15, q: 8 }) - 1100,
    shrutiNumbers: [21, 22],
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup indices (built once at module load)
// ---------------------------------------------------------------------------

const _swaraByName = new Map<SwaraName, PrincipalSwara>();
for (const s of PRINCIPAL_SWARAS) {
  _swaraByName.set(s.name, s);
}

const _shrutiByNumber = new Map<number, Shruti>();
for (const s of SHRUTIS) {
  _shrutiByNumber.set(s.number, s);
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * Converts a shruti to its frequency in Hz, given Sa's frequency.
 *
 * @param shruti - The shruti to convert
 * @param saHz - Sa frequency in Hz (default: 261.63 Hz, C4)
 * @returns Frequency in Hz
 */
export function shrutiToHz(shruti: Shruti, saHz: number = 261.63): number {
  return saHz * (shruti.ratio.p / shruti.ratio.q);
}

/**
 * Converts a principal swara to its frequency in Hz.
 *
 * @param swara - Swara name or PrincipalSwara object
 * @param saHz - Sa frequency in Hz
 * @returns Frequency in Hz
 */
export function swaraToHz(swara: SwaraName | PrincipalSwara, saHz: number = 261.63): number {
  const s = typeof swara === 'string' ? getSwaraByName(swara) : swara;
  return saHz * (s.ratio.p / s.ratio.q);
}

/**
 * Computes the cents deviation of a detected frequency from a target.
 *
 * This is the core measurement used by the voice pipeline to score
 * pitch accuracy. The formula:
 *
 *   deviation = 1200 * log2(f_detected / f_target)
 *
 * Positive = sharp. Negative = flat.
 *
 * For raga-context scoring, `targetCents` is the just-intonation
 * position of the swara being sung, and `hz` is the detected pitch.
 *
 * @param hz - Detected frequency in Hz
 * @param saHz - Sa frequency in Hz
 * @param targetCents - Expected cents position from Sa
 * @returns Deviation in cents (positive = sharp, negative = flat)
 */
export function centsDeviation(hz: number, saHz: number, targetCents: number): number {
  if (hz <= 0 || saHz <= 0) {
    throw new RangeError('Frequencies must be positive');
  }
  const detectedCents = ratioToCents(hz / saHz);
  return detectedCents - targetCents;
}

/**
 * Finds the nearest shruti to a given cents position from Sa.
 *
 * Used by the pitch mapping pipeline to identify which microtonal
 * position the singer is closest to. This enables raga-context-aware
 * scoring: if the student is singing in Bhairav, we know komal Re
 * should be at shruti 3 (16:15), not shruti 2 (256:243).
 *
 * @param centsFromSa - Cents above Sa (0 to 1200)
 * @returns The nearest Shruti object
 */
export function nearestShruti(centsFromSa: number): Shruti {
  // Normalize to [0, 1200)
  let normalized = centsFromSa % 1200;
  if (normalized < 0) normalized += 1200;

  let closest: Shruti = SHRUTIS[0]!;
  let minDistance = Infinity;

  for (const shruti of SHRUTIS) {
    const distance = Math.abs(shruti.cents - normalized);
    // Also check wrapping around the octave (e.g., 1190 cents is close to 0)
    const wrappedDistance = Math.min(distance, 1200 - distance);
    if (wrappedDistance < minDistance) {
      minDistance = wrappedDistance;
      closest = shruti;
    }
  }

  return closest;
}

/**
 * Finds the nearest principal swara to a given cents position.
 *
 * @param centsFromSa - Cents above Sa (0 to 1200)
 * @returns The nearest PrincipalSwara object and deviation in cents
 */
export function nearestSwara(centsFromSa: number): {
  swara: PrincipalSwara;
  deviation: number;
} {
  let normalized = centsFromSa % 1200;
  if (normalized < 0) normalized += 1200;

  let closest: PrincipalSwara = PRINCIPAL_SWARAS[0]!;
  let minDistance = Infinity;
  let bestDeviation = 0;

  for (const swara of PRINCIPAL_SWARAS) {
    const distance = normalized - swara.cents;
    const wrappedDistances = [
      distance,
      distance - 1200,
      distance + 1200,
    ];

    for (const d of wrappedDistances) {
      if (Math.abs(d) < minDistance) {
        minDistance = Math.abs(d);
        closest = swara;
        bestDeviation = d;
      }
    }
  }

  return { swara: closest, deviation: bestDeviation };
}

/**
 * Retrieves a principal swara by name.
 *
 * @param name - SwaraName identifier
 * @returns The PrincipalSwara object
 * @throws {Error} if name is not found
 */
export function getSwaraByName(name: SwaraName): PrincipalSwara {
  const swara = _swaraByName.get(name);
  if (!swara) {
    throw new Error(`Unknown swara name: ${name}`);
  }
  return swara;
}

/**
 * Retrieves a shruti by its number (1-22).
 *
 * @param num - Shruti number
 * @returns The Shruti object
 * @throws {Error} if number is not in range
 */
export function getShrutiByNumber(num: number): Shruti {
  const shruti = _shrutiByNumber.get(num);
  if (!shruti) {
    throw new Error(`Invalid shruti number: ${num}. Must be 1-22.`);
  }
  return shruti;
}

/**
 * Returns all shrutis associated with a given swara name.
 *
 * A swara typically maps to 2 shrutis (the principal position and a
 * variant), except Sa and Pa which are fixed at exactly 1 shruti each.
 *
 * @param name - SwaraName identifier
 * @returns Array of Shruti objects
 */
export function shrutisForSwara(name: SwaraName): ReadonlyArray<Shruti> {
  const swara = getSwaraByName(name);
  return swara.shrutiNumbers.map((n) => getShrutiByNumber(n));
}

/**
 * Generates a complete frequency table for all 12 principal swaras
 * at a given Sa frequency.
 *
 * @param saHz - Sa frequency in Hz
 * @returns Map of SwaraName to frequency in Hz
 */
export function frequencyTable(saHz: number = 261.63): Map<SwaraName, number> {
  const table = new Map<SwaraName, number>();
  for (const swara of PRINCIPAL_SWARAS) {
    table.set(swara.name, swaraToHz(swara, saHz));
  }
  return table;
}

/**
 * Upper Sa (octave above Sa). Not a separate swara but frequently needed
 * for boundary calculations.
 */
export const UPPER_SA: Readonly<{ ratio: Ratio; cents: number }> = {
  ratio: { p: 2, q: 1 },
  cents: 1200,
};
