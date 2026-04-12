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
import { VoiceWaveProvider } from './lib/VoiceWaveContext';
import ScriptToggle from './components/ScriptToggle';
import VoiceWave from './components/VoiceWave';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <VoiceWaveProvider>
        <VoiceWave variant="ambient" />
        {children}
        <ScriptToggle />
      </VoiceWaveProvider>
    </AuthProvider>
  );
}
