'use client';

/**
 * ServiceWorkerRegistrar — Registers the service worker for PWA offline shell.
 *
 * This is a headless client component (renders nothing). It registers sw.js
 * on mount, enabling the offline cache-first shell for the app.
 *
 * Placed in layout.tsx so it runs once at app boot.
 */

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sadhana/sw.js').catch(() => {
        // Silent fail — SW is a progressive enhancement.
        // In dev mode (localhost without basePath), this is expected to fail.
      });
    }
  }, []);

  return null;
}
