/**
 * @module engine/theory/ragas/puriya_dhanashri
 *
 * Raga Puriya Dhanashri — the raga of the first moments after sunset,
 * when the sky still holds the memory of light but the stars are
 * beginning to appear.
 *
 * Puriya Dhanashri is a raga of the Poorvi thaat, combining elements
 * of Raga Puriya and Raga Dhanashri. It uses three altered swaras —
 * komal Re, tivra Ma, and komal Dha — creating a chromatic tension
 * that gives the raga its distinctive gravity and emotional depth.
 *
 * The raga features vakra (oblique) phrases, particularly in the
 * approach to Pa and in the upper register. Ni is the vadi, placing
 * the raga's emotional weight in the upper tetrachord.
 *
 * Thaat: Poorvi
 * Time: Sunset, early evening (4th and 5th prahar)
 * Rasa: Karuna (pathos), Shringar (devotion)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Puriya Dhanashri — complete musicological definition.
 *
 * Aroha: N r G M(t) P d N S'
 *   (Ni of mandra begins the ascent — sampoorna)
 *
 * Avaroha: S' N d P M(t) G r S
 *   (Sampoorna — all seven swaras)
 *
 * Vadi: Ni (the leading tone — the raga's emotional peak)
 * Samvadi: Ga (consonant with Ni)
 *
 * Three altered swaras: Re_k (komal), Ma_t (tivra), Dha_k (komal).
 * This creates the characteristic Poorvi thaat chromaticism.
 */
export const puriya_dhanashri: Raga = {
  id: 'puriya_dhanashri',
  name: 'Puriya Dhanashri',
  nameDevanagari: 'पूरिया धनाश्री',
  thaat: 'poorvi',

  aroha: [
    n('Ni', 'mandra'),
    n('Re_k', 'madhya'),
    n('Ga', 'madhya'),
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
    n('Ga', 'madhya'),
    n('Re_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'sampoorna',
    avaroha: 'sampoorna',
  },

  vadi: 'Ni',
  samvadi: 'Ga',
  anuvadi: ['Re_k', 'Ma_t', 'Pa', 'Dha_k'],
  varjit: ['Re', 'Ga_k', 'Ma', 'Dha', 'Ni_k'],

  pakad: [
    // Ni Re(k) Ga Ma(t) Ga Re(k) Sa — opening phrase, circling the lower register
    [n('Ni', 'mandra'), n('Re_k', 'madhya'), n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Ga Ma(t) Pa Dha(k) Ni — ascending to the vadi
    [n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ni', 'madhya')],
    // Ni Dha(k) Pa Ma(t) Ga — the characteristic descent from Ni
    [n('Ni', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya')],
    // Dha(k) Ni Sa' Ni Dha(k) Pa — upper register arc
    [n('Dha_k', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
    // Ma(t) Ga Re(k) Sa — settling phrase
    [n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [4, 5],

  rasa: ['karuna', 'shringar'],

  ornaments: ['meend', 'andolan', 'kan', 'gamak'],

  description:
    'Puriya Dhanashri is the raga of the first moments after sunset — the sky deepening ' +
    'through amber to indigo, the air cooling, the world poised between the day that was ' +
    'and the night that will be. Three altered swaras — komal Re, tivra Ma, komal Dha — ' +
    'create a chromatic landscape of unusual density, giving every phrase a quality of ' +
    'heightened emotional tension. Ni is the vadi, and the raga\'s most powerful moments ' +
    'occur when a musician ascends to Ni and dwells there, the leading tone vibrating with ' +
    'accumulated intensity from the chromatic passage below. The fusion of Puriya\'s gravity ' +
    'with Dhanashri\'s devotional sweetness creates a raga of remarkable emotional range — ' +
    'it can be deeply serious in vilambit alap and surprisingly tender in drut compositions.',

  westernBridge:
    'Western listeners will find no direct equivalent — the combination of a minor second, ' +
    'augmented fourth, and minor sixth creates a scale unknown in Western diatonic practice. ' +
    'The closest comparison might be to certain synthetic scales used in 20th-century ' +
    'Western composition, but without the raga\'s phrase-level identity.',

  relatedRagas: ['puriya', 'marwa', 'poorvi', 'shri'],

  gharanaVariations:
    'Jaipur-Atrauli gharana has a particularly strong tradition of Puriya Dhanashri, with ' +
    'precise articulation of the vakra phrases. Kirana gharana explores the Ni with extended ' +
    'meend from Dha(k). Agra gharana presents the raga with a more architectural approach, ' +
    'emphasising the structural contrast between the lower and upper tetrachords. ' +
    'Pt. Kumar Gandharva\'s interpretations are noted for their innovative phrase construction.',
};
