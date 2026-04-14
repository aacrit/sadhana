/**
 * @module engine/theory/ragas/yaman
 *
 * Raga Yaman — the quintessential evening raga.
 *
 * Yaman is often the first sampoorna raga taught to students because its
 * structure is clear and its beauty is immediately accessible. Yet it is
 * bottomless — senior musicians spend lifetimes exploring its phrases.
 *
 * The single defining characteristic is Tivra Madhyam (Ma#). Every other
 * swara is shuddha. This one raised note transforms the entire scale,
 * creating an upward pull, a quality of aspiration and devotion that
 * suffuses the raga.
 *
 * Yaman is sometimes called Yaman Kalyan (when shuddha Ma makes a
 * fleeting appearance in descent). Pure Yaman uses only tivra Ma.
 *
 * Thaat: Kalyan
 * Time: Late evening, first and second prahar of the night
 * Rasa: Shant (peace), Shringar (devotion/love)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Yaman — complete musicological definition.
 *
 * Aroha: N R G M(t) D N S'
 * (Note: Yaman's aroha characteristically begins from Ni of the lower octave,
 * emphasising the vakra nature of the approach to Sa.)
 *
 * Avaroha: S' N D P M(t) G R S
 *
 * Vadi: Ga (the sweet major third — the raga's emotional centre)
 * Samvadi: Ni (the leading tone — consonant with Ga at a perfect fifth)
 */
export const yaman: Raga = {
  id: 'yaman',
  name: 'Yaman',
  nameDevanagari: 'यमन',
  thaat: 'kalyan',

  aroha: [
    n('Ni', 'mandra'),
    n('Re', 'madhya'),
    n('Ga', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha', 'madhya'),
    n('Ni', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni', 'madhya'),
    n('Dha', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Ga', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'sampoorna',
    avaroha: 'sampoorna',
  },

  vadi: 'Ga',
  samvadi: 'Ni',
  anuvadi: ['Re', 'Ma_t', 'Pa', 'Dha'],
  varjit: ['Ma', 'Re_k', 'Ga_k', 'Dha_k', 'Ni_k'],

  pakad: [
    // Ni Re Ga — the ascending signature, beginning from Ni of lower octave
    [n('Ni', 'mandra'), n('Re', 'madhya'), n('Ga', 'madhya')],
    // Ga Ma(t) Re Sa — the descending turn through tivra Ma
    [n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // 'Ni Re Ga Re Sa — the characteristic opening phrase
    [n('Ni', 'mandra'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ga Ma(t) Dha Ni Dha Pa — middle register expansion
    [n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma(t) Ga Re Sa — descending home
    [n('Pa', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [5, 6],

  rasa: ['shant', 'shringar'],

  ornaments: ['meend', 'kan', 'murki'],

  description:
    'Yaman is the raga of the first night — the world settling into stillness after ' +
    'dusk, lamplight replacing sunlight, the mind turning inward. Its single alteration ' +
    'from the natural scale — Tivra Madhyam — creates an upward pull that suffuses ' +
    'every phrase with aspiration and quiet devotion. Ga is the vadi, the emotional ' +
    'centre: when a musician rests on Ga in Yaman, there is a quality of having arrived ' +
    'somewhere luminous. The characteristic phrase Ni-Re-Ga, beginning from the lower ' +
    'octave, is one of the most recognisable openings in all of Hindustani music. ' +
    'Yaman rewards both the beginner, who can hear its beauty immediately, and the ' +
    'master, who finds in it a lifetime of expression.',

  westernBridge:
    'Western listeners may notice a resemblance to the Lydian mode (major scale with ' +
    'raised fourth), though Yaman\'s identity lies not in the scale but in its ' +
    'characteristic phrases, ornaments, and the specific gravity given to Ga and Ni.',

  ornamentMap: {
    'Ni': ['kan', 'meend'],      // Ni gets kan from Sa and meend approaching Sa
    'Ga': ['meend'],             // Ga gets meend — vadi, lingered on with grace
    'Re': ['kan'],               // Re gets kan from Ni below
    'Ma_t': ['kan'],             // Ma tivra gets kan — brief touch, never heavy
  },

  relatedRagas: ['bhoopali', 'shuddha_kalyan', 'hameer', 'kedar', 'yaman_kalyan'],

  gharanaVariations:
    'Kirana gharana emphasises slow, meditative alap with extended meend on Ga. ' +
    'Jaipur-Atrauli gharana favours rhythmic taan patterns and crisp ornaments. ' +
    'Agra gharana explores the lower octave more extensively, with powerful ' +
    'nom-tom alap. Some musicians (notably of the Gwalior tradition) allow a ' +
    'fleeting touch of shuddha Ma in descent — this is then called Yaman Kalyan.',
};
