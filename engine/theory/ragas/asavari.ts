/**
 * @module engine/theory/ragas/asavari
 *
 * Raga Asavari — the raga of late morning pathos, of the world seen
 * through a veil of gentle sorrow.
 *
 * Asavari is the parent raga of the Asavari thaat, characterised by
 * komal Ga, komal Dha, and komal Ni. It has a deeply emotional quality —
 * melancholic but not despairing, contemplative but not detached.
 *
 * The aroha is audava, omitting Ga and Dha (rising through the shuddha
 * swaras Sa Re Ma Pa Ni), while the sampoorna avaroha descends through
 * komal Ga, komal Dha, and komal Ni — revealing the raga's emotional
 * depth only in the descent.
 *
 * Thaat: Asavari
 * Time: Late morning (2nd prahar)
 * Rasa: Karuna (pathos), Shant (reflective peace)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Asavari — complete musicological definition.
 *
 * Aroha: S R M P D S'
 *   (Ga and Ni omitted in ascent — audava)
 *
 * Avaroha: S' N(k) D(k) P M G(k) R S
 *   (All seven swaras — sampoorna, with komal Ga, Dha, Ni)
 *
 * Vadi: Dha_k (the komal sixth — centre of gravity)
 * Samvadi: Ga_k (consonant with Dha_k)
 *
 * The dual character — bright ascent, dark descent — is Asavari's
 * defining structural feature.
 */
export const asavari: Raga = {
  id: 'asavari',
  name: 'Asavari',
  nameDevanagari: 'आसावरी',
  thaat: 'asavari',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha_k', 'madhya'),
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
    aroha: 'audava',
    avaroha: 'sampoorna',
  },

  vadi: 'Dha_k',
  samvadi: 'Ga_k',
  anuvadi: ['Re', 'Ma', 'Pa', 'Ni_k'],
  varjit: ['Re_k', 'Ga', 'Ma_t', 'Dha', 'Ni'],

  pakad: [
    // Dha(k) Ma Pa Dha(k) Ma Pa — the characteristic oscillation around Dha(k)
    [n('Dha_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Ma Ga(k) Re Sa — the komal descent
    [n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Pa Dha(k) Ni(k) Dha(k) Pa — upper register phrase
    [n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ni_k', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
    // Sa Re Ma Pa Dha(k) Ma Pa — the ascending opening
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
  ],

  prahara: [2],

  rasa: ['karuna', 'shant'],

  ornaments: ['meend', 'kan', 'andolan', 'gamak'],

  description:
    'Asavari is the raga of late-morning contemplation — the sun fully risen but the heart ' +
    'still heavy, the world bright but seen through a veil of inner sorrow. As the parent ' +
    'of the Asavari thaat, it defines the character of komal Ga, komal Dha, and komal Ni ' +
    'sounding together. The aroha is audava, omitting Ga and Ni entirely, so the ascent ' +
    'feels open and relatively neutral; it is in the sampoorna descent that the three komal ' +
    'swaras reveal the raga\'s true emotional depth. Dha_k is the vadi — the way a musician ' +
    'lingers on komal Dha, approaching it from Pa and releasing to Ma, defines Asavari\'s ' +
    'character. The raga is serious but not austere; its pathos has a softness, a quality of ' +
    'resignation rather than protest.',

  westernBridge:
    'Western listeners may hear a resemblance to the Aeolian mode (natural minor scale), ' +
    'but Asavari\'s identity lies in its asymmetric aroha-avaroha structure and the ' +
    'specific ornamental treatment of Dha_k and Ga_k.',

  relatedRagas: ['jaunpuri', 'darbari_kanada', 'komal_re_asavari'],

  gharanaVariations:
    'Gwalior gharana presents Asavari with clear, structured compositions and rhythmic ' +
    'precision. Kirana gharana explores extended andolan on Dha_k and Ga_k. Jaipur-Atrauli ' +
    'gharana distinguishes carefully between Asavari and Jaunpuri, which shares the same ' +
    'thaat but emphasises Re and Ma differently. Some musicians admit shuddha Dha and ' +
    'shuddha Ni as fleeting touches in the aroha — a practice that blurs the boundary ' +
    'with Jaunpuri and is debated among scholars.',
};
