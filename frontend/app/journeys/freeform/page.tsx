/**
 * Freeform Riyaz — the most cinematic surface in the app.
 *
 * No goals. No exercises. Just you and the raga. The tanpura plays,
 * you sing, swaras appear as you sing them, harmonies trigger visual
 * reactions. Three visual layers: ambient tanpura waveform, floating
 * swara field, and harmony pulse.
 *
 * States:
 *   1. Start: logo + title + "Begin" button
 *   2. Active: full cinematic mode with live pitch tracking
 *   3. Permission denied: gentle message + retry
 */

'use client';

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '../../components/Logo';

import Tantri from '../../components/Tantri';
import type { TantriPlayEvent } from '@/engine/interaction/tantri';
import { playSwaraNote, ensureAudioReady, stopHarmoniumPlayback } from '@/engine/synthesis/swara-voice';
import { TalaPlayer } from '@/engine/synthesis/tala-engine';
import VoiceTimbreSelector, { useTimbreSelection } from '../../components/VoiceTimbreSelector';
import { useFreeformSession } from '../../lib/useFreeformSession';
import type { SwaraEvent } from '../../lib/useFreeformSession';
import { useAuth } from '../../lib/auth';
import { useVoiceWave } from '../../lib/VoiceWaveContext';
import { getRagaForTimeOfDay, RAGA_LIST, getRagaById } from '@/engine/theory/ragas';
import type { Raga } from '@/engine/theory/types';
import styles from './freeform.module.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_GHOSTS = 8;

/** Minimum note duration in ms — prevents inaudible clicks on quick taps. */
const MIN_NOTE_MS = 400;

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const swaraAppear = {
  hidden: { opacity: 0, scale: 0.7, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const ghostDrift = {
  initial: { opacity: 0.8, y: 0, scale: 0.6 },
  animate: {
    opacity: 0,
    y: -180,
    scale: 0.4,
    transition: { duration: 6, ease: 'linear' as const },
  },
};

// ---------------------------------------------------------------------------
// Format duration as MM:SS
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Cents needle color
// ---------------------------------------------------------------------------

function getCentsColor(cents: number | null): string {
  if (cents === null) return 'var(--border)';
  const abs = Math.abs(cents);
  if (abs <= 20) return 'var(--correct)';
  if (abs <= 35) return 'var(--in-progress)';
  return 'var(--needs-work)';
}

// ---------------------------------------------------------------------------
// Harmony glow style
// ---------------------------------------------------------------------------

function getGlowStyle(
  harmonyStrength: number,
  inTune: boolean,
): CSSProperties | null {
  if (harmonyStrength <= 0.6 || !inTune) return null;

  const isStrong = harmonyStrength > 0.80;
  const alpha = harmonyStrength * 0.35;

  return {
    background: isStrong
      ? `radial-gradient(circle, rgba(var(--mastery-rgb, 212, 175, 55), ${alpha}) 0%, transparent 60%)`
      : `radial-gradient(circle, rgba(var(--accent-rgb, 232, 135, 30), ${alpha}) 0%, transparent 60%)`,
  };
}

// ---------------------------------------------------------------------------
// Component: GhostSwara — a fading, drifting previous swara
// ---------------------------------------------------------------------------

interface GhostSwaraProps {
  event: SwaraEvent;
  index: number;
}

function GhostSwara({ event, index }: GhostSwaraProps) {
  return (
    <motion.div
      className={styles.ghost}
      initial={ghostDrift.initial}
      animate={ghostDrift.animate}
      style={{
        color: event.inTune ? 'var(--text)' : 'rgba(255,255,255,0.30)',
        // Stagger horizontal position slightly so ghosts do not overlap
        left: `calc(50% + ${(index % 3 - 1) * 40}px)`,
      }}
    >
      <span className={styles.ghostDevanagari}>{event.devanagari}</span>
      <span className={styles.ghostRomanized}>{event.swara}</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Component: CentsNeedle — precision pitch indicator
// ---------------------------------------------------------------------------

interface CentsNeedleProps {
  centsDev: number | null;
}

function CentsNeedle({ centsDev }: CentsNeedleProps) {
  // Map -50..+50 to 0..100% of the needle track
  const position = centsDev !== null
    ? Math.max(0, Math.min(100, ((centsDev + 50) / 100) * 100))
    : 50;

  const color = getCentsColor(centsDev);
  const displayValue = centsDev !== null
    ? `${centsDev > 0 ? '+' : ''}${Math.round(centsDev)}`
    : '--';

  return (
    <div className={styles.centsNeedle}>
      <span className={styles.centsLabel} style={{ color }}>
        {displayValue}
      </span>
      <div className={styles.centsTrack}>
        {/* Center mark */}
        <div className={styles.centsMark} />
        {/* Needle indicator */}
        <div
          className={styles.centsIndicator}
          style={{
            left: `${position}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

/**
 * Map a clock hour (0–23) to a prahara (1–8).
 * Each prahara is a 3-hour block starting at 6am.
 *   1: 06–09 | 2: 09–12 | 3: 12–15 | 4: 15–18
 *   5: 18–21 | 6: 21–00 | 7: 00–03 | 8: 03–06
 */
function hourToPrahara(hour: number): number {
  const h = ((hour - 6) + 24) % 24; // offset to 6am = 0
  return Math.floor(h / 3) + 1;
}

/**
 * Returns the prahara label for a prahara number.
 * Used for the "belongs to [prahar]" hint.
 */
function praharaLabel(praharas: readonly number[]): string {
  const names: Record<number, string> = {
    1: 'dawn (6–9am)',
    2: 'morning (9am–noon)',
    3: 'afternoon (noon–3pm)',
    4: 'late afternoon (3–6pm)',
    5: 'early evening (6–9pm)',
    6: 'late evening (9pm–midnight)',
    7: 'deep night (midnight–3am)',
    8: 'pre-dawn (3–6am)',
  };
  return praharas.map((p) => names[p] ?? `prahara ${p}`).join(' or ');
}

export default function FreeformPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const userSaHz = profile?.saHz ?? 261.63;

  // Time-of-day raga for ambient color world
  const todayRaga = useMemo(() => {
    const hour = new Date().getHours();
    return getRagaForTimeOfDay(hour);
  }, []);

  // Current prahara for off-prahar gating
  const currentPrahara = useMemo(() => hourToPrahara(new Date().getHours()), []);

  const session = useFreeformSession(userSaHz);
  const { setAnalyser, setSaHz } = useVoiceWave();
  const [hasStarted, setHasStarted] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [timbre, setTimbre] = useTimbreSelection();
  // Cinematic defocus: true when Tantri strings are vibrating
  const [tantriActive, setTantriActive] = useState(false);

  // Tala (tabla) state
  const [talaActive, setTalaActive] = useState(false);
  const talaPlayerRef = useRef<TalaPlayer | null>(null);

  // Raga selection — defaults to time-of-day, user can override
  const [selectedRagaId, setSelectedRagaId] = useState<string | null>(todayRaga.id);
  const selectedRaga: Raga | null = useMemo(
    () => (selectedRagaId ? getRagaById(selectedRagaId) ?? null : null),
    [selectedRagaId],
  );

  // Guided mode: show aroha suggestion
  const [showGuide, setShowGuide] = useState(false);

  // Track the last few SwaraEvents for ghost display
  const [ghosts, setGhosts] = useState<(SwaraEvent & { key: number })[]>([]);
  const ghostKeyRef = useRef(0);
  const prevHistoryLenRef = useRef(0);

  // Register analyser with VoiceWaveContext when pipeline is active
  useEffect(() => {
    if (session.isListening) {
      const node = session.getAnalyserNode();
      setAnalyser(node);
      setSaHz(userSaHz);
    } else {
      setAnalyser(null);
    }
    return () => setAnalyser(null);
  }, [session.isListening, setAnalyser, setSaHz, userSaHz, session]);

  // Detect new swara events and add to ghost list
  useEffect(() => {
    if (session.swaraHistory.length > prevHistoryLenRef.current) {
      const newEvents = session.swaraHistory.slice(prevHistoryLenRef.current);
      setGhosts((prev) => {
        const next = [
          ...prev,
          ...newEvents.map((e) => ({
            ...e,
            key: ++ghostKeyRef.current,
          })),
        ];
        // Keep only last MAX_GHOSTS
        if (next.length > MAX_GHOSTS) {
          return next.slice(next.length - MAX_GHOSTS);
        }
        return next;
      });
    }
    prevHistoryLenRef.current = session.swaraHistory.length;
  }, [session.swaraHistory]);

  // Remove ghosts after their animation completes (6s)
  useEffect(() => {
    if (ghosts.length === 0) return;

    const timer = setTimeout(() => {
      setGhosts((prev) => prev.slice(1));
    }, 6200);

    return () => clearTimeout(timer);
  }, [ghosts.length]);

  // Harmony glow: track key changes for pulse retriggering
  const [glowKey, setGlowKey] = useState(0);
  const prevSwaraCountRef = useRef(0);

  useEffect(() => {
    if (session.totalSwaraCount > prevSwaraCountRef.current) {
      setGlowKey((k) => k + 1);
    }
    prevSwaraCountRef.current = session.totalSwaraCount;
  }, [session.totalSwaraCount]);

  const glowStyle = useMemo(
    () => getGlowStyle(session.harmonyStrength, session.inTune),
    [session.harmonyStrength, session.inTune],
  );

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleBegin = useCallback(async () => {
    setStartError(null);
    try {
      await session.startListening();
      setHasStarted(true);
    } catch (err) {
      // Log the actual error for debugging
      console.error('[Freeform] startListening failed:', err);

      if (session.micPermission === 'denied') {
        // Show permission denied UI
        setHasStarted(true);
      } else {
        // Still enter the session — tanpura can play without mic
        setHasStarted(true);
        // Surface specific error information
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('getUserMedia') || msg.includes('mediaDevices')) {
          setStartError('Microphone not available. Tanpura will play without voice detection.');
        } else if (msg.includes('Pitchy') || msg.includes('pitch detection')) {
          setStartError('Pitch detection failed to load. Please reload the page.');
        } else if (msg.includes('AudioContext')) {
          setStartError('Audio engine not available. Please tap the page first, then try again.');
        } else {
          setStartError(`Audio issue: ${msg}`);
        }
      }
    }
  }, [session]);

  const handleRetry = useCallback(async () => {
    setStartError(null);
    try {
      await session.startListening();
    } catch {
      // micPermission state will reflect the result
    }
  }, [session]);

  const handleEnd = useCallback(() => {
    session.stopListening();
    if (talaPlayerRef.current) {
      talaPlayerRef.current.stopTheka();
      talaPlayerRef.current.dispose();
      talaPlayerRef.current = null;
    }
    session.dispose();
    router.push('/');
  }, [session, router]);

  const toggleTala = useCallback(async () => {
    if (talaActive) {
      if (talaPlayerRef.current) {
        talaPlayerRef.current.stopTheka();
        talaPlayerRef.current.dispose();
        talaPlayerRef.current = null;
      }
      setTalaActive(false);
    } else {
      await ensureAudioReady();
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      talaPlayerRef.current = new TalaPlayer(ctx, userSaHz);
      talaPlayerRef.current.startTheka('teentaal', 80);
      setTalaActive(true);
    }
  }, [talaActive, userSaHz]);

  // Track when the current note started (for minimum duration on release)
  const noteStartRef = useRef<number>(0);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tantri string trigger — touch a string to hear the swara.
  // Uses long duration for sustained (long-press) playback.
  // Dispatches to harmonium/piano/guitar based on timbre selection.
  const handleStringTrigger = useCallback(async (event: TantriPlayEvent) => {
    // Clear any pending delayed release from a previous tap
    if (releaseTimerRef.current) {
      clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }

    noteStartRef.current = Date.now();

    try {
      const note = { swara: event.swara, octave: event.octave };
      const vol = event.velocity * 0.6;
      const instrumentTimbre = (event.timbre ?? 'harmonium') as import('@/engine/synthesis/swara-voice').InstrumentTimbre;

      await ensureAudioReady();
      playSwaraNote(note, userSaHz, { duration: 30, volume: vol, timbre: instrumentTimbre });
    } catch {
      // Audio not ready — silently fail
    }
  }, [userSaHz]);

  // Tantri string release — stop the sustained note.
  // Enforces minimum note duration so quick taps are still audible.
  const handleStringRelease = useCallback(() => {
    const elapsed = Date.now() - noteStartRef.current;
    const doStop = () => {
      stopHarmoniumPlayback();
    };

    if (elapsed >= MIN_NOTE_MS) {
      doStop();
    } else {
      // Let the note play for at least MIN_NOTE_MS
      releaseTimerRef.current = setTimeout(doStop, MIN_NOTE_MS - elapsed);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Render: start state
  // -----------------------------------------------------------------------

  if (!hasStarted) {
    return (
      <div className={styles.page} data-raga={todayRaga.id}>

        <Link href="/" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>

        <motion.div
          className={styles.startContent}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <Logo size={48} variant="icon" />
          <h1 className={`${styles.startTitle} raga-name`}>
            <span className="devanagari-only">{'\u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930 \u0930\u093F\u092F\u093E\u091C\u093C'}</span>
            <span className="romanized-only">Swatantra Riyaz</span>
          </h1>
          <span className={styles.startEnglish}>Freeform</span>
          <p className={styles.startSubtitle}>
            No goals. No exercises. Just you and the raga.
          </p>

          {/* Raga selector */}
          <div className={styles.ragaSelector}>
            <label className={styles.ragaSelectorLabel}>
              Raga
            </label>
            <div className={styles.ragaChips}>
              <button
                type="button"
                className={`${styles.ragaChip} ${selectedRagaId === null ? styles.ragaChipActive : ''}`}
                onClick={() => setSelectedRagaId(null)}
              >
                Open
              </button>
              {RAGA_LIST.map((r) => {
                // Prahara gating: ragas outside their traditional time window
                // render at 40% opacity with a soft hint. Not blocked — honored.
                const isOffPrahar = r.prahara.length > 0 && !r.prahara.includes(currentPrahara as (typeof r.prahara)[number]);
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`${styles.ragaChip} ${selectedRagaId === r.id ? styles.ragaChipActive : ''} ${isOffPrahar ? styles.ragaChipOffPrahar : ''}`}
                    onClick={() => setSelectedRagaId(r.id)}
                    title={isOffPrahar ? `This raga belongs to ${praharaLabel(r.prahara)} — return then.` : undefined}
                  >
                    <span className="raga-name">{r.name}</span>
                  </button>
                );
              })}
            </div>
            {selectedRaga && (
              <>
                <p className={styles.ragaHint}>
                  {selectedRaga.description?.split('.')[0]}.
                </p>
                {/* Off-prahar notice: gentle, not blocking */}
                {selectedRaga.prahara.length > 0 &&
                  !selectedRaga.prahara.includes(currentPrahara as (typeof selectedRaga.prahara)[number]) && (
                  <p className={styles.ragaOffPraharHint}>
                    This raga belongs to {praharaLabel(selectedRaga.prahara)} — return then.
                  </p>
                )}
              </>
            )}
          </div>

          <p className={styles.headphoneHint}>
            Headphones recommended to prevent tanpura feedback into the mic.
          </p>

          <button
            className={styles.beginButton}
            onClick={handleBegin}
            type="button"
          >
            Begin
          </button>

          {startError && (
            <p className={styles.errorMessage}>{startError}</p>
          )}
        </motion.div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: permission denied state
  // -----------------------------------------------------------------------

  if (session.micPermission === 'denied') {
    return (
      <div className={styles.page} data-raga={todayRaga.id}>

        <motion.div
          className={styles.startContent}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <h2 className={styles.permTitle}>Microphone Access</h2>
          <p className={styles.permMessage}>
            Sadhana needs microphone access to hear your voice.
          </p>
          <p className={styles.permHint}>
            Please allow microphone access in your browser settings,
            then try again.
          </p>

          <button
            className={styles.beginButton}
            onClick={handleRetry}
            type="button"
          >
            Try again
          </button>

          <Link href="/" className={styles.permBack}>
            Return home
          </Link>
        </motion.div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: active session
  // -----------------------------------------------------------------------

  const latestEvent = session.swaraHistory.length > 0
    ? session.swaraHistory[session.swaraHistory.length - 1]
    : null;

  return (
    <div className={styles.page} data-raga={selectedRagaId ?? todayRaga.id}>
      {/* Tantri portal — centered guitar-like band with strings + pitch trail */}
      <Tantri
        saHz={userSaHz}
        ragaId={selectedRagaId}
        level="varistha"
        subLevel={1}
        variant="portal"
        analyser={session.getAnalyserNode()}
        pitchHz={session.currentHz}
        pitchClarity={session.currentClarity}
        onStringTrigger={handleStringTrigger}
        onStringRelease={handleStringRelease}
        timbre={timbre}
        onActivityChange={setTantriActive}
        className={styles.tantriPortal}
        style={{
          opacity: tantriActive ? 1 : 0.75,
          transition: 'opacity 0.6s ease-out',
        }}
      />

      {/* Audio error toast — shown when mic fails but session continues */}
      {startError && (
        <motion.div
          className={styles.errorToast}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {startError}
        </motion.div>
      )}

      {/* Layer 3 — Harmony pulse (z-index above swara field) */}
      <AnimatePresence mode="wait">
        {glowStyle && (
          <motion.div
            key={glowKey}
            className={styles.harmonyPulse}
            style={glowStyle}
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* HUD — top overlay (defocuses when Tantri is active) */}
      <div
        className={styles.hud}
        style={{
          opacity: tantriActive ? 0.3 : 1,
          filter: tantriActive ? 'blur(1px)' : 'none',
          transition: 'opacity 0.6s ease-out, filter 0.6s ease-out',
        }}
      >
        <div className={styles.hudLeft}>
          <span className={styles.hudMono}>
            {formatDuration(session.sessionDurationS)}
          </span>
        </div>
        <div className={styles.hudRight}>
          <span className={styles.hudMono}>
            {session.totalSwaraCount} swara{session.totalSwaraCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Layer 2 — Swara field (subtle — Tantri is the visual center) */}
      <div
        className={styles.swaraField}
        style={{
          opacity: tantriActive ? 0.25 : 0.7,
          filter: tantriActive ? 'blur(2px)' : 'none',
          transition: 'opacity 0.8s ease-out, filter 0.8s ease-out',
        }}
      >
        {/* Ghost swaras — drifting upward */}
        <AnimatePresence>
          {ghosts.map((ghost, i) => (
            <GhostSwara key={ghost.key} event={ghost} index={i} />
          ))}
        </AnimatePresence>

        {/* Current swara — large, centered */}
        <AnimatePresence mode="wait">
          {session.currentSwara && (
            <motion.div
              key={session.currentSwara + '-' + session.totalSwaraCount}
              className={styles.currentSwara}
              variants={swaraAppear}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              style={{
                color: session.inTune ? 'var(--text)' : 'rgba(255,255,255,0.30)',
              }}
            >
              <span className={styles.currentDevanagari}>
                {session.currentDevanagari}
              </span>
              <span className={styles.currentSwaraName}>
                {session.currentSwara}
              </span>
              <span className={styles.currentSwaraFull}>
                {session.currentSwaraFull}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cents needle (recedes when Tantri is active) */}
      <div
        className={styles.centsContainer}
        style={{
          opacity: tantriActive ? 0.35 : 1,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        <CentsNeedle centsDev={session.centsDev} />
      </div>

      {/* Guided mode: aroha/avaroha suggestion bar */}
      {selectedRaga && (
        <div
          className={styles.guideBar}
          style={{
            opacity: tantriActive ? 0.3 : 0.7,
            transition: 'opacity 0.6s ease-out',
          }}
        >
          <span className={styles.guideLabel}>
            <span className="raga-name">{selectedRaga.name}</span>
          </span>
          <span className={styles.guideSwaras}>
            {selectedRaga.aroha.map((n) => n.swara).join(' ')}
          </span>
        </div>
      )}

      {/* Bottom controls (recede when Tantri is active) */}
      <div
        className={styles.bottomControls}
        style={{
          opacity: tantriActive ? 0.4 : 1,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        <VoiceTimbreSelector value={timbre} onChange={setTimbre} />

        <button
          className={`${styles.tanpuraToggle} ${session.tanpuraActive ? styles.tanpuraToggleActive : ''}`}
          onClick={session.toggleTanpura}
          type="button"
          aria-label={session.tanpuraActive ? 'Mute tanpura' : 'Play tanpura'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {/* Simple waveform icon */}
            <path
              d="M2 12h2l3-6 4 12 4-8 3 4h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.tanpuraLabel}>Tanpura</span>
        </button>

        <button
          className={`${styles.tanpuraToggle} ${talaActive ? styles.tanpuraToggleActive : ''}`}
          onClick={toggleTala}
          type="button"
          aria-label={talaActive ? 'Stop tabla' : 'Play tabla'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {/* Tabla icon — two circles (bayan + dayan) */}
            <circle cx="9" cy="13" r="5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="15" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 10v6M15 8.5v5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          </svg>
          <span className={styles.tanpuraLabel}>Tabla</span>
        </button>

        <button
          className={styles.endButton}
          onClick={handleEnd}
          type="button"
        >
          End riyaz
        </button>
      </div>
    </div>
  );
}
