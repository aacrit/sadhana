/**
 * lesson-loader tests (T3.1 — frontend test harness foundation).
 *
 * Pure-logic tests that exercise the YAML→LessonDef pipeline without
 * touching the network. These cover the highest-risk paths: shape
 * coercion (engine_plays scalar vs array), copy overlay merging,
 * malformed input rejection, and the new Cluster F fields wired in
 * rev 11.
 */

import { describe, it, expect } from 'vitest';
import { loadLesson } from './lesson-loader';

describe('loadLesson — basic shape', () => {
  it('parses a minimal valid lesson', () => {
    const yaml = `
id: test-01-bhoopali
journey: beginner
level_range: [1, 3]
raga_id: bhoopali
duration_target_min: 10
xp_award: 30
meta:
  title: Test Lesson
  subtitle: Bhoopali
  time_of_day: dusk
  rasa: shant
phases:
  - id: listen
    type: tanpura_drone
    duration_s: 30
  - id: complete
    type: session_summary
    message: Done
engine:
  raga_grammar_active: false
  pakad_recognition: false
  ornaments_shown: false
  cents_display: hidden
  accuracy_model: shishya
`;
    const def = loadLesson(yaml);
    expect(def.id).toBe('test-01-bhoopali');
    expect(def.phases.length).toBe(2);
    expect(def.phases[0]!.type).toBe('tanpura_drone');
    expect(def.raga_id).toBe('bhoopali');
    expect(def.xp_award).toBe(30);
  });

  it('throws on missing id or phases', () => {
    expect(() => loadLesson('not_a_lesson: true')).toThrow();
    expect(() => loadLesson('id: test\nphases: not_an_array')).toThrow();
  });
});

describe('loadLesson — copy overlay', () => {
  const baseYaml = `
id: test-02
journey: beginner
level_range: [1, 3]
raga_id: yaman
duration_target_min: 10
xp_award: 30
meta:
  title: Base Title
  subtitle: Base
  time_of_day: evening
  rasa: shant
phases:
  - id: intro
    type: swara_introduction
    swaras: [Sa, Re, Ga]
engine:
  raga_grammar_active: false
  pakad_recognition: false
  ornaments_shown: false
  cents_display: hidden
  accuracy_model: shishya
`;

  it('merges screen_title from copy overlay onto matching phase', () => {
    const copy = `
lesson_id: test-02
phases:
  intro:
    screen_title: Three notes of Yaman
    body: Listen.
`;
    const def = loadLesson(baseYaml, copy);
    expect(def.phases[0]!.screenTitle).toBe('Three notes of Yaman');
    expect(def.phases[0]!.body).toBe('Listen.');
  });

  it('preserves engine fields when copy provides only display fields', () => {
    const copy = `
lesson_id: test-02
phases:
  intro:
    screen_title: T
`;
    const def = loadLesson(baseYaml, copy);
    expect(def.phases[0]!.swaras).toEqual(['Sa', 'Re', 'Ga']);
    expect(def.phases[0]!.type).toBe('swara_introduction');
  });

  it('attaches theory_note / cultural_note from copy', () => {
    const copy = `
lesson_id: test-02
phases:
  intro:
    screen_title: T
theory_note:
  title: Theory
  body: Yaman uses tivra Ma.
cultural_note:
  title: Culture
  body: Evening raga.
`;
    const def = loadLesson(baseYaml, copy);
    expect(def.theory_note?.title).toBe('Theory');
    expect(def.cultural_note?.body).toBe('Evening raga.');
  });
});

describe('loadLesson — Cluster F field surfacing (rev 11)', () => {
  it('exposes presentation:comparison on swara_introduction', () => {
    const yaml = `
id: test-03
journey: beginner
level_range: [1, 3]
raga_id: bhairav
duration_target_min: 5
xp_award: 20
meta:
  title: T
  subtitle: T
  time_of_day: dawn
  rasa: shant
phases:
  - id: cmp
    type: swara_introduction
    swaras: [Re, Re_k]
    presentation: comparison
    audio_first: true
engine:
  raga_grammar_active: false
  pakad_recognition: false
  ornaments_shown: false
  cents_display: hidden
  accuracy_model: shishya
`;
    const def = loadLesson(yaml);
    expect(def.phases[0]!.presentation).toBe('comparison');
    expect(def.phases[0]!.swaras).toEqual(['Re', 'Re_k']);
  });

  it('exposes call_response.calls (scalar engine_plays accepted)', () => {
    const yaml = `
id: test-04
journey: beginner
level_range: [1, 3]
raga_id: bhoopali
duration_target_min: 8
xp_award: 30
meta:
  title: T
  subtitle: T
  time_of_day: dawn
  rasa: shant
phases:
  - id: cr
    type: call_response
    rounds: 4
    calls:
      - engine_plays: Sa
        student_sings: Sa
      - engine_plays: Pa
        student_sings: Pa
engine:
  raga_grammar_active: false
  pakad_recognition: false
  ornaments_shown: false
  cents_display: hidden
  accuracy_model: shishya
`;
    const def = loadLesson(yaml);
    expect(def.phases[0]!.rounds).toBe(4);
    const calls = def.phases[0]!.calls!;
    expect(calls.length).toBe(2);
    // YAML scalar string preserved — renderer normalises to array
    expect(calls[0]!.engine_plays).toBe('Sa');
    expect(calls[0]!.student_sings).toBe('Sa');
  });

  it('exposes mastery_challenge.targets[].tolerance_cents', () => {
    const yaml = `
id: test-05
journey: beginner
level_range: [1, 3]
raga_id: bhoopali
duration_target_min: 5
xp_award: 30
meta:
  title: T
  subtitle: T
  time_of_day: dawn
  rasa: shant
phases:
  - id: m
    type: mastery_challenge
    targets:
      - swara: Sa
        hold_duration_s: 5
        tolerance_cents: 30
      - swara: Pa
        hold_duration_s: 5
        tolerance_cents: 30
    min_accuracy: 0.85
    attempts_allowed: 3
engine:
  raga_grammar_active: false
  pakad_recognition: false
  ornaments_shown: false
  cents_display: hidden
  accuracy_model: shishya
`;
    const def = loadLesson(yaml);
    const targets = def.phases[0]!.targets!;
    expect(targets.length).toBe(2);
    expect(targets[0]!.swara).toBe('Sa');
    expect(targets[0]!.tolerance_cents).toBe(30);
    expect(def.phases[0]!.min_accuracy).toBe(0.85);
  });

  it('exposes interval_pool with [from, to] tuples', () => {
    const yaml = `
id: test-06
journey: explorer
level_range: [4, 6]
raga_id: bhoopali
duration_target_min: 10
xp_award: 30
meta:
  title: T
  subtitle: T
  time_of_day: any
  rasa: shant
phases:
  - id: i
    type: interval_exercise
    interval_pool:
      - [Sa, Pa]
      - [Sa, Ma]
    rounds: 4
    play_count: 2
    answer_mode: listen_then_choose
engine:
  raga_grammar_active: false
  pakad_recognition: false
  ornaments_shown: false
  cents_display: hidden
  accuracy_model: sadhaka
`;
    const def = loadLesson(yaml);
    expect(def.phases[0]!.interval_pool).toEqual([['Sa', 'Pa'], ['Sa', 'Ma']]);
    expect(def.phases[0]!.answer_mode).toBe('listen_then_choose');
  });
});
