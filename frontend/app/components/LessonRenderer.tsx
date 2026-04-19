'use client';

/**
 * LessonRenderer — YAML-driven lesson phase renderer.
 *
 * Replaces the hardcoded phase rendering in the beginner page.
 * Takes a lesson definition (loaded from YAML) and a lesson engine
 * (state machine hook), then dispatches each phase to the correct
 * React component.
 *
 * Phase type → Component mapping:
 *   tanpura_drone            → TanpuraDronePhase (inline)
 *   sa_detection             → SaDetectionPhase (inline)
 *   swara_introduction       → SwaraIntroduction (existing)
 *   phrase_playback          → PhrasePlayback (existing)
 *   pitch_exercise           → PitchExercisePhase (inline)
 *   phrase_exercise          → PhraseExercisePhase (inline)
 *   call_response            → CallResponsePhase (placeholder)
 *   passive_phrase_recognition → FreeSingingPhase (inline)
 *   session_summary          → SessionSummaryPhase (inline)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LessonPhase } from '../lib/lesson-loader';
import type { LessonEngineControls } from '../lib/useLessonEngine';
import { getSwaraFrequency } from '@/engine/theory/swaras';
import type { Swara } from '@/engine/theory/types';
import SwaraIntroduction from './SwaraIntroduction';
import PhrasePlayback from './PhrasePlayback';
import LessonPracticeSurface from './LessonPracticeSurface';
// VoiceVisualization removed — Tantri is the primary visualization surface.
// All phase components that previously mounted VoiceVisualization now rely
// on the persistent Tantri layer which sits behind the phase content at z-index 0.
import PakadMoment from './PakadMoment';
import Tantri from './Tantri';
import {
  evaluateOrnament,
  type OrnamentAttempt,
  type OrnamentId,
  type OrnamentPitchSample,
  type OrnamentScore,
} from '@/engine/voice/ornament-evaluator';
import styles from '../styles/lesson-renderer.module.css';

const ORNAMENT_IDS: readonly OrnamentId[] = [
  'meend', 'andolan', 'gamak', 'kan', 'murki', 'khatka', 'zamzama',
];

function isOrnamentId(s: string | undefined): s is OrnamentId {
  return !!s && (ORNAMENT_IDS as readonly string[]).includes(s);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LessonRendererProps {
  readonly engine: LessonEngineControls;
  readonly onComplete?: (data: { xpEarned: number; pakadsFound: number }) => void;
  readonly ragaId?: string;
  readonly ragaName?: string;
  readonly user?: { streak: number; xp: number };
}

// ---------------------------------------------------------------------------
// Phase transition animation
// Fast cross-fade: 180ms enter, 150ms exit (per spec)
// ---------------------------------------------------------------------------

const phaseTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const } },
};

// ---------------------------------------------------------------------------
// Inline Phase Components
// ---------------------------------------------------------------------------

/** Tanpura drone phase — listen to the tanpura, auto-advance or manual. */
function TanpuraDronePhase({
  phase,
  onAdvance,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <div className={styles.listenPulse} aria-label="Tanpura playing" />
      {/* Always show Continue — auto-advance is the happy path but Continue
          is the escape hatch if the timer fails (Strict Mode, AudioContext
          suspension, monitor switch, etc.). Styled at low opacity so it
          doesn't compete with the listening experience. */}
      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
        style={{ opacity: 0.45, marginTop: 'var(--space-8)' }}
      >
        Continue
      </button>
    </motion.div>
  );
}

/** Sa detection phase — calibrate student's tonic. */
function SaDetectionPhase({
  phase,
  onAdvance,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <p>{phase.prompt ?? 'Sing or hum a comfortable note.'}</p>
      <p className={styles.calibratingText}>
        {phase.calibrating_message ?? 'Listening...'}
      </p>
      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
        style={{ marginTop: 'var(--space-8)' }}
      >
        Skip
      </button>
    </motion.div>
  );
}

/** Pitch exercise — single swara hold. Tantri is the visualization. */
function PitchExercisePhase({
  phase,
  onAdvance,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
}) {
  // Silent warmup phase — no copy, no button. Tantri shows the swara; engine auto-advances.
  const isWarmup = phase.id.startsWith('__warmup_');
  if (isWarmup) return null;
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Continue
      </button>
    </motion.div>
  );
}

/** Phrase exercise — guided singing. Tantri is the visualization. */
function PhraseExercisePhase({
  phase,
  onAdvance,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Continue
      </button>
    </motion.div>
  );
}

/** Free singing with passive pakad recognition. Tantri is the visualization. */
function FreeSingingPhase({
  phase,
  onAdvance,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Done
      </button>
    </motion.div>
  );
}

/**
 * Ornament exercise — meend, andolan, gamak, kan, murki, khatka, zamzama.
 *
 * Buffers pitch samples from voiceFeedback for the duration of the attempt,
 * then calls evaluateOrnament() on "Continue" to produce a score. The score
 * is surfaced above Tantri (which provides the pitch visualization).
 */
function OrnamentExercisePhase({
  phase,
  onAdvance,
  voiceFeedback,
  saHz,
  ragaId,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
  voiceFeedback: LessonEngineControls['voiceFeedback'];
  saHz: number;
  ragaId: string;
}) {
  const ornamentLabel = phase.ornament_type
    ? phase.ornament_type.charAt(0).toUpperCase() + phase.ornament_type.slice(1)
    : 'Ornament';
  const hasRoute = phase.from_swara && phase.to_swara;

  // Resolve ornament id: phase.ornament_type, else phase.type if it is itself
  // an ornament id (e.g. 'andolan' or 'meend' dispatched as their own types).
  const resolvedOrnamentId: OrnamentId | undefined = isOrnamentId(phase.ornament_type)
    ? (phase.ornament_type as OrnamentId)
    : isOrnamentId(phase.type)
      ? (phase.type as OrnamentId)
      : undefined;

  // Buffer pitch samples as voiceFeedback updates. We dedupe by timestamp so
  // that the rolling pitchHistory (which redelivers the same samples many
  // times) contributes each sample only once.
  const samplesRef = useRef<OrnamentPitchSample[]>([]);
  const seenTsRef = useRef<Set<number>>(new Set());
  const [score, setScore] = useState<OrnamentScore | null>(null);

  // Reset per-phase: any change in phase id clears the sample buffer.
  useEffect(() => {
    samplesRef.current = [];
    seenTsRef.current = new Set();
    setScore(null);
  }, [phase.id]);

  // Ingest new samples from the pitchHistory on each voiceFeedback update.
  useEffect(() => {
    const history = voiceFeedback.pitchHistory;
    if (!history || history.length === 0) return;
    const confidence = voiceFeedback.confidence ?? 0;
    for (const [ts, hz] of history) {
      if (!Number.isFinite(ts) || !Number.isFinite(hz) || hz <= 0) continue;
      if (seenTsRef.current.has(ts)) continue;
      seenTsRef.current.add(ts);
      samplesRef.current.push({ t: ts, hz, confidence });
    }
  }, [voiceFeedback]);

  const handleContinue = () => {
    if (score) {
      onAdvance();
      return;
    }
    const targetSwara =
      phase.to_swara ??
      phase.target_swara ??
      phase.from_swara ??
      'Sa';

    if (!resolvedOrnamentId || samplesRef.current.length < 2) {
      // No ornament id or no voice — just advance without evaluation.
      onAdvance();
      return;
    }

    const attempt: OrnamentAttempt = {
      ornamentId: resolvedOrnamentId,
      targetSwara,
      fromSwara: phase.from_swara,
      pitchSamples: samplesRef.current,
      ragaContext: ragaId,
      saHz,
    };
    try {
      const result = evaluateOrnament(attempt);
      setScore(result);
    } catch {
      // Invalid swara symbol or other unexpected input — fall back to advance.
      onAdvance();
    }
  };

  const buttonLabel = score ? 'Continue' : 'Done';

  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      {hasRoute && (
        <p className={styles.ornamentRoute}>
          {phase.from_swara} <span className={styles.ornamentArrow}>&rarr;</span> {phase.to_swara}
        </p>
      )}
      <p className={styles.ornamentLabel}>{ornamentLabel}</p>
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
        onClick={handleContinue}
        style={{ marginTop: 'var(--space-4)' }}
      >
        {buttonLabel}
      </button>
    </motion.div>
  );
}

/**
 * Raga identification — engine plays pakad, student sings in response.
 * Full engine integration (pakad playback + response evaluation) is Cluster F.
 * Tantri provides pitch visualization.
 */
function RagaIdentificationPhase({
  phase,
  onAdvance,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <p className={styles.phaseHint}>
        Listen, then sing.
      </p>
      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Continue
      </button>
    </motion.div>
  );
}

/**
 * Raga comparison — two ragas played side by side.
 * Shows raga name and plays pakad phrase via audio.
 */
function RagaComparisonPhase({
  phase,
  onAdvance,
  onPlayPhrase,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
  onPlayPhrase: (phrase: readonly string[]) => void;
}) {
  const phrase = phase.pakad_phrase ?? phase.phrase ?? [];
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      {phase.raga && (
        <p className={`${styles.ragaCompareLabel} raga-name`}>
          {phase.raga.charAt(0).toUpperCase() + phase.raga.slice(1)}
        </p>
      )}
      {phrase.length > 0 && (
        <button
          type="button"
          className={styles.actionButtonSecondary}
          onClick={() => onPlayPhrase(phrase)}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          Listen
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

/**
 * Mastery challenge — structured assessment phase.
 * Shows targets and accepts voice input. Tantri is the pitch visualization.
 */
function MasteryChallengePhase({
  phase,
  onAdvance,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      {phase.targets && phase.targets.length > 0 && (
        <div className={styles.challengeTargets}>
          {phase.targets.map((t) => (
            <span key={t.swara} className={styles.challengeTarget}>
              {t.swara}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        className={styles.actionButton}
        onClick={onAdvance}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Continue
      </button>
    </motion.div>
  );
}

/**
 * Generic structured phase — for tala_exercise, grammar_exercise, interval_exercise,
 * swara_comparison, and other Cluster F phase types.
 * Shows instruction and Continue.
 */
function StructuredPhase({
  phase,
  onAdvance,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <button type="button" className={styles.actionButton} onClick={onAdvance}>
        Continue
      </button>
    </motion.div>
  );
}

/** Session summary — completion screen. */
function SessionSummaryPhase({
  phase,
  onExit,
  user,
}: {
  phase: LessonPhase;
  onExit: () => void;
  user?: { streak: number; xp: number };
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.completeScreen}>
      <h2 className={styles.completeTitle}>{phase.screenTitle ?? 'Session Complete'}</h2>
      <p className={styles.completeMessage}>
        {phase.message ?? phase.body ?? 'Well done.'}
      </p>
      <div className={styles.completeStats}>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.statValueAccent}`}>
            {phase.xp_line ?? '+30 XP'}
          </span>
          <span className={styles.statLabel}>Earned</span>
        </div>
        {phase.show_streak !== false && (
          <div className={styles.stat}>
            <span className={styles.statValue}>
              Day {user?.streak ?? 1}
            </span>
            <span className={styles.statLabel}>Streak</span>
          </div>
        )}
      </div>
      <button
        type="button"
        className={styles.actionButton}
        onClick={onExit}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Return
      </button>
    </motion.div>
  );
}

/** Mic permission gate overlay. */
function MicGate({
  permission,
  onGrant,
  onSkip,
  onRetry,
}: {
  permission: string;
  onGrant: () => void;
  onSkip: () => void;
  onRetry: () => void;
}) {
  return (
    <div className={styles.micGate} role="alert">
      {permission === 'denied' ? (
        <>
          <p className={styles.micGateText}>
            Microphone access is needed to hear your singing.
            Please allow microphone access in your browser settings.
          </p>
          <div className={styles.micGateActions}>
            <button type="button" className={styles.actionButton} onClick={onRetry}>
              Try again
            </button>
            <button type="button" className={styles.actionButtonSecondary} onClick={onSkip}>
              Continue without mic
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.micGateText}>Sadhana needs to hear you sing.</p>
          <div className={styles.micGateActions}>
            <button type="button" className={styles.actionButton} onClick={onGrant}>
              Grant access
            </button>
            <button type="button" className={styles.actionButtonSecondary} onClick={onSkip}>
              Continue without mic
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase Dispatcher
// ---------------------------------------------------------------------------

function PhaseDispatcher({
  phase,
  engine,
  user,
  ragaId,
  onHighlightString,
}: {
  phase: LessonPhase;
  engine: LessonEngineControls;
  user?: { streak: number; xp: number };
  ragaId: string;
  onHighlightString?: (swara: string) => void;
}) {
  // If mic gate is active and this is a voice phase, show the gate
  if (engine.micGateActive && engine.phaseContext?.isVoicePhase) {
    return (
      <MicGate
        permission={engine.micPermission}
        onGrant={engine.grantMic}
        onSkip={engine.skipMic}
        onRetry={engine.retryMic}
      />
    );
  }

  switch (phase.type) {
    case 'tanpura_drone':
      return <TanpuraDronePhase phase={phase} onAdvance={engine.advancePhase} />;

    case 'sa_detection':
      return <SaDetectionPhase phase={phase} onAdvance={engine.advancePhase} />;

    case 'swara_introduction':
      return (
        <motion.div key={phase.id} {...phaseTransition}>
          <SwaraIntroduction
            swaras={[...(phase.swaras ?? [])]}
            onComplete={engine.advancePhase}
            audioFirst={phase.audio_first ?? true}
            revealDelayMs={phase.swara_reveal_delay_ms ?? 1200}
            onPlaySwara={(s) => engine.audio.playSwara(s)}
            onHighlightString={onHighlightString}
          />
        </motion.div>
      );

    case 'phrase_playback':
      return (
        <motion.div key={phase.id} {...phaseTransition}>
          <PhrasePlayback
            phrase={[...(phase.phrase ?? [])]}
            showLabels={phase.show_labels ?? true}
            onComplete={engine.advancePhase}
            repeatCount={phase.repeat ?? 1}
            onPlaySwara={(s) => engine.audio.playSwara(s)}
            onHighlightString={onHighlightString}
          />
        </motion.div>
      );

    case 'pitch_exercise':
      // Warmup phase renders nothing (engine auto-advances)
      if (phase.id.startsWith('__warmup_')) return null;
      return (
        <LessonPracticeSurface
          phaseId={phase.id}
          targetLabel={phase.target_swara ?? undefined}
          voiceFeedback={engine.voiceFeedback}
          onAdvance={engine.advancePhase}
          saHz={engine.saHz}
          ragaId={ragaId}
        />
      );

    case 'phrase_exercise':
      return (
        <LessonPracticeSurface
          phaseId={phase.id}
          demoPhrase={phase.phrase ?? []}
          voiceFeedback={engine.voiceFeedback}
          onAdvance={engine.advancePhase}
          saHz={engine.saHz}
          ragaId={ragaId}
        />
      );

    case 'call_response':
      return (
        <LessonPracticeSurface
          phaseId={phase.id}
          voiceFeedback={engine.voiceFeedback}
          onAdvance={engine.advancePhase}
          advanceLabel="Continue"
          saHz={engine.saHz}
          ragaId={ragaId}
        />
      );

    case 'passive_phrase_recognition':
      return (
        <LessonPracticeSurface
          phaseId={phase.id}
          voiceFeedback={engine.voiceFeedback}
          onAdvance={engine.advancePhase}
          advanceLabel="Done"
          saHz={engine.saHz}
          ragaId={ragaId}
        />
      );

    case 'session_summary':
      return (
        <SessionSummaryPhase
          phase={phase}
          onExit={engine.exitLesson}
          user={user}
        />
      );

    // --- Ornament phases ---------------------------------------------------

    case 'ornament_exercise':
    case 'andolan':
    case 'meend': {
      const ornId = isOrnamentId(phase.ornament_type)
        ? phase.ornament_type
        : isOrnamentId(phase.type)
          ? phase.type
          : undefined;
      const ornLabel = phase.ornament_type
        ? phase.ornament_type.charAt(0).toUpperCase() + phase.ornament_type.slice(1)
        : phase.type.charAt(0).toUpperCase() + phase.type.slice(1);
      return (
        <LessonPracticeSurface
          phaseId={phase.id}
          ornamentName={ornLabel}
          ornamentFrom={phase.from_swara}
          ornamentTo={phase.to_swara}
          ornamentId={ornId}
          fromSwara={phase.from_swara}
          voiceFeedback={engine.voiceFeedback}
          onAdvance={engine.advancePhase}
          advanceLabel="Done"
          saHz={engine.saHz}
          ragaId={phase.raga ?? ragaId}
        />
      );
    }

    // --- Raga recognition / comparison ------------------------------------

    case 'raga_identification':
    case 'raga_identification_advanced':
      return (
        <LessonPracticeSurface
          phaseId={phase.id}
          targetLabel="Listen, then sing."
          voiceFeedback={engine.voiceFeedback}
          onAdvance={engine.advancePhase}
          saHz={engine.saHz}
          ragaId={ragaId}
        />
      );

    case 'raga_comparison':
    case 'raga_comparison_advanced':
      return (
        <RagaComparisonPhase
          phase={phase}
          onAdvance={engine.advancePhase}
          onPlayPhrase={(phrase) => {
            for (const s of phrase) engine.audio.playSwara(s);
          }}
        />
      );

    // --- Assessment -------------------------------------------------------

    case 'mastery_challenge':
      return (
        <LessonPracticeSurface
          phaseId={phase.id}
          challengeTargets={phase.targets}
          voiceFeedback={engine.voiceFeedback}
          onAdvance={engine.advancePhase}
          saHz={engine.saHz}
          ragaId={ragaId}
        />
      );

    // --- Structured phases (Cluster F full engine) ------------------------

    case 'swara_comparison':
    case 'interval_exercise':
    case 'tala_exercise':
    case 'tala_melody_exercise':
    case 'grammar_exercise':
    case 'bandish_exercise':
    case 'composition_exercise':
    case 'taan_exercise':
    case 'teaching_exercise':
    case 'raga_rendering':
    case 'modulation_awareness':
    case 'controlled_deviation':
    case 'shruti_exercise':
    case 'ornament_context_exercise':
      return (
        <StructuredPhase
          phase={phase}
          onAdvance={engine.advancePhase}
        />
      );

    default:
      // Unknown phase type — skip (per spec)
      return (
        <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
          <button type="button" className={styles.actionButton} onClick={engine.advancePhase}>
            Continue
          </button>
        </motion.div>
      );
  }
}

// ---------------------------------------------------------------------------
// LessonRenderer
// ---------------------------------------------------------------------------

export default function LessonRenderer({
  engine,
  ragaId,
  ragaName,
  user,
}: LessonRendererProps) {
  const { state, lesson, phaseContext, pakadTriggered } = engine;

  // ---------------------------------------------------------------------------
  // Tantri string highlight — driven by SwaraIntroduction and PhrasePlayback.
  // When a non-voice phase highlights a swara, we compute its Hz and pass it
  // to Tantri as pitchHz with pitchClarity=1.0 for a perfect-accuracy flash.
  // Reset on every phase change so a stale highlight doesn't bleed into the
  // next phase.
  // ---------------------------------------------------------------------------
  const [highlightedSwara, setHighlightedSwara] = useState<string | null>(null);
  const phaseIdForReset = phaseContext?.phase.id;
  useEffect(() => {
    setHighlightedSwara(null);
  }, [phaseIdForReset]);

  const onHighlightString = useCallback((swara: string) => {
    setHighlightedSwara(swara);
  }, []);

  if (state === 'loading') {
    return (
      <div className={styles.lessonPage}>
        <div className={styles.centeredMessage}>
          <p>Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={styles.lessonPage}>
        <div className={styles.centeredMessage}>
          <p>Lesson unavailable.</p>
          <button type="button" className={styles.actionButton} onClick={engine.exitLesson}>
            Return
          </button>
        </div>
      </div>
    );
  }

  if (state === 'ready') {
    return null; // The parent component shows the home view
  }

  if (!phaseContext || !lesson) return null;

  const { phase, phaseIndex, totalPhases } = phaseContext;

  const isVoicePhase = phaseContext?.isVoicePhase ?? false;

  // Compute Hz for the highlighted swara (swara_introduction / phrase_playback)
  let highlightHz: number | undefined;
  if (highlightedSwara) {
    try {
      highlightHz = getSwaraFrequency(highlightedSwara as Swara, engine.saHz);
    } catch {
      highlightHz = undefined;
    }
  }

  // Tantri pitch input: voice phases use live voice; playback phases use highlight
  const tantriPitchHz = isVoicePhase
    ? (engine.voiceFeedback.hz ?? undefined)
    : highlightHz;
  const tantriPitchClarity = isVoicePhase
    ? engine.voiceFeedback.confidence
    : (highlightHz ? 1.0 : undefined);

  return (
    <div
      className={styles.lessonPage}
      data-raga={ragaId ?? lesson.raga_id}
      role="region"
      aria-label={`Lesson: ${lesson.meta.title}`}
    >
      {/* Tantri — the instrument, background layer */}
      <Tantri
        saHz={engine.saHz}
        ragaId={ragaId ?? lesson.raga_id}
        level="shishya"
        subLevel={phaseContext ? Math.min(Math.floor(phaseContext.phaseIndex / 3) + 1, 3) : 1}
        variant="full"
        pitchHz={tantriPitchHz}
        pitchClarity={tantriPitchClarity}
        analyser={engine.audio.pipelineActive ? engine.audio.getAnalyserNode() : null}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Exit button */}
      <button
        type="button"
        className={styles.backLink}
        onClick={engine.exitLesson}
        aria-label="Exit lesson"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Exit
      </button>

      {/* Phase label — small top-left label, suppressed for warmup */}
      {!phase.id.startsWith('__warmup_') && (
        <header className={styles.phaseHeader} aria-live="polite">
          <span className={styles.phaseLabel}>
            {phase.screenTitle ?? phase.type.replace(/_/g, ' ')}
          </span>
        </header>
      )}

      {/* Phase content */}
      <div className={styles.phaseContent}>
        <AnimatePresence mode="sync">
          <PhaseDispatcher
            key={phase.id}
            phase={phase}
            engine={engine}
            user={user}
            ragaId={ragaId ?? lesson.raga_id}
            onHighlightString={onHighlightString}
          />
        </AnimatePresence>
      </div>

      {/* Pakad ceremony overlay */}
      {pakadTriggered && phase.type === 'passive_phrase_recognition' && (
        <PakadMoment
          ragaName={phase.pakad_found_headline ?? ragaName ?? lesson.meta.subtitle}
          sargam={phase.pakad_found_subtext ?? ''}
          onDismiss={() => {}}
        />
      )}

      {/* Lesson navigation — back / skip */}
      {state !== 'lesson_complete' && phase.type !== 'session_summary' && (
        <div className={styles.lessonNav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={engine.goBackPhase}
            disabled={phaseIndex <= 0}
            aria-label="Go to previous phase"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={engine.advancePhase}
            aria-label="Skip to next phase"
          >
            Skip
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Progress hairline — 1px track at bottom of screen */}
      {state !== 'lesson_complete' && phase.type !== 'session_summary' && (
        <div
          className={styles.progressHairline}
          role="progressbar"
          aria-label="Lesson progress"
          aria-valuenow={phaseIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalPhases}
        >
          <div
            className={styles.progressHairlineFill}
            style={{ width: `${((phaseIndex + 1) / totalPhases) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
