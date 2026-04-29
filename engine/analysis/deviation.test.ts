import { describe, it, expect } from 'vitest';
import { analyzeDeviation } from './deviation';

const SA = 261.63;
// Re shuddha (9/8 of Sa) = 294.33
// Ma_t (45/32 of Sa) = 367.92

describe('analyzeDeviation', () => {
  it('returns score 1 when no deviations occur', () => {
    const history: [number, number][] = [[0, SA], [100, SA], [200, SA]];
    const r = analyzeDeviation(history, {
      saHz: SA,
      allowed: [{ swara: 'Re' as const, role: 'passing', maxDurationMs: 500 }],
    });
    expect(r.score).toBe(1);
    expect(r.occurrences.length).toBe(0);
  });

  it('passes a fleeting touch within max duration', () => {
    const history: [number, number][] = [
      [0, SA],
      [100, 294.33], // Re — start of touch
      [200, 294.33], // 200ms total — within 500ms limit
      [300, SA],
    ];
    const r = analyzeDeviation(history, {
      saHz: SA,
      allowed: [{ swara: 'Re' as const, role: 'passing', maxDurationMs: 500 }],
    });
    expect(r.occurrences.length).toBe(1);
    expect(r.occurrences[0]!.verdict).toBe('pass');
    expect(r.occurrences[0]!.durationMs).toBeLessThanOrEqual(500);
  });

  it('fails a held touch beyond max duration', () => {
    const history: [number, number][] = [
      [0, 294.33],
      [100, 294.33],
      [200, 294.33],
      [300, 294.33],
      [400, 294.33],
      [500, 294.33],
      [600, 294.33], // 600ms held — fails 500ms threshold
    ];
    const r = analyzeDeviation(history, {
      saHz: SA,
      allowed: [{ swara: 'Re' as const, role: 'passing', maxDurationMs: 500 }],
    });
    expect(r.occurrences.length).toBe(1);
    expect(r.occurrences[0]!.verdict).toBe('fail');
    expect(r.occurrences[0]!.durationMs).toBeGreaterThan(500);
  });

  it('handles multiple separated occurrences', () => {
    const history: [number, number][] = [
      [0, SA],
      // Touch 1: 100..200ms = 100ms duration (above MIN_OCCURRENCE_MS = 50ms)
      [100, 294.33],
      [150, 294.33],
      [200, 294.33],
      [250, SA],
      // Touch 2: 350..450ms = 100ms
      [350, 294.33],
      [400, 294.33],
      [450, 294.33],
      [500, SA],
    ];
    const r = analyzeDeviation(history, {
      saHz: SA,
      allowed: [{ swara: 'Re' as const, role: 'passing', maxDurationMs: 500 }],
    });
    expect(r.occurrences.length).toBe(2);
    expect(r.score).toBe(1);
  });

  it('mixes pass and fail across multiple deviations', () => {
    const history: [number, number][] = [
      [0, SA],
      // First touch — fleeting (pass for max 200ms)
      [100, 367.92],
      [200, 367.92],
      [250, SA],
      // Second touch — held (fails 200ms threshold at 350ms)
      [400, 367.92],
      [500, 367.92],
      [600, 367.92],
      [700, 367.92], // 300ms run
      [800, SA],
    ];
    const r = analyzeDeviation(history, {
      saHz: SA,
      allowed: [{ swara: 'Ma_t' as const, role: 'fleeting', maxDurationMs: 200 }],
    });
    expect(r.occurrences.length).toBe(2);
    expect(r.passes).toBe(1);
    expect(r.fails).toBe(1);
    expect(r.score).toBe(0.5);
  });
});
