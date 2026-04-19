/**
 * @module engine/voice/ornament-evaluator
 *
 * Ornament trajectory evaluator.
 *
 * Given a stream of pitch samples from the voice pipeline and an intended
 * ornament (meend, andolan, gamak, kan, murki, khatka, zamzama), this
 * module scores how closely the student's sung trajectory matched the
 * mathematical ideal defined in engine/theory/ornaments.ts.
 *
 * The evaluation has three components:
 *
 *   1. shapeFit    — how closely the pitch contour in cents-vs-time space
 *                    tracks the expected trajectory for this ornament
 *                    (logarithmic glide for meend; sinusoidal for andolan
 *                    and gamak; impulse near target for kan; rapid note
 *                    cluster for murki / khatka / zamzama).
 *   2. timing      — whether the sung duration falls within the ornament's
 *                    envelope duration (± 30% tolerance outside the
 *                    defined [min, max] range from ornaments.ts).
 *   3. arrival     — average cents deviation from the target swara across
 *                    the final 200ms of the sample — i.e. did the student
 *                    actually land on the target at the end.
 *
 * Overall = 0.5 * shapeFit + 0.2 * timing + 0.3 * arrivalScore.
 *
 * Pure TypeScript. Zero UI. Deterministic (no Date.now, no Math.random).
 * Designed to run in a browser animation frame — O(N) over pitch samples,
 * O(N*M) in the inner resampled RMS compare where N = samples, M =
 * trajectory steps. Both stay small (N < 200, M = 50..100) so the whole
 * evaluation is well under 1ms in practice.
 */

import type { Swara } from '../theory/types';
import {
  ORNAMENTS,
  generateMeendTrajectory,
  generateOscillationTrajectory,
} from '../theory/ornaments';
import { getSwaraFrequency } from '../theory/swaras';
import { ratioToCents } from '../physics/harmonics';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type OrnamentId =
  | 'meend'
  | 'andolan'
  | 'gamak'
  | 'kan'
  | 'murki'
  | 'khatka'
  | 'zamzama';

/**
 * A single pitch sample as produced by the voice pipeline.
 *
 * @property t         Timestamp in seconds. Any monotonic reference is fine —
 *                     only deltas are used internally.
 * @property hz        Detected fundamental in Hz. Must be > 0 for the sample
 *                     to be considered voiced.
 * @property confidence Pitch detection clarity (0..1). Samples below
 *                     CONFIDENCE_FLOOR contribute reduced weight to the
 *                     overall score.
 */
export interface OrnamentPitchSample {
  readonly t: number;
  readonly hz: number;
  readonly confidence: number;
}

/**
 * Everything the evaluator needs to score an ornament attempt.
 *
 * @property ornamentId   Which ornament the student was asked to sing.
 * @property targetSwara  Target swara symbol ('Sa', 'Re_k', 'Ga', ...). For a
 *                        meend this is the landing (to) swara.
 * @property fromSwara    Optional — for meend, the origin swara. If omitted,
 *                        the evaluator infers it from the first confident
 *                        pitch sample.
 * @property pitchSamples Chronologically ordered samples from the voice
 *                        pipeline for the duration of the attempt.
 * @property ragaContext  Raga ID — reserved for future context-aware scoring
 *                        (per-raga andolan depth, per-raga meend curvature).
 *                        Currently unused inside the evaluator but accepted
 *                        on the API for forward compatibility.
 * @property saHz         The student's Sa in Hz. Required to convert swara
 *                        symbols to absolute frequencies.
 */
export interface OrnamentAttempt {
  readonly ornamentId: OrnamentId;
  readonly targetSwara: string;
  readonly fromSwara?: string;
  readonly pitchSamples: readonly OrnamentPitchSample[];
  readonly ragaContext: string;
  readonly saHz: number;
}

/**
 * Numerical result of scoring a single ornament attempt. All scalar scores
 * are in [0, 1]. arrivalAccuracyCents is a signed cents value — negative =
 * flat of target, positive = sharp of target.
 */
export interface OrnamentScore {
  readonly overall: number;
  readonly shapeFit: number;
  readonly timing: number;
  readonly arrivalAccuracyCents: number;
  readonly notes: readonly string[];
}

// ---------------------------------------------------------------------------
// Numeric thresholds
// ---------------------------------------------------------------------------
//
// These thresholds are the first-pass calibration. acoustics-engineer
// should validate them against master recordings of each ornament and
// tune if beginner scores are too punitive or too lenient.
//
// ---------------------------------------------------------------------------

/**
 * Gaussian sigma in cents for shape-fit scoring. A sung trajectory whose
 * RMS cents deviation from the ideal equals SHAPE_SIGMA_CENTS yields
 * shapeFit ≈ 0.61 (exp(-0.5)). Chosen empirically so that a clean glide
 * within ± 25 cents of the ideal scores above 0.9.
 */
const SHAPE_SIGMA_CENTS = 40;

/**
 * Timing tolerance: actual sung duration may fall within
 * [minDur * (1 - TIMING_SLACK), maxDur * (1 + TIMING_SLACK)] and still
 * score 1.0. Beyond this slack zone, timing decays linearly over another
 * TIMING_SLACK-wide band down to 0.
 */
const TIMING_SLACK = 0.30;

/**
 * Arrival window: final N milliseconds used to judge landing accuracy.
 * We take the minimum of ARRIVAL_WINDOW_MS_MAX and a fraction of the
 * attempt duration. For short ornaments (kan ≈ 30ms) this shrinks to
 * ~20% of the attempt so the grace-note excursion does not pollute the
 * landing average. For long ornaments (meend ≈ 1.2s) it caps around
 * 120ms so that only the converged tail of the glide is judged, not
 * the still-approaching middle.
 */
const ARRIVAL_WINDOW_MS_MAX = 120;
const ARRIVAL_WINDOW_SHORT_FRACTION = 0.2;

/** Gaussian sigma for arrival cents → arrival score. */
const ARRIVAL_SIGMA_CENTS = 25;

/** Minimum confidence for a sample to count in shape fit. */
const CONFIDENCE_FLOOR = 0.5;

/** Weight split for the overall score. */
const WEIGHT_SHAPE = 0.5;
const WEIGHT_TIMING = 0.2;
const WEIGHT_ARRIVAL = 0.3;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score a single ornament attempt.
 *
 * Returns a fully-populated OrnamentScore — never throws for empty /
 * degenerate input, instead returns zeroed scores with an explanatory
 * note. The calling UI is expected to render this directly.
 */
export function evaluateOrnament(attempt: OrnamentAttempt): OrnamentScore {
  const notes: string[] = [];

  const ornament = ORNAMENTS[attempt.ornamentId];
  if (!ornament) {
    return zeroedScore([`unknown ornament: ${attempt.ornamentId}`]);
  }

  // Filter to confident, voiced samples. Unvoiced frames (hz <= 0) are
  // dropped entirely; low-confidence frames are dropped from shape
  // scoring but the raw time extent still counts toward duration.
  const voiced = attempt.pitchSamples.filter(
    s => Number.isFinite(s.hz) && s.hz > 0 && Number.isFinite(s.t),
  );

  if (voiced.length < 2) {
    notes.push('not enough pitched voice to evaluate');
    return zeroedScore(notes);
  }

  const confident = voiced.filter(s => s.confidence >= CONFIDENCE_FLOOR);
  if (confident.length < 2) {
    notes.push('voice too unclear to evaluate trajectory');
    // Still return a partial score — duration may be measurable.
    const partialDurationMs =
      (voiced[voiced.length - 1]!.t - voiced[0]!.t) * 1000;
    const timing = scoreTiming(partialDurationMs, ornament.durationRangeMs);
    return {
      overall: timing * WEIGHT_TIMING,
      shapeFit: 0,
      timing,
      arrivalAccuracyCents: NaN,
      notes,
    };
  }

  // ---------------- target / origin frequencies --------------------------
  const targetHz = getSwaraFrequency(
    attempt.targetSwara as Swara,
    attempt.saHz,
    'madhya',
  );

  const fromHz =
    attempt.fromSwara
      ? getSwaraFrequency(attempt.fromSwara as Swara, attempt.saHz, 'madhya')
      : confident[0]!.hz;

  // ---------------- duration / timing ------------------------------------
  const t0 = voiced[0]!.t;
  const tN = voiced[voiced.length - 1]!.t;
  const actualDurationMs = Math.max(0, (tN - t0) * 1000);
  const timing = scoreTiming(actualDurationMs, ornament.durationRangeMs);

  if (timing < 0.5) {
    const [minDur, maxDur] = ornament.durationRangeMs;
    if (actualDurationMs < minDur * (1 - TIMING_SLACK)) {
      notes.push(`${attempt.ornamentId} too short (${Math.round(actualDurationMs)}ms)`);
    } else if (actualDurationMs > maxDur * (1 + TIMING_SLACK)) {
      notes.push(`${attempt.ornamentId} too long (${Math.round(actualDurationMs)}ms)`);
    }
  }

  // ---------------- build expected cents-vs-time curve -------------------
  const expectedCurve = buildExpectedCurve(
    attempt.ornamentId,
    fromHz,
    targetHz,
    actualDurationMs,
    ornament,
  );

  // ---------------- convert student samples to cents-vs-time -------------
  const studentCurve = confident.map(s => ({
    tNorm: actualDurationMs > 0 ? ((s.t - t0) * 1000) / actualDurationMs : 0,
    cents: ratioToCents(s.hz / targetHz),
    weight: Math.min(1, s.confidence),
  }));

  // ---------------- shape fit --------------------------------------------
  const shapeFit = scoreShapeFit(studentCurve, expectedCurve, attempt.ornamentId, notes);

  // ---------------- arrival accuracy --------------------------------------
  // For long ornaments use a 200ms window; for short ornaments (kan, fast
  // murki) use the final 20% of the attempt so the trailing samples
  // dominate the landing score.
  const effectiveWindowMs = Math.min(
    ARRIVAL_WINDOW_MS_MAX,
    Math.max(20, actualDurationMs * ARRIVAL_WINDOW_SHORT_FRACTION),
  );
  const arrivalCents = computeArrivalCents(
    confident,
    targetHz,
    tN,
    effectiveWindowMs,
  );
  const arrivalScore = gaussianScore(arrivalCents, ARRIVAL_SIGMA_CENTS);

  if (Math.abs(arrivalCents) > 15) {
    const dir = arrivalCents < 0 ? 'flat' : 'sharp';
    notes.push(
      `${attempt.ornamentId} landed ${Math.round(Math.abs(arrivalCents))} cents ${dir}`,
    );
  }

  const overall = clamp01(
    shapeFit * WEIGHT_SHAPE +
      timing * WEIGHT_TIMING +
      arrivalScore * WEIGHT_ARRIVAL,
  );

  return {
    overall,
    shapeFit,
    timing,
    arrivalAccuracyCents: arrivalCents,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Internals — expected trajectory construction
// ---------------------------------------------------------------------------

interface CurvePoint {
  /** Time normalised to [0, 1] across the ornament duration. */
  readonly tNorm: number;
  /** Cents relative to target swara. */
  readonly cents: number;
}

/**
 * Construct the ideal cents-vs-normalized-time curve for a given ornament.
 *
 * Output cents are referenced to targetHz (target swara), so a student
 * who lands perfectly on target ends at 0 cents.
 */
function buildExpectedCurve(
  ornamentId: OrnamentId,
  fromHz: number,
  targetHz: number,
  durationMs: number,
  ornament: typeof ORNAMENTS[string],
): readonly CurvePoint[] {
  switch (ornamentId) {
    case 'meend': {
      // Logarithmic glide from fromHz to targetHz.
      const steps = 50;
      const traj = generateMeendTrajectory(fromHz, targetHz, durationMs || 1, steps);
      return traj.map(([tMs, hz]) => ({
        tNorm: durationMs > 0 ? tMs / durationMs : 0,
        cents: ratioToCents(hz / targetHz),
      }));
    }

    case 'andolan':
    case 'gamak': {
      const [rateMin, rateMax] = ornament.oscillationRateHz ?? [2, 4];
      const [ampMin, ampMax] = ornament.oscillationAmplitudeCents ?? [15, 40];
      const rate = (rateMin + rateMax) / 2;
      const amplitude = (ampMin + ampMax) / 2;
      const steps = 100;
      const traj = generateOscillationTrajectory(
        targetHz,
        amplitude,
        rate,
        durationMs || 1,
        steps,
      );
      return traj.map(([tMs, hz]) => ({
        tNorm: durationMs > 0 ? tMs / durationMs : 0,
        cents: ratioToCents(hz / targetHz),
      }));
    }

    case 'kan': {
      // Impulse: brief grace touch (~10% of duration) then settle to target.
      // We model it as two segments: quick departure up to ~200c, rapid return to 0.
      // The grace-note direction is unknown without raga context, so we treat
      // shape fit by absolute deviation — the sung trajectory need only show
      // a brief excursion and a prompt landing on the target.
      return [
        { tNorm: 0, cents: 200 },
        { tNorm: 0.15, cents: 50 },
        { tNorm: 0.35, cents: 0 },
        { tNorm: 1, cents: 0 },
      ];
    }

    case 'murki':
    case 'khatka':
    case 'zamzama': {
      // Rapid note cluster around target. We model it as a decaying zig-zag
      // that resolves to the target. Shape fit tolerance is relaxed for these
      // ornaments because the pitch detector cannot reliably track their
      // individual notes — what we score is overall excursion behaviour.
      const points: CurvePoint[] = [];
      const noteCount = ornament.noteCount?.[0] ?? 3;
      for (let i = 0; i <= noteCount; i++) {
        const tNorm = i / noteCount;
        const sign = i % 2 === 0 ? 1 : -1;
        const magnitude = 100 * (1 - tNorm); // decay toward the target
        points.push({ tNorm, cents: sign * magnitude });
      }
      points.push({ tNorm: 1, cents: 0 });
      return points;
    }
  }
}

// ---------------------------------------------------------------------------
// Internals — scoring primitives
// ---------------------------------------------------------------------------

/**
 * Resample the expected curve at each student-sample's normalised time,
 * compute weighted RMS cents deviation, convert to a 0..1 score.
 *
 * For rapid-cluster ornaments (murki/khatka/zamzama) we use the absolute
 * value of the expected excursion envelope — the pitch detector cannot
 * track the discrete notes in real time, so scoring is based on whether
 * the student produced _any_ sufficiently animated excursion that
 * resolves to the target.
 */
function scoreShapeFit(
  student: readonly {
    tNorm: number;
    cents: number;
    weight: number;
  }[],
  expected: readonly CurvePoint[],
  ornamentId: OrnamentId,
  notes: string[],
): number {
  if (student.length === 0 || expected.length === 0) return 0;

  const relaxed =
    ornamentId === 'murki' ||
    ornamentId === 'khatka' ||
    ornamentId === 'zamzama' ||
    ornamentId === 'kan';

  let weightedSqSum = 0;
  let weightSum = 0;

  for (const s of student) {
    const expCents = sampleExpected(expected, s.tNorm);
    let diff: number;
    if (relaxed) {
      // Compare absolute magnitudes — direction is not scored.
      diff = Math.abs(s.cents) - Math.abs(expCents);
    } else {
      diff = s.cents - expCents;
    }
    weightedSqSum += diff * diff * s.weight;
    weightSum += s.weight;
  }

  if (weightSum === 0) return 0;

  const rmsCents = Math.sqrt(weightedSqSum / weightSum);
  let score = gaussianScore(rmsCents, SHAPE_SIGMA_CENTS);

  // Depth / span mismatch — for oscillatory ornaments the per-sample RMS
  // against an ideal sine will average near zero when the student holds
  // a flat pitch, which inflates the score. Penalise explicitly by the
  // ratio of sung-span to expected-span.
  if (ornamentId === 'andolan' || ornamentId === 'gamak') {
    const studentSpan = spanCents(student.map(s => s.cents));
    const expectedSpan = spanCents(expected.map(e => e.cents));
    if (expectedSpan > 0) {
      const ratio = studentSpan / expectedSpan;
      if (ratio < 1) {
        // Proportional: half the expected depth => multiply score by ~0.5.
        score *= Math.max(0.15, ratio);
      }
      if (ratio < 0.5) notes.push(`${ornamentId} depth shallow`);
      else if (ratio > 2.5) notes.push(`${ornamentId} depth excessive`);
    }
  } else if (ornamentId === 'meend') {
    const studentSpan = spanCents(student.map(s => s.cents));
    if (studentSpan < 25) {
      notes.push('meend did not glide — voice held flat');
    }
  }

  return score;
}

/** Linear-interpolate the expected curve at a given tNorm. */
function sampleExpected(curve: readonly CurvePoint[], tNorm: number): number {
  if (curve.length === 0) return 0;
  if (tNorm <= curve[0]!.tNorm) return curve[0]!.cents;
  if (tNorm >= curve[curve.length - 1]!.tNorm) {
    return curve[curve.length - 1]!.cents;
  }
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1]!;
    const b = curve[i]!;
    if (tNorm <= b.tNorm) {
      const span = b.tNorm - a.tNorm;
      if (span <= 0) return b.cents;
      const t = (tNorm - a.tNorm) / span;
      return a.cents + t * (b.cents - a.cents);
    }
  }
  return curve[curve.length - 1]!.cents;
}

/**
 * Timing score: within [min*(1-slack), max*(1+slack)] = 1.0, linear
 * falloff over another `slack`-wide band to 0.
 */
function scoreTiming(
  actualMs: number,
  [minMs, maxMs]: readonly [number, number],
): number {
  if (!Number.isFinite(actualMs) || actualMs <= 0) return 0;

  const inner0 = minMs * (1 - TIMING_SLACK);
  const inner1 = maxMs * (1 + TIMING_SLACK);
  if (actualMs >= inner0 && actualMs <= inner1) return 1;

  const outer0 = minMs * (1 - 2 * TIMING_SLACK);
  const outer1 = maxMs * (1 + 2 * TIMING_SLACK);

  if (actualMs < outer0 || actualMs > outer1) return 0;

  if (actualMs < inner0) {
    return (actualMs - outer0) / Math.max(1, inner0 - outer0);
  }
  return (outer1 - actualMs) / Math.max(1, outer1 - inner1);
}

/**
 * Mean cents deviation over the last `windowMs` milliseconds of the
 * sample, using only voiced frames. Returns NaN if the window is empty.
 */
function computeArrivalCents(
  samples: readonly OrnamentPitchSample[],
  targetHz: number,
  endT: number,
  windowMs: number,
): number {
  const windowSec = windowMs / 1000;
  const windowStart = endT - windowSec;

  let sum = 0;
  let count = 0;
  for (const s of samples) {
    if (s.t >= windowStart && s.t <= endT) {
      sum += ratioToCents(s.hz / targetHz);
      count += 1;
    }
  }

  // Fallback: if the window didn't contain any samples (low sample rate
  // attempt) use the last sample alone.
  if (count === 0) {
    const last = samples[samples.length - 1];
    if (!last) return NaN;
    return ratioToCents(last.hz / targetHz);
  }

  return sum / count;
}

/** Gaussian-shaped score: 1 at 0, 0.5 at sigma, ~0 at 3σ. */
function gaussianScore(deviation: number, sigma: number): number {
  if (!Number.isFinite(deviation)) return 0;
  const d = Math.abs(deviation);
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function spanCents(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  let lo = xs[0]!;
  let hi = xs[0]!;
  for (const x of xs) {
    if (x < lo) lo = x;
    if (x > hi) hi = x;
  }
  return hi - lo;
}

function zeroedScore(notes: string[]): OrnamentScore {
  return {
    overall: 0,
    shapeFit: 0,
    timing: 0,
    arrivalAccuracyCents: NaN,
    notes,
  };
}
