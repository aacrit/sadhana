import { describe, it, expect } from 'vitest';
import {
  deriveLevel,
  earnedGates,
  pendingGates,
  LEVEL_GATES,
  type ProgressionEvent,
} from './level-gates';

const u = 'user-1';

describe('deriveLevel — Shishya defaults', () => {
  it('returns Shishya for empty event log', () => {
    expect(deriveLevel([])).toBe('Shishya');
  });

  it('still Shishya with only sa_detected event (since shishya_first_sa unlocks Shishya)', () => {
    const events: ProgressionEvent[] = [
      { id: 'sa_detected', userId: u, t: 1 },
    ];
    expect(deriveLevel(events)).toBe('Shishya');
  });
});

describe('deriveLevel — Sadhaka', () => {
  it('promotes to Sadhaka when pakad_passed in Bhairav across 3 sessions', () => {
    const events: ProgressionEvent[] = [
      { id: 'pakad_passed', userId: u, sessionId: 's1', ragaId: 'bhairav', t: 1, value: 18 },
      { id: 'pakad_passed', userId: u, sessionId: 's2', ragaId: 'bhairav', t: 2, value: 15 },
      { id: 'pakad_passed', userId: u, sessionId: 's3', ragaId: 'bhairav', t: 3, value: 19 },
    ];
    expect(deriveLevel(events)).toBe('Sadhaka');
  });

  it('does not promote on 2 sessions only', () => {
    const events: ProgressionEvent[] = [
      { id: 'pakad_passed', userId: u, sessionId: 's1', ragaId: 'bhairav', t: 1, value: 18 },
      { id: 'pakad_passed', userId: u, sessionId: 's2', ragaId: 'bhairav', t: 2, value: 15 },
    ];
    expect(deriveLevel(events)).toBe('Shishya');
  });

  it('does not promote on out-of-range cents', () => {
    const events: ProgressionEvent[] = [
      { id: 'pakad_passed', userId: u, sessionId: 's1', ragaId: 'bhairav', t: 1, value: 25 },
      { id: 'pakad_passed', userId: u, sessionId: 's2', ragaId: 'bhairav', t: 2, value: 30 },
      { id: 'pakad_passed', userId: u, sessionId: 's3', ragaId: 'bhairav', t: 3, value: 35 },
    ];
    expect(deriveLevel(events)).toBe('Shishya');
  });

  it('alternative aroha-mastery path also reaches Sadhaka', () => {
    const events: ProgressionEvent[] = [
      { id: 'aroha_passed', userId: u, ragaId: 'bhoopali', t: 1, value: 0.8 },
      { id: 'aroha_passed', userId: u, ragaId: 'yaman', t: 2, value: 0.78 },
      { id: 'aroha_passed', userId: u, ragaId: 'bhairav', t: 3, value: 0.76 },
    ];
    expect(deriveLevel(events)).toBe('Sadhaka');
  });
});

describe('deriveLevel — Varistha', () => {
  it('promotes when both ornament gates fire', () => {
    const events: ProgressionEvent[] = [
      {
        id: 'ornament_score',
        userId: u,
        ragaId: 'bhairav',
        t: 1,
        value: 0.75,
        metadata: { ornamentId: 'andolan' },
      },
      {
        id: 'ornament_score',
        userId: u,
        ragaId: 'bhoopali',
        t: 2,
        value: 0.72,
        metadata: { ornamentId: 'meend' },
      },
    ];
    expect(deriveLevel(events)).toBe('Varistha');
  });

  it('modulation identification alone unlocks Varistha', () => {
    const events: ProgressionEvent[] = [
      {
        id: 'modulation_identified',
        userId: u,
        t: 1,
        metadata: { from: 'yaman', to: 'yaman_kalyan' },
      },
    ];
    expect(deriveLevel(events)).toBe('Varistha');
  });
});

describe('deriveLevel — Guru', () => {
  it('promotes on a full rendering ≥ 0.8', () => {
    const events: ProgressionEvent[] = [
      { id: 'rendering_complete', userId: u, t: 1, value: 0.85 },
    ];
    expect(deriveLevel(events)).toBe('Guru');
  });

  it('does not promote at 0.79', () => {
    const events: ProgressionEvent[] = [
      { id: 'rendering_complete', userId: u, t: 1, value: 0.79 },
    ];
    expect(deriveLevel(events)).toBe('Shishya');
  });
});

describe('earnedGates / pendingGates', () => {
  it('partitions gates correctly', () => {
    const events: ProgressionEvent[] = [
      { id: 'sa_detected', userId: u, t: 1 },
      { id: 'pakad_passed', userId: u, sessionId: 's1', ragaId: 'bhairav', t: 2, value: 18 },
      { id: 'pakad_passed', userId: u, sessionId: 's2', ragaId: 'bhairav', t: 3, value: 15 },
      { id: 'pakad_passed', userId: u, sessionId: 's3', ragaId: 'bhairav', t: 4, value: 19 },
    ];
    const earned = earnedGates(events);
    expect(earned.has('shishya_first_sa')).toBe(true);
    expect(earned.has('sadhaka_pakad_mastery')).toBe(true);
    expect(earned.has('guru_full_rendering')).toBe(false);

    const pending = pendingGates(events);
    expect(pending.length + earned.size).toBe(LEVEL_GATES.length);
  });
});
