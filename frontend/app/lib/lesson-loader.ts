/**
 * @module frontend/lib/lesson-loader
 *
 * Loads and parses YAML lesson files and their copy overlays into typed
 * TypeScript objects that the LessonRenderer state machine consumes.
 *
 * Architecture:
 *   1. Import YAML files as raw strings (via Next.js raw-loader or fetch)
 *   2. Parse with js-yaml
 *   3. Merge copy overlay onto phase definitions
 *   4. Return a fully typed LessonDef
 */

import yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Phase types that the lesson engine supports. */
export type PhaseType =
  | 'tanpura_drone'
  | 'sa_detection'
  | 'swara_introduction'
  | 'phrase_playback'
  | 'pitch_exercise'
  | 'phrase_exercise'
  | 'call_response'
  | 'passive_phrase_recognition'
  | 'session_summary'
  // Guided listening / sing-along
  | 'raga_opening'      // Listen to tanpura + raga intro, no interaction
  | 'sing_along'        // Teacher phrase plays, student echoes immediately
  // Ornament phases
  | 'ornament_exercise'
  | 'andolan'
  | 'meend'
  // Raga recognition / comparison
  | 'raga_identification'
  | 'raga_comparison'
  | 'raga_comparison_advanced'
  | 'raga_identification_advanced'
  // Assessment
  | 'mastery_challenge'
  // Swara / interval / tala / grammar
  | 'swara_comparison'
  | 'interval_exercise'
  | 'tala_exercise'
  | 'tala_melody_exercise'
  | 'grammar_exercise'
  // Advanced
  | 'bandish_exercise'
  | 'composition_exercise'
  | 'taan_exercise'
  | 'teaching_exercise'
  | 'raga_rendering'
  | 'modulation_awareness'
  | 'controlled_deviation'
  | 'shruti_exercise'
  | 'ornament_context_exercise';

/** A single phase definition, merged with copy overlay. */
export interface LessonPhase {
  readonly id: string;
  readonly type: PhaseType;
  readonly instruction?: string;

  // Copy overlay fields (from -copy.yaml)
  readonly screenTitle?: string;
  readonly body?: string;
  readonly feedback?: Readonly<Record<string, string>>;

  // Type-specific fields (vary by phase type)
  // tanpura_drone
  readonly duration_s?: number;
  readonly tanpura?: {
    readonly strings: readonly string[];
    readonly sa_hz: number | null;
  };
  /**
   * Per-phase tanpura presence override.
   * - 'full'  — play at normal volume (0.3)
   * - 'duck'  — play at ducked volume (0.35 × base = ~0.1), for focus phases
   * - 'off'   — silence the drone entirely during this phase (ramp to 0)
   *
   * Overrides the default PHASE_TANPURA_GAIN map in useLessonEngine. Use
   * sparingly — the default map already picks sensible presence per phase
   * type (ducked during singing/focus, full during listening).
   */
  readonly tanpura_presence?: 'full' | 'duck' | 'off';

  // sa_detection
  readonly attempts?: number;
  readonly min_clarity?: number;
  readonly fallback_hz?: number;
  readonly skip_if?: string;

  // swara_introduction
  readonly swaras?: readonly string[];
  readonly presentation?: 'sequential' | 'comparison';
  readonly audio_first?: boolean;

  // phrase_playback / phrase_exercise
  readonly phrase?: readonly string[];
  readonly repeat?: number;
  readonly show_labels?: boolean;
  readonly guide_tone?: boolean;
  readonly feedback_layer?: 'minimal' | 'standard' | 'full';

  // pitch_exercise
  readonly target_swara?: string | null;
  readonly level_tolerance?: string;
  readonly allowed_swaras?: readonly string[];

  // call_response
  // Note: YAML may use scalar strings (`engine_plays: Sa`) OR arrays
  // (`engine_plays: [Sa, Pa]`). Renderer normalises both shapes.
  readonly rounds?: number;
  readonly calls?: readonly {
    readonly engine_plays: string | readonly string[];
    readonly student_sings: string | readonly string[];
  }[];
  readonly call_phrase?: readonly string[];
  readonly response_cycles?: number;

  // passive_phrase_recognition
  readonly watch_for_pakad?: boolean;
  readonly pakad_reward?: {
    readonly xp_bonus?: number;
    readonly ceremony?: string;
  };

  // session_summary
  readonly show_accuracy?: boolean;
  readonly show_streak?: boolean;
  readonly message?: string;

  // ornament_exercise / andolan / meend
  readonly ornament_type?: string;
  readonly from_swara?: string;
  readonly to_swara?: string;
  readonly evaluation?: Readonly<Record<string, unknown>>;
  readonly ornaments_shown?: boolean;

  // raga_identification / raga_comparison
  readonly raga_pool?: readonly string[];
  readonly selection?: string;
  readonly pakad_plays?: number;
  readonly student_response?: string;
  readonly response_duration_s?: number;
  readonly raga?: string;
  readonly pakad_phrase?: readonly string[];

  // mastery_challenge
  readonly challenge_id?: string;
  readonly targets?: readonly Readonly<{
    swara: string;
    hold_duration_s: number;
    tolerance_cents: number;
  }>[];
  readonly min_accuracy?: number;
  readonly attempts_allowed?: number;
  readonly student_chooses?: number;
  readonly exercise_per_raga?: readonly Readonly<Record<string, unknown>>[];
  readonly tolerance_cents?: number;

  // tala_exercise / tala_melody_exercise
  readonly tala?: string;
  readonly tala_id?: string;
  readonly beats?: number;
  readonly cycles?: number;
  readonly tempo_bpm?: number;
  readonly exercise?: string;
  readonly timing_tolerance_ms?: number;
  readonly highlight_sam?: boolean;
  readonly show_beat_markers?: boolean;
  readonly mode?: string;            // tala/raga modes: listen, sing, listen_only, alap, jod, jhala
  readonly raga_id?: string;

  // interval_exercise
  readonly interval_pool?: readonly (readonly [string, string])[];
  readonly play_count?: number;
  readonly answer_mode?: string;     // listen_then_choose, sing, ...

  // bandish / composition / taan
  readonly base_phrase?: readonly string[];
  readonly call_phrase_alt?: readonly string[];

  // mastery_challenge / passive_phrase_recognition
  readonly min_match_confidence?: number;

  // grammar_exercise
  readonly grammar_rule?: string;
  readonly forbidden_swara?: string;

  // interval_exercise
  readonly interval?: string;
  readonly from?: string;
  readonly to?: string;

  // swara_comparison
  readonly swara_a?: string;
  readonly swara_b?: string;
  readonly compare_ragas?: readonly string[];

  // Copy overlay extras
  readonly swara_reveal_delay_ms?: number;
  readonly prompt?: string;
  readonly calibrating_message?: string;
  readonly success_message?: string;
  readonly pakad_found_headline?: string;
  readonly pakad_found_subtext?: string;
  readonly xp_line?: string;
  readonly streak_line?: string;
}

/** Engine configuration for the lesson. */
export interface LessonEngine {
  readonly raga_grammar_active: boolean;
  readonly pakad_recognition: boolean;
  readonly ornaments_shown: boolean;
  readonly cents_display: 'hidden' | 'on_tap' | 'visible';
  readonly accuracy_model: string;
}

/** Unlock condition for the next lesson. */
export interface UnlockCondition {
  readonly lesson_id: string;
  readonly requires: {
    readonly min_sessions: number;
    readonly min_accuracy: number;
  };
}

/** Complete lesson definition, ready for the state machine. */
export interface LessonDef {
  readonly id: string;
  readonly journey: string;
  readonly level_range: readonly [number, number];
  readonly raga_id: string;
  readonly duration_target_min: number;
  readonly xp_award: number;
  readonly meta: {
    readonly title: string;
    readonly subtitle: string;
    readonly time_of_day: string;
    readonly rasa: string;
  };
  readonly phases: readonly LessonPhase[];
  readonly engine: LessonEngine;
  readonly unlock_next?: UnlockCondition;

  // From copy overlay
  readonly theory_note?: { readonly title: string; readonly body: string };
  readonly western_bridge?: { readonly title: string; readonly body: string };
  readonly cultural_note?: { readonly title: string; readonly body: string };
}

// ---------------------------------------------------------------------------
// Raw YAML types (before copy merge)
// ---------------------------------------------------------------------------

interface RawLessonYaml {
  id: string;
  journey: string;
  level_range: [number, number];
  raga_id: string;
  duration_target_min: number;
  xp_award: number;
  meta: {
    title: string;
    subtitle: string;
    time_of_day: string;
    rasa: string;
  };
  phases: RawPhase[];
  engine: LessonEngine;
  unlock_next?: UnlockCondition;
}

interface RawPhase {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface RawCopyYaml {
  lesson_id: string;
  phases: Record<string, Record<string, unknown>>;
  theory_note?: { title: string; body: string };
  western_bridge?: { title: string; body: string };
  cultural_note?: { title: string; body: string };
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parses a YAML string into a raw lesson object.
 */
function parseLessonYaml(yamlStr: string): RawLessonYaml {
  const doc = yaml.load(yamlStr) as RawLessonYaml;
  if (!doc || !doc.id || !Array.isArray(doc.phases)) {
    throw new Error('Invalid lesson YAML: missing id or phases');
  }
  return doc;
}

/**
 * Parses a copy overlay YAML string.
 */
function parseCopyYaml(yamlStr: string): RawCopyYaml {
  const doc = yaml.load(yamlStr) as RawCopyYaml;
  if (!doc || !doc.phases) {
    throw new Error('Invalid copy YAML: missing phases');
  }
  return doc;
}

/**
 * Merges copy overlay fields onto a raw phase.
 * Copy wins for display fields (screen_title, body, feedback, etc.).
 * Phase YAML wins for engine fields (duration_s, swaras, etc.).
 */
function mergePhaseWithCopy(
  phase: RawPhase,
  copy: Record<string, unknown> | undefined,
): LessonPhase {
  if (!copy) {
    return phase as unknown as LessonPhase;
  }

  // Copy fields override display fields; phase fields are preserved
  return {
    ...phase,
    screenTitle: (copy.screen_title as string) ?? (phase as Record<string, unknown>).screenTitle as string,
    body: (copy.body as string) ?? (phase as Record<string, unknown>).body as string,
    feedback: copy.feedback as Record<string, string> | undefined,
    swara_reveal_delay_ms: copy.swara_reveal_delay_ms as number | undefined,
    prompt: copy.prompt as string | undefined,
    calibrating_message: copy.calibrating_message as string | undefined,
    success_message: copy.success_message as string | undefined,
    pakad_found_headline: copy.pakad_found_headline as string | undefined,
    pakad_found_subtext: copy.pakad_found_subtext as string | undefined,
    xp_line: copy.xp_line as string | undefined,
    streak_line: copy.streak_line as string | undefined,
  } as LessonPhase;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Loads a lesson from YAML strings (lesson + optional copy overlay).
 *
 * @param lessonYaml - Raw YAML string for the lesson structure
 * @param copyYaml - Optional raw YAML string for the copy overlay
 * @returns A fully typed LessonDef ready for the state machine
 */
export function loadLesson(
  lessonYaml: string,
  copyYaml?: string,
): LessonDef {
  const raw = parseLessonYaml(lessonYaml);
  const copy = copyYaml ? parseCopyYaml(copyYaml) : null;

  const phases = raw.phases.map((phase) => {
    const phaseCopy = copy?.phases[phase.id];
    return mergePhaseWithCopy(phase, phaseCopy);
  });

  return {
    id: raw.id,
    journey: raw.journey,
    level_range: raw.level_range,
    raga_id: raw.raga_id,
    duration_target_min: raw.duration_target_min,
    xp_award: raw.xp_award,
    meta: raw.meta,
    phases,
    engine: raw.engine,
    unlock_next: raw.unlock_next,
    theory_note: copy?.theory_note,
    western_bridge: copy?.western_bridge,
    cultural_note: copy?.cultural_note,
  };
}

/**
 * Fetches and loads a lesson by ID from the content/curriculum directory.
 *
 * This fetches the YAML files at runtime using Next.js public directory
 * or API routes. For static generation, import the YAML at build time.
 *
 * @param lessonId - The lesson ID (e.g., 'beginner-01-bhoopali')
 * @returns A fully typed LessonDef
 */
export async function fetchLesson(lessonId: string): Promise<LessonDef> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

  const [lessonRes, copyRes] = await Promise.all([
    fetch(`${basePath}/curriculum/${lessonId}.yaml`),
    fetch(`${basePath}/curriculum/${lessonId}-copy.yaml`).catch(() => null),
  ]);

  if (!lessonRes.ok) {
    throw new Error(`Lesson not found: ${lessonId}`);
  }

  const lessonYaml = await lessonRes.text();
  const copyYaml = copyRes?.ok ? await copyRes.text() : undefined;

  return loadLesson(lessonYaml, copyYaml);
}
