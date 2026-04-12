/**
 * @module engine/synthesis/tanpura
 *
 * Tanpura drone synthesis from first principles using Tone.js.
 *
 * The tanpura is not a sample. It is a mathematical model of four vibrating
 * strings, each producing a fundamental and a series of overtones shaped by
 * the jivari (curved bridge) of the instrument.
 *
 * The tanpura provides the harmonic reference field against which all singing
 * is heard. Without it, a student cannot judge intonation. It is always the
 * first sound in any Sadhana session.
 *
 * Standard tuning: Pa(low), Sa, Sa, Sa(lower octave)
 * Alternative (for Ma-dominant ragas): Ma(low), Sa, Sa, Sa(lower octave)
 *
 * Each string is synthesised as a sum of partials (harmonics), with
 * amplitudes derived from the jivari model in harmonics.ts. The tanpura's
 * characteristic "shimmering" quality comes from:
 *   1. Rich overtone content (jivari excites partials 2-6 strongly)
 *   2. Slight detuning between the two Sa strings (a few cents)
 *   3. Natural beating between overlapping partials of different strings
 *
 * BROWSER REQUIREMENT: Tone.js requires a user gesture to start AudioContext.
 * The TanpuraDrone.start() method must be called from a click/touch handler.
 *
 * 'use client' — this module uses Tone.js which requires browser APIs
 */

import { tanpuraPartials } from '../physics/harmonics';
import type { TanpuraStringProfile } from '../physics/harmonics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for the tanpura drone.
 */
export interface TanpuraConfig {
  /** Sa frequency in Hz. Default: 261.63 (C4). */
  readonly sa_hz: number;
  /** Master volume (0 to 1). Default: 0.3. */
  readonly volume: number;
  /** Number of strings. Always 4. */
  readonly strings: 4;
  /** Use Ma instead of Pa for the first string (for Ma-dominant ragas). */
  readonly useMa?: boolean;
  /** Slight detuning in cents between the two Sa strings (default: 2). */
  readonly saDetuningCents?: number;
}

/**
 * Default tanpura configuration.
 */
export const DEFAULT_TANPURA_CONFIG: TanpuraConfig = {
  sa_hz: 261.63,
  volume: 0.3,
  strings: 4,
  useMa: false,
  saDetuningCents: 2,
};

// ---------------------------------------------------------------------------
// Tanpura Drone
// ---------------------------------------------------------------------------

/**
 * The TanpuraDrone class synthesises a continuous drone using Tone.js.
 *
 * Each of the four strings is rendered as a set of additive sine oscillators
 * (one per partial), with amplitudes from the jivari model. The result is
 * a rich, shimmering harmonic field — not a looped sample, but a living
 * mathematical model.
 *
 * Usage:
 *   const tanpura = new TanpuraDrone({ sa_hz: 261.63, volume: 0.3, strings: 4 });
 *   // Must be called from a user gesture handler:
 *   await tanpura.start();
 *   // Later:
 *   tanpura.stop();
 *
 * The drone is designed to be computationally lightweight: 4 strings x 10
 * partials = 40 oscillators, which is well within the capacity of any
 * modern browser's AudioContext.
 */
export class TanpuraDrone {
  private config: TanpuraConfig;
  private profiles: ReadonlyArray<TanpuraStringProfile>;
  private running: boolean = false;

  // Tone.js objects — typed as any because Tone.js may not be available
  // at module load time (server-side rendering). We lazy-load Tone.js
  // only when start() is called.
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private masterGain: GainNode | null = null;
  private audioContext: AudioContext | null = null;

  constructor(config: Partial<TanpuraConfig> = {}) {
    this.config = { ...DEFAULT_TANPURA_CONFIG, ...config, strings: 4 };
    this.profiles = tanpuraPartials(
      this.config.sa_hz,
      this.config.useMa ?? false,
    );
  }

  /**
   * Starts the tanpura drone.
   *
   * Creates a Web Audio AudioContext (requires user gesture on iOS Safari),
   * builds the oscillator graph, and starts all oscillators.
   *
   * @throws {Error} if AudioContext is not available (server-side)
   */
  async start(): Promise<void> {
    if (this.running) return;

    if (typeof AudioContext === 'undefined') {
      throw new Error(
        'AudioContext is not available. TanpuraDrone requires a browser environment.',
      );
    }

    this.audioContext = new AudioContext();
    await this.audioContext.resume();

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.config.volume;
    this.masterGain.connect(this.audioContext.destination);

    this.buildOscillators();
    this.running = true;
  }

  /**
   * Stops the tanpura drone with a smooth fade-out.
   * Fade duration: 500ms.
   */
  stop(): void {
    if (!this.running || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;

    // Smooth fade-out over 500ms
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);

    // Stop and clean up oscillators after fade
    setTimeout(() => {
      this.cleanup();
    }, 600);

    this.running = false;
  }

  /**
   * Returns whether the drone is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Retunes the tanpura to a new Sa frequency.
   * Rebuilds the oscillators with new frequencies.
   *
   * @param hz - New Sa frequency in Hz
   */
  setSa(hz: number): void {
    if (hz <= 0) throw new RangeError('Sa frequency must be positive');

    this.config = { ...this.config, sa_hz: hz };
    this.profiles = tanpuraPartials(hz, this.config.useMa ?? false);

    if (this.running && this.audioContext) {
      this.rebuildOscillators();
    }
  }

  /**
   * Sets the master volume.
   *
   * @param volume - Volume level (0 to 1)
   */
  setVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      throw new RangeError('Volume must be between 0 and 1');
    }

    this.config = { ...this.config, volume };

    if (this.masterGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(volume, now + 0.05);
    }
  }

  /**
   * Returns all partial frequencies for all strings.
   * Used by Three.js visualization to render waveform data.
   *
   * @returns Array of frequency values across all strings
   */
  getPartialFrequencies(): number[] {
    const frequencies: number[] = [];
    for (const profile of this.profiles) {
      for (const partial of profile.partials) {
        frequencies.push(partial.frequency);
      }
    }
    return frequencies;
  }

  /**
   * Returns the current string profiles (for visualization).
   */
  getProfiles(): ReadonlyArray<TanpuraStringProfile> {
    return this.profiles;
  }

  /**
   * Returns the current configuration.
   */
  getConfig(): TanpuraConfig {
    return this.config;
  }

  // -------------------------------------------------------------------------
  // Private: oscillator graph construction
  // -------------------------------------------------------------------------

  private buildOscillators(): void {
    if (!this.audioContext || !this.masterGain) return;

    const detuningCents = this.config.saDetuningCents ?? 2;

    for (let stringIdx = 0; stringIdx < this.profiles.length; stringIdx++) {
      const profile = this.profiles[stringIdx]!;

      for (const partial of profile.partials) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = partial.frequency;

        // Apply slight detuning to the third string (second Sa)
        // to create the characteristic beating/shimmering effect
        if (stringIdx === 2) {
          const detuneRatio = Math.pow(2, detuningCents / 1200);
          osc.frequency.value = partial.frequency * detuneRatio;
        }

        const gain = this.audioContext.createGain();
        // Scale amplitude: per-partial amplitude * string volume balancing
        // The two middle Sa strings are slightly louder
        const stringVolume =
          stringIdx === 0 ? 0.7 : // Pa or Ma string — slightly lower
          stringIdx === 3 ? 0.6 : // Low Sa — subdued
          1.0;                     // Middle Sa strings — full

        gain.gain.value = partial.amplitude * stringVolume * 0.15;

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();

        this.oscillators.push(osc);
        this.gains.push(gain);
      }
    }
  }

  private rebuildOscillators(): void {
    // Smoothly transition: build new oscillators, then remove old ones
    const oldOscillators = [...this.oscillators];
    const oldGains = [...this.gains];

    this.oscillators = [];
    this.gains = [];

    this.buildOscillators();

    // Fade out old oscillators
    if (this.audioContext) {
      const now = this.audioContext.currentTime;
      for (const gain of oldGains) {
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
      }

      setTimeout(() => {
        for (const osc of oldOscillators) {
          try { osc.stop(); } catch { /* already stopped */ }
          osc.disconnect();
        }
        for (const gain of oldGains) {
          gain.disconnect();
        }
      }, 400);
    }
  }

  private cleanup(): void {
    for (const osc of this.oscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    }
    for (const gain of this.gains) {
      gain.disconnect();
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => { /* ignore */ });
    }

    this.oscillators = [];
    this.gains = [];
    this.masterGain = null;
    this.audioContext = null;
  }
}
