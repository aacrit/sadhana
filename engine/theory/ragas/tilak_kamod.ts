/**
 * @module engine/theory/ragas/tilak_kamod
 *
 * Raga Tilak Kamod — the raga of romantic evening, of festive joy,
 * of a happiness that is sincere and unguarded.
 *
 * Tilak Kamod belongs to the Khamaj thaat and is one of the most
 * joyful ragas in the Hindustani system. It uses both shuddha Ni
 * and komal Ni (shuddha in aroha, komal in avaroha), following the
 * Khamaj pattern, but its character is distinctly more celebratory
 * than the romantic Khamaj or the monsoon longing of Desh.
 *
 * The raga is characterised by a sparkling quality in the upper
 * register and a particular emphasis on Re and Pa that gives it
 * rhythmic vitality.
 *
 * Thaat: Khamaj
 * Time: Evening, early night (5th–6th prahar)
 * Rasa: Shringar (joyful love), Hasya (delight)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Tilak Kamod — complete musicological definition.
 *
 * Aroha: S R G P D S'
 *   (Ma and Ni omitted in ascent — audava)
 *
 * Avaroha: S' N(k) D P G M G R S
 *   (Sampoorna with vakra G-M-G turn. Komal Ni in descent.)
 *
 * Vadi: Re (the second — the raga's melodic anchor)
 * Samvadi: Pa (consonant with Re)
 */
export const tilak_kamod: Raga = {
  id: 'tilak_kamod',
  name: 'Tilak Kamod',
  nameDevanagari: 'तिलक कामोद',
  thaat: 'khamaj',

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
    n('Ni_k', 'madhya'),
    n('Dha', 'madhya'),
    n('Pa', 'madhya'),
    n('Ga', 'madhya'),
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
  anuvadi: ['Ga', 'Ma', 'Dha', 'Ni_k'],
  varjit: ['Re_k', 'Ga_k', 'Ma_t', 'Dha_k', 'Ni'],

  pakad: [
    // Sa Re Ga Re Sa — the bright, characteristic opening
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ga Pa Dha Pa Ga Ma Ga Re — the joyful descent with vakra turn
    [n('Ga', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya')],
    // Dha Ni(k) Dha Pa — the upper register turn with komal Ni
    [n('Dha', 'madhya'), n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Re Ga Pa Dha Sa' — the sparkling ascending phrase
    [n('Re', 'madhya'), n('Ga', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Sa', 'taar')],
  ],

  prahara: [5, 6],

  rasa: ['shringar', 'hasya'],

  ornaments: ['kan', 'murki', 'khatka', 'meend'],

  description:
    'Tilak Kamod is the raga of festive evening — the hour of celebration, of garlands ' +
    'and lamplight, of a joy that flows freely and without reservation. It belongs to the ' +
    'Khamaj thaat and carries its komal Ni only in descent, but its character is distinctly ' +
    'more sparkling and celebratory than the romantic Khamaj or the wistful Desh. Re is ' +
    'the vadi — the raga returns to Re with an insistence that feels like laughter, and the ' +
    'phrase Sa-Re-Ga-Re-Sa has a buoyant, almost dancing quality. The vakra turn G-M-G in ' +
    'descent adds a playful flourish, preventing the avaroha from being merely a stepwise ' +
    'return. The audava aroha leaps past Ma and Ni, creating an open, ascending brightness.',

  westernBridge:
    'Western listeners may notice the pentatonic ascent recalls certain major pentatonic ' +
    'melodies, but the vakra descent and komal Ni treatment give Tilak Kamod a character ' +
    'entirely its own — joyful in a specifically Hindustani way.',

  relatedRagas: ['desh', 'khamaj', 'jhinjhoti', 'bhoopali'],

  gharanaVariations:
    'Gwalior gharana presents Tilak Kamod with rhythmic precision and bright, structured ' +
    'bandish compositions. Kirana gharana occasionally extends the raga\'s alap sections ' +
    'beyond the typical light-classical treatment. The raga is especially popular in the ' +
    'thumri and bandish traditions, where its celebratory character is most at home.',
};
