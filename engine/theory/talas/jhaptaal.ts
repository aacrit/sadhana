/**
 * @module engine/theory/talas/jhaptaal
 *
 * Jhaptaal (also: Jhaptal, Jhampa) — the 10-beat rhythmic cycle with an
 * asymmetric vibhag structure of 2+3+2+3.
 *
 * Structure: 10 beats (matras) divided into 4 vibhags: 2+3+2+3.
 *
 *   Vibhag 1 (sam):   | Dhi  Na     |             (clap — sam)
 *   Vibhag 2 (tali):  | Dhi  Dhi  Na|             (clap — tali 2)
 *   Vibhag 3 (khali): | Ti   Na     |             (wave — khali)
 *   Vibhag 4 (tali):  | Dhi  Dhi  Na|             (clap — tali 3)
 *
 * Sam (beat 1) is the gravitational centre. Khali falls on beat 6 —
 * the start of the third vibhag. The asymmetric grouping (2+3+2+3)
 * creates a distinctive lilting feel that distinguishes Jhaptaal from
 * the symmetrical cycles of Teentaal or Ektaal.
 *
 * Jhaptaal occupies a middle ground in the tala landscape: not as
 * ubiquitous as Teentaal, not as specialised as Rupak. It is commonly
 * used in medium-tempo (madhya laya) compositions and provides a
 * satisfying rhythmic complexity without the extremes of asymmetry
 * found in Rupak's 7-beat cycle.
 *
 * Common tempo range: madhya laya 60-120 BPM, drut up to 200+ BPM.
 */

import type { Tala, TalaEvent, VibhagPosition, ClapType } from '../types';

/**
 * Jhaptaal — 10-beat rhythmic cycle.
 *
 * The theka uses standard tabla bols:
 * - Dhi: resonant bass + sustained treble (bayan + dayan)
 * - Na: closed treble stroke, clean and precise
 * - Ti: treble stroke without bass (khali character — open, dry)
 *
 * The contrast between the resonant "Dhi" bols of the sam/tali vibhags
 * and the open "Ti" of the khali vibhag mirrors the tali/khali duality
 * found in all Hindustani talas.
 */
export const jhaptaal: Tala = {
  id: 'jhaptaal',
  name: 'Jhaptaal',
  nameDevanagari: 'झपताल',

  beats: 10,

  vibhag: [2, 3, 2, 3],

  sam: 1,

  khali: [6],

  clapPattern: ['sam', 'tali', 'khali', 'tali'],

  theka: [
    'Dhi', 'Na',              // Vibhag 1 — sam (2 beats)
    'Dhi', 'Dhi', 'Na',       // Vibhag 2 — tali (3 beats)
    'Ti', 'Na',                // Vibhag 3 — khali (2 beats)
    'Dhi', 'Dhi', 'Na',       // Vibhag 4 — tali (3 beats, resolves to sam)
  ],

  description:
    'Jhaptaal is a 10-beat tala with an asymmetric vibhag structure of 2+3+2+3, ' +
    'giving it a distinctive lilting quality that sets it apart from the symmetrical ' +
    'cycles of Teentaal and Ektaal. The grouping creates a gentle push-pull between ' +
    'the shorter 2-beat and longer 3-beat sections, producing a sense of rhythmic ' +
    'momentum that drives the composition forward. Khali at beat 6 marks the midpoint ' +
    'with the open Ti stroke, and the cycle resolves back to sam through the final ' +
    '3-beat vibhag. Jhaptaal is commonly used in madhya laya (medium-tempo) ' +
    'khayal compositions and instrumental gats.',
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Get the bol (tabla syllable) at a given beat position.
 *
 * @param beat - Beat number (1-indexed, 1 to 10).
 * @returns The bol string at that beat, or undefined if out of range.
 */
export function getBolAtBeat(beat: number): string | undefined {
  if (beat < 1 || beat > jhaptaal.beats) return undefined;
  return jhaptaal.theka[beat - 1];
}

/**
 * Determine which vibhag a given beat belongs to and its position within it.
 *
 * @param beat - Beat number (1-indexed).
 * @returns The position information, or undefined if out of range.
 */
export function getBeatPosition(beat: number): VibhagPosition | undefined {
  if (beat < 1 || beat > jhaptaal.beats) return undefined;

  let accumulated = 0;
  for (let i = 0; i < jhaptaal.vibhag.length; i++) {
    const vibhagSize = jhaptaal.vibhag[i]!;
    if (beat <= accumulated + vibhagSize) {
      return {
        vibhagIndex: i,
        beatInVibhag: beat - accumulated - 1,
        isSam: beat === jhaptaal.sam,
        isKhali: jhaptaal.khali.includes(beat),
        clapType: jhaptaal.clapPattern[i]!,
      };
    }
    accumulated += vibhagSize;
  }
  return undefined;
}

/**
 * Generate tala events for one cycle of Jhaptaal at the given tempo.
 *
 * @param tempo - Tempo in BPM (beats per minute). Each beat is one matra.
 * @returns Array of TalaEvent objects with timing information.
 */
export function generateTheka(tempo: number): TalaEvent[] {
  if (tempo <= 0) throw new RangeError('Tempo must be positive');

  const secondsPerBeat = 60 / tempo;
  const events: TalaEvent[] = [];

  for (let beat = 1; beat <= jhaptaal.beats; beat++) {
    const position = getBeatPosition(beat)!;
    events.push({
      beat,
      bol: jhaptaal.theka[beat - 1]!,
      timeSeconds: (beat - 1) * secondsPerBeat,
      isSam: position.isSam,
      isKhali: position.isKhali,
      clapType: position.clapType,
    });
  }

  return events;
}

/**
 * Determine which vibhag a given beat belongs to.
 *
 * @param beat - Beat number (1-indexed).
 * @returns The vibhag index (0-based), or -1 if out of range.
 */
export function getVibhagForBeat(beat: number): number {
  const position = getBeatPosition(beat);
  return position ? position.vibhagIndex : -1;
}

/**
 * Check if a given beat is sam (the anchoring first beat).
 */
export function isSam(beat: number): boolean {
  return beat === jhaptaal.sam;
}

/**
 * Check if a given beat is khali (the empty beat).
 */
export function isKhali(beat: number): boolean {
  return jhaptaal.khali.includes(beat);
}
