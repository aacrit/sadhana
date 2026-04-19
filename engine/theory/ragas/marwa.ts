/**
 * @module engine/theory/ragas/marwa
 *
 * Raga Marwa — the raga of sunset, of the last light dissolving into
 * darkness, of an unresolved tension that never fully settles.
 *
 * Marwa is one of the most distinctive ragas in Hindustani music.
 * It omits Pa entirely — one of the two achala (immovable) swaras —
 * creating a scale with no perfect fifth, a harmonic void that gives
 * the raga its extraordinary quality of restless, unresolved tension.
 *
 * The komal Re is the vadi, and the tivra Ma the gateway between
 * the lower and upper tetrachords. The absence of Pa means that the
 * ear has no resting place between Ma and Dha; the raga leaps across
 * this gap with a quality of urgent seeking.
 *
 * Marwa never truly resolves. Even the final Sa feels temporary —
 * the pull of Re komal draws the melody back, endlessly.
 *
 * Thaat: Marwa
 * Time: Sunset, dusk (4th prahar)
 * Rasa: Karuna (pathos), Veer (austere courage)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Marwa — complete musicological definition.
 *
 * Aroha: N r G M(t) D N S'
 *   (Pa omitted entirely. Ni of mandra octave begins the ascent.)
 *
 * Avaroha: S' N D M(t) G r S
 *   (Pa omitted entirely.)
 *
 * Vadi: Re_k (komal Re — the gravitational centre)
 * Samvadi: Dha (shuddha Dha — consonant with Re_k)
 *
 * CRITICAL: Pa is varjit (forbidden). The absence of the perfect fifth
 * is the defining structural feature of Marwa.
 */
export const marwa: Raga = {
  id: 'marwa',
  name: 'Marwa',
  nameDevanagari: 'मारवा',
  thaat: 'marwa',

  aroha: [
    n('Ni', 'mandra'),
    n('Re_k', 'madhya'),
    n('Ga', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Dha', 'madhya'),
    n('Ni', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni', 'madhya'),
    n('Dha', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Ga', 'madhya'),
    n('Re_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'shadava',
    avaroha: 'shadava',
  },

  vadi: 'Re_k',
  samvadi: 'Dha',
  anuvadi: ['Ga', 'Ma_t', 'Ni'],
  varjit: ['Re', 'Ga_k', 'Ma', 'Pa', 'Dha_k', 'Ni_k'],

  pakad: [
    // Ni Re(k) Ga Re(k) Sa — the meditative opening, circling komal Re
    [n('Ni', 'mandra'), n('Re_k', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Re(k) Ga Ma(t) Dha Ni — ascending leap across the absent Pa
    [n('Re_k', 'madhya'), n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya')],
    // Dha Ma(t) Ga Re(k) Sa — descent from Dha, bypassing Pa
    [n('Dha', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Dha Ni Sa' Ni Dha Ma(t) — upper register phrase
    [n('Dha', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Ma_t', 'madhya')],
    // Ga Ma(t) Dha Ni Dha Ma(t) Ga Re(k) Sa — extended descent
    [n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [4],

  rasa: ['karuna', 'veer'],

  ornaments: ['meend', 'andolan', 'kan', 'gamak'],

  description:
    'Marwa is the raga of the dying sun — the last horizontal light painting the sky in ' +
    'copper and violet, the moment when day has ended but night has not yet claimed its ' +
    'territory. Its most radical structural feature is the complete absence of Pa — the ' +
    'perfect fifth, one of the two immovable anchors of the scale, is simply not there. ' +
    'This creates a harmonic void that the ear cannot fill, giving every phrase a quality ' +
    'of unresolved seeking. Komal Re is the vadi — the most gravitationally important swara — ' +
    'and the raga circles it with an intensity that feels almost obsessive. The leap from ' +
    'Ma(t) to Dha, bypassing the absent Pa, is one of the most dramatic intervals in ' +
    'Hindustani music: a sudden widening of the melodic space that mirrors the vastness of ' +
    'a sunset sky. Marwa is a heavy, serious raga that demands maturity and patience.',

  westernBridge:
    'Western listeners will find no direct modal equivalent — the combination of a lowered ' +
    'second, raised fourth, and missing fifth creates a scale structure unknown in Western ' +
    'tonal practice. The closest distant relative might be certain modes of Messiaen or ' +
    'Bartok, but Marwa\'s identity is entirely its own.',

  relatedRagas: ['sohini', 'puriya', 'puriya_dhanashri'],

  gharanaVariations:
    'Jaipur-Atrauli gharana is renowned for Marwa — the austere, deliberate alap style ' +
    'of this tradition suits the raga\'s character perfectly. Kirana gharana emphasises ' +
    'extended andolan on Re(k), creating a haunting, almost vocal-cord-trembling effect. ' +
    'Agra gharana explores the lower octave with powerful nom-tom alap. The Gwalior ' +
    'tradition tends to present Marwa with more rhythmic structure in bandish compositions.',

  // Ma tuning: Marwa omits Pa, so the tanpura uses Ma as the ground string
  // rather than Pa. This is standard practice for Pa-varjit ragas.
  tanpuraTuning: 'Ma',
};
