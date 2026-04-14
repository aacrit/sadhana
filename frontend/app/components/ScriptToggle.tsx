'use client';

/**
 * ScriptToggle — Switches the global script mode between Devanagari and romanized.
 *
 * Reads/writes data-script="devanagari"|"romanized" on document.documentElement.
 * Persists to localStorage key 'sadhana_script'.
 * If the user is authenticated, attempts to persist to their Supabase profile
 * (column: script_preference) — silently ignores if the column does not exist.
 *
 * Display:
 *   Shows "अ" when in romanized mode (click to switch to Devanagari)
 *   Shows "A" when in Devanagari mode (click to switch to romanized)
 *
 * Default: 'devanagari' (from locked design decision — Hindustani-first)
 *
 * Position: fixed, bottom-right corner, above the fold. Small, unobtrusive.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'sadhana_script';
const DEFAULT_SCRIPT: ScriptMode = 'devanagari';

type ScriptMode = 'devanagari' | 'romanized';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ScriptToggle() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [script, setScript] = useState<ScriptMode>(DEFAULT_SCRIPT);

  // On mount: read from localStorage and apply to documentElement
  useEffect(() => {
    let saved: ScriptMode = DEFAULT_SCRIPT;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'devanagari' || stored === 'romanized') {
          saved = stored;
        }
      } catch {
        // localStorage unavailable — use default
      }
    }

    setScript(saved);
    document.documentElement.dataset.script = saved;
  }, []);

  // Toggle handler
  const toggle = useCallback(() => {
    const next: ScriptMode = script === 'devanagari' ? 'romanized' : 'devanagari';
    setScript(next);
    document.documentElement.dataset.script = next;

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Silently fail
      }
    }

    // Persist to Supabase profile if authenticated
    if (user) {
      (async () => {
        try {
          await supabase
            .from('profiles')
            .update({ script_preference: next })
            .eq('id', user.id);
        } catch {
          // Column may not exist — silently ignore
        }
      })();
    }
  }, [script, user]);

  // Hide on auth pages — placed after all hooks to obey Rules of Hooks
  if (pathname.startsWith('/auth')) return null;

  // The button shows the *opposite* script's glyph — what you'll switch TO.
  // In romanized mode: show "अ" (click to go Devanagari)
  // In Devanagari mode: show "A" (click to go romanized)
  const label = script === 'romanized' ? 'अ' : 'A';
  const ariaLabel = script === 'romanized'
    ? 'Switch to Devanagari script'
    : 'Switch to romanized script';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-4)',
        zIndex: 50,
        minWidth: 'var(--touch-min)',
        minHeight: 'var(--touch-min)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border)',
        background: 'var(--bg-2)',
        color: 'var(--text-2)',
        fontFamily: script === 'romanized'
          ? 'var(--font-devanagari)'
          : 'var(--font-sans)',
        fontSize: script === 'romanized' ? 'var(--text-lg)' : 'var(--text-base)',
        fontWeight: 500,
        cursor: 'pointer',
        transition: `border-color var(--dur-fast) var(--ease-out),
                     color var(--dur-fast) var(--ease-out),
                     background var(--dur-fast) var(--ease-out)`,
        lineHeight: 1,
        padding: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--text-3)';
        el.style.color = 'var(--text)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--border)';
        el.style.color = 'var(--text-2)';
      }}
    >
      {label}
    </button>
  );
}
