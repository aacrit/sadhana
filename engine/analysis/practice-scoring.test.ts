/**
 * Tests for practice-scoring — star rating system.
 */

import { describe, it, expect } from 'vitest';
import {
  scoreToStars,
  starsToXp,
  computeXpDelta,
  computePracticeResult,
  PRACTICE_STAGES,
  STAGE_LABELS,
} from './practice-scoring';

// ---------------------------------------------------------------------------
// scoreToStars
// ---------------------------------------------------------------------------

describe('scoreToStars', () => {
  it('returns 3 stars for scores >= 0.80', () => {
    expect(scoreToStars(0.80)).toBe(3);
    expect(scoreToStars(0.95)).toBe(3);
    expect(scoreToStars(1.0)).toBe(3);
  });

  it('returns 2 stars for scores 0.60-0.79', () => {
    expect(scoreToStars(0.60)).toBe(2);
    expect(scoreToStars(0.70)).toBe(2);
    expect(scoreToStars(0.79)).toBe(2);
  });

  it('returns 1 star for scores 0.40-0.59', () => {
    expect(scoreToStars(0.40)).toBe(1);
    expect(scoreToStars(0.50)).toBe(1);
    expect(scoreToStars(0.59)).toBe(1);
  });

  it('returns 0 stars for scores < 0.40', () => {
    expect(scoreToStars(0.0)).toBe(0);
    expect(scoreToStars(0.20)).toBe(0);
    expect(scoreToStars(0.39)).toBe(0);
  });

  it('handles boundary values exactly', () => {
    expect(scoreToStars(0.40)).toBe(1);
    expect(scoreToStars(0.60)).toBe(2);
    expect(scoreToStars(0.80)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// starsToXp
// ---------------------------------------------------------------------------

describe('starsToXp', () => {
  it('maps stars to correct XP values', () => {
    expect(starsToXp(0)).toBe(0);
    expect(starsToXp(1)).toBe(5);
    expect(starsToXp(2)).toBe(15);
    expect(starsToXp(3)).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// computeXpDelta
// ---------------------------------------------------------------------------

describe('computeXpDelta', () => {
  it('awards full XP on first completion', () => {
    expect(computeXpDelta(2, 0)).toBe(15);
    expect(computeXpDelta(3, 0)).toBe(30);
  });

  it('awards only the delta on improvement', () => {
    expect(computeXpDelta(3, 1)).toBe(25); // 30 - 5
    expect(computeXpDelta(3, 2)).toBe(15); // 30 - 15
    expect(computeXpDelta(2, 1)).toBe(10); // 15 - 5
  });

  it('awards 0 if no improvement', () => {
    expect(computeXpDelta(2, 2)).toBe(0);
    expect(computeXpDelta(1, 2)).toBe(0);
    expect(computeXpDelta(1, 3)).toBe(0);
  });

  it('never returns negative', () => {
    expect(computeXpDelta(0, 3)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computePracticeResult
// ---------------------------------------------------------------------------

describe('computePracticeResult', () => {
  it('computes overall as minimum of all stages', () => {
    const result = computePracticeResult([
      { stage: 'swaras', score: 0.90 },
      { stage: 'aroha', score: 0.85 },
      { stage: 'avaroha', score: 0.70 },
      { stage: 'pakad', score: 0.95 },
    ]);

    // Minimum is avaroha at 0.70 → 2 stars
    expect(result.overallScore).toBe(0.70);
    expect(result.overallStars).toBe(2);
    expect(result.passed).toBe(true);
  });

  it('fails if any stage is below 2 stars', () => {
    const result = computePracticeResult([
      { stage: 'swaras', score: 0.90 },
      { stage: 'aroha', score: 0.85 },
      { stage: 'avaroha', score: 0.35 }, // 0 stars — drags overall down
      { stage: 'pakad', score: 0.95 },
    ]);

    expect(result.overallScore).toBe(0.35);
    expect(result.overallStars).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('awards XP based on delta from previous', () => {
    const result = computePracticeResult(
      [
        { stage: 'swaras', score: 0.90 },
        { stage: 'aroha', score: 0.85 },
        { stage: 'avaroha', score: 0.80 },
        { stage: 'pakad', score: 0.82 },
      ],
      1, // previous was 1 star
    );

    // Overall = 0.80 → 3 stars. Previous = 1 star (5 XP). New = 30 XP. Delta = 25.
    expect(result.overallStars).toBe(3);
    expect(result.xpEarned).toBe(25);
  });

  it('handles empty stages', () => {
    const result = computePracticeResult([]);
    expect(result.overallScore).toBe(0);
    expect(result.overallStars).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('records per-stage stars correctly', () => {
    const result = computePracticeResult([
      { stage: 'swaras', score: 0.90 },
      { stage: 'aroha', score: 0.55 },
      { stage: 'avaroha', score: 0.40 },
      { stage: 'pakad', score: 0.30 },
    ]);

    expect(result.stages[0]!.stars).toBe(3);
    expect(result.stages[1]!.stars).toBe(1);
    expect(result.stages[2]!.stars).toBe(1);
    expect(result.stages[3]!.stars).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('PRACTICE_STAGES', () => {
  it('has exactly 4 stages in the correct order', () => {
    expect(PRACTICE_STAGES).toEqual(['swaras', 'aroha', 'avaroha', 'pakad']);
  });
});

describe('STAGE_LABELS', () => {
  it('has labels for all stages', () => {
    for (const stage of PRACTICE_STAGES) {
      expect(STAGE_LABELS[stage]).toBeDefined();
      expect(typeof STAGE_LABELS[stage]).toBe('string');
    }
  });
});
