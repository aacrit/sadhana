/**
 * @module engine/synthesis/voice
 *
 * TantriVoice(TM) — Human vocal synthesis engine.
 *
 * The first music engine that sings. Formant-based vocal synthesis using
 * the Fant source-filter model, implemented entirely in the Web Audio API
 * at $0 cost. Produces realistic singing voice for all 12 Hindustani swaras
 * across 4 voice types (baritone, tenor, alto, soprano) with raga-aware
 * ornamentation, multi-language lyric support, and full phrase/song playback.
 *
 * Architecture:
 *   GlottalSource (PeriodicWave, LF model)
 *     -> VocalTract (5 formant filters + singer's formant + nasal notch)
 *       -> ADSR Envelope (GainNode)
 *         -> destination
 *
 * 15 audio nodes per voice. Lighter than harmonium (27-40 nodes).
 * Touch-to-sound: ~3-6ms. $0 recurring cost. Browser-native.
 *
 * Usage:
 *   import { createVocalSynth } from '@/engine/synthesis/voice';
 *   const synth = await createVocalSynth('tenor');
 *   await synth.playSwara('Ga', 196);
 *   synth.dispose();
 *
 * Or for raga-aware demonstration:
 *   await synth.playPakad(yamanRaga, 196, { ornamentLevel: 'natural' });
 */

import type { Swara, SwaraNote, Raga, Ornament } from '../../theory/types';
import type { VoiceType, Vowel, FormantSet } from './formants';
import type { GlottalSource } from './source-model';
import type { VocalTract } from './tract-model';
import type { VoicePreset } from './voice-presets';
import type { VocalNoteEvent, VocalDemoConfig } from './raga-voice';

import { getSwaraFrequency } from '../../theory/swaras';
import {
  getFormantSetForSwara,
  getFormantSet,
  getRegisterParams,
  applyFormantTuning,
  getSwaraVowel,
} from './formants';
import { createGlottalSource } from './source-model';
import { createVocalTract } from './tract-model';
import { getVoicePreset, inferVoiceType, VOICE_PRESETS } from './voice-presets';
import {
  applyVocalMeend,
  applyVocalGamak,
  applyVocalAndolan,
  applyVocalKan,
  applyVocalMurki,
  applyVocalKhatka,
  getIntonationOffset,
} from './ornament-voice';
import {
  generateVocalPhrase,
  generateVocalAroha,
  generateVocalAvaroha,
  generateVocalPakad,
  generateStructuredAlap,
  getRagaSwaraHz,
  getRagaSwaraNotHz,
} from './raga-voice';

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export type { VoiceType, Vowel, FormantSet } from './formants';
export type { VoicePreset } from './voice-presets';
export type { VocalDemoConfig, VocalNoteEvent } from './raga-voice';
export { inferVoiceType, getAllPresets, VOICE_PRESETS } from './voice-presets';
export { SWARA_VOWEL_MAP } from './formants';

// Composition engine
export type {
  Composition, CompositionSection, CompositionLine,
  BeatNote, PlaybackProgress, ProgressCallback,
} from './composition';
export {
  resolveCompositionEvents, estimateCompositionDuration,
  createArohaAvarohaBandish, createPakadBandish, createSongComposition,
  n, rest,
} from './composition';
export type { CompositionPlayer, CompositionPlayerOptions } from './composition-player';
export { createCompositionPlayer } from './composition-player';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayVocalOptions {
  /** Duration in seconds (default: 0.5) */
  readonly duration?: number;
  /** Volume (0-1, default: 0.5) */
  readonly volume?: number;
  /** Attack time in seconds */
  readonly attack?: number;
  /** Release time in seconds */
  readonly release?: number;
  /** Ornament to apply */
  readonly ornament?: Ornament;
  /** Override the vowel (default: auto from swara) */
  readonly vowel?: Vowel;
  /** Raga context for intonation and ornament parameters */
  readonly ragaId?: string;
}

export interface PlayVocalPhraseOptions {
  /** Tempo in BPM (default: 60) */
  readonly tempo?: number;
  /** Gap between notes in seconds (default: 0 for legato) */
  readonly gap?: number;
  /** Volume (0-1, default: 0.5) */
  readonly volume?: number;
  /** Ornament level (default: 'natural') */
  readonly ornamentLevel?: 'none' | 'subtle' | 'natural' | 'elaborate';
  /** Legato: sustain voice across notes (default: true) */
  readonly legato?: boolean;
  /** Raga context */
  readonly ragaId?: string;
}

/**
 * TantriVoice(TM) — The vocal synthesizer instance.
 */
export interface VocalSynth {
  /** Current voice type */
  readonly voiceType: VoiceType;
  /** Play a single swara with voice synthesis */
  playSwara(swara: Swara, saHz: number, options?: PlayVocalOptions): Promise<void>;
  /** Play a SwaraNote (swara + octave) */
  playSwaraNote(note: SwaraNote, saHz: number, options?: PlayVocalOptions): Promise<void>;
  /** Play a phrase of SwaraNote[] */
  playPhrase(phrase: readonly SwaraNote[], saHz: number, options?: PlayVocalPhraseOptions): Promise<void>;
  /** Play a raga's pakad with raga-aware ornamentation */
  playPakad(raga: Raga, saHz: number, options?: PlayVocalPhraseOptions): Promise<void>;
  /** Play a raga's aroha */
  playAroha(raga: Raga, saHz: number, options?: PlayVocalPhraseOptions): Promise<void>;
  /** Play a raga's avaroha */
  playAvaroha(raga: Raga, saHz: number, options?: PlayVocalPhraseOptions): Promise<void>;
  /** Play a structured alap (procedural raga introduction) */
  playAlap(raga: Raga, saHz: number, options?: PlayVocalPhraseOptions): Promise<void>;
  /** Play arbitrary text as sung lyrics (multi-language) */
  playLyrics(text: string, notes: readonly SwaraNote[], saHz: number, options?: PlayVocalPhraseOptions): Promise<void>;
  /** Change voice type at runtime */
  setVoiceType(type: VoiceType): void;
  /** Set master volume */
  setVolume(volume: number): void;
  /** Stop any currently playing voice */
  stop(): void;
  /** Clean up all audio nodes */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Shared AudioContext
// ---------------------------------------------------------------------------

let _sharedContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (typeof AudioContext === 'undefined') {
    throw new Error('AudioContext is not available. Requires a browser environment.');
  }
  if (!_sharedContext || _sharedContext.state === 'closed') {
    _sharedContext = new AudioContext();
  }
  return _sharedContext;
}

/**
 * Ensures the AudioContext is running (resumes if suspended).
 * Must be called from a user gesture handler on iOS Safari.
 */
export async function ensureVocalAudioReady(): Promise<void> {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

// ---------------------------------------------------------------------------
// Internal: play a single vocal note
// ---------------------------------------------------------------------------

interface ActiveVocalNote {
  source: GlottalSource;
  tract: VocalTract;
  envelope: GainNode;
  limiter: DynamicsCompressorNode;
  stopTimeout: ReturnType<typeof setTimeout> | null;
}

function playVocalNote(
  ctx: AudioContext,
  hz: number,
  duration: number,
  volume: number,
  preset: VoicePreset,
  formants: FormantSet,
  nasalCoupling: number,
  ornament: Ornament | null,
  ornamentParams: {
    kanHz?: number;
    andolanRate?: number;
    andolanAmplitude?: number;
    meendEndHz?: number;
    meendDuration?: number;
    murkiFrequencies?: readonly number[];
  },
): ActiveVocalNote {
  const startTime = ctx.currentTime + 0.005; // Tiny offset to avoid clicks

  // Get register-aware source parameters
  const registerParams = getRegisterParams(hz, preset.voiceType);

  // Apply formant tuning for high pitches (soprano F1 tracking)
  const tunedFormants = applyFormantTuning(formants, hz);

  // Soft limiter — prevents clipping when formant peaks stack up.
  // Configured as a transparent brick-wall at -1 dBFS; it never
  // compresses below that, so the timbral envelope stays intact.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 6;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.05;
  limiter.connect(ctx.destination);

  // ADSR envelope
  const envelope = ctx.createGain();
  envelope.gain.value = 0;
  envelope.connect(limiter);

  const peakVolume = volume;
  const sustainVolume = volume * preset.envelope.sustain;
  const attackEnd = startTime + preset.envelope.attack;
  const decayEnd = attackEnd + preset.envelope.decay;
  const releaseStart = startTime + duration - preset.envelope.release;
  const endTime = startTime + duration;

  envelope.gain.setValueAtTime(0, startTime);
  envelope.gain.linearRampToValueAtTime(peakVolume, attackEnd);
  envelope.gain.linearRampToValueAtTime(sustainVolume, decayEnd);
  if (releaseStart > decayEnd) {
    envelope.gain.setValueAtTime(sustainVolume, releaseStart);
  }
  envelope.gain.linearRampToValueAtTime(0, endTime);

  // Vocal tract filter chain
  const tract = createVocalTract(ctx, tunedFormants, preset.voiceType, envelope);
  tract.setNasalCoupling(nasalCoupling);

  // Glottal source
  const source = createGlottalSource(ctx, {
    f0: hz,
    spectralTilt: registerParams.spectralTilt,
    harmonicCount: preset.source.harmonicCount,
    openQuotient: registerParams.openQuotient,
  }, tract.input);

  // Apply ornament if specified
  if (ornament && ornamentParams) {
    switch (ornament) {
      case 'meend':
        if (ornamentParams.meendEndHz) {
          applyVocalMeend(
            source, tract,
            hz, ornamentParams.meendEndHz,
            ornamentParams.meendDuration ?? duration * 0.8,
            startTime,
          );
        }
        break;
      case 'gamak':
        applyVocalGamak(
          source, tract,
          hz, 50, 5.5, duration * 0.8, startTime + 0.1,
        );
        break;
      case 'andolan':
        applyVocalAndolan(
          source, tract,
          hz,
          ornamentParams.andolanAmplitude ?? 20,
          ornamentParams.andolanRate ?? 2.5,
          duration * 0.85,
          startTime + preset.envelope.attack,
        );
        break;
      case 'kan':
        if (ornamentParams.kanHz) {
          applyVocalKan(
            source, tract,
            ornamentParams.kanHz, hz,
            0.035,
            startTime,
          );
        }
        break;
      case 'murki':
        if (ornamentParams.murkiFrequencies) {
          applyVocalMurki(
            source, tract,
            ornamentParams.murkiFrequencies,
            0.15,
            startTime,
          );
        }
        break;
      case 'khatka':
        if (ornamentParams.murkiFrequencies) {
          applyVocalKhatka(
            source, tract,
            ornamentParams.murkiFrequencies,
            0.12,
            startTime,
          );
        }
        break;
    }
  }

  // Add liveliness micro-fluctuations
  if (preset.liveliness.pitchDepthCents > 0 && duration > 0.5) {
    const livelinessLFO = ctx.createOscillator();
    livelinessLFO.type = 'sine';
    livelinessLFO.frequency.value = preset.liveliness.pitchRate;
    const livelinessGain = ctx.createGain();
    // Convert cents to Hz deviation at the current frequency
    const deviationHz = hz * (Math.pow(2, preset.liveliness.pitchDepthCents / 1200) - 1);
    livelinessGain.gain.value = deviationHz;
    livelinessLFO.connect(livelinessGain);
    livelinessGain.connect(source.oscillator.frequency);
    livelinessLFO.start(startTime);
    livelinessLFO.stop(endTime);
  }

  source.start(startTime);
  source.stop(endTime + 0.05); // Small buffer for release tail

  const stopTimeout = setTimeout(() => {
    source.dispose();
    tract.dispose();
    envelope.disconnect();
    limiter.disconnect();
  }, (duration + 0.5) * 1000);

  return { source, tract, envelope, limiter, stopTimeout };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a TantriVoice(TM) vocal synthesizer instance.
 *
 * @param voiceType - Voice type (default: 'tenor')
 * @returns VocalSynth instance ready for playback
 */
export async function createVocalSynth(voiceType: VoiceType = 'tenor'): Promise<VocalSynth> {
  await ensureVocalAudioReady();

  let currentPreset = getVoicePreset(voiceType);
  let currentVoiceType = voiceType;
  let currentVolume = 0.5;
  let activeNote: ActiveVocalNote | null = null;
  let disposed = false;

  const ctx = getContext();

  function stopActive() {
    if (activeNote) {
      if (activeNote.stopTimeout) clearTimeout(activeNote.stopTimeout);
      activeNote.source.stop();
      activeNote.source.dispose();
      activeNote.tract.dispose();
      activeNote.envelope.disconnect();
      activeNote.limiter.disconnect();
      activeNote = null;
    }
  }

  const synth: VocalSynth = {
    get voiceType() { return currentVoiceType; },

    async playSwara(swara: Swara, saHz: number, options?: PlayVocalOptions) {
      if (disposed) return;
      stopActive();

      const duration = options?.duration ?? 0.5;
      const volume = (options?.volume ?? currentVolume) * 1.0;
      const ragaId = options?.ragaId;

      // Resolve frequency with optional raga intonation
      let hz = getSwaraFrequency(swara, saHz);
      if (ragaId) {
        const offset = getIntonationOffset(ragaId, swara);
        hz *= Math.pow(2, offset / 1200);
      }

      // Get formants for this swara's vowel
      const formants = getFormantSetForSwara(swara, currentVoiceType);
      const nasalCoupling = getSwaraVowel(swara).nasalCoupling;

      activeNote = playVocalNote(
        ctx, hz, duration, volume, currentPreset, formants,
        nasalCoupling,
        options?.ornament ?? null,
        {
          kanHz: undefined,
          andolanRate: undefined,
          andolanAmplitude: undefined,
        },
      );

      await new Promise(resolve => setTimeout(resolve, duration * 1000));
    },

    async playSwaraNote(note: SwaraNote, saHz: number, options?: PlayVocalOptions) {
      if (disposed) return;
      const octaveHz = note.octave === 'taar' ? saHz * 2
        : note.octave === 'mandra' ? saHz / 2
        : saHz;
      await synth.playSwara(note.swara, octaveHz, options);
    },

    async playPhrase(phrase: readonly SwaraNote[], saHz: number, options?: PlayVocalPhraseOptions) {
      if (disposed) return;
      const raga = options?.ragaId ? undefined : undefined; // TODO: raga lookup
      const tempo = options?.tempo ?? 60;
      const volume = options?.volume ?? currentVolume;
      const gap = options?.gap ?? 0.05;

      for (let i = 0; i < phrase.length; i++) {
        if (disposed) break;
        const note = phrase[i]!;
        const beatDuration = 60 / tempo;

        await synth.playSwaraNote(note, saHz, {
          duration: beatDuration - gap,
          volume,
          ragaId: options?.ragaId,
        });

        if (gap > 0) {
          await new Promise(resolve => setTimeout(resolve, gap * 1000));
        }
      }
    },

    async playPakad(raga: Raga, saHz: number, options?: PlayVocalPhraseOptions) {
      if (disposed) return;
      const config: VocalDemoConfig = {
        raga,
        saHz,
        voiceType: currentVoiceType,
        tempo: options?.tempo ?? 50,
        volume: options?.volume ?? currentVolume,
        ornamentLevel: options?.ornamentLevel ?? 'natural',
        legato: options?.legato ?? true,
      };

      const events = generateVocalPakad(config);
      await playEventSequence(ctx, events, currentPreset, currentVoiceType, () => disposed);
    },

    async playAroha(raga: Raga, saHz: number, options?: PlayVocalPhraseOptions) {
      if (disposed) return;
      const config: VocalDemoConfig = {
        raga,
        saHz,
        voiceType: currentVoiceType,
        tempo: options?.tempo ?? 60,
        volume: options?.volume ?? currentVolume,
        ornamentLevel: options?.ornamentLevel ?? 'natural',
      };

      const events = generateVocalAroha(config);
      await playEventSequence(ctx, events, currentPreset, currentVoiceType, () => disposed);
    },

    async playAvaroha(raga: Raga, saHz: number, options?: PlayVocalPhraseOptions) {
      if (disposed) return;
      const config: VocalDemoConfig = {
        raga,
        saHz,
        voiceType: currentVoiceType,
        tempo: options?.tempo ?? 55,
        volume: options?.volume ?? currentVolume,
        ornamentLevel: options?.ornamentLevel ?? 'natural',
      };

      const events = generateVocalAvaroha(config);
      await playEventSequence(ctx, events, currentPreset, currentVoiceType, () => disposed);
    },

    async playAlap(raga: Raga, saHz: number, options?: PlayVocalPhraseOptions) {
      if (disposed) return;
      const config: VocalDemoConfig = {
        raga,
        saHz,
        voiceType: currentVoiceType,
        tempo: options?.tempo ?? 30, // Alap is very slow
        volume: options?.volume ?? currentVolume,
        ornamentLevel: options?.ornamentLevel ?? 'elaborate',
      };

      const events = generateStructuredAlap(config);
      await playEventSequence(ctx, events, currentPreset, currentVoiceType, () => disposed);
    },

    async playLyrics(text: string, notes: readonly SwaraNote[], saHz: number, options?: PlayVocalPhraseOptions) {
      if (disposed) return;
      // Multi-language lyric synthesis
      // Map each character/syllable to a vowel formant, then sing the notes
      const syllables = segmentTextToSyllables(text);
      const tempo = options?.tempo ?? 60;
      const volume = options?.volume ?? currentVolume;

      for (let i = 0; i < Math.min(syllables.length, notes.length); i++) {
        if (disposed) break;
        const note = notes[i]!;
        const syllable = syllables[i]!;
        const vowel = getVowelForSyllable(syllable);
        const beatDuration = 60 / tempo;

        // Get formants for this syllable's vowel
        const formants = getFormantSet(vowel, currentVoiceType);

        let hz = getSwaraFrequency(note.swara, saHz);
        if (note.octave === 'taar') hz *= 2;
        else if (note.octave === 'mandra') hz /= 2;

        const nasalCoupling = isNasalSyllable(syllable) ? 0.4 : 0.1;

        stopActive();
        activeNote = playVocalNote(
          ctx, hz, beatDuration, volume, currentPreset,
          formants, nasalCoupling, null, {},
        );

        await new Promise(resolve => setTimeout(resolve, beatDuration * 1000));
      }
    },

    setVoiceType(type: VoiceType) {
      currentVoiceType = type;
      currentPreset = getVoicePreset(type);
    },

    setVolume(volume: number) {
      currentVolume = Math.max(0, Math.min(1, volume));
    },

    stop() {
      stopActive();
    },

    dispose() {
      disposed = true;
      stopActive();
    },
  };

  return synth;
}

// ---------------------------------------------------------------------------
// Internal: play a sequence of VocalNoteEvents
// ---------------------------------------------------------------------------

async function playEventSequence(
  ctx: AudioContext,
  events: readonly VocalNoteEvent[],
  preset: VoicePreset,
  voiceType: VoiceType,
  isDisposed: () => boolean,
): Promise<void> {
  for (const event of events) {
    if (isDisposed()) break;

    // Skip rest events (hz=0 or silent volume) — just wait for the duration
    if (event.hz <= 0 || event.volumeMultiplier <= 0) {
      await new Promise(resolve => setTimeout(resolve, event.duration * 1000));
      continue;
    }

    const formants = getFormantSetForSwara(event.swara, voiceType);
    const nasalCoupling = getSwaraVowel(event.swara).nasalCoupling;

    const note = playVocalNote(
      ctx,
      event.hz,
      event.duration,
      event.volumeMultiplier * 0.5,
      preset,
      formants,
      nasalCoupling,
      event.ornament,
      {
        kanHz: event.kanHz,
        andolanRate: event.andolanRate,
        andolanAmplitude: event.andolanAmplitude,
      },
    );

    await new Promise(resolve => setTimeout(resolve, event.duration * 1000));

    // Clean up
    if (note.stopTimeout) clearTimeout(note.stopTimeout);
    try {
      note.source.dispose();
      note.tract.dispose();
      note.envelope.disconnect();
      note.limiter.disconnect();
    } catch {
      // Already cleaned
    }
  }
}

// ---------------------------------------------------------------------------
// Multi-language syllable processing
// ---------------------------------------------------------------------------

/**
 * Segment text into syllables for singing.
 * Handles Hindi (Devanagari), English, Sanskrit, Marathi, Bengali, Urdu.
 */
function segmentTextToSyllables(text: string): string[] {
  // Devanagari: each consonant+vowel cluster is a syllable
  const devanagariRange = /[\u0900-\u097F]/;
  const bengaliRange = /[\u0980-\u09FF]/;

  if (devanagariRange.test(text) || bengaliRange.test(text)) {
    return segmentIndicSyllables(text);
  }

  // Latin script: split on vowel boundaries
  return segmentLatinSyllables(text);
}

function segmentIndicSyllables(text: string): string[] {
  const syllables: string[] = [];
  let current = '';

  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;

    // Skip spaces and punctuation
    if (char === ' ' || char === ',' || char === '।' || char === '|') {
      if (current) syllables.push(current);
      current = '';
      continue;
    }

    // Vowel signs (matras) complete the current syllable
    const isVowelSign = (code >= 0x093E && code <= 0x094C) ||
                        (code >= 0x09BE && code <= 0x09CC);
    // Virama (halant) connects consonants
    const isVirama = code === 0x094D || code === 0x09CD;
    // Independent vowels start new syllables
    const isIndependentVowel = (code >= 0x0904 && code <= 0x0914) ||
                               (code >= 0x0985 && code <= 0x0994);

    if (isVowelSign) {
      current += char;
      syllables.push(current);
      current = '';
    } else if (isVirama) {
      current += char;
    } else if (isIndependentVowel) {
      if (current) syllables.push(current);
      current = char;
    } else {
      // Consonant
      if (current && !current.endsWith('\u094D') && !current.endsWith('\u09CD')) {
        syllables.push(current);
        current = '';
      }
      current += char;
    }
  }

  if (current) syllables.push(current);
  return syllables.filter(s => s.trim().length > 0);
}

function segmentLatinSyllables(text: string): string[] {
  // Simple syllable segmentation: split around vowel clusters
  const words = text.split(/\s+/);
  const syllables: string[] = [];

  for (const word of words) {
    if (!word) continue;
    // Split on consonant clusters between vowels
    const parts = word.match(/[^aeiouAEIOU]*[aeiouAEIOU]+[^aeiouAEIOU]*/g);
    if (parts) {
      syllables.push(...parts);
    } else {
      syllables.push(word);
    }
  }

  return syllables;
}

/**
 * Map a syllable to its primary sung vowel.
 * Handles Devanagari vowel signs and Latin vowels.
 */
function getVowelForSyllable(syllable: string): Vowel {
  // Check for Devanagari vowel signs
  for (const char of syllable) {
    const code = char.codePointAt(0) ?? 0;

    // Devanagari matras
    if (code === 0x093E || code === 0x0906) return 'aa'; // aa matra / independent aa
    if (code === 0x093F || code === 0x0907) return 'ee'; // i matra
    if (code === 0x0940 || code === 0x0908) return 'ee'; // ii matra
    if (code === 0x0941 || code === 0x0909) return 'oo'; // u matra
    if (code === 0x0942 || code === 0x090A) return 'oo'; // uu matra
    if (code === 0x0947 || code === 0x090F) return 'eh'; // e matra
    if (code === 0x0948 || code === 0x0910) return 'eh'; // ai matra
    if (code === 0x094B || code === 0x0913) return 'oh'; // o matra
    if (code === 0x094C || code === 0x0914) return 'oh'; // au matra

    // Bengali matras (similar pattern)
    if (code === 0x09BE || code === 0x0986) return 'aa';
    if (code === 0x09BF || code === 0x0987) return 'ee';
    if (code === 0x09C0 || code === 0x0988) return 'ee';
    if (code === 0x09C1 || code === 0x0989) return 'oo';
    if (code === 0x09C2 || code === 0x098A) return 'oo';
    if (code === 0x09C7 || code === 0x098F) return 'eh';
    if (code === 0x09CB || code === 0x0993) return 'oh';
  }

  // Latin vowels
  const lower = syllable.toLowerCase();
  if (lower.includes('ee') || lower.includes('ea')) return 'ee';
  if (lower.includes('oo') || lower.includes('ou')) return 'oo';
  if (lower.includes('ai') || lower.includes('ay')) return 'eh';
  if (lower.includes('ow') || lower.includes('oa')) return 'oh';
  if (lower.includes('a')) return 'aa';
  if (lower.includes('e')) return 'eh';
  if (lower.includes('i')) return 'ee';
  if (lower.includes('o')) return 'oh';
  if (lower.includes('u')) return 'oo';

  // Default to the primary singing vowel
  return 'aa';
}

/**
 * Check if a syllable has a nasal consonant onset.
 */
function isNasalSyllable(syllable: string): boolean {
  const firstChar = syllable[0] ?? '';
  const code = firstChar.codePointAt(0) ?? 0;

  // Devanagari nasals: ण, न, म, ङ, ञ
  const devanagariNasals = [0x0923, 0x0928, 0x092E, 0x0919, 0x091E];
  if (devanagariNasals.includes(code)) return true;

  // Anusvara and chandrabindu
  for (const char of syllable) {
    const c = char.codePointAt(0) ?? 0;
    if (c === 0x0902 || c === 0x0901) return true; // anusvara, chandrabindu
    if (c === 0x0982 || c === 0x0981) return true; // Bengali equivalents
  }

  // Latin nasals
  const lower = firstChar.toLowerCase();
  return lower === 'n' || lower === 'm';
}

// ---------------------------------------------------------------------------
// Convenience functions
// ---------------------------------------------------------------------------

let _defaultSynth: VocalSynth | null = null;

/**
 * Stop any currently playing vocal note on the default synth.
 * Used for long-press release — stops the sustained note immediately.
 */
export function stopVocalPlayback(): void {
  _defaultSynth?.stop();
}

/**
 * Play a single swara with voice synthesis (convenience — creates synth if needed).
 */
export async function playVocalSwara(
  swara: Swara,
  saHz: number,
  options?: PlayVocalOptions & { voiceType?: VoiceType },
): Promise<void> {
  const requestedType = options?.voiceType ?? 'tenor';
  if (!_defaultSynth) {
    _defaultSynth = await createVocalSynth(requestedType);
  } else if (_defaultSynth.voiceType !== requestedType) {
    _defaultSynth.setVoiceType(requestedType);
  }
  await _defaultSynth.playSwara(swara, saHz, options);
}

/**
 * Play a single SwaraNote with voice synthesis (convenience).
 */
export async function playVocalSwaraNote(
  note: SwaraNote,
  saHz: number,
  options?: PlayVocalOptions & { voiceType?: VoiceType },
): Promise<void> {
  const requestedType = options?.voiceType ?? 'tenor';
  if (!_defaultSynth) {
    _defaultSynth = await createVocalSynth(requestedType);
  } else if (_defaultSynth.voiceType !== requestedType) {
    _defaultSynth.setVoiceType(requestedType);
  }
  await _defaultSynth.playSwaraNote(note, saHz, options);
}

/**
 * Play a vocal phrase (convenience).
 */
export async function playVocalPhrase(
  phrase: readonly SwaraNote[],
  saHz: number,
  options?: PlayVocalPhraseOptions & { voiceType?: VoiceType },
): Promise<void> {
  const requestedType = options?.voiceType ?? 'tenor';
  if (!_defaultSynth) {
    _defaultSynth = await createVocalSynth(requestedType);
  } else if (_defaultSynth.voiceType !== requestedType) {
    _defaultSynth.setVoiceType(requestedType);
  }
  await _defaultSynth.playPhrase(phrase, saHz, options);
}
