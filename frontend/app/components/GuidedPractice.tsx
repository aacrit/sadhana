'use client';

/**
 * GuidedPractice — Guided raga training with star scoring.
 *
 * Four stages: Individual Swaras -> Aroha -> Avaroha -> Pakad.
 * Each stage: listen to guide tone, sing, receive star rating.
 * Overall rating = minimum across all stages.
 * 2 stars to pass, stars contribute to XP.
 *
 * Uses Tantri as the primary visual surface during singing.
 * VoiceWave provides the ambient waveform background.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { Raga } from '@/engine/theory/types';
import { PRACTICE_STAGES, STAGE_LABELS } from '@/engine/analysis/practice-scoring';
import type { StarRating, StageResult } from '@/engine/analysis/practice-scoring';
import type { GuidedPracticeControls } from '../lib/useGuidedPractice';
import VoiceVisualization from './VoiceVisualization';
import Tantri from './Tantri';
import type { TantriPlayEvent } from '@/engine/interaction/tantri';
import { playSwaraNote, ensureAudioReady } from '@/engine/synthesis/swara-voice';
import styles from '../styles/guided-practice.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GuidedPracticeProps {
  readonly raga: Raga;
  readonly saHz: number;
  readonly controls: GuidedPracticeControls;
  readonly onExit: () => void;
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const fadeTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
};

// ---------------------------------------------------------------------------
// Star rendering
// ---------------------------------------------------------------------------

function Stars({
  count,
  max = 3,
  large = false,
}: {
  count: number;
  max?: number;
  large?: boolean;
}) {
  return (
    <div className={styles.starDisplay}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`${styles.star} ${i < count ? styles.starFilled : ''} ${large ? styles.starLarge : ''}`}
          aria-hidden="true"
        >
          {i < count ? '\u2605' : '\u2606'}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage progress indicator
// ---------------------------------------------------------------------------

function StageProgressBar({
  currentIndex,
  results,
}: {
  currentIndex: number;
  results: readonly StageResult[];
}) {
  return (
    <div className={styles.stageProgress} aria-label="Practice stages">
      {PRACTICE_STAGES.map((stage, i) => {
        const result = results.find((r) => r.stage === stage);
        const isActive = i === currentIndex;
        const isComplete = result != null;

        let circleClass = styles.stageDotCircle;
        if (isActive) circleClass += ' ' + styles.stageDotActive;
        if (isComplete) circleClass += ' ' + styles.stageDotComplete;

        return (
          <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {i > 0 && (
              <div
                className={`${styles.stageConnector} ${
                  results.find((r) => r.stage === PRACTICE_STAGES[i - 1]) ? styles.stageConnectorComplete : ''
                }`}
              />
            )}
            <div className={styles.stageDot}>
              <div className={circleClass}>
                {isComplete ? (
                  <span aria-label={`${String(result.stars)} stars`}>{'\u2605'}</span>
                ) : (
                  String(i + 1)
                )}
              </div>
              <span className={styles.stageDotLabel}>
                {STAGE_LABELS[stage].length > 8
                  ? STAGE_LABELS[stage].slice(0, 6) + '.'
                  : STAGE_LABELS[stage]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Idle screen
// ---------------------------------------------------------------------------

function IdleScreen({
  raga,
  onStart,
}: {
  raga: Raga;
  onStart: () => void;
}) {
  return (
    <motion.div {...fadeTransition} className={styles.idleScreen}>
      <h1 className={styles.idleTitle}>Practice {raga.name}</h1>
      <p className={styles.idleSubtitle}>
        Guided training in four stages. Tanpura will accompany you throughout.
        Earn stars based on your accuracy.
      </p>

      <div className={styles.stagePreview}>
        {PRACTICE_STAGES.map((stage, i) => (
          <div key={stage} className={styles.stagePreviewItem}>
            <span className={styles.stagePreviewNumber}>{String(i + 1)}</span>
            {STAGE_LABELS[stage]}
          </div>
        ))}
      </div>

      <button type="button" className={styles.actionButton} onClick={onStart}>
        Begin Practice
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Active practice screen
// ---------------------------------------------------------------------------

function ActiveScreen({
  raga,
  saHz,
  controls,
}: {
  raga: Raga;
  saHz: number;
  controls: GuidedPracticeControls;
}) {
  const {
    currentStageIndex,
    currentStage,
    stagePhase,
    targetNotes,
    targetLabel,
    stageResults,
    voiceFeedback,
    currentSwaraIndex,
    totalSwaras,
    startSinging,
    finishSinging,
    nextStage,
    retryStage,
    audio,
  } = controls;

  const currentResult = stageResults.find((r) => r.stage === currentStage);
  const isVoiceActive = stagePhase === 'sing';

  // Tantri string tap handler
  const handleStringTrigger = async (event: TantriPlayEvent) => {
    await ensureAudioReady();
    playSwaraNote(
      { swara: event.swara, octave: event.octave ?? 4 },
      saHz,
      { duration: 0.8, volume: (event.velocity ?? 0.7) * 0.5 },
    );
  };

  return (
    <>
      {/* Stage progress */}
      <StageProgressBar
        currentIndex={currentStageIndex}
        results={stageResults}
      />

      {/* Stage header */}
      <header className={styles.stageHeader} aria-live="polite">
        <p className={styles.ragaTitle}>{raga.name}</p>
        <h1 className={styles.stageTitle}>{STAGE_LABELS[currentStage]}</h1>
        {stagePhase === 'listen' && (
          <p className={styles.stageSubtitle}>Listen to the guide tone...</p>
        )}
        {stagePhase === 'ready' && (
          <p className={styles.stageSubtitle}>Your turn. Sing what you heard.</p>
        )}
        {stagePhase === 'sing' && currentStage === 'swaras' && (
          <p className={styles.stageSubtitle}>
            Swara {String(currentSwaraIndex + 1)} of {String(totalSwaras)}
          </p>
        )}
      </header>

      {/* Target display */}
      {(stagePhase === 'ready' || stagePhase === 'sing') && (
        <div className={styles.targetDisplay}>
          {currentStage === 'swaras' && stagePhase === 'sing' ? (
            <>
              <div className={styles.currentSwara}>
                {targetNotes[currentSwaraIndex]
                  ? targetNotes[currentSwaraIndex]!.swara
                    .replace('_k', '(k)')
                    .replace('_t', '(t)')
                  : ''}
              </div>
              <div className={styles.swaraCounter}>
                {String(currentSwaraIndex + 1)} / {String(totalSwaras)}
              </div>
            </>
          ) : (
            <div className={styles.targetSargam}>{targetLabel}</div>
          )}
        </div>
      )}

      {/* Content area */}
      <div className={styles.contentArea}>
        {/* Tantri — the instrument */}
        {isVoiceActive && (
          <div style={{
            width: '100%',
            maxWidth: 'var(--max-width, 720px)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            <Tantri
              saHz={saHz}
              ragaId={raga.id}
              level="shishya"
              subLevel={2}
              variant="compact"
              pitchHz={voiceFeedback.hz ?? undefined}
              pitchClarity={voiceFeedback.confidence}
              analyser={audio.pipelineActive ? audio.getAnalyserNode() : null}
              onStringTrigger={handleStringTrigger}
            />
          </div>
        )}

        {/* Voice visualization during singing */}
        {isVoiceActive && (
          <VoiceVisualization
            feedback={voiceFeedback}
            className={styles.voiceViz}
          />
        )}

        {/* Listen indicator */}
        {stagePhase === 'listen' && (
          <div className={styles.listenIndicator}>
            <div className={styles.listenPulse} aria-label="Playing guide tone" />
            <span className={styles.listenText}>Listen...</span>
          </div>
        )}

        {/* Singing indicator */}
        {isVoiceActive && (
          <div className={styles.singingIndicator}>
            <span className={styles.singingDot} />
            Listening to your voice
          </div>
        )}

        {/* Stage result */}
        <AnimatePresence mode="wait">
          {stagePhase === 'result' && currentResult && (
            <motion.div
              key="result"
              {...fadeTransition}
              className={styles.stageResult}
            >
              <span className={styles.resultLabel}>
                {currentResult.stars >= 2 ? 'Well done!' : 'Keep practicing'}
              </span>
              <Stars count={currentResult.stars} large />
              <span className={styles.scoreText}>
                {Math.round(currentResult.score * 100)}% accuracy
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {stagePhase === 'ready' && (
          <button type="button" className={styles.actionButton} onClick={startSinging}>
            Start Singing
          </button>
        )}

        {stagePhase === 'sing' && (
          <button type="button" className={styles.actionButton} onClick={finishSinging}>
            Done
          </button>
        )}

        {stagePhase === 'result' && (
          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.actionButtonSecondary}
              onClick={retryStage}
            >
              Retry
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={nextStage}
            >
              {currentStageIndex < PRACTICE_STAGES.length - 1 ? 'Next Stage' : 'See Results'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Complete screen
// ---------------------------------------------------------------------------

function CompleteScreen({
  raga,
  controls,
  onExit,
}: {
  raga: Raga;
  controls: GuidedPracticeControls;
  onExit: () => void;
}) {
  const { overallResult, stageResults } = controls;
  if (!overallResult) return null;

  return (
    <motion.div {...fadeTransition} className={styles.completeScreen}>
      <h1 className={styles.completeTitle}>{raga.name} Practice</h1>

      <p className={styles.completeMessage}>
        {overallResult.passed
          ? 'You have demonstrated solid command of this raga.'
          : 'Continue practicing to strengthen your command of this raga.'}
      </p>

      {/* Overall stars */}
      <div className={styles.overallStars}>
        <span className={styles.overallLabel}>Overall</span>
        <Stars count={overallResult.overallStars} large />
      </div>

      {/* Pass/fail label */}
      {overallResult.passed ? (
        <span className={styles.passLabel}>Passed</span>
      ) : (
        <span className={styles.failLabel}>2 stars needed to pass</span>
      )}

      {/* XP */}
      {overallResult.xpEarned > 0 && (
        <span className={styles.xpBadge}>+{String(overallResult.xpEarned)} XP</span>
      )}

      {/* Stage breakdown */}
      <div className={styles.stageBreakdown}>
        {stageResults.map((result) => (
          <div key={result.stage} className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>
              {STAGE_LABELS[result.stage]}
            </span>
            <div className={styles.breakdownStars}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`${styles.breakdownStar} ${
                    i < result.stars ? styles.breakdownStarFilled : ''
                  }`}
                >
                  {i < result.stars ? '\u2605' : '\u2606'}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.actionsRow}>
        <button
          type="button"
          className={styles.actionButtonSecondary}
          onClick={() => controls.start()}
        >
          Practice Again
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={onExit}
        >
          Return
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// GuidedPractice
// ---------------------------------------------------------------------------

export default function GuidedPractice({
  raga,
  saHz,
  controls,
  onExit,
}: GuidedPracticeProps) {
  const { practiceState, exit } = controls;

  const handleExit = () => {
    exit();
    onExit();
  };

  return (
    <div
      className={styles.page}
      data-raga={raga.id}
      role="region"
      aria-label={`Guided practice: ${raga.name}`}
    >
      {/* Exit button */}
      <button
        type="button"
        className={styles.backLink}
        onClick={handleExit}
        aria-label="Exit practice"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Exit
      </button>

      <AnimatePresence mode="wait">
        {practiceState === 'idle' && (
          <IdleScreen
            key="idle"
            raga={raga}
            onStart={controls.start}
          />
        )}

        {practiceState === 'active' && (
          <ActiveScreen
            key="active"
            raga={raga}
            saHz={saHz}
            controls={controls}
          />
        )}

        {practiceState === 'complete' && (
          <CompleteScreen
            key="complete"
            raga={raga}
            controls={controls}
            onExit={handleExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
