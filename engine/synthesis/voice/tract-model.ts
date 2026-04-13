/**
 * @module engine/synthesis/voice/tract-model
 *
 * TantriVoice(TM) — Vocal tract filter model.
 *
 * The Fant source-filter model: voice = source * filter.
 * The source is the glottal buzz. The filter is the vocal tract.
 *
 * The vocal tract is modeled as 5 formant resonators (BiquadFilterNode
 * of type 'peaking') in series, plus a singer's formant peak and a
 * nasal anti-resonance (notch filter). This produces the characteristic
 * spectral envelope of a human singing voice.
 *
 * Architecture:
 *   input -> F1 -> F2 -> F3 -> F4 -> F5
 *     -> Singer's Formant (peaking)
 *       -> Nasal Anti-Resonance (notch)
 *         -> output
 *
 * Formant transitions (for vowel changes, meend, etc.) use
 * linearRampToValueAtTime on each filter's frequency and Q parameters.
 */

import type {
  FormantSet,
  Formant,
  SingerFormant,
  NasalResonance,
  VoiceType,
} from './formants';
import {
  getSingerFormant,
  getNasalResonance,
} from './formants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VocalTract {
  /** The 5 formant filters in series */
  readonly filters: readonly BiquadFilterNode[];
  /** Singer's formant filter */
  readonly singerFilter: BiquadFilterNode;
  /** Nasal anti-resonance filter */
  readonly nasalNotch: BiquadFilterNode;
  /** Nasal pole filter (low-frequency nasal resonance) */
  readonly nasalPole: BiquadFilterNode;
  /** Input node — connect glottal source output here */
  readonly input: AudioNode;
  /** Output node — connect this to ADSR envelope / destination */
  readonly output: AudioNode;
  /** Set all formant parameters at once */
  setFormants(formants: FormantSet, time?: number): void;
  /** Ramp formants to new values over duration (for vowel transitions) */
  rampFormants(formants: FormantSet, endTime: number): void;
  /** Set nasal coupling level (0 = none, 1 = maximum) */
  setNasalCoupling(level: number, time?: number): void;
  /** Release all resources */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Helper: compute Q from frequency and bandwidth
// ---------------------------------------------------------------------------

function computeQ(frequency: number, bandwidth: number): number {
  return frequency / Math.max(bandwidth, 1);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a vocal tract filter chain.
 *
 * @param ctx - AudioContext
 * @param initialFormants - Initial formant set (vowel)
 * @param voiceType - Voice type for singer's formant and nasal params
 * @param destination - AudioNode to connect output to
 */
export function createVocalTract(
  ctx: AudioContext,
  initialFormants: FormantSet,
  voiceType: VoiceType,
  destination: AudioNode,
): VocalTract {
  const singerParams = getSingerFormant(voiceType);
  const nasalParams = getNasalResonance(voiceType);

  // Create 5 formant filters in series
  const formantDefs = [
    initialFormants.f1,
    initialFormants.f2,
    initialFormants.f3,
    initialFormants.f4,
    initialFormants.f5,
  ];

  const filters: BiquadFilterNode[] = formantDefs.map((f) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = f.frequency;
    filter.Q.value = computeQ(f.frequency, f.bandwidth);
    filter.gain.value = f.gainDb;
    return filter;
  });

  // Chain formant filters in series
  for (let i = 0; i < filters.length - 1; i++) {
    filters[i]!.connect(filters[i + 1]!);
  }

  // Singer's formant — the brilliance/projection peak
  const singerFilter = ctx.createBiquadFilter();
  singerFilter.type = 'peaking';
  singerFilter.frequency.value = singerParams.frequency;
  singerFilter.Q.value = singerParams.q;
  singerFilter.gain.value = singerParams.gainDb;

  filters[filters.length - 1]!.connect(singerFilter);

  // Nasal anti-resonance (notch)
  const nasalNotch = ctx.createBiquadFilter();
  nasalNotch.type = 'notch';
  nasalNotch.frequency.value = nasalParams.notchFrequency;
  nasalNotch.Q.value = nasalParams.notchQ;
  // Notch filters don't use gain — depth controlled by Q
  // For variable nasal coupling, we adjust Q dynamically

  singerFilter.connect(nasalNotch);

  // Nasal pole (low-frequency nasal resonance)
  const nasalPole = ctx.createBiquadFilter();
  nasalPole.type = 'peaking';
  nasalPole.frequency.value = nasalParams.poleFrequency;
  nasalPole.Q.value = nasalParams.poleQ;
  nasalPole.gain.value = 0; // Off by default — enabled by setNasalCoupling

  nasalNotch.connect(nasalPole);

  // Output gain
  const output = ctx.createGain();
  output.gain.value = 1.0;
  nasalPole.connect(output);
  output.connect(destination);

  // Input node is the first formant filter
  const input = filters[0]!;

  let disposed = false;

  const tract: VocalTract = {
    filters,
    singerFilter,
    nasalNotch,
    nasalPole,
    input,
    output,

    setFormants(formants: FormantSet, time?: number) {
      if (disposed) return;
      const t = time ?? ctx.currentTime;
      const defs = [formants.f1, formants.f2, formants.f3, formants.f4, formants.f5];
      for (let i = 0; i < filters.length; i++) {
        const f = defs[i]!;
        const filter = filters[i]!;
        filter.frequency.setValueAtTime(f.frequency, t);
        filter.Q.setValueAtTime(computeQ(f.frequency, f.bandwidth), t);
        filter.gain.setValueAtTime(f.gainDb, t);
      }
    },

    rampFormants(formants: FormantSet, endTime: number) {
      if (disposed) return;
      const defs = [formants.f1, formants.f2, formants.f3, formants.f4, formants.f5];
      for (let i = 0; i < filters.length; i++) {
        const f = defs[i]!;
        const filter = filters[i]!;
        filter.frequency.linearRampToValueAtTime(f.frequency, endTime);
        filter.Q.linearRampToValueAtTime(computeQ(f.frequency, f.bandwidth), endTime);
        filter.gain.linearRampToValueAtTime(f.gainDb, endTime);
      }
    },

    setNasalCoupling(level: number, time?: number) {
      if (disposed) return;
      const t = time ?? ctx.currentTime;
      const clampedLevel = Math.max(0, Math.min(1, level));

      // Adjust nasal notch Q (higher coupling = lower Q = wider notch)
      const notchQ = nasalParams.notchQ * (1 - clampedLevel * 0.6);
      nasalNotch.Q.setValueAtTime(Math.max(notchQ, 0.5), t);

      // Adjust nasal pole gain
      nasalPole.gain.setValueAtTime(nasalParams.poleGainDb * clampedLevel, t);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        for (const f of filters) f.disconnect();
        singerFilter.disconnect();
        nasalNotch.disconnect();
        nasalPole.disconnect();
        output.disconnect();
      } catch {
        // Already disconnected
      }
    },
  };

  return tract;
}
