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
  /**
   * Full cycle duration in seconds for all 4 plucks.
   * Each string gets cycleDuration/4 seconds between plucks.
   * Default: 4.0 (1.0s per string — medium tempo riyaz pace).
   */
  readonly cycleDuration?: number;
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
  cycleDuration: 4.0,
};

// ---------------------------------------------------------------------------
// Tanpura Drone
// ---------------------------------------------------------------------------

/**
 * Per-string gain nodes, grouped for pluck envelope scheduling.
 */
interface StringVoice {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  /** Peak amplitude per partial (partial.amplitude * stringVolume * 0.15). */
  peaks: number[];
}

/**
 * The TanpuraDrone class synthesises a tanpura drone using Web Audio.
 *
 * Each of the four strings is rendered as a set of additive sine oscillators
 * (one per partial), with amplitudes from the jivari model. Strings are
 * plucked sequentially in a repeating cycle (Pa → Sa → Sa → Sa(low) → ...),
 * each with an attack/sustain/decay envelope per partial.
 *
 * The jivari bridge causes higher partials to sustain longer than lower ones —
 * this produces the tanpura's signature shimmering timbre as different partials
 * wax and wane throughout each pluck cycle.
 *
 * Usage:
 *   const tanpura = new TanpuraDrone({ sa_hz: 261.63, volume: 0.3, strings: 4 });
 *   // Must be called from a user gesture handler:
 *   await tanpura.start();
 *   // Later:
 *   tanpura.stop();
 *
 * The drone is computationally lightweight: 4 strings x 10 partials = 40
 * oscillators, well within any modern browser's AudioContext capacity.
 */
export class TanpuraDrone {
  private config: TanpuraConfig;
  private profiles: ReadonlyArray<TanpuraStringProfile>;
  private running: boolean = false;

  private voices: StringVoice[] = [];
  private masterGain: GainNode | null = null;
  private audioContext: AudioContext | null = null;

  /** Handle for the pluck cycle scheduler. */
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  /** Current string index in the pluck cycle (0–3). */
  private cycleIndex: number = 0;

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
   * builds the oscillator graph, and begins the pluck cycle.
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

    // Begin pluck cycle — first pluck immediately
    this.cycleIndex = 0;
    this.schedulePluckCycle();
  }

  /**
   * Stops the tanpura drone with a smooth fade-out.
   * Fade duration: 500ms.
   */
  stop(): void {
    if (!this.running || !this.audioContext || !this.masterGain) return;

    // Cancel pluck cycle
    if (this.cycleTimer !== null) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }

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

  /**
   * Build the oscillator graph. All oscillators start running but at gain 0 —
   * the pluck cycle scheduler shapes the envelopes.
   */
  private buildOscillators(): void {
    if (!this.audioContext || !this.masterGain) return;

    const detuningCents = this.config.saDetuningCents ?? 2;

    for (let stringIdx = 0; stringIdx < this.profiles.length; stringIdx++) {
      const profile = this.profiles[stringIdx]!;
      const voice: StringVoice = { oscillators: [], gains: [], peaks: [] };

      // String volume balancing
      const stringVolume =
        stringIdx === 0 ? 0.7 :   // Pa or Ma string — slightly lower
        stringIdx === 3 ? 0.6 :   // Low Sa — subdued
        1.0;                       // Middle Sa strings — full

      for (const partial of profile.partials) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = partial.frequency;

        // Apply slight detuning to the third string (second Sa)
        if (stringIdx === 2) {
          const detuneRatio = Math.pow(2, detuningCents / 1200);
          osc.frequency.value = partial.frequency * detuneRatio;
        }

        const gain = this.audioContext.createGain();
        // Start silent — pluck cycle will shape the envelope
        gain.gain.value = 0;

        const peak = partial.amplitude * stringVolume * 0.15;
        voice.peaks.push(peak);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();

        voice.oscillators.push(osc);
        voice.gains.push(gain);
      }

      this.voices.push(voice);
    }
  }

  // -------------------------------------------------------------------------
  // Private: pluck envelope
  // -------------------------------------------------------------------------

  /**
   * Schedule a pluck on a single string.
   *
   * A real tanpura string sustains for most of the full cycle (all 4
   * plucks) — the drone character comes from all strings ringing
   * simultaneously with overlapping harmonics. The jivari bridge
   * re-excites upper partials on each contact, so partials 2-5
   * sustain even longer than the fundamental.
   *
   * The jivari envelope model:
   *   - Attack: ~15ms sharp rise (string contact with jivari bridge)
   *   - Sustain: string rings across 3-4 pluck intervals (~3-4s)
   *   - Jivari shimmer: partials 2-5 decay slower, creating the
   *     characteristic waxing/waning of overtones
   *   - The next pluck of the same string naturally re-attacks over
   *     whatever residual sustain remains — no hard cut
   */
  private pluckString(stringIdx: number): void {
    if (!this.audioContext) return;
    const voice = this.voices[stringIdx];
    if (!voice) return;

    const now = this.audioContext.currentTime;
    const cycleDuration = this.config.cycleDuration ?? 4.0;

    for (let p = 0; p < voice.gains.length; p++) {
      const gainNode = voice.gains[p]!;
      const peak = voice.peaks[p]!;
      const partialNum = p + 1; // 1-indexed

      // Jivari model: higher partials (2-5) have slower decay because
      // the bridge re-excites them. The fundamental decays fastest.
      // Beyond partial 5, decay speeds up again (string stiffness).
      const jivariSustainFactor =
        partialNum === 1 ? 1.0 :
        partialNum === 2 ? 1.8 :
        partialNum <= 4 ? 1.6 :
        partialNum <= 6 ? 1.3 :
        0.9;

      // Each string should sustain across most of the full cycle
      // (all 4 plucks = cycleDuration). The string is still audible
      // at ~20-30% when the same string is plucked again, creating
      // the continuous drone. Time constant chosen so the string
      // reaches ~15% at one full cycle.
      const decayTime = cycleDuration * 0.9 * jivariSustainFactor;
      const timeConstant = decayTime / 2.0;

      // Attack: sharp 15ms rise — jivari bridge contact
      const attackEnd = now + 0.015;

      // Smoothly ramp from current level (residual sustain from
      // previous pluck) to peak, preserving the continuous feel.
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(peak, attackEnd);

      // Long exponential decay — string rings across 3+ pluck intervals
      gainNode.gain.setTargetAtTime(0, attackEnd, timeConstant);
    }
  }

  /**
   * Schedule the repeating pluck cycle.
   * Pa → Sa → Sa → Sa(low), then repeat.
   */
  private schedulePluckCycle(): void {
    if (!this.running) return;

    this.pluckString(this.cycleIndex);

    // Advance to next string
    this.cycleIndex = (this.cycleIndex + 1) % 4;

    // Schedule next pluck
    const interval = ((this.config.cycleDuration ?? 4.0) / 4) * 1000; // ms
    this.cycleTimer = setTimeout(() => {
      this.schedulePluckCycle();
    }, interval);
  }

  private rebuildOscillators(): void {
    // Smoothly transition: build new voices, then remove old ones
    const oldVoices = [...this.voices];

    this.voices = [];
    this.buildOscillators();

    // Fade out old oscillators
    if (this.audioContext) {
      const now = this.audioContext.currentTime;
      for (const voice of oldVoices) {
        for (const gain of voice.gains) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.3);
        }
      }

      setTimeout(() => {
        for (const voice of oldVoices) {
          for (const osc of voice.oscillators) {
            try { osc.stop(); } catch { /* already stopped */ }
            osc.disconnect();
          }
          for (const gain of voice.gains) {
            gain.disconnect();
          }
        }
      }, 400);
    }
  }

  private cleanup(): void {
    if (this.cycleTimer !== null) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }

    for (const voice of this.voices) {
      for (const osc of voice.oscillators) {
        try { osc.stop(); } catch { /* already stopped */ }
        osc.disconnect();
      }
      for (const gain of voice.gains) {
        gain.disconnect();
      }
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => { /* ignore */ });
    }

    this.voices = [];
    this.masterGain = null;
    this.audioContext = null;
  }
}
