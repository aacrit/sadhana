/**
 * @module engine/voice/onset-detection.test
 *
 * Tests for the spectral-flux onset detector and the tala scorer.
 *
 * We synthesise PCM signals containing impulses at known timestamps, run
 * the detector, and assert the detected onsets land within ~10ms of the
 * truth. The tala scorer tests use synthetic onset arrays directly.
 */

import { describe, it, expect } from 'vitest';
import {
  detectOnsets,
  scoreTalaOnsets,
  buildBeatTimes,
  type DetectedOnset,
} from './onset-detection';

const SR = 44100;

/** Build a PCM signal with sharp clap-like impulses at given times (s). */
function impulseSignal(durationS: number, hits: number[]): Float32Array {
  const n = Math.floor(durationS * SR);
  const buf = new Float32Array(n);
  for (const t of hits) {
    const i = Math.floor(t * SR);
    if (i < 0 || i >= n) continue;
    // 30ms exponentially decaying noise burst (mimics a clap)
    const decay = 0.030 * SR;
    for (let k = 0; k < decay && i + k < n; k++) {
      const env = Math.exp(-3 * (k / decay));
      buf[i + k] = env * (Math.random() * 2 - 1) * 0.8;
    }
  }
  return buf;
}

describe('detectOnsets', () => {
  it('returns empty for silence', () => {
    const audio = new Float32Array(SR);
    const result = detectOnsets(audio, { sampleRate: SR });
    expect(result.onsets.length).toBe(0);
  });

  it('detects a single impulse', () => {
    const audio = impulseSignal(1.0, [0.5]);
    const result = detectOnsets(audio, { sampleRate: SR });
    expect(result.onsets.length).toBeGreaterThanOrEqual(1);
    const closest = result.onsets[0]!;
    // FFT/hop-rounded — onset should be within ±30ms of truth
    expect(Math.abs(closest.t - 0.5)).toBeLessThan(0.030);
  });

  it('detects four equally spaced impulses (a tabla cycle)', () => {
    const beatS = 0.6; // 100 bpm
    const hits = [0.2, 0.2 + beatS, 0.2 + 2 * beatS, 0.2 + 3 * beatS];
    const audio = impulseSignal(beatS * 4 + 0.4, hits);
    const result = detectOnsets(audio, { sampleRate: SR });
    expect(result.onsets.length).toBeGreaterThanOrEqual(4);
    // Each truth should have a detected onset within 35ms
    for (const truth of hits) {
      const closest = result.onsets.reduce<DetectedOnset | null>((best, o) => {
        const dt = Math.abs(o.t - truth);
        if (best === null || dt < Math.abs(best.t - truth)) return o;
        return best;
      }, null);
      expect(closest).not.toBeNull();
      expect(Math.abs(closest!.t - truth)).toBeLessThan(0.035);
    }
  });

  it('respects min-interval-ms — does not double-count rapid-fire', () => {
    // Two impulses 20ms apart — should be merged at default 50ms min interval
    const audio = impulseSignal(0.5, [0.2, 0.22]);
    const result = detectOnsets(audio, { sampleRate: SR });
    // At most one onset in the [0.18, 0.26] window
    const inWindow = result.onsets.filter((o) => o.t > 0.18 && o.t < 0.26);
    expect(inWindow.length).toBeLessThanOrEqual(1);
  });
});

describe('scoreTalaOnsets', () => {
  it('returns 100% accuracy when every beat matches', () => {
    const beats = [0, 0.6, 1.2, 1.8];
    const onsets: DetectedOnset[] = beats.map((t) => ({ t, strength: 1 }));
    const result = scoreTalaOnsets(onsets, beats, 100);
    expect(result.accuracy).toBe(1);
    expect(result.meanAbsErrorMs).toBeLessThan(1);
  });

  it('returns 0 accuracy when no onsets are within tolerance', () => {
    const beats = [0, 0.6, 1.2];
    const onsets: DetectedOnset[] = [
      { t: 5.0, strength: 1 },
      { t: 5.5, strength: 1 },
    ];
    const result = scoreTalaOnsets(onsets, beats, 100);
    expect(result.accuracy).toBe(0);
  });

  it('penalises late hits within tolerance', () => {
    const beats = [0, 0.6, 1.2, 1.8];
    const onsets: DetectedOnset[] = beats.map((t) => ({ t: t + 0.05, strength: 1 }));
    const result = scoreTalaOnsets(onsets, beats, 100);
    expect(result.accuracy).toBe(1);
    expect(result.meanAbsErrorMs).toBeGreaterThan(45);
    expect(result.meanAbsErrorMs).toBeLessThan(55);
    for (const hit of result.hits) {
      expect(hit.errorMs).toBeGreaterThan(45);
    }
  });

  it('does not double-count one onset for two beats', () => {
    // Single onset between two beats, only one should claim it
    const beats = [0, 0.1];
    const onsets: DetectedOnset[] = [{ t: 0.05, strength: 1 }];
    const result = scoreTalaOnsets(onsets, beats, 100);
    const hits = result.hits.filter((h) => h.hit);
    expect(hits.length).toBe(1);
  });
});

describe('buildBeatTimes', () => {
  it('builds 16-beat teentaal at 60 bpm = 1 beat/sec', () => {
    const times = buildBeatTimes(16, 60, 1);
    expect(times.length).toBe(16);
    expect(times[0]).toBe(0);
    expect(times[15]).toBeCloseTo(15, 5);
  });

  it('extends to multiple cycles', () => {
    const times = buildBeatTimes(4, 120, 2);
    expect(times.length).toBe(8);
    expect(times[4]).toBeCloseTo(2, 5); // 4 beats × 0.5s = 2s
  });

  it('respects startT offset', () => {
    const times = buildBeatTimes(4, 60, 1, 0.25);
    expect(times[0]).toBe(0.25);
    expect(times[3]).toBeCloseTo(3.25, 5);
  });
});
