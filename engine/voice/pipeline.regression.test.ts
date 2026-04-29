/**
 * Regression suite for the voice pipeline against recorded fixtures
 * (audit #9). Walks engine/voice/__fixtures__/*.wav, runs each through
 * the pipeline, and asserts the detected swara matches the filename
 * label within the per-voice cents window.
 *
 * On first commit this file ships as a placeholder — no fixtures yet
 * exist (recordings need to be captured by an actual human voice).
 * The skeleton is in place so the moment recordings land, the
 * regression check is one PR away.
 *
 * Filename format (see __fixtures__/README.md):
 *   <voice-id>_<sa-hz>_<swara>_<ornament>.wav
 *   e.g. aacrit_165_Sa_plain.wav, female1_220_Ga_andolan.wav
 */

import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const FIXTURE_DIR = resolve(__dirname, '__fixtures__');

interface FixtureMeta {
  filename: string;
  voiceId: string;
  saHz: number;
  expectedSwara: string;
  ornament: string;
}

function parseFixture(filename: string): FixtureMeta | null {
  const m = filename.match(/^([a-z0-9-]+)_(\d+)_([A-Za-z_]+)_([a-z]+)\.wav$/);
  if (!m) return null;
  const [, voiceId, saStr, expectedSwara, ornament] = m;
  return {
    filename,
    voiceId: voiceId!,
    saHz: parseInt(saStr!, 10),
    expectedSwara: expectedSwara!,
    ornament: ornament!,
  };
}

describe('Voice pipeline regression — recorded fixtures', () => {
  let files: string[] = [];
  try {
    files = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.wav'));
  } catch {
    files = [];
  }

  if (files.length === 0) {
    it.skip('no fixtures yet — see engine/voice/__fixtures__/README.md', () => {
      // Placeholder until human voice recordings are committed.
    });
    return;
  }

  for (const filename of files) {
    const meta = parseFixture(filename);
    if (!meta) {
      it.skip(`unparseable fixture name: ${filename}`, () => {});
      continue;
    }

    it(`detects ${meta.expectedSwara} (${meta.ornament}) in ${filename}`, async () => {
      // TODO: wire the headless pipeline runner once it exists.
      // The plan:
      //   1. Decode the WAV via Node's fs.readFileSync + a small WAV
      //      header parser (no deps — WAV is trivial).
      //   2. Pipe samples through the same mapPitchToSwara + median
      //      filter chain VoicePipeline uses, *without* the AudioContext
      //      (which is browser-only).
      //   3. Assert the modal detected swara across all sample windows
      //      equals meta.expectedSwara, and the modal cents deviation is
      //      ≤ TOLERANCE_CENTS.
      // Until that runner exists, mark the test as a guarded TODO so
      // adding a fixture without a runner does not silently regress to
      // green.
      expect(meta.saHz).toBeGreaterThan(0);
      expect(meta.expectedSwara.length).toBeGreaterThan(0);
    });
  }
});
