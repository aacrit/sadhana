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
 *
 * Music-director spec (confirmed 2026-04-19):
 *   Attack:  40ms — reed responds to bellows pressure within ~40ms
 *   Decay:   0.15s — slight brightness reduction as reed settles
 *   Sustain: 1.0 (infinite while held) — reed sustains at full amplitude
 *            for as long as the bellows push air; no natural decay on held notes
 *   Release: 300ms — air pressure bleeds off through the reed chamber
 *
 * The 12-partial model is retained (richer than the minimum 3-partial spec):
 * more partials produce the reedy, nasal timbre that distinguishes an Indian
 * harmonium from a Western reed organ. The amplitude weights are already
 * musically accurate (confirmed against spectral analysis).
 */
const HARMONIUM_ATTACK = 0.04;   // 40ms reed-to-bellows delay (music-director spec)
const HARMONIUM_DECAY = 0.15;    // initial brightness fade as reed settles
const HARMONIUM_SUSTAIN = 1.0;   // sustained reed — full amplitude while held
const HARMONIUM_RELEASE = 0.30;  // 300ms air pressure release (music-director spec)

/**
 * Bellows LFO parameters for subtle pitch instability.
 * 4.5 Hz is a typical hand-pump rate. Tremolo rate matches a slow bellows
 * cycle. 1.5 Hz deviation is ~10 cents at 261 Hz — audible but musical.
 */
const BELLOWS_LFO_RATE = 4.5;    // Hz (slow hand-pump cycle)
const BELLOWS_LFO_DEPTH = 1.5;   // Hz deviation (~10 cents at Sa/C4)

// ---------------------------------------------------------------------------
// Piano spectral model
// ---------------------------------------------------------------------------

/**
 * Amplitude weights for 12 harmonics of a felt-hammer piano string.
 *
 * Modeled for the Sa range (C3-C5, 130-520 Hz) where piano timbre is warm
 * and full. A felt hammer striking at ~1/7 of the string length creates a
 * notch at the 7th harmonic and its multiples. The spectrum shows:
 *   - Strong fundamental and 2nd partial (hammer excites low modes well)
 *   - Gradual rolloff from the 3rd partial onward (felt damping)
 *   - Noticeable dip at partial 7 (hammer position null)
 *   - Very weak partials above 9 (felt absorption of high frequencies)
 *
 * Note: Real piano strings exhibit inharmonicity (upper partials are
 * slightly sharp due to string stiffness), which we cannot model with
 * the current integer-harmonic synthesis. The partial weights are
 * tuned to sound musical despite perfectly harmonic partials.
 */
const PIANO_PARTIALS: readonly number[] = [
  1.00, 0.75, 0.55, 0.40, 0.30, 0.20, 0.05, 0.12, 0.08, 0.04, 0.02, 0.01,
] as const;

/**
 * Piano ADSR envelope for the Sa range (C3-C5).
 *   Attack:  ~3ms hammer impact — near-instantaneous but not a click
 *   Decay:   ~1.2s initial brightness fade as upper partials die
 *   Sustain: 0.55 — piano strings sustain well in the middle register
 *   Release: ~0.5s damper fall with brief resonance tail
 */
const PIANO_ATTACK = 0.003;   // hammer impact — near-instant percussive onset
const PIANO_DECAY = 1.2;      // long brightness fade (upper partials die first)
const PIANO_SUSTAIN = 0.55;   // middle-register strings sustain strongly
const PIANO_RELEASE = 0.5;    // damper fall with brief resonance tail

// ---------------------------------------------------------------------------
// Guitar spectral model
// ---------------------------------------------------------------------------

/**
 * Amplitude weights for 12 harmonics of a nylon-string classical guitar.
 *
 * Nylon strings produce a warm, round tone with these characteristics:
 *   - Very strong fundamental (nylon's mass emphasizes the lowest mode)
 *   - Prominent 2nd partial (the octave, gives body and fullness)
 *   - Moderate 3rd partial (the fifth, adds depth without harshness)
 *   - Secondary brightness from 4th-5th partials (nail contact shimmer)
 *   - Pluck position null at ~6th partial (typical right-hand position
 *     over the sound hole is ~1/6 of the string length)
 *   - Rapid rolloff above 7th partial (nylon absorbs high frequencies
 *     much faster than steel; this is the hallmark warm tone)
 *
 * Compared to steel-string guitar, nylon has ~6 dB less energy above
 * the 5th partial, producing the characteristic mellow classical sound.
 */
const GUITAR_PARTIALS: readonly number[] = [
  1.00, 0.72, 0.45, 0.30, 0.22, 0.06, 0.12, 0.07, 0.03, 0.015, 0.008, 0.004,
] as const;

/**
 * Guitar ADSR envelope for nylon-string pluck in the Sa range (C3-C5).
 *   Attack:  ~8ms — nylon has a softer transient than steel or hammer;
 *            the fingertip/nail releases the string with a brief ramp
 *   Decay:   ~2s long initial decay as the string loses energy to air
 *            and soundboard; nylon sustains 2-4s in the middle register
 *   Sustain: 0.15 — plucked strings have no sustain mechanism; the note
 *            decays to a quiet tail (no bowing, no bellows, no hammers)
 *   Release: ~1.0s — when the player lifts off, the remaining vibration
 *            dies naturally through the bridge and soundboard
 */
const GUITAR_ATTACK = 0.008;  // nylon pluck — softer onset than steel
const GUITAR_DECAY = 2.0;     // long natural decay (nylon sustains well)
const GUITAR_SUSTAIN = 0.15;  // plucked string — no sustain mechanism
const GUITAR_RELEASE = 1.0;   // natural tail through bridge and body

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InstrumentTimbre = 'harmonium' | 'piano' | 'guitar';

/**
 * Options for playing a single swara.
 */
export interface PlaySwaraOptions {
  /** Duration in seconds. Default: 0.5. */
  readonly duration?: number;
  /** Attack time in seconds (fade in). Uses instrument default if omitted. */
  readonly attack?: number;
  /** Release time in seconds (fade out). Uses instrument default if omitted. */
  readonly release?: number;
  /** Volume (0 to 1). Default: 0.5. */
  readonly volume?: number;
  /** Ornament to apply. */
  readonly ornament?: OrnamentDefinition;
  /** Instrument timbre. Default: 'harmonium'. */
  readonly timbre?: InstrumentTimbre;
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
// Instrument config — timbre-specific spectral and envelope parameters
// ---------------------------------------------------------------------------

interface InstrumentConfig {
  partials: readonly number[];
  attack: number;
  decay: number;
  sustain: number; // fraction of peak
  release: number;
  filterLowFreq: number;
  filterLowQ: number;
  filterLowGain: number;
  filterHighFreq: number;
  filterHighQ: number;
  filterHighGain: number;
  lfoRate: number;  // 0 = no LFO
  lfoDepth: number; // Hz deviation
}

const INSTRUMENT_CONFIGS: Record<InstrumentTimbre, InstrumentConfig> = {
  harmonium: {
    partials: HARMONIUM_PARTIALS,
    attack: HARMONIUM_ATTACK,
    decay: HARMONIUM_DECAY,
    sustain: HARMONIUM_SUSTAIN,
    release: HARMONIUM_RELEASE,
    filterLowFreq: ENCLOSURE_LOW_FREQ,
    filterLowQ: ENCLOSURE_LOW_Q,
    filterLowGain: ENCLOSURE_LOW_GAIN,
    filterHighFreq: ENCLOSURE_HIGH_FREQ,
    filterHighQ: ENCLOSURE_HIGH_Q,
    filterHighGain: ENCLOSURE_HIGH_GAIN,
    lfoRate: BELLOWS_LFO_RATE,
    lfoDepth: BELLOWS_LFO_DEPTH,
  },
  piano: {
    partials: PIANO_PARTIALS,
    attack: PIANO_ATTACK,
    decay: PIANO_DECAY,
    sustain: PIANO_SUSTAIN,
    release: PIANO_RELEASE,
    // Piano soundboard resonance model:
    //   Low filter:  ~220 Hz, Q 1.0, +3 dB — soundboard bass bar resonance.
    //     Warms the lower partials without muddiness. Lower Q than harmonium
    //     because the piano soundboard is larger and has a broader resonance.
    //   High filter: ~2800 Hz, Q 1.2, +2 dB — presence/clarity peak.
    //     Piano has a bright presence band from the bridge and soundboard
    //     that gives notes definition without harshness. The slight boost
    //     compensates for the felt hammer's absorption of high frequencies.
    filterLowFreq: 220,
    filterLowQ: 1.0,
    filterLowGain: 3,
    filterHighFreq: 2800,
    filterHighQ: 1.2,
    filterHighGain: 2,
    lfoRate: 0,
    lfoDepth: 0,
  },
  guitar: {
    partials: GUITAR_PARTIALS,
    attack: GUITAR_ATTACK,
    decay: GUITAR_DECAY,
    sustain: GUITAR_SUSTAIN,
    release: GUITAR_RELEASE,
    // Classical guitar body resonance model:
    //   Low filter:  ~110 Hz, Q 1.8, +5 dB — Helmholtz air resonance.
    //     The guitar body's sound hole acts as a Helmholtz resonator at
    //     ~95-110 Hz. This gives classical guitar its deep, warm bass
    //     character. Higher Q and gain than piano because the guitar body
    //     has a much more pronounced and narrower air resonance.
    //   High filter: ~350 Hz, Q 1.4, +3 dB — top plate resonance.
    //     The spruce top vibrates most strongly at ~350-400 Hz, adding
    //     body and fullness to the mid-range. This is the "wood" tone.
    //     We place this lower than the piano presence peak because
    //     classical guitar has very little energy above 3 kHz.
    filterLowFreq: 110,
    filterLowQ: 1.8,
    filterLowGain: 5,
    filterHighFreq: 350,
    filterHighQ: 1.4,
    filterHighGain: 3,
    lfoRate: 0,
    lfoDepth: 0,
  },
};

// ---------------------------------------------------------------------------
// Additive synthesis core (timbre-agnostic)
// ---------------------------------------------------------------------------

/**
 * Creates an instrument note using additive synthesis with configurable
 * spectral profile, resonance filters, and optional LFO.
 */
function createInstrumentNote(
  ctx: AudioContext,
  hz: number,
  startTime: number,
  duration: number,
  volume: number,
  attackOverride: number | undefined,
  releaseOverride: number | undefined,
  config: InstrumentConfig,
): HarmoniumNote {
  const attack = attackOverride ?? config.attack;
  const release = releaseOverride ?? config.release;

  // Resonance: two biquad peaking filters in series
  const filterLow = ctx.createBiquadFilter();
  filterLow.type = 'peaking';
  filterLow.frequency.value = config.filterLowFreq;
  filterLow.Q.value = config.filterLowQ;
  filterLow.gain.value = config.filterLowGain;

  const filterHigh = ctx.createBiquadFilter();
  filterHigh.type = 'peaking';
  filterHigh.frequency.value = config.filterHighFreq;
  filterHigh.Q.value = config.filterHighQ;
  filterHigh.gain.value = config.filterHighGain;

  filterLow.connect(filterHigh);

  // Master gain for ADSR envelope
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  filterHigh.connect(masterGain);
  masterGain.connect(ctx.destination);

  // ADSR envelope — handles short notes gracefully.
  //
  // When note duration < attack + decay + release (common with piano/guitar
  // whose decay constants are longer than typical swara durations), the decay
  // phase is truncated: we compute the volume level the decay would have
  // reached by releaseStart and ramp from there to zero.
  const peakVolume = volume;
  const sustainVolume = volume * config.sustain;

  const releaseStart = Math.max(startTime + attack, startTime + duration - release);
  const decayEnd = startTime + attack + config.decay;

  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(peakVolume, startTime + attack);

  if (decayEnd <= releaseStart) {
    // Normal case: full decay completes before release begins.
    // Decay ramp -> sustain hold -> release ramp.
    masterGain.gain.linearRampToValueAtTime(sustainVolume, decayEnd);
    masterGain.gain.setValueAtTime(sustainVolume, releaseStart);
  } else {
    // Short note: decay is still in progress when release must begin.
    // Compute the linear interpolation of where the decay would be at
    // releaseStart, then start the release from that level.
    const decayElapsed = releaseStart - (startTime + attack);
    const decayFraction = config.decay > 0 ? decayElapsed / config.decay : 1;
    const levelAtRelease = peakVolume + (sustainVolume - peakVolume) * decayFraction;
    masterGain.gain.linearRampToValueAtTime(levelAtRelease, releaseStart);
  }
  masterGain.gain.linearRampToValueAtTime(0, startTime + duration);

  // LFO — only if the instrument uses one
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = config.lfoRate || 1; // min 1Hz to avoid issues

  // Create partials
  const oscillators: OscillatorNode[] = [];
  const partialGains: GainNode[] = [];
  const lfoGains: GainNode[] = [];

  for (let i = 0; i < config.partials.length; i++) {
    const partialIndex = i + 1; // 1-based harmonic number
    const partialHz = hz * partialIndex;
    const amplitude = config.partials[i]!;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = partialHz;

    // LFO modulation (only if depth > 0)
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = config.lfoDepth > 0 ? config.lfoDepth * partialIndex : 0;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Per-partial amplitude
    const gain = ctx.createGain();
    gain.gain.value = amplitude * 0.15; // Scale to prevent clipping

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
// Active note tracking (for long-press stop)
// ---------------------------------------------------------------------------

let _activeHarmoniumNote: HarmoniumNote | null = null;

/**
 * Stop any currently playing harmonium note immediately.
 * Used for long-press release.
 */
export function stopHarmoniumPlayback(): void {
  if (_activeHarmoniumNote) {
    _activeHarmoniumNote.dispose();
    _activeHarmoniumNote = null;
  }
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
    attack,
    release,
    volume = 0.5,
    ornament,
    timbre = 'harmonium',
  } = options;

  const ctx = getContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const hz = getSwaraFrequency(swara, saHz, 'madhya');
  const now = ctx.currentTime;
  const config = INSTRUMENT_CONFIGS[timbre];

  const note = createInstrumentNote(ctx, hz, now, duration, volume, attack, release, config);

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
    attack,
    release,
    volume = 0.5,
    ornament,
    timbre = 'harmonium',
  } = options;

  const ctx = getContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const hz = getSwaraFrequency(swaraNote.swara, saHz, swaraNote.octave);
  const now = ctx.currentTime;

  // Stop any previously active note
  if (_activeHarmoniumNote) {
    _activeHarmoniumNote.dispose();
    _activeHarmoniumNote = null;
  }

  const config = INSTRUMENT_CONFIGS[timbre];
  const note = createInstrumentNote(ctx, hz, now, duration, volume, attack, release, config);
  _activeHarmoniumNote = note;

  if (ornament) {
    applyOrnament(note.oscillators, ornament, hz, duration, now, ctx);
  }

  return new Promise((resolve) => {
    const firstOsc = note.oscillators[0];
    if (firstOsc) {
      firstOsc.onended = () => {
        note.dispose();
        if (_activeHarmoniumNote === note) _activeHarmoniumNote = null;
        resolve();
      };
    } else {
      note.dispose();
      if (_activeHarmoniumNote === note) _activeHarmoniumNote = null;
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
