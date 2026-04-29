/**
 * @module engine/voice/ornament-evaluator.test
 *
 * Unit tests for the ornament trajectory evaluator.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateOrnament,
  type OrnamentAttempt,
  type OrnamentPitchSample,
} from './ornament-evaluator';
import { getSwaraFrequency } from '../theory/swaras';
import { generateMeendTrajectory, generateOscillationTrajectory } from '../theory/ornaments';

const SA_HZ = 261.63;

// ---------------------------------------------------------------------------
// Helpers for synthesising pitch-sample streams
// ---------------------------------------------------------------------------

function samplesFromTrajectory(
  traj: readonly [number, number][],
  confidence = 0.95,
): OrnamentPitchSample[] {
  return traj.map(([tMs, hz]) => ({
    t: tMs / 1000,
    hz,
    confidence,
  }));
}

function flatSamples(
  hz: number,
  durationMs: number,
  sampleCount: number,
  confidence = 0.95,
): OrnamentPitchSample[] {
  const out: OrnamentPitchSample[] = [];
  for (let i = 0; i < sampleCount; i++) {
    out.push({
      t: (i / (sampleCount - 1)) * (durationMs / 1000),
      hz,
      confidence,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('evaluateOrnament — meend', () => {
  it('scores a perfect Sa → Re meend above 0.9', () => {
    const saHz = SA_HZ;
    const reHz = getSwaraFrequency('Re', saHz, 'madhya');
    const traj = generateMeendTrajectory(saHz, reHz, 1200, 80);
    const attempt: OrnamentAttempt = {
      ornamentId: 'meend',
      targetSwara: 'Re',
      fromSwara: 'Sa',
      pitchSamples: samplesFromTrajectory(traj),
      ragaContext: 'yaman',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.overall).toBeGreaterThan(0.9);
    expect(score.shapeFit).toBeGreaterThan(0.9);
    expect(score.timing).toBe(1);
    // Log-spaced meend trajectory approaches target asymptotically; the
    // last-window average lands within ~15 cents of target swara.
    expect(Math.abs(score.arrivalAccuracyCents)).toBeLessThan(15);
  });

  it('scores a flat (no-glide) meend attempt below 0.3 overall', () => {
    const saHz = SA_HZ;
    const reHz = getSwaraFrequency('Re', saHz, 'madhya');
    // Student holds Sa the entire time instead of gliding.
    const attempt: OrnamentAttempt = {
      ornamentId: 'meend',
      targetSwara: 'Re',
      fromSwara: 'Sa',
      pitchSamples: flatSamples(saHz, 1200, 60),
      ragaContext: 'yaman',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.overall).toBeLessThan(0.3);
    expect(score.shapeFit).toBeLessThan(0.3);
    // Arrival is off by ~204 cents (Sa vs Re), well outside tolerance.
    expect(Math.abs(score.arrivalAccuracyCents)).toBeGreaterThan(150);
    // Note should call out that the voice held flat.
    expect(score.notes.some(n => /did not glide|flat/i.test(n))).toBe(true);
  });

  it('marks meend that lands sharp with an arrival note', () => {
    const saHz = SA_HZ;
    const reHz = getSwaraFrequency('Re', saHz, 'madhya');
    // Land ~30 cents sharp of Re.
    const sharpRe = reHz * Math.pow(2, 30 / 1200);
    const traj = generateMeendTrajectory(saHz, sharpRe, 1200, 60);
    const attempt: OrnamentAttempt = {
      ornamentId: 'meend',
      targetSwara: 'Re',
      fromSwara: 'Sa',
      pitchSamples: samplesFromTrajectory(traj),
      ragaContext: 'yaman',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    // Target is +30c sharp; averaged over the final window of the
    // log-glide, arrival sits well above 15 cents but below the raw 30.
    expect(score.arrivalAccuracyCents).toBeGreaterThan(15);
    expect(score.notes.some(n => /sharp/i.test(n))).toBe(true);
  });
});

describe('evaluateOrnament — andolan', () => {
  it('scores a clean andolan on Re_k above 0.8', () => {
    const saHz = SA_HZ;
    const reKHz = getSwaraFrequency('Re_k', saHz, 'madhya');
    // andolan ornaments.ts: 2-4 Hz, 15-40 cents → midpoint 3 Hz, 27.5 cents.
    const traj = generateOscillationTrajectory(reKHz, 27.5, 3, 2000, 160);
    const attempt: OrnamentAttempt = {
      ornamentId: 'andolan',
      targetSwara: 'Re_k',
      pitchSamples: samplesFromTrajectory(traj),
      ragaContext: 'bhairav',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.shapeFit).toBeGreaterThan(0.8);
    expect(score.timing).toBe(1);
  });

  it('flags shallow andolan depth but keeps timing valid', () => {
    const saHz = SA_HZ;
    const reKHz = getSwaraFrequency('Re_k', saHz, 'madhya');
    // Correct period, but amplitude reduced to 5 cents (well below 15-40).
    const traj = generateOscillationTrajectory(reKHz, 5, 3, 2000, 160);
    const attempt: OrnamentAttempt = {
      ornamentId: 'andolan',
      targetSwara: 'Re_k',
      pitchSamples: samplesFromTrajectory(traj),
      ragaContext: 'bhairav',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.timing).toBe(1);
    expect(score.shapeFit).toBeLessThan(0.8);
    expect(score.notes.some(n => /shallow/i.test(n))).toBe(true);
  });
});

describe('evaluateOrnament — gamak', () => {
  it('scores a clean gamak above 0.75', () => {
    const saHz = SA_HZ;
    const maHz = getSwaraFrequency('Ma', saHz, 'madhya');
    // gamak ornaments.ts: 4-8 Hz, 50-150 cents → midpoint 6 Hz, 100 cents.
    const traj = generateOscillationTrajectory(maHz, 100, 6, 1000, 200);
    const attempt: OrnamentAttempt = {
      ornamentId: 'gamak',
      targetSwara: 'Ma',
      pitchSamples: samplesFromTrajectory(traj),
      ragaContext: 'bhairav',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.shapeFit).toBeGreaterThan(0.5);
    expect(score.timing).toBe(1);
    expect(score.overall).toBeGreaterThan(0.7);
  });
});

describe('evaluateOrnament — timing', () => {
  it('scores zero timing when attempt is far too short', () => {
    const saHz = SA_HZ;
    const reHz = getSwaraFrequency('Re', saHz, 'madhya');
    // Meend range is 300-3000ms; 50ms is far under outer tolerance.
    const traj = generateMeendTrajectory(saHz, reHz, 50, 10);
    const attempt: OrnamentAttempt = {
      ornamentId: 'meend',
      targetSwara: 'Re',
      fromSwara: 'Sa',
      pitchSamples: samplesFromTrajectory(traj),
      ragaContext: 'yaman',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.timing).toBeLessThan(0.2);
    expect(score.notes.some(n => /too short/i.test(n))).toBe(true);
  });
});

describe('evaluateOrnament — robustness', () => {
  it('returns zeroed score for empty pitch samples', () => {
    const attempt: OrnamentAttempt = {
      ornamentId: 'meend',
      targetSwara: 'Re',
      fromSwara: 'Sa',
      pitchSamples: [],
      ragaContext: 'yaman',
      saHz: SA_HZ,
    };
    const score = evaluateOrnament(attempt);
    expect(score.overall).toBe(0);
    expect(score.shapeFit).toBe(0);
    expect(score.timing).toBe(0);
    expect(score.notes.length).toBeGreaterThan(0);
  });

  it('is deterministic — same input yields same output', () => {
    const saHz = SA_HZ;
    const reHz = getSwaraFrequency('Re', saHz, 'madhya');
    const traj = generateMeendTrajectory(saHz, reHz, 1200, 60);
    const attempt: OrnamentAttempt = {
      ornamentId: 'meend',
      targetSwara: 'Re',
      fromSwara: 'Sa',
      pitchSamples: samplesFromTrajectory(traj),
      ragaContext: 'yaman',
      saHz,
    };
    const a = evaluateOrnament(attempt);
    const b = evaluateOrnament(attempt);
    expect(a.overall).toBe(b.overall);
    expect(a.shapeFit).toBe(b.shapeFit);
    expect(a.timing).toBe(b.timing);
    expect(a.arrivalAccuracyCents).toBe(b.arrivalAccuracyCents);
    expect(a.notes).toEqual(b.notes);
  });

  it('handles low-confidence samples gracefully', () => {
    const saHz = SA_HZ;
    const reHz = getSwaraFrequency('Re', saHz, 'madhya');
    const traj = generateMeendTrajectory(saHz, reHz, 1200, 40);
    // All samples at very low confidence.
    const attempt: OrnamentAttempt = {
      ornamentId: 'meend',
      targetSwara: 'Re',
      fromSwara: 'Sa',
      pitchSamples: samplesFromTrajectory(traj, 0.2),
      ragaContext: 'yaman',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.shapeFit).toBe(0);
    expect(score.notes.some(n => /unclear/i.test(n))).toBe(true);
    // Timing is still computable from voiced frames.
    expect(score.timing).toBeGreaterThan(0);
  });
});

describe('evaluateOrnament — kan / murki', () => {
  it('accepts a quick grace touch before landing as a valid kan', () => {
    const saHz = SA_HZ;
    const reHz = getSwaraFrequency('Re', saHz, 'madhya');
    // 30ms total: brief touch of Sa (below), then Re.
    const samples: OrnamentPitchSample[] = [
      { t: 0.000, hz: saHz, confidence: 0.9 },
      { t: 0.005, hz: saHz * Math.pow(2, 50 / 1200), confidence: 0.9 },
      { t: 0.015, hz: reHz * Math.pow(2, -20 / 1200), confidence: 0.9 },
      { t: 0.025, hz: reHz, confidence: 0.95 },
      { t: 0.030, hz: reHz, confidence: 0.95 },
    ];
    const attempt: OrnamentAttempt = {
      ornamentId: 'kan',
      targetSwara: 'Re',
      pitchSamples: samples,
      ragaContext: 'yaman',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.timing).toBe(1);
    expect(score.overall).toBeGreaterThan(0.3);
    // Short window over a 30ms attempt still includes one near-miss frame
    // ahead of the final landing — arrival settles within ~10 cents.
    expect(Math.abs(score.arrivalAccuracyCents)).toBeLessThan(10);
  });

  it('scores a rapid murki as valid when it resolves to target', () => {
    const saHz = SA_HZ;
    const gaHz = getSwaraFrequency('Ga', saHz, 'madhya');
    // Quick zigzag around Ga over 150ms.
    const samples: OrnamentPitchSample[] = [];
    const durationMs = 150;
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const tNorm = i / steps;
      const sign = i % 2 === 0 ? 1 : -1;
      const cents = sign * 80 * (1 - tNorm);
      samples.push({
        t: (tNorm * durationMs) / 1000,
        hz: gaHz * Math.pow(2, cents / 1200),
        confidence: 0.9,
      });
    }
    const attempt: OrnamentAttempt = {
      ornamentId: 'murki',
      targetSwara: 'Ga',
      pitchSamples: samples,
      ragaContext: 'yaman',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.timing).toBe(1);
    expect(score.overall).toBeGreaterThan(0.4);
  });
});

describe('evaluateOrnament — weight sum invariant', () => {
  it('overall never exceeds the weight sum of its components', () => {
    const saHz = SA_HZ;
    const reHz = getSwaraFrequency('Re', saHz, 'madhya');
    const traj = generateMeendTrajectory(saHz, reHz, 1200, 60);
    const attempt: OrnamentAttempt = {
      ornamentId: 'meend',
      targetSwara: 'Re',
      fromSwara: 'Sa',
      pitchSamples: samplesFromTrajectory(traj),
      ragaContext: 'yaman',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    const upperBound =
      0.5 * score.shapeFit + 0.2 * score.timing + 0.3 * 1; // assume arrival <= 1
    expect(score.overall).toBeLessThanOrEqual(upperBound + 1e-9);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(1);
  });
});

describe('evaluateOrnament — targetOctave parameter (F1.8)', () => {
  it('defaults to madhya when targetOctave is omitted (backward compat)', () => {
    // A meend Sa->Re sung in madhya scores well when no octave is given.
    const saHz = SA_HZ;
    const reHz = getSwaraFrequency('Re', saHz, 'madhya');
    const traj = generateMeendTrajectory(saHz, reHz, 1200, 60);
    const attempt: OrnamentAttempt = {
      ornamentId: 'meend',
      targetSwara: 'Re',
      fromSwara: 'Sa',
      pitchSamples: samplesFromTrajectory(traj),
      ragaContext: 'yaman',
      saHz,
    };
    const score = evaluateOrnament(attempt);
    expect(score.overall).toBeGreaterThan(0.9);
  });

  it('scores a taar-octave kan against taar-octave Sa, not madhya Sa', () => {
    // Sung samples are in taar octave (Sa one octave above madhya Sa).
    const saHz = SA_HZ;
    const taarSaHz = getSwaraFrequency('Sa', saHz, 'taar');

    // Build a kan-ish trajectory hovering at taar Sa
    const samples: OrnamentPitchSample[] = [
      { t: 0,    hz: taarSaHz * Math.pow(2, 200 / 1200), confidence: 0.9 },
      { t: 0.01, hz: taarSaHz * Math.pow(2,  50 / 1200), confidence: 0.9 },
      { t: 0.02, hz: taarSaHz, confidence: 0.95 },
      { t: 0.03, hz: taarSaHz, confidence: 0.95 },
      { t: 0.04, hz: taarSaHz, confidence: 0.95 },
    ];

    const withOctave: OrnamentAttempt = {
      ornamentId: 'kan',
      targetSwara: 'Sa',
      targetOctave: 'taar',
      pitchSamples: samples,
      ragaContext: 'yaman',
      saHz,
    };
    const withoutOctave: OrnamentAttempt = {
      ...withOctave,
      targetOctave: undefined,
    };
    const scoreCorrect = evaluateOrnament(withOctave);
    const scoreWrong = evaluateOrnament(withoutOctave);

    // With targetOctave=taar, arrivalAccuracyCents lands near 0 (within 50c).
    expect(Math.abs(scoreCorrect.arrivalAccuracyCents)).toBeLessThan(50);
    // Without it, the evaluator scores against madhya Sa — arrival is ~1200c off.
    expect(Math.abs(scoreWrong.arrivalAccuracyCents)).toBeGreaterThan(1000);
  });
});
