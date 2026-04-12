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
 * SYNTHESIS MODEL: 12-partial additive harmonium synthesis.
 * Each note is rendered as 12 sine oscillators at integer harmonics,
 * with amplitude weights from an acoustic harmonium spectral model.
 * Two biquad peaking filters in series simulate the wooden enclosure
 * resonance. A slow LFO models the bellows pump instability (~10 cents).
 * The ADSR envelope models bellows-to-reed delay and air pressure release.
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
// Harmonium spectral model
// ---------------------------------------------------------------------------

/**
 * Amplitude weights for 12 harmonics of an Indian harmonium reed.
 * Derived from spectral analysis of reed organ instruments.
 * Index 0 = fundamental, index 11 = 12th partial.
 */
const HARMONIUM_PARTIALS: readonly number[] = [
  1.00, 0.90, 0.80, 0.65, 0.55, 0.40, 0.30, 0.20, 0.14, 0.09, 0.06, 0.04,
] as const;

/**
 * Enclosure resonance filter parameters.
 * Two biquad peaking filters in series model the wooden box resonance.
 */
const ENCLOSURE_LOW_FREQ = 400;
const ENCLOSURE_LOW_Q = 1.5;
const ENCLOSURE_LOW_GAIN = 4; // dB

const ENCLOSURE_HIGH_FREQ = 1500;
const ENCLOSURE_HIGH_Q = 2.0;
const ENCLOSURE_HIGH_GAIN = 3; // dB

/**
 * Harmonium ADSR envelope parameters.
 * Models the bellows-to-reed delay and air pressure release.
 */
const HARMONIUM_ATTACK = 0.08;   // bellows-to-reed delay
const HARMONIUM_DECAY = 0.15;    // initial brightness fade
const HARMONIUM_SUSTAIN = 0.85;  // sustain level (fraction of peak)
const HARMONIUM_RELEASE = 0.20;  // air pressure release

/**
 * Bellows LFO parameters for subtle pitch instability.
 * 4.5 Hz is a typical hand-pump rate.
 * 1.5 Hz deviation is ~10 cents at 261 Hz.
 */
const BELLOWS_LFO_RATE = 4.5;    // Hz
const BELLOWS_LFO_DEPTH = 1.5;   // Hz deviation

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for playing a single swara.
 */
export interface PlaySwaraOptions {
  /** Duration in seconds. Default: 0.5. */
  readonly duration?: number;
  /** Attack time in seconds (fade in). Default: 0.08 (harmonium bellows). */
  readonly attack?: number;
  /** Release time in seconds (fade out). Default: 0.20 (air pressure release). */
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
// Internal: active note handle for cleanup
// ---------------------------------------------------------------------------

/**
 * Internal handle for an active harmonium note.
 * Tracks all Web Audio nodes so they can be stopped and disconnected.
 */
interface HarmoniumNote {
  readonly oscillators: OscillatorNode[];
  readonly lfo: OscillatorNode;
  readonly lfoGains: GainNode[];
  readonly partialGains: GainNode[];
  readonly masterGain: GainNode;
  readonly filterLow: BiquadFilterNode;
  readonly filterHigh: BiquadFilterNode;
  dispose(): void;
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
// Harmonium synthesis core
// ---------------------------------------------------------------------------

/**
 * Creates a harmonium note with 12-partial additive synthesis,
 * enclosure resonance filters, bellows LFO, and ADSR envelope.
 *
 * Architecture:
 *   12 OscillatorNode (partials) -> individual GainNode (amplitude weight)
 *     -> BiquadFilter (low formant) -> BiquadFilter (high formant)
 *       -> master GainNode (ADSR envelope) -> destination
 *
 *   1 OscillatorNode (LFO) -> 12 GainNode (depth scaler) -> each partial's frequency
 *
 * @param ctx - AudioContext
 * @param hz - Fundamental frequency in Hz
 * @param startTime - AudioContext time to start the note
 * @param duration - Note duration in seconds
 * @param volume - Volume (0 to 1)
 * @param attack - Attack time in seconds
 * @param release - Release time in seconds
 * @returns HarmoniumNote handle with dispose() for cleanup
 */
function createHarmoniumNote(
  ctx: AudioContext,
  hz: number,
  startTime: number,
  duration: number,
  volume: number,
  attack: number,
  release: number,
): HarmoniumNote {
  // Enclosure resonance: two biquad peaking filters in series
  const filterLow = ctx.createBiquadFilter();
  filterLow.type = 'peaking';
  filterLow.frequency.value = ENCLOSURE_LOW_FREQ;
  filterLow.Q.value = ENCLOSURE_LOW_Q;
  filterLow.gain.value = ENCLOSURE_LOW_GAIN;

  const filterHigh = ctx.createBiquadFilter();
  filterHigh.type = 'peaking';
  filterHigh.frequency.value = ENCLOSURE_HIGH_FREQ;
  filterHigh.Q.value = ENCLOSURE_HIGH_Q;
  filterHigh.gain.value = ENCLOSURE_HIGH_GAIN;

  filterLow.connect(filterHigh);

  // Master gain for ADSR envelope
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  filterHigh.connect(masterGain);
  masterGain.connect(ctx.destination);

  // ADSR envelope
  const peakVolume = volume;
  const sustainVolume = volume * HARMONIUM_SUSTAIN;

  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(peakVolume, startTime + attack);
  masterGain.gain.linearRampToValueAtTime(sustainVolume, startTime + attack + HARMONIUM_DECAY);

  // Hold sustain until release begins
  const releaseStart = startTime + duration - release;
  if (releaseStart > startTime + attack + HARMONIUM_DECAY) {
    masterGain.gain.setValueAtTime(sustainVolume, releaseStart);
  }
  masterGain.gain.linearRampToValueAtTime(0, startTime + duration);

  // Bellows LFO — shared across all partials
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = BELLOWS_LFO_RATE;

  // Create 12 partials
  const oscillators: OscillatorNode[] = [];
  const partialGains: GainNode[] = [];
  const lfoGains: GainNode[] = [];

  for (let i = 0; i < HARMONIUM_PARTIALS.length; i++) {
    const partialIndex = i + 1; // 1-based harmonic number
    const partialHz = hz * partialIndex;
    const amplitude = HARMONIUM_PARTIALS[i]!;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = partialHz;

    // LFO modulation: scale depth by partial index for natural effect
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = BELLOWS_LFO_DEPTH * partialIndex;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Per-partial amplitude
    const gain = ctx.createGain();
    gain.gain.value = amplitude * 0.15; // Scale to prevent clipping with 12 partials

    osc.connect(gain);
    gain.connect(filterLow);

    oscillators.push(osc);
    partialGains.push(gain);
    lfoGains.push(lfoGain);
  }

  // Start all oscillators and LFO at the same time
  lfo.start(startTime);
  lfo.stop(startTime + duration + 0.02);
  for (const osc of oscillators) {
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  const dispose = (): void => {
    try { lfo.stop(); } catch { /* already stopped */ }
    lfo.disconnect();
    for (const g of lfoGains) g.disconnect();
    for (const osc of oscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    }
    for (const g of partialGains) g.disconnect();
    filterLow.disconnect();
    filterHigh.disconnect();
    masterGain.disconnect();
  };

  return {
    oscillators,
    lfo,
    lfoGains,
    partialGains,
    masterGain,
    filterLow,
    filterHigh,
    dispose,
  };
}

// ---------------------------------------------------------------------------
// Single swara playback
// ---------------------------------------------------------------------------

/**
 * Plays a single swara with correct just-intonation tuning.
 *
 * The synthesis uses a 12-partial additive harmonium model with
 * enclosure resonance filters, bellows LFO, and ADSR envelope.
 * For ornamented notes, all partial frequencies are modulated
 * according to the ornament's trajectory.
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
    attack = HARMONIUM_ATTACK,
    release = HARMONIUM_RELEASE,
    volume = 0.5,
    ornament,
  } = options;

  const ctx = getContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const hz = getSwaraFrequency(swara, saHz, 'madhya');
  const now = ctx.currentTime;

  const note = createHarmoniumNote(ctx, hz, now, duration, volume, attack, release);

  // Apply ornament if specified — modulate all partials' frequencies
  if (ornament) {
    applyOrnament(note.oscillators, ornament, hz, duration, now, ctx);
  }

  return new Promise((resolve) => {
    // Use the first oscillator's onended to know when the note is done
    const firstOsc = note.oscillators[0];
    if (firstOsc) {
      firstOsc.onended = () => {
        note.dispose();
        resolve();
      };
    } else {
      note.dispose();
      resolve();
    }
  });
}

/**
 * Plays a SwaraNote (swara + octave) with correct tuning.
 *
 * @param swaraNote - The SwaraNote to play
 * @param saHz - Sa frequency in Hz
 * @param options - Playback options
 */
export async function playSwaraNote(
  swaraNote: SwaraNote,
  saHz: number,
  options: PlaySwaraOptions = {},
): Promise<void> {
  const {
    duration = 0.5,
    attack = HARMONIUM_ATTACK,
    release = HARMONIUM_RELEASE,
    volume = 0.5,
    ornament,
  } = options;

  const ctx = getContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const hz = getSwaraFrequency(swaraNote.swara, saHz, swaraNote.octave);
  const now = ctx.currentTime;

  const note = createHarmoniumNote(ctx, hz, now, duration, volume, attack, release);

  if (ornament) {
    applyOrnament(note.oscillators, ornament, hz, duration, now, ctx);
  }

  return new Promise((resolve) => {
    const firstOsc = note.oscillators[0];
    if (firstOsc) {
      firstOsc.onended = () => {
        note.dispose();
        resolve();
      };
    } else {
      note.dispose();
      resolve();
    }
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
 * Applies an ornament's frequency modulation to all oscillators in a
 * harmonium note. Each partial's frequency is modulated proportionally
 * to its harmonic number.
 *
 * For meend: schedules a logarithmic frequency ramp across all partials.
 * For gamak/andolan: schedules sinusoidal frequency oscillation.
 * For kan/sparsh: schedules a brief impulse to an adjacent frequency.
 * For murki/khatka/zamzama: not applied at the oscillator level
 *   (these are sequence ornaments handled by playing multiple notes).
 */
function applyOrnament(
  oscillators: OscillatorNode[],
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

      // Apply trajectory to each partial, scaled by harmonic number
      for (let i = 0; i < oscillators.length; i++) {
        const osc = oscillators[i]!;
        const partialIndex = i + 1;
        for (const [timeMs, hz] of trajectory) {
          // Scale the deviation from centre proportionally to the partial
          const deviation = hz - centreHz;
          const partialDeviation = deviation * partialIndex;
          osc.frequency.setValueAtTime(
            centreHz * partialIndex + partialDeviation,
            startTime + timeMs / 1000,
          );
        }
      }
      break;
    }

    case 'logarithmic': {
      // Meend: glide. Start from a semitone above and glide down.
      const meendStartHz = centreHz * Math.pow(2, 100 / 1200); // 100 cents above
      for (let i = 0; i < oscillators.length; i++) {
        const osc = oscillators[i]!;
        const partialIndex = i + 1;
        osc.frequency.setValueAtTime(meendStartHz * partialIndex, startTime);
        osc.frequency.exponentialRampToValueAtTime(
          centreHz * partialIndex,
          startTime + durationSec * 0.7,
        );
      }
      break;
    }

    case 'impulse': {
      // Kan / Sparsh: brief touch of adjacent frequency, then land
      const impulseDuration = 0.03; // 30ms
      const adjacentHz = centreHz * Math.pow(2, 100 / 1200); // semitone above
      for (let i = 0; i < oscillators.length; i++) {
        const osc = oscillators[i]!;
        const partialIndex = i + 1;
        osc.frequency.setValueAtTime(adjacentHz * partialIndex, startTime);
        osc.frequency.setValueAtTime(centreHz * partialIndex, startTime + impulseDuration);
      }
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
