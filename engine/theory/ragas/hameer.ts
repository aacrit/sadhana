/**
 * @module engine/theory/ragas/hameer
 *
 * Raga Hameer (also: Hamir) — the raga of the dignified night,
 * of royal composure, of a grandeur that needs no announcement.
 *
 * Hameer belongs to the Kalyan thaat and, like Kedar, uses both
 * shuddha Ma and tivra Ma. However, its treatment of the dual Ma
 * is distinctly different: in Hameer, tivra Ma dominates the ascent
 * while shuddha Ma appears in specific phrases (particularly
 * Ma-Re-Sa) during descent. Dha is the vadi — the raga's emotional
 * centre is in the upper tetrachord — giving Hameer a more expansive,
 * dignified quality compared to Kedar's devotional intimacy.
 *
 * Hameer is a raga of the night, but it is not a raga of darkness.
 * It has the quality of lamplight in a grand hall — warm, steady,
 * full of quiet confidence.
 *
 * Thaat: Kalyan
 * Time: Night (6th and 7th prahar)
 * Rasa: Veer (dignified courage), Shant (composure)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Hameer — complete musicological definition.
 *
 * Aroha: S R G M(t) D N S'
 *   (Pa omitted in ascent — shadava. Tivra Ma is used.)
 *
 * Avaroha: S' N D P M(t) P D N D P m G R S
 *   (Vakra — shuddha Ma appears in specific descending phrases.
 *    The vakra movement around Pa-Dha-Ni is characteristic.)
 *
 * Vadi: Dha (the sixth — the raga's dignified centre)
 * Samvadi: Ga (consonant with Dha)
 *
 * Like Kedar, Hameer uses both Ma and Ma_t. The distinction:
 * Kedar orbits Pa; Hameer orbits Dha. Kedar is devotional;
 * Hameer is regal.
 */
export const hameer: Raga = {
  id: 'hameer',
  name: 'Hameer',
  nameDevanagari: 'हमीर',
  thaat: 'kalyan',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
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
    n('Pa', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha', 'madhya'),
    n('Ni', 'madhya'),
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

  vadi: 'Dha',
  samvadi: 'Ga',
  anuvadi: ['Re', 'Ma', 'Ma_t', 'Pa', 'Ni'],
  varjit: ['Re_k', 'Ga_k', 'Dha_k', 'Ni_k'],

  pakad: [
    // Sa Re Ga Ma(t) Dha — the ascending signature (Pa skipped)
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya')],
    // Dha Ni Dha Pa Ma(t) Pa — the vakra upper phrase
    [n('Dha', 'madhya'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma Ga Re Sa — descent with shuddha Ma
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ni Dha Pa Ma(t) Dha Ni Sa' — the ascending arc through Dha
    [n('Ni', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar')],
    // Ga Ma(t) Dha Ni Dha Pa Ma Ga Re Sa — extended descent
    [n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [6, 7],

  rasa: ['veer', 'shant'],

  ornaments: ['meend', 'kan', 'gamak', 'murki'],

  description:
    'Hameer is the raga of the dignified night — a king at rest, not in ceremony but in ' +
    'the quiet confidence of his own hall. Like Kedar, it uses both shuddha and tivra Ma, ' +
    'but where Kedar orbits Pa with devotional warmth, Hameer orbits Dha with regal ' +
    'composure. The vadi Dha sits in the upper tetrachord, giving the raga an expansive, ' +
    'elevated quality. Pa is characteristically skipped in the aroha — the raga leaps from ' +
    'Ma(t) to Dha, bypassing Pa with an aristocratic disdain for the obvious path. In descent, ' +
    'the vakra movement around Pa-Dha-Ni creates a spiraling quality, as though the raga is ' +
    'surveying its domain from multiple vantage points. Shuddha Ma appears in the descending ' +
    'phrase Pa-Ma-Ga-Re-Sa, providing a grounding contrast to the tivra Ma of the ascent.',

  westernBridge:
    'Western listeners may recognise the Lydian quality of the tivra Ma in ascent, but the ' +
    'dual Ma treatment, the vakra avaroha, and the skip of Pa in the aroha create a melodic ' +
    'framework that transcends any single Western mode.',

  relatedRagas: ['kedar', 'yaman', 'kamod', 'shuddha_kalyan'],

  gharanaVariations:
    'Agra gharana has a commanding Hameer tradition with powerful alap and forceful bandish. ' +
    'Gwalior gharana presents Hameer with balanced structural clarity. Kirana gharana ' +
    'explores the Dha-Ni relationship with extended meend. Jaipur-Atrauli presents the ' +
    'vakra phrases with characteristic precision. Ustad Amir Khan\'s recordings of Hameer ' +
    'are considered definitive for their meditative depth.',
};
