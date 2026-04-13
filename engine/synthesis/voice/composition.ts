/**
 * @module engine/synthesis/voice/composition
 *
 * TantriVoice(TM) — Composition & song rendering engine.
 *
 * This module takes structured musical compositions — bandish, bhajan,
 * film songs, Western musicals — and renders them with TantriVoice
 * vocal synthesis synchronized to tala (rhythm cycle).
 *
 * Architecture:
 *   Composition (declarative score)
 *     → CompositionRenderer (scheduling + playback)
 *       → VocalSynth (per-note voice synthesis)
 *       → TalaPlayer (rhythmic accompaniment)
 *       → Tanpura drone (harmonic reference)
 *
 * A Composition is a language-agnostic score format:
 *   - Sections (sthayi, antara, mukhda, verse, chorus...)
 *   - Each section contains Lines
 *   - Each Line contains BeatNotes aligned to tala beats
 *   - Lyrics (any script) map syllable-per-beat
 *
 * Supports:
 *   - Hindustani bandish (sthayi/antara in tala cycle)
 *   - Bhajan/devotional (verse/refrain, simpler rhythmic structure)
 *   - Film songs (verse/chorus/bridge with layered arrangement)
 *   - Western musical numbers (verse/chorus/bridge, any language)
 *
 * $0 cost. Browser-native. No samples. No APIs.
 */

import type { Swara, SwaraNote, Raga, Ornament } from '../../theory/types';
import type { VoiceType, Vowel } from './formants';
import type { VocalNoteEvent } from './raga-voice';

// ---------------------------------------------------------------------------
// Types: Composition score format
// ---------------------------------------------------------------------------

/**
 * A single beat-aligned note in a composition.
 * One or more BeatNotes fill each beat of a tala cycle.
 */
export interface BeatNote {
  /** The swara to sing */
  readonly swara: Swara;
  /** Octave register */
  readonly octave: 'mandra' | 'madhya' | 'taar';
  /** Duration as a fraction of a beat (1 = full beat, 0.5 = half, 2 = two beats) */
  readonly beats: number;
  /** Lyric syllable for this note (any script) */
  readonly syllable?: string;
  /** Ornament to apply */
  readonly ornament?: Ornament;
  /** Rest (silence) instead of a sung note */
  readonly rest?: boolean;
}

/**
 * A line of music — typically one avartan (cycle) of the tala.
 */
export interface CompositionLine {
  /** Sequence of beat-aligned notes */
  readonly notes: readonly BeatNote[];
  /** Full lyric text for this line (for display) */
  readonly lyric?: string;
  /** Lyric in Devanagari (for display when script toggle is on) */
  readonly lyricDevanagari?: string;
}

/**
 * A section of a composition (sthayi, antara, verse, chorus, etc.).
 */
export interface CompositionSection {
  /** Section type */
  readonly type:
    | 'sthayi'    // Main theme (bandish)
    | 'antara'    // Second part, upper register (bandish)
    | 'mukhda'    // Opening phrase/refrain (bandish)
    | 'sanchari'  // Development section (bandish)
    | 'abhog'     // Concluding section (bandish)
    | 'verse'     // Verse (song/musical)
    | 'chorus'    // Chorus/refrain (song/musical)
    | 'bridge'    // Bridge section (song/musical)
    | 'intro'     // Instrumental/vocal intro
    | 'outro'     // Ending section
    | 'interlude'; // Between sections

  /** Human-readable label (e.g., "Sthayi", "Verse 1", "Chorus") */
  readonly label: string;

  /** Lines of music in this section */
  readonly lines: readonly CompositionLine[];

  /** How many times to repeat this section (default: 1) */
  readonly repeat?: number;

  /** Tempo override for this section (BPM). Inherits from composition if not set. */
  readonly tempo?: number;

  /** Ornament level override for this section */
  readonly ornamentLevel?: 'none' | 'subtle' | 'natural' | 'elaborate';
}

/**
 * A complete musical composition — the declarative score format.
 */
export interface Composition {
  /** Title of the composition */
  readonly title: string;
  /** Title in Devanagari */
  readonly titleDevanagari?: string;
  /** Composer/lyricist */
  readonly composer?: string;
  /** Raga */
  readonly raga: Raga;
  /** Tala ID (teentaal, ektaal, etc.) */
  readonly talaId: string;
  /** Base tempo in BPM */
  readonly tempo: number;
  /** Voice type for rendering */
  readonly voiceType: VoiceType;
  /** Sa reference frequency */
  readonly saHz: number;
  /** Ordered sections */
  readonly sections: readonly CompositionSection[];
  /** Language of lyrics (for formant mapping) */
  readonly language: 'hindi' | 'sanskrit' | 'marathi' | 'bengali' | 'urdu' | 'english' | 'other';
  /** Whether to play tanpura drone */
  readonly withTanpura?: boolean;
  /** Whether to play tala accompaniment */
  readonly withTala?: boolean;
  /** Master volume (0-1) */
  readonly volume?: number;
}

// ---------------------------------------------------------------------------
// Types: Playback state
// ---------------------------------------------------------------------------

/** Playback progress reported to the UI */
export interface PlaybackProgress {
  /** Current section index */
  readonly sectionIndex: number;
  /** Current section type */
  readonly sectionType: CompositionSection['type'];
  /** Current section label */
  readonly sectionLabel: string;
  /** Current line index within section */
  readonly lineIndex: number;
  /** Current note index within line */
  readonly noteIndex: number;
  /** Current lyric syllable being sung */
  readonly currentSyllable?: string;
  /** Current lyric line */
  readonly currentLyric?: string;
  /** Elapsed time in seconds */
  readonly elapsedSeconds: number;
  /** Total estimated duration in seconds */
  readonly totalSeconds: number;
  /** Whether playback is complete */
  readonly complete: boolean;
}

/** Callback for playback progress updates */
export type ProgressCallback = (progress: PlaybackProgress) => void;

// ---------------------------------------------------------------------------
// Resolve BeatNotes to VocalNoteEvents
// ---------------------------------------------------------------------------

/**
 * Convert a composition's BeatNotes into timed VocalNoteEvents.
 * Resolves frequencies using raga intonation, applies ornaments,
 * handles rests, and calculates timing from tempo.
 */
export function resolveCompositionEvents(
  composition: Composition,
): { events: VocalNoteEvent[]; totalDuration: number; sectionBoundaries: number[] } {
  const { raga, saHz, tempo: baseTempo } = composition;
  const events: VocalNoteEvent[] = [];
  const sectionBoundaries: number[] = [];
  let totalDuration = 0;

  // Import dynamically to avoid circular deps at module level
  const { getRagaSwaraNotHz } = require('./raga-voice') as typeof import('./raga-voice');
  const { getVocalOrnamentForSwara, getAndolanSpec, getKanSpec } = require('./ornament-voice') as typeof import('./ornament-voice');

  for (const section of composition.sections) {
    const repeatCount = section.repeat ?? 1;
    const sectionTempo = section.tempo ?? baseTempo;
    const beatDuration = 60 / sectionTempo;

    for (let rep = 0; rep < repeatCount; rep++) {
      sectionBoundaries.push(totalDuration);

      for (const line of section.lines) {
        for (const note of line.notes) {
          const duration = note.beats * beatDuration;

          if (note.rest) {
            // Rest: silent event (we still need to advance time)
            events.push({
              swara: 'Sa',
              hz: 0,
              duration,
              volumeMultiplier: 0,
              ornament: null,
              legatoToNext: false,
            });
            totalDuration += duration;
            continue;
          }

          const swaraNote: SwaraNote = { swara: note.swara, octave: note.octave };
          const hz = getRagaSwaraNotHz(swaraNote, saHz, raga.id);
          const isVadi = note.swara === raga.vadi;
          const isSamvadi = note.swara === raga.samvadi;

          // Volume emphasis
          let volumeMultiplier = 1.0;
          if (isVadi) volumeMultiplier = 1.15;
          else if (isSamvadi) volumeMultiplier = 1.08;

          // Determine ornament (explicit or raga-derived)
          const ornament = note.ornament ?? getVocalOrnamentForSwara(
            note.swara, raga,
            { preceding: undefined, following: undefined, isVadi, isAscending: true },
            section.ornamentLevel ?? 'natural',
          );

          // Resolve ornament parameters
          let kanHz: number | undefined;
          let andolanRate: number | undefined;
          let andolanAmplitude: number | undefined;

          if (ornament === 'kan') {
            const kanSpec = getKanSpec(raga.id, note.swara);
            if (kanSpec) {
              const kanSwaraNote: SwaraNote = { swara: kanSpec.source, octave: note.octave };
              kanHz = getRagaSwaraNotHz(kanSwaraNote, saHz, raga.id);
            }
          }

          if (ornament === 'andolan') {
            const spec = getAndolanSpec(raga.id, note.swara);
            andolanRate = spec?.rateHz ?? 2.5;
            andolanAmplitude = spec?.amplitudeCents ?? 15;
          }

          events.push({
            swara: note.swara,
            hz,
            duration,
            volumeMultiplier,
            ornament,
            kanHz,
            andolanRate,
            andolanAmplitude,
            legatoToNext: true,
          });

          totalDuration += duration;
        }
      }
    }
  }

  return { events, totalDuration, sectionBoundaries };
}

// ---------------------------------------------------------------------------
// Composition duration estimation
// ---------------------------------------------------------------------------

/**
 * Estimate the total duration of a composition in seconds.
 */
export function estimateCompositionDuration(composition: Composition): number {
  let total = 0;
  const baseTempo = composition.tempo;

  for (const section of composition.sections) {
    const repeatCount = section.repeat ?? 1;
    const sectionTempo = section.tempo ?? baseTempo;
    const beatDuration = 60 / sectionTempo;

    for (let rep = 0; rep < repeatCount; rep++) {
      for (const line of section.lines) {
        for (const note of line.notes) {
          total += note.beats * beatDuration;
        }
      }
    }
  }

  return total;
}

// ---------------------------------------------------------------------------
// Built-in compositions: Bandish templates
// ---------------------------------------------------------------------------

/**
 * Helper: create a BeatNote from shorthand.
 */
export function n(
  swara: Swara,
  beats: number = 1,
  octave: 'mandra' | 'madhya' | 'taar' = 'madhya',
  syllable?: string,
  ornament?: Ornament,
): BeatNote {
  return { swara, octave, beats, syllable, ornament };
}

/**
 * Helper: create a rest BeatNote.
 */
export function rest(beats: number = 1): BeatNote {
  return { swara: 'Sa', octave: 'madhya', beats, rest: true };
}

// ---------------------------------------------------------------------------
// Example compositions (built-in library)
// ---------------------------------------------------------------------------

/**
 * Creates a simple bandish structure from aroha/avaroha with lyrics.
 * This is a template — real bandish would be hand-composed with
 * proper melodic development.
 */
export function createArohaAvarohaBandish(
  raga: Raga,
  saHz: number,
  talaId: string = 'teentaal',
  tempo: number = 60,
  voiceType: VoiceType = 'tenor',
): Composition {
  // Sthayi: aroha spread across tala beats
  const sthayi: CompositionLine = {
    notes: raga.aroha.map((note) =>
      n(note.swara, 1, note.octave),
    ),
  };

  // Antara: avaroha
  const antara: CompositionLine = {
    notes: raga.avaroha.map((note) =>
      n(note.swara, 1, note.octave),
    ),
  };

  return {
    title: `${raga.name} Aroha-Avaroha`,
    titleDevanagari: `${raga.nameDevanagari} आरोह-अवरोह`,
    raga,
    talaId,
    tempo,
    voiceType,
    saHz,
    language: 'hindi',
    withTanpura: true,
    withTala: true,
    volume: 0.5,
    sections: [
      {
        type: 'sthayi',
        label: 'Aroha',
        lines: [sthayi],
        repeat: 1,
        ornamentLevel: 'natural',
      },
      {
        type: 'antara',
        label: 'Avaroha',
        lines: [antara],
        repeat: 1,
        ornamentLevel: 'natural',
      },
    ],
  };
}

/**
 * Creates a pakad-based bandish that develops the raga's characteristic phrase.
 */
export function createPakadBandish(
  raga: Raga,
  saHz: number,
  talaId: string = 'teentaal',
  tempo: number = 50,
  voiceType: VoiceType = 'tenor',
): Composition {
  const sections: CompositionSection[] = [];

  // Mukhda: opening phrase (Sa leading into pakad)
  const mukhda: CompositionLine = {
    notes: [
      n('Sa', 2, 'madhya'),
      ...(raga.pakad[0] ?? []).map((note) =>
        n(note.swara, 1.5, note.octave),
      ),
      n('Sa', 2, 'madhya'),
    ],
  };

  sections.push({
    type: 'mukhda',
    label: 'Mukhda',
    lines: [mukhda],
    repeat: 1,
    ornamentLevel: 'natural',
    tempo: tempo * 0.8, // Slower for mukhda
  });

  // Sthayi: aroha with emphasis on vadi
  const sthayi: CompositionLine = {
    notes: raga.aroha.map((note) =>
      n(note.swara, note.swara === raga.vadi ? 2 : 1, note.octave),
    ),
  };

  sections.push({
    type: 'sthayi',
    label: 'Sthayi',
    lines: [sthayi],
    repeat: 2,
    ornamentLevel: 'natural',
  });

  // Antara: avaroha with emphasis on samvadi
  const antara: CompositionLine = {
    notes: raga.avaroha.map((note) =>
      n(note.swara, note.swara === raga.samvadi ? 2 : 1, note.octave),
    ),
  };

  sections.push({
    type: 'antara',
    label: 'Antara',
    lines: [antara],
    repeat: 1,
    ornamentLevel: 'elaborate',
  });

  // Return to mukhda
  sections.push({
    type: 'mukhda',
    label: 'Mukhda (reprise)',
    lines: [mukhda],
    repeat: 1,
    ornamentLevel: 'natural',
    tempo: tempo * 0.7,
  });

  return {
    title: `${raga.name} Bandish`,
    titleDevanagari: `${raga.nameDevanagari} बंदिश`,
    raga,
    talaId,
    tempo,
    voiceType,
    saHz,
    language: 'hindi',
    withTanpura: true,
    withTala: true,
    volume: 0.5,
    sections,
  };
}

/**
 * Creates a song composition from lyrics and note mapping.
 *
 * This is the universal format — works for any language, any genre:
 * Bollywood, devotional, Western musical, folk.
 *
 * @param title - Song title
 * @param raga - Raga (use a matching raga or create a custom scale)
 * @param verses - Array of { lyric, notes } for each verse/section
 * @param options - Tala, tempo, voice, language settings
 */
export function createSongComposition(
  title: string,
  raga: Raga,
  verses: readonly {
    readonly type: CompositionSection['type'];
    readonly label: string;
    readonly lyric: string;
    readonly lyricDevanagari?: string;
    readonly notes: readonly BeatNote[];
    readonly repeat?: number;
    readonly tempo?: number;
  }[],
  options: {
    readonly talaId?: string;
    readonly tempo?: number;
    readonly voiceType?: VoiceType;
    readonly saHz?: number;
    readonly language?: Composition['language'];
    readonly withTanpura?: boolean;
    readonly withTala?: boolean;
  } = {},
): Composition {
  const sections: CompositionSection[] = verses.map((v) => ({
    type: v.type,
    label: v.label,
    lines: [{
      notes: v.notes,
      lyric: v.lyric,
      lyricDevanagari: v.lyricDevanagari,
    }],
    repeat: v.repeat,
    tempo: v.tempo,
    ornamentLevel: 'subtle' as const,
  }));

  return {
    title,
    raga,
    talaId: options.talaId ?? 'teentaal',
    tempo: options.tempo ?? 80,
    voiceType: options.voiceType ?? 'tenor',
    saHz: options.saHz ?? 261.63,
    language: options.language ?? 'hindi',
    withTanpura: options.withTanpura ?? true,
    withTala: options.withTala ?? true,
    volume: 0.5,
    sections,
  };
}
