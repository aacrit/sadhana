'use client';

/**
 * StructuredPhase — Cluster F renderer with modulation/deviation grading.
 *
 * Two render modes:
 *
 *   Listen-only (most Cluster F types — bandish, composition, taan_exercise
 *   in mode:listen, raga_rendering, teaching_exercise, etc.)
 *
 *     Renders meta strip, instruction, phrase chips, Listen + Continue.
 *
 *   Voice-evaluated (modulation_awareness, controlled_deviation — audit #8)
 *
 *     - For modulation_awareness: records the captured pitch history during
 *       the response window and runs detectModulation against the YAML
 *       transition_swara. Surfaces a 2-line verdict.
 *     - For controlled_deviation: runs analyzeDeviation against the YAML
 *       allowed_deviations[] list. Reports per-occurrence pass/fail and
 *       overall score.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LessonPhase } from '../lib/lesson-loader';
import type { LessonEngineControls } from '../lib/useLessonEngine';
import { detectModulation } from '@/engine/analysis/modulation';
import {
  analyzeDeviation,
  type DeviationOccurrence,
  type AllowedDeviation,
} from '@/engine/analysis/deviation';
import type { Swara } from '@/engine/theory/types';
import { emit } from '../lib/telemetry';
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

const VOICE_EVALUATED = new Set<string>([
  'modulation_awareness',
  'controlled_deviation',
]);

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

  // Audit #8 — analyzer wiring. Voice-evaluated phases capture pitch
  // history during a response window and grade after.
  const isEvaluated = VOICE_EVALUATED.has(phase.type);
  const [recording, setRecording] = useState(false);
  const [verdict, setVerdict] = useState<{
    pass: boolean;
    summary: string;
    detail: string;
  } | null>(null);
  const samplesRef = useRef<Array<readonly [number, number]>>([]);
  const seenTsRef = useRef<Set<number>>(new Set());
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Buffer pitch samples while recording window is open.
  const fb = engine.voiceFeedback;
  useEffect(() => {
    if (!recording) return;
    const history = fb.pitchHistory;
    if (!history || history.length === 0) return;
    for (const [ts, hz] of history) {
      if (!Number.isFinite(ts) || !Number.isFinite(hz) || hz <= 0) continue;
      if (seenTsRef.current.has(ts)) continue;
      seenTsRef.current.add(ts);
      samplesRef.current.push([ts, hz] as const);
    }
  }, [fb, recording]);

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

  const stopAndGrade = useCallback(() => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecording(false);

    const samples = samplesRef.current;
    if (samples.length < 4) {
      setVerdict({
        pass: false,
        summary: 'Not enough audio recorded',
        detail: 'Try again with the mic active.',
      });
      return;
    }

    if (phase.type === 'modulation_awareness' && phase.transition_swara) {
      const result = detectModulation(samples, {
        transitionSwara: phase.transition_swara as Swara,
        saHz: engine.saHz,
        toleranceCents: 30,
        minDurationMs: 250,
      });
      if (result.transitionAt !== null) {
        // Convert sample timestamp to elapsed seconds since start
        const startT = samples[0]?.[0] ?? 0;
        const elapsedS = ((result.transitionAt - startT) / 1000).toFixed(1);
        setVerdict({
          pass: true,
          summary: `Transition heard at ${elapsedS}s`,
          detail: `${phase.transition_swara} entered the phrase — confirms ${phase.phrase_raga_end ?? 'modulation'}.`,
        });
        void emit('modulation-detected', {
          lessonId: phase.id,
          transitionSwara: phase.transition_swara,
          atMs: result.transitionAt - startT,
        });
      } else {
        setVerdict({
          pass: false,
          summary: 'No transition detected',
          detail: `${phase.transition_swara} did not appear within ±30 cents for at least 250ms.`,
        });
      }
    } else if (phase.type === 'controlled_deviation' && phase.allowed_deviations && phase.allowed_deviations.length > 0) {
      const allowed: AllowedDeviation[] = phase.allowed_deviations.map((d) => ({
        swara: d.swara as Swara,
        role: d.role,
        maxDurationMs: d.max_duration_ms,
      }));
      const result = analyzeDeviation(samples, {
        saHz: engine.saHz,
        allowed,
        toleranceCents: 25,
      });
      if (result.occurrences.length === 0) {
        setVerdict({
          pass: false,
          summary: 'No deviation heard',
          detail: 'Sing the phrase including the allowed deviation swara.',
        });
      } else {
        const detail = result.occurrences
          .map((o: DeviationOccurrence) => {
            const sign = o.verdict === 'pass' ? '✓' : '✗';
            return `${sign} ${o.swara}: ${o.reason}`;
          })
          .join(' · ');
        setVerdict({
          pass: result.score >= 0.6,
          summary:
            result.score >= 0.6
              ? `${result.passes} of ${result.occurrences.length} deviations within role`
              : `${result.fails} of ${result.occurrences.length} held too long`,
          detail,
        });
        void emit('deviation-graded', {
          lessonId: phase.id,
          score: result.score,
          passes: result.passes,
          fails: result.fails,
        });
      }
    } else {
      // Voice-evaluated phase but missing config
      setVerdict({
        pass: false,
        summary: 'Phase missing analysis config',
        detail: 'Skipping evaluation.',
      });
    }
  }, [phase, engine.saHz]);

  const startRecording = useCallback(() => {
    samplesRef.current = [];
    seenTsRef.current = new Set();
    setVerdict(null);
    setRecording(true);

    const durationS = phase.duration_s ?? phase.phrase_duration_s ?? 15;
    recordingTimerRef.current = setTimeout(() => {
      stopAndGrade();
    }, durationS * 1000);
  }, [phase.duration_s, phase.phrase_duration_s, stopAndGrade]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    };
  }, []);

  // Build the meta strip
  const metaParts: string[] = [];
  if (ragaId) metaParts.push(ragaId);
  if (phase.phrase_raga_start && phase.phrase_raga_end) {
    metaParts.push(`${phase.phrase_raga_start} → ${phase.phrase_raga_end}`);
  }
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

      {phrase && phrase.length > 0 && !recording && (
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

      {/* Audit #8 — voice-evaluated phases get a Begin/Done flow. */}
      {isEvaluated && verdict === null && !recording && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={startRecording}
        >
          Begin
        </button>
      )}

      {isEvaluated && recording && (
        <>
          <p className={styles.phaseHint}>Recording — sing the phrase…</p>
          <button
            type="button"
            className={styles.actionButtonSecondary}
            onClick={stopAndGrade}
            style={{ marginTop: 'var(--space-3)' }}
          >
            Done
          </button>
        </>
      )}

      {verdict && (
        <div
          role="status"
          aria-live="polite"
          style={{
            margin: 'var(--space-4) 0',
            padding: 'var(--space-3) var(--space-4)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            maxWidth: '40ch',
          }}
        >
          <p className={`${styles.verdictBanner} ${verdict.pass ? styles.verdictPass : styles.verdictFail}`} style={{ marginTop: 0 }}>
            {verdict.summary}
          </p>
          <p className={styles.verdictDetail}>{verdict.detail}</p>
        </div>
      )}

      {(!isEvaluated || verdict) && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={onAdvance}
        >
          Continue
        </button>
      )}
    </motion.div>
  );
}
