/**
 * @module engine/voice/pipeline
 *
 * THE MOAT. The complete voice processing pipeline.
 *
 * Mic -> getUserMedia -> AnalyserNode -> pitch detection (Pitchy/McLeod)
 *   -> mapPitchToSwara -> raga grammar check -> pakad recognition -> events
 *
 * This pipeline runs in the browser. Pitch detection uses the Pitchy
 * library (McLeod Pitch Method) which runs on the main thread via
 * requestAnimationFrame or an AnalyserNode feeding into the McLeod
 * algorithm. The detection runs at the rate of the AnalyserNode's
 * time-domain data updates, typically every ~20ms.
 *
 * Architecture decisions:
 *
 *   1. We use AnalyserNode + main-thread Pitchy rather than AudioWorklet
 *      for pitch detection. Reason: Pitchy expects Float32Array input and
 *      runs in <5ms per frame — fast enough for main thread without jank.
 *      AudioWorklet adds complexity (message passing latency, SharedArrayBuffer
 *      requirements) without measurable latency benefit for our use case.
 *      If profiling shows main-thread pressure, the detection can be moved
 *      to a Worker or AudioWorklet in a future iteration.
 *
 *   2. RNNoise WASM is a future enhancement. The current pipeline works
 *      without denoising. When RNNoise is integrated, it will be inserted
 *      as a ScriptProcessorNode or AudioWorkletNode between the mic source
 *      and the AnalyserNode. The pipeline architecture supports this
 *      insertion without changes to the rest of the chain.
 *
 *   3. The pipeline emits VoiceEvents via a callback. The UI layer
 *      subscribes to these events and updates visualisation accordingly.
 *      Events are not buffered — only the latest pitch matters for
 *      real-time feedback.
 *
 * TARGET LATENCY: <50ms mic-to-visual.
 *   - getUserMedia: ~0ms (already streaming)
 *   - AnalyserNode FFT: ~10ms (2048 samples at 48kHz = 42ms window, but
 *     the AnalyserNode provides overlapping updates)
 *   - Pitchy McLeod: <5ms per frame
 *   - mapPitchToSwara: <0.5ms
 *   - React state update + render: ~10-20ms
 *   Total: ~25-35ms typical. Well within 50ms target.
 *
 * BROWSER REQUIREMENTS:
 *   - getUserMedia permission for microphone
 *   - AudioContext (user gesture required on iOS Safari)
 *   - Pitchy library must be installed (it is: see package.json)
 *
 * 'use client' — this module uses Web Audio API + getUserMedia
 */

import type { Swara, Raga } from '../theory/types';
import { mapPitchToSwara } from '../analysis/pitch-mapping';
import type { PitchResult, Level } from '../analysis/pitch-mapping';
import { recognizePakadInRaga } from '../analysis/phrase-recognition';
import type { PakadMatch } from '../analysis/phrase-recognition';
import { getRagaById } from '../theory/ragas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A voice event emitted by the pipeline.
 *
 * 'pitch': a valid pitch was detected.
 * 'silence': no pitch detected (below clarity threshold, or silence).
 * 'noise': sound detected but no clear pitch (talking, noise, etc.).
 */
export interface VoiceEvent {
  readonly type: 'pitch' | 'silence' | 'noise';
  /** Detected frequency in Hz (only for 'pitch' type). */
  readonly hz?: number;
  /** Pitch detection clarity (0-1, only for 'pitch' type). */
  readonly clarity?: number;
  /** Nearest swara (only for 'pitch' type). */
  readonly swara?: Swara;
  /** Deviation from nearest swara in cents (only for 'pitch' type). */
  readonly deviationCents?: number;
  /** Is this swara valid in the current raga? */
  readonly inRaga?: boolean;
  /** Accuracy score for current level (0-1). */
  readonly accuracy?: number;
  /** Full pitch result for advanced consumers. */
  readonly pitchResult?: PitchResult;
  /** Rolling pitch history: recent [timestamp, hz] pairs for waveform. */
  readonly pitchHistory?: readonly [number, number][];
  /** Timestamp (AudioContext currentTime). */
  readonly timestamp: number;
}

/**
 * Configuration for the voice pipeline.
 */
export interface VoicePipelineConfig {
  /** Sa frequency in Hz. */
  readonly sa_hz: number;
  /** Raga ID for context-aware feedback. Optional. */
  readonly ragaId?: string;
  /** Student level for accuracy scoring. Default: 'shishya'. */
  readonly level?: Level;
  /** Callback for pitch events. */
  readonly onPitch: (event: VoiceEvent) => void;
  /** Callback for silence events. */
  readonly onSilence: () => void;
  /** Callback when a pakad is detected. */
  readonly onPakadDetected?: (match: PakadMatch) => void;
  /** Minimum clarity threshold for pitch detection. Default: 0.85. */
  readonly clarityThreshold?: number;
  /** FFT size for the AnalyserNode. Default: 2048. */
  readonly fftSize?: number;
  /** Size of the rolling swara buffer for pakad detection. Default: 20. */
  readonly swaraBufferSize?: number;
}

// ---------------------------------------------------------------------------
// Voice Pipeline
// ---------------------------------------------------------------------------

/**
 * The VoicePipeline class manages the complete audio capture and analysis
 * chain. It is the core of Sadhana's real-time voice feedback system.
 *
 * Lifecycle:
 *   1. Create with config: new VoicePipeline({ sa_hz, ragaId, onPitch, ... })
 *   2. Start (from user gesture): await pipeline.start()
 *   3. Pipeline emits VoiceEvents via callbacks
 *   4. Stop: pipeline.stop()
 *
 * The pipeline maintains a rolling buffer of recent swaras for pakad
 * detection. When the buffer contains a recognisable pakad, the
 * onPakadDetected callback fires — this is the magic moment.
 */
export class VoicePipeline {
  private config: VoicePipelineConfig;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private running: boolean = false;
  private animFrameId: number | null = null;

  // Pitchy detector — lazy loaded because it's an ES module
  private pitchDetector: PitchyDetector | null = null;

  // Rolling buffer of recent swaras for pakad detection
  private swaraBuffer: Swara[] = [];
  private lastSilenceTime: number = 0;

  // Rolling buffer of recent [timestamp, hz] pairs for waveform visualization
  private pitchHistory: [number, number][] = [];
  private readonly PITCH_HISTORY_MAX = 30; // ~500ms at 60fps

  // Debounce: don't fire pakad detection too frequently
  private lastPakadTime: number = 0;
  private readonly PAKAD_COOLDOWN_MS = 5000;

  constructor(config: VoicePipelineConfig) {
    this.config = {
      clarityThreshold: 0.85,
      fftSize: 2048,
      swaraBufferSize: 20,
      level: 'shishya',
      ...config,
    };
  }

  /**
   * Starts the voice pipeline.
   *
   * Requests microphone access, creates the AudioContext and AnalyserNode,
   * initialises the Pitchy pitch detector, and begins the detection loop.
   *
   * MUST be called from a user gesture handler (click/touch) on iOS Safari.
   *
   * @throws {Error} if getUserMedia is not available
   * @throws {DOMException} if mic permission is denied
   */
  async start(): Promise<void> {
    if (this.running) return;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      throw new Error(
        'getUserMedia is not available. VoicePipeline requires a browser with microphone support.',
      );
    }

    // Request microphone access.
    //
    // CRITICAL: All browser-level audio processing MUST be disabled for
    // pitch detection. Echo cancellation modifies frequency content,
    // noise suppression cuts soft vowel onset, and AGC distorts amplitude
    // which corrupts clarity scores. RNNoise (when integrated) handles
    // denoising; we don't need browser-level noise suppression.
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: { ideal: 44100 },
        channelCount: 1,
      },
    });

    // Create AudioContext
    this.audioContext = new AudioContext();
    await this.audioContext.resume();

    // Connect mic -> analyser
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = this.config.fftSize ?? 2048;
    this.sourceNode.connect(this.analyserNode);

    // Initialise Pitchy pitch detector
    await this.initPitchDetector();

    // Start the detection loop
    this.running = true;
    this.swaraBuffer = [];
    this.detect();
  }

  /**
   * Stops the voice pipeline and releases all resources.
   */
  stop(): void {
    this.running = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => { /* ignore */ });
      this.audioContext = null;
    }

    this.pitchDetector = null;
    this.swaraBuffer = [];
    this.pitchHistory = [];
  }

  /**
   * Returns whether the pipeline is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Returns the AnalyserNode for external visualization (VoiceWave).
   * Returns null if the pipeline is not running.
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * Updates the Sa frequency (retuning).
   */
  updateSa(hz: number): void {
    if (hz <= 0) throw new RangeError('Sa frequency must be positive');
    this.config = { ...this.config, sa_hz: hz };
  }

  /**
   * Updates the raga context for pitch mapping and pakad detection.
   */
  updateRaga(ragaId: string): void {
    this.config = { ...this.config, ragaId };
    // Clear swara buffer when raga changes — old sequence is irrelevant
    this.swaraBuffer = [];
  }

  /**
   * Updates the student level for accuracy scoring.
   */
  updateLevel(level: Level): void {
    this.config = { ...this.config, level };
  }

  /**
   * Returns the current rolling buffer of detected swaras.
   * Useful for UI display of recent pitch history.
   */
  getSwaraBuffer(): readonly Swara[] {
    return [...this.swaraBuffer];
  }

  /**
   * Returns the rolling pitch history: recent [timestamp, hz] pairs.
   * Used for waveform visualization.
   */
  getPitchHistory(): readonly [number, number][] {
    return [...this.pitchHistory];
  }

  // -------------------------------------------------------------------------
  // Private: pitch detection loop
  // -------------------------------------------------------------------------

  /**
   * Initialises the Pitchy pitch detector.
   *
   * Pitchy is loaded dynamically because it is an ES module that may
   * not be available during server-side rendering.
   */
  private async initPitchDetector(): Promise<void> {
    try {
      // Dynamic import: Pitchy is an ES module
      const pitchy = await import('pitchy');
      const bufferSize = this.analyserNode!.fftSize;
      this.pitchDetector = pitchy.PitchDetector.forFloat32Array(bufferSize);
    } catch {
      throw new Error(
        'Failed to load Pitchy pitch detection library. ' +
        'Ensure "pitchy" is installed: npm install pitchy',
      );
    }
  }

  /**
   * The main detection loop. Runs on every animation frame.
   *
   * Reads time-domain data from the AnalyserNode, feeds it to Pitchy
   * for pitch detection, maps the result to a swara, and emits events.
   */
  private detect(): void {
    if (!this.running || !this.analyserNode || !this.audioContext || !this.pitchDetector) {
      return;
    }

    const bufferSize = this.analyserNode.fftSize;
    const buffer = new Float32Array(bufferSize);
    this.analyserNode.getFloatTimeDomainData(buffer);

    // Check if there is any significant audio signal
    const rms = computeRMS(buffer);
    const now = this.audioContext.currentTime;

    if (rms < 0.01) {
      // Silence — no meaningful audio
      this.emitSilence(now);
    } else {
      // Attempt pitch detection
      const [pitch, clarity] = this.pitchDetector.findPitch(
        buffer,
        this.audioContext.sampleRate,
      );

      const threshold = this.config.clarityThreshold ?? 0.85;

      if (clarity >= threshold && pitch > 50 && pitch < 2000) {
        // Valid pitch detected
        this.emitPitch(pitch, clarity, now);
      } else if (rms > 0.02) {
        // Sound present but no clear pitch — noise/speech
        this.emitNoise(now);
      } else {
        this.emitSilence(now);
      }
    }

    // Schedule next frame
    this.animFrameId = requestAnimationFrame(() => this.detect());
  }

  private emitPitch(hz: number, clarity: number, timestamp: number): void {
    // Map pitch to swara
    const result = mapPitchToSwara(
      hz,
      this.config.sa_hz,
      clarity,
      this.config.ragaId,
      this.config.level ?? 'shishya',
    );

    // Maintain pitch history for waveform visualization
    this.pitchHistory.push([timestamp, hz]);
    if (this.pitchHistory.length > this.PITCH_HISTORY_MAX) {
      this.pitchHistory.shift();
    }

    const event: VoiceEvent = {
      type: 'pitch',
      hz,
      clarity,
      swara: result.nearestSwara,
      deviationCents: result.deviationCents,
      inRaga: result.inRagaContext,
      accuracy: result.accuracy,
      pitchResult: result,
      pitchHistory: [...this.pitchHistory],
      timestamp,
    };

    this.config.onPitch(event);

    // Add to swara buffer for pakad detection
    this.addToSwaraBuffer(result.nearestSwara);

    // Check for pakad
    this.checkPakad(timestamp);
  }

  private emitSilence(timestamp: number): void {
    // Only emit silence if we were not already silent
    // (avoid flooding with silence events)
    if (timestamp - this.lastSilenceTime > 0.1) {
      this.config.onSilence();
      this.lastSilenceTime = timestamp;
    }
  }

  private emitNoise(timestamp: number): void {
    const event: VoiceEvent = {
      type: 'noise',
      timestamp,
    };
    // Emit as a silence-like event — noise is not useful for pitch feedback
    this.config.onPitch(event);
  }

  // -------------------------------------------------------------------------
  // Private: swara buffer and pakad detection
  // -------------------------------------------------------------------------

  private addToSwaraBuffer(swara: Swara): void {
    const maxSize = this.config.swaraBufferSize ?? 20;
    this.swaraBuffer.push(swara);
    if (this.swaraBuffer.length > maxSize) {
      this.swaraBuffer.shift();
    }
  }

  private checkPakad(timestamp: number): void {
    if (!this.config.onPakadDetected || !this.config.ragaId) return;

    // Cooldown: don't check too frequently
    const nowMs = timestamp * 1000;
    if (nowMs - this.lastPakadTime < this.PAKAD_COOLDOWN_MS) return;

    // Need at least 3 swaras for a meaningful match
    if (this.swaraBuffer.length < 3) return;

    const match = recognizePakadInRaga(
      this.swaraBuffer,
      this.config.ragaId,
    );

    if (match) {
      this.lastPakadTime = nowMs;
      this.config.onPakadDetected(match);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Computes the RMS (root mean square) of a Float32Array audio buffer.
 * Used to detect silence vs. signal presence.
 */
function computeRMS(buffer: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    const sample = buffer[i]!;
    sumSquares += sample * sample;
  }
  return Math.sqrt(sumSquares / buffer.length);
}

// ---------------------------------------------------------------------------
// Pitchy type (minimal interface for dynamic import)
// ---------------------------------------------------------------------------

/**
 * Minimal interface for the Pitchy PitchDetector.
 * The actual Pitchy library provides this; we define the interface here
 * for type safety without depending on Pitchy types at compile time.
 */
interface PitchyDetector {
  findPitch(input: Float32Array, sampleRate: number): [number, number];
}
