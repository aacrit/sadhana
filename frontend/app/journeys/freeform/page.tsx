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
import VoiceWave from '../../components/VoiceWave';
import Tantri from '../../components/Tantri';
import type { TantriPlayEvent } from '@/engine/interaction/tantri';
import { playSwaraNote, ensureAudioReady } from '@/engine/synthesis/swara-voice';
import { playVocalSwaraNote, ensureVocalAudioReady } from '@/engine/synthesis/voice';
import VoiceTimbreSelector, { useTimbreSelection } from '../../components/VoiceTimbreSelector';
import { useFreeformSession } from '../../lib/useFreeformSession';
import type { SwaraEvent } from '../../lib/useFreeformSession';
import { useAuth } from '../../lib/auth';
import { useVoiceWave } from '../../lib/VoiceWaveContext';
import styles from './freeform.module.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_GHOSTS = 8;

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
  if (cents === null) return 'rgba(255,255,255,0.20)';
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
  const color = isStrong ? '212, 175, 55' : '232, 135, 30';
  const alpha = harmonyStrength * 0.35;

  return {
    background: `radial-gradient(circle, rgba(${color}, ${alpha}) 0%, transparent 60%)`,
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

export default function FreeformPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const userSaHz = profile?.saHz ?? 261.63;

  const session = useFreeformSession(userSaHz);
  const { setAnalyser, setSaHz } = useVoiceWave();
  const [hasStarted, setHasStarted] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [timbre, setTimbre] = useTimbreSelection();
  // Cinematic defocus: true when Tantri strings are vibrating
  const [tantriActive, setTantriActive] = useState(false);

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
    session.dispose();
    router.push('/');
  }, [session, router]);

  // Tantri string trigger — touch a string to hear the swara
  // Dispatches to harmonium or TantriVoice(TM) based on timbre selection
  const handleStringTrigger = useCallback(async (event: TantriPlayEvent) => {
    try {
      const note = { swara: event.swara, octave: event.octave };
      const vol = event.velocity * 0.6;

      if (event.timbre === 'voice-male' || event.timbre === 'voice-female') {
        await ensureVocalAudioReady();
        await playVocalSwaraNote(note, userSaHz, {
          duration: 0.8,
          volume: vol,
          voiceType: event.timbre === 'voice-male' ? 'baritone' : 'soprano',
        });
      } else {
        await ensureAudioReady();
        await playSwaraNote(note, userSaHz, { duration: 0.8, volume: vol });
      }
    } catch {
      // Audio not ready — silently fail
    }
  }, [userSaHz]);

  // -----------------------------------------------------------------------
  // Render: start state
  // -----------------------------------------------------------------------

  if (!hasStarted) {
    return (
      <div className={styles.page}>
        <VoiceWave variant="full" style={{ opacity: 0.15 }} />

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
      <div className={styles.page}>
        <VoiceWave variant="full" style={{ opacity: 0.15 }} />

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
    <div className={styles.page}>
      {/* Layer 0 — Tantri: interactive swara string instrument */}
      <Tantri
        saHz={userSaHz}
        ragaId={null}
        level="varistha"
        subLevel={1}
        variant="full"
        analyser={session.getAnalyserNode()}
        pitchHz={session.currentHz}
        pitchClarity={session.currentClarity}
        onStringTrigger={handleStringTrigger}
        timbre={timbre}
        onActivityChange={setTantriActive}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: tantriActive ? 1 : 0.7,
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
