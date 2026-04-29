/**
 * @module engine/theory/ragas/khamaj
 *
 * Raga Khamaj — the raga of romantic late evening, of intimate conversation,
 * of love expressed with tenderness and grace.
 *
 * Khamaj is the parent raga of the Khamaj thaat, characterised by komal Ni
 * as its single alteration from the all-shuddha Bilawal thaat. It is one of
 * the most beloved ragas in the light-classical (thumri, dadra) tradition,
 * where its accessible beauty and emotional warmth make it a vehicle for
 * romantic expression.
 *
 * Like Desh (also Khamaj thaat), Khamaj uses both forms of Ni — shuddha Ni
 * in the aroha and komal Ni in the avaroha. This duality gives the raga its
 * characteristic bittersweet quality.
 *
 * Thaat: Khamaj
 * Time: Late evening (6th prahar)
 * Rasa: Shringar (romantic love), Hasya (gentle joy)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Khamaj — complete musicological definition.
 *
 * Aroha: S G M P D N S'
 *   (Re omitted — shadava. Shuddha Ni used.)
 *
 * Avaroha: S' N(k) D P M G R S
 *   (All seven swaras — sampoorna. Komal Ni used.)
 *
 * Vadi: Ga (the sweet third — the raga's emotional centre)
 * Samvadi: Ni (shuddha Ni — at a perfect fifth from Ga, samvadi consonance
 *          requires the shuddha form. Komal Ni is a featured colour-tone
 *          in avaroha, not the consonant counterweight to the vadi.)
 *
 * The dual Ni treatment defines both Khamaj the raga and Khamaj the thaat.
 */
export const khamaj: Raga = {
  id: 'khamaj',
  name: 'Khamaj',
  nameDevanagari: 'खमाज',
  thaat: 'khamaj',

  aroha: [
    n('Sa', 'madhya'),
    n('Ga', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha', 'madhya'),
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
    aroha: 'shadava',
    avaroha: 'sampoorna',
  },

  vadi: 'Ga',
  samvadi: 'Ni',
  anuvadi: ['Re', 'Ma', 'Pa', 'Dha', 'Ni_k'],
  varjit: ['Re_k', 'Ga_k', 'Ma_t', 'Dha_k'],

  pakad: [
    // Sa Ga Ma Pa — the bright ascending opening
    [n('Sa', 'madhya'), n('Ga', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Dha Ni(k) Dha Pa Ma Ga — descent with komal Ni turn
    [n('Dha', 'madhya'), n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya')],
    // Ga Ma Dha Ni Dha Pa — the ascending reach to shuddha Ni
    [n('Ga', 'madhya'), n('Ma', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma Ga Re Sa — the tender descent home
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [6],

  rasa: ['shringar', 'hasya'],

  ornaments: ['meend', 'kan', 'murki', 'khatka'],

  description:
    'Khamaj is the raga of romantic twilight — the lamplight hour, conversation turning ' +
    'intimate, the heart opening to tenderness. As the parent raga of its thaat, it ' +
    'establishes the defining Khamaj characteristic: shuddha Ni ascending with optimism, ' +
    'komal Ni descending with wistful warmth. Ga is the vadi — the emotional centre — ' +
    'and when a musician lingers on Ga in Khamaj, there is a quality of affectionate ' +
    'directness that makes the raga irresistible. Khamaj is the natural home of thumri ' +
    'and dadra, where its romantic character finds its fullest expression. Yet in khayal, ' +
    'it can be surprisingly substantial — the dual Ni treatment creates harmonic richness ' +
    'that rewards extended exploration.',

  westernBridge:
    'Western listeners may notice a resemblance to the Mixolydian mode (major scale with ' +
    'lowered seventh in descent), but Khamaj\'s dual Ni treatment and its deep association ' +
    'with romantic expression make it a raga, not a mode.',

  relatedRagas: ['desh', 'tilak_kamod', 'jhinjhoti', 'des_malhar'],

  gharanaVariations:
    'The Lucknow thumri tradition is inseparable from Khamaj — elaborate bol-baant, ' +
    'expressive murki, and deeply romantic presentation define this school\'s treatment. ' +
    'Kirana gharana explores Khamaj with extended alap and meditative depth uncommon ' +
    'for a traditionally light-classical raga. Benares gharana presents Khamaj with ' +
    'rhythmic vitality and a more extroverted character.',
};
