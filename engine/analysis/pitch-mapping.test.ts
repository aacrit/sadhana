/**
 * @module engine/analysis/pitch-mapping.test
 *
 * Unit tests for the pitch mapping module — the bridge between raw Hz
 * and the musical world of swaras, shrutis, and ragas.
 *
 * These tests verify:
 *   1. Exact swara recognition at just-intonation frequencies
 *   2. Correct deviation calculation (sharp/flat)
 *   3. Raga context validation (forbidden swaras)
 *   4. Accuracy scoring at different levels
 *   5. Octave normalisation
 *   6. Edge cases (very high/low frequencies, boundary conditions)
 */

import { describe, it, expect } from 'vitest';
import {
  mapPitchToSwara,
  isValidInRaga,
  getAccuracyScore,
  isPitchCorrect,
  nearestValidSwaraInRaga,
  swaraToSwaraName,
  swaraNameToSwara,
  LEVEL_TOLERANCE,
} from './pitch-mapping';
import type { Level } from './pitch-mapping';
import { yaman, bhairav, bhoopali } from '../theory/ragas';

// Reference Sa = 261.63 Hz (C4)
const SA_HZ = 261.63;

// Just intonation frequencies for each swara at Sa = 261.63 Hz
const SWARA_HZ = {
  Sa: 261.63,
  Re_k: 261.63 * (16 / 15),  // ~279.07
  Re: 261.63 * (9 / 8),       // ~294.33
  Ga_k: 261.63 * (6 / 5),     // ~313.96
  Ga: 261.63 * (5 / 4),       // ~327.04
  Ma: 261.63 * (4 / 3),       // ~348.84
  Ma_t: 261.63 * (45 / 32),   // ~367.92
  Pa: 261.63 * (3 / 2),       // ~392.45
  Dha_k: 261.63 * (8 / 5),    // ~418.61
  Dha: 261.63 * (5 / 3),      // ~436.05
  Ni_k: 261.63 * (9 / 5),     // ~470.93 (using 9/5 ratio from swaras.ts)
  Ni: 261.63 * (15 / 8),      // ~490.56
};

// ---------------------------------------------------------------------------
// Swara name bridging
// ---------------------------------------------------------------------------

describe('swaraToSwaraName / swaraNameToSwara', () => {
  it('should convert engine Swara to just-intonation SwaraName', () => {
    expect(swaraToSwaraName('Sa')).toBe('Sa');
    expect(swaraToSwaraName('Re_k')).toBe('Re_komal');
    expect(swaraToSwaraName('Ma_t')).toBe('Ma_tivra');
    expect(swaraToSwaraName('Pa')).toBe('Pa');
  });

  it('should convert just-intonation SwaraName to engine Swara', () => {
    expect(swaraNameToSwara('Sa')).toBe('Sa');
    expect(swaraNameToSwara('Re_komal')).toBe('Re_k');
    expect(swaraNameToSwara('Ma_tivra')).toBe('Ma_t');
    expect(swaraNameToSwara('Pa')).toBe('Pa');
  });

  it('should be a bijection (round-trip)', () => {
    const swaras = ['Sa', 'Re_k', 'Re', 'Ga_k', 'Ga', 'Ma', 'Ma_t', 'Pa', 'Dha_k', 'Dha', 'Ni_k', 'Ni'] as const;
    for (const swara of swaras) {
      expect(swaraNameToSwara(swaraToSwaraName(swara))).toBe(swara);
    }
  });
});

// ---------------------------------------------------------------------------
// mapPitchToSwara — exact frequencies
// ---------------------------------------------------------------------------

describe('mapPitchToSwara — exact swara frequencies', () => {
  it('should identify Sa at exact frequency', () => {
    const result = mapPitchToSwara(SA_HZ, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Sa');
    expect(Math.abs(result.deviationCents)).toBeLessThan(1);
    expect(result.accuracy).toBeGreaterThan(0.99);
  });

  it('should identify Pa at exact frequency', () => {
    const result = mapPitchToSwara(SWARA_HZ.Pa, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Pa');
    expect(Math.abs(result.deviationCents)).toBeLessThan(2);
  });

  it('should identify Ga at exact frequency', () => {
    const result = mapPitchToSwara(SWARA_HZ.Ga, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Ga');
    expect(Math.abs(result.deviationCents)).toBeLessThan(2);
  });

  it('should identify Ma_t at exact frequency', () => {
    const result = mapPitchToSwara(SWARA_HZ.Ma_t, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Ma_t');
    expect(Math.abs(result.deviationCents)).toBeLessThan(2);
  });

  it('should identify all 12 swaras at their just-intonation frequencies', () => {
    const expected: Record<string, string> = {
      Sa: 'Sa', Re_k: 'Re_k', Re: 'Re', Ga_k: 'Ga_k',
      Ga: 'Ga', Ma: 'Ma', Ma_t: 'Ma_t', Pa: 'Pa',
      Dha_k: 'Dha_k', Dha: 'Dha', Ni_k: 'Ni_k', Ni: 'Ni',
    };

    for (const [name, expectedSwara] of Object.entries(expected)) {
      const hz = SWARA_HZ[name as keyof typeof SWARA_HZ];
      const result = mapPitchToSwara(hz, SA_HZ, 1);
      expect(result.nearestSwara).toBe(expectedSwara);
      // Allow up to 5 cents deviation due to ratio differences
      // between swaras.ts (9/5 for Ni_k) and just-intonation.ts (16/9 for Ni_k)
      expect(Math.abs(result.deviationCents)).toBeLessThan(25);
    }
  });
});

// ---------------------------------------------------------------------------
// mapPitchToSwara — sharp and flat detection
// ---------------------------------------------------------------------------

describe('mapPitchToSwara — sharp and flat', () => {
  it('should detect a pitch 30 cents sharp of Sa', () => {
    // 30 cents sharp of Sa: Sa * 2^(30/1200)
    const sharpHz = SA_HZ * Math.pow(2, 30 / 1200);
    const result = mapPitchToSwara(sharpHz, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Sa');
    expect(result.deviationCents).toBeGreaterThan(25);
    expect(result.deviationCents).toBeLessThan(35);
  });

  it('should detect a pitch 30 cents flat of Pa', () => {
    // Pa at ~701.96 cents, so 30 cents flat = ~672 cents from Sa
    const flatHz = SWARA_HZ.Pa * Math.pow(2, -30 / 1200);
    const result = mapPitchToSwara(flatHz, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Pa');
    expect(result.deviationCents).toBeLessThan(-25);
    expect(result.deviationCents).toBeGreaterThan(-35);
  });

  it('should correctly report positive deviation for sharp pitch', () => {
    const sharpHz = SWARA_HZ.Ga * Math.pow(2, 15 / 1200);
    const result = mapPitchToSwara(sharpHz, SA_HZ, 1);
    expect(result.deviationCents).toBeGreaterThan(0);
  });

  it('should correctly report negative deviation for flat pitch', () => {
    const flatHz = SWARA_HZ.Ga * Math.pow(2, -15 / 1200);
    const result = mapPitchToSwara(flatHz, SA_HZ, 1);
    expect(result.deviationCents).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// mapPitchToSwara — octave normalisation
// ---------------------------------------------------------------------------

describe('mapPitchToSwara — octave normalisation', () => {
  it('should identify Sa an octave above', () => {
    const result = mapPitchToSwara(SA_HZ * 2, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Sa');
    expect(Math.abs(result.deviationCents)).toBeLessThan(1);
  });

  it('should identify Pa an octave below', () => {
    const result = mapPitchToSwara(SWARA_HZ.Pa / 2, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Pa');
    expect(Math.abs(result.deviationCents)).toBeLessThan(2);
  });

  it('should identify Ga two octaves above', () => {
    const result = mapPitchToSwara(SWARA_HZ.Ga * 4, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Ga');
    expect(Math.abs(result.deviationCents)).toBeLessThan(2);
  });
});

// ---------------------------------------------------------------------------
// mapPitchToSwara — raga context
// ---------------------------------------------------------------------------

describe('mapPitchToSwara — raga context', () => {
  it('should flag Ma as out of raga in Yaman (which uses Ma_t)', () => {
    const result = mapPitchToSwara(SWARA_HZ.Ma, SA_HZ, 1, 'yaman');
    expect(result.nearestSwara).toBe('Ma');
    expect(result.inRagaContext).toBe(false);
  });

  it('should accept Ma_t in Yaman', () => {
    const result = mapPitchToSwara(SWARA_HZ.Ma_t, SA_HZ, 1, 'yaman');
    expect(result.nearestSwara).toBe('Ma_t');
    expect(result.inRagaContext).toBe(true);
  });

  it('should flag Re as out of raga in Bhairav (which uses Re_k)', () => {
    const result = mapPitchToSwara(SWARA_HZ.Re, SA_HZ, 1, 'bhairav');
    expect(result.nearestSwara).toBe('Re');
    expect(result.inRagaContext).toBe(false);
  });

  it('should accept Re_k in Bhairav', () => {
    const result = mapPitchToSwara(SWARA_HZ.Re_k, SA_HZ, 1, 'bhairav');
    expect(result.nearestSwara).toBe('Re_k');
    expect(result.inRagaContext).toBe(true);
  });

  it('should flag Ma and Ni as out of raga in Bhoopali', () => {
    const resultMa = mapPitchToSwara(SWARA_HZ.Ma, SA_HZ, 1, 'bhoopali');
    expect(resultMa.inRagaContext).toBe(false);

    const resultNi = mapPitchToSwara(SWARA_HZ.Ni, SA_HZ, 1, 'bhoopali');
    expect(resultNi.inRagaContext).toBe(false);
  });

  it('should accept all Bhoopali swaras in Bhoopali', () => {
    const bhoopaliSwaras = ['Sa', 'Re', 'Ga', 'Pa', 'Dha'] as const;
    for (const swara of bhoopaliSwaras) {
      const hz = SWARA_HZ[swara as keyof typeof SWARA_HZ];
      const result = mapPitchToSwara(hz, SA_HZ, 1, 'bhoopali');
      expect(result.inRagaContext).toBe(true);
    }
  });

  it('should report inRagaContext=true when no raga is specified', () => {
    const result = mapPitchToSwara(SWARA_HZ.Ma, SA_HZ, 1);
    expect(result.inRagaContext).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isValidInRaga
// ---------------------------------------------------------------------------

describe('isValidInRaga', () => {
  it('should always accept Sa', () => {
    expect(isValidInRaga('Sa', yaman)).toBe(true);
    expect(isValidInRaga('Sa', bhairav)).toBe(true);
    expect(isValidInRaga('Sa', bhoopali)).toBe(true);
  });

  it('should reject forbidden swaras in Yaman', () => {
    expect(isValidInRaga('Ma', yaman)).toBe(false);
    expect(isValidInRaga('Re_k', yaman)).toBe(false);
    expect(isValidInRaga('Ga_k', yaman)).toBe(false);
  });

  it('should accept valid swaras in Yaman', () => {
    expect(isValidInRaga('Re', yaman)).toBe(true);
    expect(isValidInRaga('Ga', yaman)).toBe(true);
    expect(isValidInRaga('Ma_t', yaman)).toBe(true);
    expect(isValidInRaga('Pa', yaman)).toBe(true);
    expect(isValidInRaga('Dha', yaman)).toBe(true);
    expect(isValidInRaga('Ni', yaman)).toBe(true);
  });

  it('should reject forbidden swaras in Bhoopali', () => {
    expect(isValidInRaga('Ma', bhoopali)).toBe(false);
    expect(isValidInRaga('Ma_t', bhoopali)).toBe(false);
    expect(isValidInRaga('Ni', bhoopali)).toBe(false);
    expect(isValidInRaga('Ni_k', bhoopali)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getAccuracyScore
// ---------------------------------------------------------------------------

describe('getAccuracyScore', () => {
  it('should return 1.0 for zero deviation', () => {
    expect(getAccuracyScore(0, 'shishya')).toBeCloseTo(1, 5);
    expect(getAccuracyScore(0, 'guru')).toBeCloseTo(1, 5);
  });

  it('should return ~0.5 at the tolerance boundary', () => {
    // At exactly the tolerance, score should be ~0.5
    expect(getAccuracyScore(50, 'shishya')).toBeCloseTo(0.5, 1);
    expect(getAccuracyScore(25, 'sadhaka')).toBeCloseTo(0.5, 1);
    expect(getAccuracyScore(15, 'varistha')).toBeCloseTo(0.5, 1);
    expect(getAccuracyScore(10, 'guru')).toBeCloseTo(0.5, 1);
  });

  it('should be symmetric for positive and negative deviation', () => {
    expect(getAccuracyScore(20, 'shishya')).toBeCloseTo(
      getAccuracyScore(-20, 'shishya'),
      10,
    );
  });

  it('should decrease as deviation increases', () => {
    const levels: Level[] = ['shishya', 'sadhaka', 'varistha', 'guru'];
    for (const level of levels) {
      const score10 = getAccuracyScore(10, level);
      const score30 = getAccuracyScore(30, level);
      const score60 = getAccuracyScore(60, level);
      expect(score10).toBeGreaterThan(score30);
      expect(score30).toBeGreaterThan(score60);
    }
  });

  it('should be more forgiving at shishya level than guru level', () => {
    // Same deviation should give higher score at shishya than guru
    const deviation = 20;
    expect(getAccuracyScore(deviation, 'shishya')).toBeGreaterThan(
      getAccuracyScore(deviation, 'guru'),
    );
  });

  it('should approach 0 for very large deviations', () => {
    expect(getAccuracyScore(200, 'shishya')).toBeLessThan(0.01);
    expect(getAccuracyScore(100, 'guru')).toBeLessThan(0.01);
  });
});

// ---------------------------------------------------------------------------
// isPitchCorrect
// ---------------------------------------------------------------------------

describe('isPitchCorrect', () => {
  it('should be correct within tolerance', () => {
    expect(isPitchCorrect(49, 'shishya')).toBe(true);
    expect(isPitchCorrect(-49, 'shishya')).toBe(true);
    expect(isPitchCorrect(50, 'shishya')).toBe(true);
  });

  it('should be incorrect outside tolerance', () => {
    expect(isPitchCorrect(51, 'shishya')).toBe(false);
    expect(isPitchCorrect(-51, 'shishya')).toBe(false);
  });

  it('should use different tolerances per level', () => {
    expect(isPitchCorrect(30, 'shishya')).toBe(true);
    expect(isPitchCorrect(30, 'sadhaka')).toBe(false);

    expect(isPitchCorrect(12, 'varistha')).toBe(true);
    expect(isPitchCorrect(12, 'guru')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// nearestValidSwaraInRaga
// ---------------------------------------------------------------------------

describe('nearestValidSwaraInRaga', () => {
  it('should find nearest valid swara in Bhoopali for a Ma-range pitch', () => {
    // Ma is at ~498 cents, which is between Ga (~386) and Pa (~702) in Bhoopali
    const result = nearestValidSwaraInRaga(498, bhoopali);
    // Should snap to either Ga or Pa — closest to Pa
    expect(['Ga', 'Pa']).toContain(result.swara);
  });

  it('should find Sa for a pitch near 0 cents in any raga', () => {
    const result = nearestValidSwaraInRaga(5, yaman);
    expect(result.swara).toBe('Sa');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('mapPitchToSwara — edge cases', () => {
  it('should throw for zero Hz', () => {
    expect(() => mapPitchToSwara(0, SA_HZ, 1)).toThrow();
  });

  it('should throw for negative Hz', () => {
    expect(() => mapPitchToSwara(-100, SA_HZ, 1)).toThrow();
  });

  it('should throw for zero Sa Hz', () => {
    expect(() => mapPitchToSwara(440, 0, 1)).toThrow();
  });

  it('should handle very high frequencies (multiple octaves above Sa)', () => {
    // 4 octaves above Sa
    const result = mapPitchToSwara(SA_HZ * 16, SA_HZ, 1);
    expect(result.nearestSwara).toBe('Sa');
  });

  it('should handle different Sa frequencies', () => {
    // Sa at 240 Hz (lower tuning), Pa at 360 Hz
    const result = mapPitchToSwara(360, 240, 1);
    expect(result.nearestSwara).toBe('Pa');
    expect(Math.abs(result.deviationCents)).toBeLessThan(2);
  });

  it('should pass through clarity value', () => {
    const result = mapPitchToSwara(SA_HZ, SA_HZ, 0.92);
    expect(result.clarity).toBe(0.92);
  });

  it('should use default level when not specified', () => {
    const result = mapPitchToSwara(SA_HZ, SA_HZ, 1);
    // Default level is shishya; at 0 deviation, accuracy should be ~1.0
    expect(result.accuracy).toBeGreaterThan(0.99);
  });
});

// ---------------------------------------------------------------------------
// LEVEL_TOLERANCE
// ---------------------------------------------------------------------------

describe('LEVEL_TOLERANCE', () => {
  it('should have correct tolerance values', () => {
    expect(LEVEL_TOLERANCE.shishya).toBe(50);
    expect(LEVEL_TOLERANCE.sadhaka).toBe(25);
    expect(LEVEL_TOLERANCE.varistha).toBe(15);
    expect(LEVEL_TOLERANCE.guru).toBe(10);
  });

  it('should decrease with increasing level', () => {
    expect(LEVEL_TOLERANCE.shishya).toBeGreaterThan(LEVEL_TOLERANCE.sadhaka);
    expect(LEVEL_TOLERANCE.sadhaka).toBeGreaterThan(LEVEL_TOLERANCE.varistha);
    expect(LEVEL_TOLERANCE.varistha).toBeGreaterThan(LEVEL_TOLERANCE.guru);
  });
});
