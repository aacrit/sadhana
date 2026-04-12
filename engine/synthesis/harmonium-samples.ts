/**
 * @module engine/synthesis/harmonium-samples
 *
 * Metadata for CC0 harmonium samples used in Tier 3 playback.
 *
 * Source: Freesound — cabled_mess harmonium pack (CC0, public domain)
 * Pack URL: https://freesound.org/people/cabled_mess/packs/29512/
 *
 * The actual .ogg files are NOT checked into git (too large).
 * Place them in `frontend/public/audio/harmonium/` following the naming
 * convention below. Tone.Sampler or raw AudioBufferSourceNode with
 * playbackRate correction interpolates between the 7 sample points.
 *
 * 7 samples spaced roughly by minor 3rds, covering C3 to C5.
 * Total size: ~210KB (7 x ~30KB each in OGG Vorbis).
 */

/**
 * Map of Western note name to relative path from the audio directory.
 * Each key is a note name, each value is the path to the .ogg sample file.
 */
export const HARMONIUM_SAMPLE_MAP: Record<string, string> = {
  'C3': 'harmonium-C3.ogg',
  'E3': 'harmonium-E3.ogg',
  'G3': 'harmonium-G3.ogg',
  'C4': 'harmonium-C4.ogg',
  'E4': 'harmonium-E4.ogg',
  'G4': 'harmonium-G4.ogg',
  'C5': 'harmonium-C5.ogg',
};

/**
 * Map of note name to MIDI number for sample lookup.
 * Used to find the nearest sample to a target pitch.
 */
export const NOTE_TO_MIDI: Record<string, number> = {
  'C3': 48,
  'E3': 52,
  'G3': 55,
  'C4': 60,
  'E4': 64,
  'G4': 67,
  'C5': 72,
};

/**
 * Map of MIDI number to 12-TET frequency in Hz.
 * Used for calculating playbackRate correction when playing samples.
 */
export const MIDI_TO_HZ: Record<number, number> = {
  48: 130.813, // C3
  52: 164.814, // E3
  55: 195.998, // G3
  60: 261.626, // C4
  64: 329.628, // E4
  67: 391.995, // G4
  72: 523.251, // C5
};

/**
 * Returns the MIDI number and 12-TET Hz for the closest available sample
 * to a given target frequency.
 *
 * @param targetHz - The desired playback frequency (just-intonation tuned)
 * @returns The nearest sample's MIDI number and its 12-TET frequency
 */
export function findNearestSample(targetHz: number): { midi: number; sampleHz: number } {
  const entries = Object.entries(MIDI_TO_HZ);
  let bestMidi = 60;
  let bestHz = 261.626;
  let bestDist = Infinity;

  for (const [midiStr, hz] of entries) {
    const dist = Math.abs(1200 * Math.log2(targetHz / hz));
    if (dist < bestDist) {
      bestDist = dist;
      bestMidi = Number(midiStr);
      bestHz = hz;
    }
  }

  return { midi: bestMidi, sampleHz: bestHz };
}
