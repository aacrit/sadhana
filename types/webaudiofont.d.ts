/**
 * Minimal type declarations for the `webaudiofont` npm package.
 *
 * WebAudioFont is a JavaScript library for playing MIDI instruments
 * using Web Audio API. It does not ship TypeScript declarations.
 * These types cover only the subset used by harmonium-sampler.ts.
 *
 * @see https://github.com/nicokosi/webaudiofont
 */
declare module 'webaudiofont' {
  export class WebAudioFontPlayer {
    constructor();

    /**
     * Queue a wave table note for playback.
     *
     * @param ctx - AudioContext
     * @param dest - Destination AudioNode
     * @param preset - Instrument preset data (loaded from CDN)
     * @param when - AudioContext time to start playback
     * @param pitch - MIDI note number (can be fractional for detune)
     * @param duration - Duration in seconds
     * @param volume - Volume (0 to 1)
     * @param slides - Optional pitch slides
     * @returns Envelope handle with cancel() method
     */
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

  export interface WebAudioFontPreset {
    zones: Array<{
      keyRangeLow: number;
      keyRangeHigh: number;
      sampleRate: number;
      sample: string | Float32Array;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }

  export interface WebAudioFontEnvelope {
    cancel(): void;
  }

  const player: typeof WebAudioFontPlayer;
  export default player;
}
