'use client';

/**
 * CallResponseCycle — engine plays a call, student sings the response.
 *
 * Iterates the YAML `calls[]` array (or `call_phrase` shape). For each call:
 *   1. Engine plays `engine_plays` swaras (single note or short phrase).
 *   2. After a brief gap, the response window opens — student sings
 *      `student_sings` while Tantri visualises pitch.
 *   3. After the response window elapses, advance to the next call.
 *
 * Continues for up to `rounds` cycles (or `calls.length` if smaller). Each
 * round optionally repeats `response_cycles` times (per teacher tradition,
 * 3-5× repetition aids memory formation). If the YAML omits `rounds`, every
 * call in the array runs exactly once.
 *
 * The voice pipeline is started/managed by useLessonEngine — this component
 * only orchestrates timing and emits per-round Tantri highlights.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LessonPhase } from '../lib/lesson-loader';
import type { LessonEngineControls } from '../lib/useLessonEngine';
import styles from '../styles/lesson-renderer.module.css';

const phaseTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const } },
};

/** Coerce scalar-or-array YAML to a string array. */
function toArray(v: string | readonly string[] | undefined): readonly string[] {
  if (!v) return [];
  return Array.isArray(v) ? (v as readonly string[]) : [v as string];
}

interface CallResponseCycleProps {
  readonly phase: LessonPhase;
  readonly engine: LessonEngineControls;
  readonly onAdvance: () => void;
  readonly onHighlightString?: (swara: string) => void;
}

export default function CallResponseCycle({
  phase,
  engine,
  onAdvance,
  onHighlightString,
}: CallResponseCycleProps) {
  // Build the per-round queue. Prefer explicit calls[]; fall back to
  // call_phrase (single phrase used as both call and response).
  const rounds = (() => {
    if (phase.calls && phase.calls.length > 0) {
      return phase.calls.map((c) => ({
        engine: toArray(c.engine_plays),
        student: toArray(c.student_sings),
      }));
    }
    if (phase.call_phrase && phase.call_phrase.length > 0) {
      return [{
        engine: phase.call_phrase,
        student: phase.call_phrase,
      }];
    }
    return [];
  })();

  const totalRounds = phase.rounds ? Math.min(phase.rounds, rounds.length || phase.rounds) : rounds.length;
  const responseCycles = phase.response_cycles ?? 1;

  const [roundIdx, setRoundIdx] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState<'listen' | 'sing' | 'done'>('listen');

  const cancelRef = useRef(false);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;
  const onHighlightRef = useRef(onHighlightString);
  onHighlightRef.current = onHighlightString;

  // Cycle driver
  useEffect(() => {
    cancelRef.current = false;
    if (rounds.length === 0) {
      onAdvanceRef.current();
      return;
    }

    let active = true;
    const tick = async () => {
      for (let cycle = 0; cycle < responseCycles && active && !cancelRef.current; cycle++) {
        for (let i = 0; i < totalRounds && active && !cancelRef.current; i++) {
          const r = rounds[i % rounds.length];
          if (!r) continue;
          setRoundIdx(i);

          // 1. Engine plays the call
          setPhaseLabel('listen');
          if (r.engine.length > 0) {
            const first = r.engine[0];
            if (first && onHighlightRef.current) onHighlightRef.current(first);
            try {
              await engine.audio.playPhrase([...r.engine], 600, 80);
            } catch {
              // Audio failure — fall through to response window
            }
          }
          if (cancelRef.current) break;

          // Brief gap, then open the response window
          await sleep(250);
          if (cancelRef.current) break;

          // 2. Student sings — Tantri shows live pitch via voiceFeedback (handled
          // by parent). We hold the response window open for the student
          // duration. ~1100ms per swara, min 2000ms, capped at 6000ms.
          setPhaseLabel('sing');
          const expectFirst = r.student[0];
          if (expectFirst && onHighlightRef.current) onHighlightRef.current(expectFirst);
          const responseMs = Math.min(6000, Math.max(2000, r.student.length * 1100));
          await sleep(responseMs);
        }
      }
      if (!cancelRef.current) {
        setPhaseLabel('done');
      }
    };

    tick();
    return () => {
      active = false;
      cancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.id]);

  const skip = useCallback(() => {
    cancelRef.current = true;
    onAdvanceRef.current();
  }, []);

  // Display: current call + which step (listen / sing) + round counter
  const current = rounds[roundIdx % (rounds.length || 1)];
  const callLabel = current ? current.engine.join(' ') : '';
  const responseLabel = current ? current.student.join(' ') : '';

  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <p className={styles.phaseMeta}>
        Round {Math.min(roundIdx + 1, totalRounds)} / {totalRounds}
      </p>

      {phaseLabel === 'listen' && (
        <>
          <p className={styles.practiceTarget}>{callLabel}</p>
          <p className={styles.phaseHint}>Listen…</p>
        </>
      )}

      {phaseLabel === 'sing' && (
        <>
          <p className={styles.practiceTarget}>{responseLabel || callLabel}</p>
          <p className={styles.phaseHint}>Sing.</p>
        </>
      )}

      {phaseLabel === 'done' && (
        <p className={styles.phaseHint}>Cycle complete.</p>
      )}

      <button
        type="button"
        className={styles.actionButton}
        onClick={phaseLabel === 'done' ? () => onAdvanceRef.current() : skip}
        style={{ marginTop: 'var(--space-4)' }}
      >
        {phaseLabel === 'done' ? 'Continue' : 'Skip'}
      </button>
    </motion.div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
