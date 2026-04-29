/**
 * pipeline.test.ts — VoicePipeline runtime tuning
 *
 * These tests cover the pure-state methods of VoicePipeline that do not
 * require an AudioContext: constructor defaults, setClarityThreshold
 * clamping, getClarityThreshold reflection, and updateSa/updateRaga/
 * updateLevel mutations.
 *
 * Rationale: the Sa-detection auto-relaxation logic in lesson-audio.ts
 * depends on setClarityThreshold and getClarityThreshold being a live,
 * clamped pair. Without tests, a future refactor could silently break
 * the auto-relaxation that keeps real-world singing voices from stalling
 * the Sa-detection phase.
 *
 * @module engine/voice/pipeline.test
 */

import { describe, it, expect, vi } from 'vitest';
import { VoicePipeline, median3, isOctaveError } from './pipeline';

describe('VoicePipeline — clarity threshold runtime tuning', () => {
  it('defaults clarityThreshold to 0.80 when not provided', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    expect(pipeline.getClarityThreshold()).toBe(0.80);
  });

  it('honors the clarityThreshold passed in config', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      clarityThreshold: 0.55,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    expect(pipeline.getClarityThreshold()).toBe(0.55);
  });

  it('setClarityThreshold updates the live value (supports progressive relaxation)', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      clarityThreshold: 0.55,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    pipeline.setClarityThreshold(0.50);
    expect(pipeline.getClarityThreshold()).toBe(0.50);
    pipeline.setClarityThreshold(0.45);
    expect(pipeline.getClarityThreshold()).toBe(0.45);
    pipeline.setClarityThreshold(0.40);
    expect(pipeline.getClarityThreshold()).toBe(0.40);
  });

  it('setClarityThreshold clamps negative values to 0', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    pipeline.setClarityThreshold(-0.5);
    expect(pipeline.getClarityThreshold()).toBe(0);
  });

  it('setClarityThreshold clamps values > 1 to 1', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    pipeline.setClarityThreshold(1.5);
    expect(pipeline.getClarityThreshold()).toBe(1);
  });

  it('auto-relaxation sequence: 0.55 → 0.40 in 3 steps stays within the expected floor', () => {
    // Mirrors the lesson-audio auto-relax logic: start at 0.55, step by 0.05
    // every tick, never below 0.40.
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      clarityThreshold: 0.55,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    const FLOOR = 0.40;
    const STEP = 0.05;

    for (let i = 0; i < 10; i++) {
      const current = pipeline.getClarityThreshold();
      const next = Math.max(FLOOR, current - STEP);
      pipeline.setClarityThreshold(next);
    }
    // After many relaxations, we must be at the floor — never below.
    expect(pipeline.getClarityThreshold()).toBeCloseTo(FLOOR, 5);
    expect(pipeline.getClarityThreshold()).toBeGreaterThanOrEqual(FLOOR);
  });

  it('isRunning() is false before start() — pure state accessor', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    expect(pipeline.isRunning()).toBe(false);
  });

  it('updateSa rejects non-positive frequencies', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    expect(() => pipeline.updateSa(0)).toThrow(RangeError);
    expect(() => pipeline.updateSa(-100)).toThrow(RangeError);
  });

  it('updateSa accepts positive frequencies', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    // Should not throw
    pipeline.updateSa(220);
    pipeline.updateSa(440);
  });
});

describe('median3 — 3-frame median pitch smoother', () => {
  it('returns the middle value when input is sorted', () => {
    expect(median3(1, 2, 3)).toBe(2);
  });

  it('returns the middle value regardless of input order', () => {
    // All 6 permutations of {10, 20, 30}
    expect(median3(10, 20, 30)).toBe(20);
    expect(median3(10, 30, 20)).toBe(20);
    expect(median3(20, 10, 30)).toBe(20);
    expect(median3(20, 30, 10)).toBe(20);
    expect(median3(30, 10, 20)).toBe(20);
    expect(median3(30, 20, 10)).toBe(20);
  });

  it('suppresses single-frame outliers — vibrato peak', () => {
    // Steady 261 Hz sample with one frame jumping to 350 Hz (vibrato peak)
    // The median of the 3-frame window pulls the spike back down.
    expect(median3(261, 350, 261)).toBe(261);
    expect(median3(350, 261, 261)).toBe(261);
    expect(median3(261, 261, 350)).toBe(261);
  });

  it('suppresses detector glitches — single dropped octave', () => {
    // 440Hz steady, one frame reads 220 (octave error). Median wins.
    expect(median3(440, 220, 440)).toBe(440);
  });

  it('handles equal values correctly', () => {
    expect(median3(5, 5, 5)).toBe(5);
    expect(median3(5, 5, 10)).toBe(5);
    expect(median3(10, 5, 5)).toBe(5);
  });

  it('preserves real pitch movement (no over-smoothing)', () => {
    // Genuine ascending slide: 200 -> 220 -> 240 should yield the middle 220.
    expect(median3(200, 220, 240)).toBe(220);
  });
});

describe('isOctaveError — McLeod octave-error rejector', () => {
  it('returns false when history is empty', () => {
    expect(isOctaveError(440, [], 0.6)).toBe(false);
  });

  it('returns false for a candidate within the median', () => {
    const history = [260, 261, 262, 261, 260];
    expect(isOctaveError(263, history, 0.6)).toBe(false);
  });

  it('flags an octave-up jump (Pitchy classic error)', () => {
    const history = [260, 261, 262, 261, 260];
    // 522Hz is one octave above ~261 → distance = 1.0 octaves > 0.6
    expect(isOctaveError(522, history, 0.6)).toBe(true);
  });

  it('flags an octave-down jump', () => {
    const history = [520, 522, 521, 519, 520];
    // 261Hz is one octave below ~520
    expect(isOctaveError(261, history, 0.6)).toBe(true);
  });

  it('does NOT flag a perfect-fifth movement (~7 semitones)', () => {
    // From 261 to 392 (perfect fifth) is ~0.585 octaves — just inside
    // the 0.6 threshold. Singers move across this all the time.
    const history = [261, 261, 262, 260, 261];
    expect(isOctaveError(392, history, 0.6)).toBe(false);
  });

  it('returns false for non-positive candidates', () => {
    const history = [261, 261, 261, 261, 261];
    expect(isOctaveError(0, history, 0.6)).toBe(false);
    expect(isOctaveError(-100, history, 0.6)).toBe(false);
  });
});

describe('VoicePipeline — pakad cooldown is per-phrase', () => {
  it('lastPakadTime is a Map (keyed by pakad swara sequence)', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    // Access via reflection to confirm structural change. Distinct pakads
    // hit different keys, so they can fire back-to-back; the same pakad
    // re-fires only after PAKAD_COOLDOWN_MS.
    const internal = pipeline as unknown as { lastPakadTime: Map<string, number> };
    expect(internal.lastPakadTime).toBeInstanceOf(Map);
    expect(internal.lastPakadTime.size).toBe(0);
  });
});

describe('VoicePipeline — getPitchHistory returns chronological snapshot', () => {
  it('returns empty array before any pitch has been emitted', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    expect(pipeline.getPitchHistory()).toEqual([]);
  });

  it('getPitchHistory returns a fresh copy each call (mutation safety)', () => {
    const pipeline = new VoicePipeline({
      sa_hz: 261.63,
      onPitch: vi.fn(),
      onSilence: vi.fn(),
    });
    const a = pipeline.getPitchHistory();
    const b = pipeline.getPitchHistory();
    // Structural equality but distinct array instances — caller-mutation safe.
    expect(a).not.toBe(b);
  });
});
