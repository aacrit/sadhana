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
  /**
   * Number of strings to voice.
   * - 2: Sa + ground (default — Shishya level, cleaner, less overlap)
   * - 3: ground + Sa + Sa (Sadhaka level, richer)
   * - 4: ground + Sa + Sa + Sa_low (Varistha+, full tanpura)
   * Default: 2. Level-based selection happens in the calling code.
   */
  readonly stringCount?: 2 | 3 | 4;
  /**
   * Ground string tuning for the first tanpura string.
   * - 'Pa': standard (Pa, Sa, Sa, Sa_low) — used for most ragas
   * - 'Ma': Ma-dominant ragas (Marwa, Malkauns) where Pa is absent
   * - 'Ni': Ni-emphasised ragas (Bageshri)
   * Default: 'Pa'. When 'Ma' is set, useMa is also true (legacy compat).
   */
  readonly groundString?: 'Pa' | 'Ma' | 'Ni';
  /** @deprecated Use groundString instead. Kept for backward compatibility. */
  readonly useMa?: boolean;
  /** Slight detuning in cents between the two Sa strings (default: 2). */
  readonly saDetuningCents?: number;
  /**
   * Full cycle duration in seconds for all plucks across all active strings.
   * Each string gets cycleDuration/stringCount seconds between plucks.
   * Default: 2.0 — at stringCount=2 this gives 1.0s/pluck, matching the
   * original 4-string at 4.0s/cycle feel (same inter-pluck interval).
   */
  readonly cycleDuration?: number;
  /**
   * Jivari per-partial random detune in cents.
   * Each partial oscillator receives a random offset in the range [-jivarDetuneCents, +jivarDetuneCents].
   * Seeded deterministically per partial index for session consistency.
   * Default: 0.4¢ — just enough shimmer, within musicologically defensible range.
   */
  readonly jivariDetuneCents?: number;
}

/**
 * Default tanpura configuration.
 * stringCount defaults to 2 (Sa + ground): Shishya entry point.
 * cycleDuration defaults to 2.0 so a 2-string tanpura plucks at 1.0s/string,
 * matching the feel of the original 4-string at 4.0s/cycle.
 */
export const DEFAULT_TANPURA_CONFIG: TanpuraConfig = {
  sa_hz: 261.63,
  volume: 0.3,
  stringCount: 2,
  groundString: 'Pa',
  useMa: false,
  saDetuningCents: 2,
  cycleDuration: 2.0,
  jivariDetuneCents: 0.4,
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

  /**
   * Expose the underlying AudioContext so the frontend can register it
   * with the global resumer (audit #1 — mobile context suspension).
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /** Handle for the pluck cycle scheduler. */
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  /** Handle for the scheduled post-fade cleanup. */
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;
  /** Current string index in the pluck cycle (0–3). */
  private cycleIndex: number = 0;

  constructor(config: Partial<TanpuraConfig> = {}) {
    this.config = { ...DEFAULT_TANPURA_CONFIG, ...config };
    // Resolve groundString: new API takes priority, legacy useMa is fallback
    const groundString = this.config.groundString ?? (this.config.useMa ? 'Ma' : 'Pa');
    const stringCount = this.config.stringCount ?? 2;
    this.profiles = tanpuraPartials(
      this.config.sa_hz,
      groundString,
    ).slice(0, stringCount);
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
   * Fade duration: 500ms. Graph teardown scheduled at 600ms (post-decay).
   *
   * Safe to call multiple times. A second stop() after running has been
   * cleared is a no-op. The cleanup is scheduled on a captured snapshot
   * of the current graph, so a start() called within the 600ms fade window
   * will build a fresh, independent graph that the in-flight teardown
   * timer cannot touch.
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

    // Capture the current graph references so the scheduled cleanup operates
    // on *this* graph, not on whatever graph happens to be live at the 600ms
    // mark. Without this capture, a start() called within 600ms would install
    // a new AudioContext/masterGain/voices and the stale timer would tear
    // those down.
    const voicesToClean = this.voices;
    const masterGainToClean = this.masterGain;
    const audioContextToClean = this.audioContext;

    // Immediately clear instance fields so start() may rebuild cleanly.
    this.voices = [];
    this.masterGain = null;
    this.audioContext = null;
    this.running = false;

    // Stop and clean up oscillators after fade. Store handle so a subsequent
    // start() can cancel pending teardown of *its* graph — but since we've
    // already captured and detached the old graph, start()'s new graph is
    // independent and the timer below only ever touches the old nodes.
    this.cleanupTimer = setTimeout(() => {
      this.cleanupTimer = null;
      this.cleanupCapturedGraph(voicesToClean, masterGainToClean, audioContextToClean);
    }, 600);
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
    const groundString = this.config.groundString ?? (this.config.useMa ? 'Ma' : 'Pa');
    const stringCount = this.config.stringCount ?? 2;
    this.profiles = tanpuraPartials(hz, groundString).slice(0, stringCount);

    if (this.running && this.audioContext) {
      this.rebuildOscillators();
    }
  }

  /**
   * Sets the master volume.
   *
   * A short ramp (default 50ms) is applied so gain changes are perceptually
   * smooth — no clicks. Use a longer ramp (e.g. 400ms) when ducking the
   * drone between lesson phases so the transition feels like a natural
   * shift in presence rather than a hard cut.
   *
   * @param volume - Volume level (0 to 1)
   * @param rampMs - Duration of the ramp in milliseconds (default 50, clamped to >= 1).
   */
  setVolume(volume: number, rampMs: number = 50): void {
    if (volume < 0 || volume > 1) {
      throw new RangeError('Volume must be between 0 and 1');
    }

    this.config = { ...this.config, volume };

    if (this.masterGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      const rampSec = Math.max(0.001, rampMs / 1000);
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(volume, now + rampSec);
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

  /**
   * Returns the active string count (reflects stringCount config).
   */
  getStringCount(): number {
    return this.config.stringCount ?? 2;
  }

  // -------------------------------------------------------------------------
  // Private: oscillator graph construction
  // -------------------------------------------------------------------------

  /**
   * Deterministic seeded pseudo-random number generator (xorshift32).
   * Returns a value in [-1, 1] for a given seed.
   *
   * Using a seeded PRNG ensures the jivari detune is consistent across
   * sessions — the same session always has the same shimmer pattern, which
   * avoids the character of the instrument changing between reloads.
   */
  private seededRandom(seed: number): number {
    let x = seed ^ 0x12345678;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return (x & 0x7fffffff) / 0x7fffffff * 2 - 1;
  }

  /**
   * Build the oscillator graph. All oscillators start running but at gain 0 —
   * the pluck cycle scheduler shapes the envelopes.
   */
  private buildOscillators(): void {
    if (!this.audioContext || !this.masterGain) return;

    const detuningCents = this.config.saDetuningCents ?? 2;
    const jivariDetuneCents = this.config.jivariDetuneCents ?? 0.4;
    const stringCount = this.config.stringCount ?? 2;

    for (let stringIdx = 0; stringIdx < this.profiles.length; stringIdx++) {
      const profile = this.profiles[stringIdx]!;
      const voice: StringVoice = { oscillators: [], gains: [], peaks: [] };

      // String volume balancing — ground string slightly lower,
      // low Sa (only present in 4-string) subdued.
      const isGroundString = stringIdx === 0;
      const isLowSa = stringCount === 4 && stringIdx === 3;
      const stringVolume =
        isGroundString ? 0.7 :
        isLowSa ? 0.6 :
        1.0;

      for (let partialIdx = 0; partialIdx < profile.partials.length; partialIdx++) {
        const partial = profile.partials[partialIdx]!;
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';

        // Jivari per-partial detune: each partial receives a deterministic
        // random offset in [-jivariDetuneCents, +jivariDetuneCents].
        // Seed = stringIdx * 100 + partialIdx for determinism across sessions.
        const jivariCents = this.seededRandom(stringIdx * 100 + partialIdx) * jivariDetuneCents;
        const jivariRatio = Math.pow(2, jivariCents / 1200);
        let freq = partial.frequency * jivariRatio;

        // Apply slight detuning to the second Sa string for chorus effect.
        // In a 2-string config (index 0=ground, 1=Sa) there is no second Sa,
        // so detuning only fires for stringIdx >= 2 (3-string and 4-string).
        if (stringIdx >= 2) {
          const detuneRatio = Math.pow(2, detuningCents / 1200);
          freq = partial.frequency * detuneRatio * jivariRatio;
        }

        osc.frequency.value = freq;

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

      // Jivari model: higher partials sustain slightly longer than the
      // fundamental due to bridge re-excitation. All factors are ≤ 1.0
      // so the decay tail finishes within one pluck cycle — no audible
      // overlap on the 2-string default (1.0s/pluck).
      const jivariSustainFactor =
        partialNum === 1 ? 0.75 :
        partialNum === 2 ? 0.95 :
        partialNum <= 4 ? 0.90 :
        partialNum <= 6 ? 0.80 :
        0.65;

      // Each string decays within 90% of one pluck interval, so the
      // per-string cycle never overlaps into the next pluck of that string.
      // cycleDuration / stringCount = per-string interval.
      const stringCount = this.config.stringCount ?? 2;
      const perStringInterval = cycleDuration / stringCount;
      const decayTime = perStringInterval * 0.9 * jivariSustainFactor;
      const timeConstant = decayTime / 2.0;

      // Attack: 35ms exponential rise — more natural string-contact character
      // than the previous 15ms linear attack. Exponential ramp models the
      // progressive engagement of the jivari bridge as the string settles.
      const attackEnd = now + 0.035;
      const attackStart = Math.max(gainNode.gain.value, 0.0001); // exponential needs non-zero start

      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(attackStart, now);
      gainNode.gain.exponentialRampToValueAtTime(peak, attackEnd);

      // Long exponential decay — string rings across 3+ pluck intervals
      gainNode.gain.setTargetAtTime(0, attackEnd, timeConstant);
    }
  }

  /**
   * Schedule the repeating pluck cycle.
   * Cycles through all active strings: at stringCount=2, ground → Sa → ground → ...
   * At stringCount=4, ground → Sa → Sa → Sa(low) → ...
   */
  private schedulePluckCycle(): void {
    if (!this.running) return;

    const stringCount = this.config.stringCount ?? 2;
    this.pluckString(this.cycleIndex);

    // Advance to next string, wrapping at the active string count
    this.cycleIndex = (this.cycleIndex + 1) % stringCount;

    // Per-string interval: total cycle divided by string count.
    // At 2-string/2.0s → 1.0s/pluck. At 4-string/4.0s → 1.0s/pluck.
    const interval = ((this.config.cycleDuration ?? 2.0) / stringCount) * 1000; // ms
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

  /**
   * Tear down a captured graph. Used by stop() via a 600ms scheduled timer
   * so the fade-out can complete before sources are stopped.
   *
   * This operates on captured references (passed in as args), never on the
   * live `this.voices`/`this.masterGain`/`this.audioContext` fields. That
   * guarantees a start() called during the 600ms fade-out window cannot
   * have its fresh graph torn down by a stale timer from the prior stop().
   *
   * Every OscillatorNode is explicitly .stop()-ed (even though start()
   * creates them with no end time, they must be stopped to release WebAudio
   * rendering resources). Every node is .disconnect()-ed. The owning
   * AudioContext is closed (TanpuraDrone creates its own context per start(),
   * so this is an owned resource — not a shared context). Any remaining
   * references become unreachable and are GC'd.
   */
  private cleanupCapturedGraph(
    voices: StringVoice[],
    masterGain: GainNode,
    audioContext: AudioContext,
  ): void {
    for (const voice of voices) {
      for (const osc of voice.oscillators) {
        try { osc.stop(); } catch { /* already stopped */ }
        osc.disconnect();
      }
      for (const gain of voice.gains) {
        gain.disconnect();
      }
    }
    masterGain.disconnect();
    if (audioContext.state !== 'closed') {
      audioContext.close().catch(() => { /* ignore */ });
    }
  }
}
