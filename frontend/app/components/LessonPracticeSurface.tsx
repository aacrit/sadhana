'use client';

/**
 * LessonPracticeSurface — unified practice UI surface for all singing phases.
 *
 * Collapses 6 previously separate phase components into a single component:
 *   - PitchExercisePhase     (pitch_exercise)
 *   - PhraseExercisePhase    (phrase_exercise)
 *   - FreeSingingPhase       (passive_phrase_recognition)
 *   - OrnamentExercisePhase  (ornament_exercise, andolan, meend)
 *   - RagaIdentificationPhase (raga_identification, raga_identification_advanced)
 *   - MasteryChallengePhase  (mastery_challenge)
 *
 * Tantri is the primary visualization surface (rendered by LessonRenderer).
 * This component provides only the minimal overlay above Tantri:
 *   - Target label (swara, phrase, ornament name)
 *   - Ornament score (when evaluated)
 *   - Challenge targets (mastery_challenge)
 *   - Advance/Done button
 *
 * Architecture:
 *   Tantri (z-index 0) ← persistent, never re-mounted
 *   LessonPracticeSurface (z-index 1) ← thin overlay per phase
 *
 * @module frontend/components/LessonPracticeSurface
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  evaluateOrnament,
  type OrnamentAttempt,
  type OrnamentId,
  type OrnamentPitchSample,
  type OrnamentScore,
} from '@/engine/voice/ornament-evaluator';
import type { LessonEngineControls } from '../lib/useLessonEngine';
import styles from '../styles/lesson-renderer.module.css';

// ---------------------------------------------------------------------------
// Phase transition (matches LessonRenderer's phaseTransition)
// ---------------------------------------------------------------------------

const phaseTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const } },
};

// ---------------------------------------------------------------------------
// Ornament ID validation (mirrors LessonRenderer)
// ---------------------------------------------------------------------------

const ORNAMENT_IDS: readonly OrnamentId[] = [
  'meend', 'andolan', 'gamak', 'kan', 'murki', 'khatka', 'zamzama',
];

function isOrnamentId(s: string | undefined): s is OrnamentId {
  return !!s && (ORNAMENT_IDS as readonly string[]).includes(s);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LessonPracticeSurfaceProps {
  /** Unique phase id — used as React key and for resetting per-phase state */
  readonly phaseId: string;
  /** Label shown above Tantri (e.g. swara name, ornament type, phrase label) */
  readonly targetLabel?: string;
  /** Phrase for demo playback (swara array as strings) */
  readonly demoPhrase?: readonly string[];
  /** Currently highlighted phrase index (for sequential highlighting) */
  readonly activePhraseIndex?: number;
  /** Ornament type name for display (e.g. "Meend", "Andolan") */
  readonly ornamentName?: string;
  /** Ornament route labels (e.g. from_swara + to_swara) */
  readonly ornamentFrom?: string;
  readonly ornamentTo?: string;
  /** Challenge targets (mastery_challenge) */
  readonly challengeTargets?: ReadonlyArray<Readonly<{ swara: string }>>;
  /** Voice feedback (for ornament buffering) */
  readonly voiceFeedback: LessonEngineControls['voiceFeedback'];
  /** Advance callback */
  readonly onAdvance: () => void;
  /** Button label (default: "Continue") */
  readonly advanceLabel?: string;
  /** Sa frequency for ornament evaluation */
  readonly saHz: number;
  /** Raga id for ornament evaluation */
  readonly ragaId: string;
  /** Ornament id to evaluate on done (if applicable) */
  readonly ornamentId?: OrnamentId;
  /** From swara for ornament evaluation */
  readonly fromSwara?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LessonPracticeSurface({
  phaseId,
  targetLabel,
  demoPhrase,
  activePhraseIndex,
  ornamentName,
  ornamentFrom,
  ornamentTo,
  challengeTargets,
  voiceFeedback,
  onAdvance,
  advanceLabel = 'Continue',
  saHz,
  ragaId,
  ornamentId,
  fromSwara,
}: LessonPracticeSurfaceProps) {
  // -------------------------------------------------------------------------
  // Ornament evaluation state
  // -------------------------------------------------------------------------

  const samplesRef = useRef<OrnamentPitchSample[]>([]);
  const seenTsRef = useRef<Set<number>>(new Set());
  const [score, setScore] = useState<OrnamentScore | null>(null);

  // Reset per phase
  useEffect(() => {
    samplesRef.current = [];
    seenTsRef.current = new Set();
    setScore(null);
  }, [phaseId]);

  // Ingest pitch history from voiceFeedback
  useEffect(() => {
    if (!ornamentId) return;
    const history = voiceFeedback.pitchHistory;
    if (!history || history.length === 0) return;
    const confidence = voiceFeedback.confidence ?? 0;
    for (const [ts, hz] of history) {
      if (!Number.isFinite(ts) || !Number.isFinite(hz) || hz <= 0) continue;
      if (seenTsRef.current.has(ts)) continue;
      seenTsRef.current.add(ts);
      samplesRef.current.push({ t: ts, hz, confidence });
    }
  }, [voiceFeedback, ornamentId]);

  // -------------------------------------------------------------------------
  // Advance handler
  // -------------------------------------------------------------------------

  const handleAdvance = () => {
    if (ornamentId && !score) {
      // Evaluate ornament on first press
      if (samplesRef.current.length >= 2) {
        const attempt: OrnamentAttempt = {
          ornamentId,
          targetSwara: ornamentTo ?? ornamentFrom ?? 'Sa',
          fromSwara,
          pitchSamples: samplesRef.current,
          ragaContext: ragaId,
          saHz,
        };
        try {
          const result = evaluateOrnament(attempt);
          setScore(result);
          return; // Show score before advancing
        } catch {
          // Fall through to advance
        }
      }
    }
    onAdvance();
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const hasOrnamentRoute = ornamentFrom && ornamentTo;
  const buttonLabel = ornamentId && score ? 'Continue' : advanceLabel;

  return (
    <motion.div key={phaseId} {...phaseTransition} className={styles.centeredMessage}>
      {/* Phrase highlighting — show active swara in phrase */}
      {demoPhrase && demoPhrase.length > 0 && activePhraseIndex !== undefined && (
        <div className={styles.phraseRow}>
          {demoPhrase.map((s, i) => (
            <span
              key={`${s}-${String(i)}`}
              className={
                i === activePhraseIndex
                  ? `${styles.phraseNote} ${styles.phraseNoteActive}`
                  : styles.phraseNote
              }
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Target label (swara, section title, etc.) */}
      {targetLabel && (
        <p className={styles.practiceTarget}>{targetLabel}</p>
      )}

      {/* Ornament route (from → to) */}
      {hasOrnamentRoute && (
        <p className={styles.ornamentRoute}>
          {ornamentFrom} <span className={styles.ornamentArrow}>&rarr;</span> {ornamentTo}
        </p>
      )}

      {/* Ornament name */}
      {ornamentName && (
        <p className={styles.ornamentLabel}>{ornamentName}</p>
      )}

      {/* Challenge targets */}
      {challengeTargets && challengeTargets.length > 0 && (
        <div className={styles.challengeTargets}>
          {challengeTargets.map((t) => (
            <span key={t.swara} className={styles.challengeTarget}>
              {t.swara}
            </span>
          ))}
        </div>
      )}

      {/* Ornament score */}
      {score && (
        <div className={styles.ornamentScore} role="status" aria-live="polite">
          <p className={styles.ornamentScoreValue}>
            {Math.round(score.overall * 100)}
            <span className={styles.ornamentScoreUnit}> / 100</span>
          </p>
          {score.notes.length > 0 && (
            <ul className={styles.ornamentScoreNotes}>
              {score.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        className={styles.actionButton}
        onClick={handleAdvance}
        style={{ marginTop: 'var(--space-4)' }}
      >
        {buttonLabel}
      </button>
    </motion.div>
  );
}
