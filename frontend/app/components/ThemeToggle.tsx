'use client';

/**
 * ThemeToggle — Switches the global color mode between Night (dark) and Day (light).
 *
 * Reads/writes data-theme="night"|"day" on document.documentElement.
 * Persists to localStorage key 'sadhana-theme'.
 * Default: 'night' (Deep Malachite — locked Ragamala decision).
 *
 * Display:
 *   In Night mode: shows a sun glyph (click to switch to Day)
 *   In Day mode:   shows a crescent moon glyph (click to switch to Night)
 *
 * Position: fixed, bottom-right, directly above ScriptToggle.
 *   ScriptToggle sits at bottom: var(--space-6).
 *   ThemeToggle sits at bottom: calc(var(--space-6) + var(--touch-min) + var(--space-2)).
 *
 * Hidden on auth pages (matches AuthPill pattern).
 */

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'sadhana-theme';
const DEFAULT_THEME: ThemeMode = 'night';

type ThemeMode = 'night' | 'day';

// ---------------------------------------------------------------------------
// SVG icons — inline, no library dependency
// ---------------------------------------------------------------------------

/** Sun icon for Night mode (clicking switches to Day). */
function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Center circle */}
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.25" />
      {/* 8 rays */}
      <line x1="8" y1="1" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="8" y1="13.5" x2="8" y2="15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="1" y1="8" x2="2.5" y2="8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="13.5" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="3.05" y1="3.05" x2="4.11" y2="4.11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="11.89" y1="11.89" x2="12.95" y2="12.95" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="12.95" y1="3.05" x2="11.89" y2="4.11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="4.11" y1="11.89" x2="3.05" y2="12.95" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

/** Crescent moon icon for Day mode (clicking switches to Night). */
function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/*
        Crescent: a full circle arc with the inner cutout arc drawn as a single
        path. Achieved with two arcs — outer radius 5.5, inner offset circle
        that produces the crescent shape.
      */}
      <path
        d="M13 10.5A5.5 5.5 0 0 1 5.5 3a5.5 5.5 0 1 0 7.5 7.5z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ThemeToggle() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemeMode>(DEFAULT_THEME);

  // On mount: read from localStorage and apply to documentElement
  useEffect(() => {
    let saved: ThemeMode = DEFAULT_THEME;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'night' || stored === 'day') {
          saved = stored;
        }
      } catch {
        // localStorage unavailable — use default
      }
    }

    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  // Toggle handler
  const toggle = useCallback(() => {
    const next: ThemeMode = theme === 'night' ? 'day' : 'night';
    setTheme(next);
    document.documentElement.dataset.theme = next;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Silently fail
      }
    }
  }, [theme]);

  // Hide on auth pages (same as AuthPill)
  if (pathname.startsWith('/auth')) return null;

  const ariaLabel = theme === 'night' ? 'Switch to Day mode' : 'Switch to Night mode';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        // Sit directly above ScriptToggle:
        // ScriptToggle is at bottom: var(--space-6) = 24px
        // var(--touch-min) = 44px (button height)
        // var(--space-2) = 8px gap
        bottom: 'calc(var(--space-6) + var(--touch-min) + var(--space-2))',
        right: 'var(--space-4)',
        zIndex: 50,
        width: 'var(--touch-min)',
        height: 'var(--touch-min)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border)',
        background: 'var(--bg-2)',
        color: 'var(--text-2)',
        cursor: 'pointer',
        transition: `border-color var(--dur-fast) var(--ease-out),
                     color var(--dur-fast) var(--ease-out),
                     background var(--dur-fast) var(--ease-out)`,
        padding: 0,
        // Inherit touch-action from parent — no pan interference
        touchAction: 'manipulation',
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
      {theme === 'night' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
