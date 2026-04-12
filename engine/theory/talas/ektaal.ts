/**
 * @module engine/theory/talas/ektaal
 *
 * Ektaal (also: Ektal) — the 12-beat rhythmic cycle that is one of the most
 * important talas in Hindustani Classical Music, especially for khayal bandish
 * in vilambit (slow) tempo.
 *
 * Structure: 12 beats (matras) divided into 6 vibhags of 2 beats each.
 *
 *   Vibhag 1 (sam):   | Dhin  Dhin  |   (clap — sam)
 *   Vibhag 2 (tali):  | DhaGe TrKt  |   (clap — tali 2)
 *   Vibhag 3 (tali):  | Tu    Na    |   (clap — tali 3)
 *   Vibhag 4 (khali): | Kat   Ta    |   (wave — khali)
 *   Vibhag 5 (tali):  | DhaGe TrKt  |   (clap — tali 4)
 *   Vibhag 6 (tali):  | Dhin  Na    |   (clap — tali 5)
 *
 * Sam (beat 1) is the gravitational centre. Khali falls on beat 7 —
 * the midpoint of the cycle — creating a symmetrical division of the
 * 12-beat span into two halves: resonant (beats 1-6) and open (beats 7-12).
 *
 * The word "Ektaal" means "one tala" — sometimes interpreted as the
 * fundamental cycle from which other talas derive. In vilambit khayal,
 * each matra is expanded with elaborate sub-divisions, giving the vocalist
 * immense space for alaap-like melodic exploration within the tala framework.
 *
 * Common tempo range: vilambit 20-60 BPM, madhya laya 60-120 BPM.
 */

import type { Tala, TalaEvent, VibhagPosition, ClapType } from '../types';

/**
 * Ektaal — 12-beat rhythmic cycle.
 *
 * The theka uses standard tabla bols:
 * - Dhin: resonant bass + sustained treble (bayan + dayan)
 * - DhaGe: composite bol — resonant bass stroke followed by a light stroke
 * - TrKt: composite bol — rapid double stroke on the treble drum
 * - Tu: open treble stroke
 * - Na: closed treble stroke
 * - Kat: sharp, dry treble stroke
 * - Ta: dry treble stroke (no bass — khali character)
 */
export const ektaal: Tala = {
  id: 'ektaal',
  name: 'Ektaal',
  nameDevanagari: 'एकताल',

  beats: 12,

  vibhag: [2, 2, 2, 2, 2, 2],

  sam: 1,

  khali: [7],

  clapPattern: ['sam', 'tali', 'tali', 'khali', 'tali', 'tali'],

  theka: [
    'Dhin', 'Dhin',     // Vibhag 1 — sam
    'DhaGe', 'TrKt',    // Vibhag 2 — tali
    'Tu', 'Na',          // Vibhag 3 — tali
    'Kat', 'Ta',         // Vibhag 4 — khali
    'DhaGe', 'TrKt',    // Vibhag 5 — tali
    'Dhin', 'Na',        // Vibhag 6 — tali (resolves to sam)
  ],

  description:
    'Ektaal is a 12-beat tala divided into six vibhags of two beats each. ' +
    'It is the primary tala for vilambit (slow-tempo) khayal compositions, where ' +
    'each matra is stretched to allow elaborate melodic exploration. The symmetrical ' +
    'placement of khali at beat 7 divides the cycle into two equal halves — the ' +
    'first half resonant with Dhin and DhaGe strokes, the second opening with the ' +
    'dry Kat-Ta of the khali vibhag. This contrast gives Ektaal its characteristic ' +
    'sense of breathing, especially at slow tempos where the vocalist navigates ' +
    'entire melodic passages within a single matra.',
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Get the bol (tabla syllable) at a given beat position.
 *
 * @param beat - Beat number (1-indexed, 1 to 12).
 * @returns The bol string at that beat, or undefined if out of range.
 */
export function getBolAtBeat(beat: number): string | undefined {
  if (beat < 1 || beat > ektaal.beats) return undefined;
  return ektaal.theka[beat - 1];
}

/**
 * Determine which vibhag a given beat belongs to and its position within it.
 *
 * @param beat - Beat number (1-indexed).
 * @returns The position information, or undefined if out of range.
 */
export function getBeatPosition(beat: number): VibhagPosition | undefined {
  if (beat < 1 || beat > ektaal.beats) return undefined;

  let accumulated = 0;
  for (let i = 0; i < ektaal.vibhag.length; i++) {
    const vibhagSize = ektaal.vibhag[i]!;
    if (beat <= accumulated + vibhagSize) {
      return {
        vibhagIndex: i,
        beatInVibhag: beat - accumulated - 1,
        isSam: beat === ektaal.sam,
        isKhali: ektaal.khali.includes(beat),
        clapType: ektaal.clapPattern[i]!,
      };
    }
    accumulated += vibhagSize;
  }
  return undefined;
}

/**
 * Generate tala events for one cycle of Ektaal at the given tempo.
 *
 * @param tempo - Tempo in BPM (beats per minute). Each beat is one matra.
 * @returns Array of TalaEvent objects with timing information.
 */
export function generateTheka(tempo: number): TalaEvent[] {
  if (tempo <= 0) throw new RangeError('Tempo must be positive');

  const secondsPerBeat = 60 / tempo;
  const events: TalaEvent[] = [];

  for (let beat = 1; beat <= ektaal.beats; beat++) {
    const position = getBeatPosition(beat)!;
    events.push({
      beat,
      bol: ektaal.theka[beat - 1]!,
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
  return beat === ektaal.sam;
}

/**
 * Check if a given beat is khali (the empty beat).
 */
export function isKhali(beat: number): boolean {
  return ektaal.khali.includes(beat);
}
