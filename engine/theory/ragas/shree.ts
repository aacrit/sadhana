/**
 * @module engine/theory/ragas/shree
 *
 * Raga Shree (also: Sri) — the raga of majestic evening, of regal gravity,
 * of a dignity that carries the weight of centuries.
 *
 * Shree is one of the most ancient and revered ragas of Hindustani music,
 * belonging to the Poorvi thaat. It combines komal Re, tivra Ma, and komal
 * Dha — creating a scale of profound seriousness and grandeur. The emphasis
 * on Re (shuddha, despite the thaat using Re_k) and Pa gives the raga a
 * quality of measured, stately movement.
 *
 * Note: Shree uses shuddha Re as a prominent swara alongside komal Re —
 * both forms appear, with shuddha Re as vadi. This duality is a defining
 * characteristic.
 *
 * Thaat: Poorvi
 * Time: Evening, early night (5th prahar)
 * Rasa: Veer (majesty), Shant (gravitas)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Shree — complete musicological definition.
 *
 * Aroha: S R M(t) P D(k) N S'
 *   (Ga omitted — shadava. Re shuddha used in ascent.)
 *
 * Avaroha: S' N D(k) P M(t) R G R S
 *   (Vakra: R G R in descent. Sampoorna with vakra.)
 *
 * Vadi: Re (the shuddha second — the anchor of majesty)
 * Samvadi: Pa (consonant with Re)
 *
 * Both Re and Re_k can appear — shuddha Re dominates, komal Re appears
 * as an ornamental touch (kan) approaching Sa.
 */
export const shree: Raga = {
  id: 'shree',
  name: 'Shree',
  nameDevanagari: 'श्री',
  thaat: 'poorvi',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
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
    n('Re', 'madhya'),
    n('Ga', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'shadava',
    avaroha: 'sampoorna',
  },

  vadi: 'Re',
  samvadi: 'Pa',
  anuvadi: ['Ga', 'Ma_t', 'Dha_k', 'Ni'],
  varjit: ['Re_k', 'Ga_k', 'Ma', 'Dha', 'Ni_k'],

  pakad: [
    // Re Ma(t) Pa — the majestic ascending call
    [n('Re', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma(t) Re Ga Re Sa — the definitive descent with vakra turn
    [n('Pa', 'madhya'), n('Ma_t', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Pa Dha(k) Ni Sa' Ni Dha(k) Pa — upper register phrase
    [n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
    // Re Ma(t) Pa Dha(k) Ni Sa' — the full majestic ascent
    [n('Re', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar')],
  ],

  prahara: [5],

  rasa: ['veer', 'shant'],

  ornaments: ['meend', 'gamak', 'andolan', 'kan'],

  description:
    'Shree is the raga of regal evening — the last ceremonial hour, the court settling into ' +
    'the gravity of dusk, every gesture deliberate and weighty. Belonging to the Poorvi thaat, ' +
    'it combines tivra Ma, komal Dha, and shuddha Ni to create a scale of majestic seriousness. ' +
    'Re is the vadi — not the komal Re of the parent thaat but the shuddha Re, which gives ' +
    'the raga its characteristic assertiveness. The vakra movement Re-Ga-Re in descent is ' +
    'the raga\'s signature: a brief opening to Ga that immediately returns to Re, as if ' +
    'acknowledging beauty before returning to duty. Shree is associated with the worship of ' +
    'Lakshmi and with themes of prosperity and dignity. It demands a mature, controlled ' +
    'presentation — excess ornamentation undermines its grandeur.',

  westernBridge:
    'Western listeners may notice the augmented fourth (tivra Ma) and lowered sixth (komal Dha) ' +
    'suggesting certain elements of the Lydian-Mixolydian spectrum, but Shree\'s identity ' +
    'lies in its specific phrase shapes and its quality of ceremonial gravitas.',

  relatedRagas: ['puriya_dhanashri', 'poorvi', 'marwa'],

  gharanaVariations:
    'Agra gharana presents Shree with commanding authority in the lower register, emphasising ' +
    'the Re-Ma(t)-Pa phrase with powerful gamak. Jaipur-Atrauli gharana is renowned for ' +
    'precise articulation of the vakra Re-Ga-Re turn. Kirana gharana explores the raga with ' +
    'extended andolan on Dha_k, adding emotional depth to its majesty. Pt. Jasraj\'s ' +
    'renditions of Shree are considered definitive modern interpretations.',
};
