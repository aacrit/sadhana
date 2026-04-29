import { describe, it, expect } from 'vitest';
import { detectModulation } from './modulation';

const SA = 261.63;
// Just-intonation freqs at C4 = 261.63
// Ma  (4/3 of Sa) = 348.83
// Ma_t (45/32 of Sa) = 367.92

describe('detectModulation', () => {
  it('returns null transition for empty history', () => {
    const r = detectModulation([], { transitionSwara: 'Ma_t' as const, saHz: SA });
    expect(r.transitionAt).toBeNull();
  });

  it('detects sustained Ma_t after a Yaman phrase', () => {
    const history: [number, number][] = [
      [0, 261.63],   // Sa
      [100, 261.63],
      [200, 367.92], // Ma_t — start
      [300, 367.92],
      [400, 367.92],
      [500, 367.92], // sustained 300ms ≥ default 250ms
    ];
    const r = detectModulation(history, {
      transitionSwara: 'Ma_t' as const,
      saHz: SA,
      minDurationMs: 250,
    });
    expect(r.transitionAt).toBe(200);
    expect(r.samples).toBeGreaterThan(2);
  });

  it('does not detect a fleeting touch shorter than minDurationMs', () => {
    const history: [number, number][] = [
      [0, 261.63],
      [100, 367.92],   // Ma_t for 100ms only
      [200, 261.63],
      [300, 261.63],
    ];
    const r = detectModulation(history, {
      transitionSwara: 'Ma_t' as const,
      saHz: SA,
      minDurationMs: 250,
    });
    expect(r.transitionAt).toBeNull();
  });

  it('respects toleranceCents', () => {
    // Slightly flat Ma_t — still within ±30 cents
    const slightlyFlat = 367.92 * Math.pow(2, -20 / 1200);
    const history: [number, number][] = [
      [0, slightlyFlat],
      [100, slightlyFlat],
      [200, slightlyFlat],
      [300, slightlyFlat],
    ];
    const r = detectModulation(history, {
      transitionSwara: 'Ma_t' as const,
      saHz: SA,
      toleranceCents: 30,
      minDurationMs: 200,
    });
    expect(r.transitionAt).toBe(0);
  });

  it('rejects pitches outside toleranceCents', () => {
    // Ma_t -50 cents = ~357 Hz — outside default ±30
    const outOfRange = 367.92 * Math.pow(2, -50 / 1200);
    const history: [number, number][] = [
      [0, outOfRange],
      [100, outOfRange],
      [200, outOfRange],
      [300, outOfRange],
    ];
    const r = detectModulation(history, {
      transitionSwara: 'Ma_t' as const,
      saHz: SA,
      toleranceCents: 30,
      minDurationMs: 200,
    });
    expect(r.transitionAt).toBeNull();
  });
});
