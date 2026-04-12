/**
 * @module engine/theory/ornaments
 *
 * Mathematical definitions of Hindustani Classical ornaments (alankar).
 *
 * Each ornament is defined not just by description but by its sonic
 * parameters: frequency trajectory, duration, oscillation rate, amplitude.
 * These definitions serve two purposes:
 *
 * 1. The synthesis engine uses them to generate ornamented swaras.
 * 2. The analysis engine uses them to detect ornaments in student input.
 *
 * The parameters are derived from acoustic analysis of master musicians'
 * recordings. Ranges are provided rather than fixed values because
 * ornament execution varies by raga context, gharana, tempo, and artist.
 */

import type { OrnamentDefinition, Swara } from './types';

/**
 * Meend — the glide.
 *
 * A continuous pitch slide from one swara to another. The most important
 * ornament in Hindustani music. A well-executed meend reveals the
 * microtonal landscape between two swaras — the listener hears not
 * just the start and end points but the entire journey.
 *
 * The trajectory is typically logarithmic (following the ear's perception
 * of pitch), not linear in frequency space.
 *
 * In Bhairav, meend from Ga to Re_k is definitive.
 * In Yaman, meend from Ga to Re through Ma_t is characteristic.
 */
export const MEEND: OrnamentDefinition = {
  type: 'meend',
  name: 'Meend',
  nameDevanagari: 'मींड',
  description:
    'A continuous glide from one swara to another, revealing the microtonal ' +
    'space between them. The defining ornament of Hindustani vocal music.',
  trajectoryShape: 'logarithmic',
  durationRangeMs: [300, 3000],
  characteristicRagas: ['yaman', 'bhairav', 'bhoopali', 'bhimpalasi', 'bageshri'],
  characteristicSwaras: [],
};

/**
 * Gamak — the shake.
 *
 * A rapid, forceful oscillation around a swara. Unlike andolan (which is
 * gentle and slow), gamak is vigorous — the pitch swings widely and quickly,
 * often covering a full semitone or more on either side of the target swara.
 *
 * Gamak is prominent in dhrupad singing and in instrumental music (especially
 * sitar and sarod). It adds power and intensity to a phrase.
 *
 * Oscillation: typically 4-8 Hz, with amplitude of 50-150 cents.
 */
export const GAMAK: OrnamentDefinition = {
  type: 'gamak',
  name: 'Gamak',
  nameDevanagari: 'गमक',
  description:
    'A rapid, forceful oscillation around a swara. Adds intensity and power. ' +
    'Wider and faster than andolan — the pitch swings vigorously.',
  trajectoryShape: 'sinusoidal',
  durationRangeMs: [200, 1500],
  oscillationRateHz: [4, 8],
  oscillationAmplitudeCents: [50, 150],
  characteristicRagas: ['bhairav', 'bhimpalasi'],
  characteristicSwaras: [],
};

/**
 * Andolan — the gentle wave.
 *
 * A slow, subtle oscillation around a swara — much gentler and slower
 * than gamak. Andolan gives a swara a quality of being alive, breathing,
 * slightly unstable in a beautiful way.
 *
 * Andolan is characteristic of specific swaras in specific ragas:
 * - Re_k and Dha_k in Bhairav (the signature sound)
 * - Ga in Yaman (subtle)
 * - Ga_k in Darbari Kanada (the most famous andolan in Hindustani music)
 *
 * Oscillation: typically 2-4 Hz, with amplitude of 15-40 cents.
 */
export const ANDOLAN: OrnamentDefinition = {
  type: 'andolan',
  name: 'Andolan',
  nameDevanagari: 'आंदोलन',
  description:
    'A slow, gentle oscillation around a swara. The swara breathes and shimmers. ' +
    'Characteristic of komal swaras in specific ragas (Re_k and Dha_k in Bhairav).',
  trajectoryShape: 'sinusoidal',
  durationRangeMs: [500, 4000],
  oscillationRateHz: [2, 4],
  oscillationAmplitudeCents: [15, 40],
  characteristicRagas: ['bhairav', 'darbari_kanada', 'yaman'],
  characteristicSwaras: ['Re_k', 'Dha_k', 'Ga_k', 'Ga'] as Swara[],
};

/**
 * Murki — the rapid cluster.
 *
 * A very fast, light ornament involving 3-4 swaras executed in rapid
 * succession. The individual notes are barely distinguishable — the ear
 * perceives a shimmering cluster rather than distinct pitches.
 *
 * Murki is common in khayal and thumri singing. It adds sparkle and
 * lightness to a phrase. Duration is typically very short (50-200ms total).
 */
export const MURKI: OrnamentDefinition = {
  type: 'murki',
  name: 'Murki',
  nameDevanagari: 'मुरकी',
  description:
    'A rapid 3-4 note ornament executed so quickly that individual swaras blur ' +
    'into a shimmering cluster. Adds sparkle and lightness.',
  trajectoryShape: 'sequence',
  durationRangeMs: [50, 200],
  noteCount: [3, 4],
  characteristicRagas: ['yaman', 'bhimpalasi', 'bageshri'],
  characteristicSwaras: [],
};

/**
 * Khatka — the jerk.
 *
 * A quick, sharp ornament — a rapid turn involving 2-4 notes. Similar
 * to murki but with more rhythmic definition and sharpness. Where murki
 * shimmers, khatka bites.
 *
 * Common in lively compositions and taan passages.
 */
export const KHATKA: OrnamentDefinition = {
  type: 'khatka',
  name: 'Khatka',
  nameDevanagari: 'खटका',
  description:
    'A quick, sharp ornamental turn involving 2-4 notes. More rhythmically ' +
    'defined than murki — where murki shimmers, khatka has a crisp bite.',
  trajectoryShape: 'sequence',
  durationRangeMs: [50, 150],
  noteCount: [2, 4],
  characteristicRagas: ['bageshri', 'kafi'],
  characteristicSwaras: [],
};

/**
 * Zamzama — the extended ornamental run.
 *
 * An extended rapid passage ornament involving 5 or more notes. A longer,
 * more elaborate version of murki/khatka. Often used in taan passages
 * to create cascading, virtuosic effects.
 */
export const ZAMZAMA: OrnamentDefinition = {
  type: 'zamzama',
  name: 'Zamzama',
  nameDevanagari: 'ज़मज़मा',
  description:
    'An extended rapid ornamental passage of 5 or more notes. A virtuosic ' +
    'elaboration — cascading, flowing, often covering a wide range.',
  trajectoryShape: 'sequence',
  durationRangeMs: [150, 500],
  noteCount: [5, 12],
  characteristicRagas: [],
  characteristicSwaras: [],
};

/**
 * Kan — the grace note.
 *
 * A very brief touch of an adjacent swara before landing on the target
 * swara. Duration is typically under 50ms — the ear barely registers the
 * grace note as a separate pitch, but it colours the landing swara.
 *
 * Kan is used extensively in all ragas. In Yaman, a kan of Re before Ga
 * is characteristic. In Bhairav, a kan of Sa before Re_k adds definition.
 *
 * The frequency trajectory is an impulse: a very brief spike to the
 * grace-note frequency, then immediate landing on the target frequency.
 */
export const KAN: OrnamentDefinition = {
  type: 'kan',
  name: 'Kan',
  nameDevanagari: 'कण',
  description:
    'A grace note — a very brief (<50ms) touch of an adjacent swara before ' +
    'landing on the target. Colours the arrival without being heard as a ' +
    'separate note.',
  trajectoryShape: 'impulse',
  durationRangeMs: [10, 50],
  characteristicRagas: ['yaman', 'bhairav', 'bhoopali', 'bhimpalasi', 'bageshri'],
  characteristicSwaras: [],
};

/**
 * Sparsh — the touch.
 *
 * Similar to kan but with slightly more presence — the adjacent swara
 * is touched with enough duration to be perceptible, but not enough to
 * constitute a full note. Used particularly in instrumental music where
 * the physical "touch" of a string or key is part of the technique.
 *
 * Duration is slightly longer than kan: 20-80ms.
 */
export const SPARSH: OrnamentDefinition = {
  type: 'sparsh',
  name: 'Sparsh',
  nameDevanagari: 'स्पर्श',
  description:
    'A touch — slightly more present than kan. The adjacent swara is ' +
    'perceptibly sounded before resolving to the target. Common in ' +
    'instrumental technique.',
  trajectoryShape: 'impulse',
  durationRangeMs: [20, 80],
  characteristicRagas: [],
  characteristicSwaras: [],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * All ornaments indexed by type.
 */
export const ORNAMENTS: Readonly<Record<string, OrnamentDefinition>> = {
  meend: MEEND,
  gamak: GAMAK,
  andolan: ANDOLAN,
  murki: MURKI,
  khatka: KHATKA,
  zamzama: ZAMZAMA,
  kan: KAN,
  sparsh: SPARSH,
};

/**
 * All ornaments as an ordered array, from most common to most specialised.
 */
export const ORNAMENT_LIST: readonly OrnamentDefinition[] = [
  MEEND,
  KAN,
  GAMAK,
  ANDOLAN,
  MURKI,
  KHATKA,
  ZAMZAMA,
  SPARSH,
] as const;

/**
 * Get the ornament definition by type.
 */
export function getOrnament(type: string): OrnamentDefinition | undefined {
  return ORNAMENTS[type];
}

/**
 * Get all ornaments that are characteristic of a given raga.
 */
export function getOrnamentsForRaga(ragaId: string): OrnamentDefinition[] {
  return ORNAMENT_LIST.filter(o => o.characteristicRagas.includes(ragaId));
}

/**
 * Get all ornaments that are characteristically applied to a given swara.
 */
export function getOrnamentsForSwara(swara: Swara): OrnamentDefinition[] {
  return ORNAMENT_LIST.filter(o => o.characteristicSwaras.includes(swara));
}

/**
 * Generate the frequency trajectory for a meend (glide) between two swaras.
 *
 * @param startHz - Starting frequency in Hz.
 * @param endHz - Ending frequency in Hz.
 * @param durationMs - Duration in milliseconds.
 * @param steps - Number of discrete steps in the trajectory.
 * @returns Array of [timeMs, frequencyHz] pairs.
 */
export function generateMeendTrajectory(
  startHz: number,
  endHz: number,
  durationMs: number,
  steps: number = 50,
): readonly [number, number][] {
  const trajectory: [number, number][] = [];
  const logStart = Math.log2(startHz);
  const logEnd = Math.log2(endHz);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const timeMs = t * durationMs;
    // Logarithmic interpolation in frequency space (perceptually linear)
    const logFreq = logStart + t * (logEnd - logStart);
    const hz = Math.pow(2, logFreq);
    trajectory.push([timeMs, hz]);
  }

  return trajectory;
}

/**
 * Generate the frequency trajectory for a gamak or andolan oscillation.
 *
 * @param centreHz - Centre frequency in Hz.
 * @param amplitudeCents - Oscillation amplitude in cents.
 * @param rateHz - Oscillation rate in Hz.
 * @param durationMs - Duration in milliseconds.
 * @param steps - Number of discrete steps.
 * @returns Array of [timeMs, frequencyHz] pairs.
 */
export function generateOscillationTrajectory(
  centreHz: number,
  amplitudeCents: number,
  rateHz: number,
  durationMs: number,
  steps: number = 100,
): readonly [number, number][] {
  const trajectory: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const timeMs = t * durationMs;
    const phase = 2 * Math.PI * rateHz * (timeMs / 1000);
    const centsOffset = amplitudeCents * Math.sin(phase);
    const hz = centreHz * Math.pow(2, centsOffset / 1200);
    trajectory.push([timeMs, hz]);
  }

  return trajectory;
}
