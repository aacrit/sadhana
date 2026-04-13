/**
 * @module engine/synthesis/voice/raga-voice
 *
 * TantriVoice(TM) — Raga-aware vocal phrase generation.
 *
 * This is where voice synthesis meets raga grammar. Given a raga,
 * this module knows:
 *   - Which swaras should get andolan (e.g., Re_k, Dha_k in Bhairav)
 *   - Where meend is characteristic
 *   - Which swaras get kan and from which direction
 *   - The natural phrasing and emphasis patterns
 *   - Per-raga intonation offsets (Darbari's Ga_k at 280 cents)
 *
 * It consumes raga definitions from engine/theory/ and ornament
 * specifications from ornament-voice.ts to decide how each swara
 * should be sung.
 */

import type { Raga, SwaraNote, Swara, Ornament } from '../../theory/types';
import type { VoiceType } from './formants';
import { getSwaraFrequency } from '../../theory/swaras';
import {
  getIntonationOffset,
  getAndolanSpec,
  getKanSpec,
  getVocalOrnamentForSwara,
} from './ornament-voice';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for a raga-aware vocal demonstration.
 */
export interface VocalDemoConfig {
  readonly raga: Raga;
  readonly saHz: number;
  readonly voiceType: VoiceType;
  /** Tempo in BPM */
  readonly tempo: number;
  /** Volume (0-1) */
  readonly volume: number;
  /** Ornament level: none=plain, subtle=minimal, natural=raga-appropriate, elaborate=full */
  readonly ornamentLevel: 'none' | 'subtle' | 'natural' | 'elaborate';
  /** Legato mode: sustain voice across notes (default true for aakaar) */
  readonly legato?: boolean;
}

/**
 * A single note event in a vocal phrase, with all synthesis parameters resolved.
 */
export interface VocalNoteEvent {
  /** The swara being sung */
  readonly swara: Swara;
  /** Resolved frequency in Hz (includes raga intonation offset) */
  readonly hz: number;
  /** Duration in seconds */
  readonly duration: number;
  /** Volume multiplier (vadi gets 1.15x, anuvadi gets 1.0x) */
  readonly volumeMultiplier: number;
  /** Ornament to apply (null = none) */
  readonly ornament: Ornament | null;
  /** For kan: grace note frequency */
  readonly kanHz?: number;
  /** For andolan: rate in Hz */
  readonly andolanRate?: number;
  /** For andolan: amplitude in cents */
  readonly andolanAmplitude?: number;
  /** Whether to connect to next note via micro-meend (legato) */
  readonly legatoToNext: boolean;
}

// ---------------------------------------------------------------------------
// Frequency resolution with raga intonation
// ---------------------------------------------------------------------------

/**
 * Get the frequency for a swara in a specific raga context,
 * including per-raga intonation offsets.
 */
export function getRagaSwaraHz(
  swara: Swara,
  saHz: number,
  ragaId: string,
): number {
  const baseHz = getSwaraFrequency(swara, saHz);
  const offsetCents = getIntonationOffset(ragaId, swara);
  if (offsetCents === 0) return baseHz;
  return baseHz * Math.pow(2, offsetCents / 1200);
}

/**
 * Get the frequency for a SwaraNote (swara + octave) in raga context.
 */
export function getRagaSwaraNotHz(
  note: SwaraNote,
  saHz: number,
  ragaId: string,
): number {
  const hz = getRagaSwaraHz(note.swara, saHz, ragaId);
  switch (note.octave) {
    case 'mandra': return hz / 2;
    case 'madhya': return hz;
    case 'taar': return hz * 2;
  }
}

// ---------------------------------------------------------------------------
// Phrase generation
// ---------------------------------------------------------------------------

/**
 * Generate vocal note events for a phrase of SwaraNote[].
 * Resolves frequencies, ornaments, emphasis, and legato connections.
 */
export function generateVocalPhrase(
  phrase: readonly SwaraNote[],
  config: VocalDemoConfig,
): VocalNoteEvent[] {
  const { raga, saHz, tempo, ornamentLevel, legato = true } = config;
  const beatDuration = 60 / tempo; // seconds per beat
  const events: VocalNoteEvent[] = [];

  for (let i = 0; i < phrase.length; i++) {
    const note = phrase[i]!;
    const swara = note.swara;
    const hz = getRagaSwaraNotHz(note, saHz, raga.id);
    const isVadi = swara === raga.vadi;
    const isSamvadi = swara === raga.samvadi;

    // Duration: vadi gets 1.5x, samvadi gets 1.2x
    let duration = beatDuration;
    if (isVadi) duration *= 1.5;
    else if (isSamvadi) duration *= 1.2;

    // Volume: vadi gets 1.15x, samvadi gets 1.08x
    let volumeMultiplier = 1.0;
    if (isVadi) volumeMultiplier = 1.15;
    else if (isSamvadi) volumeMultiplier = 1.08;

    // Determine ornament
    const preceding = i > 0 ? phrase[i - 1]!.swara : undefined;
    const following = i < phrase.length - 1 ? phrase[i + 1]!.swara : undefined;
    const isAscending = i > 0
      ? hz > getRagaSwaraNotHz(phrase[i - 1]!, saHz, raga.id)
      : true;

    const ornament = getVocalOrnamentForSwara(
      swara,
      raga,
      { preceding, following, isVadi, isAscending },
      ornamentLevel,
    );

    // Resolve ornament-specific parameters
    let kanHz: number | undefined;
    let andolanRate: number | undefined;
    let andolanAmplitude: number | undefined;

    if (ornament === 'kan') {
      const kanSpec = getKanSpec(raga.id, swara);
      if (kanSpec) {
        kanHz = getRagaSwaraHz(kanSpec.source, saHz, raga.id);
        // Adjust octave if needed
        if (note.octave === 'taar') kanHz *= 2;
        else if (note.octave === 'mandra') kanHz /= 2;
      }
    }

    if (ornament === 'andolan') {
      const andolanSpec = getAndolanSpec(raga.id, swara);
      if (andolanSpec) {
        andolanRate = andolanSpec.rateHz;
        andolanAmplitude = andolanSpec.amplitudeCents;
      } else {
        // Default andolan for vadi
        andolanRate = 2.5;
        andolanAmplitude = 15;
      }
    }

    // Legato: connect to next note via micro-meend unless staccato
    const legatoToNext = legato && i < phrase.length - 1;

    events.push({
      swara,
      hz,
      duration,
      volumeMultiplier,
      ornament,
      kanHz,
      andolanRate,
      andolanAmplitude,
      legatoToNext,
    });
  }

  return events;
}

/**
 * Generate vocal note events for a raga's aroha (ascending scale).
 */
export function generateVocalAroha(config: VocalDemoConfig): VocalNoteEvent[] {
  return generateVocalPhrase(config.raga.aroha, config);
}

/**
 * Generate vocal note events for a raga's avaroha (descending scale).
 */
export function generateVocalAvaroha(config: VocalDemoConfig): VocalNoteEvent[] {
  return generateVocalPhrase(config.raga.avaroha, config);
}

/**
 * Generate vocal note events for a raga's pakad (characteristic phrase).
 */
export function generateVocalPakad(
  config: VocalDemoConfig,
  pakadIndex: number = 0,
): VocalNoteEvent[] {
  const pakad = config.raga.pakad[pakadIndex];
  if (!pakad) return [];
  // Pakad is always at natural+ ornament level — it defines the raga
  const pakadConfig = {
    ...config,
    ornamentLevel: config.ornamentLevel === 'none' ? 'subtle' as const : config.ornamentLevel,
    tempo: config.tempo * 0.7, // Slower tempo for pakad
  };
  return generateVocalPhrase(pakad, pakadConfig);
}

/**
 * Generate a structured alap (slow raga introduction).
 *
 * This is procedural alap generation — unprecedented in any HCM app.
 * The algorithm:
 *   1. Begin with Sa (sustain 3-5s)
 *   2. Introduce the vadi — approach with meend from nearest swara
 *   3. Return to Sa
 *   4. Introduce the samvadi — connect to vadi
 *   5. Return to Sa
 *   6. Gradually expand through the aroha
 *   7. Descend through the avaroha back to Sa
 *
 * @param config - Demo configuration
 * @returns Array of VocalNoteEvent for the structured alap
 */
export function generateStructuredAlap(config: VocalDemoConfig): VocalNoteEvent[] {
  const { raga, saHz } = config;
  const events: VocalNoteEvent[] = [];

  const saNote: SwaraNote = { swara: 'Sa', octave: 'madhya' };
  const saHz_ = getRagaSwaraNotHz(saNote, saHz, raga.id);

  // Helper: create a sustained note event
  const sustain = (swara: Swara, octave: 'mandra' | 'madhya' | 'taar', durationMultiplier: number): VocalNoteEvent => {
    const note: SwaraNote = { swara, octave };
    const hz = getRagaSwaraNotHz(note, saHz, raga.id);
    const isVadi = swara === raga.vadi;
    const andolanSpec = getAndolanSpec(raga.id, swara);

    return {
      swara,
      hz,
      duration: (60 / config.tempo) * durationMultiplier,
      volumeMultiplier: isVadi ? 1.15 : 1.0,
      ornament: andolanSpec ? 'andolan' : null,
      andolanRate: andolanSpec?.rateHz,
      andolanAmplitude: andolanSpec?.amplitudeCents,
      legatoToNext: true,
    };
  };

  // Phase 1: Sa sustain (opening)
  events.push({
    swara: 'Sa',
    hz: saHz_,
    duration: (60 / config.tempo) * 4,
    volumeMultiplier: 1.0,
    ornament: null,
    legatoToNext: true,
  });

  // Phase 2: Introduce vadi
  events.push(sustain(raga.vadi, 'madhya', 3));

  // Return to Sa
  events.push(sustain('Sa', 'madhya', 2));

  // Phase 3: Introduce samvadi
  events.push(sustain(raga.samvadi, 'madhya', 2.5));

  // Connect vadi and samvadi
  events.push(sustain(raga.vadi, 'madhya', 2));

  // Return to Sa
  events.push(sustain('Sa', 'madhya', 1.5));

  // Phase 4: Walk through aroha (excluding first Sa, already established)
  for (let i = 1; i < raga.aroha.length; i++) {
    const note = raga.aroha[i]!;
    const duration = note.swara === raga.vadi ? 2 : 1.2;
    events.push(sustain(note.swara, note.octave, duration));
  }

  // Phase 5: Descend through avaroha
  for (let i = 0; i < raga.avaroha.length; i++) {
    const note = raga.avaroha[i]!;
    const duration = note.swara === raga.vadi ? 2 : 1.2;
    events.push(sustain(note.swara, note.octave, duration));
  }

  // Final Sa
  events.push({
    swara: 'Sa',
    hz: saHz_,
    duration: (60 / config.tempo) * 3,
    volumeMultiplier: 1.0,
    ornament: null,
    legatoToNext: false,
  });

  return events;
}
