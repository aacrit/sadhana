'use client';

/**
 * GlobalErrorListener — captures uncaught errors + unhandledrejection
 * from anywhere in the app (audit #13).
 *
 * The React error boundary catches render-time errors. This component
 * catches everything else: async failures inside event handlers,
 * setTimeout callbacks, fetch promises with no .catch(), etc. Both
 * paths emit to the telemetry events table so the progress-analyst
 * has a complete error stream without breaking the $0 constraint
 * (no Sentry).
 */

import { useEffect } from 'react';
import { emitError } from '../lib/telemetry';

export default function GlobalErrorListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onError = (event: ErrorEvent) => {
      emitError('window-error', event.error ?? new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const err = reason instanceof Error ? reason : new Error(String(reason));
      emitError('unhandled-rejection', err);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
