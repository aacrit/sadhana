/**
 * @module engine/theory/talas/teentaal
 *
 * Teentaal (also: Tintal, Trital) — the 16-beat rhythmic cycle that is the
 * most common and most important tala in Hindustani Classical Music.
 *
 * Structure: 16 beats (matras) divided into 4 vibhags of 4 beats each.
 *
 *   Vibhag 1 (sam):   | Dha  Dhin  Dhin  Dha  |   (clap — sam)
 *   Vibhag 2 (tali):  | Dha  Dhin  Dhin  Dha  |   (clap — tali)
 *   Vibhag 3 (khali): | Dha  Tin   Tin   Ta   |   (wave — khali)
 *   Vibhag 4 (tali):  | Ta   Dhin  Dhin  Dha  |   (clap — tali)
 *
 * Sam (beat 1) is the most important moment in the cycle — the point of
 * resolution, where melodic and rhythmic lines converge. Khali (beat 9)
 * is the "empty" beat, played with an open hand wave rather than a clap.
 * The contrast between the resonant "Dha" bols of vibhags 1-2 and the
 * open "Ta/Tin" bols of vibhag 3 gives Teentaal its characteristic
 * rhythmic breathing.
 *
 * Teentaal is used in compositions from vilambit (very slow, ~30-60 BPM
 * per matra) to ati-drut (extremely fast, 300+ BPM per matra).
 */

import type { Tala } from '../types';

/**
 * Teentaal — 16-beat rhythmic cycle.
 *
 * The theka uses standard tabla bols:
 * - Dha: resonant bass + treble stroke (bayan + dayan)
 * - Dhin: resonant bass + sustained treble
 * - Tin: treble only, sustained (no bass — khali character)
 * - Ta: treble only, dry (no bass — khali character)
 */
export const teentaal: Tala = {
  id: 'teentaal',
  name: 'Teentaal',
  nameDevanagari: 'तीनताल',

  beats: 16,

  vibhag: [4, 4, 4, 4],

  sam: 1,

  khali: [9],

  clapPattern: ['sam', 'tali', 'khali', 'tali'],

  theka: [
    'Dha', 'Dhin', 'Dhin', 'Dha',     // Vibhag 1 — sam
    'Dha', 'Dhin', 'Dhin', 'Dha',     // Vibhag 2 — tali
    'Dha', 'Tin',  'Tin',  'Ta',      // Vibhag 3 — khali
    'Ta',  'Dhin', 'Dhin', 'Dha',     // Vibhag 4 — tali (resolves to sam)
  ],

  description:
    'Teentaal is the foundational tala of Hindustani Classical Music — 16 beats ' +
    'divided symmetrically into four vibhags of 4 beats each. Its balanced ' +
    'structure makes it the most versatile tala, used for everything from ' +
    'meditative vilambit compositions to blazing drut taans. The contrast between ' +
    'the resonant Dha/Dhin strokes of the first two vibhags and the open Tin/Ta ' +
    'strokes of the khali vibhag creates a rhythmic breathing that musicians ' +
    'and audiences internalise deeply. Sam — beat 1 — is the gravitational ' +
    'centre, the moment of arrival and resolution.',
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Get the bol (tabla syllable) at a given beat position.
 *
 * @param beat - Beat number (1-indexed, 1 to 16).
 * @returns The bol string at that beat, or undefined if out of range.
 */
export function getBolAtBeat(beat: number): string | undefined {
  if (beat < 1 || beat > teentaal.beats) return undefined;
  return teentaal.theka[beat - 1];
}

/**
 * Determine which vibhag a given beat belongs to.
 *
 * @param beat - Beat number (1-indexed).
 * @returns The vibhag index (0-based), or -1 if out of range.
 */
export function getVibhagForBeat(beat: number): number {
  if (beat < 1 || beat > teentaal.beats) return -1;
  let accumulated = 0;
  for (let i = 0; i < teentaal.vibhag.length; i++) {
    accumulated += teentaal.vibhag[i]!;
    if (beat <= accumulated) return i;
  }
  return -1;
}

/**
 * Check if a given beat is sam (the anchoring first beat).
 */
export function isSam(beat: number): boolean {
  return beat === teentaal.sam;
}

/**
 * Check if a given beat is khali (the empty beat).
 */
export function isKhali(beat: number): boolean {
  return teentaal.khali.includes(beat);
}

/**
 * Get the clap type for a given beat's vibhag.
 *
 * @param beat - Beat number (1-indexed).
 * @returns 'sam' | 'tali' | 'khali', or undefined if out of range.
 */
export function getClapTypeForBeat(beat: number): string | undefined {
  const vibhag = getVibhagForBeat(beat);
  if (vibhag === -1) return undefined;
  return teentaal.clapPattern[vibhag];
}

/**
 * Generate the full theka for N cycles, useful for practice loops.
 *
 * @param cycles - Number of avartan (complete cycles) to generate.
 * @returns Array of bols for the complete practice sequence.
 */
export function generateTheka(cycles: number): readonly string[] {
  const result: string[] = [];
  for (let i = 0; i < cycles; i++) {
    result.push(...teentaal.theka);
  }
  return result;
}
