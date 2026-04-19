'use client';

/**
 * @module frontend/lib/useFreeformSession
 *
 * React hook for the Freeform Riyaz mode — pure exploration with no goals.
 *
 * The tanpura plays, the student sings, swaras appear as they are detected,
 * and harmonies trigger visual reactions. No exercises, no scoring, no targets.
 * Just the student and the raga.
 *
 * Wires together:
 *   - TanpuraDrone (continuous reference drone)
 *   - VoicePipeline (real-time pitch detection, swara mapping)
 *   - Harmony strength calculation (consonance with Sa)
 *   - Swara event detection (stable swara debouncing)
 *   - Session persistence (Supabase, fire-and-forget)
 *
 * All Tone.js / AudioContext / Web Audio API usage is inside useEffect or
 * event handlers — never at module top level — for SSR safety with Next.js 15.
 */

import { useRef, useState, useCallback, useEffect } from 'react';

import { TanpuraDrone } from '@/engine/synthesis/tanpura';
import { VoicePipeline } from '@/engine/voice/pipeline';
import type { VoiceEvent } from '@/engine/voice/pipeline';
import { SWARAS, getSwaraBySymbol } from '@/engine/theory/swaras';
import type { Swara } from '@/engine/theory/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default Sa frequency: C4 in Hz. */
const DEFAULT_SA_HZ = 261.6256;

/** Minimum duration in ms a swara must be stable to emit a SwaraEvent. */
const SWARA_DEBOUNCE_MS = 60;

/** Maximum time on same swara before emitting a new event. */
const SAME_SWARA_REPEAT_MS = 2000;

/** Maximum number of SwaraEvents in the history buffer. */
const HISTORY_MAX = 30;

/** Minimum session duration in seconds to persist to Supabase. */
const MIN_SESSION_DURATION_S = 30;

/** Clarity threshold for pitch detection. Lower = more responsive, higher = more accurate. */
const CLARITY_THRESHOLD = 0.70;

/** Cents threshold for "in tune". */
const IN_TUNE_CENTS = 20;

// ---------------------------------------------------------------------------
// Devanagari mapping
// ---------------------------------------------------------------------------

/**
 * Maps engine swara symbols to display-quality Devanagari.
 * These are the correct sargam abbreviations used in Hindustani notation.
 */
const DEVANAGARI_MAP: Readonly<Record<Swara, string>> = {
  Sa: '\u0938\u093E',         // सा
  Re_k: '\u0930\u0947\u0952', // रे॒
  Re: '\u0930\u0947',         // रे
  Ga_k: '\u0917\u0952',       // ग॒
  Ga: '\u0917',               // ग
  Ma: '\u092E',               // म
  Ma_t: '\u092E\u0951',       // म॑
  Pa: '\u092A',               // प
  Dha_k: '\u0927\u0952',      // ध॒
  Dha: '\u0927',              // ध
  Ni_k: '\u0928\u093F\u0952', // नि॒
  Ni: '\u0928\u093F',         // नि
};

/**
 * Maps engine swara symbols to full romanised names.
 */
const FULL_NAME_MAP: Readonly<Record<Swara, string>> = {
  Sa: 'Sa',
  Re_k: 'Komal Re',
  Re: 'Shuddha Re',
  Ga_k: 'Komal Ga',
  Ga: 'Shuddha Ga',
  Ma: 'Shuddha Ma',
  Ma_t: 'Tivra Ma',
  Pa: 'Pa',
  Dha_k: 'Komal Dha',
  Dha: 'Shuddha Dha',
  Ni_k: 'Komal Ni',
  Ni: 'Shuddha Ni',
};

/**
 * Maps engine swara symbols to short display names (7 shuddha names).
 */
const SHORT_NAME_MAP: Readonly<Record<Swara, string>> = {
  Sa: 'Sa',
  Re_k: 'Re',
  Re: 'Re',
  Ga_k: 'Ga',
  Ga: 'Ga',
  Ma: 'Ma',
  Ma_t: 'Ma',
  Pa: 'Pa',
  Dha_k: 'Dha',
  Dha: 'Dha',
  Ni_k: 'Ni',
  Ni: 'Ni',
};

// ---------------------------------------------------------------------------
// Harmony strength table
// ---------------------------------------------------------------------------

/**
 * Consonance strength relative to Sa, derived from the overtone series.
 * Higher = more consonant with the tonic.
 */
const HARMONY_STRENGTH_MAP: Readonly<Record<Swara, number>> = {
  Sa: 1.0,       // Unison (1:1)
  Re_k: 0.30,    // Minor second — dissonant
  Re: 0.50,      // Major second (9:8)
  Ga_k: 0.30,    // Minor third
  Ga: 0.65,      // Major third (5:4)
  Ma: 0.70,      // Perfect fourth (4:3)
  Ma_t: 0.30,    // Tritone — most dissonant interval
  Pa: 0.85,      // Perfect fifth (3:2)
  Dha_k: 0.30,   // Minor sixth
  Dha: 0.50,     // Major sixth (5:3)
  Ni_k: 0.30,    // Minor seventh
  Ni: 0.30,      // Major seventh
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SwaraEvent {
  /** Short swara name: "Sa" | "Re" | "Ga" | "Ma" | "Pa" | "Dha" | "Ni" */
  swara: string;
  /** Full name: "Sa" | "Komal Re" | "Shuddha Ga" etc. */
  swaraFull: string;
  /** Devanagari: सा, रे॒, ग, etc. */
  devanagari: string;
  /** Detected frequency in Hz. */
  hz: number;
  /** Timestamp (performance.now() ms). */
  timestamp: number;
  /** Duration in ms that this swara was held. */
  durationMs: number;
  /** Within +/-20 cents of a known shruti. */
  inTune: boolean;
  /** 0-1: how consonant with Sa (1 = perfect unison/octave/Pa). */
  harmonyStrength: number;
}

export interface FreeformState {
  // Live pitch
  currentHz: number | null;
  currentClarity: number;
  currentSwara: string | null;
  currentSwaraFull: string | null;
  currentDevanagari: string | null;
  centsDev: number | null;
  inTune: boolean;
  harmonyStrength: number;

  // Session history
  swaraHistory: SwaraEvent[];
  sessionDurationS: number;
  totalSwaraCount: number;

  // Status
  isListening: boolean;
  tanpuraActive: boolean;
  micPermission: 'unknown' | 'granted' | 'denied';
  saHz: number;
}

export interface FreeformControls {
  startListening(): Promise<void>;
  stopListening(): void;
  toggleTanpura(): void;
  dispose(): void;
  getAnalyserNode(): AnalyserNode | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the effective harmony strength, accounting for tuning deviation.
 * If more than +/-25 cents off, reduce harmony by 0.4 (floor 0).
 */
function effectiveHarmony(swara: Swara, centsDev: number): number {
  const base = HARMONY_STRENGTH_MAP[swara];
  if (Math.abs(centsDev) > 25) {
    return Math.max(0, base - 0.4);
  }
  return base;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that manages the entire freeform audio session.
 *
 * Provides live pitch state, swara event history, tanpura control,
 * and session persistence. All audio objects are ref-stored to avoid
 * unnecessary re-renders.
 *
 * @param saHz - The student's Sa frequency in Hz (default: C4 = 261.6256)
 * @returns Combined state and controls for the freeform UI
 */
export function useFreeformSession(
  saHz: number = DEFAULT_SA_HZ,
): FreeformState & FreeformControls {
  // -----------------------------------------------------------------------
  // State — values the UI renders
  // -----------------------------------------------------------------------
  const [currentHz, setCurrentHz] = useState<number | null>(null);
  const [currentClarity, setCurrentClarity] = useState(0);
  const [currentSwara, setCurrentSwara] = useState<string | null>(null);
  const [currentSwaraFull, setCurrentSwaraFull] = useState<string | null>(null);
  const [currentDevanagari, setCurrentDevanagari] = useState<string | null>(null);
  const [centsDev, setCentsDev] = useState<number | null>(null);
  const [inTune, setInTune] = useState(false);
  const [harmonyStrength, setHarmonyStrength] = useState(0);

  const [swaraHistory, setSwaraHistory] = useState<SwaraEvent[]>([]);
  const [sessionDurationS, setSessionDurationS] = useState(0);
  const [totalSwaraCount, setTotalSwaraCount] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const [tanpuraActive, setTanpuraActive] = useState(false);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // -----------------------------------------------------------------------
  // Refs — mutable values that must not trigger re-renders
  // -----------------------------------------------------------------------
  const tanpuraRef = useRef<TanpuraDrone | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);
  const disposedRef = useRef(false);

  const saHzRef = useRef(saHz);
  saHzRef.current = saHz;

  // Swara event detection state
  const currentSwaraSymbolRef = useRef<Swara | null>(null);
  const swaraStartTimeRef = useRef<number>(0);
  const swaraStartHzRef = useRef<number>(0);
  const lastEventTimeRef = useRef<number>(0);
  const lastEmittedSwaraRef = useRef<Swara | null>(null);
  const lastCentsDevRef = useRef<number>(0);

  // Session timing
  const sessionStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSwaraCountRef = useRef(0);

  // -----------------------------------------------------------------------
  // Swara event emitter
  // -----------------------------------------------------------------------

  const emitSwaraEvent = useCallback(
    (swara: Swara, hz: number, durationMs: number, deviation: number) => {
      const isInTune = Math.abs(deviation) <= IN_TUNE_CENTS;
      const harmony = effectiveHarmony(swara, deviation);

      const event: SwaraEvent = {
        swara: SHORT_NAME_MAP[swara],
        swaraFull: FULL_NAME_MAP[swara],
        devanagari: DEVANAGARI_MAP[swara],
        hz,
        timestamp: performance.now(),
        durationMs,
        inTune: isInTune,
        harmonyStrength: harmony,
      };

      totalSwaraCountRef.current += 1;
      setTotalSwaraCount(totalSwaraCountRef.current);

      setSwaraHistory((prev) => {
        const next = [...prev, event];
        if (next.length > HISTORY_MAX) {
          return next.slice(next.length - HISTORY_MAX);
        }
        return next;
      });

      lastEventTimeRef.current = performance.now();
      lastEmittedSwaraRef.current = swara;
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Pitch event handler (called by VoicePipeline on every detection frame)
  // -----------------------------------------------------------------------

  const handlePitchEvent = useCallback(
    (event: VoiceEvent) => {
      if (disposedRef.current) return;

      if (event.type === 'silence' || event.type === 'noise') {
        // On silence: if we were tracking a swara long enough, emit it
        if (currentSwaraSymbolRef.current) {
          const elapsed = performance.now() - swaraStartTimeRef.current;
          if (elapsed >= SWARA_DEBOUNCE_MS) {
            emitSwaraEvent(
              currentSwaraSymbolRef.current,
              swaraStartHzRef.current,
              elapsed,
              lastCentsDevRef.current,
            );
          }
          currentSwaraSymbolRef.current = null;
        }
        setCurrentHz(null);
        setCurrentClarity(0);
        setCurrentSwara(null);
        setCurrentSwaraFull(null);
        setCurrentDevanagari(null);
        setCentsDev(null);
        setInTune(false);
        setHarmonyStrength(0);
        return;
      }

      // Valid pitch event
      if (!event.hz || !event.swara || !event.pitchResult) return;

      const detectedSwara = event.swara;
      const deviation = event.pitchResult.deviationCents;
      const isInTune = Math.abs(deviation) <= IN_TUNE_CENTS;
      const harmony = effectiveHarmony(detectedSwara, deviation);

      // Update live state
      setCurrentHz(event.hz);
      setCurrentClarity(event.clarity ?? event.pitchResult.clarity);
      setCurrentSwara(SHORT_NAME_MAP[detectedSwara]);
      setCurrentSwaraFull(FULL_NAME_MAP[detectedSwara]);
      setCurrentDevanagari(DEVANAGARI_MAP[detectedSwara]);
      setCentsDev(deviation);
      lastCentsDevRef.current = deviation;
      setInTune(isInTune);
      setHarmonyStrength(harmony);

      const now = performance.now();

      // Swara event detection logic
      if (detectedSwara !== currentSwaraSymbolRef.current) {
        // Swara changed — emit previous if it was stable long enough
        if (currentSwaraSymbolRef.current) {
          const elapsed = now - swaraStartTimeRef.current;
          if (elapsed >= SWARA_DEBOUNCE_MS) {
            emitSwaraEvent(
              currentSwaraSymbolRef.current,
              swaraStartHzRef.current,
              elapsed,
              deviation,
            );
          }
        }
        // Start tracking new swara
        currentSwaraSymbolRef.current = detectedSwara;
        swaraStartTimeRef.current = now;
        swaraStartHzRef.current = event.hz;
      } else {
        // Same swara — check if we should emit a repeat event (>2s on same)
        const elapsed = now - swaraStartTimeRef.current;
        const timeSinceLastEmit = now - lastEventTimeRef.current;

        if (
          elapsed >= SWARA_DEBOUNCE_MS &&
          timeSinceLastEmit >= SAME_SWARA_REPEAT_MS &&
          lastEmittedSwaraRef.current === detectedSwara
        ) {
          emitSwaraEvent(detectedSwara, event.hz, elapsed, deviation);
          swaraStartTimeRef.current = now;
          swaraStartHzRef.current = event.hz;
        }
      }
    },
    [emitSwaraEvent],
  );

  // -----------------------------------------------------------------------
  // Tanpura controls
  // -----------------------------------------------------------------------

  const startTanpura = useCallback(() => {
    if (disposedRef.current) return;

    if (!tanpuraRef.current || !tanpuraRef.current.isRunning()) {
      // Freeform uses 2-string default (Sa + ground) for all users.
      // groundString is resolved at session start — ragaId is stored in ref
      // from the useFreeformSession params at call site.
      tanpuraRef.current = new TanpuraDrone({
        sa_hz: saHzRef.current,
        volume: 0.3,
        stringCount: 2,
      });
    }

    tanpuraRef.current.start().then(() => {
      if (!disposedRef.current) {
        setTanpuraActive(true);
      }
    });
  }, []);

  const stopTanpura = useCallback(() => {
    if (tanpuraRef.current && tanpuraRef.current.isRunning()) {
      tanpuraRef.current.stop();
    }
    setTanpuraActive(false);
  }, []);

  const toggleTanpura = useCallback(() => {
    if (tanpuraActive) {
      stopTanpura();
    } else {
      startTanpura();
    }
  }, [tanpuraActive, startTanpura, stopTanpura]);

  // -----------------------------------------------------------------------
  // Voice pipeline controls
  // -----------------------------------------------------------------------

  const startListening = useCallback(async (): Promise<void> => {
    if (disposedRef.current || isListening) return;

    // Stop any existing pipeline
    if (pipelineRef.current) {
      pipelineRef.current.stop();
      pipelineRef.current = null;
    }

    try {
      const pipeline = new VoicePipeline({
        sa_hz: saHzRef.current,
        // No ragaId — freeform mode, all swaras welcome
        clarityThreshold: CLARITY_THRESHOLD,
        onPitch: handlePitchEvent,
        onSilence: () => {
          // Treat silence as a pitch event with 'silence' type
          handlePitchEvent({
            type: 'silence',
            timestamp: 0,
          });
        },
      });

      pipelineRef.current = pipeline;
      await pipeline.start();

      if (disposedRef.current) return;

      setMicPermission('granted');
      setIsListening(true);

      // Start session timer
      sessionStartRef.current = performance.now();
      totalSwaraCountRef.current = 0;
      setTotalSwaraCount(0);
      setSwaraHistory([]);
      setSessionDurationS(0);

      timerRef.current = setInterval(() => {
        if (disposedRef.current) return;
        const elapsed = (performance.now() - sessionStartRef.current) / 1000;
        setSessionDurationS(Math.floor(elapsed));
      }, 1000);

      // Also start tanpura if not already running
      if (!tanpuraRef.current || !tanpuraRef.current.isRunning()) {
        startTanpura();
      }
    } catch (err) {
      // getUserMedia denied or failed
      if (
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      ) {
        setMicPermission('denied');
      }
      // Re-throw so the UI can handle other errors
      throw err;
    }
  }, [isListening, handlePitchEvent, startTanpura]);

  const stopListening = useCallback(() => {
    // Stop pipeline
    if (pipelineRef.current) {
      pipelineRef.current.stop();
      pipelineRef.current = null;
    }

    // Stop session timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Emit final swara if pending
    if (currentSwaraSymbolRef.current) {
      const elapsed = performance.now() - swaraStartTimeRef.current;
      if (elapsed >= SWARA_DEBOUNCE_MS) {
        emitSwaraEvent(
          currentSwaraSymbolRef.current,
          swaraStartHzRef.current,
          elapsed,
          centsDev ?? 0,
        );
      }
      currentSwaraSymbolRef.current = null;
    }

    // Clear live state
    setCurrentHz(null);
    setCurrentSwara(null);
    setCurrentSwaraFull(null);
    setCurrentDevanagari(null);
    setCentsDev(null);
    setInTune(false);
    setHarmonyStrength(0);
    setIsListening(false);

    // Calculate final duration
    const finalDurationS = sessionStartRef.current
      ? Math.floor((performance.now() - sessionStartRef.current) / 1000)
      : 0;
    setSessionDurationS(finalDurationS);

    // Save to Supabase if session was long enough (fire-and-forget)
    if (finalDurationS >= MIN_SESSION_DURATION_S) {
      void saveFreeformSession(saHzRef.current, finalDurationS);
    }
  }, [emitSwaraEvent, centsDev]);

  // -----------------------------------------------------------------------
  // Dispose — called in useEffect cleanup
  // -----------------------------------------------------------------------

  const dispose = useCallback(() => {
    disposedRef.current = true;

    if (pipelineRef.current) {
      pipelineRef.current.stop();
      pipelineRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (tanpuraRef.current && tanpuraRef.current.isRunning()) {
      tanpuraRef.current.stop();
    }
    tanpuraRef.current = null;

    setTanpuraActive(false);
    setIsListening(false);
  }, []);

  // -----------------------------------------------------------------------
  // Auto-cleanup on unmount
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  // -----------------------------------------------------------------------
  // Return combined state and controls
  // -----------------------------------------------------------------------

  return {
    // Live pitch
    currentHz,
    currentClarity,
    currentSwara,
    currentSwaraFull,
    currentDevanagari,
    centsDev,
    inTune,
    harmonyStrength,

    // Session history
    swaraHistory,
    sessionDurationS,
    totalSwaraCount,

    // Status
    isListening,
    tanpuraActive,
    micPermission,
    saHz,

    // Controls
    startListening,
    stopListening,
    toggleTanpura,
    dispose,

    // AnalyserNode for VoiceWave visualization
    getAnalyserNode: () => pipelineRef.current?.getAnalyserNode() ?? null,
  };
}

// ---------------------------------------------------------------------------
// Session persistence (fire-and-forget)
// ---------------------------------------------------------------------------

/**
 * Saves a freeform session to Supabase. Imported dynamically to avoid
 * circular dependencies and to keep the hook module lightweight.
 *
 * This is fire-and-forget: errors are logged but never thrown to the UI.
 */
async function saveFreeformSession(
  saHz: number,
  durationS: number,
): Promise<void> {
  try {
    const { saveSession } = await import('./supabase');
    const { useAuth } = await import('./auth');

    // We cannot call hooks here (outside React), so we access Supabase
    // directly for the session insert. The supabase module exports the
    // client; we use it with a simplified insert.
    const { supabase } = await import('./supabase');

    // Get current user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Guest mode — no persistence

    const xpEarned = Math.floor(durationS / 60) * 2;

    await supabase.from('sessions').insert({
      user_id: user.id,
      raga_id: 'freeform',
      sa_hz: saHz,
      duration_s: durationS,
      xp_earned: xpEarned,
      journey: 'freeform',
      started_at: new Date(Date.now() - durationS * 1000).toISOString(),
      ended_at: new Date().toISOString(),
    });
  } catch {
    // Fire-and-forget: log but never crash
    if (typeof console !== 'undefined') {
      console.warn('Failed to save freeform session — continuing silently.');
    }
  }
}
