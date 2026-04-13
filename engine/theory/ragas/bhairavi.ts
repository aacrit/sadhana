/**
 * @module engine/theory/ragas/bhairavi
 *
 * Raga Bhairavi — the queen of ragas, the raga of completeness,
 * traditionally performed as the concluding raga of a concert.
 *
 * Bhairavi is extraordinary because it is simultaneously the most
 * rule-bound and the most permissive raga in Hindustani music. In its
 * shuddha (pure) form, it uses all komal swaras: Re_k, Ga_k, Dha_k, Ni_k
 * (Ma and Pa remain shuddha, Sa is achala). But in practice, Bhairavi
 * allows all 12 chromatic swaras as passing tones — shuddha Re, Ga, Dha,
 * and Ni, as well as tivra Ma, may appear as ornamental touches.
 *
 * This permissiveness gives Bhairavi its reputation as the raga that
 * encompasses all ragas — a fitting conclusion to any concert.
 *
 * Thaat: Bhairavi
 * Time: Morning (but performed at any time as a concluding raga)
 * Rasa: Karuna (compassion), Shringar (devotion), Bhakti (spiritual love)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Bhairavi — complete musicological definition.
 *
 * Aroha: S r g m P d n S'
 *   (Sampoorna — all komal: Re_k, Ga_k, Dha_k, Ni_k)
 *
 * Avaroha: S' n d P m g r S
 *   (Sampoorna — all komal)
 *
 * Vadi: Ma (the fourth — the emotional centre)
 * Samvadi: Sa (consonant with Ma)
 *
 * SPECIAL: Bhairavi allows all 12 swaras as "passing" (sparsha) tones.
 * The shuddha forms of Re, Ga, Dha, Ni and tivra Ma may appear briefly
 * as ornamental touches, but the raga's skeleton is all-komal.
 */
export const bhairavi: Raga = {
  id: 'bhairavi',
  name: 'Bhairavi',
  nameDevanagari: 'भैरवी',
  thaat: 'bhairavi',

  aroha: [
    n('Sa', 'madhya'),
    n('Re_k', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Ni_k', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni_k', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Re_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'sampoorna',
    avaroha: 'sampoorna',
  },

  vadi: 'Ma',
  samvadi: 'Sa',
  anuvadi: ['Re_k', 'Ga_k', 'Pa', 'Dha_k', 'Ni_k'],
  // Bhairavi's varjit is empty in the strictest sense because all 12
  // swaras are permitted as passing tones. However, the shuddha/tivra
  // forms are ornamental, not structural.
  varjit: [],

  pakad: [
    // Sa Re(k) Ga(k) Ma — the tender ascending opening
    [n('Sa', 'madhya'), n('Re_k', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya')],
    // Ma Pa Dha(k) Ni(k) Dha(k) Pa — the upper register phrase
    [n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha_k', 'madhya'), n('Ni_k', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya')],
    // Ga(k) Ma Ga(k) Re(k) Sa — the characteristic descent to Sa
    [n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Pa Ma Ga(k) Re(k) Sa — the full lower descent
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Dha(k) Ni(k) Sa' Ni(k) Dha(k) Pa Ma — extended descent from taar Sa
    [n('Dha_k', 'madhya'), n('Ni_k', 'madhya'), n('Sa', 'taar'), n('Ni_k', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya')],
  ],

  prahara: [1, 2],

  rasa: ['karuna', 'shringar'],

  ornaments: ['meend', 'kan', 'murki', 'khatka', 'gamak', 'andolan'],

  description:
    'Bhairavi is called the queen of ragas — she is the last to perform, the one who ' +
    'closes the concert, the raga that contains within itself the seed of every other raga. ' +
    'In its pure form, every vikrit swara is komal: Re, Ga, Dha, Ni are all flattened, ' +
    'creating a scale of extraordinary tenderness and depth. Yet Bhairavi is also the most ' +
    'permissive raga — all 12 chromatic swaras may appear as sparsha (touching) tones, ' +
    'giving the musician a palette as wide as the entire chromatic spectrum. Ma is the vadi, ' +
    'and the phrase Ga(k)-Ma-Ga(k)-Re(k)-Sa, with its gentle rocking between Ga(k) and Ma, ' +
    'is one of the most recognisable and beloved passages in all of Hindustani music. ' +
    'Bhairavi is performed in every form — khayal, thumri, dadra, bhajan, ghazal — and ' +
    'each form reveals a different facet of its inexhaustible personality.',

  westernBridge:
    'Western listeners may hear a resemblance to the Phrygian mode (with its lowered second ' +
    'and third), but Bhairavi\'s permissiveness — allowing all 12 tones as passing notes — ' +
    'and its cultural role as the concluding raga have no Western equivalent.',

  relatedRagas: ['bhairav', 'malkauns', 'bilaskhani_todi', 'sindhu_bhairavi'],

  gharanaVariations:
    'Every gharana has a deep Bhairavi tradition. Kirana gharana (Kishori Amonkar, ' +
    'Abdul Karim Khan) explores extraordinarily slow, meditative alap. Jaipur-Atrauli ' +
    'presents Bhairavi with precise, structured elaboration. The Lucknow and Benares ' +
    'thumri traditions render Bhairavi with elaborate romantic expression. Pt. Kumar ' +
    'Gandharva\'s Bhairavi is noted for its innovative use of folk elements. In the ' +
    'Agra tradition, Bhairavi receives a majestic, powerful treatment.',
};
