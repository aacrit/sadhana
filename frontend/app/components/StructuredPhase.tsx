'use client';

/**
 * StructuredPhase — fallback Cluster F renderer.
 *
 * For phase types that carry an instruction + (optional) phrase, but don't
 * have a dedicated micro-interaction renderer:
 *   - bandish_exercise, composition_exercise, taan_exercise (mode: listen),
 *     teaching_exercise, raga_rendering, modulation_awareness,
 *     controlled_deviation, shruti_exercise, ornament_context_exercise,
 *     grammar_exercise.
 *
 * Renders:
 *   - phase metadata strip (raga / tempo / mode if present)
 *   - instruction body (whitespace-preserving)
 *   - phrase chips (if `phrase` or `base_phrase` present)
 *   - Listen button (when phrase exists; uses engine.audio.playPhrase)
 *   - Continue button
 *
 * For `mode: sing` variants, callers should route to LessonPracticeSurface
 * instead — this component is for instruction-led, not voice-evaluated phases.
 */

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import type { LessonPhase } from '../lib/lesson-loader';
import type { LessonEngineControls } from '../lib/useLessonEngine';
import styles from '../styles/lesson-renderer.module.css';

const phaseTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const } },
};

interface StructuredPhaseProps {
  readonly phase: LessonPhase;
  readonly engine: LessonEngineControls;
  readonly onAdvance: () => void;
}

export default function StructuredPhase({
  phase,
  engine,
  onAdvance,
}: StructuredPhaseProps) {
  const phrase = phase.phrase ?? phase.base_phrase ?? phase.pakad_phrase ?? null;
  const tempo = phase.tempo_bpm;
  const mode = phase.mode;
  const ragaId = phase.raga_id ?? phase.raga ?? null;

  const [playing, setPlaying] = useState(false);

  const playPhrase = useCallback(async () => {
    if (!phrase || phrase.length === 0 || playing) return;
    setPlaying(true);
    try {
      const noteMs = tempo ? Math.max(120, Math.round(60_000 / tempo)) : 600;
      await engine.audio.playPhrase([...phrase], noteMs, 60);
    } finally {
      setPlaying(false);
    }
  }, [phrase, tempo, playing, engine.audio]);

  // Build the meta strip
  const metaParts: string[] = [];
  if (ragaId) metaParts.push(ragaId);
  if (mode) metaParts.push(mode);
  if (tempo) metaParts.push(`${tempo} bpm`);
  const metaLine = metaParts.length > 0 ? metaParts.join(' · ') : null;

  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      {metaLine && <p className={styles.phaseMeta}>{metaLine}</p>}

      {phase.instruction && (
        <p className={styles.phaseInstruction}>{phase.instruction.trim()}</p>
      )}

      {phrase && phrase.length > 0 && (
        <div className={styles.phraseRow} aria-hidden="true">
          {phrase.map((s, i) => (
            <span key={`${s}-${String(i)}`} className={styles.phraseNote}>{s}</span>
          ))}
        </div>
      )}

      {phrase && phrase.length > 0 && (
        <button
          type="button"
          className={styles.actionButtonSecondary}
          onClick={playPhrase}
          disabled={playing}
          style={{ marginBottom: 'var(--space-3)' }}
        >
          {playing ? 'Playing...' : 'Listen'}
        </button>
      )}

      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
      >
        Continue
      </button>
    </motion.div>
  );
}
