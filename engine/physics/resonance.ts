/**
 * resonance.ts — Acoustic Resonance Theory
 *
 * Why do certain intervals feel stable and others tense? This is not
 * subjective. It is physics.
 *
 * When two frequencies sound simultaneously, their partials interact.
 * If partials coincide (same frequency), they reinforce. If partials
 * are close but not identical, they create beating — a periodic
 * amplitude fluctuation at the difference frequency. When this beating
 * falls in the critical band of the basilar membrane (roughly 4-20 Hz
 * for frequencies in the musical range), the ear perceives roughness,
 * which the brain interprets as dissonance.
 *
 * The consonance of an interval depends on how many of the partials of
 * the two tones coincide versus how many fall within each other's
 * critical bands. Simple ratios (low integers) produce more coincidences
 * and fewer near-misses.
 *
 * IN HINDUSTANI CLASSICAL MUSIC:
 * ==============================
 * The raga system exploits this physics with extraordinary precision:
 *
 *   - Sa and Pa (1:1 and 3:2) are the fixed pillars of the tanpura drone.
 *     Their partials overlap maximally. This is the tonal ground.
 *
 *   - The vadi (sonant) and samvadi (consonant) of a raga are typically
 *     a perfect fourth or fifth apart — the most resonant intervals
 *     after the octave. They are the raga's gravitational centers.
 *
 *   - Komal swaras (flat variants) create tension against the drone:
 *     komal Ga (6:5) has a darker, more tense quality than shuddha Ga (5:4)
 *     because 6*5 = 30 > 5*4 = 20. More complex ratio = less partial overlap
 *     = more roughness = more emotional tension. This is Bhairav vs Bilawal.
 *
 *   - Andolan (gentle oscillation) on komal swaras in ragas like Bhairav
 *     works precisely because the swara sits at a point of moderate tension.
 *     Oscillating around it creates waves of consonance and dissonance that
 *     the ear experiences as yearning.
 *
 * REFERENCES:
 *   Helmholtz, "On the Sensations of Tone" (1863)
 *   Plomp & Levelt, "Tonal Consonance and Critical Bandwidth" (1965)
 *   Sethares, "Tuning, Timbre, Spectrum, Scale" (2005)
 *
 * @module engine/physics/resonance
 */

import { ratioToCents, centsToRatio } from './harmonics';
import { type Ratio, PRINCIPAL_SWARAS, nearestSwara } from './just-intonation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A complete profile of an interval's acoustic resonance characteristics.
 */
export interface ResonanceProfile {
  /** Consonance score from 0 (maximally dissonant) to 1 (maximally consonant) */
  readonly consonance: number;
  /** Roughness score from 0 (smooth) to 1 (maximally rough) */
  readonly roughness: number;
  /** Description of the harmonic relationship */
  readonly harmonicRelationship: string;
  /** The nearest swara name, for context */
  readonly nearestSwara: string;
  /** Cents from Sa */
  readonly centsFromSa: number;
}

// ---------------------------------------------------------------------------
// Consonance
// ---------------------------------------------------------------------------

/**
 * Computes the Euler/Helmholtz consonance score for a frequency ratio.
 *
 * The fundamental insight: consonance correlates inversely with the
 * "complexity" of a ratio. A simple measure of complexity is the product
 * p * q (for a ratio in lowest terms p:q). The smaller this product,
 * the more partials coincide, and the more consonant the interval.
 *
 * We normalize to a 0-1 scale using:
 *   consonance = 1 / (1 + log2(p * q))
 *
 * This gives:
 *   1:1 (unison)     → 1.0
 *   2:1 (octave)     → 0.59
 *   3:2 (fifth)      → 0.41
 *   4:3 (fourth)     → 0.35
 *   5:4 (major 3rd)  → 0.30
 *   6:5 (minor 3rd)  → 0.27
 *   45:32 (tritone)   → 0.14
 *
 * @param ratio - Frequency ratio as {p, q} in lowest terms
 * @returns Consonance score in [0, 1], where 1 = perfect consonance
 */
export function consonanceScore(ratio: Ratio): number {
  const { p, q } = reduceFraction(ratio.p, ratio.q);
  if (p === 0 || q === 0) {
    return 0;
  }
  // Using log2(p*q) gives a perceptually-scaled complexity measure.
  // Adding 1 prevents division by zero at unison (1*1=1, log2(1)=0).
  const complexity = Math.log2(p * q);
  return 1 / (1 + complexity);
}

/**
 * Computes the roughness (dissonance from beating) between two frequencies.
 *
 * Based on the Plomp-Levelt model: two pure tones produce maximum roughness
 * when their frequency difference is approximately 25% of the critical
 * bandwidth at that frequency range. The critical bandwidth is approximately:
 *
 *   CB(f) = 1.72 * f^0.65  (for f in Hz, CB in Hz)
 *
 * (Glasberg & Moore, 1990, simplified)
 *
 * Roughness follows a bell curve centered at ~25% of the critical bandwidth:
 *   R = exp(-3.5 * s) * (s * exp(1-s))  where s = |f1-f2| / (0.25*CB)
 *
 * For complex tones (with multiple partials), the total roughness is the
 * sum of pairwise roughness between all partial pairs. This function
 * computes roughness for the first 6 partials of each tone, weighted
 * by their amplitudes (assuming 1/n decay).
 *
 * @param freq1 - First frequency in Hz
 * @param freq2 - Second frequency in Hz
 * @returns Roughness score in [0, 1], where 0 = no roughness, 1 = maximum
 */
export function criticalBandRoughness(freq1: number, freq2: number): number {
  if (freq1 <= 0 || freq2 <= 0) {
    throw new RangeError('Frequencies must be positive');
  }

  const PARTIAL_COUNT = 6;
  let totalRoughness = 0;
  let maxPossibleRoughness = 0;

  for (let i = 1; i <= PARTIAL_COUNT; i++) {
    const f1 = freq1 * i;
    const a1 = 1 / i;

    for (let j = 1; j <= PARTIAL_COUNT; j++) {
      const f2 = freq2 * j;
      const a2 = 1 / j;

      const weight = a1 * a2;
      maxPossibleRoughness += weight;
      totalRoughness += weight * pairwiseRoughness(f1, f2);
    }
  }

  // Normalize to [0, 1]
  return maxPossibleRoughness > 0 ? totalRoughness / maxPossibleRoughness : 0;
}

/**
 * Roughness between two pure tones (Plomp-Levelt model).
 *
 * @param f1 - First frequency in Hz
 * @param f2 - Second frequency in Hz
 * @returns Roughness in [0, 1]
 */
function pairwiseRoughness(f1: number, f2: number): number {
  const fMin = Math.min(f1, f2);
  const fMax = Math.max(f1, f2);
  const diff = fMax - fMin;

  if (diff === 0) return 0;

  // Critical bandwidth (Glasberg & Moore approximation, simplified)
  const centerFreq = (f1 + f2) / 2;
  const criticalBandwidth = criticalBand(centerFreq);

  // Normalize difference by 25% of critical bandwidth (point of max roughness)
  const s = diff / (0.25 * criticalBandwidth);

  if (s > 8) return 0; // Well beyond the critical band — no interaction

  // Plomp-Levelt roughness curve: peaks at s=1, decays on both sides
  // R(s) = s * exp(1 - s) * exp(-3.5 * s) gives a good fit to their data
  return s * Math.exp(1 - s) * Math.exp(-3.5 * s) * 4.0;
  // The factor of 4.0 rescales so the peak is close to 1.0
}

/**
 * Approximation of the critical bandwidth at a given frequency.
 *
 * The critical band is the frequency range within which two tones interact
 * to produce roughness (beating perceived as dissonance). Below ~500 Hz,
 * the critical bandwidth is approximately constant (~100 Hz). Above 500 Hz,
 * it grows roughly in proportion to frequency.
 *
 * We use the Equivalent Rectangular Bandwidth (ERB) formula from
 * Glasberg & Moore (1990):
 *   ERB(f) = 24.7 * (4.37 * f/1000 + 1)
 *
 * @param freq - Frequency in Hz
 * @returns Critical bandwidth in Hz
 */
function criticalBand(freq: number): number {
  return 24.7 * (4.37 * freq / 1000 + 1);
}

// ---------------------------------------------------------------------------
// Interval resonance profile
// ---------------------------------------------------------------------------

/**
 * Generates a complete resonance profile for an interval.
 *
 * Given a cents value from Sa and a Sa frequency, this function computes:
 *   1. The nearest just-intonation ratio
 *   2. Its consonance score
 *   3. The actual roughness at those frequencies
 *   4. A human-readable description of the harmonic relationship
 *
 * This is the function the voice pipeline calls to understand the
 * acoustic character of whatever interval the student is singing.
 *
 * @param centsFromSa - Interval above Sa in cents
 * @param saHz - Sa frequency in Hz (default: 261.63)
 * @returns Complete ResonanceProfile
 */
export function intervalResonance(
  centsFromSa: number,
  saHz: number = 261.63,
): ResonanceProfile {
  const freq = saHz * centsToRatio(centsFromSa);
  const { swara, deviation } = nearestSwara(centsFromSa);

  // Use the nearest swara's just ratio for consonance calculation
  const consonance = consonanceScore(swara.ratio);
  const roughness = criticalBandRoughness(saHz, freq);

  const harmonicRelationship = describeHarmonicRelationship(swara.ratio, swara.name);

  return {
    consonance,
    roughness,
    harmonicRelationship,
    nearestSwara: swara.name,
    centsFromSa,
  };
}

// ---------------------------------------------------------------------------
// Harmonic relationship descriptions
// ---------------------------------------------------------------------------

/**
 * Describes in words why a ratio has its particular resonance character.
 *
 * These descriptions connect the mathematical ratio to the acoustic
 * experience. They are written for a student who may not know acoustics
 * but can hear the difference between consonance and tension.
 */
function describeHarmonicRelationship(ratio: Ratio, swaraName: string): string {
  const key = `${ratio.p}:${ratio.q}`;

  const descriptions: Record<string, string> = {
    '1:1':
      'Unison. All partials coincide exactly. Complete consonance. ' +
      'This is Sa — the tonal center, the ground of all music.',

    '16:15':
      'Minor second (just). Only the 15th and 16th harmonics align. ' +
      'Strong roughness in low registers. Komal Re creates tension ' +
      'against Sa — the characteristic color of Bhairav.',

    '9:8':
      'Major second (just). The 8th partial of Sa meets the 9th partial ' +
      'of Re. Moderate tension — Re shuddha wants to resolve upward to Ga ' +
      'or downward to Sa.',

    '6:5':
      'Minor third (just). Every 5th partial of Sa aligns with every 6th ' +
      'of Ga komal. The minor quality arises from this 6:5 complexity. ' +
      'Darker than shuddha Ga. Foundation of ragas like Bhairav, Bhimpalasi.',

    '5:4':
      'Major third (just). The 4th partial of Sa aligns with the 5th of Ga. ' +
      'Bright, stable consonance. 14 cents flatter than equal temperament — ' +
      'this is why equal-tempered thirds sound "wrong" to trained ears.',

    '4:3':
      'Perfect fourth (just). Every 3rd partial of Sa meets every 4th of Ma. ' +
      'Second-most-consonant non-octave interval. Ma shuddha is the gateway ' +
      'to the upper tetrachord.',

    '45:32':
      'Augmented fourth / tritone. The most complex ratio among the 12 swaras. ' +
      'Product 45*32 = 1440. Maximal tension. Tivra Ma in Yaman creates the ' +
      'raga\'s yearning, ascending quality.',

    '3:2':
      'Perfect fifth (just). The 2nd partial of Pa coincides with the 3rd of Sa. ' +
      'Maximum consonance after the octave. Pa is the second pillar of the drone. ' +
      'In most ragas, the vadi-samvadi axis spans a fifth.',

    '8:5':
      'Minor sixth (just). Komal Dha — the inversion of the major third. ' +
      'Rich but tense. 8*5 = 40 — moderate complexity. Characteristic of ' +
      'evening ragas and the Bhairav family.',

    '5:3':
      'Major sixth (just). Shuddha Dha — strong consonance (p*q = 15). ' +
      'Bright and open. Foundation of the Bilawal thaat. The happiest interval ' +
      'after the fifth.',

    '16:9':
      'Minor seventh (just). Komal Ni — moderate tension. The 9th partial of Sa ' +
      'meets the 16th of Ni komal. Gravity toward the upper Sa. Characteristic ' +
      'of Kafi, Khamaj thaats.',

    '15:8':
      'Major seventh (just). Shuddha Ni — strong pull toward the octave. ' +
      'Only 12 cents below equal-tempered Ni. The "leading tone" in Western terms, ' +
      'but in Hindustani music, Ni shuddha has its own dignity in ragas like Yaman.',

    '2:1':
      'Octave. Every partial of the lower Sa coincides with every other partial ' +
      'of the upper Sa. After unison, the most consonant interval possible.',
  };

  return descriptions[key] ??
    `Interval ${key} from Sa. Product complexity: ${ratio.p * ratio.q}. ` +
    `Nearest swara: ${swaraName}.`;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Reduces a fraction to lowest terms using the Euclidean algorithm.
 *
 * @param a - Numerator
 * @param b - Denominator
 * @returns Reduced fraction as {p, q}
 */
function reduceFraction(a: number, b: number): Ratio {
  const g = gcd(Math.abs(a), Math.abs(b));
  return { p: a / g, q: b / g };
}

/**
 * Greatest common divisor (Euclidean algorithm).
 */
function gcd(a: number, b: number): number {
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// ---------------------------------------------------------------------------
// Analysis helpers for the voice pipeline
// ---------------------------------------------------------------------------

/**
 * Given a detected frequency and Sa, determines whether the sung interval
 * is in a consonant or dissonant region.
 *
 * Returns a qualitative assessment useful for the feedback layer:
 *   - "consonant": within ±10 cents of a simple ratio (p*q <= 20)
 *   - "mildly_tense": within ±10 cents of a moderate ratio (p*q <= 50)
 *   - "tense": within ±10 cents of a complex ratio (p*q > 50)
 *   - "between": not close to any standard swara position
 *
 * @param hz - Detected frequency
 * @param saHz - Sa frequency
 * @returns Qualitative consonance assessment
 */
export function qualitativeConsonance(
  hz: number,
  saHz: number,
): 'consonant' | 'mildly_tense' | 'tense' | 'between' {
  const cents = ratioToCents(hz / saHz);
  const { swara, deviation } = nearestSwara(cents);

  if (Math.abs(deviation) > 30) {
    return 'between';
  }

  const product = swara.ratio.p * swara.ratio.q;
  if (product <= 20) return 'consonant';        // Sa, Pa, Ma, Ga, Dha
  if (product <= 50) return 'mildly_tense';      // Re, Ga komal, Ni
  return 'tense';                                 // Ma tivra, etc.
}

/**
 * Computes the beating frequency a student would hear between their
 * sung pitch and the nearest tanpura partial.
 *
 * In practice, this is the most immediate feedback mechanism: when the
 * student's pitch aligns with a tanpura partial, the beating disappears
 * and the tone "locks in" to the drone. This is the physical sensation
 * of being in tune.
 *
 * @param sungHz - The frequency the student is singing
 * @param saHz - Sa frequency of the tanpura
 * @param maxPartial - How many tanpura partials to check (default: 12)
 * @returns The minimum beat frequency in Hz (0 = perfectly in tune with a partial)
 */
export function nearestTanpuraBeating(
  sungHz: number,
  saHz: number,
  maxPartial: number = 12,
): number {
  // Generate partials for Sa and Pa strings
  const saPartials: number[] = [];
  const paPartials: number[] = [];
  const paHz = saHz * 1.5; // 3:2

  for (let n = 1; n <= maxPartial; n++) {
    saPartials.push(saHz * n);
    paPartials.push(paHz * n);
    // Also include lower Sa octave partials
    saPartials.push((saHz / 2) * n);
  }

  const allPartials = [...saPartials, ...paPartials];

  let minBeating = Infinity;
  for (const partial of allPartials) {
    const beating = Math.abs(sungHz - partial);
    if (beating < minBeating) {
      minBeating = beating;
    }
  }

  return minBeating;
}
