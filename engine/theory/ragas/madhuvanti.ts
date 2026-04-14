/**
 * @module engine/theory/ragas/madhuvanti
 *
 * Raga Madhuvanti — the raga of the late afternoon, of honey-sweet
 * yearning, of a beauty that aches with tenderness.
 *
 * Madhuvanti is a shadava raga derived from the Todi thaat family,
 * using komal Ga, tivra Ma, and komal Dha alongside shuddha Re, Pa,
 * and Ni. It omits Re in the aroha and features a characteristic
 * vakra movement. The name means "honey-intoxicated" — and the
 * raga fully lives up to it, possessing a sweet, yearning quality
 * that is deeply romantic.
 *
 * Madhuvanti is sometimes considered a variant of the Carnatic raga
 * Hemavathi, adapted to Hindustani sensibility with characteristic
 * ornamental treatment.
 *
 * Thaat: Todi (variant — uses shuddha Re, shuddha Ni)
 * Time: Late afternoon (4th prahar)
 * Rasa: Shringar (romantic love), Karuna (sweet pathos)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Madhuvanti — complete musicological definition.
 *
 * Aroha: S G(k) M(t) P D(k) N S'
 *   (Re omitted in ascent — shadava)
 *
 * Avaroha: S' N D(k) P M(t) G(k) R S
 *   (All seven swaras — sampoorna)
 *
 * Vadi: Ma_t (the tivra fourth — the raga's sweet intensity)
 * Samvadi: Sa (consonant with Ma_t)
 *
 * Uses komal Ga and komal Dha but shuddha Re and shuddha Ni —
 * this distinguishes it from Todi (which uses komal Re) and gives
 * Madhuvanti its sweeter, more approachable character.
 */
export const madhuvanti: Raga = {
  id: 'madhuvanti',
  name: 'Madhuvanti',
  nameDevanagari: 'मधुवंती',
  thaat: 'todi',

  aroha: [
    n('Sa', 'madhya'),
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
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'shadava',
    avaroha: 'sampoorna',
  },

  vadi: 'Ma_t',
  samvadi: 'Sa',
  anuvadi: ['Re', 'Ga_k', 'Pa', 'Dha_k', 'Ni'],
  varjit: ['Re_k', 'Ga', 'Ma', 'Dha', 'Ni_k'],

  pakad: [
    // Ga(k) Ma(t) Pa Dha(k) — the sweet ascending phrase
    [n('Ga_k', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya')],
    // Pa Ma(t) Ga(k) Re Sa — the yearning descent
    [n('Pa', 'madhya'), n('Ma_t', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Dha(k) Ni Sa' Ni Dha(k) Pa — upper register turn
    [n('Dha_k', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
    // Sa Ga(k) Ma(t) Pa — the characteristic opening, leaping past Re
    [n('Sa', 'madhya'), n('Ga_k', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya')],
  ],

  prahara: [4],

  rasa: ['shringar', 'karuna'],

  ornaments: ['meend', 'andolan', 'kan', 'murki'],

  description:
    'Madhuvanti is the raga of honey-sweet yearning — the late afternoon softening into ' +
    'golden light, the heart open and vulnerable. Its name means "intoxicated with honey" ' +
    'and its character perfectly embodies this: the komal Ga provides emotional depth, the ' +
    'tivra Ma adds sweet intensity, and the komal Dha contributes a quality of tender aching. ' +
    'The use of shuddha Re and shuddha Ni (where the parent Todi would use komal forms) ' +
    'gives Madhuvanti a warmer, more approachable character — less austere than Todi, more ' +
    'openly romantic. Ma_t is the vadi, and phrases dwelling on Ma_t with andolan have an ' +
    'intensity of longing that is the raga\'s emotional signature. The omission of Re in ' +
    'the aroha creates a leap from Sa to Ga_k that immediately establishes the raga\'s ' +
    'distinctive colour.',

  westernBridge:
    'Western listeners may notice the augmented fourth (tivra Ma) and minor intervals, but ' +
    'Madhuvanti\'s particular combination of minor third, augmented fourth, and minor sixth ' +
    'with natural second and seventh creates a scale structure without Western precedent.',

  relatedRagas: ['todi', 'multani', 'gurjari_todi'],

  gharanaVariations:
    'Madhuvanti gained prominence in the 20th century through recordings by Pt. Kumar ' +
    'Gandharva and Kishori Amonkar, whose deeply personal treatments expanded the raga\'s ' +
    'emotional range. Kirana gharana explores extended andolan on Ma_t and Ga_k. The raga ' +
    'is popular across gharanas for its beauty and accessibility relative to other ' +
    'Todi-family ragas.',
};
