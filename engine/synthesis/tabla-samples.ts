/**
 * @module engine/synthesis/tabla-samples
 *
 * Metadata for CC0 tabla bol samples used as a Tier 3 upgrade
 * for the synthesised tabla in tala-engine.ts.
 *
 * When sample files are present in `frontend/public/audio/tabla/`,
 * TalaPlayer can use them instead of the additive synthesis fallback.
 * If any sample fails to load, the synthesised version plays instead.
 *
 * Licence: CC0 (public domain). See the README in the tabla sample
 * directory for sourcing instructions.
 *
 * The actual .ogg files are NOT checked into git.
 * Place them in `frontend/public/audio/tabla/` with the names below.
 */

/**
 * Map of bol name to relative path from the audio directory.
 * Each key is a tabla syllable, each value is the .ogg file name.
 */
export const TABLA_SAMPLE_MAP: Record<string, string> = {
  'dha':  'dha.ogg',
  'dhin': 'dhin.ogg',
  'na':   'na.ogg',
  'ta':   'ta.ogg',
  'tin':  'tin.ogg',
  'ge':   'ge.ogg',
  'ka':   'ka.ogg',
  'ti':   'ti.ogg',
};

/**
 * Attempts to load all tabla samples from the public audio directory.
 *
 * Returns a Map of lowercase bol name to AudioBuffer. Any sample that
 * fails to load (404, decode error, offline) is silently skipped.
 * The caller falls back to synthesised tabla for missing bols.
 *
 * @param ctx - AudioContext to use for decoding
 * @param basePath - URL prefix (e.g. '/sadhana/audio/tabla/')
 * @returns Map of bol name to decoded AudioBuffer
 */
export async function loadTablaSamples(
  ctx: AudioContext,
  basePath: string,
): Promise<Map<string, AudioBuffer>> {
  const samples = new Map<string, AudioBuffer>();

  const loadOne = async (bol: string, file: string): Promise<void> => {
    try {
      const response = await fetch(basePath + file);
      if (!response.ok) return;
      const arrayBuf = await response.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      samples.set(bol, audioBuf);
    } catch {
      // Skip — synthesised fallback will handle this bol
    }
  };

  // Load all in parallel
  await Promise.all(
    Object.entries(TABLA_SAMPLE_MAP).map(([bol, file]) => loadOne(bol, file)),
  );

  return samples;
}

/**
 * Plays a tabla sample with optional volume and timing.
 *
 * @param ctx - AudioContext
 * @param buffer - The decoded AudioBuffer for this bol
 * @param dest - Destination node (e.g. master gain)
 * @param volume - Playback volume (0 to 1)
 * @param time - AudioContext time to play at (default: now)
 */
export function playTablaSample(
  ctx: AudioContext,
  buffer: AudioBuffer,
  dest: AudioNode,
  volume: number,
  time?: number,
): void {
  const t = time ?? ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);

  source.connect(gain);
  gain.connect(dest);
  source.start(t);
}
