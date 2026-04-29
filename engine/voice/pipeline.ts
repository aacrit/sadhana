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
  /** Minimum clarity threshold for pitch detection. Default: 0.80. */
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

  // Pre-allocated time-domain buffer for Pitchy — reused every detect() frame.
  // Allocated once in start() after the AnalyserNode is created; sized to fftSize.
  // Eliminates one `new Float32Array(2048)` allocation per animation frame (~60/s).
  private detectBuffer: Float32Array<ArrayBuffer> | null = null;

  // Rolling buffer of recent swaras for pakad detection
  private swaraBuffer: Swara[] = [];
  private lastSilenceTime: number = 0;

  // Pitch smoothing — 3-frame median filter on raw Hz, kills single-frame
  // outliers from vibrato, breath transients, and detector glitches.
  // Fixed-size ring (length 3); when fewer than 3 valid frames, pass through.
  private pitchMedianRing: number[] = [];
  private static readonly PITCH_MEDIAN_SIZE = 3;

  // Octave-error rejection — 5-frame moving median of accepted pitches.
  // If a new candidate deviates more than 0.6 octaves from this median,
  // we treat it as a probable Pitchy octave error and drop the frame.
  // First 5 frames bypass the check (no history yet).
  private pitchOctaveMedianRing: number[] = [];
  private static readonly PITCH_OCTAVE_MEDIAN_SIZE = 5;
  private static readonly PITCH_OCTAVE_REJECT_OCTAVES = 0.6;

  // Rolling pitch history: ring buffer for [timestamp, hz] pairs.
  // Used for waveform visualization. Stored as a fixed-size circular buffer
  // (head index + count) to avoid Array.shift() O(n) on every emit.
  private pitchHistoryRing: ([number, number] | null)[];
  private pitchHistoryHead: number = 0;
  private pitchHistoryCount: number = 0;
  private readonly PITCH_HISTORY_MAX = 30; // ~500ms at 60fps

  // Live readonly snapshot of pitchHistory in chronological order.
  // Rebuilt in-place (no allocation) inside emitPitch so VoiceEvent.pitchHistory
  // can be passed without spreading. External callers of getPitchHistory()
  // receive a copy.
  private pitchHistorySnapshot: [number, number][];

  // Per-pakad cooldown: keyed by pakad's swara-sequence string.
  // Distinct pakads can fire back-to-back; the same pakad respects the 5s cooldown.
  private lastPakadTime: Map<string, number> = new Map();
  private readonly PAKAD_COOLDOWN_MS = 5000;

  constructor(config: VoicePipelineConfig) {
    this.config = {
      clarityThreshold: 0.80,
      fftSize: 2048,
      swaraBufferSize: 20,
      level: 'shishya',
      ...config,
    };
    // Pre-allocate ring buffer + chronological snapshot — allocated once
    // and reused; no per-frame allocation.
    this.pitchHistoryRing = new Array<[number, number] | null>(this.PITCH_HISTORY_MAX).fill(null);
    this.pitchHistorySnapshot = new Array<[number, number]>(this.PITCH_HISTORY_MAX).fill([0, 0]);
    this.pitchHistorySnapshot.length = 0;
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
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: { ideal: 44100 },
          channelCount: 1,
        },
      });
    } catch (micErr) {
      // Some browsers don't support sampleRate constraint — retry without it
      if (
        micErr instanceof DOMException &&
        (micErr.name === 'OverconstrainedError' || micErr.name === 'TypeError')
      ) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
          },
        });
      } else {
        throw micErr;
      }
    }

    // Create AudioContext
    this.audioContext = new AudioContext();
    await this.audioContext.resume();

    // Connect mic -> analyser
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = this.config.fftSize ?? 2048;
    this.sourceNode.connect(this.analyserNode);

    // Pre-allocate the time-domain buffer for Pitchy — reused every detect() frame.
    this.detectBuffer = new Float32Array(this.analyserNode.fftSize) as Float32Array<ArrayBuffer>;

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
    this.detectBuffer = null;
    this.swaraBuffer = [];
    this.pitchHistoryRing.fill(null);
    this.pitchHistoryHead = 0;
    this.pitchHistoryCount = 0;
    this.pitchHistorySnapshot.length = 0;
    this.pitchMedianRing = [];
    this.pitchOctaveMedianRing = [];
    this.lastPakadTime.clear();
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
  /**
   * Expose the underlying AudioContext so the frontend can register it
   * with the global resumer (audit #1 — backgrounded mobile context
   * suspension). Returns null when the pipeline has not started.
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

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
   * Updates the per-sample clarity threshold at runtime.
   *
   * Pitchy clarity (McLeod Pitch Method periodicity score) for real-world
   * sung vowels typically lands in 0.55–0.85. A brief `setClarityThreshold`
   * relax lets callers (e.g. Sa-detection auto-calibration) lower the gate
   * progressively when no candidate passes within a timeout, rather than
   * re-creating the pipeline.
   *
   * @param threshold - Clarity value in [0, 1]. Values outside the range are clamped.
   */
  setClarityThreshold(threshold: number): void {
    const clamped = Math.max(0, Math.min(1, threshold));
    this.config = { ...this.config, clarityThreshold: clamped };
  }

  /**
   * Returns the current clarity threshold — useful for tests and for
   * callers that implement progressive relaxation and want to inspect
   * the live value.
   */
  getClarityThreshold(): number {
    return this.config.clarityThreshold ?? 0.80;
  }

  /**
   * Returns the current rolling buffer of detected swaras.
   * Useful for UI display of recent pitch history.
   */
  getSwaraBuffer(): readonly Swara[] {
    return [...this.swaraBuffer];
  }

  /**
   * Returns the rolling pitch history: recent [timestamp, hz] pairs in
   * chronological order (oldest first, newest last).
   *
   * Returns a fresh snapshot copy — safe for the caller to retain. The
   * pipeline reuses an internal buffer for the per-frame VoiceEvent so
   * we explicitly pay the allocation here for external consumers.
   */
  getPitchHistory(): readonly [number, number][] {
    return this.collectPitchHistorySnapshot(true);
  }

  /**
   * Rebuild `pitchHistorySnapshot` in chronological order from the ring
   * buffer. The internal snapshot array is reused (no allocation). When
   * `clone` is true, a defensive copy is returned (used by external
   * `getPitchHistory()` callers); otherwise the live readonly snapshot
   * is returned (used to populate VoiceEvent on the hot path).
   */
  private collectPitchHistorySnapshot(clone: boolean): readonly [number, number][] {
    const ring = this.pitchHistoryRing;
    const cap = this.PITCH_HISTORY_MAX;
    const count = this.pitchHistoryCount;
    const head = this.pitchHistoryHead;
    const start = count < cap ? 0 : head;
    const snapshot = this.pitchHistorySnapshot;
    snapshot.length = 0;
    for (let i = 0; i < count; i++) {
      const idx = (start + i) % cap;
      const entry = ring[idx];
      if (entry) snapshot.push(entry);
    }
    if (clone) {
      return snapshot.slice() as [number, number][];
    }
    return snapshot;
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

    // Reuse the pre-allocated buffer — no allocation on the hot path.
    const buffer = this.detectBuffer!;
    this.analyserNode.getFloatTimeDomainData(buffer);

    // Check if there is any significant audio signal
    const rms = computeRMS(buffer);
    const now = this.audioContext.currentTime;

    // Silence threshold — below this, no meaningful audio
    const SILENCE_RMS = 0.01;
    // Dynamic pitch ceiling: ~3 octaves above Sa (covers full vocal range)
    const pitchCeiling = Math.min(this.config.sa_hz * 8, 4200);

    if (rms < SILENCE_RMS) {
      this.emitSilence(now);
    } else {
      // Always attempt pitch detection when RMS > silence — let clarity
      // distinguish pitched sound from noise, not the RMS level.
      // This prevents soft singers from being misclassified as noise.
      const [pitch, clarity] = this.pitchDetector.findPitch(
        buffer,
        this.audioContext.sampleRate,
      );

      const threshold = this.config.clarityThreshold ?? 0.80;

      if (clarity >= threshold && pitch > 50 && pitch < pitchCeiling) {
        // Octave-error rejection: McLeod sometimes reports an octave above
        // or below the true fundamental. Compare to a 5-frame moving median
        // of recently accepted pitches; reject candidates more than 0.6
        // octaves away. Bypass while the history is still warming up.
        if (
          this.pitchOctaveMedianRing.length >= VoicePipeline.PITCH_OCTAVE_MEDIAN_SIZE &&
          isOctaveError(pitch, this.pitchOctaveMedianRing, VoicePipeline.PITCH_OCTAVE_REJECT_OCTAVES)
        ) {
          // Probable octave error — drop this frame, do not update median rings
          this.emitNoise(now);
        } else {
          // Update the octave-median history with the accepted candidate
          this.pitchOctaveMedianRing.push(pitch);
          if (this.pitchOctaveMedianRing.length > VoicePipeline.PITCH_OCTAVE_MEDIAN_SIZE) {
            this.pitchOctaveMedianRing.shift();
          }

          // 3-frame median smoothing: kills single-frame spikes (vibrato
          // peaks, brief detector glitches). When we have fewer than 3
          // frames, pass through untouched.
          this.pitchMedianRing.push(pitch);
          if (this.pitchMedianRing.length > VoicePipeline.PITCH_MEDIAN_SIZE) {
            this.pitchMedianRing.shift();
          }
          const smoothed =
            this.pitchMedianRing.length === VoicePipeline.PITCH_MEDIAN_SIZE
              ? median3(this.pitchMedianRing[0]!, this.pitchMedianRing[1]!, this.pitchMedianRing[2]!)
              : pitch;

          this.emitPitch(smoothed, clarity, now);
        }
      } else {
        // Sound present but no clear pitch — noise/speech
        this.emitNoise(now);
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

    // Push the new sample into the fixed-size ring buffer (O(1), no shift).
    const cap = this.PITCH_HISTORY_MAX;
    this.pitchHistoryRing[this.pitchHistoryHead] = [timestamp, hz];
    this.pitchHistoryHead = (this.pitchHistoryHead + 1) % cap;
    if (this.pitchHistoryCount < cap) {
      this.pitchHistoryCount++;
    }

    // Build a chronological readonly snapshot (no copy) for the live event.
    const snapshot = this.collectPitchHistorySnapshot(false);

    const event: VoiceEvent = {
      type: 'pitch',
      hz,
      clarity,
      swara: result.nearestSwara,
      deviationCents: result.deviationCents,
      inRaga: result.inRagaContext,
      accuracy: result.accuracy,
      pitchResult: result,
      pitchHistory: snapshot,
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

    // Need at least 3 swaras for a meaningful match
    if (this.swaraBuffer.length < 3) return;

    const match = recognizePakadInRaga(
      this.swaraBuffer,
      this.config.ragaId,
    );

    if (match) {
      // Per-pakad cooldown — keyed by the pakad's swara-sequence string.
      // Distinct pakads can fire back-to-back; the same pakad respects
      // the global PAKAD_COOLDOWN_MS window.
      const nowMs = timestamp * 1000;
      const key = match.pakadPhrase.map((n) => n.swara).join('-');
      const last = this.lastPakadTime.get(key) ?? 0;
      if (nowMs - last < this.PAKAD_COOLDOWN_MS) return;
      this.lastPakadTime.set(key, nowMs);
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

/**
 * 3-element median — the middle of a, b, c. Branch-only, no allocation.
 * Exported for unit tests.
 */
export function median3(a: number, b: number, c: number): number {
  if (a > b) {
    if (b > c) return b;       // a > b > c
    return a > c ? c : a;      // a > c > b OR c > a > b
  }
  // b >= a
  if (a > c) return a;         // b >= a > c
  return b > c ? c : b;        // b > c >= a OR c >= b >= a
}

/**
 * Returns the median of an array (assumed non-empty). Used for the
 * 5-frame moving median that backstops octave-error rejection.
 */
function medianOfArray(xs: readonly number[]): number {
  const sorted = xs.slice().sort((a, b) => a - b);
  const mid = sorted.length >>> 1;
  if (sorted.length & 1) return sorted[mid]!;
  return 0.5 * (sorted[mid - 1]! + sorted[mid]!);
}

/**
 * Returns true if `candidate` deviates more than `octaves` octaves from the
 * median of `history`. Distance is computed in log2 space so the test is
 * symmetric across octave doublings/halvings — the typical Pitchy octave
 * error.
 *
 * Exported for unit tests.
 */
export function isOctaveError(
  candidate: number,
  history: readonly number[],
  octaves: number,
): boolean {
  if (candidate <= 0 || history.length === 0) return false;
  const m = medianOfArray(history);
  if (m <= 0) return false;
  const deviation = Math.abs(Math.log2(candidate / m));
  return deviation > octaves;
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
