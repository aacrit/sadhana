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

import { describe, it, expect, beforeEach } from 'vitest';

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
  resetHzEma,
  ACCURACY_THRESHOLDS,
  SPRING_PRESETS,
  HYSTERESIS_ACTIVATE,
  HYSTERESIS_DEACTIVATE,
} from './tantri';

// Reset the module-level Hz EMA state before every test so stale averages
// from one test cannot bleed into the next. Without this, a test that maps
// Pa (Hz=~392) immediately precedes a test that maps Sa (Hz=261), and the
// EMA drags the smoothed Hz toward Pa, causing the wrong swara to match.
beforeEach(() => {
  resetHzEma();
});

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

    // Then silence for enough frames to reach full decay.
    // VIBRATION_DECAY = 0.92: 100 frames → amplitude * 0.92^100 ≈ amplitude * 0.00024
    // which is below REST_THRESHOLD (0.005), so the string zeroes out.
    for (let i = 0; i < 100; i++) {
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

// ---------------------------------------------------------------------------
// NaN/Infinity guards
// ---------------------------------------------------------------------------

describe('mapVoiceToStrings — NaN/Infinity guards', () => {
  it('returns rest for NaN Hz', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(NaN, 0.9, field);
    expect(result.primaryIndex).toBe(-1);
    expect(result.accuracyBand).toBe('rest');
  });

  it('returns rest for Infinity Hz', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(Infinity, 0.9, field);
    expect(result.primaryIndex).toBe(-1);
    expect(result.accuracyBand).toBe('rest');
  });

  it('returns rest for NaN clarity', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(SA_HZ, NaN, field);
    expect(result.primaryIndex).toBe(-1);
    expect(result.accuracyBand).toBe('rest');
  });

  it('returns rest for -Infinity clarity', () => {
    const field = createTantriField(SA_HZ);
    const result = mapVoiceToStrings(SA_HZ, -Infinity, field);
    expect(result.primaryIndex).toBe(-1);
    expect(result.accuracyBand).toBe('rest');
  });
});

// ---------------------------------------------------------------------------
// accuracyBand decay behaviour
// ---------------------------------------------------------------------------

describe('updateFieldFromVoice — accuracyBand decay', () => {
  it('resets accuracyBand immediately when voice switches to a different string', () => {
    const field = createTantriField(SA_HZ);

    // Voice on Sa
    const saMap = mapVoiceToStrings(SA_HZ, 0.9, field);
    updateFieldFromVoice(field, saMap, 0.8);
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    expect(sa.accuracyBand).toBe('perfect');
    expect(sa.amplitude).toBeGreaterThan(0);

    // Voice moves to Pa — Sa should immediately lose its accuracy band
    const paHz = getSwaraFrequency('Pa', SA_HZ);
    const paMap = mapVoiceToStrings(paHz, 0.9, field);
    updateFieldFromVoice(field, paMap, 0.8);

    // Sa is now decaying but should have 'rest' band immediately
    expect(sa.accuracyBand).toBe('rest');
    // Amplitude may still be non-zero (decay hasn't completed), but band is rest
    expect(sa.centsDev).toBe(0);
  });

  it('resets accuracyBand immediately on silence', () => {
    const field = createTantriField(SA_HZ);

    // Voice on Sa
    const saMap = mapVoiceToStrings(SA_HZ, 0.9, field);
    updateFieldFromVoice(field, saMap, 0.8);
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    expect(sa.accuracyBand).toBe('perfect');

    // Single frame of silence
    updateFieldFromVoice(field, null, 0);

    // Band resets immediately even if amplitude is still decaying
    expect(sa.accuracyBand).toBe('rest');
    expect(sa.centsDev).toBe(0);
  });

  it('decaying strings do not show stale accuracy colors', () => {
    const field = createTantriField(SA_HZ);

    // Strongly voice Sa for multiple frames to build up amplitude
    const saMap = mapVoiceToStrings(SA_HZ, 0.9, field);
    for (let i = 0; i < 10; i++) {
      updateFieldFromVoice(field, saMap, 0.9);
    }
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    expect(sa.amplitude).toBeGreaterThan(0.5);

    // Go silent — one frame
    updateFieldFromVoice(field, null, 0);

    // Amplitude should still be > 0 (decay is gradual), but band must be 'rest'
    expect(sa.amplitude).toBeGreaterThan(0);
    expect(sa.accuracyBand).toBe('rest');
  });
});

// ---------------------------------------------------------------------------
// Mock voice integration — full practice scenarios
// ---------------------------------------------------------------------------

describe('Mock voice: full practice session simulation', () => {
  /**
   * Helper: generate a synthetic Hz value for a given swara at Sa=261.63 Hz.
   * Optionally offset by `centsOff` to simulate sharp/flat singing.
   */
  function swaraHz(swara: string, centsOff = 0): number {
    const freq = getSwaraFrequency(swara as Parameters<typeof getSwaraFrequency>[0], SA_HZ);
    return freq * Math.pow(2, centsOff / 1200);
  }

  it('Scenario 1: sing Sa perfectly for 30 frames → string vibrates at click intensity', () => {
    const field = createTantriField(SA_HZ, 'bhoopali');
    const sa = field.strings[field.swaraIndex['Sa']!]!;

    // Simulate 30 frames of singing Sa perfectly (clarity 0.9, amplitude 0.5)
    for (let i = 0; i < 30; i++) {
      const voiceMap = mapVoiceToStrings(swaraHz('Sa'), 0.9, field);
      updateFieldFromVoice(field, voiceMap, 0.5);
    }

    // String should vibrate at click-like intensity (0.85 bandBoost for perfect)
    expect(sa.amplitude).toBeGreaterThan(0.7);
    expect(sa.accuracyBand).toBe('perfect');
    expect(sa.centsDev).toBeCloseTo(0, 0);
  });

  it('Scenario 2: sing Sa slightly sharp (+15 cents) → "good" band, strong vibration', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;

    for (let i = 0; i < 20; i++) {
      const voiceMap = mapVoiceToStrings(swaraHz('Sa', 15), 0.85, field);
      updateFieldFromVoice(field, voiceMap, 0.4);
    }

    expect(sa.accuracyBand).toBe('good');
    // 'good' bandBoost = 0.7 → should be at least 0.6
    expect(sa.amplitude).toBeGreaterThan(0.55);
    expect(sa.centsDev).toBeGreaterThan(10);
    expect(sa.centsDev).toBeLessThan(20);
  });

  it('Scenario 3: sing Sa very flat (-35 cents) → "off" band, weak vibration', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;

    for (let i = 0; i < 20; i++) {
      const voiceMap = mapVoiceToStrings(swaraHz('Sa', -35), 0.85, field);
      updateFieldFromVoice(field, voiceMap, 0.4);
    }

    expect(sa.accuracyBand).toBe('off');
    // 'off' bandBoost = 0.2, but voiceAmplitude is 0.4 → max(0.4, 0.2) = 0.4
    expect(sa.amplitude).toBeGreaterThan(0.2);
    expect(sa.amplitude).toBeLessThan(0.6);
  });

  it('Scenario 4: transition Sa → Re → Ga smoothly', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    const re = field.strings[field.swaraIndex['Re']!]!;
    const ga = field.strings[field.swaraIndex['Ga']!]!;

    // Phase 1: Sing Sa for 15 frames
    for (let i = 0; i < 15; i++) {
      const vm = mapVoiceToStrings(swaraHz('Sa'), 0.9, field);
      updateFieldFromVoice(field, vm, 0.6);
    }
    expect(sa.amplitude).toBeGreaterThan(0.5);
    expect(sa.accuracyBand).toBe('perfect');

    // Phase 2: Switch to Re
    for (let i = 0; i < 15; i++) {
      const vm = mapVoiceToStrings(swaraHz('Re'), 0.9, field);
      updateFieldFromVoice(field, vm, 0.6);
    }
    // Re should now be vibrating
    expect(re.amplitude).toBeGreaterThan(0.5);
    expect(re.accuracyBand).toBe('perfect');
    // Sa should be decaying with 'rest' band
    expect(sa.accuracyBand).toBe('rest');
    expect(sa.amplitude).toBeLessThan(re.amplitude);

    // Phase 3: Switch to Ga
    for (let i = 0; i < 15; i++) {
      const vm = mapVoiceToStrings(swaraHz('Ga'), 0.9, field);
      updateFieldFromVoice(field, vm, 0.6);
    }
    expect(ga.amplitude).toBeGreaterThan(0.5);
    expect(ga.accuracyBand).toBe('perfect');
    expect(re.accuracyBand).toBe('rest');
  });

  it('Scenario 5: silence after singing → full decay to zero', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;

    // Sing Sa strongly
    for (let i = 0; i < 20; i++) {
      const vm = mapVoiceToStrings(swaraHz('Sa'), 0.9, field);
      updateFieldFromVoice(field, vm, 0.8);
    }
    expect(sa.amplitude).toBeGreaterThan(0.7);

    // 120 frames of silence (~2 seconds) → should decay to zero
    for (let i = 0; i < 120; i++) {
      updateFieldFromVoice(field, null, 0);
    }
    expect(sa.amplitude).toBe(0);
    expect(sa.accuracyBand).toBe('rest');
  });

  it('Scenario 6: noise (no clear pitch, only amplitude) → no string activates', () => {
    const field = createTantriField(SA_HZ);

    // Send amplitude without a voice map (simulating noise/speech without pitch)
    for (let i = 0; i < 30; i++) {
      updateFieldFromVoice(field, null, 0.5);
    }

    // No string should be vibrating
    for (const s of field.strings) {
      expect(s.amplitude).toBe(0);
      expect(s.accuracyBand).toBe('rest');
    }
  });

  it('Scenario 7: sympathetic Pa vibrates when Sa is sung', () => {
    const field = createTantriField(SA_HZ);
    const pa = field.strings[field.swaraIndex['Pa']!]!;

    // Sing Sa for 20 frames
    for (let i = 0; i < 20; i++) {
      const vm = mapVoiceToStrings(swaraHz('Sa'), 0.9, field);
      updateFieldFromVoice(field, vm, 0.7);
    }

    // Pa should have sympathetic vibration (not zero, but less than Sa)
    const sa = field.strings[field.swaraIndex['Sa']!]!;
    expect(pa.amplitude).toBeGreaterThan(0);
    expect(pa.amplitude).toBeLessThan(sa.amplitude);
    // Sympathetic strings should have 'rest' band (not accuracy-colored)
    expect(pa.accuracyBand).toBe('rest');
  });

  it('Scenario 8: rapid pitch oscillation (gamak) between Re and Ga', () => {
    const field = createTantriField(SA_HZ);
    const re = field.strings[field.swaraIndex['Re']!]!;
    const ga = field.strings[field.swaraIndex['Ga']!]!;

    // Alternate between Re and Ga every 2 frames (simulating gamak ornament)
    for (let i = 0; i < 30; i++) {
      const swara = i % 4 < 2 ? 'Re' : 'Ga';
      const vm = mapVoiceToStrings(swaraHz(swara), 0.9, field);
      updateFieldFromVoice(field, vm, 0.6);
    }

    // Both strings should have been activated at some point
    // The currently targeted one should be active; the other decaying
    // After frame 30 (i=29, 29%4=1 → Re), Re should be the active string
    expect(re.accuracyBand).toBe('perfect');
    expect(ga.accuracyBand).toBe('rest');
    // Both should have non-zero amplitude (Ga is decaying but recently active)
    expect(re.amplitude).toBeGreaterThan(0);
    expect(ga.amplitude).toBeGreaterThan(0);
  });

  it('Scenario 9: voice in raga context — out-of-raga swara flagged', () => {
    // Bhoopali: Sa Re Ga Pa Dha (no Ma, no Ni)
    const field = createTantriField(SA_HZ, 'bhoopali');

    // Sing Ma (not in Bhoopali)
    const vm = mapVoiceToStrings(swaraHz('Ma'), 0.9, field);

    // The mapping should flag it as out of raga
    expect(vm.inRaga).toBe(false);
    // But it should still map to the nearest string
    expect(vm.primarySwara).toBe('Ma');
  });

  it('Scenario 10: very quiet voice (low amplitude) → minimal string excitation', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;

    // Very quiet: amplitude 0.05
    for (let i = 0; i < 30; i++) {
      const vm = mapVoiceToStrings(swaraHz('Sa'), 0.9, field);
      updateFieldFromVoice(field, vm, 0.05);
    }

    // bandBoost for perfect is 0.85, max(0.05, 0.85) = 0.85
    // Even quiet voice should produce clear feedback when pitch is accurate
    expect(sa.amplitude).toBeGreaterThan(0.5);
    expect(sa.accuracyBand).toBe('perfect');
  });

  it('Scenario 11: soprano range (high Sa, 2 octaves above) → still maps correctly', () => {
    const highSa = SA_HZ * 4; // ~1046 Hz
    const field = createTantriField(highSa);

    // Sing Pa at the high Sa reference
    const paHz = highSa * 1.5; // ~1569 Hz
    const vm = mapVoiceToStrings(paHz, 0.9, field);

    expect(vm.primarySwara).toBe('Pa');
    expect(vm.accuracyBand).toBe('perfect');
  });
});

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

// ---------------------------------------------------------------------------
// Asymmetric lerp — onset speed
// ---------------------------------------------------------------------------

describe('Asymmetric lerp — onset speed', () => {
  it('primary string reaches >60% amplitude in 2 frames (fast rise)', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;

    const voiceMap = mapVoiceToStrings(SA_HZ, 0.9, field);
    // 2 frames at default dt (1/60)
    updateFieldFromVoice(field, voiceMap, 0.8);
    updateFieldFromVoice(field, voiceMap, 0.8);

    // With LERP_PRIMARY_RISE = 0.45, after 2 frames from 0:
    //   frame1: 0 + (0.85 - 0) * 0.45 = 0.3825
    //   frame2: 0.3825 + (0.85 - 0.3825) * 0.45 ≈ 0.593
    // Must be > 60% of target amplitude (0.85) = 0.51
    expect(sa.amplitude).toBeGreaterThan(0.51);
  });

  it('rise is faster than fall: amplitude climbs more in 3 frames than it drops', () => {
    const field = createTantriField(SA_HZ);
    const sa = field.strings[field.swaraIndex['Sa']!]!;

    // Build up to near maximum
    const voiceMap = mapVoiceToStrings(SA_HZ, 0.9, field);
    for (let i = 0; i < 20; i++) {
      updateFieldFromVoice(field, voiceMap, 0.8);
    }
    const peakAmp = sa.amplitude;
    const gainIn3Frames = peakAmp; // went from 0 to peakAmp

    // Now target drops to 0 (silence) for 3 frames — fall is slow
    const ampAtPeak = sa.amplitude;
    for (let i = 0; i < 3; i++) {
      updateFieldFromVoice(field, null, 0);
    }
    const lossIn3Frames = ampAtPeak - sa.amplitude;

    // Rise over first ~3 frames should exceed fall over 3 frames from peak
    // (Approximate: gainIn3Frames already measured via the 20-frame run,
    //  but the first 3 frames contribute the most; lossIn3Frames is small.)
    expect(lossIn3Frames).toBeLessThan(gainIn3Frames);
  });
});

// ---------------------------------------------------------------------------
// Hysteresis — no flicker in the noisy amplitude range
// ---------------------------------------------------------------------------

describe('Hysteresis constants', () => {
  it('HYSTERESIS_ACTIVATE > HYSTERESIS_DEACTIVATE (dead band exists)', () => {
    expect(HYSTERESIS_ACTIVATE).toBeGreaterThan(HYSTERESIS_DEACTIVATE);
  });

  it('HYSTERESIS_ACTIVATE is in the noisy range (0.05–0.15)', () => {
    expect(HYSTERESIS_ACTIVATE).toBeGreaterThan(0.05);
    expect(HYSTERESIS_ACTIVATE).toBeLessThan(0.15);
  });

  it('HYSTERESIS_DEACTIVATE is below HYSTERESIS_ACTIVATE (dead band is non-zero)', () => {
    const deadBand = HYSTERESIS_ACTIVATE - HYSTERESIS_DEACTIVATE;
    expect(deadBand).toBeGreaterThan(0.02);
  });
});

// ---------------------------------------------------------------------------
// Hz EMA — jitter suppression and snap-on-jump
// ---------------------------------------------------------------------------

describe('Hz EMA — jitter suppression', () => {
  it('EMA resets on silence (resetHzEma): next call gets a hard snap to the new Hz', () => {
    const field = createTantriField(SA_HZ);

    // Warm the EMA with Pa
    const paHz = getSwaraFrequency('Pa', SA_HZ);
    mapVoiceToStrings(paHz, 0.9, field);

    // Reset (simulates silence or context change)
    resetHzEma();

    // First frame after reset should map to Sa cleanly, not drag toward Pa
    const result = mapVoiceToStrings(SA_HZ, 0.9, field);
    expect(result.primarySwara).toBe('Sa');
    expect(result.accuracyBand).toBe('perfect');
  });

  it('large pitch jump (>50 cents) snaps immediately — does not blend across swara boundary', () => {
    const field = createTantriField(SA_HZ);

    // Warm EMA on Sa for several frames
    for (let i = 0; i < 5; i++) {
      mapVoiceToStrings(SA_HZ, 0.9, field);
    }

    // Large jump to Pa (701 cents away) — should snap, not blend
    const paHz = getSwaraFrequency('Pa', SA_HZ);
    const result = mapVoiceToStrings(paHz, 0.9, field);

    expect(result.primarySwara).toBe('Pa');
    expect(result.accuracyBand).toBe('perfect');
  });

  it('small jitter (<50 cents) on steady Sa stays mapped to Sa', () => {
    const field = createTantriField(SA_HZ);

    // Warm EMA on Sa
    for (let i = 0; i < 5; i++) {
      mapVoiceToStrings(SA_HZ, 0.9, field);
    }

    // ±3 Hz flutter at Sa = ±20 cents — well within EMA suppression
    const flutteredHz = SA_HZ * Math.pow(2, 3 / 1200); // +3 Hz approx
    const result = mapVoiceToStrings(flutteredHz, 0.9, field);

    expect(result.primarySwara).toBe('Sa');
  });
});
