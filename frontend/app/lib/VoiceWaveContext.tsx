'use client';

/**
 * VoiceWaveContext — shares an AnalyserNode across the app for visualization.
 *
 * When any page starts the VoicePipeline (lessons, freeform), it registers
 * the pipeline's AnalyserNode here. The VoiceWave component reads from this
 * context to render real-time mic waveform data.
 *
 * When no analyser is registered, VoiceWave falls back to ambient animation.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface VoiceWaveContextValue {
  /** The current AnalyserNode from an active VoicePipeline. */
  analyser: AnalyserNode | null;
  /** Register an AnalyserNode (call when pipeline starts). */
  setAnalyser: (node: AnalyserNode | null) => void;
  /** Current Sa frequency for swara marker positioning. */
  saHz: number;
  /** Update the Sa frequency (call when Sa is calibrated). */
  setSaHz: (hz: number) => void;
}

const VoiceWaveCtx = createContext<VoiceWaveContextValue>({
  analyser: null,
  setAnalyser: () => {},
  saHz: 261.63,
  setSaHz: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function VoiceWaveProvider({ children }: { children: ReactNode }) {
  const [analyser, setAnalyserState] = useState<AnalyserNode | null>(null);
  const [saHz, setSaHzState] = useState(261.63);

  const setAnalyser = useCallback((node: AnalyserNode | null) => {
    setAnalyserState(node);
  }, []);

  const setSaHz = useCallback((hz: number) => {
    setSaHzState(hz);
  }, []);

  return (
    <VoiceWaveCtx.Provider value={{ analyser, setAnalyser, saHz, setSaHz }}>
      {children}
    </VoiceWaveCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceWave(): VoiceWaveContextValue {
  return useContext(VoiceWaveCtx);
}
