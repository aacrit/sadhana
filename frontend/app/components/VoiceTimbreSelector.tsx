/**
 * VoiceTimbreSelector — Toggle between instrument timbres.
 *
 * Three instruments: harmonium (default), piano, guitar.
 * Compact pill UI that sits in the bottom controls area.
 * Selection persists to localStorage.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TantriTimbre } from '@/engine/interaction/tantri';

const STORAGE_KEY = 'sadhana:timbre';

const TIMBRES: { value: TantriTimbre; label: string; icon: string }[] = [
  { value: 'harmonium', label: 'Harmonium', icon: '𝄢' },
  { value: 'piano', label: 'Piano', icon: '𝄞' },
  { value: 'guitar', label: 'Guitar', icon: '𝄫' },
];

interface VoiceTimbreSelectorProps {
  value: TantriTimbre;
  onChange: (timbre: TantriTimbre) => void;
}

export default function VoiceTimbreSelector({
  value,
  onChange,
}: VoiceTimbreSelectorProps) {
  const handleCycle = useCallback(() => {
    const idx = TIMBRES.findIndex((t) => t.value === value);
    const next = TIMBRES[(idx + 1) % TIMBRES.length]!;
    onChange(next.value);
  }, [value, onChange]);

  const current = TIMBRES.find((t) => t.value === value) ?? TIMBRES[0]!;

  return (
    <button
      type="button"
      onClick={handleCycle}
      aria-label={`Timbre: ${current.label}. Tap to change.`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderRadius: '20px',
        color: 'var(--text-2, #B8A99A)',
        fontSize: 'var(--text-sm, 0.875rem)',
        fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ fontSize: '1rem' }}>{current.icon}</span>
      <span>{current.label}</span>
    </button>
  );
}

/**
 * Hook: persists timbre selection to localStorage.
 */
export function useTimbreSelection(): [TantriTimbre, (t: TantriTimbre) => void] {
  const [timbre, setTimbre] = useState<TantriTimbre>('harmonium');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'harmonium' || stored === 'piano' || stored === 'guitar') {
        setTimbre(stored);
      }
    } catch {
      // SSR or storage unavailable
    }
  }, []);

  const update = useCallback((t: TantriTimbre) => {
    setTimbre(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // Storage unavailable
    }
  }, []);

  return [timbre, update];
}
