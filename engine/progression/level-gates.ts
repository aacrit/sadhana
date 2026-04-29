/**
 * @module engine/progression/level-gates
 *
 * Level-up gates grounded in musical acts (T1.3).
 *
 * The locked design (CLAUDE.md / D+B) says: levels are unlocked by
 * specific musical acts, not XP buckets. This module defines each gate
 * as a pure-function predicate over a structured event log. The same
 * predicates run client-side (preview/optimistic display) and
 * server-side (Postgres function via the same logic, ported) so the
 * gate cannot be tampered with from the client alone.
 *
 * A gate is "earned" when its predicate returns true at least once. The
 * progression table records the timestamp of the first earning. Once
 * earned, a gate cannot be un-earned by a single bad session — the
 * student keeps the milestone.
 *
 * The level mapping is monotonic — each gate corresponds to exactly one
 * level transition. A student who has earned `sadhaka_pakad_mastery`
 * is at level Sadhaka regardless of XP total.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LevelTitle = 'Shishya' | 'Sadhaka' | 'Varistha' | 'Guru';

/** Identifier of a musical-act milestone. */
export type GateId =
  | 'shishya_first_sa'        // detect Sa with confidence ≥ 0.6 once
  | 'sadhaka_pakad_mastery'   // sing Bhairav's pakad within ±20 cents across 3 distinct sessions
  | 'sadhaka_aroha_mastery'   // sing aroha + avaroha of any 3 ragas with avg accuracy ≥ 0.75
  | 'varistha_ornament_skill' // score ≥ 0.7 on andolan in Bhairav AND meend in any raga
  | 'varistha_modulation'     // identify a yaman→yaman_kalyan transition correctly
  | 'guru_full_rendering'     // complete a raga rendering (alap+jod+jhala) ≥ 0.8 score
  ;

/** A single recorded musical-act event. */
export interface ProgressionEvent {
  readonly id: GateId | string;
  readonly userId: string;
  readonly sessionId?: string;
  readonly ragaId?: string;
  /** Timestamp of the act, milliseconds since epoch. */
  readonly t: number;
  /** Numeric value for thresholds (accuracy, score, cents deviation, etc.). */
  readonly value?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Predicate input — what each gate evaluates against. */
export interface ProgressionContext {
  readonly events: readonly ProgressionEvent[];
}

/** A gate definition: identifier + predicate + the level it unlocks. */
export interface LevelGate {
  readonly id: GateId;
  readonly description: string;
  readonly unlocks: LevelTitle;
  readonly predicate: (ctx: ProgressionContext) => boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventsOfId(ctx: ProgressionContext, id: string): readonly ProgressionEvent[] {
  return ctx.events.filter((e) => e.id === id);
}

function distinctSessions(events: readonly ProgressionEvent[]): number {
  const set = new Set<string>();
  for (const e of events) {
    if (e.sessionId) set.add(e.sessionId);
  }
  return set.size;
}

// ---------------------------------------------------------------------------
// Gate definitions
// ---------------------------------------------------------------------------

export const LEVEL_GATES: readonly LevelGate[] = [
  {
    id: 'shishya_first_sa',
    description: 'Detect Sa with clarity ≥ 0.6 once.',
    unlocks: 'Shishya',
    predicate: (ctx) => eventsOfId(ctx, 'sa_detected').length > 0,
  },
  {
    id: 'sadhaka_pakad_mastery',
    description: 'Sing Bhairav\'s pakad within ±20 cents across 3 distinct sessions.',
    unlocks: 'Sadhaka',
    predicate: (ctx) => {
      const passes = eventsOfId(ctx, 'pakad_passed').filter((e) => {
        const cents = e.value ?? Infinity;
        return e.ragaId === 'bhairav' && cents <= 20;
      });
      return distinctSessions(passes) >= 3;
    },
  },
  {
    id: 'sadhaka_aroha_mastery',
    description: 'Aroha + avaroha of any 3 ragas with average accuracy ≥ 0.75.',
    unlocks: 'Sadhaka',
    predicate: (ctx) => {
      const arohaPasses = eventsOfId(ctx, 'aroha_passed').filter((e) => (e.value ?? 0) >= 0.75);
      const distinctRagas = new Set<string>();
      for (const e of arohaPasses) {
        if (e.ragaId) distinctRagas.add(e.ragaId);
      }
      return distinctRagas.size >= 3;
    },
  },
  {
    id: 'varistha_ornament_skill',
    description: 'Andolan in Bhairav (≥ 0.7) AND meend in any raga (≥ 0.7).',
    unlocks: 'Varistha',
    predicate: (ctx) => {
      const andolan = eventsOfId(ctx, 'ornament_score')
        .some((e) => e.metadata?.ornamentId === 'andolan' && e.ragaId === 'bhairav' && (e.value ?? 0) >= 0.7);
      const meend = eventsOfId(ctx, 'ornament_score')
        .some((e) => e.metadata?.ornamentId === 'meend' && (e.value ?? 0) >= 0.7);
      return andolan && meend;
    },
  },
  {
    id: 'varistha_modulation',
    description: 'Identify a yaman→yaman_kalyan transition correctly.',
    unlocks: 'Varistha',
    predicate: (ctx) =>
      eventsOfId(ctx, 'modulation_identified').some((e) => {
        const meta = e.metadata as { from?: string; to?: string } | undefined;
        return meta?.from === 'yaman' && meta?.to === 'yaman_kalyan';
      }),
  },
  {
    id: 'guru_full_rendering',
    description: 'Complete a full raga rendering (alap+jod+jhala) with overall ≥ 0.8.',
    unlocks: 'Guru',
    predicate: (ctx) =>
      eventsOfId(ctx, 'rendering_complete').some((e) => (e.value ?? 0) >= 0.8),
  },
];

const LEVEL_ORDER: readonly LevelTitle[] = ['Shishya', 'Sadhaka', 'Varistha', 'Guru'];

/**
 * Derive the student's current level from their event log.
 * The level is the highest tier where AT LEAST ONE gate has been earned
 * (gates within a tier are alternative paths, not all required).
 */
export function deriveLevel(events: readonly ProgressionEvent[]): LevelTitle {
  const ctx: ProgressionContext = { events };
  let highest: LevelTitle = 'Shishya';
  for (const gate of LEVEL_GATES) {
    if (gate.predicate(ctx)) {
      const idx = LEVEL_ORDER.indexOf(gate.unlocks);
      const cur = LEVEL_ORDER.indexOf(highest);
      if (idx > cur) highest = gate.unlocks;
    }
  }
  return highest;
}

/**
 * Return the set of gate IDs the student has earned given an event log.
 * Useful for the /profile page's progression display ("you have 3 of 6
 * mastery acts complete").
 */
export function earnedGates(events: readonly ProgressionEvent[]): Set<GateId> {
  const ctx: ProgressionContext = { events };
  const out = new Set<GateId>();
  for (const gate of LEVEL_GATES) {
    if (gate.predicate(ctx)) out.add(gate.id);
  }
  return out;
}

/**
 * Return the set of gates the student has NOT yet earned, with their
 * descriptions. Used by the profile page to show "what comes next."
 */
export function pendingGates(
  events: readonly ProgressionEvent[],
): Array<{ id: GateId; description: string; unlocks: LevelTitle }> {
  const earned = earnedGates(events);
  return LEVEL_GATES
    .filter((g) => !earned.has(g.id))
    .map(({ id, description, unlocks }) => ({ id, description, unlocks }));
}
