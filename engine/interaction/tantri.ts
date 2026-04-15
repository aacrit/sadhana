/**
 * @module engine/interaction/tantri
 *
 * Tantri (तन्त्री) — "string of a veena."
 *
 * The Tantri engine is an interactive swara string field: 12 horizontal strings,
 * one per chromatic swara, positioned by just-intonation frequency ratio on a
 * logarithmic scale. Each string is simultaneously:
 *
 *   INPUT  — vibrates when the student's voice is near that swara's frequency.
 *            Amplitude encodes vocal intensity. Color encodes pitch accuracy.
 *
 *   OUTPUT — touch/click triggers the harmonium synthesis of that swara.
 *            Spring physics: Kan snap on contact, Tanpura Release decay on release.
 *
 * This module is pure TypeScript. Zero UI. Zero DOM. It produces typed state
 * objects that a renderer (Canvas, SVG, WebGL) consumes.
 *
 * Architecture:
 *   1. TantriField — the 12-string instrument, configured for a Sa and optional raga
 *   2. mapVoiceToStrings() — maps detected pitch to string vibration states
 *   3. triggerString() — produces a touch interaction event for synthesis
 *   4. updateRagaContext() — reshapes the field when the raga changes
 *   5. getVisibleStrings() — filters by journey level (progressive disclosure)
 */

import type { Swara, Octave, Raga, SwaraNote } from '../theory/types';
import { SWARAS, getSwaraFrequency, SWARA_MAP } from '../theory/swaras';
import type { SwaraDefinition } from '../theory/types';
import { getRagaById, getRagaSwaras } from '../theory/ragas';
import { ratioToCents } from '../physics/harmonics';
import type { Level } from '../analysis/pitch-mapping';
import { LEVEL_TOLERANCE } from '../analysis/pitch-mapping';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Accuracy thresholds in cents — maps to visual color encoding. */
export const ACCURACY_THRESHOLDS = {
  /** 0–5 cents: saffron glow, radial ripple */
  perfect: 5,
  /** 5–15 cents: green, string brightens */
  good: 15,
  /** 15–30 cents: amber, faint pulse */
  approaching: 30,
  /** >30 cents: rest state, no visual change */
} as const;

/** Spring physics presets matching Ragamala motion grammar. */
export const SPRING_PRESETS = {
  /** Contact: instantaneous snap (stiffness 1000, damping 30) */
  kan: { stiffness: 1000, damping: 30 },
  /** Sustain: gentle oscillation (stiffness 120, damping 8) */
  andolan: { stiffness: 120, damping: 8 },
  /** Release: natural decay ~800ms (stiffness 400, damping 15) */
  tanpuraRelease: { stiffness: 400, damping: 15 },
  /** Layout transition: smooth redistribution (stiffness 80, damping 20) */
  meend: { stiffness: 80, damping: 20 },
} as const;

/** Vibration decay rate per frame at 60fps (multiplicative). */
const VIBRATION_DECAY = 0.92;

/** Target frame interval in seconds (60fps). */
const TARGET_DT = 1 / 60;

/** Minimum amplitude below which a string is considered at rest. */
const REST_THRESHOLD = 0.005;

/** Maximum amplitude (clamped). */
const MAX_AMPLITUDE = 1.0;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Accuracy band for a string's pitch feedback.
 * Drives the color encoding in the renderer.
 */
export type AccuracyBand = 'perfect' | 'good' | 'approaching' | 'off' | 'rest';

/**
 * Visibility state for a string in the current context.
 */
export type StringVisibility = 'active' | 'ghost' | 'hidden';

/**
 * The state of a single Tantri string at a point in time.
 * This is what the renderer reads every frame.
 */
export interface TantriStringState {
  /** The swara this string represents. */
  readonly swara: Swara;

  /** The swara definition with all musicological data. */
  readonly definition: SwaraDefinition;

  /** Frequency in Hz for this string at the current Sa. */
  readonly hz: number;

  /** Position on the logarithmic frequency axis (0 = Sa, 1 = upper Sa). */
  readonly logPosition: number;

  /** Whether this swara is achala (immovable — Sa and Pa only). */
  readonly achala: boolean;

  /** Whether this swara is shuddha (natural). */
  readonly shuddha: boolean;

  // --- Dynamic state (changes every frame) ---

  /** Current vibration amplitude (0 = rest, 1 = maximum). */
  amplitude: number;

  /** Accuracy band of the current vibration (if voice-driven). */
  accuracyBand: AccuracyBand;

  /** Exact cents deviation from perfect pitch (+ sharp, - flat). */
  centsDev: number;

  /** Visibility in the current raga/level context. */
  visibility: StringVisibility;

  /** Whether this string is currently being touched (for interaction). */
  touched: boolean;

  /** Whether this swara is in the current raga's aroha or avaroha. */
  inRaga: boolean;

  /** Whether this is the vadi (king swara) of the current raga. */
  isVadi: boolean;

  /** Whether this is the samvadi (minister swara) of the current raga. */
  isSamvadi: boolean;

  /**
   * Pre-allocated waveform buffer for generateStringWaveform().
   * Reused across frames to eliminate per-frame Float32Array allocation.
   * Resized only when numPoints changes (rare — tied to canvas width).
   * Internal use by the renderer. Do not read outside renderString().
   */
  _waveformBuffer: Float32Array | null;

  /** Number of points the _waveformBuffer was last allocated for. */
  _waveformBufferSize: number;

  /**
   * Pre-allocated blend buffer for renderString() displacement values.
   * Reused across frames to eliminate per-frame Float64Array allocation.
   * Resized only when numPoints changes (canvas resize — infrequent).
   */
  _blendBuffer: Float64Array | null;

  /** Number of points the _blendBuffer was last allocated for. */
  _blendBufferSize: number;
}

/**
 * The complete Tantri field — all 12 strings plus context.
 */
export interface TantriField {
  /** The student's Sa frequency in Hz. */
  readonly saHz: number;

  /** The current raga (null for chromatic/freeform mode). */
  readonly ragaId: string | null;

  /** Resolved raga object (null if no ragaId or invalid). */
  readonly raga: Raga | null;

  /** Student level (controls visibility and accuracy tolerance). */
  readonly level: Level;

  /** All 12 strings, indexed by swara symbol for O(1) lookup. */
  readonly strings: readonly TantriStringState[];

  /** O(1) lookup: swara symbol → index in the strings array. */
  readonly swaraIndex: Readonly<Record<Swara, number>>;
}

/**
 * Event produced when a string is triggered by touch/click.
 * The synthesis layer consumes this to produce sound.
 */
/**
 * Instrument timbre for synthesis selection.
 * Controls which synthesis engine responds to the play event.
 */
export type TantriTimbre = 'harmonium' | 'piano' | 'guitar';

export interface TantriPlayEvent {
  readonly swara: Swara;
  readonly octave: Octave;
  readonly hz: number;
  readonly velocity: number; // 0–1, maps to volume
  /** Timbre selection — determines which synthesis engine plays the note */
  readonly timbre?: TantriTimbre;
}

/**
 * Result of mapping voice input to the string field.
 */
export interface VoiceMapResult {
  /** Index of the primary (nearest) string, or -1 if no match. */
  readonly primaryIndex: number;

  /** The primary string's swara, or null if no match. */
  readonly primarySwara: Swara | null;

  /** Cents deviation from the primary string. */
  readonly centsDev: number;

  /** Accuracy band for the primary string. */
  readonly accuracyBand: AccuracyBand;

  /** Whether the detected pitch is in the current raga. */
  readonly inRaga: boolean;

  /**
   * Sympathetic vibrations: strings that resonate due to harmonic
   * relationships (e.g., Pa resonates when Sa is sung strongly).
   * Each entry is [stringIndex, amplitude].
   */
  readonly sympathetic: readonly [number, number][];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute a string's position on a logarithmic frequency axis
 * normalized to [0, 1] within one octave (Sa to upper Sa).
 *
 * Uses just-intonation cents: position = centsFromSa / 1200.
 */
function logPosition(definition: SwaraDefinition): number {
  return definition.centsFromSa / 1200;
}

/**
 * Determine accuracy band from cents deviation.
 */
function getAccuracyBand(absCentsDev: number): AccuracyBand {
  if (absCentsDev <= ACCURACY_THRESHOLDS.perfect) return 'perfect';
  if (absCentsDev <= ACCURACY_THRESHOLDS.good) return 'good';
  if (absCentsDev <= ACCURACY_THRESHOLDS.approaching) return 'approaching';
  return 'off';
}

/**
 * Extract the unique swara symbols used in a raga's aroha and avaroha.
 */
function ragaSwaraSet(raga: Raga): ReadonlySet<Swara> {
  const set = new Set<Swara>();
  for (const note of raga.aroha) set.add(note.swara);
  for (const note of raga.avaroha) set.add(note.swara);
  return set;
}

/**
 * Compute sympathetic vibration amplitude.
 *
 * Strings that share a simple harmonic ratio with the sung pitch
 * resonate sympathetically. The amplitude is inversely proportional
 * to the complexity of the ratio.
 *
 * Sa ↔ Pa (3:2): strongest sympathetic resonance
 * Sa ↔ Ga (5:4): moderate resonance
 * Other intervals: weaker resonance based on ratio simplicity
 */
function sympatheticAmplitude(
  sungCents: number,
  stringCents: number,
): number {
  // Distance in cents between the sung pitch and the string
  let diff = Math.abs(sungCents - stringCents);
  // Wrap around the octave
  if (diff > 600) diff = 1200 - diff;

  // Perfect unison (0 cents) or octave — handled by primary mapping
  if (diff < 5) return 0;

  // Perfect fifth (701.96 cents) — strongest sympathetic
  if (Math.abs(diff - 701.96) < 15) return 0.15;

  // Perfect fourth (498.04 cents)
  if (Math.abs(diff - 498.04) < 15) return 0.08;

  // Major third (386.31 cents)
  if (Math.abs(diff - 386.31) < 15) return 0.05;

  // No significant sympathetic resonance
  return 0;
}

// ---------------------------------------------------------------------------
// Field creation
// ---------------------------------------------------------------------------

/**
 * Creates a new TantriField — the 12-string instrument initialized for
 * a given Sa frequency, optional raga, and student level.
 *
 * All strings start at rest (amplitude 0, accuracyBand 'rest').
 * Visibility is determined by raga context and student level.
 *
 * @param saHz  - Student's Sa frequency in Hz
 * @param ragaId - Raga ID for context-aware display (null for chromatic)
 * @param level - Student level for progressive disclosure
 */
export function createTantriField(
  saHz: number,
  ragaId: string | null = null,
  level: Level = 'shishya',
): TantriField {
  const raga = ragaId ? getRagaById(ragaId) ?? null : null;
  const ragaSwaras = raga ? ragaSwaraSet(raga) : null;

  const swaraIndex: Record<string, number> = {};

  const strings: TantriStringState[] = SWARAS.map((def, i) => {
    swaraIndex[def.symbol] = i;

    const hz = getSwaraFrequency(def.symbol, saHz, 'madhya');
    const inRaga = ragaSwaras ? ragaSwaras.has(def.symbol) : true;

    // Determine visibility based on raga context and level
    let visibility: StringVisibility = 'active';
    if (raga) {
      visibility = inRaga ? 'active' : 'ghost';
    }

    return {
      swara: def.symbol,
      definition: def,
      hz,
      logPosition: logPosition(def),
      achala: def.achala,
      shuddha: def.shuddha,
      amplitude: 0,
      accuracyBand: 'rest' as AccuracyBand,
      centsDev: 0,
      visibility,
      touched: false,
      inRaga,
      isVadi: raga ? raga.vadi === def.symbol : false,
      isSamvadi: raga ? raga.samvadi === def.symbol : false,
      _waveformBuffer: null,
      _waveformBufferSize: 0,
      _blendBuffer: null,
      _blendBufferSize: 0,
    };
  });

  return {
    saHz,
    ragaId,
    raga,
    level,
    strings,
    swaraIndex: swaraIndex as Record<Swara, number>,
  };
}

// ---------------------------------------------------------------------------
// Pre-allocated VoiceMapResult — reused every frame to avoid GC pressure.
// The sympathetic array is grown once and reused via length tracking.
// ---------------------------------------------------------------------------

const _voiceResult: {
  primaryIndex: number;
  primarySwara: Swara | null;
  centsDev: number;
  accuracyBand: AccuracyBand;
  inRaga: boolean;
  sympathetic: [number, number][];
  _sympatheticLen: number;
} = {
  primaryIndex: -1,
  primarySwara: null,
  centsDev: 0,
  accuracyBand: 'rest',
  inRaga: false,
  sympathetic: [],
  _sympatheticLen: 0,
};

// ---------------------------------------------------------------------------
// Voice → String mapping
// ---------------------------------------------------------------------------

/**
 * Maps a detected voice pitch to the Tantri string field.
 *
 * Given a pitch in Hz and its clarity, determines:
 *   - Which string is nearest (primary vibration)
 *   - The accuracy band (perfect/good/approaching/off)
 *   - Which strings vibrate sympathetically
 *
 * This function is called on every pitch detection frame (~50 Hz).
 * It must be fast (< 0.2ms).
 *
 * @param hz - Detected pitch in Hz (must be > 0)
 * @param clarity - Detection clarity (0–1)
 * @param field - The current TantriField
 * @returns VoiceMapResult with primary string and sympathetic vibrations
 */
export function mapVoiceToStrings(
  hz: number,
  clarity: number,
  field: TantriField,
): VoiceMapResult {
  const r = _voiceResult;

  if (!Number.isFinite(hz) || !Number.isFinite(clarity) || hz <= 0 || clarity <= 0) {
    r.primaryIndex = -1;
    r.primarySwara = null;
    r.centsDev = 0;
    r.accuracyBand = 'rest';
    r.inRaga = false;
    r.sympathetic.length = 0;
    return r;
  }

  // Compute cents from Sa, normalized to one octave [0, 1200)
  const rawCents = ratioToCents(hz / field.saHz);
  let centsFromSa = rawCents % 1200;
  if (centsFromSa < 0) centsFromSa += 1200;

  // Find the nearest string by cents distance
  let minDist = Infinity;
  let primaryIndex = -1;
  let primaryCentsDev = 0;

  for (let i = 0; i < field.strings.length; i++) {
    const s = field.strings[i]!;
    let dist = Math.abs(centsFromSa - s.definition.centsFromSa);
    // Wrap-around: Sa at 0 and Ni at ~1100 are closer than they appear
    if (dist > 600) dist = 1200 - dist;

    if (dist < minDist) {
      minDist = dist;
      primaryIndex = i;
      // Compute signed deviation
      let dev = centsFromSa - s.definition.centsFromSa;
      if (dev > 600) dev -= 1200;
      if (dev < -600) dev += 1200;
      primaryCentsDev = dev;
    }
  }

  const primaryString = primaryIndex >= 0 ? field.strings[primaryIndex]! : null;

  r.primaryIndex = primaryIndex;
  r.primarySwara = primaryString ? primaryString.swara : null;
  r.centsDev = primaryCentsDev;
  r.accuracyBand = getAccuracyBand(Math.abs(primaryCentsDev));
  r.inRaga = primaryString ? primaryString.inRaga : false;

  // Compute sympathetic vibrations — reuse the pre-allocated array
  let symLen = 0;
  if (primaryIndex >= 0) {
    for (let i = 0; i < field.strings.length; i++) {
      if (i === primaryIndex) continue;
      const amp = sympatheticAmplitude(
        centsFromSa,
        field.strings[i]!.definition.centsFromSa,
      );
      if (amp > 0) {
        // Grow the array only if needed (rare after warmup)
        if (symLen < r.sympathetic.length) {
          r.sympathetic[symLen]![0] = i;
          r.sympathetic[symLen]![1] = amp * clarity;
        } else {
          r.sympathetic.push([i, amp * clarity]);
        }
        symLen++;
      }
    }
  }
  // Trim excess entries from previous frame without allocating
  r.sympathetic.length = symLen;

  return r;
}

// ---------------------------------------------------------------------------
// State update (per-frame)
// ---------------------------------------------------------------------------

/**
 * Updates the string field's dynamic state from voice input.
 *
 * Call this every animation frame with the latest VoiceMapResult.
 * Strings not being excited decay toward rest. The primary string
 * snaps to the voice-driven amplitude. Sympathetic strings receive
 * gentle secondary vibration.
 *
 * Mutates string state in place for performance (avoids allocation
 * on the hot path — this runs at 60 fps).
 *
 * @param field - The TantriField to update
 * @param voiceMap - Result from mapVoiceToStrings, or null for silence
 * @param voiceAmplitude - Raw amplitude from the mic (0–1), drives vibration intensity
 * @param dt - Frame delta in seconds (default 1/60). Used to correct for variable refresh rates.
 */
export function updateFieldFromVoice(
  field: TantriField,
  voiceMap: VoiceMapResult | null,
  voiceAmplitude: number = 0,
  dt: number = TARGET_DT,
): void {
  // Scale factors for frame-rate independence
  const dtScale = dt / TARGET_DT;
  const lerpPrimary = Math.min(1, 0.3 * dtScale);
  const lerpSympathetic = Math.min(1, 0.15 * dtScale);
  const decay = Math.pow(VIBRATION_DECAY, dtScale);
  for (let i = 0; i < field.strings.length; i++) {
    const s = field.strings[i]!;

    // Skip touched strings — those are driven by interaction, not voice
    if (s.touched) continue;

    if (voiceMap && voiceMap.primaryIndex === i) {
      // Primary string: voice IS playing the instrument.
      // Perfect/good accuracy → strong vibration (like a click), regardless of mic volume.
      // Approaching → moderate. Off → weak. This ensures vocal input feels powerful.
      const bandBoost =
        voiceMap.accuracyBand === 'perfect' ? 0.85 :
        voiceMap.accuracyBand === 'good' ? 0.7 :
        voiceMap.accuracyBand === 'approaching' ? 0.5 : 0.2;
      const targetAmp = Math.min(
        Math.max(voiceAmplitude, bandBoost),
        MAX_AMPLITUDE,
      );
      // Lerp toward target for smooth transitions (frame-rate corrected)
      s.amplitude = s.amplitude + (targetAmp - s.amplitude) * lerpPrimary;
      s.accuracyBand = voiceMap.accuracyBand;
      s.centsDev = voiceMap.centsDev;
    } else if (voiceMap) {
      // Check if this string has sympathetic vibration
      const sym = voiceMap.sympathetic.find(([idx]) => idx === i);
      if (sym) {
        const targetAmp = Math.min(sym[1] * voiceAmplitude, MAX_AMPLITUDE * 0.2);
        s.amplitude = s.amplitude + (targetAmp - s.amplitude) * lerpSympathetic;
        s.accuracyBand = 'rest';
        s.centsDev = 0;
      } else {
        // No longer the voice target — reset band immediately, then decay amplitude
        s.accuracyBand = 'rest';
        s.centsDev = 0;
        s.amplitude *= decay;
        if (s.amplitude < REST_THRESHOLD) {
          s.amplitude = 0;
        }
      }
    } else {
      // Silence: all strings decay (frame-rate corrected)
      s.accuracyBand = 'rest';
      s.centsDev = 0;
      s.amplitude *= decay;
      if (s.amplitude < REST_THRESHOLD) {
        s.amplitude = 0;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Touch interaction
// ---------------------------------------------------------------------------

/**
 * Triggers a string by touch/click, producing a TantriPlayEvent for synthesis.
 *
 * The string snaps to full amplitude (Kan spring) and produces a sound event.
 * The renderer should apply Kan spring physics on contact and Tanpura Release
 * spring on release.
 *
 * @param swaraOrIndex - Swara symbol or string index
 * @param field - The current TantriField
 * @param velocity - Touch/click velocity (0–1), default 0.8
 * @returns TantriPlayEvent for the synthesis layer, or null if string is hidden
 */
export function triggerString(
  swaraOrIndex: Swara | number,
  field: TantriField,
  velocity: number = 0.8,
): TantriPlayEvent | null {
  const index =
    typeof swaraOrIndex === 'number'
      ? swaraOrIndex
      : field.swaraIndex[swaraOrIndex];

  if (index === undefined || index < 0 || index >= field.strings.length) {
    return null;
  }

  const s = field.strings[index]!;

  // Don't trigger hidden strings
  if (s.visibility === 'hidden') return null;

  // Snap amplitude to full (Kan spring)
  s.amplitude = MAX_AMPLITUDE;
  s.touched = true;
  s.accuracyBand = 'perfect'; // Self-played notes are always "perfect"
  s.centsDev = 0;

  return {
    swara: s.swara,
    octave: 'madhya',
    hz: s.hz,
    velocity: Math.max(0, Math.min(1, velocity)),
  };
}

/**
 * Releases a previously triggered string.
 *
 * The string enters Tanpura Release decay (handled by renderer via spring
 * physics). This function just marks it as no longer touched.
 *
 * @param swaraOrIndex - Swara symbol or string index
 * @param field - The current TantriField
 */
export function releaseString(
  swaraOrIndex: Swara | number,
  field: TantriField,
): void {
  const index =
    typeof swaraOrIndex === 'number'
      ? swaraOrIndex
      : field.swaraIndex[swaraOrIndex];

  if (index === undefined || index < 0 || index >= field.strings.length) {
    return;
  }

  const s = field.strings[index]!;
  s.touched = false;
  // Amplitude will now decay naturally in updateFieldFromVoice
}

// ---------------------------------------------------------------------------
// Raga context
// ---------------------------------------------------------------------------

/**
 * Updates the field's raga context, reshaping string visibility and roles.
 *
 * When a raga changes:
 *   - In-raga strings become 'active' (0.5 opacity)
 *   - Not-in-raga strings become 'ghost' (0.08 opacity)
 *   - Vadi/samvadi flags update
 *   - Layout redistribution (renderer applies Meend spring)
 *
 * When raga is cleared (null), all strings become 'active' (chromatic mode).
 *
 * @param field - The TantriField to update
 * @param ragaId - New raga ID, or null for chromatic mode
 * @returns A new TantriField with updated context (immutable pattern for React)
 */
export function updateRagaContext(
  field: TantriField,
  ragaId: string | null,
): TantriField {
  // If same raga, no change needed
  if (ragaId === field.ragaId) return field;

  return createTantriField(field.saHz, ragaId, field.level);
}

// ---------------------------------------------------------------------------
// Level-based progressive disclosure
// ---------------------------------------------------------------------------

/**
 * Determines which strings should be visible at a given journey level.
 *
 * Progressive disclosure rules (from brand-director spec):
 *   Shishya L1:     Sa only
 *   Shishya L2+:    Aroha of current raga (2–5 strings)
 *   Sadhaka:        Full thaat (7 shuddha swaras + relevant vikrit)
 *   Varistha+:      All 12 chromatic strings
 *
 * Without a raga, defaults to showing based on level count:
 *   Shishya: Sa + Pa (achala only)
 *   Sadhaka: 7 shuddha swaras
 *   Varistha+: all 12
 *
 * @param field - The current TantriField
 * @param subLevel - Sub-level within the journey tier (1-based)
 * @returns Array of visible string indices
 */
export function getVisibleStrings(
  field: TantriField,
  subLevel: number = 1,
): readonly number[] {
  const visible: number[] = [];

  switch (field.level) {
    case 'shishya': {
      if (subLevel <= 1) {
        // L1: Sa only
        visible.push(field.swaraIndex['Sa']!);
      } else if (field.raga) {
        // L2+: Aroha swaras of the current raga
        const arohaSet = new Set<Swara>();
        for (const note of field.raga.aroha) arohaSet.add(note.swara);
        for (let i = 0; i < field.strings.length; i++) {
          if (arohaSet.has(field.strings[i]!.swara)) {
            visible.push(i);
          }
        }
      } else {
        // No raga: Sa + Pa
        visible.push(field.swaraIndex['Sa']!);
        visible.push(field.swaraIndex['Pa']!);
      }
      break;
    }

    case 'sadhaka': {
      // 7 shuddha swaras + any vikrit the current raga needs
      for (let i = 0; i < field.strings.length; i++) {
        const s = field.strings[i]!;
        if (s.shuddha || s.inRaga) {
          visible.push(i);
        }
      }
      break;
    }

    case 'varistha':
    case 'guru': {
      // All 12
      for (let i = 0; i < field.strings.length; i++) {
        visible.push(i);
      }
      break;
    }
  }

  return visible;
}

/**
 * Applies level-based visibility to the field's strings.
 *
 * Strings not in the visible set become 'hidden'.
 * This mutates in place for performance.
 *
 * @param field - The TantriField to update
 * @param subLevel - Sub-level within the journey tier
 */
export function applyLevelVisibility(
  field: TantriField,
  subLevel: number = 1,
): void {
  const visibleSet = new Set(getVisibleStrings(field, subLevel));

  for (let i = 0; i < field.strings.length; i++) {
    const s = field.strings[i]!;
    if (visibleSet.has(i)) {
      // Restore raga-aware visibility
      s.visibility = s.inRaga || !field.raga ? 'active' : 'ghost';
    } else {
      s.visibility = 'hidden';
    }
  }
}

// ---------------------------------------------------------------------------
// Utility queries
// ---------------------------------------------------------------------------

/**
 * Returns the accuracy amplitude mapping for visual encoding.
 *
 * Used by renderers to determine the visual intensity of a string's
 * color encoding based on its accuracy band.
 */
export function accuracyToOpacity(band: AccuracyBand): number {
  switch (band) {
    case 'perfect':
      return 1.0;
    case 'good':
      return 0.6;
    case 'approaching':
      return 0.3;
    case 'off':
      return 0.1;
    case 'rest':
      return 0;
  }
}

/**
 * Returns the CSS color variable name for an accuracy band.
 * These map to the design system tokens.
 */
export function accuracyToColor(band: AccuracyBand): string {
  switch (band) {
    case 'perfect':
      return '--accent'; // Saffron #E8871E
    case 'good':
      return '--correct'; // Green #22C55E
    case 'approaching':
      return '--in-progress'; // Amber #F59E0B
    case 'off':
      return '--needs-work'; // Red #EF4444
    case 'rest':
      return '--text-3'; // Neutral
  }
}

/**
 * Computes the amplitude for a vibrating string at a given time offset.
 *
 * Models a damped oscillation: A(t) = amplitude * e^(-decay * t) * sin(2PI * freq * t)
 *
 * This is used by renderers for the per-pixel waveform on each string.
 *
 * @param amplitude - Current string amplitude (0–1)
 * @param frequency - Vibration frequency (visual, not audio — typically 2–8 Hz)
 * @param t - Time in seconds
 * @param decay - Decay rate (higher = faster decay)
 * @returns Displacement value (-amplitude to +amplitude)
 */
export function stringDisplacement(
  amplitude: number,
  frequency: number,
  t: number,
  decay: number = 2.0,
): number {
  if (amplitude < REST_THRESHOLD) return 0;
  return amplitude * Math.exp(-decay * t) * Math.sin(2 * Math.PI * frequency * t);
}

/**
 * Generates the waveform displacement array for a string.
 *
 * This produces the actual wave shape that a renderer draws along
 * the string's horizontal extent. The waveform frequency is proportional
 * to the swara's actual frequency ratio (higher swaras vibrate faster visually).
 *
 * When called with a mutable TantriStringState, the result is written into
 * `stringState._waveformBuffer` and returned — zero allocation on the hot path.
 * The buffer is re-allocated only when `numPoints` changes (tied to canvas width,
 * which only changes on resize — rare).
 *
 * When called with a plain object (e.g. in tests), a new array is allocated as
 * before, preserving backward compatibility.
 *
 * @param stringState - The string to generate the waveform for
 * @param numPoints - Number of sample points along the string
 * @param time - Current animation time in seconds (for phase)
 * @returns Float32Array of displacement values normalized to [-1, 1]
 */
export function generateStringWaveform(
  stringState: TantriStringState,
  numPoints: number,
  time: number,
): Float32Array {
  // Reuse per-string pre-allocated buffer when available.
  // Re-allocate only when numPoints changes (canvas resize — infrequent).
  let waveform: Float32Array;
  if (stringState._waveformBufferSize === numPoints && stringState._waveformBuffer !== null) {
    waveform = stringState._waveformBuffer;
  } else {
    waveform = new Float32Array(numPoints);
    stringState._waveformBuffer = waveform;
    stringState._waveformBufferSize = numPoints;
  }

  if (stringState.amplitude < REST_THRESHOLD) {
    waveform.fill(0);
    return waveform; // All zeros — string at rest
  }

  // Visual frequency: higher swaras vibrate faster
  // Sa = 2 visual cycles, upper Sa = 4 visual cycles
  const baseCycles = 2 + stringState.logPosition * 2;

  // Standing wave: nodes at the endpoints (like a real string)
  for (let i = 0; i < numPoints; i++) {
    const x = i / (numPoints - 1); // 0 to 1 along the string
    const envelope = Math.sin(Math.PI * x); // Node at 0 and 1

    // Combine fundamental + 2nd harmonic for richer visual
    const fundamental =
      Math.sin(2 * Math.PI * baseCycles * x + time * 4) * 0.7;
    const harmonic2 =
      Math.sin(2 * Math.PI * baseCycles * 2 * x + time * 6) * 0.3;

    waveform[i] =
      stringState.amplitude * envelope * (fundamental + harmonic2);
  }

  return waveform;
}
