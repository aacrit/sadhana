/**
 * @module engine/synthesis/voice/formants
 *
 * TantriVoice(TM) — Formant data tables for human vocal synthesis.
 *
 * The human voice is a source-filter system: the vocal folds produce a
 * harmonic buzz (the source), and the vocal tract resonances (formants)
 * shape that buzz into recognizable vowels. This module contains the
 * formant frequency, bandwidth, and amplitude data for all vowels used
 * in Hindustani sargam singing and multi-language lyric synthesis.
 *
 * Data sources:
 *   - Peterson & Barney (1952): foundational vowel formant measurements
 *   - Hillenbrand et al. (1995): updated formant data across voice types
 *   - Sundberg (1977): "The Science of the Singing Voice" — singing-specific
 *     formant adjustments (raised F1, singer's formant cluster)
 *   - Sengupta & Dey: Indian male vocalist formant analysis
 *
 * Singing formants differ from speech formants:
 *   - F1 is raised 50-100 Hz (wider jaw opening)
 *   - Singer's Formant cluster (F3/F4/F5 ~2500-3200 Hz) adds brilliance
 *   - Nasal coupling is greater in Hindustani classical than Western opera
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single formant: a resonance peak in the vocal tract.
 * The human voice has 3-5 significant formants.
 */
export interface Formant {
  /** Centre frequency in Hz */
  readonly frequency: number;
  /** Bandwidth in Hz (narrower = more resonant) */
  readonly bandwidth: number;
  /** Amplitude/gain in dB (for peaking filter) */
  readonly gainDb: number;
}

/**
 * Complete formant set for a vowel at a specific voice type.
 * Five formants cover the full vocal tract resonance structure.
 */
export interface FormantSet {
  readonly f1: Formant;
  readonly f2: Formant;
  readonly f3: Formant;
  readonly f4: Formant;
  readonly f5: Formant;
}

/**
 * Singer's formant parameters — the spectral peak that gives a
 * trained voice its "ring" and projection.
 */
export interface SingerFormant {
  /** Centre frequency in Hz (male ~2800, female ~3200) */
  readonly frequency: number;
  /** Q factor (male ~7, female ~6.4) */
  readonly q: number;
  /** Gain in dB */
  readonly gainDb: number;
}

/**
 * Nasal resonance parameters — characteristic of HCM singing.
 * Models the anti-resonance from velopharyngeal coupling.
 */
export interface NasalResonance {
  /** Anti-resonance (notch) frequency in Hz */
  readonly notchFrequency: number;
  /** Notch Q factor */
  readonly notchQ: number;
  /** Notch depth in dB (negative) */
  readonly notchGainDb: number;
  /** Nasal pole frequency */
  readonly poleFrequency: number;
  /** Nasal pole Q */
  readonly poleQ: number;
  /** Nasal pole gain in dB */
  readonly poleGainDb: number;
}

/**
 * Vocal register — the physiological mode of the vocal folds.
 */
export type VocalRegister = 'chest' | 'mixed' | 'head';

/**
 * Voice type identifier.
 */
export type VoiceType = 'baritone' | 'tenor' | 'alto' | 'soprano';

/**
 * Vowel identifier for formant lookup.
 *
 * Core sargam vowels:
 *   'aa' — open /a:/ — Sa, Ga, Ma, Pa, Dha (primary singing vowel)
 *   'ee' — close front /i:/ — Ni ("nee"), partial Re ("ree")
 *   'oo' — close back /u:/ — occasional thumri/bhajan
 *
 * Extended for multi-language:
 *   'eh' — mid front /e/ — Re in some styles
 *   'oh' — mid back /o/ — for Hindi/Marathi words
 *   'uh' — mid central /ə/ — schwa, common in Hindi
 */
export type Vowel = 'aa' | 'ee' | 'oo' | 'eh' | 'oh' | 'uh';

// ---------------------------------------------------------------------------
// Formant tables — Male voice (baritone/tenor)
// ---------------------------------------------------------------------------

/**
 * Male formant table.
 * Values from Peterson & Barney (1952), adjusted for singing voice
 * per Sundberg (1977): F1 raised ~50Hz, singer's formant cluster.
 */
/**
 * Gains scaled for SERIES peaking filters.  Speech-spectroscopy values
 * (20+ dB) describe the total spectral envelope; in a series chain each
 * filter's gainDb must be moderate (6-12 dB) to avoid peaky over-boost
 * at individual harmonics while keeping the overall signal audible.
 */
const MALE_FORMANTS: Record<Vowel, FormantSet> = {
  aa: {
    f1: { frequency: 730, bandwidth: 80, gainDb: 10 },
    f2: { frequency: 1090, bandwidth: 90, gainDb: 8 },
    f3: { frequency: 2440, bandwidth: 120, gainDb: 6 },
    f4: { frequency: 3400, bandwidth: 130, gainDb: 4 },
    f5: { frequency: 4500, bandwidth: 140, gainDb: 2 },
  },
  ee: {
    f1: { frequency: 270, bandwidth: 60, gainDb: 12 },
    f2: { frequency: 2290, bandwidth: 100, gainDb: 6 },
    f3: { frequency: 3010, bandwidth: 130, gainDb: 4 },
    f4: { frequency: 3300, bandwidth: 140, gainDb: 4 },
    f5: { frequency: 4500, bandwidth: 140, gainDb: 2 },
  },
  oo: {
    f1: { frequency: 300, bandwidth: 60, gainDb: 12 },
    f2: { frequency: 870, bandwidth: 80, gainDb: 8 },
    f3: { frequency: 2240, bandwidth: 120, gainDb: 6 },
    f4: { frequency: 3400, bandwidth: 130, gainDb: 4 },
    f5: { frequency: 4500, bandwidth: 140, gainDb: 2 },
  },
  eh: {
    f1: { frequency: 530, bandwidth: 70, gainDb: 11 },
    f2: { frequency: 1840, bandwidth: 95, gainDb: 6 },
    f3: { frequency: 2480, bandwidth: 120, gainDb: 5 },
    f4: { frequency: 3400, bandwidth: 130, gainDb: 4 },
    f5: { frequency: 4500, bandwidth: 140, gainDb: 2 },
  },
  oh: {
    f1: { frequency: 570, bandwidth: 75, gainDb: 11 },
    f2: { frequency: 840, bandwidth: 80, gainDb: 8 },
    f3: { frequency: 2410, bandwidth: 120, gainDb: 6 },
    f4: { frequency: 3400, bandwidth: 130, gainDb: 4 },
    f5: { frequency: 4500, bandwidth: 140, gainDb: 2 },
  },
  uh: {
    f1: { frequency: 640, bandwidth: 75, gainDb: 11 },
    f2: { frequency: 1190, bandwidth: 90, gainDb: 7 },
    f3: { frequency: 2390, bandwidth: 120, gainDb: 6 },
    f4: { frequency: 3400, bandwidth: 130, gainDb: 4 },
    f5: { frequency: 4500, bandwidth: 140, gainDb: 2 },
  },
};

// ---------------------------------------------------------------------------
// Formant tables — Female voice (alto/soprano)
// ---------------------------------------------------------------------------

/**
 * Female formant table.
 * All formants shifted upward ~17% from male (shorter vocal tract:
 * 14.5 cm vs 17 cm). F_female ~ F_male * 1.17.
 */
const FEMALE_FORMANTS: Record<Vowel, FormantSet> = {
  aa: {
    f1: { frequency: 850, bandwidth: 90, gainDb: 10 },
    f2: { frequency: 1220, bandwidth: 100, gainDb: 8 },
    f3: { frequency: 2810, bandwidth: 140, gainDb: 6 },
    f4: { frequency: 3800, bandwidth: 150, gainDb: 4 },
    f5: { frequency: 5000, bandwidth: 160, gainDb: 2 },
  },
  ee: {
    f1: { frequency: 310, bandwidth: 70, gainDb: 12 },
    f2: { frequency: 2790, bandwidth: 110, gainDb: 6 },
    f3: { frequency: 3310, bandwidth: 150, gainDb: 4 },
    f4: { frequency: 3750, bandwidth: 160, gainDb: 4 },
    f5: { frequency: 5000, bandwidth: 160, gainDb: 2 },
  },
  oo: {
    f1: { frequency: 370, bandwidth: 70, gainDb: 12 },
    f2: { frequency: 950, bandwidth: 90, gainDb: 8 },
    f3: { frequency: 2670, bandwidth: 140, gainDb: 6 },
    f4: { frequency: 3800, bandwidth: 150, gainDb: 4 },
    f5: { frequency: 5000, bandwidth: 160, gainDb: 2 },
  },
  eh: {
    f1: { frequency: 610, bandwidth: 80, gainDb: 11 },
    f2: { frequency: 2150, bandwidth: 105, gainDb: 6 },
    f3: { frequency: 2900, bandwidth: 140, gainDb: 5 },
    f4: { frequency: 3800, bandwidth: 150, gainDb: 4 },
    f5: { frequency: 5000, bandwidth: 160, gainDb: 2 },
  },
  oh: {
    f1: { frequency: 660, bandwidth: 85, gainDb: 11 },
    f2: { frequency: 980, bandwidth: 90, gainDb: 8 },
    f3: { frequency: 2820, bandwidth: 140, gainDb: 6 },
    f4: { frequency: 3800, bandwidth: 150, gainDb: 4 },
    f5: { frequency: 5000, bandwidth: 160, gainDb: 2 },
  },
  uh: {
    f1: { frequency: 740, bandwidth: 85, gainDb: 11 },
    f2: { frequency: 1390, bandwidth: 100, gainDb: 7 },
    f3: { frequency: 2790, bandwidth: 140, gainDb: 6 },
    f4: { frequency: 3800, bandwidth: 150, gainDb: 4 },
    f5: { frequency: 5000, bandwidth: 160, gainDb: 2 },
  },
};

// ---------------------------------------------------------------------------
// Singer's formant — per voice type
// ---------------------------------------------------------------------------

const SINGER_FORMANTS: Record<VoiceType, SingerFormant> = {
  baritone: { frequency: 2700, q: 7.0, gainDb: 8 },
  tenor: { frequency: 2800, q: 7.0, gainDb: 7 },
  alto: { frequency: 3100, q: 6.5, gainDb: 7 },
  soprano: { frequency: 3200, q: 6.4, gainDb: 6 },
};

// ---------------------------------------------------------------------------
// Nasal resonance — per gender (HCM has higher nasal coupling)
// ---------------------------------------------------------------------------

const NASAL_RESONANCE_MALE: NasalResonance = {
  notchFrequency: 1000,
  notchQ: 5.0,
  notchGainDb: -8,
  poleFrequency: 300,
  poleQ: 3.0,
  poleGainDb: 4,
};

const NASAL_RESONANCE_FEMALE: NasalResonance = {
  notchFrequency: 1100,
  notchQ: 5.0,
  notchGainDb: -8,
  poleFrequency: 350,
  poleQ: 3.0,
  poleGainDb: 4,
};

// ---------------------------------------------------------------------------
// Per-swara vowel mapping for sargam singing
// ---------------------------------------------------------------------------

/**
 * Each sargam syllable maps to a specific vowel blend.
 * The blend factor interpolates between two vowel formant sets.
 */
export interface SwaraVowelMapping {
  /** Primary vowel */
  readonly primary: Vowel;
  /** Secondary vowel for blending (null = pure primary) */
  readonly secondary: Vowel | null;
  /** Blend factor: 0 = pure primary, 1 = pure secondary */
  readonly blend: number;
  /** Nasal coupling factor: 0 = none, 1 = maximum */
  readonly nasalCoupling: number;
}

import type { Swara } from '../../theory/types';

/**
 * Per-swara vowel mapping for Hindustani sargam singing.
 * Each swara name encodes a specific mouth shape and resonance.
 */
export const SWARA_VOWEL_MAP: Record<Swara, SwaraVowelMapping> = {
  Sa:    { primary: 'aa', secondary: null,  blend: 0,    nasalCoupling: 0.10 },
  Re_k:  { primary: 'aa', secondary: 'eh', blend: 0.30, nasalCoupling: 0.10 },
  Re:    { primary: 'aa', secondary: 'eh', blend: 0.30, nasalCoupling: 0.10 },
  Ga_k:  { primary: 'aa', secondary: null,  blend: 0,    nasalCoupling: 0.10 },
  Ga:    { primary: 'aa', secondary: null,  blend: 0,    nasalCoupling: 0.10 },
  Ma:    { primary: 'aa', secondary: null,  blend: 0,    nasalCoupling: 0.40 },
  Ma_t:  { primary: 'aa', secondary: null,  blend: 0,    nasalCoupling: 0.40 },
  Pa:    { primary: 'aa', secondary: null,  blend: 0,    nasalCoupling: 0.10 },
  Dha_k: { primary: 'aa', secondary: null,  blend: 0,    nasalCoupling: 0.15 },
  Dha:   { primary: 'aa', secondary: null,  blend: 0,    nasalCoupling: 0.15 },
  Ni_k:  { primary: 'ee', secondary: 'aa', blend: 0.30, nasalCoupling: 0.30 },
  Ni:    { primary: 'ee', secondary: 'aa', blend: 0.30, nasalCoupling: 0.30 },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the formant set for a vowel and voice type.
 */
export function getFormantSet(vowel: Vowel, voiceType: VoiceType): FormantSet {
  const isMale = voiceType === 'baritone' || voiceType === 'tenor';
  return isMale ? MALE_FORMANTS[vowel] : FEMALE_FORMANTS[vowel];
}

/**
 * Get the singer's formant parameters for a voice type.
 */
export function getSingerFormant(voiceType: VoiceType): SingerFormant {
  return SINGER_FORMANTS[voiceType];
}

/**
 * Get nasal resonance parameters for a voice type.
 */
export function getNasalResonance(voiceType: VoiceType): NasalResonance {
  const isMale = voiceType === 'baritone' || voiceType === 'tenor';
  return isMale ? NASAL_RESONANCE_MALE : NASAL_RESONANCE_FEMALE;
}

/**
 * Get the vowel mapping for a specific swara in sargam mode.
 */
export function getSwaraVowel(swara: Swara): SwaraVowelMapping {
  return SWARA_VOWEL_MAP[swara];
}

/**
 * Interpolate between two formant sets.
 * Used for vowel blending (e.g., Re is 70% "aa" + 30% "eh").
 */
export function interpolateFormants(
  a: FormantSet,
  b: FormantSet,
  t: number,
): FormantSet {
  const lerp = (x: number, y: number) => x * (1 - t) + y * t;
  const lerpFormant = (fa: Formant, fb: Formant): Formant => ({
    frequency: lerp(fa.frequency, fb.frequency),
    bandwidth: lerp(fa.bandwidth, fb.bandwidth),
    gainDb: lerp(fa.gainDb, fb.gainDb),
  });
  return {
    f1: lerpFormant(a.f1, b.f1),
    f2: lerpFormant(a.f2, b.f2),
    f3: lerpFormant(a.f3, b.f3),
    f4: lerpFormant(a.f4, b.f4),
    f5: lerpFormant(a.f5, b.f5),
  };
}

/**
 * Get the resolved formant set for a swara in a specific voice type.
 * Handles vowel blending automatically.
 */
export function getFormantSetForSwara(swara: Swara, voiceType: VoiceType): FormantSet {
  const mapping = getSwaraVowel(swara);
  const primary = getFormantSet(mapping.primary, voiceType);
  if (!mapping.secondary || mapping.blend === 0) return primary;
  const secondary = getFormantSet(mapping.secondary, voiceType);
  return interpolateFormants(primary, secondary, mapping.blend);
}

/**
 * Apply first-formant tuning for high pitches.
 * When f0 exceeds F1, raise F1 to track f0 (soprano technique).
 */
export function applyFormantTuning(formants: FormantSet, f0Hz: number): FormantSet {
  if (f0Hz <= formants.f1.frequency) return formants;
  return {
    ...formants,
    f1: { ...formants.f1, frequency: f0Hz * 1.1 },
  };
}

/**
 * Register transition parameters for blending source characteristics.
 */
export interface RegisterParams {
  readonly register: VocalRegister;
  /** Spectral tilt in dB/octave — steeper = breathier */
  readonly spectralTilt: number;
  /** Open quotient — fraction of glottal cycle where folds are open */
  readonly openQuotient: number;
  /** Jitter: random pitch variation (0-3%) */
  readonly jitterPercent: number;
  /** Shimmer: random amplitude variation (0-5%) */
  readonly shimmerPercent: number;
}

/**
 * Get register parameters based on fundamental frequency and voice type.
 */
export function getRegisterParams(f0Hz: number, voiceType: VoiceType): RegisterParams {
  const ranges: Record<VoiceType, { chestToMixed: number; mixedToHead: number }> = {
    baritone: { chestToMixed: 260, mixedToHead: 350 },
    tenor: { chestToMixed: 330, mixedToHead: 500 },
    alto: { chestToMixed: 400, mixedToHead: 600 },
    soprano: { chestToMixed: 500, mixedToHead: 800 },
  };

  const range = ranges[voiceType];

  if (f0Hz < range.chestToMixed) {
    return {
      register: 'chest',
      spectralTilt: 1.2,
      openQuotient: 0.50,
      jitterPercent: 0.5,
      shimmerPercent: 1.0,
    };
  } else if (f0Hz < range.mixedToHead) {
    return {
      register: 'mixed',
      spectralTilt: 1.5,
      openQuotient: 0.57,
      jitterPercent: 0.8,
      shimmerPercent: 1.2,
    };
  } else {
    return {
      register: 'head',
      spectralTilt: 1.8,
      openQuotient: 0.65,
      jitterPercent: 1.2,
      shimmerPercent: 1.5,
    };
  }
}
