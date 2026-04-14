/**
 * @module engine/theory/ragas/darbari_kanada
 *
 * Raga Darbari Kanada — the raga of the royal court at midnight,
 * of sovereign gravity, of a majesty so deep it borders on sorrow.
 *
 * Darbari Kanada (literally "of the court") is attributed to Tansen,
 * the legendary musician of Emperor Akbar's court. It is one of the
 * most profound and technically demanding ragas in the Hindustani
 * tradition. Its signature is the andolan (slow, deliberate oscillation)
 * on komal Ga — a treatment so specific to this raga that hearing it
 * immediately announces Darbari to any informed listener.
 *
 * The avaroha is vakra (oblique/non-linear), particularly in the
 * middle register, where the characteristic phrase Ma Pa Dha(k) Ni(k)
 * Dha(k) Pa creates a winding, majestic descent.
 *
 * Thaat: Asavari
 * Time: Late night, midnight (6th and 7th prahar)
 * Rasa: Veer (majesty/gravity), Shant (profound peace)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Darbari Kanada — complete musicological definition.
 *
 * Aroha: S R g m P d n S'
 *   (Sampoorna — all seven swaras, with Ga_k, Dha_k, Ni_k)
 *
 * Avaroha: S' d n d P m P g m R S
 *   (Vakra — the oblique descent is essential to the raga's identity)
 *
 * Vadi: Re (the second — the raga's anchor in the lower register)
 * Samvadi: Pa (consonant with Re at a perfect fourth)
 *
 * CRITICAL ORNAMENT: Andolan on Ga_k is the signature of Darbari.
 * This is not ordinary gamak — it is a slow, measured oscillation
 * spanning approximately 30-40 cents, with a deliberate gravity
 * that distinguishes Darbari from all other ragas using Ga_k.
 */
export const darbari_kanada: Raga = {
  id: 'darbari_kanada',
  name: 'Darbari Kanada',
  nameDevanagari: 'दरबारी कानड़ा',
  thaat: 'asavari',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Ni_k', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Dha_k', 'madhya'),
    n('Ni_k', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'sampoorna',
    avaroha: 'sampoorna',
  },

  vadi: 'Re',
  samvadi: 'Pa',
  anuvadi: ['Ga_k', 'Ma', 'Dha_k', 'Ni_k'],
  varjit: ['Re_k', 'Ga', 'Ma_t', 'Dha', 'Ni'],

  pakad: [
    // Sa Re Ga(k)~andolan Re Sa — the opening with andolan on Ga(k)
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ma Pa Dha(k) Ni(k) Dha(k) Pa — the vakra upper phrase
    [n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ni_k', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
    // Ga(k) Ma Re Sa — descent through the emotional centre
    [n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Pa Ma Pa Ga(k) Ma Re Sa — the winding descent with vakra movement
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Re Ga(k) Ma Pa Dha(k) Ni(k) Sa' — full ascent
    [n('Re', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ni_k', 'madhya'), n('Sa', 'taar')],
  ],

  prahara: [6, 7],

  rasa: ['veer', 'shant'],

  ornaments: ['andolan', 'meend', 'kan', 'gamak'],

  description:
    'Darbari Kanada is the raga of the midnight court — not the bustle of daytime ' +
    'governance but the quiet, weighty deliberation of a sovereign in solitude. Attributed ' +
    'to Tansen, it carries an authority that few ragas can match. Its signature is the ' +
    'andolan on komal Ga: a slow, deliberate oscillation that is not merely an ornament ' +
    'but the raga\'s very breath. This andolan is heavier and more measured than gamak, ' +
    'spanning about 30-40 cents around the komal Ga with a gravitational quality that ' +
    'pulls the listener into stillness. The avaroha is vakra — the descent winds and ' +
    'turns, particularly through the Ma-Pa-Ga(k)-Ma-Re passage, creating a sense of ' +
    'majestic reluctance, as though the raga is unwilling to relinquish each register. ' +
    'Darbari demands the deepest control and maturity. It is not a raga for haste.',

  westernBridge:
    'Western listeners may hear a resemblance to the natural minor or Aeolian mode, ' +
    'but Darbari\'s identity is inseparable from its andolan on Ga(k) and its vakra ' +
    'avaroha — microtonal and structural features that have no equivalent in Western practice.',

  vakra: [
    // Ma-Pa-Dha_k-Ni_k-Dha_k-Pa — the signature avaroha vakra
    [n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ni_k', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
  ],

  ornamentMap: {
    'Ga_k': ['andolan'],          // Ga komal receives deep andolan — THE defining ornament
    'Re': ['meend'],              // Re gets meend from Ga_k below
    'Dha_k': ['andolan', 'kan'],  // Dha komal gets andolan (mirroring Ga_k) and kan
    'Ni_k': ['kan'],              // Ni komal gets kan
  },

  relatedRagas: ['adana', 'kanada', 'nayaki_kanada', 'shahana_kanada'],

  gharanaVariations:
    'Agra gharana is the ancestral home of Darbari — Ustad Faiyaz Khan\'s recordings ' +
    'define the raga\'s grandest expression, with powerful nom-tom alap in the lower octave. ' +
    'Kirana gharana (Pt. Bhimsen Joshi, Gangubai Hangal) emphasises the andolan on Ga(k) ' +
    'with extraordinary subtlety. Jaipur-Atrauli treats the vakra phrases with precise ' +
    'rhythmic articulation. The Gwalior tradition tends toward a more accessible, ' +
    'bandish-centred presentation.',
};
