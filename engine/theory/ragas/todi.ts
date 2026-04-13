/**
 * @module engine/theory/ragas/todi
 *
 * Raga Todi (Miyan ki Todi) — the raga of morning contemplation,
 * of maximum chromaticism, of a beauty so intense it approaches austerity.
 *
 * Todi is the most chromatic raga in standard Hindustani practice. It uses
 * four altered swaras — Re_k, Ga_k, Ma_t, Dha_k — creating a scale of
 * extraordinary density and tension. Despite this chromaticism, Todi
 * maintains a quality of serene, almost austere beauty — the tension
 * is held in perfect balance, never collapsing into mere dissonance.
 *
 * The name "Miyan ki Todi" refers to Tansen (Miyan Tansen), who is
 * credited with developing this treatment of the ancient Todi family
 * of ragas.
 *
 * Thaat: Todi
 * Time: Morning, late morning (1st and 2nd prahar)
 * Rasa: Karuna (pathos), Adbhut (wonder)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Todi — complete musicological definition.
 *
 * Aroha: S r g M(t) P d N S'
 *   (Sampoorna — all seven swaras)
 *
 * Avaroha: S' N d P M(t) g r S
 *   (Sampoorna — all seven swaras)
 *
 * Vadi: Dha_k (the komal sixth — the raga's emotional apex)
 * Samvadi: Ga_k (consonant with Dha_k)
 *
 * Four altered swaras: Re_k, Ga_k, Ma_t, Dha_k.
 * Only Pa and Ni remain shuddha (besides Sa).
 * This is maximum chromaticism within the 7-swara system.
 */
export const todi: Raga = {
  id: 'todi',
  name: 'Todi',
  nameDevanagari: 'तोड़ी',
  thaat: 'todi',

  aroha: [
    n('Sa', 'madhya'),
    n('Re_k', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Ni', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Re_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'sampoorna',
    avaroha: 'sampoorna',
  },

  vadi: 'Dha_k',
  samvadi: 'Ga_k',
  anuvadi: ['Re_k', 'Ma_t', 'Pa', 'Ni'],
  varjit: ['Re', 'Ga', 'Ma', 'Dha', 'Ni_k'],

  pakad: [
    // Re(k) Ga(k) Re(k) Sa — the meditative lower register opening
    [n('Re_k', 'madhya'), n('Ga_k', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Dha(k) Ni Sa' Ni Dha(k) Pa — the upper phrase reaching taar Sa
    [n('Dha_k', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
    // Ga(k) Ma(t) Pa Dha(k) — the ascending chromatic passage
    [n('Ga_k', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya')],
    // Pa Ma(t) Ga(k) Re(k) Sa — the full chromatic descent
    [n('Pa', 'madhya'), n('Ma_t', 'madhya'), n('Ga_k', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Ma(t) Ga(k) Re(k) Ga(k) Ma(t) Pa — the winding ascent through the lower tetrachord
    [n('Ma_t', 'madhya'), n('Ga_k', 'madhya'), n('Re_k', 'madhya'), n('Ga_k', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya')],
  ],

  prahara: [1, 2],

  rasa: ['karuna', 'adbhut'],

  ornaments: ['meend', 'andolan', 'kan', 'gamak'],

  description:
    'Todi is the raga of morning chromaticism — the play of early light through half-open ' +
    'shutters, the world revealed in fragments, each detail intensified by the contrast of ' +
    'shadow. With four altered swaras — komal Re, komal Ga, tivra Ma, komal Dha — it is ' +
    'the most chromatic of the standard ragas, yet it never sounds dissonant. The density ' +
    'of half-steps and augmented intervals creates a tension that is held in perfect equipoise, ' +
    'producing a beauty that is almost painful in its intensity. Dha_k is the vadi — the ' +
    'emotional apex — and when a musician ascends to Dha_k and lingers there with andolan, ' +
    'the accumulated chromaticism of the passage below seems to converge on that single point. ' +
    'Todi demands technical precision: with so many altered swaras in close proximity, the ' +
    'slightest intonation error destroys the raga\'s delicate balance.',

  westernBridge:
    'Western listeners will find no diatonic equivalent — the combination of a minor second, ' +
    'minor third, augmented fourth, and minor sixth produces a scale structure not found in ' +
    'Western modal or tonal practice. The density of half-steps may recall certain synthetic ' +
    'scales or the chromaticism of late Romantic harmony.',

  relatedRagas: ['gurjari_todi', 'bilaskhani_todi', 'multani'],

  gharanaVariations:
    'Jaipur-Atrauli gharana is renowned for Todi, with precise articulation of the ' +
    'chromatic intervals and crisp ornamental vocabulary. Kirana gharana explores ' +
    'extended andolan on Dha_k and Ga_k with a more contemplative approach. ' +
    'Agra gharana emphasises the lower octave with powerful nom-tom alap. ' +
    'Kishori Amonkar\'s recordings of Todi are considered landmark interpretations.',
};
