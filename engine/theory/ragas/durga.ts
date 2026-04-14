/**
 * @module engine/theory/ragas/durga
 *
 * Raga Durga — the raga of quiet strength, of evening fortitude,
 * of a pentatonic clarity that evokes both devotion and resolve.
 *
 * Durga is a pentatonic (audava) raga of the Bilawal thaat that omits
 * Ga and Ni entirely. With only five shuddha swaras — Sa, Re, Ma, Pa, Dha —
 * it creates a melodic space of extraordinary openness. The absence of the
 * third (Ga) removes the major/minor character entirely, leaving a modal
 * ambiguity that gives the raga its distinctive quality of serene strength.
 *
 * Named after the goddess Durga, the raga is associated with devotional
 * music and prayers for strength and protection.
 *
 * Thaat: Bilawal
 * Time: Evening (5th prahar)
 * Rasa: Veer (courage), Shant (serenity)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Durga — complete musicological definition.
 *
 * Aroha: S R M P D S'
 *   (Ga and Ni omitted — audava)
 *
 * Avaroha: S' D P M R S
 *   (Ga and Ni omitted — audava)
 *
 * Vadi: Re (some traditions say Pa — both are prominently featured)
 * Samvadi: Dha (consonant with Re)
 *
 * The absence of Ga and Ni creates a pentatonic scale that is neither
 * major nor minor — its character transcends Western tonal categories.
 */
export const durga: Raga = {
  id: 'durga',
  name: 'Durga',
  nameDevanagari: 'दुर्गा',
  thaat: 'bilawal',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Dha', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'audava',
    avaroha: 'audava',
  },

  vadi: 'Re',
  samvadi: 'Dha',
  anuvadi: ['Ma', 'Pa'],
  varjit: ['Re_k', 'Ga_k', 'Ga', 'Ma_t', 'Dha_k', 'Ni_k', 'Ni'],

  pakad: [
    // Sa Re Ma Pa — the open, ascending declaration
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Pa Dha Pa Ma Re Sa — the resolute descent
    [n('Pa', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ma Pa Dha Sa' Dha Pa — the upper register phrase
    [n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Sa', 'taar'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Re Ma Re Sa — the characteristic lower turn
    [n('Re', 'madhya'), n('Ma', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [5],

  rasa: ['veer', 'shant'],

  ornaments: ['meend', 'kan', 'gamak'],

  description:
    'Durga is the raga of quiet fortitude — the strength of evening prayer, the resolve ' +
    'that comes not from aggression but from centered stillness. With only five shuddha ' +
    'swaras and no Ga or Ni, it creates a pentatonic space that is neither major nor minor, ' +
    'transcending Western tonal categories entirely. Re and Pa are the twin anchors — the ' +
    'raga moves between them with a directness that feels like a declaration of purpose. ' +
    'The wider intervals created by the absent third and seventh give every phrase a quality ' +
    'of openness and clarity. Named after the warrior goddess, Durga embodies a strength ' +
    'that is protective rather than aggressive, a courage born of devotion rather than fury. ' +
    'It is an excellent raga for evening prayer and meditation.',

  westernBridge:
    'Western listeners may hear a suspended quality — the absence of both the third and ' +
    'seventh removes the major/minor distinction entirely, creating a pentatonic palette ' +
    'that is familiar in sound but unique in its devotional application.',

  relatedRagas: ['bhoopali', 'bilawal', 'shuddha_sarang'],

  gharanaVariations:
    'Durga is widely performed across gharanas without dramatic variation. Gwalior gharana ' +
    'presents it with bright, rhythmic compositions. Kirana gharana may explore extended ' +
    'meend between Re and Ma. The raga is especially popular in devotional contexts and is ' +
    'commonly heard during Navratri celebrations. Some musicologists classify Durga under ' +
    'the Bilawal thaat, others consider it a child of Kafi — the debate centres on whether ' +
    'the absent Ga would be shuddha or komal if present.',
};
