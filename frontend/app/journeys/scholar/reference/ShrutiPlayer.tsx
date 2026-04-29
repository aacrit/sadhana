'use client';

/**
 * ShrutiPlayer — small inline client component that plays a single swara
 * using the engine's harmonium synth via Tone.js. Used by the Scholar
 * reference table to give every shruti a "Listen" button.
 */

import { useCallback, useState } from 'react';
import { playSwaraNote } from '@/engine/synthesis/swara-voice';
import type { Swara, Octave } from '@/engine/theory/types';
import scholarStyles from '../../../styles/scholar.module.css';

/** Inline swara-name parser (mirrors frontend/app/lib/lesson-audio.ts).
 *  Splits 'Sa_upper' / 'Ni_k_mandra' into swara + octave. */
function parseSwaraName(name: string): { swara: Swara; octave: Octave } {
  const parts = name.split('_');
  let octave: Octave = 'madhya';
  if (parts[parts.length - 1] === 'upper' || parts[parts.length - 1] === 'taar') {
    octave = 'taar';
    parts.pop();
  } else if (parts[parts.length - 1] === 'mandra') {
    octave = 'mandra';
    parts.pop();
  }
  return { swara: parts.join('_') as Swara, octave };
}

interface ShrutiPlayerProps {
  readonly swara: string;
  readonly label: string;
}

const DEFAULT_SA_HZ = 261.63;

export default function ShrutiPlayer({ swara, label }: ShrutiPlayerProps) {
  const [playing, setPlaying] = useState(false);

  const play = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const { swara: sym, octave } = parseSwaraName(swara);
      await playSwaraNote(
        { swara: sym, octave },
        DEFAULT_SA_HZ,
        { duration: 1.4, volume: 0.5, timbre: 'harmonium' },
      );
    } catch {
      // ignore — Tone.js may need a user gesture; the click itself counts
    } finally {
      setPlaying(false);
    }
  }, [swara, playing]);

  return (
    <button
      type="button"
      className={scholarStyles.refPlayButton}
      onClick={play}
      disabled={playing}
      aria-label={`Listen to ${label}`}
    >
      {playing ? '…' : '▶'}
    </button>
  );
}
