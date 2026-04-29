'use client';

/**
 * MasteryChallenge — pass/fail gated singing challenge.
 *
 * Two modes:
 *
 *   Hold mode (default) — iterates `targets[]`. For each target the student
 *   must hold their voice within ±tolerance_cents of the swara for
 *   hold_duration_s consecutive seconds (confidence ≥ 0.4 required).
 *
 *   Ornament mode (T2.1) — when `phase.exercise === 'ornament_challenge'`,
 *   the student records a single pitch trajectory which is then scored by
 *   the existing engine evaluator (engine/voice/ornament-evaluator.ts).
 *   Pass = overall score ≥ 0.6 (or `min_overall` from YAML). Up to
 *   `attempts_allowed` retries; verdict reflects the best attempt.
 *
 * The voice pipeline is started by useLessonEngine. The ornament branch
 * additionally consumes voiceFeedback.pitchHistory and voiceFeedback.hz.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LessonPhase } from '../lib/lesson-loader';
import type { LessonEngineControls } from '../lib/useLessonEngine';
import {
  evaluateOrnament,
  type OrnamentAttempt,
  type OrnamentId,
  type OrnamentPitchSample,
  type OrnamentScore,
} from '@/engine/voice/ornament-evaluator';
import styles from '../styles/lesson-renderer.module.css';

const phaseTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const } },
};

const MIN_CLARITY = 0.4;
const DEFAULT_TOLERANCE_CENTS = 30;
const DEFAULT_HOLD_S = 4;
const MAX_TIME_PER_TARGET_S = 30;

const ORNAMENT_IDS: readonly OrnamentId[] = [
  'meend', 'andolan', 'gamak', 'kan', 'murki', 'khatka', 'zamzama',
];

function isOrnamentId(s: string | undefined): s is OrnamentId {
  return !!s && (ORNAMENT_IDS as readonly string[]).includes(s);
}

type TargetState = 'pending' | 'active' | 'passed' | 'failed';

interface MasteryChallengeProps {
  readonly phase: LessonPhase;
  readonly engine: LessonEngineControls;
  readonly onAdvance: () => void;
}

export default function MasteryChallenge({
  phase,
  engine,
  onAdvance,
}: MasteryChallengeProps) {
  // T2.1 — ornament challenge branch. When the YAML declares
  // `exercise: ornament_challenge`, route to a dedicated scorer that uses
  // the engine's evaluateOrnament rather than the per-target hold gate.
  if (phase.exercise === 'ornament_challenge') {
    return (
      <OrnamentChallenge phase={phase} engine={engine} onAdvance={onAdvance} />
    );
  }

  // Build target list. If absent, synthesise one open-ended target.
  const targets = (() => {
    if (phase.targets && phase.targets.length > 0) {
      return phase.targets.map((t) => ({
        swara: t.swara,
        holdMs: (t.hold_duration_s ?? DEFAULT_HOLD_S) * 1000,
        toleranceCents: t.tolerance_cents ?? phase.tolerance_cents ?? DEFAULT_TOLERANCE_CENTS,
      }));
    }
    return [];
  })();

  const minAccuracy = phase.min_accuracy ?? 0.85;

  const [activeIdx, setActiveIdx] = useState(0);
  const [statuses, setStatuses] = useState<TargetState[]>(
    () => targets.map((_, i) => (i === 0 ? 'active' : 'pending')),
  );
  const [holdMs, setHoldMs] = useState(0);
  const [verdict, setVerdict] = useState<'pass' | 'fail' | null>(null);

  const lastTickRef = useRef<number | null>(null);
  const targetStartRef = useRef<number>(Date.now());
  const advanceRef = useRef(onAdvance);
  advanceRef.current = onAdvance;

  // -------------------------------------------------------------------------
  // Hold-time accumulator. Driven by voiceFeedback updates.
  // -------------------------------------------------------------------------
  const fb = engine.voiceFeedback;
  useEffect(() => {
    if (verdict !== null) return;
    if (targets.length === 0) return;
    const target = targets[activeIdx];
    if (!target) return;

    const now = Date.now();
    const sinceStart = now - targetStartRef.current;

    // Hard cap: if no hold within MAX_TIME_PER_TARGET_S, mark failed and move on
    if (sinceStart > MAX_TIME_PER_TARGET_S * 1000) {
      setStatuses((prev) => {
        const next = [...prev];
        next[activeIdx] = 'failed';
        if (activeIdx < targets.length - 1) {
          next[activeIdx + 1] = 'active';
        }
        return next;
      });
      lastTickRef.current = null;
      setHoldMs(0);
      targetStartRef.current = Date.now();
      if (activeIdx >= targets.length - 1) {
        setVerdict(computeVerdict(statuses, activeIdx, 'failed', minAccuracy));
      } else {
        setActiveIdx((i) => i + 1);
      }
      return;
    }

    const onTarget = fb.detectedSwara === target.swara
      && Math.abs(fb.centsDeviation) <= target.toleranceCents
      && fb.confidence >= MIN_CLARITY;

    if (onTarget) {
      if (lastTickRef.current !== null) {
        const delta = now - lastTickRef.current;
        const newHold = Math.min(target.holdMs, holdMs + delta);
        setHoldMs(newHold);
        if (newHold >= target.holdMs) {
          // Target passed
          setStatuses((prev) => {
            const next = [...prev];
            next[activeIdx] = 'passed';
            if (activeIdx < targets.length - 1) next[activeIdx + 1] = 'active';
            return next;
          });
          lastTickRef.current = null;
          setHoldMs(0);
          targetStartRef.current = Date.now();
          if (activeIdx >= targets.length - 1) {
            setVerdict(computeVerdict(statuses, activeIdx, 'passed', minAccuracy));
          } else {
            setActiveIdx((i) => i + 1);
          }
          return;
        }
      }
      lastTickRef.current = now;
    } else {
      // Reset streak — must be consecutive
      if (lastTickRef.current !== null) {
        lastTickRef.current = null;
        setHoldMs(0);
      }
    }
  }, [fb, activeIdx, verdict, holdMs, targets, minAccuracy, statuses]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const target = targets[activeIdx];
  const fillPct = target ? Math.min(100, (holdMs / target.holdMs) * 100) : 0;

  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      {phase.instruction && (
        <p className={styles.phaseInstruction}>{phase.instruction.trim()}</p>
      )}

      {targets.length > 0 && (
        <div className={styles.challengeTargets}>
          {targets.map((t, i) => {
            const cls =
              statuses[i] === 'passed' ? styles.challengeTargetPassed
              : statuses[i] === 'failed' ? styles.challengeTargetFailed
              : statuses[i] === 'active' ? styles.challengeTargetActive
              : '';
            return (
              <span key={`${t.swara}-${String(i)}`} className={`${styles.challengeTarget} ${cls}`}>
                {t.swara}
              </span>
            );
          })}
        </div>
      )}

      {target && verdict === null && (
        <div className={styles.holdMeter} aria-live="polite">
          <span className={styles.holdMeterLabel}>
            Hold {target.swara} · ±{target.toleranceCents}¢ · {(target.holdMs / 1000).toFixed(0)}s
          </span>
          <div className={styles.holdMeterTrack}>
            <div
              className={`${styles.holdMeterFill} ${fillPct >= 100 ? styles.holdMeterFillPassed : ''}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      )}

      {verdict !== null && (
        <>
          <p className={`${styles.verdictBanner} ${verdict === 'pass' ? styles.verdictPass : styles.verdictFail}`}>
            {verdict === 'pass' ? 'Passed' : 'Not yet'}
          </p>
          <p className={styles.verdictDetail}>
            {countPassed(statuses)} / {targets.length} targets · ≥{Math.round(minAccuracy * 100)}% required
          </p>
        </>
      )}

      <button
        type="button"
        className={styles.actionButton}
        onClick={() => advanceRef.current()}
        style={{ marginTop: 'var(--space-4)' }}
      >
        {verdict !== null ? 'Continue' : 'Skip'}
      </button>
    </motion.div>
  );
}

function countPassed(statuses: readonly TargetState[]): number {
  let n = 0;
  for (const s of statuses) if (s === 'passed') n++;
  return n;
}

function computeVerdict(
  statuses: readonly TargetState[],
  finalIdx: number,
  finalStatus: TargetState,
  minAccuracy: number,
): 'pass' | 'fail' {
  // Build the resolved status set including this final transition
  const resolved = statuses.map((s, i) => (i === finalIdx ? finalStatus : s));
  const passed = countPassed(resolved);
  const total = resolved.length || 1;
  return passed / total >= minAccuracy ? 'pass' : 'fail';
}

// =============================================================================
// OrnamentChallenge — T2.1
//
// Records the student's pitch trajectory during a single attempt window,
// then scores it via evaluateOrnament. Up to `attempts_allowed` retries; the
// verdict reflects the best attempt. Pass threshold defaults to overall ≥ 0.6.
// =============================================================================

const ORNAMENT_PASS_THRESHOLD = 0.6;
const DEFAULT_ORNAMENT_DURATION_S = 6;

function OrnamentChallenge({
  phase,
  engine,
  onAdvance,
}: MasteryChallengeProps) {
  const ornamentId: OrnamentId | null = (() => {
    if (isOrnamentId(phase.ornament_type)) return phase.ornament_type;
    return null;
  })();

  const targetSwara = phase.target_swara ?? phase.to_swara ?? 'Sa';
  const fromSwara = phase.from_swara;
  const ragaContext = phase.raga ?? phase.raga_id ?? 'bhoopali';
  const attemptsAllowed = phase.attempts_allowed ?? 3;
  const recordingDurationS = phase.hold_duration_s ?? DEFAULT_ORNAMENT_DURATION_S;

  const [recording, setRecording] = useState(false);
  const [bestScore, setBestScore] = useState<OrnamentScore | null>(null);
  const [lastScore, setLastScore] = useState<OrnamentScore | null>(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [verdict, setVerdict] = useState<'pass' | 'fail' | null>(null);

  const samplesRef = useRef<OrnamentPitchSample[]>([]);
  const seenTsRef = useRef<Set<number>>(new Set());
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceRef = useRef(onAdvance);
  advanceRef.current = onAdvance;

  // Buffer pitch samples while recording is active. The voice pipeline
  // populates voiceFeedback.pitchHistory; we de-dupe by timestamp so each
  // physical sample is recorded once.
  const fb = engine.voiceFeedback;
  useEffect(() => {
    if (!recording) return;
    const history = fb.pitchHistory;
    if (!history || history.length === 0) return;
    const confidence = fb.confidence ?? 0;
    for (const [ts, hz] of history) {
      if (!Number.isFinite(ts) || !Number.isFinite(hz) || hz <= 0) continue;
      if (seenTsRef.current.has(ts)) continue;
      seenTsRef.current.add(ts);
      samplesRef.current.push({ t: ts, hz, confidence });
    }
  }, [fb, recording]);

  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecording(false);

    if (!ornamentId || samplesRef.current.length < 2) {
      // Not enough samples — count as a failed attempt with zero score
      const zero: OrnamentScore = {
        overall: 0,
        shapeFit: 0,
        timing: 0,
        arrivalAccuracyCents: 0,
        notes: ['Not enough audio recorded — try again'],
      };
      setLastScore(zero);
      setAttemptsUsed((n) => n + 1);
      return;
    }

    const attempt: OrnamentAttempt = {
      ornamentId,
      targetSwara,
      fromSwara,
      pitchSamples: samplesRef.current,
      ragaContext,
      saHz: engine.saHz,
    };

    try {
      const score = evaluateOrnament(attempt);
      setLastScore(score);
      setBestScore((prev) => (prev === null || score.overall > prev.overall ? score : prev));
      const newAttempts = attemptsUsed + 1;
      setAttemptsUsed(newAttempts);

      const passed = score.overall >= ORNAMENT_PASS_THRESHOLD;
      // If passed, lock the verdict immediately. Otherwise allow retries
      // until attempts_allowed is exhausted, then verdict = best so far.
      if (passed) {
        setVerdict('pass');
      } else if (newAttempts >= attemptsAllowed) {
        setVerdict(
          (bestScore && bestScore.overall >= ORNAMENT_PASS_THRESHOLD) ||
            score.overall >= ORNAMENT_PASS_THRESHOLD
            ? 'pass'
            : 'fail',
        );
      }
    } catch {
      // Defensive — keep the lesson advanceable even if scoring throws
      setLastScore({
        overall: 0,
        shapeFit: 0,
        timing: 0,
        arrivalAccuracyCents: 0,
        notes: ['Scoring failed — try again'],
      });
      setAttemptsUsed((n) => n + 1);
    }
  }, [ornamentId, targetSwara, fromSwara, ragaContext, engine.saHz, attemptsUsed, attemptsAllowed, bestScore]);

  const startRecording = useCallback(() => {
    samplesRef.current = [];
    seenTsRef.current = new Set();
    setLastScore(null);
    setRecording(true);

    recordingTimerRef.current = setTimeout(() => {
      stopRecording();
    }, recordingDurationS * 1000);
  }, [recordingDurationS, stopRecording]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    };
  }, []);

  const canRetry = !recording && verdict === null && attemptsUsed > 0 && attemptsUsed < attemptsAllowed;
  const canStart = !recording && lastScore === null && attemptsUsed === 0;
  const ornamentLabel = ornamentId
    ? ornamentId.charAt(0).toUpperCase() + ornamentId.slice(1)
    : 'Ornament';

  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      {phase.instruction && (
        <p className={styles.phaseInstruction}>{phase.instruction.trim()}</p>
      )}

      <p className={styles.phaseMeta}>
        {ornamentLabel} · {ragaContext} · attempt {Math.min(attemptsUsed + (recording ? 1 : 0), attemptsAllowed)} / {attemptsAllowed}
      </p>

      {fromSwara ? (
        <p className={styles.ornamentRoute}>
          {fromSwara} <span className={styles.ornamentArrow}>&rarr;</span> {targetSwara}
        </p>
      ) : (
        <p className={styles.practiceTarget}>{targetSwara}</p>
      )}

      {recording && (
        <div className={styles.holdMeter} aria-live="polite">
          <span className={styles.holdMeterLabel}>Recording — sing the ornament</span>
        </div>
      )}

      {lastScore && !recording && (
        <div className={styles.ornamentScore} role="status" aria-live="polite">
          <p className={styles.ornamentScoreValue}>
            {Math.round(lastScore.overall * 100)}
            <span className={styles.ornamentScoreUnit}> / 100</span>
          </p>
          {lastScore.notes.length > 0 && (
            <ul className={styles.ornamentScoreNotes}>
              {lastScore.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {verdict !== null && (
        <p className={`${styles.verdictBanner} ${verdict === 'pass' ? styles.verdictPass : styles.verdictFail}`}>
          {verdict === 'pass' ? 'Passed' : 'Not yet'}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        {canStart && (
          <button
            type="button"
            className={styles.actionButton}
            onClick={startRecording}
          >
            Begin
          </button>
        )}
        {canRetry && (
          <button
            type="button"
            className={styles.actionButtonSecondary}
            onClick={startRecording}
          >
            Try again
          </button>
        )}
        {recording && (
          <button
            type="button"
            className={styles.actionButtonSecondary}
            onClick={stopRecording}
          >
            Done
          </button>
        )}
        {(verdict !== null || (lastScore && !canRetry)) && (
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => advanceRef.current()}
          >
            Continue
          </button>
        )}
      </div>
    </motion.div>
  );
}
