/**
 * @module engine/theory/ragas/bilawal
 *
 * Raga Bilawal — the raga of the morning, of clear sunlight, of a world
 * freshly washed and fully awake.
 *
 * Bilawal is the parent raga of the Bilawal thaat — the scale in which
 * all seven swaras are shuddha (natural). It is the Hindustani equivalent
 * of the Western Ionian mode in note content, but its identity is defined
 * entirely by its characteristic phrases, ornamental treatment, and the
 * specific emphasis given to Dha and Ga.
 *
 * Despite using only shuddha swaras, Bilawal has a distinct morning
 * character — bright, open, and optimistic. It is not "the major scale"
 * but a raga with specific melodic rules and personality.
 *
 * Thaat: Bilawal
 * Time: Morning, late morning (1st–2nd prahar)
 * Rasa: Shant (peace), Shringar (gentle beauty)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Bilawal — complete musicological definition.
 *
 * Aroha: S R G P D S'
 *   (Ma and Ni omitted in aroha — audava)
 *   Some traditions include Ma in aroha; the vakra-free audava form is canonical.
 *
 * Avaroha: S' N D P M G R S
 *   (All seven swaras — sampoorna)
 *
 * Vadi: Dha (the sixth — the raga's centre of gravity)
 * Samvadi: Ga (consonant with Dha)
 *
 * All swaras are shuddha. The challenge lies in phrasing, not pitch.
 */
export const bilawal: Raga = {
  id: 'bilawal',
  name: 'Bilawal',
  nameDevanagari: 'बिलावल',
  thaat: 'bilawal',

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
    n('Ni', 'madhya'),
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

  vadi: 'Dha',
  samvadi: 'Ga',
  anuvadi: ['Re', 'Ma', 'Pa', 'Ni'],
  varjit: ['Re_k', 'Ga_k', 'Ma_t', 'Dha_k', 'Ni_k'],

  pakad: [
    // Ga Re Ga Pa Dha Pa — the characteristic ascending turn through Ga
    [n('Ga', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Dha Pa Ma Ga Re Sa — the full descent
    [n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Pa Dha Ni Sa' Ni Dha Pa — upper register phrase
    [n('Pa', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Ga Re Sa Re Ga Pa — the morning opening
    [n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Pa', 'madhya')],
  ],

  prahara: [1, 2],

  rasa: ['shant', 'shringar'],

  ornaments: ['meend', 'kan', 'murki', 'khatka'],

  description:
    'Bilawal is the raga of the clear morning — sunlight without shadow, the world ' +
    'revealed in its fullness. As the parent of the Bilawal thaat, every swara is shuddha, ' +
    'creating a palette of pure, unaltered tones. Yet this simplicity is not emptiness: the ' +
    'raga\'s identity emerges from its phrasing, particularly the characteristic Ga-Re-Ga ' +
    'turn and the emphasis on Dha as vadi. The omission of Ma and Ni in the aroha gives the ' +
    'ascent a quality of openness and clarity, while the full sampoorna avaroha provides a ' +
    'sense of completion. Bilawal teaches that a raga\'s character comes not from exotic ' +
    'intervals but from the weight and movement given to each swara within even the most ' +
    'familiar terrain.',

  westernBridge:
    'Western listeners will recognise the major scale (Ionian mode), but Bilawal\'s identity ' +
    'lies in its specific melodic movements and the prominence of Dha — it is not merely ' +
    '"the major scale" but a raga with its own rules, phrases, and personality.',

  relatedRagas: ['alhaiya_bilawal', 'durga', 'pahadi', 'bhoopali'],

  gharanaVariations:
    'Gwalior gharana is the traditional home of Bilawal, with clear, rhythmic bandish ' +
    'presentations. Kirana gharana explores the raga\'s meditative possibilities with ' +
    'extended alap on Dha. Jaipur-Atrauli gharana emphasises the Ga-Re-Ga vakra turn ' +
    'with precise ornamentation. Bilawal is sometimes confused with Alhaiya Bilawal, ' +
    'which uses both Ma and Ma_t and has a different character.',
};
