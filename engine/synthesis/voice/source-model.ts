/**
 * @module engine/synthesis/voice/source-model
 *
 * TantriVoice(TM) — Glottal source model.
 *
 * The vocal folds produce a quasi-periodic waveform: a harmonic-rich
 * buzz with energy falling at approximately -12 dB/octave. This module
 * generates the glottal source using the Liljencrants-Fant (LF) model
 * approximated via Web Audio API PeriodicWave.
 *
 * The source has three key parameters:
 *   - Fundamental frequency (pitch) — controlled by the vocal folds
 *   - Spectral tilt — how fast harmonics roll off (breathier = steeper)
 *   - Open quotient — fraction of glottal cycle where folds are open
 *
 * v1: PeriodicWave approach (clean, ideal singer)
 * v2: AudioWorklet with per-sample jitter/shimmer (natural variation)
 */

import type { RegisterParams } from './formants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GlottalSourceConfig {
  /** Fundamental frequency in Hz */
  readonly f0: number;
  /** Spectral tilt exponent (1.0=bright, 1.5=modal, 2.0=dark, 3.0=breathy) */
  readonly spectralTilt: number;
  /** Number of harmonics to generate (32=fast, 64=high quality) */
  readonly harmonicCount: number;
  /** Open quotient (0.4-0.7). Affects the LF pulse shape. */
  readonly openQuotient: number;
}

export interface GlottalSource {
  /** The oscillator producing the glottal pulse */
  readonly oscillator: OscillatorNode;
  /** Aspiration noise source for breathiness */
  readonly noiseGain: GainNode;
  /** Output node — connect this to the vocal tract */
  readonly output: GainNode;
  /** Set pitch instantly */
  setFrequency(hz: number, time?: number): void;
  /** Ramp pitch over time (for meend/ornaments) */
  setFrequencyRamp(hz: number, endTime: number): void;
  /** Exponential ramp — perceptually linear pitch change */
  setFrequencyExponentialRamp(hz: number, endTime: number): void;
  /** Schedule a series of frequency changes (for gamak/andolan) */
  scheduleFrequencies(points: ReadonlyArray<{ time: number; hz: number }>): void;
  /** Set volume */
  setVolume(volume: number, time?: number): void;
  /** Start the source */
  start(time?: number): void;
  /** Stop and clean up */
  stop(time?: number): void;
  /** Release all resources */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Aspiration noise buffer
// ---------------------------------------------------------------------------

let _noiseBuffer: AudioBuffer | null = null;

/**
 * Creates a 1-second white noise buffer (lazily cached).
 */
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (_noiseBuffer && _noiseBuffer.sampleRate === ctx.sampleRate) return _noiseBuffer;
  const length = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  _noiseBuffer = buffer;
  return buffer;
}

// ---------------------------------------------------------------------------
// PeriodicWave generation — LF model approximation
// ---------------------------------------------------------------------------

/**
 * Generates Fourier coefficients for a Liljencrants-Fant glottal pulse.
 *
 * The LF model produces the characteristic voice source spectrum:
 * strong low harmonics, gradual rolloff. The spectral tilt parameter
 * controls brightness: 1.0=bright/pressed, 1.5=modal, 2.0+=dark/breathy.
 *
 * The open quotient modulates the spectral envelope via a sinusoidal
 * window on the harmonic amplitudes: higher Oq spreads energy more
 * evenly across harmonics (breathier quality).
 */
function generateGlottalCoefficients(
  harmonicCount: number,
  spectralTilt: number,
  openQuotient: number,
): [Float32Array, Float32Array] {
  const real = new Float32Array(harmonicCount + 1);
  const imag = new Float32Array(harmonicCount + 1);

  // DC component = 0
  real[0] = 0;
  imag[0] = 0;

  for (let n = 1; n <= harmonicCount; n++) {
    // LF spectral envelope: amplitude falls as 1/n^tilt
    // Modified by open quotient: sin(pi * n * Oq) window
    const tiltAmp = 1.0 / Math.pow(n, spectralTilt);
    const oqWindow = Math.abs(Math.sin(Math.PI * n * openQuotient));
    const amplitude = tiltAmp * (0.3 + 0.7 * oqWindow);

    // Phase: negative imaginary = causal (asymmetric) pulse shape
    real[n] = 0;
    imag[n] = -amplitude;
  }

  return [real, imag];
}

// ---------------------------------------------------------------------------
// Cache for PeriodicWave objects
// ---------------------------------------------------------------------------

const _waveCache = new Map<string, PeriodicWave>();

function getCachedWave(
  ctx: AudioContext,
  harmonicCount: number,
  spectralTilt: number,
  openQuotient: number,
): PeriodicWave {
  // Round to 1 decimal for cache key
  const key = `${harmonicCount}-${spectralTilt.toFixed(1)}-${openQuotient.toFixed(2)}`;
  let wave = _waveCache.get(key);
  if (!wave) {
    const [real, imag] = generateGlottalCoefficients(harmonicCount, spectralTilt, openQuotient);
    wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    _waveCache.set(key, wave);
  }
  return wave;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a glottal source using Web Audio API.
 *
 * Architecture:
 *   OscillatorNode (PeriodicWave: LF model harmonics)
 *     -> merger GainNode
 *       -> output GainNode (master volume)
 *
 *   AudioBufferSourceNode (white noise, looped)
 *     -> BiquadFilter (bandpass, 2000 Hz) — shape aspiration
 *       -> GainNode (noise mix level: 0.03 modal, 0.15 breathy)
 *         -> merger GainNode
 *
 * @param ctx - AudioContext
 * @param config - Glottal source configuration
 * @param destination - AudioNode to connect output to
 */
export function createGlottalSource(
  ctx: AudioContext,
  config: GlottalSourceConfig,
  destination: AudioNode,
): GlottalSource {
  const { f0, spectralTilt, harmonicCount, openQuotient } = config;

  // Glottal pulse oscillator
  const wave = getCachedWave(ctx, harmonicCount, spectralTilt, openQuotient);
  const oscillator = ctx.createOscillator();
  oscillator.setPeriodicWave(wave);
  oscillator.frequency.value = f0;

  // Merger gain — combines oscillator + aspiration noise
  const merger = ctx.createGain();
  merger.gain.value = 1.0;

  // Aspiration noise path
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = getNoiseBuffer(ctx);
  noiseSource.loop = true;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 2000;
  noiseFilter.Q.value = 1.5;

  const noiseGain = ctx.createGain();
  // Aspiration level based on open quotient
  noiseGain.gain.value = openQuotient > 0.6 ? 0.08 : 0.03;

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(merger);

  // Main oscillator path
  oscillator.connect(merger);

  // Output gain (master volume)
  const output = ctx.createGain();
  output.gain.value = 0.5;
  merger.connect(output);
  output.connect(destination);

  let started = false;
  let disposed = false;

  const source: GlottalSource = {
    oscillator,
    noiseGain,
    output,

    setFrequency(hz: number, time?: number) {
      if (disposed) return;
      const t = time ?? ctx.currentTime;
      oscillator.frequency.setValueAtTime(hz, t);
    },

    setFrequencyRamp(hz: number, endTime: number) {
      if (disposed) return;
      oscillator.frequency.linearRampToValueAtTime(hz, endTime);
    },

    setFrequencyExponentialRamp(hz: number, endTime: number) {
      if (disposed) return;
      // Clamp to positive values for exponential ramp
      const safeHz = Math.max(hz, 20);
      oscillator.frequency.exponentialRampToValueAtTime(safeHz, endTime);
    },

    scheduleFrequencies(points: ReadonlyArray<{ time: number; hz: number }>) {
      if (disposed) return;
      for (const { time, hz } of points) {
        oscillator.frequency.setValueAtTime(hz, time);
      }
    },

    setVolume(volume: number, time?: number) {
      if (disposed) return;
      const t = time ?? ctx.currentTime;
      output.gain.setValueAtTime(volume, t);
    },

    start(time?: number) {
      if (started || disposed) return;
      const t = time ?? ctx.currentTime;
      oscillator.start(t);
      noiseSource.start(t);
      started = true;
    },

    stop(time?: number) {
      if (!started || disposed) return;
      const t = time ?? ctx.currentTime;
      try {
        oscillator.stop(t);
        noiseSource.stop(t);
      } catch {
        // Already stopped
      }
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        oscillator.disconnect();
        noiseSource.disconnect();
        noiseFilter.disconnect();
        noiseGain.disconnect();
        merger.disconnect();
        output.disconnect();
      } catch {
        // Already disconnected
      }
    },
  };

  return source;
}

/**
 * Create a glottal source configured from register parameters.
 */
export function createGlottalSourceFromRegister(
  ctx: AudioContext,
  f0: number,
  registerParams: RegisterParams,
  destination: AudioNode,
): GlottalSource {
  return createGlottalSource(ctx, {
    f0,
    spectralTilt: registerParams.spectralTilt,
    harmonicCount: 48,
    openQuotient: registerParams.openQuotient,
  }, destination);
}
