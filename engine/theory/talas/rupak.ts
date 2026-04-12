/**
 * @module engine/theory/talas/rupak
 *
 * Rupak (also: Roopak, Rupak Taal) — the 7-beat rhythmic cycle with the
 * unusual characteristic that sam is khali (empty/unstressed).
 *
 * Structure: 7 beats (matras) divided into 3 vibhags: 3+2+2.
 *
 *   Vibhag 1 (sam = KHALI): | Ti   Ti   Na  |   (wave — sam is khali!)
 *   Vibhag 2 (tali):        | Dhi  Na       |   (clap — tali)
 *   Vibhag 3 (tali):        | Dhi  Na       |   (clap — tali)
 *
 * THE UNUSUAL CASE: In Rupak, sam (beat 1) is khali. This is unique among
 * common Hindustani talas. In every other standard tala, sam is the most
 * emphatic beat — it is where the cycle arrives with full resonance. In
 * Rupak, the cycle begins with an open, unstressed gesture (wave instead
 * of clap). The resonant "Dhi" strokes arrive only in vibhags 2 and 3.
 *
 * This creates a fundamentally different rhythmic experience: instead of
 * the cycle feeling like it "lands" on sam, it feels like it "lifts off"
 * from sam. The gravitational centre shifts — the student must internalise
 * a cycle where the beginning is light and the middle is heavy. This is
 * one of the most instructive rhythmic concepts in Hindustani music.
 *
 * The 7-beat odd-numbered cycle with 3+2+2 asymmetry adds further
 * complexity. Rupak does not subdivide into equal halves. The longer
 * first vibhag (3 beats) followed by two shorter vibhags (2+2) creates
 * a characteristic rhythmic shape.
 *
 * Common tempo range: madhya laya 60-160 BPM. Less common in vilambit.
 */

import type { Tala, TalaEvent, VibhagPosition, ClapType } from '../types';

/**
 * Rupak — 7-beat rhythmic cycle. Sam is khali.
 *
 * The theka uses standard tabla bols:
 * - Ti: treble stroke without bass (khali character — open, dry)
 * - Na: closed treble stroke, clean and precise
 * - Dhi: resonant bass + sustained treble (bayan + dayan)
 *
 * Note the reversal from the typical pattern: the dry, open Ti bols
 * come at sam (beat 1), while the resonant Dhi bols come later in
 * the cycle. This is the sonic signature of Rupak's khali-sam.
 */
export const rupak: Tala = {
  id: 'rupak',
  name: 'Rupak',
  nameDevanagari: 'रूपक',

  beats: 7,

  vibhag: [3, 2, 2],

  sam: 1,

  /**
   * Khali beats include sam (beat 1) — the defining feature of Rupak.
   * In Rupak, sam is khali. Beats 4 and 6 are tali (bhari/full).
   */
  khali: [1],

  /**
   * The first vibhag's clap type is 'khali' — sam is khali in Rupak.
   * This is the ONLY standard tala where the first element is NOT 'sam'.
   * We encode this as 'khali' to reflect the musical reality: the gesture
   * at sam in Rupak is a wave (open hand), not a clap.
   */
  clapPattern: ['khali', 'tali', 'tali'],

  theka: [
    'Ti', 'Ti', 'Na',       // Vibhag 1 — sam (but khali! — open, dry bols)
    'Dhi', 'Na',             // Vibhag 2 — tali (resonant)
    'Dhi', 'Na',             // Vibhag 3 — tali (resolves to sam)
  ],

  description:
    'Rupak is a 7-beat tala with the extraordinary characteristic that sam — the ' +
    'first beat of the cycle — is khali (empty, unstressed). In every other common ' +
    'Hindustani tala, sam is the point of maximum emphasis; in Rupak, it is a wave ' +
    'of the open hand. The resonant Dhi strokes arrive only in vibhags 2 and 3, ' +
    'creating a cycle that lifts off from its beginning rather than landing on it. ' +
    'The 3+2+2 vibhag structure adds further asymmetry to the 7-beat cycle. Rupak ' +
    'teaches the student to internalise rhythm without relying on a heavy downbeat — ' +
    'a profound lesson in the independence of musical pulse from accent.',
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Get the bol (tabla syllable) at a given beat position.
 *
 * @param beat - Beat number (1-indexed, 1 to 7).
 * @returns The bol string at that beat, or undefined if out of range.
 */
export function getBolAtBeat(beat: number): string | undefined {
  if (beat < 1 || beat > rupak.beats) return undefined;
  return rupak.theka[beat - 1];
}

/**
 * Determine which vibhag a given beat belongs to and its position within it.
 *
 * @param beat - Beat number (1-indexed).
 * @returns The position information, or undefined if out of range.
 */
export function getBeatPosition(beat: number): VibhagPosition | undefined {
  if (beat < 1 || beat > rupak.beats) return undefined;

  let accumulated = 0;
  for (let i = 0; i < rupak.vibhag.length; i++) {
    const vibhagSize = rupak.vibhag[i]!;
    if (beat <= accumulated + vibhagSize) {
      return {
        vibhagIndex: i,
        beatInVibhag: beat - accumulated - 1,
        isSam: beat === rupak.sam,
        isKhali: rupak.khali.includes(beat),
        clapType: rupak.clapPattern[i]!,
      };
    }
    accumulated += vibhagSize;
  }
  return undefined;
}

/**
 * Generate tala events for one cycle of Rupak at the given tempo.
 *
 * @param tempo - Tempo in BPM (beats per minute). Each beat is one matra.
 * @returns Array of TalaEvent objects with timing information.
 */
export function generateTheka(tempo: number): TalaEvent[] {
  if (tempo <= 0) throw new RangeError('Tempo must be positive');

  const secondsPerBeat = 60 / tempo;
  const events: TalaEvent[] = [];

  for (let beat = 1; beat <= rupak.beats; beat++) {
    const position = getBeatPosition(beat)!;
    events.push({
      beat,
      bol: rupak.theka[beat - 1]!,
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
 * Check if a given beat is sam.
 * Note: In Rupak, sam IS khali — this function returns true for beat 1,
 * but isSam being true does NOT imply emphasis in this tala.
 */
export function isSam(beat: number): boolean {
  return beat === rupak.sam;
}

/**
 * Check if a given beat is khali (the empty beat).
 * Note: In Rupak, beat 1 (sam) is khali.
 */
export function isKhali(beat: number): boolean {
  return rupak.khali.includes(beat);
}
