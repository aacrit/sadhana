/**
 * @module engine/theory/ragas
 *
 * The Raga Registry — query and discover ragas by time, emotion, swara usage.
 *
 * This module imports all raga definitions and provides a typed registry with
 * query functions. It is the entry point for any code that needs to work
 * with ragas: the voice pipeline queries it for context-aware pitch mapping,
 * the journey layer queries it for lesson sequencing, and the synthesis
 * engine queries it for phrase generation.
 */

import type { Prahara, Raga, Rasa, Swara } from './types';
import { yaman } from './ragas/yaman';
import { bhairav } from './ragas/bhairav';
import { bhoopali } from './ragas/bhoopali';
import { bhimpalasi } from './ragas/bhimpalasi';
import { bageshri } from './ragas/bageshri';
import { desh } from './ragas/desh';
import { kafi } from './ragas/kafi';
import { marwa } from './ragas/marwa';
import { darbari_kanada } from './ragas/darbari_kanada';
import { puriya_dhanashri } from './ragas/puriya_dhanashri';
import { malkauns } from './ragas/malkauns';
import { todi } from './ragas/todi';
import { bhairavi } from './ragas/bhairavi';
import { kedar } from './ragas/kedar';
import { hameer } from './ragas/hameer';
import { sohini } from './ragas/sohini';

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * All ragas indexed by ID.
 * v1 includes five ragas ordered by pedagogical accessibility:
 * Bhoopali (pentatonic) -> Yaman (sampoorna) -> Bhimpalasi (komal swaras)
 * -> Bhairav (dawn gravity) -> Bageshri (deep night).
 */
export const RAGAS: Readonly<Record<string, Raga>> = {
  yaman,
  bhairav,
  bhoopali,
  bhimpalasi,
  bageshri,
  desh,
  kafi,
  marwa,
  darbari_kanada,
  puriya_dhanashri,
  malkauns,
  todi,
  bhairavi,
  kedar,
  hameer,
  sohini,
};

/**
 * All ragas as an ordered array, sorted by pedagogical sequence
 * (simplest to most complex).
 */
export const RAGA_LIST: readonly Raga[] = [
  // --- Shishya (Beginner) ---
  bhoopali,    // Level 1 — pentatonic, all shuddha
  yaman,       // Level 2 — sampoorna, one alteration (Ma_t)
  bhimpalasi,  // Level 3 — komal swaras, vakra movement
  bhairav,     // Level 4 — andolan, dawn gravity
  bageshri,    // Level 5 — midnight longing, emotional depth
  // --- Sadhaka (Intermediate) ---
  desh,        // Level 6 — Khamaj thaat, dual Ni treatment
  kafi,        // Level 7 — parent of Kafi thaat, komal Ga/Ni
  // --- Varistha (Advanced) ---
  marwa,       // Level 8 — no Pa, sunset tension, Marwa thaat
  darbari_kanada, // Level 9 — andolan on Ga_k, vakra avaroha
  puriya_dhanashri, // Level 10 — Poorvi thaat, 3 altered swaras
  malkauns,    // Level 11 — pentatonic, no Re/Pa, all komal
  todi,        // Level 12 — maximum chromaticism, 4 altered swaras
  // --- Guru (Master) ---
  bhairavi,    // Level 13 — all komal, allows all 12 passing tones
  kedar,       // Level 14 — dual Ma, Kalyan thaat
  hameer,      // Level 15 — dual Ma, distinct from Kedar, regal
  sohini,      // Level 16 — Marwa thaat, no Pa, light contrast to Marwa
] as const;

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { yaman } from './ragas/yaman';
export { bhairav } from './ragas/bhairav';
export { bhoopali } from './ragas/bhoopali';
export { bhimpalasi } from './ragas/bhimpalasi';
export { bageshri } from './ragas/bageshri';
export { desh } from './ragas/desh';
export { kafi } from './ragas/kafi';
export { marwa } from './ragas/marwa';
export { darbari_kanada } from './ragas/darbari_kanada';
export { puriya_dhanashri } from './ragas/puriya_dhanashri';
export { malkauns } from './ragas/malkauns';
export { todi } from './ragas/todi';
export { bhairavi } from './ragas/bhairavi';
export { kedar } from './ragas/kedar';
export { hameer } from './ragas/hameer';
export { sohini } from './ragas/sohini';

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Get all ragas performed during a given prahara (3-hour time window).
 *
 * @param prahara - The prahara number (1-8).
 * @returns Array of ragas whose traditional performance time includes this prahara.
 *
 * @example
 * getRagasByPrahara(1) // => [bhairav] — dawn
 * getRagasByPrahara(5) // => [yaman, bhoopali] — evening
 */
export function getRagasByPrahara(prahara: Prahara): Raga[] {
  return RAGA_LIST.filter(raga => raga.prahara.includes(prahara));
}

/**
 * Get all ragas embodying a given rasa (emotional essence).
 *
 * @param rasa - The rasa to search for.
 * @returns Array of ragas whose rasa list includes the given emotion.
 *
 * @example
 * getRagasByRasa('karuna') // => [bhimpalasi, bhairav]
 */
export function getRagasByRasa(rasa: Rasa): Raga[] {
  return RAGA_LIST.filter(raga => raga.rasa.includes(rasa));
}

/**
 * Get all ragas that use a given swara (in aroha or avaroha).
 *
 * @param swara - The swara symbol to search for.
 * @returns Array of ragas whose aroha or avaroha includes this swara.
 *
 * @example
 * getRagasUsingSwara('Ma_t') // => [yaman]
 * getRagasUsingSwara('Ga_k') // => [bhimpalasi, bageshri]
 */
export function getRagasUsingSwara(swara: Swara): Raga[] {
  return RAGA_LIST.filter(raga => {
    const allSwaras = [
      ...raga.aroha.map(note => note.swara),
      ...raga.avaroha.map(note => note.swara),
    ];
    return allSwaras.includes(swara);
  });
}

/**
 * Get all ragas belonging to a given thaat.
 *
 * @param thaat - The thaat identifier (e.g., 'kalyan', 'kafi').
 * @returns Array of ragas in that thaat.
 */
export function getRagasByThaat(thaat: string): Raga[] {
  return RAGA_LIST.filter(raga => raga.thaat === thaat);
}

/**
 * Map a 24-hour clock time to the most appropriate raga.
 *
 * This maps the hour (0-23) to a prahara, then selects the first raga
 * whose prahara matches. If multiple ragas share a prahara, the one
 * listed first in the pedagogical sequence is returned.
 *
 * The time-raga association is traditional guidance, not rigid rule.
 * This function provides a starting suggestion, not a prohibition.
 *
 * Prahara mapping:
 *   1: 6-9    (dawn)
 *   2: 9-12   (morning)
 *   3: 12-15  (early afternoon)
 *   4: 15-18  (late afternoon)
 *   5: 18-21  (evening)
 *   6: 21-24  (late evening)
 *   7: 0-3    (midnight)
 *   8: 3-6    (pre-dawn)
 *
 * @param hour - The hour in 24-hour format (0-23).
 * @returns The most appropriate raga, or the first raga in the registry as fallback.
 */
export function getRagaForTimeOfDay(hour: number): Raga {
  const normalised = ((hour % 24) + 24) % 24; // handle negative or >23
  let prahara: Prahara;

  if (normalised >= 6 && normalised < 9) prahara = 1;
  else if (normalised >= 9 && normalised < 12) prahara = 2;
  else if (normalised >= 12 && normalised < 15) prahara = 3;
  else if (normalised >= 15 && normalised < 18) prahara = 4;
  else if (normalised >= 18 && normalised < 21) prahara = 5;
  else if (normalised >= 21 && normalised < 24) prahara = 6;
  else if (normalised >= 0 && normalised < 3) prahara = 7;
  else prahara = 8; // 3-6

  const matches = getRagasByPrahara(prahara);
  return matches[0] ?? RAGA_LIST[0]!;
}

/**
 * Get a raga by its ID.
 *
 * @param id - The raga identifier (e.g., 'yaman', 'bhairav').
 * @returns The Raga object, or undefined if not found.
 */
export function getRagaById(id: string): Raga | undefined {
  return RAGAS[id];
}

/**
 * Get the count of distinct swaras used in a raga's aroha.
 * Useful for filtering by complexity (audava = 5, shadava = 6, sampoorna = 7).
 */
export function getArohaCount(raga: Raga): number {
  const unique = new Set(raga.aroha.map(note => note.swara));
  // Remove taar Sa if present (it's the same swara, just octave higher)
  return unique.size;
}

/**
 * Get all swaras used in a raga (union of aroha and avaroha), deduplicated.
 */
export function getRagaSwaras(raga: Raga): Swara[] {
  const set = new Set<Swara>();
  for (const note of raga.aroha) set.add(note.swara);
  for (const note of raga.avaroha) set.add(note.swara);
  return Array.from(set);
}
