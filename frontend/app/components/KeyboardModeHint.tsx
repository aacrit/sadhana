'use client';

/**
 * KeyboardModeHint — surfaces Tantri keyboard navigation (audit #15).
 *
 * Tantri.tsx already supports arrow-key navigation across visible
 * strings + Enter/Space to pluck (handleKeyDown at L1155). Without an
 * explicit affordance, sighted-keyboard users and screen-reader users
 * cannot find it. This component shows a small "Keyboard mode" link
 * that opens a modal with the keymap.
 *
 * Renders as an unobtrusive button; modal opens on click. localStorage
 * dismissal so it doesn't reappear after the user has seen it.
 */

import { useCallback, useEffect, useState } from 'react';
import { emit } from '../lib/telemetry';

const STORAGE_KEY = 'sadhana_keyboard_hint_seen';

export default function KeyboardModeHint() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    try {
      setSeen(window.localStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      // ignore
    }
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    void emit('keyboard-hint-opened');
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSeen(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open keyboard practice mode help"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-xs)',
          color: seen ? 'var(--text-3)' : 'var(--text-2)',
          background: 'transparent',
          border: 'none',
          padding: 'var(--space-2) var(--space-3)',
          cursor: 'pointer',
          letterSpacing: 'var(--tracking-wide)',
          textTransform: 'uppercase',
          opacity: seen ? 0.5 : 1,
          transition: 'opacity 200ms, color 200ms',
        }}
      >
        ⌨ Keyboard mode
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard practice mode"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(10, 26, 20, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              padding: 'var(--space-8) var(--space-6)',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text)',
            }}
          >
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 300,
              fontSize: 'var(--text-2xl)',
              letterSpacing: 'var(--tracking-royal)',
              marginBottom: 'var(--space-4)',
              textAlign: 'center',
            }}>
              Keyboard practice
            </h2>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 'var(--text-md)',
              color: 'var(--text-2)',
              lineHeight: 'var(--leading-relaxed)',
              textAlign: 'center',
              marginBottom: 'var(--space-6)',
            }}>
              Tantri responds to keyboard input. Press Tab to focus the
              instrument, then:
            </p>

            <dl style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 'var(--space-3) var(--space-5)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-6)',
            }}>
              <dt style={{ color: 'var(--accent)', fontWeight: 600 }}>↑</dt>
              <dd style={{ color: 'var(--text-2)', margin: 0 }}>Move focus to a higher swara</dd>
              <dt style={{ color: 'var(--accent)', fontWeight: 600 }}>↓</dt>
              <dd style={{ color: 'var(--text-2)', margin: 0 }}>Move focus to a lower swara</dd>
              <dt style={{ color: 'var(--accent)', fontWeight: 600 }}>Enter</dt>
              <dd style={{ color: 'var(--text-2)', margin: 0 }}>Pluck the focused string</dd>
              <dt style={{ color: 'var(--accent)', fontWeight: 600 }}>Space</dt>
              <dd style={{ color: 'var(--text-2)', margin: 0 }}>Pluck the focused string</dd>
              <dt style={{ color: 'var(--accent)', fontWeight: 600 }}>Tab</dt>
              <dd style={{ color: 'var(--text-2)', margin: 0 }}>Focus / unfocus the instrument</dd>
            </dl>

            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-3)',
              textAlign: 'center',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-4)',
            }}>
              Each visible string is a swara of the active raga. As you
              progress, more strings become reachable.
            </p>

            <button
              type="button"
              onClick={handleClose}
              style={{
                display: 'block',
                margin: '0 auto',
                padding: 'var(--space-3) var(--space-8)',
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-md)',
                color: 'var(--accent)',
                background: 'transparent',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
