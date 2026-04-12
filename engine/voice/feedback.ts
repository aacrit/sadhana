/**
 * @module engine/voice/feedback
 *
 * Maps accuracy data to actionable, terse feedback messages.
 *
 * Feedback in Sadhana is:
 *   - Specific: "23 cents flat on Ga" not "a bit off"
 *   - Musical: uses swara names, raga context, ornament language
 *   - Terse: no praise inflation. Correct is correct, not "Amazing!"
 *   - Contextual: knows the raga, the swara's role, expected ornaments
 *   - Progressive: hints appear after 2+ wrong attempts, not immediately
 *
 * The feedback system does not decide *when* to show feedback — that is
 * the UI layer's responsibility. This module decides *what* to say.
 */

import type { Swara, Raga, Ornament } from '../theory/types';
import type { PitchResult, Level } from '../analysis/pitch-mapping';
import { SWARA_MAP } from '../theory/swaras';
import { LEVEL_TOLERANCE, isValidInRaga } from '../analysis/pitch-mapping';
import { ORNAMENTS } from '../theory/ornaments';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A feedback message for the student.
 */
export interface FeedbackMessage {
  /** The type of feedback. */
  readonly type:
    | 'correct'
    | 'sharp'
    | 'flat'
    | 'wrong_swara'
    | 'ornament_hint'
    | 'raga_violation'
    | 'silence';
  /** The primary message — what the student sees. Terse, specific. */
  readonly message: string;
  /** Technical detail (e.g., "+23 cents"). For display in mono font. */
  readonly technical: string;
  /** A hint that appears after repeated mistakes. */
  readonly hint?: string;
  /** Colour category for the UI: correct / in-progress / needs-work. */
  readonly color: 'correct' | 'in-progress' | 'needs-work';
}

// ---------------------------------------------------------------------------
// Feedback generation
// ---------------------------------------------------------------------------

/**
 * Generates feedback for a single pitch detection result.
 *
 * This is called on every pitch event. It should be fast and deterministic.
 *
 * @param result - The PitchResult from pitch mapping
 * @param raga - The current raga (optional for non-raga exercises)
 * @param level - Student level for tolerance
 * @param consecutiveErrors - Number of consecutive incorrect attempts
 *                            (used to decide when to show hints)
 * @returns A FeedbackMessage
 */
export function generateFeedback(
  result: PitchResult,
  raga?: Raga,
  level: Level = 'shishya',
  consecutiveErrors: number = 0,
): FeedbackMessage {
  const swara = result.nearestSwara;
  const def = SWARA_MAP[swara];
  const deviation = result.deviationCents;
  const tolerance = LEVEL_TOLERANCE[level];

  // Check for raga violation first — wrong swara in the raga
  if (raga && !result.inRagaContext) {
    return buildRagaViolation(swara, raga, deviation, consecutiveErrors);
  }

  // Check if there is an expected ornament
  if (result.expectedOrnament && raga) {
    return buildOrnamentHint(swara, result.expectedOrnament, raga, deviation);
  }

  // Check pitch accuracy
  const absDeviation = Math.abs(deviation);

  if (absDeviation <= tolerance) {
    // Correct pitch
    return buildCorrectFeedback(swara, deviation);
  }

  // Incorrect pitch — sharp or flat
  if (deviation > 0) {
    return buildSharpFeedback(swara, deviation, tolerance, consecutiveErrors);
  } else {
    return buildFlatFeedback(swara, deviation, tolerance, consecutiveErrors);
  }
}

/**
 * Generates a silence feedback message.
 * Shown when no pitch is detected for a sustained period.
 */
export function generateSilenceFeedback(): FeedbackMessage {
  return {
    type: 'silence',
    message: 'Listening...',
    technical: '',
    color: 'in-progress',
  };
}

// ---------------------------------------------------------------------------
// Feedback builders
// ---------------------------------------------------------------------------

function buildCorrectFeedback(swara: Swara, deviation: number): FeedbackMessage {
  const def = SWARA_MAP[swara];
  const sign = deviation >= 0 ? '+' : '';

  return {
    type: 'correct',
    message: `${def.name} (${def.sargamAbbr})`,
    technical: `${sign}${Math.round(deviation)} cents`,
    color: 'correct',
  };
}

function buildSharpFeedback(
  swara: Swara,
  deviation: number,
  tolerance: number,
  consecutiveErrors: number,
): FeedbackMessage {
  const def = SWARA_MAP[swara];
  const centsOver = Math.round(deviation);

  return {
    type: 'sharp',
    message: `${def.sargamAbbr} sharp`,
    technical: `+${centsOver} cents`,
    hint: consecutiveErrors >= 2
      ? `Lower your pitch slightly. You are ${centsOver} cents above ${def.name}.`
      : undefined,
    color: deviation <= tolerance * 1.5 ? 'in-progress' : 'needs-work',
  };
}

function buildFlatFeedback(
  swara: Swara,
  deviation: number,
  tolerance: number,
  consecutiveErrors: number,
): FeedbackMessage {
  const def = SWARA_MAP[swara];
  const centsUnder = Math.round(Math.abs(deviation));

  return {
    type: 'flat',
    message: `${def.sargamAbbr} flat`,
    technical: `-${centsUnder} cents`,
    hint: consecutiveErrors >= 2
      ? `Raise your pitch slightly. You are ${centsUnder} cents below ${def.name}.`
      : undefined,
    color: Math.abs(deviation) <= tolerance * 1.5 ? 'in-progress' : 'needs-work',
  };
}

function buildRagaViolation(
  swara: Swara,
  raga: Raga,
  deviation: number,
  consecutiveErrors: number,
): FeedbackMessage {
  const def = SWARA_MAP[swara];

  return {
    type: 'raga_violation',
    message: `${def.sargamAbbr} not in ${raga.name}`,
    technical: `${Math.round(Math.abs(deviation))} cents from ${def.name}`,
    hint: consecutiveErrors >= 2
      ? `${def.name} (${def.sargamAbbr}) is not used in Raga ${raga.name}. ` +
        `This raga uses: ${ragaSwaraList(raga)}.`
      : undefined,
    color: 'needs-work',
  };
}

function buildOrnamentHint(
  swara: Swara,
  ornamentType: Ornament,
  raga: Raga,
  deviation: number,
): FeedbackMessage {
  const def = SWARA_MAP[swara];
  const ornamentDef = ORNAMENTS[ornamentType];
  const ornamentName = ornamentDef?.name ?? ornamentType;

  return {
    type: 'ornament_hint',
    message: `${def.sargamAbbr} with ${ornamentName}`,
    technical: `${Math.round(Math.abs(deviation))} cents`,
    hint: `In ${raga.name}, ${def.name} is traditionally sung with ${ornamentName.toLowerCase()}.`,
    color: Math.abs(deviation) < 25 ? 'correct' : 'in-progress',
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produces a human-readable list of swaras in a raga, in sargam notation.
 * E.g., "S R G M P D N" for Bhoopali.
 */
function ragaSwaraList(raga: Raga): string {
  const swarasInAroha = raga.aroha.map((n) => {
    const def = SWARA_MAP[n.swara];
    return def.sargamAbbr;
  });

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const s of swarasInAroha) {
    if (!seen.has(s)) {
      seen.add(s);
      unique.push(s);
    }
  }

  return unique.join(' ');
}
