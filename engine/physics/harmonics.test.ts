/**
 * harmonics.test.ts — Unit tests for the engine/physics/ layer
 *
 * These tests verify the mathematical correctness of the frequency science
 * that underpins the entire Sadhana engine. If these fail, everything
 * downstream is wrong.
 *
 * @module engine/physics/harmonics.test
 */

import { describe, it, expect } from 'vitest';

import {
  harmonicRatio,
  octaveReducedRatio,
  partialFrequency,
  harmonicSeries,
  overtoneAmplitude,
  tanpuraPartials,
  ratioToCents,
  centsToRatio,
  beatFrequency,
} from './harmonics';

import {
  SHRUTIS,
  PRINCIPAL_SWARAS,
  shrutiToHz,
  swaraToHz,
  centsDeviation,
  nearestShruti,
  nearestSwara,
  getSwaraByName,
  getShrutiByNumber,
  shrutisForSwara,
  frequencyTable,
  type SwaraName,
} from './just-intonation';

import {
  consonanceScore,
  criticalBandRoughness,
  intervalResonance,
  qualitativeConsonance,
  nearestTanpuraBeating,
} from './resonance';

// ---------------------------------------------------------------------------
// Constants for comparison
// ---------------------------------------------------------------------------

/** Tolerance for cents comparisons. 0.5 cents is inaudible. */
const CENTS_TOLERANCE = 0.5;

/** Standard Sa for testing */
const SA_HZ = 261.63;

/**
 * Known correct cents values for all 22 shrutis, computed from their ratios.
 * Source: 1200 * log2(p/q) for each ratio, verified against published tables.
 */
const KNOWN_SHRUTI_CENTS: ReadonlyArray<{ number: number; ratio: string; expectedCents: number }> = [
  { number: 1,  ratio: '1/1',     expectedCents: 0 },
  { number: 2,  ratio: '256/243', expectedCents: 90.225 },
  { number: 3,  ratio: '16/15',   expectedCents: 111.731 },
  { number: 4,  ratio: '10/9',    expectedCents: 182.404 },
  { number: 5,  ratio: '9/8',     expectedCents: 203.910 },
  { number: 6,  ratio: '32/27',   expectedCents: 294.135 },
  { number: 7,  ratio: '6/5',     expectedCents: 315.641 },
  { number: 8,  ratio: '5/4',     expectedCents: 386.314 },
  { number: 9,  ratio: '81/64',   expectedCents: 407.820 },
  { number: 10, ratio: '4/3',     expectedCents: 498.045 },
  { number: 11, ratio: '27/20',   expectedCents: 519.551 },
  { number: 12, ratio: '45/32',   expectedCents: 590.224 },
  { number: 13, ratio: '729/512', expectedCents: 611.730 },
  { number: 14, ratio: '3/2',     expectedCents: 701.955 },
  { number: 15, ratio: '128/81',  expectedCents: 792.180 },
  { number: 16, ratio: '8/5',     expectedCents: 813.686 },
  { number: 17, ratio: '5/3',     expectedCents: 884.359 },
  { number: 18, ratio: '27/16',   expectedCents: 905.865 },
  { number: 19, ratio: '16/9',    expectedCents: 996.090 },
  { number: 20, ratio: '9/5',     expectedCents: 1017.596 },
  { number: 21, ratio: '15/8',    expectedCents: 1088.269 },
  { number: 22, ratio: '243/128', expectedCents: 1109.775 },
];

// ===========================================================================
// harmonics.ts tests
// ===========================================================================

describe('harmonics.ts', () => {
  describe('harmonicRatio', () => {
    it('returns the harmonic number itself (ratio n:1)', () => {
      expect(harmonicRatio(1)).toBe(1);
      expect(harmonicRatio(2)).toBe(2);
      expect(harmonicRatio(3)).toBe(3);
      expect(harmonicRatio(7)).toBe(7);
    });

    it('throws for non-positive or non-integer input', () => {
      expect(() => harmonicRatio(0)).toThrow(RangeError);
      expect(() => harmonicRatio(-1)).toThrow(RangeError);
      expect(() => harmonicRatio(1.5)).toThrow(RangeError);
    });
  });

  describe('octaveReducedRatio', () => {
    it('reduces harmonics into [1, 2)', () => {
      expect(octaveReducedRatio(1)).toBe(1);        // Unison
      expect(octaveReducedRatio(2)).toBe(1);        // Octave → unison
      expect(octaveReducedRatio(3)).toBe(1.5);      // Pa (3:2)
      expect(octaveReducedRatio(4)).toBe(1);        // Double octave → unison
      expect(octaveReducedRatio(5)).toBe(1.25);     // Ga shuddha (5:4)
      expect(octaveReducedRatio(6)).toBe(1.5);      // Pa again
    });
  });

  describe('partialFrequency', () => {
    it('computes correct partial frequencies', () => {
      expect(partialFrequency(100, 1)).toBe(100);
      expect(partialFrequency(100, 2)).toBe(200);
      expect(partialFrequency(100, 3)).toBe(300);
      expect(partialFrequency(SA_HZ, 2)).toBeCloseTo(523.26, 1);
    });

    it('throws for invalid inputs', () => {
      expect(() => partialFrequency(0, 1)).toThrow(RangeError);
      expect(() => partialFrequency(-100, 1)).toThrow(RangeError);
      expect(() => partialFrequency(100, 0)).toThrow(RangeError);
    });
  });

  describe('harmonicSeries', () => {
    it('generates correct series length', () => {
      const series = harmonicSeries(100, 5);
      expect(series).toHaveLength(5);
    });

    it('generates correct frequencies', () => {
      const series = harmonicSeries(100, 4);
      expect(series).toEqual([100, 200, 300, 400]);
    });

    it('fundamental at Sa = 261.63 Hz', () => {
      const series = harmonicSeries(SA_HZ, 3);
      expect(series[0]).toBeCloseTo(261.63, 2);
      expect(series[1]).toBeCloseTo(523.26, 2);    // Octave
      expect(series[2]).toBeCloseTo(784.89, 2);    // Twelfth (octave + fifth)
    });
  });

  describe('ratioToCents', () => {
    it('octave = 2:1 = exactly 1200 cents', () => {
      expect(ratioToCents(2)).toBe(1200);
    });

    it('perfect fifth = 3:2 = ~702 cents', () => {
      const cents = ratioToCents(3 / 2);
      expect(Math.abs(cents - 701.955)).toBeLessThan(CENTS_TOLERANCE);
    });

    it('perfect fourth = 4:3 = ~498 cents', () => {
      const cents = ratioToCents(4 / 3);
      expect(Math.abs(cents - 498.045)).toBeLessThan(CENTS_TOLERANCE);
    });

    it('major third = 5:4 = ~386 cents', () => {
      const cents = ratioToCents(5 / 4);
      expect(Math.abs(cents - 386.314)).toBeLessThan(CENTS_TOLERANCE);
    });

    it('unison = 1:1 = 0 cents', () => {
      expect(ratioToCents(1)).toBe(0);
    });

    it('throws for non-positive ratio', () => {
      expect(() => ratioToCents(0)).toThrow(RangeError);
      expect(() => ratioToCents(-1)).toThrow(RangeError);
    });
  });

  describe('centsToRatio', () => {
    it('is the inverse of ratioToCents', () => {
      const ratios = [1, 1.25, 1.5, 2];
      for (const r of ratios) {
        const cents = ratioToCents(r);
        expect(centsToRatio(cents)).toBeCloseTo(r, 10);
      }
    });

    it('1200 cents = ratio 2', () => {
      expect(centsToRatio(1200)).toBe(2);
    });

    it('0 cents = ratio 1', () => {
      expect(centsToRatio(0)).toBe(1);
    });
  });

  describe('overtoneAmplitude', () => {
    it('fundamental has amplitude 1', () => {
      expect(overtoneAmplitude(1)).toBe(1);
    });

    it('standard model decays as 1/n', () => {
      expect(overtoneAmplitude(2)).toBeCloseTo(0.5, 5);
      expect(overtoneAmplitude(4)).toBeCloseTo(0.25, 5);
      expect(overtoneAmplitude(10)).toBeCloseTo(0.1, 5);
    });

    it('tanpura model has higher partial amplitudes than standard', () => {
      // The jivari effect means partials 2-5 are much stronger on tanpura
      for (let n = 2; n <= 5; n++) {
        const standard = overtoneAmplitude(n);
        const tanpura = overtoneAmplitude(n, { tanpura: true });
        expect(tanpura).toBeGreaterThan(standard);
      }
    });

    it('tanpura fundamental is 1.0', () => {
      expect(overtoneAmplitude(1, { tanpura: true })).toBe(1);
    });

    it('tanpura amplitudes decay monotonically', () => {
      for (let n = 1; n < 10; n++) {
        const current = overtoneAmplitude(n, { tanpura: true });
        const next = overtoneAmplitude(n + 1, { tanpura: true });
        expect(next).toBeLessThanOrEqual(current);
      }
    });
  });

  describe('tanpuraPartials', () => {
    it('returns 4 strings', () => {
      const strings = tanpuraPartials(SA_HZ);
      expect(strings).toHaveLength(4);
    });

    it('each string has 10 partials', () => {
      const strings = tanpuraPartials(SA_HZ);
      for (const s of strings) {
        expect(s.partials).toHaveLength(10);
      }
    });

    it('partial amplitudes decay correctly', () => {
      const strings = tanpuraPartials(SA_HZ);
      for (const s of strings) {
        for (let i = 0; i < s.partials.length - 1; i++) {
          expect(s.partials[i]!.amplitude).toBeGreaterThanOrEqual(
            s.partials[i + 1]!.amplitude,
          );
        }
      }
    });

    it('first string is Pa (3/2 * Sa / 2) by default', () => {
      const strings = tanpuraPartials(SA_HZ);
      expect(strings[0]!.name).toBe('Pa');
      // Pa in lower octave: (3/2) / 2 * Sa = 3/4 * Sa
      expect(strings[0]!.ratio).toBeCloseTo(3 / 4, 5);
    });

    it('first string is Ma when useMa is true', () => {
      const strings = tanpuraPartials(SA_HZ, true);
      expect(strings[0]!.name).toBe('Ma (shuddha)');
      // Ma in lower octave: (4/3) / 2 * Sa = 2/3 * Sa
      expect(strings[0]!.ratio).toBeCloseTo(2 / 3, 5);
    });

    it('second and third strings are Sa at the given frequency', () => {
      const strings = tanpuraPartials(SA_HZ);
      expect(strings[1]!.name).toBe('Sa');
      expect(strings[1]!.partials[0]!.frequency).toBeCloseTo(SA_HZ, 1);
      expect(strings[2]!.name).toBe('Sa');
      expect(strings[2]!.partials[0]!.frequency).toBeCloseTo(SA_HZ, 1);
    });

    it('fourth string is Sa one octave below', () => {
      const strings = tanpuraPartials(SA_HZ);
      expect(strings[3]!.name).toBe('Sa (low)');
      expect(strings[3]!.partials[0]!.frequency).toBeCloseTo(SA_HZ / 2, 1);
    });
  });

  describe('beatFrequency', () => {
    it('identical frequencies have zero beating', () => {
      expect(beatFrequency(440, 440)).toBe(0);
    });

    it('computes correct beat frequency', () => {
      expect(beatFrequency(440, 442)).toBe(2);
      expect(beatFrequency(442, 440)).toBe(2);
    });
  });
});

// ===========================================================================
// just-intonation.ts tests
// ===========================================================================

describe('just-intonation.ts', () => {
  describe('22 shrutis — correct cents values', () => {
    it('has exactly 22 shrutis', () => {
      expect(SHRUTIS).toHaveLength(22);
    });

    it.each(KNOWN_SHRUTI_CENTS)(
      'shruti $number ($ratio) = $expectedCents cents (within ±0.5)',
      ({ number, expectedCents }) => {
        const shruti = SHRUTIS[number - 1]!;
        expect(shruti.number).toBe(number);
        expect(Math.abs(shruti.cents - expectedCents)).toBeLessThan(CENTS_TOLERANCE);
      },
    );

    it('shrutis are in ascending order of cents', () => {
      for (let i = 0; i < SHRUTIS.length - 1; i++) {
        expect(SHRUTIS[i]!.cents).toBeLessThan(SHRUTIS[i + 1]!.cents);
      }
    });

    it('all shruti cents are in [0, 1200)', () => {
      for (const shruti of SHRUTIS) {
        expect(shruti.cents).toBeGreaterThanOrEqual(0);
        expect(shruti.cents).toBeLessThan(1200);
      }
    });
  });

  describe('12 principal swaras', () => {
    it('has exactly 12 swaras', () => {
      expect(PRINCIPAL_SWARAS).toHaveLength(12);
    });

    it('Sa = 1:1 = 0 cents', () => {
      const sa = getSwaraByName('Sa');
      expect(sa.ratio.p).toBe(1);
      expect(sa.ratio.q).toBe(1);
      expect(sa.cents).toBe(0);
    });

    it('Pa = 3:2 = ~702 cents', () => {
      const pa = getSwaraByName('Pa');
      expect(pa.ratio.p).toBe(3);
      expect(pa.ratio.q).toBe(2);
      expect(Math.abs(pa.cents - 701.955)).toBeLessThan(CENTS_TOLERANCE);
    });

    it('all known ratios are correct', () => {
      const expected: Array<[SwaraName, number, number]> = [
        ['Sa', 1, 1],
        ['Re_komal', 16, 15],
        ['Re', 9, 8],
        ['Ga_komal', 6, 5],
        ['Ga', 5, 4],
        ['Ma', 4, 3],
        ['Ma_tivra', 45, 32],
        ['Pa', 3, 2],
        ['Dha_komal', 8, 5],
        ['Dha', 5, 3],
        ['Ni_komal', 16, 9],
        ['Ni', 15, 8],
      ];

      for (const [name, p, q] of expected) {
        const swara = getSwaraByName(name);
        expect(swara.ratio.p).toBe(p);
        expect(swara.ratio.q).toBe(q);
      }
    });

    it('swaras are in ascending order of cents', () => {
      for (let i = 0; i < PRINCIPAL_SWARAS.length - 1; i++) {
        expect(PRINCIPAL_SWARAS[i]!.cents).toBeLessThan(
          PRINCIPAL_SWARAS[i + 1]!.cents,
        );
      }
    });

    it('deviation from equal temperament matches the specification', () => {
      // Verify the deviation column from the acoustics-engineer spec table
      const expectedDeviations: Array<[SwaraName, number]> = [
        ['Sa', 0],
        ['Re_komal', 12],   // +12 cents
        ['Re', 4],           // +4 cents
        ['Ga_komal', 16],   // +16 cents
        ['Ga', -14],         // -14 cents
        ['Ma', -2],          // -2 cents
        ['Ma_tivra', -10],   // -10 cents
        ['Pa', 2],           // +2 cents
        ['Dha_komal', 14],  // +14 cents
        ['Dha', -16],       // -16 cents
        ['Ni_komal', -4],   // -4 cents
        ['Ni', -12],         // -12 cents
      ];

      for (const [name, expectedDev] of expectedDeviations) {
        const swara = getSwaraByName(name);
        expect(Math.abs(swara.deviation - expectedDev)).toBeLessThan(1);
      }
    });
  });

  describe('shrutiToHz', () => {
    it('Sa at 261.63 Hz returns 261.63', () => {
      const sa = SHRUTIS[0]!;
      expect(shrutiToHz(sa, SA_HZ)).toBeCloseTo(SA_HZ, 2);
    });

    it('Pa at 261.63 Hz returns ~392.44 Hz (3/2 * 261.63)', () => {
      const pa = SHRUTIS[13]!; // Shruti 14, index 13
      expect(shrutiToHz(pa, SA_HZ)).toBeCloseTo(SA_HZ * 1.5, 1);
    });
  });

  describe('swaraToHz', () => {
    it('all 12 swaras produce correct frequencies', () => {
      const table: Array<[SwaraName, number]> = [
        ['Sa', SA_HZ * 1],
        ['Re_komal', SA_HZ * 16 / 15],
        ['Re', SA_HZ * 9 / 8],
        ['Ga_komal', SA_HZ * 6 / 5],
        ['Ga', SA_HZ * 5 / 4],
        ['Ma', SA_HZ * 4 / 3],
        ['Ma_tivra', SA_HZ * 45 / 32],
        ['Pa', SA_HZ * 3 / 2],
        ['Dha_komal', SA_HZ * 8 / 5],
        ['Dha', SA_HZ * 5 / 3],
        ['Ni_komal', SA_HZ * 16 / 9],
        ['Ni', SA_HZ * 15 / 8],
      ];

      for (const [name, expected] of table) {
        expect(swaraToHz(name, SA_HZ)).toBeCloseTo(expected, 2);
      }
    });
  });

  describe('centsDeviation', () => {
    it('returns 0 when detected frequency matches target exactly', () => {
      const paHz = SA_HZ * 1.5;
      const paCents = 1200 * Math.log2(1.5);
      expect(centsDeviation(paHz, SA_HZ, paCents)).toBeCloseTo(0, 5);
    });

    it('positive deviation means sharp', () => {
      const slightlySharp = SA_HZ * 1.51; // A bit above Pa
      const paCents = 1200 * Math.log2(1.5);
      expect(centsDeviation(slightlySharp, SA_HZ, paCents)).toBeGreaterThan(0);
    });

    it('negative deviation means flat', () => {
      const slightlyFlat = SA_HZ * 1.49;
      const paCents = 1200 * Math.log2(1.5);
      expect(centsDeviation(slightlyFlat, SA_HZ, paCents)).toBeLessThan(0);
    });
  });

  describe('nearestShruti', () => {
    it('0 cents maps to shruti 1 (Sa)', () => {
      const result = nearestShruti(0);
      expect(result.number).toBe(1);
    });

    it('702 cents maps to shruti 14 (Pa)', () => {
      const result = nearestShruti(702);
      expect(result.number).toBe(14);
    });

    it('500 cents maps to shruti 10 (Ma shuddha)', () => {
      const result = nearestShruti(500);
      expect(result.number).toBe(10);
    });

    it('handles negative cents (wrapping)', () => {
      const result = nearestShruti(-498); // Should wrap to ~702 cents
      expect(result.number).toBe(14); // Pa
    });
  });

  describe('nearestSwara', () => {
    it('0 cents is Sa', () => {
      const result = nearestSwara(0);
      expect(result.swara.name).toBe('Sa');
      expect(result.deviation).toBeCloseTo(0, 5);
    });

    it('700 cents is close to Pa (deviation ~-2)', () => {
      const result = nearestSwara(700);
      expect(result.swara.name).toBe('Pa');
      expect(result.deviation).toBeCloseTo(-1.955, 0);
    });

    it('400 cents is close to Ga (deviation ~+14)', () => {
      const result = nearestSwara(400);
      expect(result.swara.name).toBe('Ga');
    });
  });

  describe('getShrutiByNumber', () => {
    it('returns correct shruti for valid numbers', () => {
      expect(getShrutiByNumber(1).name).toBe('Chandovati');
      expect(getShrutiByNumber(14).name).toBe('Alapini');
      expect(getShrutiByNumber(22).name).toBe('Manda');
    });

    it('throws for invalid numbers', () => {
      expect(() => getShrutiByNumber(0)).toThrow();
      expect(() => getShrutiByNumber(23)).toThrow();
    });
  });

  describe('shrutisForSwara', () => {
    it('Sa maps to 1 shruti (immovable)', () => {
      const shrutis = shrutisForSwara('Sa');
      expect(shrutis).toHaveLength(1);
      expect(shrutis[0]!.number).toBe(1);
    });

    it('Pa maps to 1 shruti (immovable)', () => {
      const shrutis = shrutisForSwara('Pa');
      expect(shrutis).toHaveLength(1);
      expect(shrutis[0]!.number).toBe(14);
    });

    it('Re_komal maps to 2 shrutis', () => {
      const shrutis = shrutisForSwara('Re_komal');
      expect(shrutis).toHaveLength(2);
    });
  });

  describe('frequencyTable', () => {
    it('returns all 12 swaras', () => {
      const table = frequencyTable(SA_HZ);
      expect(table.size).toBe(12);
    });

    it('Sa entry matches Sa frequency', () => {
      const table = frequencyTable(SA_HZ);
      expect(table.get('Sa')).toBeCloseTo(SA_HZ, 2);
    });
  });
});

// ===========================================================================
// resonance.ts tests
// ===========================================================================

describe('resonance.ts', () => {
  describe('consonanceScore', () => {
    it('unison (1:1) is maximally consonant', () => {
      const score = consonanceScore({ p: 1, q: 1 });
      expect(score).toBe(1);
    });

    it('octave (2:1) is very consonant', () => {
      const score = consonanceScore({ p: 2, q: 1 });
      expect(score).toBeGreaterThan(0.4);
    });

    it('fifth (3:2) is more consonant than tritone (45:32)', () => {
      const fifth = consonanceScore({ p: 3, q: 2 });
      const tritone = consonanceScore({ p: 45, q: 32 });
      expect(fifth).toBeGreaterThan(tritone);
    });

    it('consonance decreases with ratio complexity', () => {
      const intervals = [
        { p: 2, q: 1 },   // Octave
        { p: 3, q: 2 },   // Fifth
        { p: 4, q: 3 },   // Fourth
        { p: 5, q: 4 },   // Major third
        { p: 6, q: 5 },   // Minor third
      ];

      for (let i = 0; i < intervals.length - 1; i++) {
        const current = consonanceScore(intervals[i]!);
        const next = consonanceScore(intervals[i + 1]!);
        expect(current).toBeGreaterThan(next);
      }
    });

    it('reduces fractions before scoring (6:4 = 3:2)', () => {
      const a = consonanceScore({ p: 6, q: 4 });
      const b = consonanceScore({ p: 3, q: 2 });
      expect(a).toBeCloseTo(b, 10);
    });
  });

  describe('criticalBandRoughness', () => {
    it('identical frequencies have essentially zero roughness', () => {
      const roughness = criticalBandRoughness(440, 440);
      // Floating-point arithmetic produces a value on the order of 1e-13,
      // which is effectively zero. Using toBeCloseTo with 10 decimal places.
      expect(roughness).toBeCloseTo(0, 10);
    });

    it('frequencies a semitone apart have notable roughness', () => {
      // A4 and Bb4 in equal temperament
      const roughness = criticalBandRoughness(440, 440 * Math.pow(2, 1 / 12));
      expect(roughness).toBeGreaterThan(0);
    });

    it('octave has minimal roughness', () => {
      const roughness = criticalBandRoughness(440, 880);
      expect(roughness).toBeLessThan(0.05);
    });

    it('throws for non-positive frequencies', () => {
      expect(() => criticalBandRoughness(0, 440)).toThrow(RangeError);
      expect(() => criticalBandRoughness(440, -1)).toThrow(RangeError);
    });
  });

  describe('intervalResonance', () => {
    it('returns a complete profile for Pa (702 cents)', () => {
      const profile = intervalResonance(702, SA_HZ);
      expect(profile.nearestSwara).toBe('Pa');
      // Pa (3:2) has consonance = 1 / (1 + log2(3*2)) = 1 / (1 + log2(6)) ~= 0.279
      expect(profile.consonance).toBeGreaterThan(0.25);
      expect(profile.harmonicRelationship).toContain('fifth');
    });

    it('returns a complete profile for Sa (0 cents)', () => {
      const profile = intervalResonance(0, SA_HZ);
      expect(profile.nearestSwara).toBe('Sa');
      expect(profile.consonance).toBe(1);
    });
  });

  describe('qualitativeConsonance', () => {
    it('Sa is consonant', () => {
      expect(qualitativeConsonance(SA_HZ, SA_HZ)).toBe('consonant');
    });

    it('Pa is consonant', () => {
      expect(qualitativeConsonance(SA_HZ * 1.5, SA_HZ)).toBe('consonant');
    });

    it('a frequency between swaras is "between"', () => {
      // 150 cents — between Re komal (112) and Re (204), far from both
      const freq = SA_HZ * Math.pow(2, 150 / 1200);
      expect(qualitativeConsonance(freq, SA_HZ)).toBe('between');
    });
  });

  describe('nearestTanpuraBeating', () => {
    it('singing exactly on Sa has zero beating', () => {
      const beating = nearestTanpuraBeating(SA_HZ, SA_HZ);
      expect(beating).toBeCloseTo(0, 5);
    });

    it('singing exactly on Pa has zero beating', () => {
      const paHz = SA_HZ * 1.5;
      const beating = nearestTanpuraBeating(paHz, SA_HZ);
      expect(beating).toBeCloseTo(0, 5);
    });

    it('singing slightly off Sa produces small beating', () => {
      const beating = nearestTanpuraBeating(SA_HZ + 2, SA_HZ);
      expect(beating).toBeCloseTo(2, 1);
    });
  });
});
