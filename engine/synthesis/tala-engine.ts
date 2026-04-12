/**
 * @module engine/synthesis/tala-engine
 *
 * Synthesised tabla sounds for tala playback.
 *
 * This module provides:
 *   - `synthDayan()` — treble drum synthesis (pitched, high partials)
 *   - `synthBayan()` — bass drum synthesis (inharmonic, with pitch slide)
 *   - `TalaPlayer` — plays individual bols and continuous theka cycles
 *
 * SYNTHESIS APPROACH:
 *   Real tabla sounds emerge from the complex vibration modes of a
 *   membrane loaded with a syahi (iron-paste) circle. The dayan (treble)
 *   has near-harmonic modes that give it a pitched quality. The bayan
 *   (bass) has inharmonic modes and can produce pitch bends by pressing
 *   the membrane. We model both using additive synthesis with appropriate
 *   partial ratios, amplitude envelopes, and pitch envelopes.
 *
 * TIMING:
 *   All beat scheduling uses AudioContext.currentTime for sample-accurate
 *   timing. We NEVER use setInterval for beat scheduling — it drifts and
 *   jitters. Instead, we schedule 4 beats ahead into the Web Audio
 *   timeline and re-schedule when within 2 beats of the buffer end.
 *   A requestAnimationFrame loop drives the scheduling check.
 *
 * BROWSER REQUIREMENT: requires AudioContext (user gesture on iOS Safari).
 *
 * 'use client' — this module uses Web Audio API which requires browser APIs
 */

import { teentaal } from '../theory/talas/teentaal';
import { ektaal } from '../theory/talas/ektaal';
import { jhaptaal } from '../theory/talas/jhaptaal';
import { rupak } from '../theory/talas/rupak';
import type { Tala } from '../theory/types';

// ---------------------------------------------------------------------------
// Tala registry
// ---------------------------------------------------------------------------

const TALA_REGISTRY: Record<string, Tala> = {
  teentaal,
  ektaal,
  jhaptaal,
  rupak,
};

// ---------------------------------------------------------------------------
// Dayan synthesis (treble drum, pitched)
// ---------------------------------------------------------------------------

/**
 * Synthesises a single dayan (treble tabla) stroke.
 *
 * The dayan has near-harmonic partials due to the syahi loading on its
 * membrane. We model 4 partials at ratios [1.0, 2.0, 3.01, 4.1] with
 * exponential amplitude decay. A 5ms noise burst at the attack simulates
 * the initial stick impact.
 *
 * @param ctx - AudioContext
 * @param dest - Destination node to connect to
 * @param fundamental - Fundamental frequency in Hz (typically saHz * 2)
 * @param decay - Decay time in seconds (0.1 to 0.4)
 * @param volume - Volume (0 to 1)
 */
export function synthDayan(
  ctx: AudioContext,
  dest: AudioNode,
  fundamental: number,
  decay: number,
  volume: number,
  time?: number,
): void {
  const t = time ?? ctx.currentTime;

  // Near-harmonic partial ratios (syahi-loaded membrane)
  const partialRatios = [1.0, 2.0, 3.01, 4.1];
  const partialAmps = [1.0, 0.6, 0.3, 0.15];

  // Pitch envelope: start at 2x frequency, drop to fundamental over 25ms
  const pitchStartMultiplier = 2.0;
  const pitchGlideTime = 0.025; // 25ms

  for (let i = 0; i < partialRatios.length; i++) {
    const ratio = partialRatios[i]!;
    const amp = partialAmps[i]!;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // Start at 2x and glide down
    osc.frequency.setValueAtTime(fundamental * ratio * pitchStartMultiplier, t);
    osc.frequency.exponentialRampToValueAtTime(
      fundamental * ratio,
      t + pitchGlideTime,
    );

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * amp * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + decay + 0.01);
  }

  // Attack noise burst (5ms, bandpass filtered)
  const noiseLength = Math.ceil(ctx.sampleRate * 0.005); // 5ms
  const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i++) {
    noiseData[i] = (Math.random() * 2 - 1);
  }

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;

  const noiseBandpass = ctx.createBiquadFilter();
  noiseBandpass.type = 'bandpass';
  noiseBandpass.frequency.value = fundamental * 3;
  noiseBandpass.Q.value = 2;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(volume * 0.5, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.005);

  noiseSrc.connect(noiseBandpass);
  noiseBandpass.connect(noiseGain);
  noiseGain.connect(dest);
  noiseSrc.start(t);
  noiseSrc.stop(t + 0.006);
}

// ---------------------------------------------------------------------------
// Bayan synthesis (bass drum, inharmonic)
// ---------------------------------------------------------------------------

/**
 * Synthesises a single bayan (bass tabla) stroke.
 *
 * The bayan has inharmonic partials due to its larger, unloaded membrane.
 * Partial ratios: [1, 1.47, 2.09, 2.56] — these are characteristic of
 * a circular membrane with non-integer mode ratios.
 *
 * When not damped (open "Ge" stroke), the fundamental slides down by 50%
 * over 200ms, creating the characteristic bass "bend" sound. When damped
 * ("Ka" style), the stroke is very short with no pitch slide.
 *
 * @param ctx - AudioContext
 * @param dest - Destination node to connect to
 * @param fundamental - Fundamental frequency in Hz (80-150 Hz typical)
 * @param decay - Decay time in seconds
 * @param volume - Volume (0 to 1)
 * @param damped - If true, short "Ka" style; if false, open resonant "Ge"
 */
export function synthBayan(
  ctx: AudioContext,
  dest: AudioNode,
  fundamental: number,
  decay: number,
  volume: number,
  damped: boolean,
  time?: number,
): void {
  const t = time ?? ctx.currentTime;

  // Inharmonic partial ratios (circular membrane modes)
  const partialRatios = [1, 1.47, 2.09, 2.56];
  const partialAmps = [1.0, 0.5, 0.25, 0.12];

  const effectiveDecay = damped ? Math.min(decay, 0.08) : decay;

  for (let i = 0; i < partialRatios.length; i++) {
    const ratio = partialRatios[i]!;
    const amp = partialAmps[i]!;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(fundamental * ratio, t);

    // Pitch slide for open (undamped) strokes — "Ge" character
    if (!damped) {
      osc.frequency.exponentialRampToValueAtTime(
        fundamental * ratio * 0.5, // slide down 50%
        t + 0.2, // over 200ms
      );
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * amp * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + effectiveDecay);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + effectiveDecay + 0.01);
  }
}

// ---------------------------------------------------------------------------
// Bol dispatch
// ---------------------------------------------------------------------------

/**
 * Bol synthesis parameters.
 * Maps each tabla syllable to its component drum strokes.
 */
interface BolParams {
  readonly dayan: boolean;
  readonly bayan: boolean;
  readonly dayanDecay: number;
  readonly bayanDecay: number;
  readonly dayanVol: number;
  readonly bayanVol: number;
  readonly bayanDamped: boolean;
  readonly dayanFreqMultiplier: number; // multiplied by saHz * 2
  readonly bayanFundamental: number;    // absolute Hz
}

/**
 * Dispatch table for 8 standard tabla bols covering all Teentaal strokes.
 *
 * Each bol is decomposed into dayan (treble) and/or bayan (bass) components
 * with specific decay times, volumes, and damping characteristics.
 */
const BOL_PARAMS: Record<string, BolParams> = {
  // Dha: dayan + bayan, open, long decay
  'Dha': {
    dayan: true, bayan: true,
    dayanDecay: 0.35, bayanDecay: 0.4,
    dayanVol: 1.0, bayanVol: 1.0,
    bayanDamped: false,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 100,
  },
  // Dhin: dayan + bayan, closed, tighter
  'Dhin': {
    dayan: true, bayan: true,
    dayanDecay: 0.25, bayanDecay: 0.25,
    dayanVol: 0.9, bayanVol: 0.8,
    bayanDamped: false,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 100,
  },
  // Na/Ta: dayan only, short
  'Na': {
    dayan: true, bayan: false,
    dayanDecay: 0.15, bayanDecay: 0,
    dayanVol: 0.8, bayanVol: 0,
    bayanDamped: false,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 0,
  },
  'Ta': {
    dayan: true, bayan: false,
    dayanDecay: 0.15, bayanDecay: 0,
    dayanVol: 0.8, bayanVol: 0,
    bayanDamped: false,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 0,
  },
  // Tin: dayan only, ringing
  'Tin': {
    dayan: true, bayan: false,
    dayanDecay: 0.30, bayanDecay: 0,
    dayanVol: 0.9, bayanVol: 0,
    bayanDamped: false,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 0,
  },
  // Ge/Ghe: bayan only, pitch slide (open)
  'Ge': {
    dayan: false, bayan: true,
    dayanDecay: 0, bayanDecay: 0.35,
    dayanVol: 0, bayanVol: 1.0,
    bayanDamped: false,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 100,
  },
  'Ghe': {
    dayan: false, bayan: true,
    dayanDecay: 0, bayanDecay: 0.35,
    dayanVol: 0, bayanVol: 1.0,
    bayanDamped: false,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 100,
  },
  // Ka/Ke: bayan only, sharp slap (damped)
  'Ka': {
    dayan: false, bayan: true,
    dayanDecay: 0, bayanDecay: 0.08,
    dayanVol: 0, bayanVol: 0.6,
    bayanDamped: true,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 120,
  },
  'Ke': {
    dayan: false, bayan: true,
    dayanDecay: 0, bayanDecay: 0.08,
    dayanVol: 0, bayanVol: 0.6,
    bayanDamped: true,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 120,
  },
  // Ti: dayan only, high frequency, short
  'Ti': {
    dayan: true, bayan: false,
    dayanDecay: 0.10, bayanDecay: 0,
    dayanVol: 0.6, bayanVol: 0,
    bayanDamped: false,
    dayanFreqMultiplier: 2.5,
    bayanFundamental: 0,
  },
  // Dhi: same as Dhin (common alias in theka notation)
  'Dhi': {
    dayan: true, bayan: true,
    dayanDecay: 0.25, bayanDecay: 0.25,
    dayanVol: 0.9, bayanVol: 0.8,
    bayanDamped: false,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 100,
  },
  // Tu: open treble stroke (used in Ektaal)
  'Tu': {
    dayan: true, bayan: false,
    dayanDecay: 0.20, bayanDecay: 0,
    dayanVol: 0.7, bayanVol: 0,
    bayanDamped: false,
    dayanFreqMultiplier: 1.2,
    bayanFundamental: 0,
  },
  // Kat: sharp, dry treble stroke (used in Ektaal)
  'Kat': {
    dayan: true, bayan: false,
    dayanDecay: 0.10, bayanDecay: 0,
    dayanVol: 0.7, bayanVol: 0,
    bayanDamped: false,
    dayanFreqMultiplier: 1.5,
    bayanFundamental: 0,
  },
  // DhaGe: composite — Dha + Ge in quick succession (used in Ektaal)
  'DhaGe': {
    dayan: true, bayan: true,
    dayanDecay: 0.20, bayanDecay: 0.30,
    dayanVol: 0.9, bayanVol: 0.9,
    bayanDamped: false,
    dayanFreqMultiplier: 1.0,
    bayanFundamental: 100,
  },
  // TrKt: rapid double stroke on treble drum (used in Ektaal)
  'TrKt': {
    dayan: true, bayan: false,
    dayanDecay: 0.12, bayanDecay: 0,
    dayanVol: 0.7, bayanVol: 0,
    bayanDamped: false,
    dayanFreqMultiplier: 1.3,
    bayanFundamental: 0,
  },
};

// ---------------------------------------------------------------------------
// TalaPlayer
// ---------------------------------------------------------------------------

/** Supported tala IDs for startTheka. */
export type TalaId = 'teentaal' | 'ektaal' | 'jhaptaal' | 'rupak';

/**
 * TalaPlayer — plays individual tabla bols and continuous theka cycles.
 *
 * Usage:
 *   const player = new TalaPlayer(audioContext, 261.63);
 *   player.playBol('Dha');
 *   player.startTheka('teentaal', 80, (beat, isSam, isKhali) => {
 *     // update UI
 *   });
 *   // later:
 *   player.stopTheka();
 *   player.dispose();
 *
 * TIMING: uses AudioContext.currentTime scheduling, NOT setInterval.
 * Schedules 4 beats ahead, re-schedules when within 2 beats of buffer end.
 */
export class TalaPlayer {
  private ctx: AudioContext;
  private saHz: number;
  private masterGain: GainNode;

  // Theka state
  private thekaRunning = false;
  private currentTala: Tala | null = null;
  private currentTempo = 0;
  private onBeatCallback: ((beat: number, isSam: boolean, isKhali: boolean) => void) | null = null;
  private scheduledUpTo = 0;        // AudioContext time of last scheduled beat
  private nextBeatIndex = 0;        // Next beat to schedule (0-indexed within cycle)
  private rafId: number | null = null;

  // How far ahead (in beats) to schedule
  private static readonly LOOKAHEAD_BEATS = 4;
  // Re-schedule when this many beats remain in the buffer
  private static readonly RESCHEDULE_THRESHOLD_BEATS = 2;

  constructor(ctx: AudioContext, saHz: number) {
    this.ctx = ctx;
    this.saHz = saHz;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(ctx.destination);
  }

  /**
   * Plays a single tabla bol at the specified time.
   *
   * @param bol - The tabla syllable to play (e.g. 'Dha', 'Tin', 'Na')
   * @param time - AudioContext time to play at (default: now)
   * @param volume - Volume multiplier (0 to 1, default: 1.0)
   */
  playBol(bol: string, time?: number, volume?: number): void {
    const params = BOL_PARAMS[bol];
    if (!params) {
      // Unknown bol — silently ignore to avoid crashing during theka playback
      return;
    }

    const t = time ?? this.ctx.currentTime;
    const vol = (volume ?? 1.0) * 0.8; // Scale to prevent clipping
    const dayanFundamental = this.saHz * 2 * params.dayanFreqMultiplier;

    if (params.dayan) {
      synthDayan(
        this.ctx,
        this.masterGain,
        dayanFundamental,
        params.dayanDecay,
        vol * params.dayanVol,
        t,
      );
    }

    if (params.bayan) {
      synthBayan(
        this.ctx,
        this.masterGain,
        params.bayanFundamental,
        params.bayanDecay,
        vol * params.bayanVol,
        params.bayanDamped,
        t,
      );
    }
  }

  /**
   * Starts playing a tala theka continuously.
   *
   * Uses precise Web Audio time scheduling: schedules LOOKAHEAD_BEATS
   * ahead and re-schedules when within RESCHEDULE_THRESHOLD_BEATS of
   * the buffer end. The scheduling loop runs on requestAnimationFrame.
   *
   * @param talaId - Which tala to play
   * @param tempo - Beats per minute
   * @param onBeat - Callback fired on each beat with beat number (1-indexed),
   *                 isSam, and isKhali flags
   */
  startTheka(
    talaId: TalaId,
    tempo: number,
    onBeat?: (beat: number, isSam: boolean, isKhali: boolean) => void,
  ): void {
    // Stop any currently running theka
    if (this.thekaRunning) {
      this.stopTheka();
    }

    const tala = TALA_REGISTRY[talaId];
    if (!tala) {
      throw new Error(`Unknown tala: ${talaId}`);
    }

    this.currentTala = tala;
    this.currentTempo = tempo;
    this.onBeatCallback = onBeat ?? null;
    this.thekaRunning = true;
    this.nextBeatIndex = 0;
    this.scheduledUpTo = this.ctx.currentTime;

    // Initial scheduling burst
    this.scheduleAhead();

    // Start the scheduling loop
    this.schedulingLoop();
  }

  /**
   * Stops the currently running theka.
   */
  stopTheka(): void {
    this.thekaRunning = false;
    this.currentTala = null;
    this.onBeatCallback = null;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Cleans up all resources. Call when done with the TalaPlayer.
   */
  dispose(): void {
    this.stopTheka();
    this.masterGain.disconnect();
  }

  /**
   * Updates the Sa frequency (retunes the dayan).
   */
  setSa(hz: number): void {
    this.saHz = hz;
  }

  /**
   * Updates the tempo of a running theka.
   */
  setTempo(tempo: number): void {
    this.currentTempo = tempo;
  }

  // -----------------------------------------------------------------------
  // Private scheduling
  // -----------------------------------------------------------------------

  /**
   * Schedule beats ahead into the Web Audio timeline.
   * Fills the lookahead buffer from the current position.
   */
  private scheduleAhead(): void {
    if (!this.thekaRunning || !this.currentTala) return;

    const tala = this.currentTala;
    const secondsPerBeat = 60 / this.currentTempo;
    const lookaheadTime = TalaPlayer.LOOKAHEAD_BEATS * secondsPerBeat;
    const targetTime = this.ctx.currentTime + lookaheadTime;

    while (this.scheduledUpTo < targetTime) {
      const beatTime = this.scheduledUpTo;
      const beatIndexInCycle = this.nextBeatIndex % tala.beats;
      const bol = tala.theka[beatIndexInCycle];

      if (bol) {
        this.playBol(bol, beatTime);
      }

      // Fire the onBeat callback (asynchronously, since we're scheduling ahead)
      const beatNumber = beatIndexInCycle + 1; // 1-indexed
      const isSam = beatNumber === tala.sam;
      const isKhali = tala.khali.includes(beatNumber);

      if (this.onBeatCallback) {
        // Schedule the callback to fire at the right time
        const delay = (beatTime - this.ctx.currentTime) * 1000;
        if (delay > 0) {
          const cb = this.onBeatCallback;
          setTimeout(() => cb(beatNumber, isSam, isKhali), delay);
        } else {
          this.onBeatCallback(beatNumber, isSam, isKhali);
        }
      }

      this.scheduledUpTo += secondsPerBeat;
      this.nextBeatIndex++;
    }
  }

  /**
   * The scheduling loop — runs on requestAnimationFrame.
   * Checks if we need to schedule more beats and does so.
   */
  private schedulingLoop(): void {
    if (!this.thekaRunning) return;

    const secondsPerBeat = 60 / this.currentTempo;
    const thresholdTime = this.ctx.currentTime + TalaPlayer.RESCHEDULE_THRESHOLD_BEATS * secondsPerBeat;

    if (this.scheduledUpTo < thresholdTime) {
      this.scheduleAhead();
    }

    this.rafId = requestAnimationFrame(() => this.schedulingLoop());
  }
}
