/**
 * @module engine/synthesis/swara-voice
 *
 * Individual swara synthesis and phrase playback.
 *
 * This module produces the sounds a student hears during lessons:
 *   - Single swara playback (with correct just-intonation tuning)
 *   - Phrase playback (a sequence of swaras with timing)
 *   - Pakad playback (the characteristic phrase of a raga)
 *   - Ornamented notes (meend, gamak, andolan applied to synthesis)
 *
 * All synthesis uses the Web Audio API directly for precise control over
 * frequency, timing, and amplitude envelopes. We avoid Tone.js for
 * individual swara playback because we need frame-accurate control over
 * frequency ramps (for meend/ornaments) that Tone.js's higher-level
 * abstractions can make harder.
 *
 * BROWSER REQUIREMENT: requires AudioContext (user gesture on iOS Safari).
 *
 * 'use client' — this module uses Web Audio API which requires browser APIs
 */

import type { Swara, SwaraNote, Raga, OrnamentDefinition, Ornament } from '../theory/types';
import { SWARA_MAP, getSwaraFrequency } from '../theory/swaras';
import { generateMeendTrajectory, generateOscillationTrajectory } from '../theory/ornaments';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for playing a single swara.
 */
export interface PlaySwaraOptions {
  /** Duration in seconds. Default: 0.5. */
  readonly duration?: number;
  /** Attack time in seconds (fade in). Default: 0.02. */
  readonly attack?: number;
  /** Release time in seconds (fade out). Default: 0.05. */
  readonly release?: number;
  /** Volume (0 to 1). Default: 0.5. */
  readonly volume?: number;
  /** Ornament to apply. */
  readonly ornament?: OrnamentDefinition;
}

/**
 * Options for playing a phrase.
 */
export interface PlayPhraseOptions {
  /** Tempo in beats per minute. Default: 60 (one swara per second). */
  readonly tempo?: number;
  /** Gap between notes in seconds. Default: 0.05. */
  readonly gap?: number;
  /** Volume (0 to 1). Default: 0.5. */
  readonly volume?: number;
}

// ---------------------------------------------------------------------------
// Shared AudioContext
// ---------------------------------------------------------------------------

let _sharedContext: AudioContext | null = null;

/**
 * Gets or creates the shared AudioContext for swara playback.
 * This is separate from the tanpura drone's context to allow
 * independent volume control and lifecycle.
 */
function getContext(): AudioContext {
  if (typeof AudioContext === 'undefined') {
    throw new Error('AudioContext is not available. Requires a browser environment.');
  }
  if (!_sharedContext || _sharedContext.state === 'closed') {
    _sharedContext = new AudioContext();
  }
  return _sharedContext;
}

/**
 * Ensures the AudioContext is running (resumes if suspended).
 * Must be called from a user gesture handler on iOS Safari.
 */
export async function ensureAudioReady(): Promise<void> {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

// ---------------------------------------------------------------------------
// Single swara playback
// ---------------------------------------------------------------------------

/**
 * Plays a single swara with correct just-intonation tuning.
 *
 * The synthesis uses a sine oscillator with a smooth attack/release
 * envelope. For ornamented notes, the frequency is modulated according
 * to the ornament's trajectory.
 *
 * @param swara - The swara to play
 * @param saHz - Sa frequency in Hz
 * @param options - Playback options (duration, volume, ornament)
 * @returns A promise that resolves when the note finishes
 */
export async function playSwara(
  swara: Swara,
  saHz: number,
  options: PlaySwaraOptions = {},
): Promise<void> {
  const {
    duration = 0.5,
    attack = 0.02,
    release = 0.05,
    volume = 0.5,
    ornament,
  } = options;

  const ctx = getContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const hz = getSwaraFrequency(swara, saHz, 'madhya');
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = hz;

  const gainNode = ctx.createGain();
  gainNode.gain.value = 0;

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Envelope: attack -> sustain -> release
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + attack);
  gainNode.gain.setValueAtTime(volume, now + duration - release);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);

  // Apply ornament if specified
  if (ornament) {
    applyOrnament(osc, ornament, hz, duration, now, ctx);
  }

  osc.start(now);
  osc.stop(now + duration + 0.01);

  return new Promise((resolve) => {
    osc.onended = () => {
      osc.disconnect();
      gainNode.disconnect();
      resolve();
    };
  });
}

/**
 * Plays a SwaraNote (swara + octave) with correct tuning.
 *
 * @param note - The SwaraNote to play
 * @param saHz - Sa frequency in Hz
 * @param options - Playback options
 */
export async function playSwaraNote(
  note: SwaraNote,
  saHz: number,
  options: PlaySwaraOptions = {},
): Promise<void> {
  const {
    duration = 0.5,
    attack = 0.02,
    release = 0.05,
    volume = 0.5,
    ornament,
  } = options;

  const ctx = getContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const hz = getSwaraFrequency(note.swara, saHz, note.octave);
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = hz;

  const gainNode = ctx.createGain();
  gainNode.gain.value = 0;

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + attack);
  gainNode.gain.setValueAtTime(volume, now + duration - release);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);

  if (ornament) {
    applyOrnament(osc, ornament, hz, duration, now, ctx);
  }

  osc.start(now);
  osc.stop(now + duration + 0.01);

  return new Promise((resolve) => {
    osc.onended = () => {
      osc.disconnect();
      gainNode.disconnect();
      resolve();
    };
  });
}

// ---------------------------------------------------------------------------
// Phrase playback
// ---------------------------------------------------------------------------

/**
 * Plays a sequence of SwaraNote objects in order with timing.
 *
 * @param swaras - The phrase to play (array of SwaraNote)
 * @param saHz - Sa frequency in Hz
 * @param options - Phrase playback options
 * @returns A promise that resolves when the entire phrase finishes
 */
export async function playPhrase(
  swaras: readonly SwaraNote[],
  saHz: number,
  options: PlayPhraseOptions = {},
): Promise<void> {
  const {
    tempo = 60,
    gap = 0.05,
    volume = 0.5,
  } = options;

  // Duration per note: 60/tempo seconds per beat, minus the gap
  const beatDuration = 60 / tempo;
  const noteDuration = Math.max(0.1, beatDuration - gap);

  for (const note of swaras) {
    await playSwaraNote(note, saHz, {
      duration: noteDuration,
      volume,
    });

    // Wait for the gap between notes
    if (gap > 0) {
      await sleep(gap * 1000);
    }
  }
}

/**
 * Plays the pakad (characteristic phrase) of a raga.
 *
 * Selects the first pakad from the raga definition and plays it
 * at a moderate tempo. The first pakad is typically the most
 * recognisable and pedagogically important.
 *
 * @param raga - The raga whose pakad to play
 * @param saHz - Sa frequency in Hz
 * @param pakadIndex - Which pakad to play (default: 0, the primary one)
 * @param options - Phrase playback options
 */
export async function playPakad(
  raga: Raga,
  saHz: number,
  pakadIndex: number = 0,
  options: PlayPhraseOptions = {},
): Promise<void> {
  const pakad = raga.pakad[pakadIndex];
  if (!pakad) {
    throw new Error(
      `Raga ${raga.name} does not have a pakad at index ${pakadIndex}`,
    );
  }

  // Pakads are played slightly slower than regular phrases for clarity
  const pakadOptions: PlayPhraseOptions = {
    tempo: options.tempo ?? 50,
    gap: options.gap ?? 0.08,
    volume: options.volume ?? 0.5,
  };

  await playPhrase(pakad, saHz, pakadOptions);
}

/**
 * Plays the complete aroha (ascending scale) of a raga.
 *
 * @param raga - The raga
 * @param saHz - Sa frequency in Hz
 * @param options - Playback options
 */
export async function playAroha(
  raga: Raga,
  saHz: number,
  options: PlayPhraseOptions = {},
): Promise<void> {
  await playPhrase(raga.aroha, saHz, {
    tempo: options.tempo ?? 60,
    gap: options.gap ?? 0.05,
    volume: options.volume ?? 0.5,
  });
}

/**
 * Plays the complete avaroha (descending scale) of a raga.
 *
 * @param raga - The raga
 * @param saHz - Sa frequency in Hz
 * @param options - Playback options
 */
export async function playAvaroha(
  raga: Raga,
  saHz: number,
  options: PlayPhraseOptions = {},
): Promise<void> {
  await playPhrase(raga.avaroha, saHz, {
    tempo: options.tempo ?? 60,
    gap: options.gap ?? 0.05,
    volume: options.volume ?? 0.5,
  });
}

// ---------------------------------------------------------------------------
// Ornament application
// ---------------------------------------------------------------------------

/**
 * Applies an ornament's frequency modulation to an oscillator.
 *
 * For meend: schedules a logarithmic frequency ramp.
 * For gamak/andolan: schedules sinusoidal frequency oscillation.
 * For kan/sparsh: schedules a brief impulse to an adjacent frequency.
 * For murki/khatka/zamzama: not applied at the oscillator level
 *   (these are sequence ornaments handled by playing multiple notes).
 */
function applyOrnament(
  osc: OscillatorNode,
  ornament: OrnamentDefinition,
  centreHz: number,
  durationSec: number,
  startTime: number,
  ctx: AudioContext,
): void {
  const durationMs = durationSec * 1000;

  switch (ornament.trajectoryShape) {
    case 'sinusoidal': {
      // Gamak or Andolan: oscillate around the centre frequency
      const rate = ornament.oscillationRateHz
        ? (ornament.oscillationRateHz[0] + ornament.oscillationRateHz[1]) / 2
        : 3;
      const amplitudeCents = ornament.oscillationAmplitudeCents
        ? (ornament.oscillationAmplitudeCents[0] + ornament.oscillationAmplitudeCents[1]) / 2
        : 25;

      const trajectory = generateOscillationTrajectory(
        centreHz,
        amplitudeCents,
        rate,
        durationMs,
        Math.floor(durationMs / 10), // one point every 10ms
      );

      for (const [timeMs, hz] of trajectory) {
        osc.frequency.setValueAtTime(hz, startTime + timeMs / 1000);
      }
      break;
    }

    case 'logarithmic': {
      // Meend: glide. We need start and end frequencies.
      // Default: glide from a semitone above down to the centre.
      const meendStartHz = centreHz * Math.pow(2, 100 / 1200); // 100 cents above
      osc.frequency.setValueAtTime(meendStartHz, startTime);
      osc.frequency.exponentialRampToValueAtTime(
        centreHz,
        startTime + durationSec * 0.7,
      );
      break;
    }

    case 'impulse': {
      // Kan / Sparsh: brief touch of adjacent frequency, then land
      const impulseDuration = 0.03; // 30ms
      const adjacentHz = centreHz * Math.pow(2, 100 / 1200); // semitone above
      osc.frequency.setValueAtTime(adjacentHz, startTime);
      osc.frequency.setValueAtTime(centreHz, startTime + impulseDuration);
      break;
    }

    // Sequence ornaments (murki, khatka, zamzama) are handled by
    // playing multiple notes, not by frequency modulation of a single
    // oscillator. No-op here.
    case 'linear':
    case 'sequence':
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
