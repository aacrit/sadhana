/**
 * @module engine/synthesis/voice/voice-presets
 *
 * TantriVoice(TM) — Named voice configurations.
 *
 * Four standard voice types (baritone, tenor, alto, soprano) plus
 * Hindustani-specific variants that capture the characteristic timbral
 * quality of trained HCM vocalists.
 *
 * Each preset defines:
 *   - Fundamental frequency range (Sa placement)
 *   - Default source parameters (spectral tilt, open quotient)
 *   - ADSR envelope characteristics
 *   - Vibrato parameters (HCM-specific: no continuous Western vibrato)
 *   - Register transition boundaries
 */

import type { VoiceType } from './formants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Frequency range definition for a voice type.
 */
export interface VoiceRange {
  readonly type: VoiceType;
  readonly label: string;
  readonly labelDevanagari: string;
  /** Minimum comfortable f0 in Hz */
  readonly minHz: number;
  /** Maximum comfortable f0 in Hz */
  readonly maxHz: number;
  /** Default Sa for this voice type */
  readonly defaultSaHz: number;
  /** Register transition: chest to mixed */
  readonly chestToMixedHz: number;
  /** Register transition: mixed to head */
  readonly mixedToHeadHz: number;
}

/**
 * ADSR envelope for vocal onset/sustain/release.
 * Singing has different envelope characteristics than instruments.
 */
export interface VocalEnvelope {
  /** Attack time in seconds — vocal onset is slower than harmonium */
  readonly attack: number;
  /** Decay time in seconds */
  readonly decay: number;
  /** Sustain level (0-1) — voice sustains very close to peak */
  readonly sustain: number;
  /** Release time in seconds — natural voice fade */
  readonly release: number;
}

/**
 * Complete voice preset: everything needed to instantiate a VocalSynth.
 */
export interface VoicePreset {
  readonly voiceType: VoiceType;
  readonly range: VoiceRange;
  readonly envelope: VocalEnvelope;
  /** Source parameters */
  readonly source: {
    /** Spectral tilt exponent */
    readonly spectralTilt: number;
    /** Open quotient */
    readonly openQuotient: number;
    /** Harmonic count for PeriodicWave */
    readonly harmonicCount: number;
  };
  /** Vibrato parameters (HCM: ornament-driven, not continuous) */
  readonly vibrato: {
    /** Whether vibrato is on by default (false for HCM) */
    readonly defaultEnabled: boolean;
    /** Rate in Hz */
    readonly rate: number;
    /** Depth in cents */
    readonly depthCents: number;
    /** Onset delay in seconds (vibrato starts after this) */
    readonly onsetDelay: number;
  };
  /** Micro-fluctuation for liveliness (not vibrato — slower, subtler) */
  readonly liveliness: {
    /** Pitch fluctuation rate in Hz */
    readonly pitchRate: number;
    /** Pitch fluctuation depth in cents */
    readonly pitchDepthCents: number;
    /** Amplitude fluctuation rate in Hz */
    readonly ampRate: number;
    /** Amplitude fluctuation depth in dB */
    readonly ampDepthDb: number;
  };
}

// ---------------------------------------------------------------------------
// Voice ranges
// ---------------------------------------------------------------------------

export const VOICE_RANGES: Record<VoiceType, VoiceRange> = {
  baritone: {
    type: 'baritone',
    label: 'Male (Baritone)',
    labelDevanagari: 'पुरुष (बैरिटोन)',
    minHz: 100,
    maxHz: 350,
    defaultSaHz: 130.81, // C3
    chestToMixedHz: 260,
    mixedToHeadHz: 350,
  },
  tenor: {
    type: 'tenor',
    label: 'Male (Tenor)',
    labelDevanagari: 'पुरुष (टेनर)',
    minHz: 130,
    maxHz: 500,
    defaultSaHz: 196.0, // G3 — most common male HCM Sa
    chestToMixedHz: 330,
    mixedToHeadHz: 500,
  },
  alto: {
    type: 'alto',
    label: 'Female (Alto)',
    labelDevanagari: 'स्त्री (ऑल्टो)',
    minHz: 175,
    maxHz: 700,
    defaultSaHz: 261.63, // C4
    chestToMixedHz: 400,
    mixedToHeadHz: 600,
  },
  soprano: {
    type: 'soprano',
    label: 'Female (Soprano)',
    labelDevanagari: 'स्त्री (सोप्रानो)',
    minHz: 250,
    maxHz: 1050,
    defaultSaHz: 329.63, // E4
    chestToMixedHz: 500,
    mixedToHeadHz: 800,
  },
};

// ---------------------------------------------------------------------------
// Standard presets
// ---------------------------------------------------------------------------

/**
 * Hindustani male voice — baritone variant.
 * Models the open-throated, chest-resonant male khayal voice.
 * Reference: Pandit Jasraj, Ustad Amir Khan timbral quality.
 */
const HINDUSTANI_MALE_BARITONE: VoicePreset = {
  voiceType: 'baritone',
  range: VOICE_RANGES.baritone,
  envelope: {
    attack: 0.12,   // Vocal onset — gentle, like breath becoming tone
    decay: 0.10,
    sustain: 0.92,  // Voice sustains very close to peak
    release: 0.25,  // Natural voice fade back into tanpura
  },
  source: {
    spectralTilt: 1.2,  // Rich chest voice
    openQuotient: 0.50, // Slightly pressed — khayal intensity
    harmonicCount: 48,
  },
  vibrato: {
    defaultEnabled: false, // HCM: no continuous vibrato
    rate: 5.0,
    depthCents: 15,
    onsetDelay: 0.3,
  },
  liveliness: {
    pitchRate: 0.7,
    pitchDepthCents: 4,
    ampRate: 0.4,
    ampDepthDb: 1.5,
  },
};

/**
 * Hindustani male voice — tenor variant.
 * Brighter, more agile than baritone.
 * Reference: Pandit Bhimsen Joshi timbral quality.
 */
const HINDUSTANI_MALE_TENOR: VoicePreset = {
  voiceType: 'tenor',
  range: VOICE_RANGES.tenor,
  envelope: {
    attack: 0.10,
    decay: 0.08,
    sustain: 0.90,
    release: 0.20,
  },
  source: {
    spectralTilt: 1.3,
    openQuotient: 0.55,
    harmonicCount: 48,
  },
  vibrato: {
    defaultEnabled: false,
    rate: 5.5,
    depthCents: 18,
    onsetDelay: 0.25,
  },
  liveliness: {
    pitchRate: 0.8,
    pitchDepthCents: 4,
    ampRate: 0.5,
    ampDepthDb: 1.2,
  },
};

/**
 * Hindustani female voice — alto variant.
 * Warm, substantial, with remarkable timbral continuity across registers.
 * Reference: Kishori Amonkar timbral quality.
 */
const HINDUSTANI_FEMALE_ALTO: VoicePreset = {
  voiceType: 'alto',
  range: VOICE_RANGES.alto,
  envelope: {
    attack: 0.08,
    decay: 0.08,
    sustain: 0.93,
    release: 0.22,
  },
  source: {
    spectralTilt: 1.4,
    openQuotient: 0.58,
    harmonicCount: 48,
  },
  vibrato: {
    defaultEnabled: false,
    rate: 5.5,
    depthCents: 20,
    onsetDelay: 0.25,
  },
  liveliness: {
    pitchRate: 0.9,
    pitchDepthCents: 5,
    ampRate: 0.5,
    ampDepthDb: 1.0,
  },
};

/**
 * Hindustani female voice — soprano variant.
 * Light, agile, excellent for murki and taan.
 * Reference: Ashwini Bhide-Deshpande timbral quality.
 */
const HINDUSTANI_FEMALE_SOPRANO: VoicePreset = {
  voiceType: 'soprano',
  range: VOICE_RANGES.soprano,
  envelope: {
    attack: 0.06,
    decay: 0.06,
    sustain: 0.94,
    release: 0.18,
  },
  source: {
    spectralTilt: 1.5,
    openQuotient: 0.62,
    harmonicCount: 48,
  },
  vibrato: {
    defaultEnabled: false,
    rate: 6.0,
    depthCents: 22,
    onsetDelay: 0.20,
  },
  liveliness: {
    pitchRate: 1.0,
    pitchDepthCents: 5,
    ampRate: 0.6,
    ampDepthDb: 0.8,
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * All voice presets indexed by voice type.
 */
export const VOICE_PRESETS: Record<VoiceType, VoicePreset> = {
  baritone: HINDUSTANI_MALE_BARITONE,
  tenor: HINDUSTANI_MALE_TENOR,
  alto: HINDUSTANI_FEMALE_ALTO,
  soprano: HINDUSTANI_FEMALE_SOPRANO,
};

/**
 * Get the voice preset for a voice type.
 */
export function getVoicePreset(voiceType: VoiceType): VoicePreset {
  return VOICE_PRESETS[voiceType];
}

/**
 * Infer the best voice type from a detected Sa frequency.
 * Used during onboarding when the student sings their Sa.
 */
export function inferVoiceType(saHz: number): VoiceType {
  if (saHz < 165) return 'baritone';
  if (saHz < 220) return 'tenor';
  if (saHz < 330) return 'alto';
  return 'soprano';
}

/**
 * Get all available voice presets as an array.
 */
export function getAllPresets(): readonly VoicePreset[] {
  return [
    HINDUSTANI_MALE_BARITONE,
    HINDUSTANI_MALE_TENOR,
    HINDUSTANI_FEMALE_ALTO,
    HINDUSTANI_FEMALE_SOPRANO,
  ];
}
