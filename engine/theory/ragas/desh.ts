/**
 * @module engine/theory/ragas/desh
 *
 * Raga Desh — the raga of the monsoon, of longing for the homeland,
 * of rain on parched earth and the joy of reunion.
 *
 * Desh is a beloved raga of the Khamaj thaat, widely performed in
 * light classical forms (thumri, dadra, hori) as well as in khayal.
 * Its defining feature is the use of both shuddha Ni in the aroha
 * and komal Ni in the avaroha — a duality that gives the raga its
 * distinctive quality of bittersweet longing.
 *
 * The raga is intimately associated with the monsoon season and with
 * the emotion of homecoming. Many patriotic compositions are set in
 * Desh, including Bankim Chandra Chatterjee's "Vande Mataram."
 *
 * Thaat: Khamaj
 * Time: Evening, second prahar of the night
 * Rasa: Shringar (love/beauty), Karuna (longing)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Desh — complete musicological definition.
 *
 * Aroha: S R M P N S'
 *   (Ga and Dha omitted in ascent — audava)
 *   Shuddha Ni is used in the aroha.
 *
 * Avaroha: S' n D P M G R S
 *   (All seven swaras — sampoorna)
 *   Komal Ni is used in the avaroha.
 *
 * Vadi: Re (the anchor of the raga's melodic identity)
 * Samvadi: Pa (consonant with Re at a perfect fourth)
 *
 * The dual Ni treatment (shuddha ascending, komal descending) is the
 * hallmark of Desh and the Khamaj thaat generally.
 */
export const desh: Raga = {
  id: 'desh',
  name: 'Desh',
  nameDevanagari: 'देश',
  thaat: 'khamaj',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Ni', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni_k', 'madhya'),
    n('Dha', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma', 'madhya'),
    n('Ga', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'audava',
    avaroha: 'sampoorna',
  },

  vadi: 'Re',
  samvadi: 'Pa',
  anuvadi: ['Ma', 'Ga', 'Dha', 'Ni', 'Ni_k'],
  varjit: ['Re_k', 'Ga_k', 'Ma_t', 'Dha_k'],

  pakad: [
    // Re Ma Pa Ni Dha Pa — ascending signature with shuddha Ni
    [n('Re', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Dha Ni(k) Dha Pa Ma Ga Re Sa — full descent with komal Ni
    [n('Dha', 'madhya'), n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Sa Re Ma Pa — the clean ascending opening
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma Ga Re Sa — simple descent
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ni Dha Pa Ma Ga Re — the monsoon phrase, lingering descent
    [n('Ni', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya')],
  ],

  prahara: [5, 6],

  rasa: ['shringar', 'karuna'],

  ornaments: ['meend', 'kan', 'murki', 'khatka'],

  description:
    'Desh is the raga of rain and reunion — the monsoon clouds gathering, the first ' +
    'drops on parched earth, the ache of being far from home. It belongs to the Khamaj ' +
    'thaat and carries that thaat\'s signature duality: shuddha Ni rises in the aroha ' +
    'with a quality of hope, while komal Ni descends in the avaroha with tender melancholy. ' +
    'This single swara shift transforms the emotional landscape between ascent and descent. ' +
    'Re is the vadi — the raga dwells on Re with an intensity that feels like a declaration, ' +
    'then departs and returns to it like a traveller returning home. Desh is immensely popular ' +
    'in semi-classical forms — thumri, dadra, hori — where its emotional directness and ' +
    'accessible beauty make it a favourite for exploring romantic and devotional themes.',

  westernBridge:
    'Western listeners may hear a resemblance to the Mixolydian mode (with its lowered ' +
    'seventh in descent), but Desh\'s character is defined by the dual Ni treatment ' +
    'and its monsoon associations — emotional mappings with no Western counterpart.',

  relatedRagas: ['khamaj', 'tilak_kamod', 'jhinjhoti', 'pilu'],

  gharanaVariations:
    'Kirana gharana presents Desh with extended, meditative alap emphasising the Re-Ma ' +
    'relationship. Jaipur-Atrauli gharana explores complex taan patterns using the dual Ni. ' +
    'In the Lucknow tradition, Desh is a staple thumri raga, rendered with elaborate ' +
    'bol-baant and expressive ornamentation. Pt. Ravi Shankar\'s sitar renditions popularised ' +
    'Desh internationally, establishing it as one of the most recognised ragas outside India.',
};
