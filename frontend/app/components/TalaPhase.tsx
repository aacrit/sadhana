'use client';

/**
 * TalaPhase — tabla cycle exercise.
 *
 * Used by `tala_exercise` and `tala_melody_exercise`. Starts the tabla via
 * audio.startTala(tala_id, tempo_bpm), shows a beat strip with sam (gold)
 * and khali (hollow) markers, and advances after `cycles` cycles complete.
 *
 * Beat tracking is approximate — derived from tempo_bpm (60s / bpm = beat
 * duration). For visual feedback only; the actual tabla audio is generated
 * by the engine's TalaPlayer scheduler. The beat highlight is tied to a
 * setInterval that ticks at the same rate as the tala (≤4 beats / second).
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

const TALA_BEAT_COUNT: Record<string, { beats: number; sam: number; khali: number }> = {
  teentaal: { beats: 16, sam: 1, khali: 9 },
  ektaal: { beats: 12, sam: 1, khali: 7 },
  jhaptaal: { beats: 10, sam: 1, khali: 6 },
  rupak: { beats: 7, sam: 4, khali: 1 },
  dadra: { beats: 6, sam: 1, khali: 4 },
  keherwa: { beats: 8, sam: 1, khali: 5 },
};

interface TalaPhaseProps {
  readonly phase: LessonPhase;
  readonly engine: LessonEngineControls;
  readonly onAdvance: () => void;
}

export default function TalaPhase({
  phase,
  engine,
  onAdvance,
}: TalaPhaseProps) {
  const talaName = phase.tala_id ?? phase.tala ?? 'teentaal';
  const tempo = phase.tempo_bpm ?? 80;
  const cycles = phase.cycles ?? 2;
  const meta = TALA_BEAT_COUNT[talaName] ?? { beats: 16, sam: 1, khali: 9 };

  const [activeBeat, setActiveBeat] = useState(0);
  const [cycleNum, setCycleNum] = useState(1);
  const advanceRef = useRef(onAdvance);
  advanceRef.current = onAdvance;

  // Start the tabla on mount; stop on unmount.
  useEffect(() => {
    const valid = phase.tala_id || phase.tala;
    if (!valid) return;
    try {
      engine.audio.startTala(talaName as Parameters<typeof engine.audio.startTala>[0], tempo);
    } catch {
      // ignore
    }

    const beatMs = 60_000 / tempo;
    let beat = 0;
    let cycle = 1;
    const id = window.setInterval(() => {
      beat = (beat + 1) % meta.beats;
      if (beat === 0) {
        cycle += 1;
        if (cycle > cycles) {
          window.clearInterval(id);
          // small breath, then auto-advance unless student already pressed Continue
          window.setTimeout(() => advanceRef.current(), 600);
          return;
        }
        setCycleNum(cycle);
      }
      setActiveBeat(beat);
    }, beatMs);

    return () => {
      window.clearInterval(id);
      try {
        engine.audio.stopTala();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.id]);

  const handleSkip = useCallback(() => {
    try {
      engine.audio.stopTala();
    } catch {
      // ignore
    }
    advanceRef.current();
  }, [engine.audio]);

  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <p className={styles.phaseMeta}>
        {talaName} · {meta.beats} beats · {tempo} bpm · cycle {cycleNum}/{cycles}
      </p>
      {phase.instruction && (
        <p className={styles.phaseInstruction}>{phase.instruction.trim()}</p>
      )}

      <div className={styles.beatStrip} aria-hidden="true">
        {Array.from({ length: meta.beats }, (_, i) => {
          const isActive = i === activeBeat;
          const isSam = i === meta.sam - 1;
          const isKhali = i === meta.khali - 1;
          let cls = styles.beatDot;
          if (isSam) cls += ` ${styles.beatDotSam}`;
          else if (isKhali) cls += ` ${styles.beatDotKhali}`;
          if (isActive) cls += ` ${styles.beatDotActive}`;
          return <span key={i} className={cls} />;
        })}
      </div>

      {phase.phrase && phase.phrase.length > 0 && (
        <div className={styles.phraseRow} aria-hidden="true">
          {phase.phrase.map((s, i) => (
            <span key={`${s}-${String(i)}`} className={styles.phraseNote}>{s}</span>
          ))}
        </div>
      )}

      <button
        type="button"
        className={styles.actionButton}
        onClick={handleSkip}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Continue
      </button>
    </motion.div>
  );
}
