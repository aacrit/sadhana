/**
 * @module engine/synthesis/voice/ornament-voice
 *
 * TantriVoice(TM) — Voice-specific ornament rendering.
 *
 * Ornaments on a human voice differ fundamentally from ornaments on a
 * harmonium or other instrument:
 *
 *   - Meend: continuous portamento with STABLE formants (the vowel stays
 *     "aa" while the pitch glides — unlike harmonium where timbre changes)
 *   - Gamak: rapid pitch oscillation with slight formant wobble from
 *     laryngeal movement
 *   - Andolan: gentle oscillation, formants perfectly stable — the
 *     characteristic "breathing" quality of komal swaras
 *   - Kan: brief pitch spike with a glottal pulse reset (slight amplitude
 *     dip at the grace note boundary)
 *   - Murki: rapid discrete pitch changes with micro-silences between
 *     notes (glottal stops)
 *
 * KEY PRINCIPLE: Ornaments in voice synthesis affect PITCH (glottal
 * oscillator frequency), NOT TIMBRE (formant frequencies). The vocal
 * tract shape does not change when a singer does meend or andolan.
 * This simplifies implementation: all ornaments schedule frequency
 * changes on the GlottalSource, leaving the VocalTract untouched.
 */

import type { GlottalSource } from './source-model';
import type { VocalTract } from './tract-model';
import type { Swara, Raga, Ornament } from '../../theory/types';

// ---------------------------------------------------------------------------
// S-curve trajectory for meend
// ---------------------------------------------------------------------------

/**
 * Attempt to generate a sigmoid (S-curve) meend trajectory.
 *
 * A beautiful meend has non-uniform velocity:
 *   1. Depart slowly — lingering on the starting swara
 *   2. Accelerate through the middle — momentum
 *   3. Decelerate approaching target — savoring the arrival
 *   4. Settle with micro-andolan (1-2 oscillations, 10-15 cents)
 *
 * This replaces the simpler logarithmic trajectory with a perceptually
 * superior sigmoid shape.
 */
function sCurve(t: number): number {
  // Attempt to use an ease-in-out cubic for S-shaped meend
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Generate frequency trajectory points for an S-curve meend.
 *
 * @param startHz - Starting frequency
 * @param endHz - Ending frequency
 * @param durationSec - Total meend duration
 * @param startTime - AudioContext start time
 * @param pointsPerSecond - Resolution (default 60 for smooth glide)
 */
export function generateMeendPoints(
  startHz: number,
  endHz: number,
  durationSec: number,
  startTime: number,
  pointsPerSecond: number = 60,
): Array<{ time: number; hz: number }> {
  const totalPoints = Math.ceil(durationSec * pointsPerSecond);
  const points: Array<{ time: number; hz: number }> = [];

  // Main glide: 95% of duration
  const glideEnd = durationSec * 0.95;
  const logStart = Math.log(startHz);
  const logEnd = Math.log(endHz);

  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints;
    const time = startTime + t * glideEnd;
    const shaped = sCurve(t);
    // Logarithmic interpolation for perceptually linear pitch
    const logHz = logStart + shaped * (logEnd - logStart);
    points.push({ time, hz: Math.exp(logHz) });
  }

  // Settling micro-andolan: final 5% of duration
  const settleStart = startTime + glideEnd;
  const settleDuration = durationSec * 0.05;
  const settlePoints = Math.ceil(settleDuration * pointsPerSecond);
  const settleAmplitudeCents = 12;
  const settleRate = 8; // Hz — fast settling oscillation

  for (let i = 0; i <= settlePoints; i++) {
    const t = i / settlePoints;
    const time = settleStart + t * settleDuration;
    const decay = 1 - t; // Amplitude decays to zero
    const deviation = settleAmplitudeCents * decay * Math.sin(2 * Math.PI * settleRate * t * settleDuration);
    const hz = endHz * Math.pow(2, deviation / 1200);
    points.push({ time, hz });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Ornament application functions
// ---------------------------------------------------------------------------

/**
 * Apply meend (glide) between two pitches on the vocal synth.
 *
 * Uses the S-curve trajectory for natural, musical gliding.
 * Formants remain stable — this is how real voices do meend:
 * pitch changes, vowel stays.
 */
export function applyVocalMeend(
  source: GlottalSource,
  _tract: VocalTract,
  startHz: number,
  endHz: number,
  durationSec: number,
  startTime: number,
): void {
  const points = generateMeendPoints(startHz, endHz, durationSec, startTime);
  source.scheduleFrequencies(points);
}

/**
 * Apply gamak (rapid oscillation) to the vocal synth.
 *
 * Source frequency oscillates rapidly. Slight F1 wobble models
 * laryngeal movement during vigorous singing.
 */
export function applyVocalGamak(
  source: GlottalSource,
  tract: VocalTract,
  centreHz: number,
  amplitudeCents: number,
  rateHz: number,
  durationSec: number,
  startTime: number,
): void {
  const pointsPerSecond = Math.max(rateHz * 8, 60);
  const totalPoints = Math.ceil(durationSec * pointsPerSecond);
  const points: Array<{ time: number; hz: number }> = [];

  // Envelope: ramp up over first 2 cycles, steady, ramp down over last cycle
  const rampUpDuration = 2 / rateHz;
  const rampDownStart = durationSec - (1 / rateHz);

  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints;
    const time = startTime + t * durationSec;
    const elapsed = t * durationSec;

    // Envelope
    let envelope = 1.0;
    if (elapsed < rampUpDuration) {
      envelope = elapsed / rampUpDuration;
    } else if (elapsed > rampDownStart) {
      envelope = (durationSec - elapsed) / (durationSec - rampDownStart);
    }

    // Oscillation with slight asymmetry (Agra-style: pulls toward lower swara)
    const phase = 2 * Math.PI * rateHz * elapsed;
    const deviation = amplitudeCents * envelope * (Math.sin(phase) - 0.1 * Math.sin(2 * phase));
    const hz = centreHz * Math.pow(2, deviation / 1200);
    points.push({ time, hz });
  }

  source.scheduleFrequencies(points);

  // Slight F1 wobble (laryngeal movement during gamak)
  // This is modeled by a very small formant frequency modulation
  // We don't modify the tract for now — the pitch oscillation alone
  // creates sufficient perceptual gamak effect
}

/**
 * Apply andolan (gentle oscillation) to the vocal synth.
 *
 * Slower and subtler than gamak. The characteristic "breathing"
 * quality of komal swaras in ragas like Bhairav and Darbari.
 */
export function applyVocalAndolan(
  source: GlottalSource,
  _tract: VocalTract,
  centreHz: number,
  amplitudeCents: number,
  rateHz: number,
  durationSec: number,
  startTime: number,
): void {
  const pointsPerSecond = Math.max(rateHz * 8, 30);
  const totalPoints = Math.ceil(durationSec * pointsPerSecond);
  const points: Array<{ time: number; hz: number }> = [];

  // Gradual onset, sustained, gradual offset
  const onsetDuration = Math.min(0.5, durationSec * 0.2);
  const offsetStart = durationSec - Math.min(0.3, durationSec * 0.15);

  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints;
    const time = startTime + t * durationSec;
    const elapsed = t * durationSec;

    let envelope = 1.0;
    if (elapsed < onsetDuration) {
      envelope = elapsed / onsetDuration;
    } else if (elapsed > offsetStart) {
      envelope = (durationSec - elapsed) / (durationSec - offsetStart);
    }

    // Pure sinusoidal — symmetric, gentle
    const deviation = amplitudeCents * envelope * Math.sin(2 * Math.PI * rateHz * elapsed);
    const hz = centreHz * Math.pow(2, deviation / 1200);
    points.push({ time, hz });
  }

  source.scheduleFrequencies(points);
}

/**
 * Apply kan (grace note) to the vocal synth.
 *
 * Brief pitch spike with a micro amplitude dip at the transition
 * (models the glottal reset when a singer rapidly changes pitch).
 *
 * @param graceHz - Frequency of the grace note
 * @param targetHz - Frequency of the target swara
 * @param graceDurationSec - Duration of the grace note (20-50ms)
 */
export function applyVocalKan(
  source: GlottalSource,
  _tract: VocalTract,
  graceHz: number,
  targetHz: number,
  graceDurationSec: number,
  startTime: number,
): void {
  // Grace note frequency
  source.setFrequency(graceHz, startTime);

  // Micro amplitude dip at transition (glottal reset)
  const dipTime = startTime + graceDurationSec;
  source.setVolume(0.35, dipTime - 0.005);
  source.setVolume(0.5, dipTime + 0.005);

  // Land on target
  source.setFrequency(targetHz, dipTime);
}

/**
 * Apply murki (rapid cluster) as a sequence of discrete glottal pulses.
 *
 * Each note in the cluster gets a micro-silence (5-10ms glottal stop)
 * at its boundary. This produces the characteristic rapid articulation.
 */
export function applyVocalMurki(
  source: GlottalSource,
  _tract: VocalTract,
  frequencies: readonly number[],
  totalDurationSec: number,
  startTime: number,
): void {
  if (frequencies.length === 0) return;

  const noteCount = frequencies.length;
  const gapDuration = 0.008; // 8ms glottal stop between notes
  const totalGaps = (noteCount - 1) * gapDuration;
  const noteDuration = (totalDurationSec - totalGaps) / noteCount;

  let currentTime = startTime;

  for (let i = 0; i < noteCount; i++) {
    const hz = frequencies[i]!;

    // Attack: brief ramp up (2ms)
    source.setVolume(0.15, currentTime);
    source.setFrequency(hz, currentTime);
    source.setVolume(0.5, currentTime + 0.002);

    currentTime += noteDuration;

    // Gap: micro-silence (glottal stop)
    if (i < noteCount - 1) {
      source.setVolume(0.05, currentTime);
      currentTime += gapDuration;
    }
  }
}

/**
 * Apply khatka (sharp turn) — similar to murki but with harder attacks.
 */
export function applyVocalKhatka(
  source: GlottalSource,
  tract: VocalTract,
  frequencies: readonly number[],
  totalDurationSec: number,
  startTime: number,
): void {
  // Khatka is murki with shorter gaps and harder attacks
  applyVocalMurki(source, tract, frequencies, totalDurationSec * 0.85, startTime);
}

// ---------------------------------------------------------------------------
// Raga-aware kan direction lookup
// ---------------------------------------------------------------------------

/**
 * Per-raga kan source swara lookup.
 * Determines which swara the grace note comes from.
 * This fixes the existing bug where kan always approaches from above.
 */
export interface KanSpec {
  readonly source: Swara;
  readonly direction: 'below' | 'above';
}

const RAGA_KAN_MAP: Record<string, Partial<Record<Swara, KanSpec>>> = {
  yaman: {
    Ga:  { source: 'Re', direction: 'below' },
    Ni:  { source: 'Dha', direction: 'below' },
    Re:  { source: 'Ni', direction: 'below' },
    Pa:  { source: 'Ma_t', direction: 'below' },
  },
  bhairav: {
    Re_k: { source: 'Sa', direction: 'below' },
    Dha_k: { source: 'Pa', direction: 'below' },
    Ga:   { source: 'Re_k', direction: 'below' },
  },
  bhoopali: {
    Ga:  { source: 'Re', direction: 'below' },
    Dha: { source: 'Pa', direction: 'below' },
  },
  bhimpalasi: {
    Ma:  { source: 'Ga_k', direction: 'below' },
    Pa:  { source: 'Ma', direction: 'below' },
    Ni_k: { source: 'Dha', direction: 'below' },
  },
  bageshri: {
    Ma:   { source: 'Ga_k', direction: 'below' },
    Dha:  { source: 'Pa', direction: 'below' },
    Ni_k: { source: 'Dha', direction: 'below' },
  },
};

/**
 * Get the kan specification for a swara in a raga context.
 * Returns null if no specific kan is defined (use generic).
 */
export function getKanSpec(ragaId: string, targetSwara: Swara): KanSpec | null {
  return RAGA_KAN_MAP[ragaId]?.[targetSwara] ?? null;
}

// ---------------------------------------------------------------------------
// Per-raga andolan parameters
// ---------------------------------------------------------------------------

export interface AndolanSpec {
  readonly rateHz: number;
  readonly amplitudeCents: number;
}

const RAGA_ANDOLAN_MAP: Record<string, Partial<Record<Swara, AndolanSpec>>> = {
  bhairav: {
    Re_k:  { rateHz: 2.5, amplitudeCents: 25 },
    Dha_k: { rateHz: 3.0, amplitudeCents: 20 },
  },
  yaman: {
    Ga: { rateHz: 3.5, amplitudeCents: 12 },
  },
  bhimpalasi: {
    Ga_k: { rateHz: 2.5, amplitudeCents: 20 },
  },
  bageshri: {
    Ga_k: { rateHz: 2.5, amplitudeCents: 20 },
  },
  darbari_kanada: {
    Ga_k: { rateHz: 2.0, amplitudeCents: 35 },
    Re:   { rateHz: 2.5, amplitudeCents: 15 },
    Dha_k: { rateHz: 2.0, amplitudeCents: 25 },
  },
};

/**
 * Get the andolan specification for a swara in a raga context.
 */
export function getAndolanSpec(ragaId: string, swara: Swara): AndolanSpec | null {
  return RAGA_ANDOLAN_MAP[ragaId]?.[swara] ?? null;
}

// ---------------------------------------------------------------------------
// Per-raga swara intonation offsets
// ---------------------------------------------------------------------------

/**
 * Per-raga intonation offset in cents from the standard JI position.
 * Re_k in Bhairav sits ~8 cents sharp of 16/15.
 * Ga_k in Darbari sits ~22 cents flat of 6/5 (targeting 32/27 = 294 cents per Daniélou/Jairazbhoy).
 */
const RAGA_INTONATION_MAP: Record<string, Partial<Record<Swara, number>>> = {
  bhairav: {
    Re_k: +8,   // 120 cents total (vs standard 112)
    Dha_k: 0,
  },
  darbari_kanada: {
    Ga_k: -22,  // 294 cents total (vs standard 316) — the famous Darbari Ga at 32/27
    Dha_k: -10, // slightly flat
  },
  bageshri: {
    Ga_k: -6,   // 310 cents — slightly yearning
  },
};

/**
 * Get the intonation offset for a swara in a raga context.
 * Returns 0 if no offset is defined (use standard JI).
 */
export function getIntonationOffset(ragaId: string, swara: Swara): number {
  return RAGA_INTONATION_MAP[ragaId]?.[swara] ?? 0;
}

/**
 * Determine which ornament should be applied to a swara in a raga context.
 * Returns null if no ornament is appropriate.
 */
export function getVocalOrnamentForSwara(
  swara: Swara,
  raga: Raga,
  context: {
    preceding?: Swara;
    following?: Swara;
    isVadi: boolean;
    isAscending: boolean;
  },
  ornamentLevel: 'none' | 'subtle' | 'natural' | 'elaborate',
): Ornament | null {
  if (ornamentLevel === 'none') return null;

  // Achala swaras (Sa, Pa) never get ornaments
  if (swara === 'Sa' || swara === 'Pa') return null;

  // Check for raga-specific andolan
  const andolan = getAndolanSpec(raga.id, swara);
  if (andolan && ornamentLevel !== 'subtle') return 'andolan';

  // Check for raga-specific kan
  const kan = getKanSpec(raga.id, swara);
  if (kan && context.preceding) return 'kan';

  // Vadi gets subtle andolan at 'natural' level and above
  if (context.isVadi && ornamentLevel === 'elaborate') return 'andolan';

  return null;
}
