/**
 * @module engine/theory/ragas/puriya
 *
 * Raga Puriya — the raga of twilight devotion, of the sky caught between
 * day and night, of an earnest seeking that is both tender and grave.
 *
 * Puriya is a shadava raga of the Marwa thaat that omits Pa entirely.
 * Like its sibling Marwa, this absence of the perfect fifth creates a
 * harmonic void — but where Marwa is restless and urgent, Puriya is
 * more contemplative and devotional. The difference lies in emphasis:
 * Puriya gives vadi status to Ga (the sweet third), not to Re_k,
 * which shifts the emotional gravity from tension to tenderness.
 *
 * Puriya, Marwa, and Sohini form the great triad of evening ragas
 * without Pa — all from the Marwa thaat, all sharing the same swara
 * set, yet each with a completely distinct personality.
 *
 * Thaat: Marwa
 * Time: Evening, early night (5th prahar)
 * Rasa: Shringar (devotional love), Karuna (pathos)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Puriya — complete musicological definition.
 *
 * Aroha: N r G M(t) D N S'
 *   (Pa omitted entirely. Ni of mandra octave begins the ascent.)
 *
 * Avaroha: S' N D M(t) G M(t) G r S
 *   (Pa omitted. Characteristic vakra turn on G M(t) G in descent.)
 *
 * Vadi: Ga (the sweet third — the raga's emotional heart)
 * Samvadi: Ni (consonant with Ga)
 *
 * CRITICAL: Pa is varjit (forbidden). Distinguishes from Puriya Dhanashri
 * and Marwa by vadi-samvadi emphasis and phrasing.
 */
export const puriya: Raga = {
  id: 'puriya',
  name: 'Puriya',
  nameDevanagari: 'पूरिया',
  thaat: 'marwa',

  aroha: [
    n('Ni', 'mandra'),
    n('Re_k', 'madhya'),
    n('Ga', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Dha', 'madhya'),
    n('Ni', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni', 'madhya'),
    n('Dha', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Ga', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Ga', 'madhya'),
    n('Re_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'shadava',
    avaroha: 'shadava',
  },

  vadi: 'Ga',
  samvadi: 'Ni',
  anuvadi: ['Re_k', 'Ma_t', 'Dha'],
  varjit: ['Re', 'Ga_k', 'Ma', 'Pa', 'Dha_k', 'Ni_k'],

  pakad: [
    // Ni Re(k) Ga — the characteristic opening, rising from mandra Ni
    [n('Ni', 'mandra'), n('Re_k', 'madhya'), n('Ga', 'madhya')],
    // Ga Ma(t) Ga Re(k) Sa — the definitive descent with vakra turn
    [n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Ga Ma(t) Dha Ni Dha Ma(t) Ga — upper register phrase circling Ga
    [n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya')],
    // Ni Dha Ma(t) Ga Ma(t) Ga Re(k) Sa — extended descent
    [n('Ni', 'madhya'), n('Dha', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [5],

  rasa: ['shringar', 'karuna'],

  ornaments: ['meend', 'andolan', 'kan', 'gamak'],

  description:
    'Puriya is the raga of twilight devotion — the moment when the first stars appear ' +
    'and the earth exhales the heat of the day. It shares the Marwa thaat\'s radical ' +
    'absence of Pa, yet where Marwa is restless, Puriya is contemplative. The difference ' +
    'is Ga: as vadi, it becomes the emotional anchor, and the characteristic phrase ' +
    'Ga-Ma(t)-Ga-Re(k)-Sa has a quality of gentle insistence, of returning again and again ' +
    'to something beloved. The vakra movement around Ga and Ma(t) in descent is the raga\'s ' +
    'signature — it refuses to descend linearly, instead circling the third with a devotion ' +
    'that is almost prayer-like. Puriya demands patience and a certain emotional maturity; ' +
    'its beauty reveals itself slowly, in the spaces between swaras.',

  westernBridge:
    'Western listeners will find no direct equivalent — the combination of a minor second, ' +
    'major third, augmented fourth, and absent fifth is outside Western modal vocabulary, ' +
    'though the emphasis on the major third may recall the warmth of certain Lydian passages.',

  relatedRagas: ['marwa', 'sohini', 'puriya_dhanashri'],

  gharanaVariations:
    'Jaipur-Atrauli gharana is celebrated for Puriya, with precise articulation of the ' +
    'Ga-Ma(t)-Ga vakra turn. Kirana gharana emphasises extended meend on Ga and slow, ' +
    'meditative alap. Agra gharana explores the lower octave with grave, powerful phrases. ' +
    'The distinction between Puriya and Marwa is considered a test of a musician\'s depth — ' +
    'lesser performers blur the two, but a master makes each unmistakable.',
};
