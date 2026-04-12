/**
 * tantri.test.ts — Unit tests for the Tantri engine module.
 *
 * Tests verify:
 *   - Field creation with correct string count and frequencies
 *   - Voice-to-string mapping accuracy
 *   - Sympathetic vibration calculations
 *   - Touch interaction events
 *   - Raga context visibility
 *   - Level-based progressive disclosure
 *   - Accuracy band thresholds
 *   - Waveform generation
 *
 * @module engine/interaction/tantri.test
 */

import { describe, it, expect } from 'vitest';

import {
  createTantriField,
  mapVoiceToStrings,
  updateFieldFromVoice,
  triggerString,
  releaseString,
  updateRagaContext,
  getVisibleStrings,
  applyLevelVisibility,
  accuracyToOpacity,
  accuracyToColor,
  stringDisplacement,
  generateStringWaveform,
  ACCURACY_THRESHOLDS,
  SPRING_PRESETS,
} from './tantri';

import { getSwaraFrequency } from '../theory/swaras';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SA_HZ = 261.63; // C4

// ---------------------------------------------------------------------------
// Field creation
// ---------------------------------------------------------------------------

describe('createTantriField', () => {
  it('creates 12 strings for all chromatic swaras', () => {
    const field = createTantriField(SA_HZ);
    expect(field.strings.length).toBe(12);
  });

  it('assigns correct Sa frequency', () => {
    const field = createTantriField(SA_HZ);
    expect(field.saHz).toBe(SA_HZ);
    const saString = field.strings[field.swaraIndex['Sa']!]!;
    expect(saString.hz).toBeCloseTo(SA_HZ, 1);
  });

  it('assigns correct Pa frequency (3:2 ratio)', () => {
    const field = createTantriField(SA_HZ);
    const paString = field.strings[field.swaraIndex['Pa']!]!;
    expect(paString.hz).toBeCloseTo(SA_HZ * 1.5, 1);
  });

  it('marks Sa and Pa as achala', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    const pa = field.strings[field.swaraIndex['Pa']!]!;
    const re = field.strings[field.swaraIndex['Re']!]!;
    expect(sa.achala).toBe(true);
    expect(pa.achala).toBe(true);
    expect(re.achala).toBe(false);
  });

  it('all strings start at rest', () => {
    const field = createTantriField(SA_HZ);
    for (const s of field.strings) {
      expect(s.amplitude).toBe(0);
      expect(s.accuracyBand).toBe('rest');
      expect(s.touched).toBe(false);
    }
  });

  it('logPosition ranges from 0 (Sa) to near 1 (Ni)', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    const ni = field.strings[field.swaraIndex['Ni']!]!;
    expect(sa.logPosition).toBe(0);
    expect(ni.logPosition).toBeGreaterThan(0.9);
    expect(ni.logPosition).toBeLessThan(1);
  });

  it('chromatic mode (no raga) makes all strings active', () => {
    const field = createTantriField(SA_HZ);
    for (const s of field.strings) {
      expect(s.visibility).toBe('active');
      expect(s.inRaga).toBe(true);
    }
  });

  it('provides O(1) lookup via swaraIndex', () => {
    const field = createTantriField(SA_HZ);
    expect(field.swaraIndex['Sa']).toBe(0);
    expect(field.swaraIndex['Pa']).toBeDefined();
    expect(typeof field.swaraIndex['Pa']).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Raga context
// ---------------------------------------------------------------------------

describe('createTantriField with raga', () => {
  it('marks Bhoopali swaras as active, others as ghost', () => {
    const field = createTantriField(SA_HZ, 'bhoopali');
    // Bhoopali: Sa Re Ga Pa Dha (pentatonic, no Ma Ni)
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    const re = field.strings[field.swaraIndex['Re']!]!;
    const ga = field.strings[field.swaraIndex['Ga']!]!;
    const pa = field.strings[field.swaraIndex['Pa']!]!;
    const dha = field.strings[field.swaraIndex['Dha']!]!;

    expect(sa.inRaga).toBe(true);
    expect(re.inRaga).toBe(true);
    expect(ga.inRaga).toBe(true);
    expect(pa.inRaga).toBe(true);
    expect(dha.inRaga).toBe(true);
    expect(sa.visibility).toBe('active');

    // Ma and Ni should be ghost
    const ma = field.strings[field.swaraIndex['Ma']!]!;
    const ni = field.strings[field.swaraIndex['Ni']!]!;
    expect(ma.inRaga).toBe(false);
    expect(ni.inRaga).toBe(false);
    expect(ma.visibility).toBe('ghost');
    expect(ni.visibility).toBe('ghost');
  });

  it('identifies vadi and samvadi', () => {
    const field = createTantriField(SA_HZ, 'bhoopali');
    // Bhoopali: vadi = Ga, samvadi = Dha
    const ga = field.strings[field.swaraIndex['Ga']!]!;
    const dha = field.strings[field.swaraIndex['Dha']!]!;
    expect(ga.isVadi).toBe(true);
    expect(dha.isSamvadi).toBe(true);
  });
});

describe('updateRagaContext', () => {
  it('returns same field if raga unchanged', () => {
    const field = createTantriField(SA_HZ, 'bhoopali');
    const updated = updateRagaContext(field, 'bhoopali');
    expect(updated).toBe(field);
  });

  it('returns new field if raga changed', () => {
    const field = createTantriField(SA_HZ, 'bhoopali');
    const updated = updateRagaContext(field, 'yaman');
    expect(updated).not.toBe(field);
    expect(updated.ragaId).toBe('yaman');
  });
});

// ---------------------------------------------------------------------------
// Voice mapping
// ---------------------------------------------------------------------------

describe('mapVoiceToStrings', () => {
  it('maps Sa frequency to Sa string', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(SA_HZ, 0.9, field);
    expect(result.primarySwara).toBe('Sa');
    expect(result.accuracyBand).toBe('perfect');
    expect(Math.abs(result.centsDev)).toBeLessThan(1);
  });

  it('maps Pa frequency (3:2 ratio) to Pa string', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(SA_HZ * 1.5, 0.9, field);
    expect(result.primarySwara).toBe('Pa');
    expect(result.accuracyBand).toBe('perfect');
  });

  it('maps octave-above Sa to Sa string', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(SA_HZ * 2, 0.9, field);
    expect(result.primarySwara).toBe('Sa');
  });

  it('returns rest for zero/negative Hz', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(0, 0.9, field);
    expect(result.primaryIndex).toBe(-1);
    expect(result.accuracyBand).toBe('rest');
  });

  it('returns rest for zero clarity', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(SA_HZ, 0, field);
    expect(result.primaryIndex).toBe(-1);
  });

  it('classifies 10 cents off as "good"', () => {
    const field = createTantriField(SA_HZ);
    // 10 cents sharp: Sa * 2^(10/1200)
    const hz = SA_HZ * Math.pow(2, 10 / 1200);
    const result = mapVoiceToStrings(hz, 0.9, field);
    expect(result.primarySwara).toBe('Sa');
    expect(result.accuracyBand).toBe('good');
  });

  it('classifies 20 cents off as "approaching"', () => {
    const field = createTantriField(SA_HZ);
    const hz = SA_HZ * Math.pow(2, 20 / 1200);
    const result = mapVoiceToStrings(hz, 0.9, field);
    expect(result.primarySwara).toBe('Sa');
    expect(result.accuracyBand).toBe('approaching');
  });

  it('classifies 40 cents off as "off"', () => {
    const field = createTantriField(SA_HZ);
    const hz = SA_HZ * Math.pow(2, 40 / 1200);
    const result = mapVoiceToStrings(hz, 0.9, field);
    expect(result.accuracyBand).toBe('off');
  });

  it('detects sympathetic Pa vibration when Sa is sung', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(SA_HZ, 0.9, field);
    // Pa is a perfect fifth from Sa — should resonate
    const paSympathetic = result.sympathetic.find(
      ([idx]) => idx === field.swaraIndex['Pa'],
    );
    expect(paSympathetic).toBeDefined();
    expect(paSympathetic![1]).toBeGreaterThan(0);
  });

  it('reports inRaga correctly for raga context', () => {
    const field = createTantriField(SA_HZ, 'bhoopali');
    // Re is in Bhoopali
    const reHz = getSwaraFrequency('Re', SA_HZ);
    const reResult = mapVoiceToStrings(reHz, 0.9, field);
    expect(reResult.inRaga).toBe(true);

    // Ma is NOT in Bhoopali
    const maHz = getSwaraFrequency('Ma', SA_HZ);
    const maResult = mapVoiceToStrings(maHz, 0.9, field);
    expect(maResult.inRaga).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// State update
// ---------------------------------------------------------------------------

describe('updateFieldFromVoice', () => {
  it('vibrates primary string when voice is active', () => {
    const field = createTantriField(SA_HZ);
    const voiceMap = mapVoiceToStrings(SA_HZ, 0.9, field);
    updateFieldFromVoice(field, voiceMap, 0.8);

    const sa = field.strings[field.swaraIndex['Sa']!]!;
    expect(sa.amplitude).toBeGreaterThan(0);
    expect(sa.accuracyBand).toBe('perfect');
  });

  it('decays strings toward rest on silence', () => {
    const field = createTantriField(SA_HZ);

    // First, excite Sa
    const voiceMap = mapVoiceToStrings(SA_HZ, 0.9, field);
    updateFieldFromVoice(field, voiceMap, 0.8);
    const ampBefore = field.strings[field.swaraIndex['Sa']!]!.amplitude;

    // Then silence for several frames
    for (let i = 0; i < 50; i++) {
      updateFieldFromVoice(field, null, 0);
    }

    const ampAfter = field.strings[field.swaraIndex['Sa']!]!.amplitude;
    expect(ampAfter).toBeLessThan(ampBefore);
    expect(ampAfter).toBe(0); // Should have decayed to rest
  });

  it('does not modify touched strings', () => {
    const field = createTantriField(SA_HZ);

    // Touch Sa
    triggerString('Sa', field);
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    expect(sa.touched).toBe(true);
    expect(sa.amplitude).toBe(1);

    // Voice on Re should not affect touched Sa
    const reHz = getSwaraFrequency('Re', SA_HZ);
    const voiceMap = mapVoiceToStrings(reHz, 0.9, field);
    updateFieldFromVoice(field, voiceMap, 0.8);

    expect(sa.amplitude).toBe(1); // Unchanged
    expect(sa.touched).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Touch interaction
// ---------------------------------------------------------------------------

describe('triggerString', () => {
  it('produces a play event for a valid string', () => {
    const field = createTantriField(SA_HZ);
    const event = triggerString('Pa', field);
    expect(event).not.toBeNull();
    expect(event!.swara).toBe('Pa');
    expect(event!.hz).toBeCloseTo(SA_HZ * 1.5, 1);
    expect(event!.octave).toBe('madhya');
  });

  it('snaps string to full amplitude', () => {
    const field = createTantriField(SA_HZ);
    triggerString('Pa', field);
    const pa = field.strings[field.swaraIndex['Pa']!]!;
    expect(pa.amplitude).toBe(1);
    expect(pa.touched).toBe(true);
    expect(pa.accuracyBand).toBe('perfect');
  });

  it('returns null for hidden strings', () => {
    const field = createTantriField(SA_HZ, 'bhoopali');
    applyLevelVisibility(field, 1); // Shishya L1: Sa only
    const event = triggerString('Re', field);
    expect(event).toBeNull();
  });

  it('works with numeric index', () => {
    const field = createTantriField(SA_HZ);
    const event = triggerString(0, field);
    expect(event).not.toBeNull();
    expect(event!.swara).toBe('Sa');
  });
});

describe('releaseString', () => {
  it('marks string as not touched', () => {
    const field = createTantriField(SA_HZ);
    triggerString('Pa', field);
    expect(field.strings[field.swaraIndex['Pa']!]!.touched).toBe(true);

    releaseString('Pa', field);
    expect(field.strings[field.swaraIndex['Pa']!]!.touched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Level visibility
// ---------------------------------------------------------------------------

describe('getVisibleStrings', () => {
  it('shishya L1: only Sa visible', () => {
    const field = createTantriField(SA_HZ, 'bhoopali', 'shishya');
    const visible = getVisibleStrings(field, 1);
    expect(visible.length).toBe(1);
    expect(visible[0]).toBe(field.swaraIndex['Sa']);
  });

  it('shishya L2+: aroha swaras visible', () => {
    const field = createTantriField(SA_HZ, 'bhoopali', 'shishya');
    const visible = getVisibleStrings(field, 2);
    // Bhoopali aroha: Sa Re Ga Pa Dha (5 swaras)
    expect(visible.length).toBeGreaterThanOrEqual(5);
  });

  it('varistha: all 12 visible', () => {
    const field = createTantriField(SA_HZ, 'bhoopali', 'varistha');
    const visible = getVisibleStrings(field, 1);
    expect(visible.length).toBe(12);
  });

  it('no raga shishya: Sa + Pa', () => {
    const field = createTantriField(SA_HZ, null, 'shishya');
    const visible = getVisibleStrings(field, 2);
    expect(visible.length).toBe(2);
    expect(visible).toContain(field.swaraIndex['Sa']);
    expect(visible).toContain(field.swaraIndex['Pa']);
  });
});

describe('applyLevelVisibility', () => {
  it('hides strings not in visible set', () => {
    const field = createTantriField(SA_HZ, 'bhoopali', 'shishya');
    applyLevelVisibility(field, 1);

    const sa = field.strings[field.swaraIndex['Sa']!]!;
    const re = field.strings[field.swaraIndex['Re']!]!;
    expect(sa.visibility).toBe('active');
    expect(re.visibility).toBe('hidden');
  });
});

// ---------------------------------------------------------------------------
// Accuracy helpers
// ---------------------------------------------------------------------------

describe('accuracyToOpacity', () => {
  it('perfect = 1.0', () => expect(accuracyToOpacity('perfect')).toBe(1.0));
  it('good = 0.6', () => expect(accuracyToOpacity('good')).toBe(0.6));
  it('approaching = 0.3', () => expect(accuracyToOpacity('approaching')).toBe(0.3));
  it('off = 0.1', () => expect(accuracyToOpacity('off')).toBe(0.1));
  it('rest = 0', () => expect(accuracyToOpacity('rest')).toBe(0));
});

describe('accuracyToColor', () => {
  it('perfect = --accent', () => expect(accuracyToColor('perfect')).toBe('--accent'));
  it('good = --correct', () => expect(accuracyToColor('good')).toBe('--correct'));
  it('rest = --text-3', () => expect(accuracyToColor('rest')).toBe('--text-3'));
});

// ---------------------------------------------------------------------------
// Waveform generation
// ---------------------------------------------------------------------------

describe('stringDisplacement', () => {
  it('returns 0 for a resting string', () => {
    expect(stringDisplacement(0, 4, 0.5)).toBe(0);
  });

  it('returns non-zero for active string', () => {
    const d = stringDisplacement(1, 4, 0.1);
    expect(d).not.toBe(0);
  });

  it('decays over time', () => {
    const d1 = Math.abs(stringDisplacement(1, 4, 0.1));
    const d2 = Math.abs(stringDisplacement(1, 4, 1.0));
    expect(d2).toBeLessThan(d1);
  });
});

describe('generateStringWaveform', () => {
  it('returns all zeros for a resting string', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    const waveform = generateStringWaveform(sa, 100, 0);
    for (let i = 0; i < waveform.length; i++) {
      expect(waveform[i]).toBe(0);
    }
  });

  it('returns non-zero values for a vibrating string', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    sa.amplitude = 0.8;
    const waveform = generateStringWaveform(sa, 100, 0.5);
    let hasNonZero = false;
    for (let i = 0; i < waveform.length; i++) {
      if (waveform[i] !== 0) hasNonZero = true;
    }
    expect(hasNonZero).toBe(true);
  });

  it('has nodes at the endpoints (standing wave)', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    sa.amplitude = 0.8;
    const waveform = generateStringWaveform(sa, 100, 0.5);
    // Endpoints should be near zero due to sin(PI * 0) and sin(PI * 1) envelope
    expect(Math.abs(waveform[0]!)).toBeLessThan(0.01);
    expect(Math.abs(waveform[99]!)).toBeLessThan(0.01);
  });
});

// ---------------------------------------------------------------------------
// Spring presets (sanity check)
// ---------------------------------------------------------------------------

describe('SPRING_PRESETS', () => {
  it('Kan is the stiffest', () => {
    expect(SPRING_PRESETS.kan.stiffness).toBeGreaterThan(
      SPRING_PRESETS.tanpuraRelease.stiffness,
    );
  });

  it('Meend is the gentlest', () => {
    expect(SPRING_PRESETS.meend.stiffness).toBeLessThan(
      SPRING_PRESETS.andolan.stiffness,
    );
  });
});
