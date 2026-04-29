'use client';

/**
 * ErrorBoundary — root-level React error boundary (audit #13).
 *
 * Catches render-time errors from the entire app, emits an `error`
 * telemetry event with the stack + component stack, and renders a
 * minimal recovery UI rather than a white screen of death. Without
 * this, a single broken component takes down the whole app and you
 * hear about it from a user's tweet, not your dashboard.
 *
 * Mounted in providers.tsx so it covers every route.
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { emitError } from '../lib/telemetry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    emitError('react-error', error, {
      componentStack: info.componentStack ?? null,
      path: typeof window !== 'undefined' ? window.location.pathname : null,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          background: 'var(--bg-1)',
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center', color: 'var(--text)' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 300,
            fontSize: 'var(--text-2xl)',
            letterSpacing: 'var(--tracking-royal)',
            marginBottom: 'var(--space-3)',
          }}>
            Something broke.
          </h1>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 'var(--text-md)',
            color: 'var(--text-2)',
            lineHeight: 'var(--leading-relaxed)',
            marginBottom: 'var(--space-6)',
          }}>
            The error has been recorded. Reload the page or return home.
            Your practice data is safe.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-md)',
                color: 'var(--accent)',
                background: 'transparent',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-2)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
