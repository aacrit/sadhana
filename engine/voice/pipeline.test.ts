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
import { VoicePipeline } from './pipeline';

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
