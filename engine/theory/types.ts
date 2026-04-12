/**
 * @module engine/theory/types
 *
 * Core type definitions for the Sadhana music engine.
 *
 * These types encode the structure of Hindustani Classical Music as first-class
 * TypeScript constructs. Every raga, swara, tala, and ornament in the system
 * conforms to these types. They are not approximations — they are the grammar
 * of the tradition rendered in code.
 *
 * Naming convention: _k = komal (flat), _t = tivra (sharp).
 * Sa and Pa are achala (immovable) — they have no komal/tivra variants.
 */

// ---------------------------------------------------------------------------
// Swaras (Notes)
// ---------------------------------------------------------------------------

/**
 * The 12 swaras of Hindustani Classical Music.
 *
 * Seven shuddha (natural) swaras: Sa, Re, Ga, Ma, Pa, Dha, Ni.
 * Five vikrit (altered) swaras: Re_k, Ga_k, Ma_t, Dha_k, Ni_k.
 *
 * Sa and Pa are achala — they never change. The remaining five have
 * komal (lowered) or tivra (raised) variants.
 */
export type Swara =
  | 'Sa'
  | 'Re_k' | 'Re'
  | 'Ga_k' | 'Ga'
  | 'Ma' | 'Ma_t'
  | 'Pa'
  | 'Dha_k' | 'Dha'
  | 'Ni_k' | 'Ni';

/**
 * The three octave registers in Hindustani Classical Music.
 *
 * - mandra: lower octave (below the tonic)
 * - madhya: middle octave (the home octave, where most singing/playing occurs)
 * - taar: upper octave (above the middle)
 */
export type Octave = 'mandra' | 'madhya' | 'taar';

/**
 * A swara placed in a specific octave register.
 * This is the atomic unit of melodic notation in the engine.
 */
export interface SwaraNote {
  readonly swara: Swara;
  readonly octave: Octave;
}

// ---------------------------------------------------------------------------
// Swara metadata
// ---------------------------------------------------------------------------

/**
 * Complete metadata for a single swara, including its frequency ratio
 * in just intonation, deviation from equal temperament, and cultural context.
 */
export interface SwaraDefinition {
  /** Canonical engine symbol: 'Sa', 'Re_k', 'Ga', etc. */
  readonly symbol: Swara;
  /** Romanised Sanskrit name: Shadja, Komal Rishabh, etc. */
  readonly name: string;
  /** Devanagari: षड्ज, कोमल ऋषभ, etc. */
  readonly nameDevanagari: string;
  /** Abbreviated sargam notation: S, r, R, g, G, m, M, P, d, D, n, N */
  readonly sargamAbbr: string;
  /** Whether this is a shuddha (natural) swara. */
  readonly shuddha: boolean;
  /** Whether this swara is achala (immovable — Sa and Pa only). */
  readonly achala: boolean;
  /** Alternate names used in different traditions or texts. */
  readonly alternateNames: readonly string[];
  /**
   * Frequency ratio relative to Sa in just intonation.
   * Sa = 1/1 (1.0), Pa = 3/2 (1.5), etc.
   * These are the ratios from the harmonic series / Natya Shastra tradition.
   */
  readonly ratioNumerator: number;
  readonly ratioDenominator: number;
  /**
   * Cents above Sa in just intonation.
   * Calculated as 1200 * log2(ratio).
   */
  readonly centsFromSa: number;
  /**
   * Cents deviation from the nearest 12-TET (equal temperament) pitch.
   * Positive = sharper than ET, negative = flatter.
   */
  readonly centsDeviationFromET: number;
  /**
   * The nearest Western note name. Provided as a bridge for Western students,
   * never as the primary identity. A swara is not a Western note.
   */
  readonly westernNote: string;
  /**
   * Semitones above Sa in 12-TET. For reference only.
   */
  readonly semitonesFromSa: number;
}

// ---------------------------------------------------------------------------
// Ornaments (Alankar)
// ---------------------------------------------------------------------------

/**
 * The ornaments (alankar) of Hindustani Classical Music.
 * Each ornament is a specific technique for embellishing or connecting swaras.
 */
export type Ornament =
  | 'meend'    // Glide from one swara to another
  | 'gamak'    // Rapid oscillation around a swara
  | 'andolan'  // Subtle, slow shake — gentler than gamak
  | 'murki'    // Rapid 3-4 note ornament, very fast
  | 'khatka'   // Jerk or shake — quick, sharp ornament
  | 'zamzama'  // Extended rapid passage ornament
  | 'kan'      // Grace note — brief touch of adjacent swara before landing
  | 'sparsh';  // Touch — similar to kan but with different articulation

/**
 * Mathematical description of an ornament's sonic behaviour.
 * Used by the synthesis engine to generate ornaments and by the
 * analysis engine to detect them in student input.
 */
export interface OrnamentDefinition {
  /** The ornament type. */
  readonly type: Ornament;
  /** Sanskrit name with transliteration. */
  readonly name: string;
  /** Devanagari name. */
  readonly nameDevanagari: string;
  /** One-line description of the ornament's musical function. */
  readonly description: string;
  /**
   * The frequency trajectory shape.
   * - 'linear': straight-line glide between frequencies
   * - 'logarithmic': curved glide (more natural for meend)
   * - 'sinusoidal': oscillation (gamak, andolan)
   * - 'impulse': very brief spike (kan, sparsh)
   * - 'sequence': discrete sequence of pitches (murki, khatka, zamzama)
   */
  readonly trajectoryShape: 'linear' | 'logarithmic' | 'sinusoidal' | 'impulse' | 'sequence';
  /** Typical duration range in milliseconds. */
  readonly durationRangeMs: readonly [number, number];
  /**
   * For oscillating ornaments (gamak, andolan): oscillation rate in Hz.
   * For non-oscillating ornaments: undefined.
   */
  readonly oscillationRateHz?: readonly [number, number];
  /**
   * For oscillating ornaments: amplitude of oscillation in cents.
   * How far the pitch deviates from the centre swara.
   */
  readonly oscillationAmplitudeCents?: readonly [number, number];
  /**
   * For sequence ornaments (murki, khatka, zamzama): typical number of notes.
   */
  readonly noteCount?: readonly [number, number];
  /**
   * Ragas in which this ornament is characteristically used.
   * Empty array means it is used across many ragas.
   */
  readonly characteristicRagas: readonly string[];
  /**
   * Specific swaras on which this ornament is commonly applied.
   * Empty array means it can be applied to any swara.
   */
  readonly characteristicSwaras: readonly Swara[];
}

// ---------------------------------------------------------------------------
// Raga
// ---------------------------------------------------------------------------

/**
 * Raga jati — the classification by number of swaras.
 * - audava: 5 swaras (pentatonic)
 * - shadava: 6 swaras (hexatonic)
 * - sampoorna: 7 swaras (heptatonic)
 */
export type RagaJati = 'audava' | 'shadava' | 'sampoorna';

/**
 * The nine rasas (emotional essences) of Indian aesthetics.
 * A raga embodies one or more rasas.
 */
export type Rasa =
  | 'shant'     // Peace, tranquillity
  | 'karuna'    // Compassion, pathos
  | 'shringar'  // Love, beauty
  | 'veer'      // Heroism, courage
  | 'adbhut'    // Wonder, awe
  | 'bhayanak'  // Fear
  | 'raudra'    // Fury, anger
  | 'bibhatsa'  // Disgust
  | 'hasya';    // Humour, joy

/**
 * Prahara — the eight three-hour divisions of the day/night cycle.
 * Hindustani ragas are traditionally assigned to specific praharas.
 *
 * 1: 6am-9am (sunrise, early morning)
 * 2: 9am-12pm (late morning)
 * 3: 12pm-3pm (early afternoon)
 * 4: 3pm-6pm (late afternoon, approaching dusk)
 * 5: 6pm-9pm (early evening, dusk)
 * 6: 9pm-12am (late evening)
 * 7: 12am-3am (midnight, deep night)
 * 8: 3am-6am (pre-dawn, approaching sunrise)
 */
export type Prahara = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * The complete definition of a Hindustani Classical Raga.
 *
 * A raga is not a scale. It is a melodic framework with rules, personality,
 * emotional character, time association, and ornamental vocabulary. This
 * interface captures the raga as a complete musicological object.
 *
 * Every field is readonly — a raga's identity does not change at runtime.
 */
export interface Raga {
  /** Unique identifier, lowercase: 'yaman', 'bhairav', etc. */
  readonly id: string;
  /** Romanised Sanskrit name: Yaman, Bhairav, etc. */
  readonly name: string;
  /** Devanagari: यमन, भैरव, etc. */
  readonly nameDevanagari: string;
  /** The parent thaat (one of the 10 Bhatkhande thaats). */
  readonly thaat: string;

  /** Aroha — the ascending scale. Defines which swaras appear and in what order. */
  readonly aroha: readonly SwaraNote[];
  /** Avaroha — the descending scale. Often differs from the aroha. */
  readonly avaroha: readonly SwaraNote[];

  /**
   * Jati — the classification by note count in aroha and avaroha.
   * A sampoorna-audava raga has 7 notes ascending, 5 descending.
   */
  readonly jati: {
    readonly aroha: RagaJati;
    readonly avaroha: RagaJati;
  };

  /** Vadi — the most important swara, the king. Receives the most emphasis. */
  readonly vadi: Swara;
  /** Samvadi — the second most important swara, the minister. Consonant with the vadi. */
  readonly samvadi: Swara;
  /** Anuvadi — supporting swaras that are used but not emphasised. */
  readonly anuvadi: readonly Swara[];
  /** Varjit — forbidden swaras, omitted from this raga entirely. */
  readonly varjit: readonly Swara[];

  /**
   * Pakad — characteristic phrases that define the raga's identity.
   * These are the phrases a listener uses to recognise the raga.
   * Each phrase is an array of SwaraNote.
   */
  readonly pakad: readonly (readonly SwaraNote[])[];

  /** The praharas during which this raga is traditionally performed. */
  readonly prahara: readonly Prahara[];
  /** The rasas (emotional essences) this raga embodies. */
  readonly rasa: readonly Rasa[];
  /** The ornaments characteristically used in this raga. */
  readonly ornaments: readonly Ornament[];

  /**
   * A precise, evocative description of the raga's character.
   * Written for someone encountering the raga for the first time,
   * but accurate enough for a scholar.
   */
  readonly description: string;

  /**
   * A single sentence bridging to Western musical concepts.
   * Carefully worded: "Western listeners may notice..." not "This is like..."
   * A raga is not a Western scale.
   */
  readonly westernBridge: string;

  /** IDs of related ragas (similar swaras, same thaat, easily confused). */
  readonly relatedRagas: readonly string[];

  /** Notable differences in treatment across gharanas (schools). */
  readonly gharanaVariations?: string;
}

// ---------------------------------------------------------------------------
// Thaat
// ---------------------------------------------------------------------------

/**
 * A Bhatkhande Thaat — one of the 10 parent scales from which ragas derive.
 * The thaat system is an organisational framework, not a prescription.
 * A raga's identity comes from its movement, not just its thaat.
 */
export interface Thaat {
  /** Lowercase identifier: 'kalyan', 'bilawal', etc. */
  readonly id: string;
  /** Romanised name: Kalyan, Bilawal, etc. */
  readonly name: string;
  /** Devanagari: कल्याण, बिलावल, etc. */
  readonly nameDevanagari: string;
  /** The seven swaras of this thaat, in ascending order (Sa to Ni). */
  readonly swaras: readonly [Swara, Swara, Swara, Swara, Swara, Swara, Swara];
  /** Brief description of the thaat's character. */
  readonly description: string;
  /** IDs of well-known ragas belonging to this thaat. */
  readonly commonRagas: readonly string[];
}

// ---------------------------------------------------------------------------
// Tala
// ---------------------------------------------------------------------------

/**
 * A tala bol — one syllable of the rhythmic pattern.
 * These are the syllables spoken when reciting the theka.
 */
export type TalaBol = string;

/**
 * A clap type indicating the hand gesture for each vibhag.
 * - 'tali': clap (stressed beat)
 * - 'khali': wave / empty (unstressed beat)
 * - 'sam': the first beat of the cycle (always tali, the anchor)
 */
export type ClapType = 'tali' | 'khali' | 'sam';

/**
 * The complete definition of a Hindustani Classical Tala (rhythmic cycle).
 */
export interface Tala {
  /** Unique identifier: 'teentaal', 'ektaal', etc. */
  readonly id: string;
  /** Romanised name: Teentaal, Ektaal, etc. */
  readonly name: string;
  /** Devanagari: तीनताल, एकताल, etc. */
  readonly nameDevanagari: string;

  /** Total number of beats (matras) in one cycle (avartan). */
  readonly beats: number;

  /**
   * Division structure — how many beats per vibhag (section).
   * For Teentaal: [4, 4, 4, 4] — four sections of 4 beats each.
   */
  readonly vibhag: readonly number[];

  /**
   * The beat number of sam — the first and most important beat.
   * Always 1 in standard notation.
   */
  readonly sam: number;

  /**
   * The beat number(s) of khali — the empty/unstressed beat(s).
   * In Teentaal, khali falls on beat 9.
   */
  readonly khali: readonly number[];

  /**
   * The clap pattern for each vibhag.
   * First vibhag is always 'sam'. Others are 'tali' or 'khali'.
   */
  readonly clapPattern: readonly ClapType[];

  /**
   * The theka — the basic rhythmic pattern of tabla bols.
   * One bol per beat, defining the tala's signature sound.
   */
  readonly theka: readonly TalaBol[];

  /** Brief description of the tala's character and common usage. */
  readonly description: string;
}

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tala utilities
// ---------------------------------------------------------------------------

/**
 * A single beat event in a generated theka, with timing information.
 * Used by the synthesis/tala-engine for scheduling tabla sounds.
 */
export interface TalaEvent {
  /** Beat number within the cycle (1-indexed). */
  readonly beat: number;
  /** The tabla bol (syllable) at this beat. */
  readonly bol: TalaBol;
  /** Time in seconds from the start of the cycle when this beat occurs. */
  readonly timeSeconds: number;
  /** Whether this beat is sam (the first/anchor beat). */
  readonly isSam: boolean;
  /** Whether this beat is khali (the empty/unstressed beat). */
  readonly isKhali: boolean;
  /** The clap type for the vibhag this beat belongs to. */
  readonly clapType: ClapType;
}

/**
 * Position information for a beat within the tala's vibhag structure.
 */
export interface VibhagPosition {
  /** The vibhag index (0-based). */
  readonly vibhagIndex: number;
  /** The beat's position within its vibhag (0-based). */
  readonly beatInVibhag: number;
  /** Whether this beat is sam. */
  readonly isSam: boolean;
  /** Whether this beat is khali. */
  readonly isKhali: boolean;
  /** The clap type for this vibhag. */
  readonly clapType: ClapType;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * A helper to create a SwaraNote concisely.
 * Usage: n('Ga', 'madhya') or n('Re_k', 'taar')
 */
export function n(swara: Swara, octave: Octave = 'madhya'): SwaraNote {
  return { swara, octave };
}
