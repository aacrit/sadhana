'use client';

/**
 * InstallPrompt — captures the beforeinstallprompt event so the app can
 * offer a deliberate "Install Sādhanā" affordance after the student
 * completes their first riyaz (audit #6). Without this, the locked
 * daily-loop architecture is fictional — a tab that closes is not a
 * habit. iOS Safari does not fire beforeinstallprompt; for that
 * platform we render a coaching overlay with the "Add to Home Screen"
 * gesture instead.
 *
 * Visibility:
 *   - Hidden by default.
 *   - Shows on `triggerVisible()` — the parent decides when (e.g.,
 *     after first lesson_complete).
 *   - Hides forever after install / dismiss / coach-confirmed.
 *
 * Persistence: localStorage key sadhana_install_state ∈
 *   { 'shown', 'installed', 'dismissed', 'coached' }.
 */

import { useCallback, useEffect, useState } from 'react';
import { emit } from '../lib/telemetry';

const STORAGE_KEY = 'sadhana_install_state';

type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iPadOS pretends to be Mac; check for touch.
  const ua = navigator.userAgent;
  const isIpad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPhone|iPod|iPad/.test(ua) || isIpad;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari exposes navigator.standalone
  const navAny = window.navigator as Navigator & { standalone?: boolean };
  return navAny.standalone === true;
}

function getState(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setState(value: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

interface InstallPromptProps {
  /** When true, the parent has decided this is the right moment to show. */
  readonly visible: boolean;
}

export default function InstallPrompt({ visible }: InstallPromptProps) {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [iosCoach, setIosCoach] = useState(false);
  const [isShown, setIsShown] = useState(false);

  // Capture beforeinstallprompt the moment the browser fires it.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    const installedHandler = () => {
      setState('installed');
      setIsShown(false);
      void emit('pwa-installed');
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  // Decide whether to render the prompt this session.
  useEffect(() => {
    if (!visible) return;
    if (typeof window === 'undefined') return;
    if (isStandalone()) return; // already installed
    const state = getState();
    if (state === 'installed' || state === 'dismissed' || state === 'coached') return;

    // We have a deferred prompt OR we're on iOS — show.
    if (deferred || detectIos()) {
      setIsShown(true);
      setState('shown');
      void emit('pwa-install-prompt-shown', {
        platform: detectIos() ? 'ios' : 'standard',
      });
    }
  }, [visible, deferred]);

  const handleInstall = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const result = await deferred.userChoice;
      if (result.outcome === 'accepted') {
        setState('installed');
        void emit('pwa-install-accepted');
      } else {
        setState('dismissed');
        void emit('pwa-install-dismissed');
      }
    } catch {
      setState('dismissed');
    }
    setIsShown(false);
    setDeferred(null);
  }, [deferred]);

  const handleIosCoach = useCallback(() => {
    setIosCoach(true);
    void emit('pwa-install-ios-coach-shown');
  }, []);

  const handleIosDone = useCallback(() => {
    setState('coached');
    setIosCoach(false);
    setIsShown(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setState('dismissed');
    setIsShown(false);
    void emit('pwa-install-dismissed');
  }, []);

  if (!isShown) return null;

  if (iosCoach) {
    return (
      <div role="dialog" aria-label="Install Sādhanā on iOS"
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(10, 26, 20, 0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-6)',
        }}
      >
        <div style={{ maxWidth: 360, textAlign: 'center', color: 'var(--text)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'var(--text-2xl)', letterSpacing: 'var(--tracking-royal)', marginBottom: 'var(--space-3)' }}>
            Add to Home Screen
          </h2>
          <ol style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--text-md)', color: 'var(--text-2)', lineHeight: 'var(--leading-relaxed)', textAlign: 'left', margin: 'var(--space-4) auto', padding: '0 var(--space-6)' }}>
            <li style={{ marginBottom: 'var(--space-2)' }}>
              Tap the <strong>Share</strong> button at the bottom of Safari.
            </li>
            <li style={{ marginBottom: 'var(--space-2)' }}>
              Choose <strong>Add to Home Screen</strong>.
            </li>
            <li>Tap <strong>Add</strong>.</li>
          </ol>
          <button
            type="button"
            onClick={handleIosDone}
            style={{
              padding: 'var(--space-3) var(--space-8)',
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-md)',
              color: 'var(--accent)',
              background: 'transparent',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              marginTop: 'var(--space-4)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Install Sādhanā"
      style={{
        position: 'fixed',
        bottom: 'var(--space-4)', left: 'var(--space-4)', right: 'var(--space-4)',
        maxWidth: 480, margin: '0 auto', zIndex: 80,
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--bg-3)',
        border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
        borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      <p style={{ flex: 1, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 'var(--leading-snug)', margin: 0 }}>
        Install Sādhanā for daily practice.
      </p>
      <button
        type="button"
        onClick={deferred ? handleInstall : handleIosCoach}
        style={{
          padding: 'var(--space-2) var(--space-4)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          color: 'var(--accent)',
          background: 'transparent',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        Install
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{
          background: 'transparent', border: 'none', color: 'var(--text-3)',
          cursor: 'pointer', padding: 'var(--space-2)', fontSize: 'var(--text-md)',
        }}
      >
        ×
      </button>
    </div>
  );
}
