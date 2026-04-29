'use client';

/**
 * SaCalibrator — Universal Sa reference pitch calibrator.
 *
 * A modal overlay that guides the student through 5 sustained holds of their
 * natural Sa. Can be triggered from any page. Persists result to profile
 * (Supabase) and updates the global VoiceWaveContext.
 *
 * Usage:
 *   <SaCalibrator open={isOpen} onClose={() => setOpen(false)} />
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoicePipeline } from '@/engine/voice/pipeline';
import { useVoiceWave } from '../lib/VoiceWaveContext';
import { useAuth } from '../lib/auth';
import { updateSa } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOLDS_REQUIRED = 5;
const HOLD_FRAMES = 45; // ~0.75s at 60fps — responsive detection
const HOLD_STABILITY_CENTS = 120; // allow natural pitch wobble
// T4.4: clarity floor lowered from 0.50 → 0.35. Breathy voices, child voices,
// and lower-quality microphones routinely produce pitch with clarity 0.35-0.50
// even when the pitch itself is correct. Pitchy's McLeod method only emits
// clarity > 0.5 for textbook-clean tones; anything more nuanced (vibrato,
// breath onset, hoarse timbre) sits in the 0.35-0.50 band. Tightening here
// was preventing legitimate calibration in real-world conditions.
const CLARITY_THRESHOLD = 0.35;
const TIMEOUT_MS = 120_000; // 2 minutes
// T4.4: human Sa range bounds for sanity checking. Adult bass voices reach
// ~73 Hz (D2); child sopranos sing comfortably up to ~525 Hz (C5). Outside
// this range a detected pitch is almost certainly an octave error or noise.
const SA_HZ_MIN = 70;
const SA_HZ_MAX = 530;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hzToNoteName(hz: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const semitones = 12 * Math.log2(hz / 440);
  const midiNote = Math.round(semitones) + 69;
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  return `${noteNames[noteIndex]}${octave}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SaCalibratorProps {
  open: boolean;
  onClose: () => void;
}

type Phase = 'listening' | 'detected' | 'timeout';

export default function SaCalibrator({ open, onClose }: SaCalibratorProps) {
  const { saHz, setSaHz } = useVoiceWave();
  const { user: authUser, refreshProfile } = useAuth();

  const [phase, setPhase] = useState<Phase>('listening');
  const [completedHolds, setCompletedHolds] = useState(0);
  const [currentHz, setCurrentHz] = useState<number | null>(null);
  const [detectedHz, setDetectedHz] = useState<number | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);

  const cleanup = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.stop();
      pipelineRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    cleanup();
    setPhase('listening');
    setCompletedHolds(0);
    setCurrentHz(null);
    setDetectedHz(null);

    const completedHoldsArr: number[] = [];
    let holdFrames = 0;
    let holdSum = 0;
    let holdAnchorHz = 0;

    const pipeline = new VoicePipeline({
      sa_hz: saHz,
      clarityThreshold: CLARITY_THRESHOLD,
      onPitch: (event) => {
        if (event.type !== 'pitch' || !event.hz || !event.clarity) return;
        // Use SA_HZ_MIN/MAX (T4.4) so bass voices (~73 Hz) are accepted.
        if (event.hz < SA_HZ_MIN || event.hz > SA_HZ_MAX) return;

        if (holdFrames === 0) {
          holdAnchorHz = event.hz;
          holdSum = event.hz;
          holdFrames = 1;
        } else {
          const cents = 1200 * Math.log2(event.hz / holdAnchorHz);
          if (Math.abs(cents) <= HOLD_STABILITY_CENTS) {
            holdSum += event.hz;
            holdFrames++;
          } else {
            holdAnchorHz = event.hz;
            holdSum = event.hz;
            holdFrames = 1;
          }
        }

        if (holdFrames >= HOLD_FRAMES) {
          const avgHz = holdSum / holdFrames;
          completedHoldsArr.push(avgHz);
          setCompletedHolds(completedHoldsArr.length);
          setCurrentHz(avgHz);

          holdFrames = 0;
          holdSum = 0;
          holdAnchorHz = 0;

          if (completedHoldsArr.length >= HOLDS_REQUIRED) {
            const sorted = [...completedHoldsArr].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)]!;
            setDetectedHz(median);
            setPhase('detected');
            pipeline.stop();
            pipelineRef.current = null;
          }
        }
      },
      onSilence: () => {
        holdFrames = 0;
        holdSum = 0;
        holdAnchorHz = 0;
      },
    });

    pipelineRef.current = pipeline;
    pipeline.start().catch(() => {
      setPhase('timeout');
    });
  }, [saHz, cleanup]);

  // Start listening when opened
  useEffect(() => {
    if (open) {
      startListening();
      const timer = setTimeout(() => {
        if (pipelineRef.current) {
          setPhase('timeout');
        }
      }, TIMEOUT_MS);
      return () => {
        clearTimeout(timer);
        cleanup();
      };
    }
    return cleanup;
  }, [open, startListening, cleanup]);

  const confirmSa = useCallback(async () => {
    if (!detectedHz) return;
    setSaHz(detectedHz);
    if (authUser) {
      await updateSa(authUser.id, detectedHz);
      refreshProfile?.();
    }
    onClose();
  }, [detectedHz, setSaHz, authUser, refreshProfile, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--scrim)',
          padding: 'var(--space-4)',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) { cleanup(); onClose(); } }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8)',
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'var(--text-xl)',
            fontWeight: 300,
            color: 'var(--text)',
            marginBottom: 'var(--space-2)',
          }}>
            {phase === 'detected' ? 'Your Sa' : 'Find your Sa'}
          </h2>

          {phase === 'listening' && (
            <>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-2)',
                marginBottom: 'var(--space-6)',
                lineHeight: 1.6,
              }}>
                Sing a comfortable note and hold it steady. Do this 5 times.
              </p>

              {/* Hold progress dots */}
              <div style={{
                display: 'flex',
                gap: 'var(--space-3)',
                justifyContent: 'center',
                marginBottom: 'var(--space-4)',
              }}>
                {Array.from({ length: HOLDS_REQUIRED }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: `2px solid ${i < completedHolds ? 'var(--accent)' : 'var(--border)'}`,
                      background: i < completedHolds ? 'var(--accent)' : 'transparent',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>

              {currentHz && (
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--accent)',
                  marginBottom: 'var(--space-2)',
                }}>
                  {Math.round(currentHz)} Hz — {hzToNoteName(currentHz)}
                </p>
              )}

              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-3)',
                marginBottom: 'var(--space-6)',
              }}>
                {completedHolds === 0
                  ? 'Sing and hold a steady note...'
                  : `${completedHolds} of ${HOLDS_REQUIRED} — sing again`}
              </p>

              <button
                type="button"
                onClick={() => { cleanup(); onClose(); }}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-3)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-full)',
                  padding: 'var(--space-2) var(--space-6)',
                  minHeight: 'var(--touch-min)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          )}

          {phase === 'detected' && detectedHz && (
            <>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-3xl)',
                color: 'var(--accent)',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}>
                {Math.round(detectedHz)} Hz
              </p>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-3)',
                marginBottom: 'var(--space-6)',
              }}>
                ~ {hzToNoteName(detectedHz)}
              </p>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-2)',
                marginBottom: 'var(--space-6)',
                lineHeight: 1.6,
              }}>
                Everything will be tuned to this note.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={confirmSa}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 500,
                    color: 'var(--text)',
                    background: 'transparent',
                    border: '1px solid var(--text-3)',
                    borderRadius: 'var(--radius-full)',
                    padding: 'var(--space-3) var(--space-8)',
                    minHeight: 'var(--touch-min)',
                    cursor: 'pointer',
                    letterSpacing: 'var(--tracking-wide)',
                  }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={startListening}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-3)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-full)',
                    padding: 'var(--space-2) var(--space-6)',
                    minHeight: 'var(--touch-min)',
                    cursor: 'pointer',
                  }}
                >
                  Try again
                </button>
              </div>
            </>
          )}

          {phase === 'timeout' && (
            <>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-2)',
                marginBottom: 'var(--space-6)',
                lineHeight: 1.6,
              }}>
                Couldn&rsquo;t detect your pitch clearly. Make sure your microphone is working and try humming a steady note.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={startListening}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 500,
                    color: 'var(--text)',
                    background: 'transparent',
                    border: '1px solid var(--text-3)',
                    borderRadius: 'var(--radius-full)',
                    padding: 'var(--space-3) var(--space-8)',
                    minHeight: 'var(--touch-min)',
                    cursor: 'pointer',
                  }}
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => { cleanup(); onClose(); }}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-3)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-full)',
                    padding: 'var(--space-2) var(--space-6)',
                    minHeight: 'var(--touch-min)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* Current Sa reference */}
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-3)',
            marginTop: 'var(--space-6)',
            opacity: 0.6,
          }}>
            Current Sa: {Math.round(saHz)} Hz ({hzToNoteName(saHz)})
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
