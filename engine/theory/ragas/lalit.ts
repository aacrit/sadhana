/**
 * @module engine/theory/ragas/lalit
 *
 * Raga Lalit — the raga of pre-dawn, of the world poised between deep
 * night and the first intimation of light, of an exquisite tension
 * created by the coexistence of both Ma and Ma_t.
 *
 * Lalit is one of the most distinctive and challenging ragas in the
 * Hindustani system. Its most radical feature is the simultaneous use
 * of both shuddha Ma and tivra Ma — a duality that creates an intense
 * chromatic cluster in the middle of the scale. Combined with the
 * complete absence of Pa, Lalit produces a melodic world of extraordinary
 * density and beauty.
 *
 * The raga is associated with the pre-dawn hours, and its character
 * perfectly captures that liminal moment: neither night nor day, held
 * in suspension.
 *
 * Thaat: Marwa (variant — uses both Ma forms, Re_k)
 * Time: Pre-dawn (8th prahar)
 * Rasa: Karuna (pathos), Adbhut (wonder)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Lalit — complete musicological definition.
 *
 * Aroha: N r G m M(t) D N S'
 *   (Pa omitted. Both Ma and Ma_t present.)
 *
 * Avaroha: S' N D M(t) m G m G r S
 *   (Pa omitted. Vakra turn on G-m-G in descent.)
 *
 * Vadi: Ma/Ma_t (both forms are emphasised — unique among ragas)
 * Samvadi: Re_k
 *
 * CRITICAL: Pa is varjit (forbidden). Both forms of Ma coexist —
 * this is Lalit's most distinctive and challenging feature.
 */
export const lalit: Raga = {
  id: 'lalit',
  name: 'Lalit',
  nameDevanagari: 'ललित',
  thaat: 'marwa',

  aroha: [
    n('Ni', 'mandra'),
    n('Re_k', 'madhya'),
    n('Ga', 'madhya'),
    n('Ma', 'madhya'),
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
    n('Ma', 'madhya'),
    n('Ga', 'madhya'),
    n('Ma', 'madhya'),
    n('Ga', 'madhya'),
    n('Re_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'sampoorna',
    avaroha: 'sampoorna',
  },

  vadi: 'Ma',
  samvadi: 'Re_k',
  anuvadi: ['Ga', 'Ma_t', 'Dha', 'Ni'],
  varjit: ['Re', 'Ga_k', 'Pa', 'Dha_k', 'Ni_k'],

  pakad: [
    // Ga Ma Ma(t) Dha — the chromatic ascent through both Mas
    [n('Ga', 'madhya'), n('Ma', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya')],
    // Ma(t) Ma Ga Ma Ga Re(k) Sa — the winding descent
    [n('Ma_t', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Ni Re(k) Ga Ma — the opening from mandra Ni
    [n('Ni', 'mandra'), n('Re_k', 'madhya'), n('Ga', 'madhya'), n('Ma', 'madhya')],
    // Dha Ni Sa' Ni Dha Ma(t) Ma Ga — the upper register descent
    [n('Dha', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Ma_t', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya')],
  ],

  prahara: [8],

  rasa: ['karuna', 'adbhut'],

  ornaments: ['meend', 'andolan', 'kan', 'gamak'],

  description:
    'Lalit is the raga of the pre-dawn hour — the deepest darkness just before the first ' +
    'grey light, when the world is suspended between states. Its most extraordinary feature ' +
    'is the coexistence of both shuddha Ma and tivra Ma, creating a chromatic density in ' +
    'the heart of the scale that is unique among standard ragas. The phrase Ga-Ma-Ma(t)-Dha ' +
    'compresses three swaras into a single chromatic gesture, leaping over the absent Pa to ' +
    'reach Dha with a quality of urgent revelation. The vakra descent through Ma-Ga-Ma-Ga ' +
    'refuses to resolve linearly, circling the fourth with an intensity that captures the ' +
    'restless anticipation of approaching dawn. Lalit demands exceptional intonation — the ' +
    'two Ma forms must remain distinct yet connected, a challenge that tests even accomplished ' +
    'musicians.',

  westernBridge:
    'Western listeners will find no modal equivalent — the coexistence of both natural and ' +
    'augmented fourths within a single scale, combined with the absent fifth, lies entirely ' +
    'outside Western tonal and modal frameworks.',

  relatedRagas: ['marwa', 'puriya', 'lalita_gauri'],

  gharanaVariations:
    'Jaipur-Atrauli gharana is celebrated for Lalit, with meticulous distinction between ' +
    'the two Ma forms and precise vakra movements. Kirana gharana explores the raga with ' +
    'extended meend between Ma and Ma(t), creating a haunting ambiguity. Agra gharana ' +
    'emphasises the pre-dawn gravity of the lower register. Pt. Kumar Gandharva\'s ' +
    'innovative treatment of Lalit remains a landmark interpretation.',
};
