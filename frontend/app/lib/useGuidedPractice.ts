'use client';

/**
 * @module frontend/lib/useGuidedPractice
 *
 * React hook for guided raga practice — 4 stages with star scoring.
 *
 * Stages: Individual Swaras -> Aroha -> Avaroha -> Pakad
 *
 * Each stage: listen (guide tone) -> sing (voice pipeline) -> result (stars)
 *
 * Uses the existing voice pipeline, scoring engine, and audio controls.
 * Collects VoiceEvents during singing, scores with scorePhrase / pitch
 * accuracy, and maps to 0-3 stars per stage.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Raga, SwaraNote, Swara } from '@/engine/theory/types';
import type { VoiceEvent } from '@/engine/voice/pipeline';
import type { PitchResult } from '@/engine/analysis/pitch-mapping';
import { getAccuracyScore } from '@/engine/analysis/pitch-mapping';
import { scorePhrase } from '@/engine/voice/accuracy';
import {
  PRACTICE_STAGES,
  computePracticeResult,
  scoreToStars,
} from '@/engine/analysis/practice-scoring';
import type {
  PracticeStageType,
  PracticeResult,
  StageResult,
  StarRating,
} from '@/engine/analysis/practice-scoring';
import { useLessonAudio } from './lesson-audio';
import type { VoiceFeedback } from './types';
import type { Level } from '@/engine/analysis/pitch-mapping';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StagePhase = 'listen' | 'ready' | 'sing' | 'scoring' | 'result';

export type PracticeState =
  | 'idle'
  | 'active'
  | 'complete';

export interface GuidedPracticeControls {
  // State
  readonly practiceState: PracticeState;
  readonly currentStageIndex: number;
  readonly currentStage: PracticeStageType;
  readonly stagePhase: StagePhase;
  readonly targetNotes: readonly SwaraNote[];
  readonly targetLabel: string;
  readonly stageResults: readonly StageResult[];
  readonly overallResult: PracticeResult | null;
  readonly voiceFeedback: VoiceFeedback;
  readonly isListening: boolean;

  // Per-swara tracking (for swaras stage)
  readonly currentSwaraIndex: number;
  readonly totalSwaras: number;

  // Actions
  start(): void;
  startSinging(): void;
  finishSinging(): void;
  nextStage(): void;
  retryStage(): void;
  exit(): void;

  // Audio
  readonly audio: ReturnType<typeof useLessonAudio>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IDLE_FEEDBACK: VoiceFeedback = {
  hz: null,
  centsDeviation: 0,
  targetSwara: 'Sa',
  detectedSwara: null,
  confidence: 0,
  amplitude: 0,
  pitchHistory: [],
};

/** Seconds to sing each individual swara. */
const SWARA_SING_DURATION = 4;

/** Seconds to sing a phrase (aroha/avaroha/pakad). */
const PHRASE_SING_DURATION = 15;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get the swaras to practice individually (unique swaras from aroha, excluding taar Sa). */
function getRagaSwaras(raga: Raga): SwaraNote[] {
  const seen = new Set<string>();
  const result: SwaraNote[] = [];
  for (const note of raga.aroha) {
    const key = `${note.swara}-${note.octave}`;
    // Skip taar Sa — we include it in aroha practice, not individual swaras
    if (note.octave === 'taar' && note.swara === 'Sa') continue;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(note);
    }
  }
  return result;
}

/** Get the target notes for a stage. */
function getStageTarget(
  stage: PracticeStageType,
  raga: Raga,
): readonly SwaraNote[] {
  switch (stage) {
    case 'swaras':
      return getRagaSwaras(raga);
    case 'aroha':
      return raga.aroha;
    case 'avaroha':
      return raga.avaroha;
    case 'pakad':
      // Use the first (most characteristic) pakad phrase
      return raga.pakad[0] ?? [];
  }
}

/** Format SwaraNote for display. */
function formatNote(note: SwaraNote): string {
  let s = note.swara.replace('_k', '(k)').replace('_t', '(t)');
  if (note.octave === 'taar') s += "'";
  if (note.octave === 'mandra') s = '.' + s;
  return s;
}

/** Get label for a stage's target. */
function getStageLabel(
  stage: PracticeStageType,
  target: readonly SwaraNote[],
): string {
  switch (stage) {
    case 'swaras':
      return target.map((n) => formatNote(n)).join('  ');
    case 'aroha':
      return target.map((n) => formatNote(n)).join(' ');
    case 'avaroha':
      return target.map((n) => formatNote(n)).join(' ');
    case 'pakad':
      return target.map((n) => formatNote(n)).join(' ');
  }
}

/** Convert a SwaraNote to the swara name string used by playSwara/playPhrase. */
function noteToPlayName(note: SwaraNote): string {
  if (note.octave === 'taar' && note.swara === 'Sa') return 'Sa_upper';
  return note.swara;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGuidedPractice(
  raga: Raga,
  saHz: number = 261.63,
  level: Level = 'shishya',
  previousStars: StarRating = 0,
): GuidedPracticeControls {
  // State
  const [practiceState, setPracticeState] = useState<PracticeState>('idle');
  const [stageIndex, setStageIndex] = useState(0);
  const [stagePhase, setStagePhase] = useState<StagePhase>('listen');
  const [stageResults, setStageResults] = useState<StageResult[]>([]);
  const [overallResult, setOverallResult] = useState<PracticeResult | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<VoiceFeedback>(IDLE_FEEDBACK);

  // Per-swara tracking
  const [currentSwaraIndex, setCurrentSwaraIndex] = useState(0);

  // Refs for voice event collection
  const voiceEventsRef = useRef<VoiceEvent[]>([]);
  const swaraAccuraciesRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);

  // Audio
  const audio = useLessonAudio(saHz, raga.id);

  // Derived
  const currentStage = PRACTICE_STAGES[stageIndex] ?? 'swaras';
  const targetNotes = useMemo(
    () => getStageTarget(currentStage, raga),
    [currentStage, raga],
  );
  const targetLabel = useMemo(
    () => getStageLabel(currentStage, targetNotes),
    [currentStage, targetNotes],
  );
  const ragaSwaras = useMemo(() => getRagaSwaras(raga), [raga]);

  // -------------------------------------------------------------------
  // Clear timer helper
  // -------------------------------------------------------------------
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------
  // Start practice
  // -------------------------------------------------------------------
  const start = useCallback(() => {
    setPracticeState('active');
    setStageIndex(0);
    setStagePhase('listen');
    setStageResults([]);
    setOverallResult(null);
    setVoiceFeedback(IDLE_FEEDBACK);
    setCurrentSwaraIndex(0);
    voiceEventsRef.current = [];
    swaraAccuraciesRef.current = [];

    // Play the first stage's guide tone after a brief pause
    setTimeout(() => {
      const target = getStageTarget('swaras', raga);
      const names = target.map(noteToPlayName);
      audio.playPhrase(names, 800, 200).then(() => {
        setStagePhase('ready');
      });
    }, 1000);
  }, [audio, raga]);

  // -------------------------------------------------------------------
  // Play guide tone for current stage
  // -------------------------------------------------------------------
  const playGuide = useCallback(
    (stage: PracticeStageType) => {
      setStagePhase('listen');
      const target = getStageTarget(stage, raga);
      const names = target.map(noteToPlayName);

      if (stage === 'swaras') {
        // Play each swara individually with longer gaps
        audio.playPhrase(names, 800, 200).then(() => {
          setStagePhase('ready');
        });
      } else {
        // Play phrase
        audio.playPhrase(names, 600, 80).then(() => {
          setStagePhase('ready');
        });
      }
    },
    [audio, raga],
  );

  // -------------------------------------------------------------------
  // Score the current stage
  // -------------------------------------------------------------------
  const scoreCurrentStage = useCallback(() => {
    clearTimer();
    audio.stopVoicePipeline();
    setStagePhase('scoring');

    let score: number;

    if (currentStage === 'swaras') {
      // Average accuracy across all individual swara attempts
      const accuracies = swaraAccuraciesRef.current;
      score = accuracies.length > 0
        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
        : 0;
    } else {
      // Score phrase against target
      const events = voiceEventsRef.current;
      const target = getStageTarget(currentStage, raga);
      score = scorePhrase(events, target, saHz, level);
    }

    const result: StageResult = {
      stage: currentStage,
      score,
      stars: scoreToStars(score),
    };

    setStageResults((prev) => {
      const next = [...prev];
      // Replace if retrying, add if new
      const existing = next.findIndex((r) => r.stage === currentStage);
      if (existing >= 0) {
        // Keep the better score on retry
        if (score > next[existing]!.score) {
          next[existing] = result;
        }
      } else {
        next.push(result);
      }
      return next;
    });

    setVoiceFeedback(IDLE_FEEDBACK);
    setStagePhase('result');
  }, [currentStage, raga, saHz, level, audio, clearTimer]);

  // -------------------------------------------------------------------
  // Start singing
  // -------------------------------------------------------------------
  const startSinging = useCallback(() => {
    voiceEventsRef.current = [];
    swaraAccuraciesRef.current = [];
    setCurrentSwaraIndex(0);
    setStagePhase('sing');
    startTimeRef.current = performance.now() / 1000;

    if (currentStage === 'swaras') {
      // For individual swaras, we cycle through each swara
      // Voice pipeline collects accuracy per swara
      const swaras = getRagaSwaras(raga);

      const startVoice = async () => {
        try {
          await audio.startVoicePipeline(
            (result: PitchResult) => {
              setVoiceFeedback({
                hz: result.hz,
                centsDeviation: result.deviationCents,
                targetSwara: swaras[0]?.swara ?? 'Sa',
                detectedSwara: result.nearestSwara,
                confidence: result.clarity,
                amplitude: result.accuracy,
                pitchHistory: [],
              });

              // Collect accuracy for current swara
              if (result.accuracy > 0) {
                swaraAccuraciesRef.current.push(result.accuracy);
              }
            },
          );
        } catch {
          // Mic denied — score what we have
          scoreCurrentStage();
        }
      };
      startVoice();

      // Auto-finish after total time
      const totalDuration = swaras.length * SWARA_SING_DURATION;
      timerRef.current = setTimeout(() => {
        scoreCurrentStage();
      }, totalDuration * 1000);

      // Track swara progression with intermediate timers
      swaras.forEach((_, i) => {
        if (i > 0) {
          setTimeout(() => {
            setCurrentSwaraIndex(i);
          }, i * SWARA_SING_DURATION * 1000);
        }
      });
    } else {
      // For phrases (aroha/avaroha/pakad), collect VoiceEvents
      const startVoice = async () => {
        try {
          await audio.startVoicePipeline(
            (result: PitchResult) => {
              const target = getStageTarget(currentStage, raga);
              setVoiceFeedback({
                hz: result.hz,
                centsDeviation: result.deviationCents,
                targetSwara: target[0]?.swara ?? 'Sa',
                detectedSwara: result.nearestSwara,
                confidence: result.clarity,
                amplitude: result.accuracy,
                pitchHistory: [],
              });

              // Collect as VoiceEvent for scorePhrase
              const event: VoiceEvent = {
                type: 'pitch',
                hz: result.hz,
                clarity: result.clarity,
                swara: result.nearestSwara,
                deviationCents: result.deviationCents,
                accuracy: result.accuracy,
                timestamp: performance.now() / 1000,
              };
              voiceEventsRef.current.push(event);
            },
          );
        } catch {
          scoreCurrentStage();
        }
      };
      startVoice();

      // Auto-finish after duration
      timerRef.current = setTimeout(() => {
        scoreCurrentStage();
      }, PHRASE_SING_DURATION * 1000);
    }
  }, [currentStage, raga, audio, scoreCurrentStage]);

  // -------------------------------------------------------------------
  // Finish singing (manual — user presses "Done")
  // -------------------------------------------------------------------
  const finishSinging = useCallback(() => {
    scoreCurrentStage();
  }, [scoreCurrentStage]);

  // -------------------------------------------------------------------
  // Next stage
  // -------------------------------------------------------------------
  const nextStage = useCallback(() => {
    const nextIdx = stageIndex + 1;
    if (nextIdx >= PRACTICE_STAGES.length) {
      // All stages complete — compute overall result
      setStageResults((prev) => {
        const result = computePracticeResult(
          prev.map((r) => ({ stage: r.stage, score: r.score })),
          previousStars,
        );
        setOverallResult(result);
        return prev;
      });
      setPracticeState('complete');
      return;
    }

    setStageIndex(nextIdx);
    voiceEventsRef.current = [];
    swaraAccuraciesRef.current = [];
    setCurrentSwaraIndex(0);
    setVoiceFeedback(IDLE_FEEDBACK);

    // Play guide for next stage
    const nextStageType = PRACTICE_STAGES[nextIdx]!;
    playGuide(nextStageType);
  }, [stageIndex, previousStars, playGuide]);

  // -------------------------------------------------------------------
  // Retry stage
  // -------------------------------------------------------------------
  const retryStage = useCallback(() => {
    voiceEventsRef.current = [];
    swaraAccuraciesRef.current = [];
    setCurrentSwaraIndex(0);
    setVoiceFeedback(IDLE_FEEDBACK);
    playGuide(currentStage);
  }, [currentStage, playGuide]);

  // -------------------------------------------------------------------
  // Exit
  // -------------------------------------------------------------------
  const exit = useCallback(() => {
    clearTimer();
    audio.stopVoicePipeline();
    audio.stopTanpura();
    audio.stopPlayback();
    setVoiceFeedback(IDLE_FEEDBACK);
    setPracticeState('idle');
    setStageIndex(0);
    setStagePhase('listen');
  }, [audio, clearTimer]);

  // -------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------
  useEffect(() => {
    return () => {
      clearTimer();
      audio.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------
  return {
    practiceState,
    currentStageIndex: stageIndex,
    currentStage,
    stagePhase,
    targetNotes,
    targetLabel,
    stageResults,
    overallResult,
    voiceFeedback,
    isListening: stagePhase === 'sing',

    currentSwaraIndex,
    totalSwaras: ragaSwaras.length,

    start,
    startSinging,
    finishSinging,
    nextStage,
    retryStage,
    exit,

    audio,
  };
}
