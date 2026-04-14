/**
 * @module engine/theory/ragas/bhoopali
 *
 * Raga Bhoopali (also: Bhoop, Bhopali) — the pentatonic evening raga.
 *
 * Bhoopali is a raga of extraordinary clarity. With only five swaras —
 * Sa, Re, Ga, Pa, Dha — and no komal or tivra alterations, it is the
 * most accessible raga in the Hindustani system. Yet its simplicity is
 * deceptive: the absence of Ma and Ni means every phrase must find its
 * beauty within a smaller palette, demanding precision and imagination.
 *
 * Bhoopali is the ideal first raga for voice training because every swara
 * is shuddha (natural), making pitch accuracy straightforward to assess.
 * The pentatonic structure also means students learn to navigate intervals
 * larger than a step — the gap from Ga to Pa and from Dha to Sa.
 *
 * Thaat: Kalyan (though it uses only 5 of the 7 Kalyan swaras)
 * Time: Early evening, dusk
 * Rasa: Shant (peace), Shringar (gentle beauty)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Bhoopali — complete musicological definition.
 *
 * Aroha: S R G P D S'
 * Avaroha: S' D P G R S
 *
 * Vadi: Ga (the sweet third — centre of gravity)
 * Samvadi: Dha (consonant with Ga at a perfect fourth)
 *
 * Classification: Audava-Audava (5+5 notes)
 * Varjit (omitted): Ma and Ni — completely absent.
 */
export const bhoopali: Raga = {
  id: 'bhoopali',
  name: 'Bhoopali',
  nameDevanagari: 'भूपाली',
  thaat: 'kalyan',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
    n('Ga', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Dha', 'madhya'),
    n('Pa', 'madhya'),
    n('Ga', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'audava',
    avaroha: 'audava',
  },

  vadi: 'Ga',
  samvadi: 'Dha',
  anuvadi: ['Re', 'Pa'],
  varjit: ['Ma', 'Ma_t', 'Ni', 'Ni_k', 'Re_k', 'Ga_k', 'Dha_k'],

  pakad: [
    // Ga Re Sa — the simple, definitive descent
    [n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Sa Re Ga Pa Dha Pa Ga — ascending with a characteristic turn
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya')],
    // Ga Pa Dha Pa Ga — the upper register phrase
    [n('Ga', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya')],
    // Dha Pa Ga Re Sa — full descent
    [n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [4, 5],

  rasa: ['shant', 'shringar'],

  ornaments: ['meend', 'kan'],

  description:
    'Bhoopali is the raga of dusk — the last light of the sun, the sky turning gold ' +
    'and then violet. With only five shuddha swaras and no chromatic alteration, it ' +
    'is transparent and pure, like clear water. There is nowhere to hide in Bhoopali: ' +
    'every swara must be perfectly intoned, every phrase must breathe. The absence of ' +
    'Ma and Ni means the ear rests on wider intervals — the leap from Ga to Pa, the ' +
    'space between Dha and Sa. Ga is the emotional centre: linger on it and the raga ' +
    'opens up; rush past it and the raga collapses. Bhoopali teaches the first and ' +
    'most important lesson of Hindustani music: that simplicity is not the absence of ' +
    'complexity, but the mastery of restraint.',

  westernBridge:
    'Western listeners will recognise the major pentatonic scale (C-D-E-G-A), though ' +
    'Bhoopali\'s identity comes from its characteristic phrases and the emphasis on Ga ' +
    'and Dha, not merely the note set.',

  ornamentMap: {
    'Ga': ['meend', 'kan'],      // Ga (vadi) gets meend and kan
    'Dha': ['meend'],            // Dha (samvadi) gets meend
    'Re': ['kan'],               // Re gets kan
  },

  relatedRagas: ['deshkar', 'shuddha_kalyan', 'yaman'],

  gharanaVariations:
    'Most gharanas treat Bhoopali similarly due to its structural simplicity. ' +
    'Kirana gharana may linger on Ga with extended meend. Gwalior tradition ' +
    'favours brisk, rhythmic compositions in drut teentaal. The raga is often ' +
    'confused with Deshkar, which shares the same swaras but gives vadi to Dha ' +
    'and has a different melodic character — Deshkar ascends prominently to Dha ' +
    'while Bhoopali centres around Ga.',
};
