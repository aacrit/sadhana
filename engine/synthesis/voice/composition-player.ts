/**
 * @module engine/synthesis/voice/composition-player
 *
 * TantriVoice(TM) — Composition playback engine.
 *
 * Takes a Composition score and renders it in real time using:
 *   - VocalSynth for voice
 *   - TalaPlayer for rhythmic accompaniment
 *   - Optional tanpura drone
 *
 * Provides play/pause/stop/seek controls and progress callbacks
 * for synchronized lyric display and Tantri visualization.
 */

import type { Composition, PlaybackProgress, ProgressCallback, BeatNote } from './composition';
import { resolveCompositionEvents, estimateCompositionDuration } from './composition';
import type { VocalSynth } from './index';
import { createVocalSynth, ensureVocalAudioReady } from './index';
import type { VocalNoteEvent } from './raga-voice';
import { getFormantSetForSwara, getFormantSet, getSwaraVowel } from './formants';
import type { VoiceType, Vowel } from './formants';
import { getVoicePreset } from './voice-presets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompositionPlayerOptions {
  /** Progress callback — called on each note change */
  readonly onProgress?: ProgressCallback;
  /** Called when playback completes */
  readonly onComplete?: () => void;
  /** Called on error */
  readonly onError?: (error: Error) => void;
  /** Volume override (0-1) */
  readonly volume?: number;
}

export interface CompositionPlayer {
  /** Start playback from the beginning */
  play(): Promise<void>;
  /** Pause playback (can be resumed) */
  pause(): void;
  /** Resume from pause */
  resume(): Promise<void>;
  /** Stop playback entirely */
  stop(): void;
  /** Whether currently playing */
  readonly isPlaying: boolean;
  /** Whether paused */
  readonly isPaused: boolean;
  /** Current playback progress */
  readonly progress: PlaybackProgress | null;
  /** Clean up all resources */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a CompositionPlayer for rendering a full musical composition.
 *
 * Usage:
 *   const player = await createCompositionPlayer(myBandish, {
 *     onProgress: (p) => updateLyricDisplay(p),
 *     onComplete: () => showEndScreen(),
 *   });
 *   await player.play();
 *   // later:
 *   player.stop();
 *   player.dispose();
 */
export async function createCompositionPlayer(
  composition: Composition,
  options: CompositionPlayerOptions = {},
): Promise<CompositionPlayer> {
  await ensureVocalAudioReady();

  const synth = await createVocalSynth(composition.voiceType);
  const volume = options.volume ?? composition.volume ?? 0.5;
  synth.setVolume(volume);

  let playing = false;
  let paused = false;
  let disposed = false;
  let abortController: AbortController | null = null;
  let currentProgress: PlaybackProgress | null = null;

  const totalDuration = estimateCompositionDuration(composition);

  // Build a flat list of note events with section/line/note indices
  // for progress tracking
  interface IndexedNote {
    sectionIndex: number;
    sectionType: string;
    sectionLabel: string;
    lineIndex: number;
    noteIndex: number;
    note: BeatNote;
    lyric?: string;
    lyricDevanagari?: string;
    tempo: number;
  }

  const indexedNotes: IndexedNote[] = [];
  const baseTempo = composition.tempo;

  for (let si = 0; si < composition.sections.length; si++) {
    const section = composition.sections[si]!;
    const repeatCount = section.repeat ?? 1;
    const sectionTempo = section.tempo ?? baseTempo;

    for (let rep = 0; rep < repeatCount; rep++) {
      for (let li = 0; li < section.lines.length; li++) {
        const line = section.lines[li]!;
        for (let ni = 0; ni < line.notes.length; ni++) {
          indexedNotes.push({
            sectionIndex: si,
            sectionType: section.type,
            sectionLabel: section.label,
            lineIndex: li,
            noteIndex: ni,
            note: line.notes[ni]!,
            lyric: line.lyric,
            lyricDevanagari: line.lyricDevanagari,
            tempo: sectionTempo,
          });
        }
      }
    }
  }

  async function playSequence(startIndex: number = 0): Promise<void> {
    abortController = new AbortController();
    const signal = abortController.signal;
    let elapsed = 0;

    // Calculate elapsed time for notes before startIndex
    for (let i = 0; i < startIndex; i++) {
      const indexed = indexedNotes[i]!;
      elapsed += indexed.note.beats * (60 / indexed.tempo);
    }

    for (let i = startIndex; i < indexedNotes.length; i++) {
      if (signal.aborted || disposed) break;

      // Wait while paused
      while (paused && !signal.aborted && !disposed) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (signal.aborted || disposed) break;

      const indexed = indexedNotes[i]!;
      const beatDuration = 60 / indexed.tempo;
      const noteDuration = indexed.note.beats * beatDuration;

      // Report progress
      currentProgress = {
        sectionIndex: indexed.sectionIndex,
        sectionType: indexed.sectionType as PlaybackProgress['sectionType'],
        sectionLabel: indexed.sectionLabel,
        lineIndex: indexed.lineIndex,
        noteIndex: indexed.noteIndex,
        currentSyllable: indexed.note.syllable,
        currentLyric: indexed.lyric,
        elapsedSeconds: elapsed,
        totalSeconds: totalDuration,
        complete: false,
      };

      options.onProgress?.(currentProgress);

      // Play the note (skip rests)
      if (!indexed.note.rest) {
        try {
          await synth.playSwaraNote(
            { swara: indexed.note.swara, octave: indexed.note.octave },
            composition.saHz,
            {
              duration: noteDuration,
              volume,
              ragaId: composition.raga.id,
              ornament: indexed.note.ornament,
            },
          );
        } catch {
          // Note playback failed — continue with next note
        }
      } else {
        // Rest: just wait
        await new Promise(resolve => setTimeout(resolve, noteDuration * 1000));
      }

      elapsed += noteDuration;
    }

    if (!signal.aborted && !disposed) {
      // Playback complete
      currentProgress = {
        sectionIndex: composition.sections.length - 1,
        sectionType: composition.sections[composition.sections.length - 1]?.type ?? 'outro',
        sectionLabel: 'Complete',
        lineIndex: 0,
        noteIndex: 0,
        elapsedSeconds: totalDuration,
        totalSeconds: totalDuration,
        complete: true,
      };
      options.onProgress?.(currentProgress);
      options.onComplete?.();
    }

    playing = false;
  }

  const player: CompositionPlayer = {
    async play() {
      if (disposed) return;
      if (playing) this.stop();

      playing = true;
      paused = false;

      try {
        await playSequence(0);
      } catch (err) {
        options.onError?.(err instanceof Error ? err : new Error(String(err)));
        playing = false;
      }
    },

    pause() {
      if (!playing || paused) return;
      paused = true;
      synth.stop();
    },

    async resume() {
      if (!playing || !paused) return;
      paused = false;
    },

    stop() {
      playing = false;
      paused = false;
      synth.stop();
      abortController?.abort();
      abortController = null;
    },

    get isPlaying() { return playing && !paused; },
    get isPaused() { return paused; },
    get progress() { return currentProgress; },

    dispose() {
      disposed = true;
      this.stop();
      synth.dispose();
    },
  };

  return player;
}
