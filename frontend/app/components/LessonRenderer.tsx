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
import type { LessonPhase } from '../lib/lesson-loader';
import type { LessonEngineControls } from '../lib/useLessonEngine';
import SwaraIntroduction from './SwaraIntroduction';
import PhrasePlayback from './PhrasePlayback';
import VoiceVisualization from './VoiceVisualization';
import PakadMoment from './PakadMoment';
import Tantri from './Tantri';
import styles from '../styles/lesson-renderer.module.css';

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
// ---------------------------------------------------------------------------

const phaseTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
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
      {!phase.duration_s && (
        <button type="button" className={styles.actionButton} onClick={onAdvance}>
          Continue
        </button>
      )}
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

/** Pitch exercise — single swara hold with voice feedback. */
function PitchExercisePhase({
  phase,
  onAdvance,
  voiceFeedback,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
  voiceFeedback: LessonEngineControls['voiceFeedback'];
}) {
  // Silent warmup phase — no copy, no button. Tantri shows the swara; engine auto-advances.
  const isWarmup = phase.id.startsWith('__warmup_');
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <VoiceVisualization feedback={voiceFeedback} className={styles.voiceViz} />
      {!isWarmup && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={onAdvance}
          style={{ marginTop: 'var(--space-4)' }}
        >
          Continue
        </button>
      )}
    </motion.div>
  );
}

/** Phrase exercise — guided singing with optional guide tone. */
function PhraseExercisePhase({
  phase,
  onAdvance,
  voiceFeedback,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
  voiceFeedback: LessonEngineControls['voiceFeedback'];
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <p>Follow the guide tone.</p>
      <VoiceVisualization feedback={voiceFeedback} className={styles.voiceViz} />
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

/** Free singing with passive pakad recognition. */
function FreeSingingPhase({
  phase,
  onAdvance,
  voiceFeedback,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
  voiceFeedback: LessonEngineControls['voiceFeedback'];
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <VoiceVisualization feedback={voiceFeedback} className={styles.voiceViz} />
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
 * Ornament exercise — meend, andolan, gamak.
 * Shows from/to swara info and voice visualization.
 * Full ornament trajectory evaluation is a Cluster F item.
 */
function OrnamentExercisePhase({
  phase,
  onAdvance,
  voiceFeedback,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
  voiceFeedback: LessonEngineControls['voiceFeedback'];
}) {
  const ornamentLabel = phase.ornament_type
    ? phase.ornament_type.charAt(0).toUpperCase() + phase.ornament_type.slice(1)
    : 'Ornament';
  const hasRoute = phase.from_swara && phase.to_swara;
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      {hasRoute && (
        <p className={styles.ornamentRoute}>
          {phase.from_swara} <span className={styles.ornamentArrow}>&rarr;</span> {phase.to_swara}
        </p>
      )}
      <p className={styles.ornamentLabel}>{ornamentLabel}</p>
      <VoiceVisualization feedback={voiceFeedback} className={styles.voiceViz} />
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
 * Raga identification — engine plays pakad, student sings in response.
 * Full engine integration (pakad playback + response evaluation) is Cluster F.
 */
function RagaIdentificationPhase({
  phase,
  onAdvance,
  voiceFeedback,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
  voiceFeedback: LessonEngineControls['voiceFeedback'];
}) {
  return (
    <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
      <p className={styles.phaseHint}>
        Listen, then sing.
      </p>
      <VoiceVisualization feedback={voiceFeedback} className={styles.voiceViz} />
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
 * Shows targets and accepts voice input. Full auto-scoring is Cluster F.
 */
function MasteryChallengePhase({
  phase,
  onAdvance,
  voiceFeedback,
}: {
  phase: LessonPhase;
  onAdvance: () => void;
  voiceFeedback: LessonEngineControls['voiceFeedback'];
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
      <VoiceVisualization feedback={voiceFeedback} className={styles.voiceViz} />
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
}: {
  phase: LessonPhase;
  engine: LessonEngineControls;
  user?: { streak: number; xp: number };
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
          />
        </motion.div>
      );

    case 'phrase_playback':
      return (
        <motion.div key={phase.id} {...phaseTransition}>
          <PhrasePlayback
            phrase={[...(phase.phrase ?? [])]}
            showLabels={phase.show_labels ?? false}
            onComplete={engine.advancePhase}
            repeatCount={phase.repeat ?? 1}
            onPlaySwara={(s) => engine.audio.playSwara(s)}
          />
        </motion.div>
      );

    case 'pitch_exercise':
      return (
        <PitchExercisePhase
          phase={phase}
          onAdvance={engine.advancePhase}
          voiceFeedback={engine.voiceFeedback}
        />
      );

    case 'phrase_exercise':
      return (
        <PhraseExercisePhase
          phase={phase}
          onAdvance={engine.advancePhase}
          voiceFeedback={engine.voiceFeedback}
        />
      );

    case 'call_response':
      // Placeholder — full call_response is Cluster F
      return (
        <motion.div key={phase.id} {...phaseTransition} className={styles.centeredMessage}>
          <p>Call and response coming soon.</p>
          <button type="button" className={styles.actionButton} onClick={engine.advancePhase}>
            Continue
          </button>
        </motion.div>
      );

    case 'passive_phrase_recognition':
      return (
        <FreeSingingPhase
          phase={phase}
          onAdvance={engine.advancePhase}
          voiceFeedback={engine.voiceFeedback}
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
    case 'meend':
      return (
        <OrnamentExercisePhase
          phase={phase}
          onAdvance={engine.advancePhase}
          voiceFeedback={engine.voiceFeedback}
        />
      );

    // --- Raga recognition / comparison ------------------------------------

    case 'raga_identification':
    case 'raga_identification_advanced':
      return (
        <RagaIdentificationPhase
          phase={phase}
          onAdvance={engine.advancePhase}
          voiceFeedback={engine.voiceFeedback}
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
        <MasteryChallengePhase
          phase={phase}
          onAdvance={engine.advancePhase}
          voiceFeedback={engine.voiceFeedback}
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
        pitchHz={isVoicePhase ? (engine.voiceFeedback.hz ?? undefined) : undefined}
        pitchClarity={isVoicePhase ? engine.voiceFeedback.confidence : undefined}
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

      {/* Phase header — suppressed for silent warmup phase */}
      {!phase.id.startsWith('__warmup_') && (
        <header className={styles.phaseHeader} aria-live="polite">
          <h1 className={styles.phaseTitle}>
            {phase.screenTitle ?? phase.type.replace(/_/g, ' ')}
          </h1>
          {phase.body && <p className={styles.phaseBody}>{phase.body}</p>}
        </header>
      )}

      {/* Phase content */}
      <div className={styles.phaseContent}>
        <AnimatePresence mode="wait">
          <PhaseDispatcher
            key={phase.id}
            phase={phase}
            engine={engine}
            user={user}
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

      {/* Progress dots */}
      {state !== 'lesson_complete' && phase.type !== 'session_summary' && (
        <nav className={styles.progressDots} aria-label="Lesson progress">
          {lesson.phases.map((p, i) => {
            let dotClass = styles.progressDot;
            if (i === phaseIndex) {
              dotClass += ' ' + styles.progressDotCurrent;
            } else if (i < phaseIndex) {
              dotClass += ' ' + styles.progressDotComplete;
            }
            return (
              <div
                key={p.id}
                className={dotClass}
                aria-label={`Phase ${String(i + 1)} of ${String(totalPhases)}${i === phaseIndex ? ' (current)' : ''}`}
              />
            );
          })}
        </nav>
      )}
    </div>
  );
}
