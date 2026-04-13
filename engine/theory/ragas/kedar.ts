/**
 * @module engine/theory/ragas/kedar
 *
 * Raga Kedar — the raga of devotion at nightfall, of temple bells
 * and the last puja of the day.
 *
 * Kedar is a raga of the Kalyan thaat, though its most distinctive
 * feature — the use of both shuddha Ma and tivra Ma — makes it
 * transcend simple thaat classification. The dual Ma is the raga's
 * defining characteristic: tivra Ma appears in ascent (creating the
 * Kalyan quality), while shuddha Ma appears in descent (grounding
 * the raga in a more earthly devotion).
 *
 * Pa is the vadi, and the raga's phrases orbit Pa with an intensity
 * that creates a quality of settled, unwavering devotion. Kedar is
 * associated with bhakti (devotional) sentiment and is a favourite
 * raga for bhajan and devotional compositions.
 *
 * Thaat: Kalyan
 * Time: Night, early night (5th and 6th prahar)
 * Rasa: Shringar (devotion), Shant (peace)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Kedar — complete musicological definition.
 *
 * Aroha: S M(t) P D N S'
 *   (Ga and Re omitted in ascent — audava)
 *   Tivra Ma is used in the aroha.
 *
 * Avaroha: S' N D P m P D P m G R S
 *   (Vakra — shuddha Ma used in descent. Both Ma forms appear across aroha/avaroha.)
 *
 * Vadi: Pa (the fifth — the raga's devotional anchor)
 * Samvadi: Sa (consonant with Pa)
 *
 * CRITICAL: The dual Ma treatment — Ma_t ascending, Ma descending — is the
 * signature of Kedar. This duality must be preserved in all contexts.
 */
export const kedar: Raga = {
  id: 'kedar',
  name: 'Kedar',
  nameDevanagari: 'केदार',
  thaat: 'kalyan',

  aroha: [
    n('Sa', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha', 'madhya'),
    n('Ni', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni', 'madhya'),
    n('Dha', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
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

  vadi: 'Pa',
  samvadi: 'Sa',
  anuvadi: ['Ma', 'Ma_t', 'Re', 'Ga', 'Dha', 'Ni'],
  varjit: ['Re_k', 'Ga_k', 'Dha_k', 'Ni_k'],

  pakad: [
    // Sa Ma(t) Pa — the ascending signature with tivra Ma
    [n('Sa', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma Pa Dha Pa Ma Ga Re Sa — the characteristic vakra descent with shuddha Ma
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ma(t) Pa Dha Ni Sa' — the ascending arc to taar Sa
    [n('Ma_t', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar')],
    // Dha Pa Ma Ga Re Sa — descending with shuddha Ma
    [n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Sa Ma(t) Pa Ma Ga Re Sa — the dual-Ma phrase in microcosm
    [n('Sa', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [5, 6],

  rasa: ['shringar', 'shant'],

  ornaments: ['meend', 'kan', 'murki'],

  description:
    'Kedar is the raga of evening devotion — temple bells at dusk, the day\'s complexity ' +
    'dissolving into the simplicity of prayer. Its most remarkable feature is the dual Ma: ' +
    'tivra Ma rises in the aroha with a quality of aspiration (the Kalyan lift), while ' +
    'shuddha Ma settles in the avaroha with earthly warmth. This single duality gives ' +
    'Kedar its character — the interplay between the elevated and the grounded, between ' +
    'seeking and arriving. Pa is the vadi, and the raga returns to Pa repeatedly with the ' +
    'quality of a refrain, a devotional anchor. The vakra avaroha, with its characteristic ' +
    'Pa-Ma-Pa-Dha-Pa-Ma turn, creates a spiraling quality as though the raga is reluctant ' +
    'to leave each register. Kedar is beloved for bhajan and devotional singing, and many ' +
    'of the most famous devotional compositions in Hindustani music are set in this raga.',

  westernBridge:
    'Western listeners may notice elements of both the Lydian mode (tivra Ma in ascent) ' +
    'and the Ionian/major (shuddha Ma in descent), but the dual Ma treatment and the ' +
    'vakra avaroha have no Western counterpart.',

  relatedRagas: ['hameer', 'yaman', 'kedar_nat', 'kamod'],

  gharanaVariations:
    'Gwalior gharana has a strong Kedar tradition with structured bandish presentations. ' +
    'Kirana gharana explores the dual Ma relationship with extended meend between the two ' +
    'Ma forms. Jaipur-Atrauli presents Kedar with precise articulation of the vakra phrases. ' +
    'The raga is extremely popular for bhajan across all traditions — Mirabai\'s compositions ' +
    'are frequently set in Kedar.',
};
