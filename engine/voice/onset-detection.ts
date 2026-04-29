/**
 * @module engine/voice/onset-detection
 *
 * Pure-function onset detector for tala scoring.
 *
 * An "onset" is the perceived start of a sound event — the moment of attack.
 * For tala exercises we need to know *when* the student clapped or struck a
 * syllable, with enough resolution (~10ms) to score against beat times.
 *
 * Approach: spectral-flux onset detection over short-time energy frames.
 * For each frame we compute the half-wave-rectified change in magnitude
 * spectrum vs the previous frame; this rises sharply at percussive attacks
 * (claps, dha, ti) and stays low during sustained vowels. A peak-picking
 * pass with adaptive threshold + minimum-inter-onset-interval (50ms)
 * extracts onset timestamps.
 *
 * Inputs are arrays of numbers (Float32) so the caller controls the audio
 * source (offline analysis, AudioWorklet processor block, etc.). The
 * detector is stateless across calls — chunked streaming is supported by
 * passing the previous spectrum back in.
 *
 * No dependencies. Runs in any JS environment, including Node test runner.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface OnsetDetectorConfig {
  readonly sampleRate: number;
  /** FFT size — power of 2, typically 512 or 1024. */
  readonly fftSize?: number;
  /** Hop size in samples. Default = fftSize / 4 (75% overlap). */
  readonly hopSize?: number;
  /** Minimum spectral-flux value to trigger an onset (after normalisation). */
  readonly threshold?: number;
  /** Minimum inter-onset interval in ms. Filters double-strikes. */
  readonly minIntervalMs?: number;
  /** Pre-emphasis on high frequencies for percussive sources. */
  readonly highFreqEmphasis?: boolean;
}

export interface DetectedOnset {
  /** Time of the onset in seconds from the start of the input buffer. */
  readonly t: number;
  /** Strength (normalised spectral flux) — useful for filtering weak hits. */
  readonly strength: number;
}

export interface OnsetDetectionResult {
  readonly onsets: readonly DetectedOnset[];
  /** The flux signal itself, for debugging / visualization. Sampled at hopRate. */
  readonly flux: Float32Array;
  /** Hop rate in Hz (sampleRate / hopSize) — flux[n] corresponds to t = n / hopRate. */
  readonly hopRate: number;
}

// ---------------------------------------------------------------------------
// Tala scoring against detected onsets
// ---------------------------------------------------------------------------

export interface BeatHit {
  /** Beat index (1-based, sam = 1). */
  readonly beat: number;
  /** Expected onset time in seconds. */
  readonly expectedT: number;
  /** Closest detected onset's time, or null if none within tolerance. */
  readonly actualT: number | null;
  /** Signed timing error in ms (positive = late). */
  readonly errorMs: number | null;
  /** Whether the hit landed within tolerance. */
  readonly hit: boolean;
}

export interface TalaScoreResult {
  readonly hits: readonly BeatHit[];
  /** Mean absolute error across hits, in ms. */
  readonly meanAbsErrorMs: number;
  /** Fraction of beats hit within tolerance. */
  readonly accuracy: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FFT = 1024;
const DEFAULT_THRESHOLD = 0.18;
const DEFAULT_MIN_INTERVAL_MS = 50;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run onset detection over a mono PCM buffer. Returns detected onset
 * timestamps in seconds.
 */
export function detectOnsets(
  audio: Float32Array | readonly number[],
  config: OnsetDetectorConfig,
): OnsetDetectionResult {
  const sampleRate = config.sampleRate;
  const fftSize = config.fftSize ?? DEFAULT_FFT;
  const hopSize = config.hopSize ?? Math.floor(fftSize / 4);
  const threshold = config.threshold ?? DEFAULT_THRESHOLD;
  const minIntervalMs = config.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const highFreqEmphasis = config.highFreqEmphasis ?? true;

  if (audio.length < fftSize) {
    return { onsets: [], flux: new Float32Array(0), hopRate: sampleRate / hopSize };
  }

  const numFrames = Math.max(1, Math.floor((audio.length - fftSize) / hopSize) + 1);
  const flux = new Float32Array(numFrames);
  const window = hannWindow(fftSize);

  // Two rolling magnitude buffers
  let prevMag = new Float32Array(fftSize / 2);
  const curMag = new Float32Array(fftSize / 2);

  // FFT scratch buffers
  const real = new Float32Array(fftSize);
  const imag = new Float32Array(fftSize);

  for (let f = 0; f < numFrames; f++) {
    const start = f * hopSize;
    // Copy windowed frame into real, zero imag
    for (let i = 0; i < fftSize; i++) {
      real[i] = (audio[start + i] ?? 0) * (window[i] ?? 0);
      imag[i] = 0;
    }
    fftInPlace(real, imag);

    // Magnitude spectrum + spectral flux (positive differences only)
    let fluxValue = 0;
    for (let k = 0; k < fftSize / 2; k++) {
      const re = real[k] ?? 0;
      const im = imag[k] ?? 0;
      const mag = Math.sqrt(re * re + im * im);
      curMag[k] = mag;
      // High-freq emphasis: weight bin index linearly so percussive impulses dominate
      const w = highFreqEmphasis ? 1 + (k / (fftSize / 2)) : 1;
      const diff = (mag - (prevMag[k] ?? 0)) * w;
      if (diff > 0) fluxValue += diff;
    }
    flux[f] = fluxValue;
    // Swap prev/cur
    const tmp = prevMag;
    prevMag = new Float32Array(curMag);
    void tmp;
  }

  // Normalise flux by its 95th percentile so threshold is unit-free across signals
  const sortedFlux = Array.from(flux).sort((a, b) => a - b);
  const p95 = sortedFlux[Math.floor(sortedFlux.length * 0.95)] ?? 1;
  const norm = p95 > 0 ? p95 : 1;
  for (let i = 0; i < flux.length; i++) flux[i] = (flux[i] ?? 0) / norm;

  // Peak picking: local maxima above threshold, separated by minIntervalMs
  const hopRate = sampleRate / hopSize;
  const minIntervalFrames = Math.max(1, Math.floor((minIntervalMs / 1000) * hopRate));
  const onsets: DetectedOnset[] = [];
  let lastOnsetFrame = -minIntervalFrames * 2;

  for (let i = 1; i < numFrames - 1; i++) {
    const v = flux[i] ?? 0;
    const prev = flux[i - 1] ?? 0;
    const next = flux[i + 1] ?? 0;
    if (v < threshold) continue;
    if (v <= prev || v < next) continue; // strict local max (allow plateau on next side)
    if (i - lastOnsetFrame < minIntervalFrames) continue;
    onsets.push({ t: i / hopRate, strength: v });
    lastOnsetFrame = i;
  }

  return { onsets, flux, hopRate };
}

/**
 * Score detected onsets against expected beat times. For each beat,
 * find the closest detected onset within `toleranceMs`; record the
 * timing error and whether the hit counts.
 */
export function scoreTalaOnsets(
  onsets: readonly DetectedOnset[],
  expectedBeatTimes: readonly number[],
  toleranceMs: number,
): TalaScoreResult {
  const hits: BeatHit[] = [];
  let absErrorSum = 0;
  let hitCount = 0;
  const usedOnsets = new Set<number>();
  const tolS = toleranceMs / 1000;

  for (let i = 0; i < expectedBeatTimes.length; i++) {
    const expectedT = expectedBeatTimes[i] ?? 0;
    let bestIdx = -1;
    let bestDt = Infinity;
    for (let j = 0; j < onsets.length; j++) {
      if (usedOnsets.has(j)) continue;
      const o = onsets[j]!;
      const dt = Math.abs(o.t - expectedT);
      if (dt < bestDt) {
        bestDt = dt;
        bestIdx = j;
      }
    }

    let actualT: number | null = null;
    let errorMs: number | null = null;
    let hit = false;
    if (bestIdx >= 0 && bestDt <= tolS) {
      actualT = onsets[bestIdx]!.t;
      errorMs = (actualT - expectedT) * 1000;
      hit = true;
      hitCount++;
      absErrorSum += Math.abs(errorMs);
      usedOnsets.add(bestIdx);
    }

    hits.push({
      beat: i + 1,
      expectedT,
      actualT,
      errorMs,
      hit,
    });
  }

  return {
    hits,
    meanAbsErrorMs: hitCount > 0 ? absErrorSum / hitCount : 0,
    accuracy: expectedBeatTimes.length > 0 ? hitCount / expectedBeatTimes.length : 0,
  };
}

/**
 * Build the array of expected beat times for a given tala configuration.
 *
 * @param beats — number of beats in the cycle (e.g. 16 for teentaal).
 * @param tempoBpm — tempo in beats per minute.
 * @param cycles — number of complete cycles to generate beats for.
 * @param startT — time of beat 1 of the first cycle, in seconds. Default 0.
 * @returns array of beat times in seconds.
 */
export function buildBeatTimes(
  beats: number,
  tempoBpm: number,
  cycles: number,
  startT = 0,
): number[] {
  const beatS = 60 / tempoBpm;
  const total = beats * cycles;
  const out = new Array<number>(total);
  for (let i = 0; i < total; i++) out[i] = startT + i * beatS;
  return out;
}

// ---------------------------------------------------------------------------
// Internals — Hann window + radix-2 in-place Cooley-Tukey FFT
// ---------------------------------------------------------------------------

function hannWindow(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

/**
 * Cooley-Tukey radix-2 FFT, in-place. n must be a power of 2.
 * No DOM dependencies — runs in Node tests.
 */
function fftInPlace(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if ((n & (n - 1)) !== 0) {
    throw new Error('FFT length must be a power of 2');
  }

  // Bit reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      const tr = re[i]!; re[i] = re[j]!; re[j] = tr;
      const ti = im[i]!; im[i] = im[j]!; im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wlR = Math.cos(ang);
    const wlI = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wR = 1, wI = 0;
      for (let k = 0; k < len / 2; k++) {
        const aR = re[i + k]!;
        const aI = im[i + k]!;
        const bR = re[i + k + len / 2]!;
        const bI = im[i + k + len / 2]!;
        const tR = bR * wR - bI * wI;
        const tI = bR * wI + bI * wR;
        re[i + k] = aR + tR;
        im[i + k] = aI + tI;
        re[i + k + len / 2] = aR - tR;
        im[i + k + len / 2] = aI - tI;
        const newWR = wR * wlR - wI * wlI;
        wI = wR * wlI + wI * wlR;
        wR = newWR;
      }
    }
  }
}
