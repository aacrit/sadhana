/**
 * @module engine/theory/swaras
 *
 * The 12 swaras of Hindustani Classical Music, defined with
 * just intonation frequency ratios from the harmonic series.
 *
 * These are not approximations. The ratios come from the Natya Shastra
 * and the natural harmonic series — the same physics that makes a tanpura
 * string resonate. A swara is a precise point in frequency space with a
 * name, a personality, and a function within a raga.
 *
 * Cents from Sa are calculated as: 1200 * log2(ratio)
 * Deviation from equal temperament: just_cents - ET_cents
 *
 * Reference: Sa = any chosen fundamental (typically C4 = 261.63 Hz in
 * Western mapping, but Sa is not C — it is whatever the performer chooses).
 */

import type { Swara, SwaraDefinition } from './types';

/**
 * Shadja — Sa — the tonic, the home, the immovable foundation.
 * All other swaras are defined relative to Sa.
 * Ratio: 1/1
 */
export const SA: SwaraDefinition = {
  symbol: 'Sa',
  name: 'Shadja',
  nameDevanagari: 'षड्ज',
  sargamAbbr: 'S',
  shuddha: true,
  achala: true,
  alternateNames: ['Shadaj', 'Sa'],
  ratioNumerator: 1,
  ratioDenominator: 1,
  centsFromSa: 0,
  centsDeviationFromET: 0,
  westernNote: 'C (tonic)',
  semitonesFromSa: 0,
};

/**
 * Komal Rishabh — the lowered second.
 * Ratio: 16/15 (the just minor second)
 * Used in Bhairav, Todi, Bhairavi — associated with gravity, austerity.
 */
export const RE_K: SwaraDefinition = {
  symbol: 'Re_k',
  name: 'Komal Rishabh',
  nameDevanagari: 'कोमल ऋषभ',
  sargamAbbr: 'r',
  shuddha: false,
  achala: false,
  alternateNames: ['Komal Re', 'Ativar Rishabh'],
  ratioNumerator: 16,
  ratioDenominator: 15,
  centsFromSa: 111.73,
  centsDeviationFromET: 11.73, // ET minor 2nd = 100 cents
  westernNote: 'Db (approx.)',
  semitonesFromSa: 1,
};

/**
 * Shuddha Rishabh — the natural second.
 * Ratio: 9/8 (the just major second)
 * The bright, stable second degree.
 */
export const RE: SwaraDefinition = {
  symbol: 'Re',
  name: 'Shuddha Rishabh',
  nameDevanagari: 'शुद्ध ऋषभ',
  sargamAbbr: 'R',
  shuddha: true,
  achala: false,
  alternateNames: ['Shuddha Re', 'Rishabh'],
  ratioNumerator: 9,
  ratioDenominator: 8,
  centsFromSa: 203.91,
  centsDeviationFromET: 3.91, // ET major 2nd = 200 cents
  westernNote: 'D (approx.)',
  semitonesFromSa: 2,
};

/**
 * Komal Gandhar — the lowered third.
 * Ratio: 6/5 (the just minor third)
 * The emotional, expressive swara found in Kafi, Bhimpalasi, Bageshri.
 */
export const GA_K: SwaraDefinition = {
  symbol: 'Ga_k',
  name: 'Komal Gandhar',
  nameDevanagari: 'कोमल गंधार',
  sargamAbbr: 'g',
  shuddha: false,
  achala: false,
  alternateNames: ['Komal Ga', 'Sadharana Gandhar'],
  ratioNumerator: 6,
  ratioDenominator: 5,
  centsFromSa: 315.64,
  centsDeviationFromET: 15.64, // ET minor 3rd = 300 cents
  westernNote: 'Eb (approx.)',
  semitonesFromSa: 3,
};

/**
 * Shuddha Gandhar — the natural third.
 * Ratio: 5/4 (the just major third)
 * The sweet, consonant third. Vadi of Yaman and Bhoopali.
 */
export const GA: SwaraDefinition = {
  symbol: 'Ga',
  name: 'Shuddha Gandhar',
  nameDevanagari: 'शुद्ध गंधार',
  sargamAbbr: 'G',
  shuddha: true,
  achala: false,
  alternateNames: ['Shuddha Ga', 'Antara Gandhar', 'Gandhar'],
  ratioNumerator: 5,
  ratioDenominator: 4,
  centsFromSa: 386.31,
  centsDeviationFromET: -13.69, // ET major 3rd = 400 cents
  westernNote: 'E (approx.)',
  semitonesFromSa: 4,
};

/**
 * Shuddha Madhyam — the natural fourth.
 * Ratio: 4/3 (the just perfect fourth)
 * The stable, grounded fourth degree.
 */
export const MA: SwaraDefinition = {
  symbol: 'Ma',
  name: 'Shuddha Madhyam',
  nameDevanagari: 'शुद्ध मध्यम',
  sargamAbbr: 'm',
  shuddha: true,
  achala: false,
  alternateNames: ['Shuddha Ma', 'Madhyam'],
  ratioNumerator: 4,
  ratioDenominator: 3,
  centsFromSa: 498.04,
  centsDeviationFromET: -1.96, // ET perfect 4th = 500 cents
  westernNote: 'F (approx.)',
  semitonesFromSa: 5,
};

/**
 * Tivra Madhyam — the raised fourth.
 * Ratio: 45/32 (the augmented fourth in just intonation)
 * The yearning, aspiring swara. Defines the Kalyan thaat.
 * Yaman's entire character turns on this one swara.
 */
export const MA_T: SwaraDefinition = {
  symbol: 'Ma_t',
  name: 'Tivra Madhyam',
  nameDevanagari: 'तीव्र मध्यम',
  sargamAbbr: 'M',
  shuddha: false,
  achala: false,
  alternateNames: ['Tivra Ma', 'Teevra Madhyam'],
  ratioNumerator: 45,
  ratioDenominator: 32,
  centsFromSa: 590.22,
  centsDeviationFromET: -9.78, // ET tritone = 600 cents
  westernNote: 'F# (approx.)',
  semitonesFromSa: 6,
};

/**
 * Pancham — Pa — the fifth, the immovable consonance.
 * Ratio: 3/2 (the just perfect fifth)
 * Along with Sa, Pa is achala — it never changes. The Sa-Pa interval
 * is the foundation of the tanpura drone.
 */
export const PA: SwaraDefinition = {
  symbol: 'Pa',
  name: 'Pancham',
  nameDevanagari: 'पंचम',
  sargamAbbr: 'P',
  shuddha: true,
  achala: true,
  alternateNames: ['Pancham', 'Pa'],
  ratioNumerator: 3,
  ratioDenominator: 2,
  centsFromSa: 701.96,
  centsDeviationFromET: 1.96, // ET perfect 5th = 700 cents
  westernNote: 'G (approx.)',
  semitonesFromSa: 7,
};

/**
 * Komal Dhaivat — the lowered sixth.
 * Ratio: 8/5 (the just minor sixth)
 * Used in Bhairav (with andolan), Todi, Bhairavi.
 */
export const DHA_K: SwaraDefinition = {
  symbol: 'Dha_k',
  name: 'Komal Dhaivat',
  nameDevanagari: 'कोमल धैवत',
  sargamAbbr: 'd',
  shuddha: false,
  achala: false,
  alternateNames: ['Komal Dha', 'Ativar Dhaivat'],
  ratioNumerator: 8,
  ratioDenominator: 5,
  centsFromSa: 813.69,
  centsDeviationFromET: 13.69, // ET minor 6th = 800 cents
  westernNote: 'Ab (approx.)',
  semitonesFromSa: 8,
};

/**
 * Shuddha Dhaivat — the natural sixth.
 * Ratio: 5/3 (the just major sixth)
 */
export const DHA: SwaraDefinition = {
  symbol: 'Dha',
  name: 'Shuddha Dhaivat',
  nameDevanagari: 'शुद्ध धैवत',
  sargamAbbr: 'D',
  shuddha: true,
  achala: false,
  alternateNames: ['Shuddha Dha', 'Dhaivat'],
  ratioNumerator: 5,
  ratioDenominator: 3,
  centsFromSa: 884.36,
  centsDeviationFromET: -15.64, // ET major 6th = 900 cents
  westernNote: 'A (approx.)',
  semitonesFromSa: 9,
};

/**
 * Komal Nishad — the lowered seventh.
 * Ratio: 16/9 (the just minor seventh — Pythagorean)
 * Note: Some traditions use 9/5 (1017.60 cents). We use 16/9 (996.09 cents)
 * as the standard Hindustani komal Ni, which sits closer to the
 * Pythagorean minor seventh. The exact shruti depends on raga context.
 */
export const NI_K: SwaraDefinition = {
  symbol: 'Ni_k',
  name: 'Komal Nishad',
  nameDevanagari: 'कोमल निषाद',
  sargamAbbr: 'n',
  shuddha: false,
  achala: false,
  alternateNames: ['Komal Ni', 'Kaisiki Nishad'],
  ratioNumerator: 16,
  ratioDenominator: 9,
  centsFromSa: 996.09,
  centsDeviationFromET: -3.91, // ET minor 7th = 1000 cents
  westernNote: 'Bb (approx.)',
  semitonesFromSa: 10,
};

/**
 * Shuddha Nishad — the natural seventh.
 * Ratio: 15/8 (the just major seventh)
 * The leading tone. In Yaman, Ni is the samvadi — deeply important.
 */
export const NI: SwaraDefinition = {
  symbol: 'Ni',
  name: 'Shuddha Nishad',
  nameDevanagari: 'शुद्ध निषाद',
  sargamAbbr: 'N',
  shuddha: true,
  achala: false,
  alternateNames: ['Shuddha Ni', 'Kakali Nishad', 'Nishad'],
  ratioNumerator: 15,
  ratioDenominator: 8,
  centsFromSa: 1088.27,
  centsDeviationFromET: -11.73, // ET major 7th = 1100 cents
  westernNote: 'B (approx.)',
  semitonesFromSa: 11,
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * All 12 swaras in chromatic order, ascending from Sa.
 * This is the complete swara palette from which ragas draw.
 */
export const SWARAS: readonly SwaraDefinition[] = [
  SA, RE_K, RE, GA_K, GA, MA, MA_T, PA, DHA_K, DHA, NI_K, NI,
] as const;

/**
 * Lookup a swara definition by its symbol.
 * @param symbol - The swara symbol: 'Sa', 'Re_k', 'Ga', etc.
 * @returns The SwaraDefinition, or undefined if not found.
 */
export function getSwaraBySymbol(symbol: Swara): SwaraDefinition | undefined {
  return SWARAS.find(s => s.symbol === symbol);
}

/**
 * Get the just intonation frequency ratio as a decimal for a given swara.
 * @param symbol - The swara symbol.
 * @returns The frequency ratio relative to Sa (e.g., 1.5 for Pa).
 */
export function getSwaraRatio(symbol: Swara): number {
  const swara = getSwaraBySymbol(symbol);
  if (!swara) throw new Error(`Unknown swara: ${symbol}`);
  return swara.ratioNumerator / swara.ratioDenominator;
}

/**
 * Get the frequency in Hz for a given swara, given a reference Sa frequency.
 * @param symbol - The swara symbol.
 * @param saHz - The frequency of Sa in Hz (default: 261.63, middle C).
 * @param octave - The octave register.
 * @returns The frequency in Hz.
 */
export function getSwaraFrequency(
  symbol: Swara,
  saHz: number = 261.63,
  octave: 'mandra' | 'madhya' | 'taar' = 'madhya',
): number {
  const ratio = getSwaraRatio(symbol);
  const octaveMultiplier = octave === 'mandra' ? 0.5 : octave === 'taar' ? 2 : 1;
  return saHz * ratio * octaveMultiplier;
}

/**
 * Map of swara symbols to their definitions for O(1) lookup.
 */
export const SWARA_MAP: Readonly<Record<Swara, SwaraDefinition>> = {
  Sa: SA,
  Re_k: RE_K,
  Re: RE,
  Ga_k: GA_K,
  Ga: GA,
  Ma: MA,
  Ma_t: MA_T,
  Pa: PA,
  Dha_k: DHA_K,
  Dha: DHA,
  Ni_k: NI_K,
  Ni: NI,
};
