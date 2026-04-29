'use client';

/**
 * RagaReferencePlayer — Listen button for a phrase from a raga reference
 * page. Calls the engine's playSwaraNote sequentially with harmonium
 * timbre. Standalone (no AudioContext sharing) — every press creates a
 * fresh, short-lived audio session.
 */

import { useCallback, useState } from 'react';
import { playSwaraNote } from '@/engine/synthesis/swara-voice';
import type { SwaraNote } from '@/engine/theory/types';
import scholarStyles from '../../../../../styles/scholar.module.css';

const DEFAULT_SA_HZ = 261.63;

interface RagaReferencePlayerProps {
  readonly phrase: readonly SwaraNote[];
  readonly label: string;
}

export default function RagaReferencePlayer({ phrase, label }: RagaReferencePlayerProps) {
  const [playing, setPlaying] = useState(false);

  const play = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      for (const note of phrase) {
        await playSwaraNote(note, DEFAULT_SA_HZ, {
          duration: 0.6,
          volume: 0.5,
          timbre: 'harmonium',
        });
      }
    } catch {
      // ignore — Tone.js may need a user gesture; the click counts
    } finally {
      setPlaying(false);
    }
  }, [phrase, playing]);

  return (
    <button
      type="button"
      className={scholarStyles.refPlayButton}
      onClick={play}
      disabled={playing}
      aria-label={label}
    >
      {playing ? '…' : '▶'}
    </button>
  );
}
