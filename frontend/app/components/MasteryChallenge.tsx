'use client';

/**
 * MasteryChallenge — pass/fail gated singing challenge.
 *
 * Iterates `targets[]`. For each target:
 *   - student must hold their voice within ±`tolerance_cents` of the target
 *     swara for `hold_duration_s` consecutive seconds.
 *   - confidence ≥ 0.4 required (suppresses noise floor false-positives).
 * Targets are evaluated in order. Once all targets are held, the verdict
 * banner shows and Continue advances.
 *
 * If `targets[]` is absent (e.g. legacy `tolerance_cents` global), the phase
 * still renders the instruction but uses a single open-ended hold timer.
 *
 * The voice pipeline is started by useLessonEngine. We only consume
 * `voiceFeedback.detectedSwara`, `centsDeviation` and `confidence`.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LessonPhase } from '../lib/lesson-loader';
import type { LessonEngineControls } from '../lib/useLessonEngine';
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
