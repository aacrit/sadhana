/**
 * @module engine/theory/ragas/bhairav
 *
 * Raga Bhairav — the raga of dawn, named for Lord Shiva in his
 * fierce, meditative aspect.
 *
 * Bhairav is one of the six principal ragas of the ancient raga-ragini
 * classification system. Its two komal swaras — Re and Dha — placed
 * symmetrically around the scale, create a distinctive gravitational
 * pull that evokes the stillness and austerity of pre-dawn hours.
 *
 * The komal Re in Bhairav is sung with andolan (a gentle oscillation),
 * giving it a quality quite distinct from the komal Re in other ragas.
 * Similarly, komal Dha receives andolan, creating the raga's signature
 * sense of gravitas.
 *
 * Thaat: Bhairav
 * Time: Dawn, first prahar of the day
 * Rasa: Karuna (compassion/pathos), Shant (peace)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Bhairav — complete musicological definition.
 *
 * Aroha: S r G m P d N S'
 * Avaroha: S' N d P m G r S
 *
 * Vadi: Dha_k (the gravitational anchor of the raga)
 * Samvadi: Re_k (consonant with Dha_k — both komal, symmetric)
 *
 * Note on vadi: Some texts give Ma as vadi. The weight of the Kirana
 * and Gwalior traditions supports Dha_k as vadi, which aligns with the
 * raga's descending emphasis and the characteristic andolan on Dha_k.
 */
export const bhairav: Raga = {
  id: 'bhairav',
  name: 'Bhairav',
  nameDevanagari: 'भैरव',
  thaat: 'bhairav',

  aroha: [
    n('Sa', 'madhya'),
    n('Re_k', 'madhya'),
    n('Ga', 'madhya'),
    n('Ma', 'madhya'),
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
    n('Ma', 'madhya'),
    n('Ga', 'madhya'),
    n('Re_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'sampoorna',
    avaroha: 'sampoorna',
  },

  vadi: 'Dha_k',
  samvadi: 'Re_k',
  anuvadi: ['Ga', 'Ma', 'Pa', 'Ni'],
  varjit: ['Re', 'Dha', 'Ga_k', 'Ma_t', 'Ni_k'],

  pakad: [
    // Sa Re(k) Ga Re(k) Sa — the meditative opening, dwelling on komal Re
    [n('Sa', 'madhya'), n('Re_k', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Ga Ma Dha(k) Pa — ascending through the middle register
    [n('Ga', 'madhya'), n('Ma', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
    // Ma Ga Re(k) Sa — the characteristic descent
    [n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Dha(k) Ni Sa' Ni Dha(k) Pa — upper register phrase
    [n('Dha_k', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma Ga Re(k) Sa — full descent to Sa
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [1],

  rasa: ['karuna', 'shant'],

  ornaments: ['andolan', 'meend', 'kan', 'gamak'],

  description:
    'Bhairav is the raga of first light — not the cheerful brightness of morning, ' +
    'but the solemn, austere stillness just before sunrise, when the world is quiet ' +
    'and the air is heavy with dew. Named after Lord Shiva in his fierce meditative ' +
    'aspect, it carries both gravity and tenderness. The two komal swaras — Re and ' +
    'Dha — are placed symmetrically in the scale, and both are sung with andolan ' +
    '(a gentle, sustained oscillation), giving the raga its unmistakable quality of ' +
    'deep contemplation. The descent from Ga through komal Re to Sa is one of the ' +
    'most moving passages in Hindustani music — a slow letting go, a settling into ' +
    'stillness. Bhairav demands patience and control; it does not reward haste.',

  westernBridge:
    'Western listeners may hear echoes of the Phrygian mode (with its lowered second), ' +
    'but Bhairav\'s identity is shaped by the andolan on Re and Dha — microtonal ' +
    'oscillations that have no Western equivalent — and its association with dawn.',

  ornamentMap: {
    'Re_k': ['andolan'],         // Re komal receives andolan — the defining ornament of Bhairav
    'Dha_k': ['andolan'],        // Dha komal also receives andolan (mirror of Re_k)
    'Ga': ['kan'],               // Ga gets kan from Re_k
    'Ni': ['meend'],             // Ni gets meend sliding to/from Sa
  },

  relatedRagas: ['ahir_bhairav', 'nat_bhairav', 'jogiya', 'kalingda', 'bhairavi'],

  gharanaVariations:
    'Kirana gharana is renowned for Bhairav — Pt. Bhimsen Joshi and Gangubai Hangal ' +
    'developed extensive slow alap traditions. The andolan on Re_k and Dha_k is more ' +
    'pronounced in Kirana. Agra gharana emphasises powerful nom-tom alap in the lower ' +
    'octave. Jaipur-Atrauli treats the raga with more rhythmic energy in drut compositions. ' +
    'Some musicians of the Gwalior tradition give more weight to Ma as a quasi-vadi.',
};
