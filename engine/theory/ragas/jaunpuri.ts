/**
 * @module engine/theory/ragas/jaunpuri
 *
 * Raga Jaunpuri — the raga of the morning, of gentle awakening, of the
 * world emerging softly from sleep with a quality of quiet emotion.
 *
 * Jaunpuri belongs to the Asavari thaat and shares its komal Ga, komal Dha,
 * and komal Ni with the parent raga Asavari. However, Jaunpuri distinguishes
 * itself through greater emphasis on Re and Ma, and a characteristic
 * treatment of the lower tetrachord that gives it a more lyrical, less
 * austere quality than Asavari.
 *
 * Named after the city of Jaunpur in Uttar Pradesh, this raga carries
 * a quality of cultured refinement and measured emotion.
 *
 * Thaat: Asavari
 * Time: Morning, late morning (1st–2nd prahar)
 * Rasa: Karuna (gentle pathos), Shringar (refined beauty)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Jaunpuri — complete musicological definition.
 *
 * Aroha: S R G(k) M P D(k) N(k) S'
 *   (Sampoorna — all seven swaras with komal Ga, Dha, Ni)
 *
 * Avaroha: S' N(k) D(k) P M G(k) R S
 *   (Sampoorna — all seven swaras)
 *
 * Vadi: Dha_k (the komal sixth — emotional centre)
 * Samvadi: Ga_k (consonant with Dha_k)
 *
 * Distinguished from Asavari by the prominence of Re and by using
 * Ga_k in the aroha (Asavari omits Ga in ascent).
 */
export const jaunpuri: Raga = {
  id: 'jaunpuri',
  name: 'Jaunpuri',
  nameDevanagari: 'जौनपुरी',
  thaat: 'asavari',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Ni_k', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni_k', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'sampoorna',
    avaroha: 'sampoorna',
  },

  vadi: 'Dha_k',
  samvadi: 'Ga_k',
  anuvadi: ['Re', 'Ma', 'Pa', 'Ni_k'],
  varjit: ['Re_k', 'Ga', 'Ma_t', 'Dha', 'Ni'],

  pakad: [
    // Re Ma Pa Dha(k) Ma Pa — the morning opening with Re emphasis
    [n('Re', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Ma Ga(k) Re Sa — the gentle komal descent
    [n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Pa Dha(k) Ni(k) Dha(k) Pa Ma — upper phrase lingering on Dha(k)
    [n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ni_k', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya')],
    // Sa Re Ga(k) Ma Pa — the clear ascending opening
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
  ],

  prahara: [1, 2],

  rasa: ['karuna', 'shringar'],

  ornaments: ['meend', 'kan', 'andolan', 'murki'],

  description:
    'Jaunpuri is the raga of the gracious morning — the world waking not with the stark ' +
    'intensity of Bhairav but with a gentler, more cultured sensibility. It shares the ' +
    'Asavari thaat\'s komal Ga, Dha, and Ni, but treats them with a lyrical warmth that ' +
    'distinguishes it from the more austere parent raga. Re and Ma are prominently featured, ' +
    'and the phrase Re-Ma-Pa-Dha(k) is the raga\'s calling card — a gentle ascent that ' +
    'reaches the emotional centre at Dha_k with a quality of tender recognition. Named after ' +
    'the cultural capital of Jaunpur, the raga carries an air of refined cultivation. Its ' +
    'character is emotional but measured, its pathos tempered by elegance.',

  westernBridge:
    'Western listeners may hear a resemblance to the natural minor (Aeolian mode), but ' +
    'Jaunpuri\'s identity lies in the specific emphasis on Re and the characteristic ' +
    'phrase movements around Dha_k that give it a personality distinct from any Western mode.',

  relatedRagas: ['asavari', 'darbari_kanada', 'devgandhar'],

  gharanaVariations:
    'Gwalior gharana presents Jaunpuri with clear, rhythmic bandish compositions and a ' +
    'bright, accessible character. Kirana gharana explores the Dha_k with extended andolan, ' +
    'bringing out the raga\'s contemplative potential. Jaipur-Atrauli gharana carefully ' +
    'distinguishes Jaunpuri from Asavari through the prominence of Re and the treatment ' +
    'of Ga_k in the aroha. The debate over whether Ga_k appears in Jaunpuri\'s aroha ' +
    '(unlike Asavari) is central to their distinction.',
};
