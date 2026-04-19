/**
 * harmonics.ts — Harmonic Series Mathematics
 *
 * The harmonic series is the foundation of all pitched sound. When a string
 * vibrates, it does not vibrate at a single frequency. It vibrates
 * simultaneously at integer multiples of its fundamental frequency:
 *
 *   f, 2f, 3f, 4f, 5f, 6f, ...
 *
 * These are the partials (or overtones). The first partial IS the fundamental.
 * The second partial is the octave (2:1). The third partial is the perfect
 * fifth of the octave above (3:1, which reduces to 3:2 within one octave).
 *
 * Every consonant interval in music arises from low-numbered ratios in this
 * series. This is not convention. This is physics.
 *
 * WHY Sa + Pa + Sa CREATES THE TANPURA REFERENCE DRONE
 * =====================================================
 * The tanpura's four strings are tuned: Pa(lower), Sa, Sa, Sa(upper octave).
 * Some tunings use: Ma, Sa, Sa, Sa(upper) for certain ragas.
 *
 * When these strings sound together:
 *   - Sa (fundamental f) produces partials: f, 2f, 3f, 4f, 5f, 6f ...
 *   - Pa (3/2 * f) produces partials: 3f/2, 3f, 9f/2, 6f, 15f/2, 9f ...
 *   - Sa upper (2f) produces partials: 2f, 4f, 6f, 8f, 10f, 12f ...
 *
 * Notice the massive overlap: 3f appears in ALL three strings. 6f appears
 * in all three. The partials reinforce each other at exact integer multiples,
 * creating a shimmering, stable harmonic field. The "jivari" (bridge curvature)
 * of the tanpura further enriches these overtones by allowing the string to
 * graze the bridge, exciting higher partials that would otherwise decay quickly.
 *
 * This harmonic field does not assert a melody. It asserts a tonal center.
 * Every swara the student sings is heard against this field, and its
 * consonance or dissonance is immediately audible as a physical phenomenon:
 * beating (interference) when frequencies are close but not aligned,
 * stillness when they lock into a harmonic ratio.
 *
 * WHY THE PERFECT FIFTH (3:2) IS THE MOST RESONANT INTERVAL
 * ==========================================================
 * Consonance correlates with the simplicity of the frequency ratio. The
 * octave (2:1) is the simplest non-unison interval: every other partial
 * of the lower note aligns with every partial of the upper note. The
 * perfect fifth (3:2) is next: their partials coincide at every 3rd
 * partial of the upper and every 2nd of the lower. The product p*q = 6
 * is the lowest product of any non-octave interval.
 *
 * In Helmholtz's framework: fewer coinciding partials = more "roughness"
 * from beating between nearby-but-not-identical frequencies. Pa (3:2)
 * has maximal partial overlap after the octave, hence maximal consonance.
 * This is why Pa is the second pillar of the tanpura drone, and why it
 * is the samvadi (consonant partner) in most ragas.
 *
 * @module engine/physics/harmonics
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single partial in a harmonic series, with its frequency and amplitude.
 */
export interface Partial {
  /** Partial number (1 = fundamental, 2 = first overtone, etc.) */
  readonly number: number;
  /** Frequency in Hz */
  readonly frequency: number;
  /** Relative amplitude (0..1), where 1 = fundamental amplitude */
  readonly amplitude: number;
}

/**
 * Configuration for a single tanpura string's overtone structure.
 *
 * The tanpura's unique timbre comes from the jivari bridge, which causes
 * the string to repeatedly graze the bridge surface. This excites higher
 * partials far more than a standard plucked string would produce, creating
 * the characteristic "buzzing" shimmer. The amplitude coefficients here
 * model this enriched spectrum.
 */
export interface TanpuraStringProfile {
  /** Name of the string (e.g., "Sa", "Pa", "Sa upper") */
  readonly name: string;
  /** Frequency ratio relative to Sa (e.g., 1 for Sa, 3/2 for Pa, 2 for Sa upper) */
  readonly ratio: number;
  /** Partials with their relative amplitudes, modelling jivari excitation */
  readonly partials: ReadonlyArray<Partial>;
}

// ---------------------------------------------------------------------------
// Core harmonic functions
// ---------------------------------------------------------------------------

/**
 * Returns the frequency ratio of the nth harmonic relative to the fundamental.
 *
 * The harmonic series is: 1, 2, 3, 4, 5, 6, ...
 * Each number n gives a ratio of n:1 relative to the fundamental.
 *
 * To find the interval within a single octave, divide by the largest power
 * of 2 that keeps the ratio >= 1. For example:
 *   - Harmonic 3 → 3/2 (perfect fifth)
 *   - Harmonic 5 → 5/4 (major third)
 *   - Harmonic 7 → 7/4 (harmonic seventh, not used in standard tuning)
 *
 * @param n - Harmonic number (must be >= 1)
 * @returns The ratio n:1 (NOT octave-reduced). For octave-reduced ratios,
 *          use {@link octaveReducedRatio}.
 * @throws {RangeError} if n < 1
 */
export function harmonicRatio(n: number): number {
  if (n < 1 || !Number.isInteger(n)) {
    throw new RangeError(`Harmonic number must be a positive integer, got ${n}`);
  }
  return n;
}

/**
 * Reduces a harmonic ratio into the range [1, 2) — i.e., within one octave
 * above the fundamental.
 *
 * Examples:
 *   - harmonicRatio(3) = 3 → octaveReducedRatio(3) = 3/2 (Pa)
 *   - harmonicRatio(5) = 5 → octaveReducedRatio(5) = 5/4 (Ga shuddha)
 *   - harmonicRatio(6) = 6 → octaveReducedRatio(6) = 3/2 (Pa again)
 *
 * @param n - Harmonic number (must be >= 1)
 * @returns The ratio in [1, 2)
 */
export function octaveReducedRatio(n: number): number {
  let ratio = harmonicRatio(n);
  while (ratio >= 2) {
    ratio /= 2;
  }
  return ratio;
}

/**
 * Computes the frequency of the nth partial given a fundamental frequency.
 *
 * The nth partial of a vibrating string is exactly n times the fundamental.
 * This is a consequence of the boundary conditions of a fixed-end string:
 * only standing waves with wavelengths lambda_n = 2L/n are permitted,
 * giving frequencies f_n = n * f_1.
 *
 * @param fundamental - Fundamental frequency in Hz
 * @param partial - Partial number (1 = fundamental)
 * @returns Frequency of the nth partial in Hz
 */
export function partialFrequency(fundamental: number, partial: number): number {
  if (fundamental <= 0) {
    throw new RangeError(`Fundamental frequency must be positive, got ${fundamental}`);
  }
  if (partial < 1 || !Number.isInteger(partial)) {
    throw new RangeError(`Partial number must be a positive integer, got ${partial}`);
  }
  return fundamental * partial;
}

/**
 * Generates the harmonic series up to `count` partials.
 *
 * @param fundamental - Fundamental frequency in Hz
 * @param count - Number of partials to generate (including fundamental)
 * @returns Array of frequencies [f, 2f, 3f, ..., count*f]
 */
export function harmonicSeries(fundamental: number, count: number): number[] {
  if (fundamental <= 0) {
    throw new RangeError(`Fundamental frequency must be positive, got ${fundamental}`);
  }
  if (count < 1 || !Number.isInteger(count)) {
    throw new RangeError(`Count must be a positive integer, got ${count}`);
  }

  const series: number[] = [];
  for (let n = 1; n <= count; n++) {
    series.push(fundamental * n);
  }
  return series;
}

// ---------------------------------------------------------------------------
// Amplitude model
// ---------------------------------------------------------------------------

/**
 * Models the amplitude of the nth partial of a vibrating string.
 *
 * For an ideal plucked string, the amplitude of the nth partial decays as
 * approximately 1/n (for a string plucked at its center) or 1/n^2 (for
 * other pluck positions). Real strings have additional damping.
 *
 * The tanpura is different: the jivari bridge causes the string to
 * repeatedly contact the bridge surface during vibration. This re-excites
 * higher partials, producing a flatter spectral envelope than a normal
 * plucked string. We model this with a modified decay:
 *
 *   A(n) = jivariBoost(n) / n^alpha
 *
 * where alpha < 1 (slower decay than ideal) and jivariBoost adds energy
 * to partials 2-6, which are most affected by bridge contact.
 *
 * @param partial - Partial number (1 = fundamental)
 * @param options - Optional configuration
 * @param options.tanpura - If true, use the jivari-enriched model (default: false)
 * @returns Relative amplitude in range (0, 1]
 */
export function overtoneAmplitude(
  partial: number,
  options: { tanpura?: boolean } = {},
): number {
  if (partial < 1 || !Number.isInteger(partial)) {
    throw new RangeError(`Partial number must be a positive integer, got ${partial}`);
  }

  if (options.tanpura) {
    return tanpuraPartialAmplitude(partial);
  }

  // Standard plucked string: 1/n decay
  return 1 / partial;
}

/**
 * Tanpura-specific partial amplitude model.
 *
 * The jivari bridge of the tanpura creates a characteristic spectral
 * signature where:
 *   - The fundamental is present but not dominant
 *   - Partials 2-5 are strongly excited (often louder than fundamental
 *     in certain phases of the string's vibration cycle)
 *   - Higher partials (6-10) sustain longer than on a normal string
 *   - The overall effect is a continuously shifting timbre as different
 *     partials wax and wane — the "living" quality of the tanpura
 *
 * These coefficients are derived from spectral analyses of tanpura
 * recordings (Sengupta, Dey, et al., "Acoustic Analysis of the Tanpura").
 *
 * @param partial - Partial number (1 = fundamental)
 * @returns Relative amplitude in (0, 1]
 */
function tanpuraPartialAmplitude(partial: number): number {
  // Empirically-derived amplitude coefficients for the tanpura.
  // The jivari effect peaks around partials 2-4, giving the tanpura
  // its characteristic "buzzing" brightness.
  const jivariCoefficients: ReadonlyArray<number> = [
    1.0,   // Partial 1: fundamental
    0.95,  // Partial 2: octave — strongly excited by jivari
    0.85,  // Partial 3: twelfth (octave + fifth) — very strong
    0.72,  // Partial 4: double octave
    0.58,  // Partial 5: major third two octaves up
    0.45,  // Partial 6: octave + fifth + octave
    0.33,  // Partial 7: harmonic seventh (slightly inharmonic on real strings)
    0.24,  // Partial 8: triple octave
    0.17,  // Partial 9
    0.12,  // Partial 10
  ];

  if (partial <= jivariCoefficients.length) {
    return jivariCoefficients[partial - 1]!;
  }

  // Beyond modeled partials: exponential decay
  return 0.12 * Math.pow(0.7, partial - 10);
}

// ---------------------------------------------------------------------------
// Tanpura string profiles
// ---------------------------------------------------------------------------

/**
 * Builds a complete partial profile for a single tanpura string.
 *
 * @param name - String name (e.g., "Sa", "Pa")
 * @param ratio - Frequency ratio relative to Sa
 * @param saHz - Sa frequency in Hz
 * @param partialCount - Number of partials to include
 * @returns A TanpuraStringProfile
 */
function buildTanpuraString(
  name: string,
  ratio: number,
  saHz: number,
  partialCount: number,
): TanpuraStringProfile {
  const fundamental = saHz * ratio;
  const partials: Partial[] = [];

  for (let n = 1; n <= partialCount; n++) {
    partials.push({
      number: n,
      frequency: fundamental * n,
      amplitude: tanpuraPartialAmplitude(n),
    });
  }

  return { name, ratio, partials };
}

/**
 * Generates the complete tanpura drone profile for a given Sa frequency.
 *
 * Standard tanpura tuning (for most ragas):
 *   String 1: Pa (low) — 3/2 of Sa, one octave below middle Sa
 *   String 2: Sa (middle)
 *   String 3: Sa (middle) — doubled for richness
 *   String 4: Sa (low) — one octave below middle Sa
 *
 * Some ragas (those using Ma as a strong note) replace the Pa string:
 *   String 1: Ma (shuddha) — 4/3 of Sa
 *
 * Each string is modeled with 10 partials using the jivari amplitude model.
 *
 * @param saHz - Sa frequency in Hz (default: 261.63, C4)
 * @param useMa - If true, replace Pa string with Ma shuddha (default: false)
 * @returns Array of 4 TanpuraStringProfile objects
 */
export function tanpuraPartials(
  saHz: number = 261.63,
  useMaOrGroundString: boolean | 'Pa' | 'Ma' | 'Ni' = false,
): ReadonlyArray<TanpuraStringProfile> {
  const PARTIAL_COUNT = 10;

  // Resolve groundString from either legacy boolean or new string literal
  let groundString: 'Pa' | 'Ma' | 'Ni';
  if (typeof useMaOrGroundString === 'boolean') {
    groundString = useMaOrGroundString ? 'Ma' : 'Pa';
  } else {
    groundString = useMaOrGroundString;
  }

  // Frequency ratios relative to Sa (just intonation):
  //   Pa  = 3/2  (perfect fifth)
  //   Ma  = 4/3  (perfect fourth — shuddha Ma)
  //   Ni  = 16/9 (komal Ni — minor seventh, the Bageshri tuning)
  const ratioMap: Record<'Pa' | 'Ma' | 'Ni', number> = {
    Pa: 3 / 2,
    Ma: 4 / 3,
    Ni: 16 / 9,
  };
  const nameMap: Record<'Pa' | 'Ma' | 'Ni', string> = {
    Pa: 'Pa',
    Ma: 'Ma (shuddha)',
    Ni: 'Ni (komal)',
  };

  const firstStringRatio = ratioMap[groundString];
  const firstStringName = nameMap[groundString];

  // The first string is in the lower octave: ratio / 2
  const firstString = buildTanpuraString(
    firstStringName,
    firstStringRatio / 2,
    saHz,
    PARTIAL_COUNT,
  );

  const secondString = buildTanpuraString('Sa', 1, saHz, PARTIAL_COUNT);
  const thirdString = buildTanpuraString('Sa', 1, saHz, PARTIAL_COUNT);

  // Fourth string: Sa one octave below
  const fourthString = buildTanpuraString('Sa (low)', 0.5, saHz, PARTIAL_COUNT);

  return [firstString, secondString, thirdString, fourthString];
}

// ---------------------------------------------------------------------------
// Interval helpers
// ---------------------------------------------------------------------------

/**
 * Converts a frequency ratio to cents.
 *
 * Cents are a logarithmic measure of musical intervals:
 *   cents = 1200 * log2(ratio)
 *
 * One octave = 1200 cents. One equal-temperament semitone = 100 cents.
 *
 * @param ratio - Frequency ratio (must be > 0)
 * @returns Interval size in cents
 */
export function ratioToCents(ratio: number): number {
  if (ratio <= 0) {
    throw new RangeError(`Ratio must be positive, got ${ratio}`);
  }
  return 1200 * Math.log2(ratio);
}

/**
 * Converts cents to a frequency ratio.
 *
 * @param cents - Interval size in cents
 * @returns Frequency ratio
 */
export function centsToRatio(cents: number): number {
  return Math.pow(2, cents / 1200);
}

/**
 * Computes the beat frequency between two tones.
 *
 * When two frequencies are close but not identical, the listener perceives
 * a pulsation (amplitude modulation) at the difference frequency. This is
 * the physical basis of "roughness" or dissonance for nearby frequencies.
 *
 * Beat frequency = |f1 - f2|
 *
 * In practice:
 *   - 0 Hz beating = perfect unison (or exact harmonic alignment)
 *   - < 4 Hz = gentle pulsation (pleasant vibrato-like quality)
 *   - 4-20 Hz = roughness zone (dissonant, unpleasant)
 *   - > 20 Hz = separate tones perceived
 *
 * @param freq1 - First frequency in Hz
 * @param freq2 - Second frequency in Hz
 * @returns Beat frequency in Hz (always >= 0)
 */
export function beatFrequency(freq1: number, freq2: number): number {
  return Math.abs(freq1 - freq2);
}
