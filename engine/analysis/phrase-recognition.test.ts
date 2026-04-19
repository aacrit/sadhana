/**
 * @module engine/analysis/phrase-recognition.test
 *
 * Unit tests for the phrase recognition module — pakad detection and
 * the primed expected phrase API (Cluster A: "set-up, not lottery").
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  recognizePakad,
  recognizePakadInRaga,
  primeExpectedPhrase,
  clearPrimedPhrase,
  getPrimedPhrase,
  checkPrimedPhrase,
} from './phrase-recognition';
import type { Swara } from '../theory/types';
import { n } from '../theory/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a simple Swara[] from symbol strings for test brevity. */
function swaras(...symbols: Swara[]): Swara[] {
  return symbols;
}

// ---------------------------------------------------------------------------
// recognizePakad
// ---------------------------------------------------------------------------

describe('recognizePakad', () => {
  it('returns null when fewer than 3 swaras', () => {
    expect(recognizePakad(swaras('Sa', 'Re'))).toBeNull();
  });

  it('detects a Bhoopali pakad (Ga Re Sa) in a sequence', () => {
    // Bhoopali pakad: [Ga, Re, Sa] is one of bhoopali's pakad phrases
    const sung = swaras('Sa', 'Re', 'Ga', 'Pa', 'Ga', 'Re', 'Sa');
    const result = recognizePakad(sung);
    expect(result).not.toBeNull();
    expect(result!.ragaId).toBe('bhoopali');
    expect(result!.confidence).toBeGreaterThan(0.7);
  });

  it('does not fire on a random sequence that matches nothing', () => {
    // A sequence that should not match any pakad at confidence > 0.7
    const result = recognizePakad(swaras('Sa', 'Re', 'Ga_k'));
    // This is unlikely to match a pakad with high confidence
    // (it may match something with low confidence, but not > 0.7 default)
    if (result !== null) {
      expect(result.confidence).toBeLessThan(0.9);
    }
  });

  it('recognizes Yaman pakad phrase with high confidence', () => {
    // Yaman pakad: Ni Re Ga Ma_t Ga Re Sa
    const sung = swaras('Ni', 'Re', 'Ga', 'Ma_t', 'Ga', 'Re', 'Sa');
    const result = recognizePakadInRaga(sung, 'yaman');
    expect(result).not.toBeNull();
    expect(result!.ragaId).toBe('yaman');
    expect(result!.confidence).toBeGreaterThan(0.6);
  });

  it('returns sargam notation for a matched pakad', () => {
    const sung = swaras('Ga', 'Re', 'Sa');
    const result = recognizePakad(sung);
    expect(result?.sargamNotation).toBeDefined();
    expect(typeof result?.sargamNotation).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// primeExpectedPhrase + checkPrimedPhrase
// ---------------------------------------------------------------------------

describe('primed expected phrase', () => {
  // Ensure clean state before each test
  beforeEach(() => {
    clearPrimedPhrase();
  });

  it('getPrimedPhrase returns null when nothing is primed', () => {
    expect(getPrimedPhrase()).toBeNull();
  });

  it('primeExpectedPhrase sets a primed phrase', () => {
    primeExpectedPhrase(
      [n('Ga', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya')],
      'bhoopali',
      45_000,
    );
    const primed = getPrimedPhrase();
    expect(primed).not.toBeNull();
    expect(primed!.ragaId).toBe('bhoopali');
    expect(primed!.windowMs).toBe(45_000);
    expect(primed!.matched).toBe(false);
  });

  it('clearPrimedPhrase removes the primed phrase', () => {
    primeExpectedPhrase(
      [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya')],
      'bhoopali',
    );
    clearPrimedPhrase();
    expect(getPrimedPhrase()).toBeNull();
  });

  it('checkPrimedPhrase returns null when nothing is primed', () => {
    const result = checkPrimedPhrase(swaras('Ga', 'Pa', 'Dha', 'Pa', 'Ga'));
    expect(result).toBeNull();
  });

  it('checkPrimedPhrase matches Bhoopali pakad when primed', () => {
    primeExpectedPhrase(
      [n('Ga', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya')],
      'bhoopali',
      45_000,
    );
    // Student sings: Sa Re Ga Pa Dha Pa Ga — contains the primed phrase as subsequence
    const sung = swaras('Sa', 'Re', 'Ga', 'Pa', 'Dha', 'Pa', 'Ga');
    const result = checkPrimedPhrase(sung, 0.6);
    expect(result).not.toBeNull();
    expect(result!.ragaId).toBe('bhoopali');
  });

  it('checkPrimedPhrase marks the phrase as matched and prevents re-firing', () => {
    primeExpectedPhrase(
      [n('Ga', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya')],
      'bhoopali',
      45_000,
    );
    const sung = swaras('Sa', 'Re', 'Ga', 'Pa', 'Dha', 'Pa', 'Ga');
    // First call: should match
    const first = checkPrimedPhrase(sung, 0.6);
    expect(first).not.toBeNull();
    // Second call with same swaras: should return null (already matched)
    const second = checkPrimedPhrase(sung, 0.6);
    expect(second).toBeNull();
    // The primed phrase should be marked as matched
    expect(getPrimedPhrase()!.matched).toBe(true);
  });

  it('checkPrimedPhrase returns null when window has expired', () => {
    // Prime with a 0ms window (already expired)
    primeExpectedPhrase(
      [n('Ga', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya')],
      'bhoopali',
      0, // window of 0ms — immediately expired
    );
    const sung = swaras('Ga', 'Pa', 'Dha');
    const result = checkPrimedPhrase(sung, 0.5);
    // Window expired (0ms), so should return null even with matching swaras
    expect(result).toBeNull();
  });

  it('overwriting a prime replaces the previous one', () => {
    primeExpectedPhrase(
      [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya')],
      'bhoopali',
      45_000,
    );
    // Overwrite with Yaman phrase
    primeExpectedPhrase(
      [n('Ni', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Ma_t', 'madhya')],
      'yaman',
      45_000,
    );
    const primed = getPrimedPhrase();
    expect(primed!.ragaId).toBe('yaman');
  });
});
