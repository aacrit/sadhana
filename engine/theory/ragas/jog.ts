/**
 * @module engine/theory/ragas/jog
 *
 * Raga Jog — the raga of night, of detachment, of the yogi's
 * meditative stillness in the depths of darkness.
 *
 * Jog is a distinctive raga that combines elements of both Kafi and
 * Khamaj thaats. Its most characteristic feature is the use of komal Ni
 * and komal Ga alongside shuddha Ma, with a pentatonic aroha that omits
 * Re and Dha. The name "Jog" (derived from "yoga") evokes spiritual
 * discipline and the meditative detachment of a renunciant.
 *
 * Jog has a special quality of being simultaneously light and profound —
 * it is popular in film music for its accessible beauty, yet in classical
 * performance it can achieve remarkable depth.
 *
 * Thaat: Kafi
 * Time: Night (6th–7th prahar)
 * Rasa: Shant (meditative peace), Karuna (spiritual longing)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Jog — complete musicological definition.
 *
 * Aroha: S G(k) M P N(k) S'
 *   (Re and Dha omitted — audava)
 *
 * Avaroha: S' N(k) D P M G(k) R S
 *   (All seven swaras — sampoorna)
 *
 * Vadi: Pa (the fifth — the raga's gravitational centre)
 * Samvadi: Sa (consonant with Pa)
 *
 * The audava aroha with its wide leaps (Sa to Ga_k, Pa to Ni_k)
 * gives the ascent an angular, meditative quality, while the sampoorna
 * avaroha unfolds the full palette in descent.
 */
export const jog: Raga = {
  id: 'jog',
  name: 'Jog',
  nameDevanagari: 'जोग',
  thaat: 'kafi',

  aroha: [
    n('Sa', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Ni_k', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni_k', 'madhya'),
    n('Dha', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'audava',
    avaroha: 'sampoorna',
  },

  vadi: 'Pa',
  samvadi: 'Sa',
  anuvadi: ['Re', 'Ga_k', 'Ma', 'Dha', 'Ni_k'],
  varjit: ['Re_k', 'Ga', 'Ma_t', 'Dha_k', 'Ni'],

  pakad: [
    // Sa Ga(k) Ma Pa — the angular ascending opening
    [n('Sa', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma Ga(k) Re Sa — the stepwise descent
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Pa Dha Ni(k) Dha Pa Ma — the upper register phrase with Dha
    [n('Pa', 'madhya'), n('Dha', 'madhya'), n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya')],
    // Ga(k) Ma Pa Ni(k) Sa' — the soaring ascent to taar Sa
    [n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya'), n('Ni_k', 'madhya'), n('Sa', 'taar')],
  ],

  prahara: [6, 7],

  rasa: ['shant', 'karuna'],

  ornaments: ['meend', 'kan', 'andolan', 'gamak'],

  description:
    'Jog is the raga of the yogi\'s night — the stillness of one who has withdrawn from ' +
    'the world not in despair but in disciplined detachment. Its name derives from yoga, ' +
    'and its character embodies that tradition\'s quality of alert calm. The audava aroha ' +
    'omits Re and Dha, creating angular leaps (Sa to Ga_k, Pa to Ni_k) that give the ascent ' +
    'a quality of deliberate stepping, each swara a footfall in the dark. Pa is the vadi — ' +
    'the raga settles on Pa with a gravity that feels like the yogi\'s seat, unmoved and ' +
    'centred. The komal Ga provides emotional warmth without sentimentality, and the komal Ni ' +
    'adds a quality of night-time depth. Jog is accessible enough for film music yet profound ' +
    'enough for extended classical exploration — a rare combination that speaks to its ' +
    'universal appeal.',

  westernBridge:
    'Western listeners may hear elements of a minor pentatonic in the aroha, but Jog\'s ' +
    'asymmetric structure — pentatonic ascending, heptatonic descending — and its specific ' +
    'phrase movements around Pa create a character without direct Western equivalent.',

  relatedRagas: ['kafi', 'bageshri', 'bhimpalasi', 'malkauns'],

  gharanaVariations:
    'Jog gained enormous popularity through Hindi film music, particularly the compositions ' +
    'of Naushad Ali and S.D. Burman. In classical practice, Kirana gharana explores the ' +
    'raga with meditative depth, emphasising the Pa-centred phrases. Gwalior gharana presents ' +
    'it with clear, rhythmic bandish compositions. The raga\'s dual life — as both a classical ' +
    'and popular form — has given it one of the widest audiences of any Hindustani raga.',
};
