'use client';

/**
 * Client-side providers wrapper.
 *
 * layout.tsx is a server component (required for metadata export).
 * All client-side context providers are composed here and rendered
 * as a single client boundary in the layout.
 */

import type { ReactNode } from 'react';
import { AuthProvider } from './lib/auth';
import ScriptToggle from './components/ScriptToggle';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <ScriptToggle />
    </AuthProvider>
  );
}
