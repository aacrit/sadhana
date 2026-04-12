/**
 * talas.test.ts — Unit tests for all tala definitions in the engine.
 *
 * Tests verify:
 * - Correct beat count and vibhag structure
 * - Correct sam and khali positions
 * - Theka length matches beat count
 * - generateTheka produces correct number of events with correct timing
 * - getBeatPosition returns correct vibhag assignments
 * - Rupak's unusual sam-is-khali property
 *
 * @module engine/theory/talas/talas.test
 */

import { describe, it, expect } from 'vitest';

import { teentaal } from './teentaal';
import {
  ektaal,
  getBeatPosition as ektaalGetBeatPosition,
  generateTheka as ektaalGenerateTheka,
  getBolAtBeat as ektaalGetBolAtBeat,
  isSam as ektaalIsSam,
  isKhali as ektaalIsKhali,
  getVibhagForBeat as ektaalGetVibhagForBeat,
} from './ektaal';
import {
  jhaptaal,
  getBeatPosition as jhaptaalGetBeatPosition,
  generateTheka as jhaptaalGenerateTheka,
  getBolAtBeat as jhaptaalGetBolAtBeat,
  isSam as jhaptaalIsSam,
  isKhali as jhaptaalIsKhali,
  getVibhagForBeat as jhaptaalGetVibhagForBeat,
} from './jhaptaal';
import {
  rupak,
  getBeatPosition as rupakGetBeatPosition,
  generateTheka as rupakGenerateTheka,
  getBolAtBeat as rupakGetBolAtBeat,
  isSam as rupakIsSam,
  isKhali as rupakIsKhali,
  getVibhagForBeat as rupakGetVibhagForBeat,
} from './rupak';

import type { Tala } from '../types';

// ---------------------------------------------------------------------------
// Helper: validate common tala invariants
// ---------------------------------------------------------------------------

function validateTalaStructure(tala: Tala) {
  it(`has ${tala.beats} beats`, () => {
    expect(tala.beats).toBe(tala.theka.length);
  });

  it('vibhag sizes sum to total beats', () => {
    const sum = tala.vibhag.reduce((a, b) => a + b, 0);
    expect(sum).toBe(tala.beats);
  });

  it('clapPattern length matches vibhag count', () => {
    expect(tala.clapPattern.length).toBe(tala.vibhag.length);
  });

  it('sam is beat 1', () => {
    expect(tala.sam).toBe(1);
  });

  it('has at least one khali beat', () => {
    expect(tala.khali.length).toBeGreaterThan(0);
  });

  it('all khali beats are within range', () => {
    for (const k of tala.khali) {
      expect(k).toBeGreaterThanOrEqual(1);
      expect(k).toBeLessThanOrEqual(tala.beats);
    }
  });

  it('has a non-empty description', () => {
    expect(tala.description.length).toBeGreaterThan(0);
  });

  it('has Devanagari name', () => {
    expect(tala.nameDevanagari.length).toBeGreaterThan(0);
  });
}

// ===========================================================================
// Teentaal (reference — included for completeness)
// ===========================================================================

describe('Teentaal', () => {
  validateTalaStructure(teentaal);

  it('has 16 beats', () => {
    expect(teentaal.beats).toBe(16);
  });

  it('has 4 vibhags of 4 beats each', () => {
    expect(teentaal.vibhag).toEqual([4, 4, 4, 4]);
  });

  it('khali is at beat 9', () => {
    expect(teentaal.khali).toEqual([9]);
  });

  it('clap pattern is sam-tali-khali-tali', () => {
    expect(teentaal.clapPattern).toEqual(['sam', 'tali', 'khali', 'tali']);
  });
});

// ===========================================================================
// Ektaal
// ===========================================================================

describe('Ektaal', () => {
  validateTalaStructure(ektaal);

  it('has 12 beats', () => {
    expect(ektaal.beats).toBe(12);
  });

  it('has 6 vibhags of 2 beats each', () => {
    expect(ektaal.vibhag).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it('khali is at beat 7', () => {
    expect(ektaal.khali).toEqual([7]);
  });

  it('clap pattern is sam-tali-tali-khali-tali-tali', () => {
    expect(ektaal.clapPattern).toEqual(['sam', 'tali', 'tali', 'khali', 'tali', 'tali']);
  });

  it('theka has correct bols', () => {
    expect(ektaal.theka).toEqual([
      'Dhin', 'Dhin', 'DhaGe', 'TrKt', 'Tu', 'Na',
      'Kat', 'Ta', 'DhaGe', 'TrKt', 'Dhin', 'Na',
    ]);
  });

  describe('getBolAtBeat', () => {
    it('returns correct bol for each beat', () => {
      expect(ektaalGetBolAtBeat(1)).toBe('Dhin');
      expect(ektaalGetBolAtBeat(7)).toBe('Kat');
      expect(ektaalGetBolAtBeat(12)).toBe('Na');
    });

    it('returns undefined for out-of-range beats', () => {
      expect(ektaalGetBolAtBeat(0)).toBeUndefined();
      expect(ektaalGetBolAtBeat(13)).toBeUndefined();
    });
  });

  describe('getBeatPosition', () => {
    it('beat 1 is vibhag 0, position 0, sam', () => {
      const pos = ektaalGetBeatPosition(1)!;
      expect(pos.vibhagIndex).toBe(0);
      expect(pos.beatInVibhag).toBe(0);
      expect(pos.isSam).toBe(true);
      expect(pos.isKhali).toBe(false);
      expect(pos.clapType).toBe('sam');
    });

    it('beat 7 is vibhag 3, position 0, khali', () => {
      const pos = ektaalGetBeatPosition(7)!;
      expect(pos.vibhagIndex).toBe(3);
      expect(pos.beatInVibhag).toBe(0);
      expect(pos.isSam).toBe(false);
      expect(pos.isKhali).toBe(true);
      expect(pos.clapType).toBe('khali');
    });

    it('beat 3 is vibhag 1, position 0', () => {
      const pos = ektaalGetBeatPosition(3)!;
      expect(pos.vibhagIndex).toBe(1);
      expect(pos.beatInVibhag).toBe(0);
    });

    it('returns undefined for out-of-range', () => {
      expect(ektaalGetBeatPosition(0)).toBeUndefined();
      expect(ektaalGetBeatPosition(13)).toBeUndefined();
    });
  });

  describe('generateTheka', () => {
    it('generates 12 events', () => {
      const events = ektaalGenerateTheka(60);
      expect(events).toHaveLength(12);
    });

    it('at 60 BPM, each beat is 1 second apart', () => {
      const events = ektaalGenerateTheka(60);
      for (let i = 0; i < events.length; i++) {
        expect(events[i]!.timeSeconds).toBeCloseTo(i, 10);
      }
    });

    it('at 120 BPM, each beat is 0.5 seconds apart', () => {
      const events = ektaalGenerateTheka(120);
      for (let i = 0; i < events.length; i++) {
        expect(events[i]!.timeSeconds).toBeCloseTo(i * 0.5, 10);
      }
    });

    it('first event is sam', () => {
      const events = ektaalGenerateTheka(60);
      expect(events[0]!.isSam).toBe(true);
      expect(events[0]!.beat).toBe(1);
    });

    it('beat 7 event is khali', () => {
      const events = ektaalGenerateTheka(60);
      expect(events[6]!.isKhali).toBe(true);
      expect(events[6]!.beat).toBe(7);
    });

    it('throws for non-positive tempo', () => {
      expect(() => ektaalGenerateTheka(0)).toThrow(RangeError);
      expect(() => ektaalGenerateTheka(-60)).toThrow(RangeError);
    });
  });

  describe('isSam / isKhali', () => {
    it('beat 1 is sam', () => {
      expect(ektaalIsSam(1)).toBe(true);
    });

    it('beat 7 is khali', () => {
      expect(ektaalIsKhali(7)).toBe(true);
    });

    it('beat 1 is not khali', () => {
      expect(ektaalIsKhali(1)).toBe(false);
    });
  });

  describe('getVibhagForBeat', () => {
    it('returns correct vibhag for each beat', () => {
      expect(ektaalGetVibhagForBeat(1)).toBe(0);
      expect(ektaalGetVibhagForBeat(2)).toBe(0);
      expect(ektaalGetVibhagForBeat(3)).toBe(1);
      expect(ektaalGetVibhagForBeat(4)).toBe(1);
      expect(ektaalGetVibhagForBeat(5)).toBe(2);
      expect(ektaalGetVibhagForBeat(6)).toBe(2);
      expect(ektaalGetVibhagForBeat(7)).toBe(3);
      expect(ektaalGetVibhagForBeat(8)).toBe(3);
      expect(ektaalGetVibhagForBeat(9)).toBe(4);
      expect(ektaalGetVibhagForBeat(10)).toBe(4);
      expect(ektaalGetVibhagForBeat(11)).toBe(5);
      expect(ektaalGetVibhagForBeat(12)).toBe(5);
    });

    it('returns -1 for out-of-range', () => {
      expect(ektaalGetVibhagForBeat(0)).toBe(-1);
      expect(ektaalGetVibhagForBeat(13)).toBe(-1);
    });
  });
});

// ===========================================================================
// Jhaptaal
// ===========================================================================

describe('Jhaptaal', () => {
  validateTalaStructure(jhaptaal);

  it('has 10 beats', () => {
    expect(jhaptaal.beats).toBe(10);
  });

  it('has 4 vibhags of 2+3+2+3', () => {
    expect(jhaptaal.vibhag).toEqual([2, 3, 2, 3]);
  });

  it('khali is at beat 6', () => {
    expect(jhaptaal.khali).toEqual([6]);
  });

  it('clap pattern is sam-tali-khali-tali', () => {
    expect(jhaptaal.clapPattern).toEqual(['sam', 'tali', 'khali', 'tali']);
  });

  it('theka has correct bols', () => {
    expect(jhaptaal.theka).toEqual([
      'Dhi', 'Na', 'Dhi', 'Dhi', 'Na',
      'Ti', 'Na', 'Dhi', 'Dhi', 'Na',
    ]);
  });

  describe('getBolAtBeat', () => {
    it('returns correct bol for each beat', () => {
      expect(jhaptaalGetBolAtBeat(1)).toBe('Dhi');
      expect(jhaptaalGetBolAtBeat(6)).toBe('Ti');
      expect(jhaptaalGetBolAtBeat(10)).toBe('Na');
    });

    it('returns undefined for out-of-range beats', () => {
      expect(jhaptaalGetBolAtBeat(0)).toBeUndefined();
      expect(jhaptaalGetBolAtBeat(11)).toBeUndefined();
    });
  });

  describe('getBeatPosition', () => {
    it('beat 1 is vibhag 0, position 0, sam', () => {
      const pos = jhaptaalGetBeatPosition(1)!;
      expect(pos.vibhagIndex).toBe(0);
      expect(pos.beatInVibhag).toBe(0);
      expect(pos.isSam).toBe(true);
      expect(pos.isKhali).toBe(false);
      expect(pos.clapType).toBe('sam');
    });

    it('beat 6 is vibhag 2, position 0, khali', () => {
      const pos = jhaptaalGetBeatPosition(6)!;
      expect(pos.vibhagIndex).toBe(2);
      expect(pos.beatInVibhag).toBe(0);
      expect(pos.isSam).toBe(false);
      expect(pos.isKhali).toBe(true);
      expect(pos.clapType).toBe('khali');
    });

    it('beat 3 is vibhag 1, position 0 (first beat of 3-beat vibhag)', () => {
      const pos = jhaptaalGetBeatPosition(3)!;
      expect(pos.vibhagIndex).toBe(1);
      expect(pos.beatInVibhag).toBe(0);
    });

    it('beat 5 is vibhag 1, position 2 (last beat of 3-beat vibhag)', () => {
      const pos = jhaptaalGetBeatPosition(5)!;
      expect(pos.vibhagIndex).toBe(1);
      expect(pos.beatInVibhag).toBe(2);
    });

    it('beat 8 is vibhag 3, position 0 (first beat of last vibhag)', () => {
      const pos = jhaptaalGetBeatPosition(8)!;
      expect(pos.vibhagIndex).toBe(3);
      expect(pos.beatInVibhag).toBe(0);
    });

    it('returns undefined for out-of-range', () => {
      expect(jhaptaalGetBeatPosition(0)).toBeUndefined();
      expect(jhaptaalGetBeatPosition(11)).toBeUndefined();
    });
  });

  describe('generateTheka', () => {
    it('generates 10 events', () => {
      const events = jhaptaalGenerateTheka(60);
      expect(events).toHaveLength(10);
    });

    it('at 60 BPM, each beat is 1 second apart', () => {
      const events = jhaptaalGenerateTheka(60);
      for (let i = 0; i < events.length; i++) {
        expect(events[i]!.timeSeconds).toBeCloseTo(i, 10);
      }
    });

    it('at 60 BPM, total cycle duration is 10 seconds', () => {
      const events = jhaptaalGenerateTheka(60);
      const lastEvent = events[events.length - 1]!;
      expect(lastEvent.timeSeconds).toBeCloseTo(9, 10);
    });

    it('first event is sam', () => {
      const events = jhaptaalGenerateTheka(60);
      expect(events[0]!.isSam).toBe(true);
    });

    it('beat 6 event is khali', () => {
      const events = jhaptaalGenerateTheka(60);
      expect(events[5]!.isKhali).toBe(true);
      expect(events[5]!.bol).toBe('Ti');
    });

    it('throws for non-positive tempo', () => {
      expect(() => jhaptaalGenerateTheka(0)).toThrow(RangeError);
    });
  });

  describe('getVibhagForBeat — asymmetric 2+3+2+3', () => {
    it('beats 1-2 are vibhag 0', () => {
      expect(jhaptaalGetVibhagForBeat(1)).toBe(0);
      expect(jhaptaalGetVibhagForBeat(2)).toBe(0);
    });

    it('beats 3-5 are vibhag 1', () => {
      expect(jhaptaalGetVibhagForBeat(3)).toBe(1);
      expect(jhaptaalGetVibhagForBeat(4)).toBe(1);
      expect(jhaptaalGetVibhagForBeat(5)).toBe(1);
    });

    it('beats 6-7 are vibhag 2', () => {
      expect(jhaptaalGetVibhagForBeat(6)).toBe(2);
      expect(jhaptaalGetVibhagForBeat(7)).toBe(2);
    });

    it('beats 8-10 are vibhag 3', () => {
      expect(jhaptaalGetVibhagForBeat(8)).toBe(3);
      expect(jhaptaalGetVibhagForBeat(9)).toBe(3);
      expect(jhaptaalGetVibhagForBeat(10)).toBe(3);
    });
  });
});

// ===========================================================================
// Rupak — the unusual one: sam is khali
// ===========================================================================

describe('Rupak', () => {
  validateTalaStructure(rupak);

  it('has 7 beats', () => {
    expect(rupak.beats).toBe(7);
  });

  it('has 3 vibhags of 3+2+2', () => {
    expect(rupak.vibhag).toEqual([3, 2, 2]);
  });

  // -------------------------------------------------------------------------
  // THE CRITICAL TEST: Sam is khali in Rupak
  // -------------------------------------------------------------------------

  describe('SAM IS KHALI — the defining characteristic of Rupak', () => {
    it('beat 1 (sam) is in the khali array', () => {
      expect(rupak.khali).toContain(1);
    });

    it('sam position is beat 1', () => {
      expect(rupak.sam).toBe(1);
    });

    it('beat 1 is both sam and khali simultaneously', () => {
      expect(rupakIsSam(1)).toBe(true);
      expect(rupakIsKhali(1)).toBe(true);
    });

    it('first vibhag clap type is khali, not sam', () => {
      expect(rupak.clapPattern[0]).toBe('khali');
    });

    it('getBeatPosition for beat 1 shows both isSam and isKhali as true', () => {
      const pos = rupakGetBeatPosition(1)!;
      expect(pos.isSam).toBe(true);
      expect(pos.isKhali).toBe(true);
      expect(pos.clapType).toBe('khali');
    });

    it('generateTheka marks beat 1 as both sam and khali', () => {
      const events = rupakGenerateTheka(60);
      const firstEvent = events[0]!;
      expect(firstEvent.isSam).toBe(true);
      expect(firstEvent.isKhali).toBe(true);
      expect(firstEvent.clapType).toBe('khali');
    });

    it('first vibhag uses open/dry bols (Ti Ti Na), not resonant bols', () => {
      expect(rupak.theka[0]).toBe('Ti');
      expect(rupak.theka[1]).toBe('Ti');
      expect(rupak.theka[2]).toBe('Na');
    });
  });

  it('tali vibhags (2 and 3) use resonant Dhi bols', () => {
    // Vibhag 2: beats 4-5
    expect(rupak.theka[3]).toBe('Dhi');
    expect(rupak.theka[4]).toBe('Na');
    // Vibhag 3: beats 6-7
    expect(rupak.theka[5]).toBe('Dhi');
    expect(rupak.theka[6]).toBe('Na');
  });

  it('clap pattern is khali-tali-tali', () => {
    expect(rupak.clapPattern).toEqual(['khali', 'tali', 'tali']);
  });

  it('theka has correct bols', () => {
    expect(rupak.theka).toEqual([
      'Ti', 'Ti', 'Na', 'Dhi', 'Na', 'Dhi', 'Na',
    ]);
  });

  describe('getBolAtBeat', () => {
    it('returns correct bol for each beat', () => {
      expect(rupakGetBolAtBeat(1)).toBe('Ti');
      expect(rupakGetBolAtBeat(4)).toBe('Dhi');
      expect(rupakGetBolAtBeat(7)).toBe('Na');
    });

    it('returns undefined for out-of-range beats', () => {
      expect(rupakGetBolAtBeat(0)).toBeUndefined();
      expect(rupakGetBolAtBeat(8)).toBeUndefined();
    });
  });

  describe('getBeatPosition', () => {
    it('beat 1 is vibhag 0, position 0', () => {
      const pos = rupakGetBeatPosition(1)!;
      expect(pos.vibhagIndex).toBe(0);
      expect(pos.beatInVibhag).toBe(0);
    });

    it('beat 4 is vibhag 1, position 0, tali', () => {
      const pos = rupakGetBeatPosition(4)!;
      expect(pos.vibhagIndex).toBe(1);
      expect(pos.beatInVibhag).toBe(0);
      expect(pos.isSam).toBe(false);
      expect(pos.isKhali).toBe(false);
      expect(pos.clapType).toBe('tali');
    });

    it('beat 6 is vibhag 2, position 0, tali', () => {
      const pos = rupakGetBeatPosition(6)!;
      expect(pos.vibhagIndex).toBe(2);
      expect(pos.beatInVibhag).toBe(0);
      expect(pos.clapType).toBe('tali');
    });

    it('returns undefined for out-of-range', () => {
      expect(rupakGetBeatPosition(0)).toBeUndefined();
      expect(rupakGetBeatPosition(8)).toBeUndefined();
    });
  });

  describe('generateTheka', () => {
    it('generates 7 events', () => {
      const events = rupakGenerateTheka(60);
      expect(events).toHaveLength(7);
    });

    it('at 60 BPM, each beat is 1 second apart', () => {
      const events = rupakGenerateTheka(60);
      for (let i = 0; i < events.length; i++) {
        expect(events[i]!.timeSeconds).toBeCloseTo(i, 10);
      }
    });

    it('at 60 BPM, total cycle is 7 seconds (last beat at 6s)', () => {
      const events = rupakGenerateTheka(60);
      expect(events[events.length - 1]!.timeSeconds).toBeCloseTo(6, 10);
    });

    it('all bols match the tala theka', () => {
      const events = rupakGenerateTheka(60);
      for (let i = 0; i < events.length; i++) {
        expect(events[i]!.bol).toBe(rupak.theka[i]);
      }
    });

    it('throws for non-positive tempo', () => {
      expect(() => rupakGenerateTheka(0)).toThrow(RangeError);
      expect(() => rupakGenerateTheka(-100)).toThrow(RangeError);
    });
  });

  describe('getVibhagForBeat — asymmetric 3+2+2', () => {
    it('beats 1-3 are vibhag 0', () => {
      expect(rupakGetVibhagForBeat(1)).toBe(0);
      expect(rupakGetVibhagForBeat(2)).toBe(0);
      expect(rupakGetVibhagForBeat(3)).toBe(0);
    });

    it('beats 4-5 are vibhag 1', () => {
      expect(rupakGetVibhagForBeat(4)).toBe(1);
      expect(rupakGetVibhagForBeat(5)).toBe(1);
    });

    it('beats 6-7 are vibhag 2', () => {
      expect(rupakGetVibhagForBeat(6)).toBe(2);
      expect(rupakGetVibhagForBeat(7)).toBe(2);
    });

    it('returns -1 for out-of-range', () => {
      expect(rupakGetVibhagForBeat(0)).toBe(-1);
      expect(rupakGetVibhagForBeat(8)).toBe(-1);
    });
  });
});

// ===========================================================================
// Cross-tala consistency checks
// ===========================================================================

describe('Cross-tala consistency', () => {
  const allTalas: Tala[] = [teentaal, ektaal, jhaptaal, rupak];

  it('all talas have unique IDs', () => {
    const ids = allTalas.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all talas have unique names', () => {
    const names = allTalas.map(t => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(allTalas.map(t => [t.name, t] as const))(
    '%s: theka length equals beats',
    (_name, tala) => {
      expect(tala.theka.length).toBe(tala.beats);
    },
  );

  it.each(allTalas.map(t => [t.name, t] as const))(
    '%s: vibhag sum equals beats',
    (_name, tala) => {
      const sum = tala.vibhag.reduce((a, b) => a + b, 0);
      expect(sum).toBe(tala.beats);
    },
  );

  it.each(allTalas.map(t => [t.name, t] as const))(
    '%s: clapPattern length equals vibhag count',
    (_name, tala) => {
      expect(tala.clapPattern.length).toBe(tala.vibhag.length);
    },
  );
});
