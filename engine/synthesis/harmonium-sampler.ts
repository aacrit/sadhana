/**
 * @module engine/synthesis/harmonium-sampler
 *
 * Unified harmonium player with tiered fallback:
 *
 *   Tier 3 (CC0 samples) -> Tier 2 (WebAudioFont) -> Tier 1 (additive synthesis)
 *
 * On first load, Tier 1 plays immediately (zero latency). In background,
 * loadHigherTiers() attempts to load Tier 2 (WebAudioFont reed organ), then
 * Tier 3 (CC0 harmonium samples). When a higher tier loads, it seamlessly
 * upgrades. If any tier fails, the system falls back silently.
 *
 * JUST-INTONATION CORRECTION:
 *   WebAudioFont samples are 12-TET tuned. Tier 3 samples are similarly
 *   12-TET. Both require detune/playbackRate correction to match the
 *   just-intonation ratios used throughout the engine. This correction
 *   is applied automatically by hzToMidiWithDetune() (Tier 2) and
 *   playbackRate calculation (Tier 3).
 *
 * ARCHITECTURE:
 *   - Tier 1: delegates to swara-voice.ts createHarmoniumNote() (additive)
 *   - Tier 2: WebAudioFont queueWaveTable() with detune correction
 *   - Tier 3: AudioBufferSourceNode with playbackRate correction
 *   - All tiers output to the same AudioContext destination
 *
 * BROWSER REQUIREMENT: requires AudioContext (user gesture on iOS Safari).
 *
 * 'use client' — this module uses Web Audio API which requires browser APIs
 */

import {
  HARMONIUM_SAMPLE_MAP,
  NOTE_TO_MIDI,
  MIDI_TO_HZ,
  findNearestSample,
} from './harmonium-samples';

// ---------------------------------------------------------------------------
// Tier 1 constants (duplicated from swara-voice.ts to avoid circular deps)
// ---------------------------------------------------------------------------

const HARMONIUM_PARTIALS: readonly number[] = [
  1.00, 0.90, 0.80, 0.65, 0.55, 0.40, 0.30, 0.20, 0.14, 0.09, 0.06, 0.04,
] as const;

const ENCLOSURE_LOW_FREQ = 400;
const ENCLOSURE_LOW_Q = 1.5;
const ENCLOSURE_LOW_GAIN = 4;
const ENCLOSURE_HIGH_FREQ = 1500;
const ENCLOSURE_HIGH_Q = 2.0;
const ENCLOSURE_HIGH_GAIN = 3;
const HARMONIUM_ATTACK = 0.08;
const HARMONIUM_DECAY = 0.15;
const HARMONIUM_SUSTAIN = 0.85;
const HARMONIUM_RELEASE = 0.20;
const BELLOWS_LFO_RATE = 4.5;
const BELLOWS_LFO_DEPTH = 1.5;

// ---------------------------------------------------------------------------
// WebAudioFont types (minimal interface for the library)
// ---------------------------------------------------------------------------

/**
 * Minimal type definitions for WebAudioFont's player API.
 * We only use queueWaveTable() for playback.
 */
interface WebAudioFontPlayer {
  queueWaveTable(
    ctx: AudioContext,
    dest: AudioNode,
    preset: WebAudioFontPreset,
    when: number,
    pitch: number,
    duration: number,
    volume?: number,
    slides?: unknown[],
  ): WebAudioFontEnvelope;
  cancelQueue(ctx: AudioContext): void;
}

interface WebAudioFontPreset {
  zones: Array<{
    keyRangeLow: number;
    keyRangeHigh: number;
    sampleRate: number;
    sample: string | Float32Array;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface WebAudioFontEnvelope {
  cancel(): void;
}

// ---------------------------------------------------------------------------
// Tier 2 detune calculation
// ---------------------------------------------------------------------------

/**
 * Converts a just-intonation frequency to a MIDI note with cents detune.
 *
 * WebAudioFont expects integer MIDI note numbers. The detune value is the
 * cents offset from that integer MIDI note required to hit the exact
 * just-intonation frequency.
 *
 * @param hz - Target frequency in Hz (just-intonation tuned)
 * @returns Object with integer MIDI note and cents detune
 */
function hzToMidiWithDetune(hz: number): { midi: number; detune: number } {
  const exactMidi = 69 + 12 * Math.log2(hz / 440);
  const midi = Math.round(exactMidi);
  const detune = (exactMidi - midi) * 100; // cents offset
  return { midi, detune };
}

// ---------------------------------------------------------------------------
// HarmoniumPlayer
// ---------------------------------------------------------------------------

/**
 * Unified harmonium player with tiered fallback.
 *
 * Usage:
 *   const player = new HarmoniumPlayer(audioContext, saHz);
 *   player.playNote(440, 0.5);  // Tier 1 immediately
 *   await player.loadHigherTiers();  // background upgrade
 *   player.playNote(440, 0.5);  // now uses Tier 2 or 3
 *   player.dispose();
 *
 * The player always works from the moment of construction (Tier 1).
 * Higher tiers load asynchronously and upgrade transparently.
 */
export class HarmoniumPlayer {
  private _tier: 1 | 2 | 3 = 1;
  private ctx: AudioContext;
  private saHz: number;
  private masterGain: GainNode;
  private loading = false;
  private disposed = false;

  // Tier 2 state
  private wafPlayer: WebAudioFontPlayer | null = null;
  private wafPreset: WebAudioFontPreset | null = null;

  // Tier 3 state
  private sampleBuffers: Map<number, AudioBuffer> = new Map(); // MIDI -> AudioBuffer

  constructor(ctx: AudioContext, saHz: number) {
    this.ctx = ctx;
    this.saHz = saHz;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(ctx.destination);
  }

  /**
   * Current tier level.
   */
  get currentTier(): 1 | 2 | 3 {
    return this._tier;
  }

  /**
   * Updates the Sa reference frequency.
   */
  setSa(hz: number): void {
    this.saHz = hz;
  }

  /**
   * Play a note at the given just-intonation frequency.
   * Uses the highest available tier.
   *
   * @param hz - Frequency in Hz (already just-intonation corrected)
   * @param duration - Duration in seconds
   * @param volume - Volume (0 to 1), default 0.5
   */
  playNote(hz: number, duration: number, volume: number = 0.5): void {
    if (this.disposed) return;

    if (this._tier === 3 && this.sampleBuffers.size > 0) {
      this.playTier3(hz, duration, volume);
    } else if (this._tier >= 2 && this.wafPlayer && this.wafPreset) {
      this.playTier2(hz, duration, volume);
    } else {
      this.playTier1(hz, duration, volume);
    }
  }

  /**
   * Play a phrase: an array of { hz, duration } pairs in sequence.
   *
   * @param notes - Array of notes to play
   * @param gap - Gap between notes in seconds (default 0.05)
   */
  async playPhrase(
    notes: Array<{ hz: number; duration: number }>,
    gap: number = 0.05,
  ): Promise<void> {
    for (const note of notes) {
      if (this.disposed) break;
      this.playNote(note.hz, note.duration);
      await sleep((note.duration + gap) * 1000);
    }
  }

  /**
   * Start background loading of Tier 2 + Tier 3.
   * Call once after first user interaction (AudioContext unlock).
   *
   * Uses requestIdleCallback where available to avoid blocking the main
   * thread. Falls back to setTimeout on browsers without it.
   */
  async loadHigherTiers(): Promise<void> {
    if (this.loading || this.disposed) return;
    this.loading = true;

    try {
      // Schedule loading during idle time
      await idleCallback();

      // Try Tier 2 first (WebAudioFont — smaller, loads faster)
      const tier2Loaded = await this.loadTier2();
      if (tier2Loaded && !this.disposed) {
        this._tier = 2;
      }

      // Then try Tier 3 (CC0 samples — larger, better quality)
      await idleCallback();
      const tier3Loaded = await this.loadTier3();
      if (tier3Loaded && !this.disposed) {
        this._tier = 3;
      }
    } catch {
      // Silent failure — Tier 1 remains available
    } finally {
      this.loading = false;
    }
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.disposed = true;
    if (this.wafPlayer) {
      try { this.wafPlayer.cancelQueue(this.ctx); } catch { /* ignore */ }
    }
    this.wafPlayer = null;
    this.wafPreset = null;
    this.sampleBuffers.clear();
    this.masterGain.disconnect();
  }

  // -------------------------------------------------------------------------
  // Tier 1: Additive harmonium synthesis (from swara-voice.ts patterns)
  // -------------------------------------------------------------------------

  private playTier1(hz: number, duration: number, volume: number): void {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const attack = HARMONIUM_ATTACK;
    const release = HARMONIUM_RELEASE;

    // Enclosure resonance filters
    const filterLow = ctx.createBiquadFilter();
    filterLow.type = 'peaking';
    filterLow.frequency.value = ENCLOSURE_LOW_FREQ;
    filterLow.Q.value = ENCLOSURE_LOW_Q;
    filterLow.gain.value = ENCLOSURE_LOW_GAIN;

    const filterHigh = ctx.createBiquadFilter();
    filterHigh.type = 'peaking';
    filterHigh.frequency.value = ENCLOSURE_HIGH_FREQ;
    filterHigh.Q.value = ENCLOSURE_HIGH_Q;
    filterHigh.gain.value = ENCLOSURE_HIGH_GAIN;

    filterLow.connect(filterHigh);

    // Master gain with ADSR
    const master = ctx.createGain();
    master.gain.value = 0;
    filterHigh.connect(master);
    master.connect(this.masterGain);

    const peakVolume = volume;
    const sustainVolume = volume * HARMONIUM_SUSTAIN;

    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(peakVolume, now + attack);
    master.gain.linearRampToValueAtTime(sustainVolume, now + attack + HARMONIUM_DECAY);

    const releaseStart = now + duration - release;
    if (releaseStart > now + attack + HARMONIUM_DECAY) {
      master.gain.setValueAtTime(sustainVolume, releaseStart);
    }
    master.gain.linearRampToValueAtTime(0, now + duration);

    // Bellows LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = BELLOWS_LFO_RATE;

    // 12 partials
    const oscillators: OscillatorNode[] = [];
    for (let i = 0; i < HARMONIUM_PARTIALS.length; i++) {
      const partialIndex = i + 1;
      const partialHz = hz * partialIndex;
      const amplitude = HARMONIUM_PARTIALS[i]!;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = partialHz;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = BELLOWS_LFO_DEPTH * partialIndex;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const gain = ctx.createGain();
      gain.gain.value = amplitude * 0.15;

      osc.connect(gain);
      gain.connect(filterLow);

      oscillators.push(osc);
    }

    lfo.start(now);
    lfo.stop(now + duration + 0.02);
    for (const osc of oscillators) {
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    // Auto-cleanup after note ends
    const lastOsc = oscillators[oscillators.length - 1];
    if (lastOsc) {
      lastOsc.onended = () => {
        lfo.disconnect();
        for (const osc of oscillators) osc.disconnect();
        filterLow.disconnect();
        filterHigh.disconnect();
        master.disconnect();
      };
    }
  }

  // -------------------------------------------------------------------------
  // Tier 2: WebAudioFont reed organ
  // -------------------------------------------------------------------------

  private async loadTier2(): Promise<boolean> {
    try {
      // Dynamically load the WebAudioFont library.
      // The npm package defines global-scope classes (no ESM exports).
      // The bundler wraps them; we extract the player constructor from
      // either the default export or the named export.
      const wafModule = await import('webaudiofont');
      const PlayerCtor =
        (wafModule as Record<string, unknown>).WebAudioFontPlayer ??
        (wafModule as Record<string, unknown>).default;

      if (typeof PlayerCtor !== 'function') {
        return false;
      }

      const player = new (PlayerCtor as new () => WebAudioFontPlayer)();

      // Load reed organ preset (GM program 20) from CDN
      const presetUrl =
        'https://surikov.github.io/webaudiofontdata/sound/0200_GeneralUserGS_sf2_file.js';

      const preset = await loadWebAudioFontPreset(presetUrl);
      if (!preset) return false;

      this.wafPlayer = player;
      this.wafPreset = preset;
      return true;
    } catch {
      // WebAudioFont not available — stay on Tier 1
      return false;
    }
  }

  private playTier2(hz: number, duration: number, volume: number): void {
    if (!this.wafPlayer || !this.wafPreset) {
      this.playTier1(hz, duration, volume);
      return;
    }

    const { midi, detune } = hzToMidiWithDetune(hz);

    // WebAudioFont uses 'pitch' as the MIDI note number.
    // Apply detune by adjusting the pitch as a fractional MIDI note.
    const adjustedPitch = midi + detune / 100;

    try {
      this.wafPlayer.queueWaveTable(
        this.ctx,
        this.masterGain,
        this.wafPreset,
        this.ctx.currentTime,
        adjustedPitch,
        duration,
        volume * 0.8,
      );
    } catch {
      // Fallback to Tier 1 on any playback error
      this.playTier1(hz, duration, volume);
    }
  }

  // -------------------------------------------------------------------------
  // Tier 3: CC0 harmonium samples
  // -------------------------------------------------------------------------

  private async loadTier3(): Promise<boolean> {
    try {
      const basePath =
        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BASE_PATH
          ? process.env.NEXT_PUBLIC_BASE_PATH
          : '') + '/audio/harmonium/';

      let loadedCount = 0;

      const loadOne = async (note: string, file: string): Promise<void> => {
        try {
          const response = await fetch(basePath + file);
          if (!response.ok) return;
          const arrayBuf = await response.arrayBuffer();
          const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
          const midi = NOTE_TO_MIDI[note];
          if (midi !== undefined) {
            this.sampleBuffers.set(midi, audioBuf);
            loadedCount++;
          }
        } catch {
          // Skip failed samples
        }
      };

      await Promise.all(
        Object.entries(HARMONIUM_SAMPLE_MAP).map(([note, file]) =>
          loadOne(note, file),
        ),
      );

      // Need at least 3 samples for reasonable interpolation coverage
      return loadedCount >= 3;
    } catch {
      return false;
    }
  }

  private playTier3(hz: number, duration: number, volume: number): void {
    const { midi: nearestMidi, sampleHz } = findNearestSample(hz);
    const buffer = this.sampleBuffers.get(nearestMidi);

    if (!buffer) {
      // Fall back: try Tier 2, then Tier 1
      if (this.wafPlayer && this.wafPreset) {
        this.playTier2(hz, duration, volume);
      } else {
        this.playTier1(hz, duration, volume);
      }
      return;
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    // Pitch correction: playbackRate = target / sample frequency
    source.playbackRate.value = hz / sampleHz;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.8, now);
    // Apply a release envelope for natural fade-out
    const releaseStart = now + duration - HARMONIUM_RELEASE;
    if (releaseStart > now) {
      gain.gain.setValueAtTime(volume * 0.8, releaseStart);
    }
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.2);

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
    source.stop(now + duration + 0.3);

    // Auto-cleanup
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Promise wrapper for requestIdleCallback, with setTimeout fallback.
 * Yields to the browser event loop to avoid blocking main thread
 * during sample loading.
 */
function idleCallback(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve());
    } else {
      setTimeout(resolve, 1);
    }
  });
}

/**
 * Loads a WebAudioFont instrument preset from a CDN URL.
 *
 * WebAudioFont presets are JS files that assign to a global variable.
 * We load them via a script tag and then extract the preset data.
 *
 * @param url - URL of the WebAudioFont preset JS file
 * @returns The preset object, or null if loading failed
 */
async function loadWebAudioFontPreset(url: string): Promise<WebAudioFontPreset | null> {
  try {
    // The preset file defines a global variable like `_tone_0200_GeneralUserGS_sf2_file`
    // We need to detect which global was added after the script loads.
    if (typeof document === 'undefined') return null;

    const globalsBefore = new Set(Object.keys(window));

    return new Promise<WebAudioFontPreset | null>((resolve) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        // Find the new global variable
        const globalsAfter = Object.keys(window);
        const newGlobal = globalsAfter.find(
          (key) => !globalsBefore.has(key) && key.startsWith('_tone_'),
        );

        if (newGlobal) {
          const preset = (window as unknown as Record<string, unknown>)[newGlobal] as WebAudioFontPreset;
          resolve(preset);
        } else {
          resolve(null);
        }

        // Clean up the script tag
        script.remove();
      };
      script.onerror = () => {
        script.remove();
        resolve(null);
      };

      document.head.appendChild(script);
    });
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
