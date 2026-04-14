/**
 * @module engine/analysis/practice-scoring
 *
 * Star rating system for guided raga practice.
 *
 * Converts accuracy scores (0-1 from the Gaussian accuracy model)
 * into star ratings (0-3), computes overall raga practice results,
 * and calculates XP awards with delta-based anti-farming.
 *
 * Star thresholds are aligned with the engine's Gaussian accuracy
 * curve: the same score at Shishya and Varistha maps to the same
 * star count, but the underlying cents tolerance is different because
 * getAccuracyScore() adjusts sigma per level. This means 3 stars at
 * Shishya (~25 cents tolerance) is genuinely different from 3 stars
 * at Guru (~10 cents tolerance) without needing separate threshold
 * tables.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Star rating: 0 = fail, 1 = attempted, 2 = pass, 3 = mastered. */
export type StarRating = 0 | 1 | 2 | 3;

/** The four stages of guided raga practice. */
export type PracticeStageType = 'swaras' | 'aroha' | 'avaroha' | 'pakad';

/** Result for a single practice stage. */
export interface StageResult {
  readonly stage: PracticeStageType;
  /** Accuracy score (0-1) for this stage. */
  readonly score: number;
  /** Star rating derived from the score. */
  readonly stars: StarRating;
}

/** Overall result for a complete guided practice session. */
export interface PracticeResult {
  /** Per-stage results. */
  readonly stages: readonly StageResult[];
  /** Overall score = minimum across all stage scores. */
  readonly overallScore: number;
  /** Overall star rating = stars for the overall score. */
  readonly overallStars: StarRating;
  /** XP earned (delta from previous best). */
  readonly xpEarned: number;
  /** Whether the student passed (>= 2 stars). */
  readonly passed: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Star thresholds (aligned with Gaussian accuracy model).
 *
 * At each level, getAccuracyScore returns 0.5 exactly at the
 * tolerance boundary. These thresholds map that continuous score
 * to discrete stars:
 *
 *   0.80+ = 3 stars (clean, consistent intonation)
 *   0.60+ = 2 stars (solid, matches min_accuracy unlock threshold)
 *   0.40+ = 1 star  (in the neighbourhood but inconsistent)
 *   < 0.40 = 0 stars (fail)
 */
const STAR_THRESHOLDS: readonly [number, StarRating][] = [
  [0.80, 3],
  [0.60, 2],
  [0.40, 1],
];

/** XP awarded per star level. */
const STAR_XP: Record<StarRating, number> = {
  0: 0,
  1: 5,
  2: 15,
  3: 30,
};

/** The ordered stages of guided practice. */
export const PRACTICE_STAGES: readonly PracticeStageType[] = [
  'swaras',
  'aroha',
  'avaroha',
  'pakad',
];

/** Human-readable stage labels. */
export const STAGE_LABELS: Record<PracticeStageType, string> = {
  swaras: 'Individual Swaras',
  aroha: 'Aroha',
  avaroha: 'Avaroha',
  pakad: 'Pakad',
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/** Converts an accuracy score (0-1) to a star rating (0-3). */
export function scoreToStars(score: number): StarRating {
  for (const [threshold, stars] of STAR_THRESHOLDS) {
    if (score >= threshold) return stars;
  }
  return 0;
}

/** Returns XP for a given star rating. */
export function starsToXp(stars: StarRating): number {
  return STAR_XP[stars];
}

/**
 * Computes the XP delta — only awards the difference between
 * new and previous stars. Prevents XP farming via retries.
 *
 * Example: 1 star (5 XP) improved to 3 stars (30 XP) = 25 XP delta.
 */
export function computeXpDelta(
  newStars: StarRating,
  previousStars: StarRating,
): number {
  return Math.max(0, STAR_XP[newStars] - STAR_XP[previousStars]);
}

/**
 * Computes the overall practice result from per-stage scores.
 *
 * The overall star rating is the MINIMUM across all stages —
 * the student must demonstrate competence at every stage.
 * This prevents someone who nails aroha but cannot sing the
 * pakad from earning a passing grade.
 *
 * @param stageScores - Accuracy scores (0-1) for each stage, in order.
 * @param previousStars - The student's previous best star rating for
 *                        this raga (for delta XP calculation).
 */
export function computePracticeResult(
  stageScores: readonly { stage: PracticeStageType; score: number }[],
  previousStars: StarRating = 0,
): PracticeResult {
  const stages: StageResult[] = stageScores.map(({ stage, score }) => ({
    stage,
    score,
    stars: scoreToStars(score),
  }));

  const scores = stages.map((s) => s.score);
  const overallScore = scores.length > 0 ? Math.min(...scores) : 0;
  const overallStars = scoreToStars(overallScore);
  const xpEarned = computeXpDelta(overallStars, previousStars);
  const passed = overallStars >= 2;

  return { stages, overallScore, overallStars, xpEarned, passed };
}
