/**
 * @module engine/theory/ragas/malkauns
 *
 * Raga Malkauns (also: Malkosh) — the raga of the deepest night,
 * of meditation, of a darkness so complete it becomes luminous.
 *
 * Malkauns is a pentatonic (audava) raga using only five swaras:
 * Sa, Ga_k, Ma, Dha_k, Ni_k. Both Re and Pa are entirely absent.
 * All three vikrit swaras are komal — a maximum of flatness that
 * gives the raga its extraordinarily deep, dark, meditative quality.
 *
 * Despite — or because of — its limited palette, Malkauns is one
 * of the most powerful and atmospheric ragas in the Hindustani system.
 * Its pentatonic structure means every interval is wider than a step,
 * and the spaces between swaras become as important as the swaras
 * themselves.
 *
 * Thaat: Bhairavi
 * Time: Late night, deep midnight (7th prahar)
 * Rasa: Shant (profound peace), Veer (quiet strength)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Malkauns — complete musicological definition.
 *
 * Aroha: S g m d n S'
 *   (Audava — five swaras. Re and Pa omitted.)
 *
 * Avaroha: S' n d m g S
 *   (Audava — five swaras. Re and Pa omitted.)
 *
 * Vadi: Ma (the fourth — the raga's gravitational centre)
 * Samvadi: Sa (consonant with Ma)
 *
 * CRITICAL: Both Re and Pa are varjit (forbidden). This double omission,
 * combined with all-komal vikrit swaras, is unique to Malkauns and
 * defines its dark, meditative character.
 */
export const malkauns: Raga = {
  id: 'malkauns',
  name: 'Malkauns',
  nameDevanagari: 'मालकौंस',
  thaat: 'bhairavi',

  aroha: [
    n('Sa', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Ni_k', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni_k', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Ma', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'audava',
    avaroha: 'audava',
  },

  vadi: 'Ma',
  samvadi: 'Sa',
  anuvadi: ['Ga_k', 'Dha_k', 'Ni_k'],
  varjit: ['Re', 'Re_k', 'Ga', 'Ma_t', 'Pa', 'Dha', 'Ni'],

  pakad: [
    // Sa Ma Ga(k) Ma — the meditative opening, dwelling on Ma
    [n('Sa', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya')],
    // Ma Dha(k) Ni(k) Dha(k) Ma — the upper phrase
    [n('Ma', 'madhya'), n('Dha_k', 'madhya'), n('Ni_k', 'madhya'), n('Dha_k', 'madhya'), n('Ma', 'madhya')],
    // Ni(k) Dha(k) Ma Ga(k) Sa — full descent
    [n('Ni_k', 'madhya'), n('Dha_k', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Sa', 'madhya')],
    // Ga(k) Ma Dha(k) Ni(k) Sa' — full ascent to taar Sa
    [n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Dha_k', 'madhya'), n('Ni_k', 'madhya'), n('Sa', 'taar')],
    // Dha(k) Ma Ga(k) Ma Ga(k) Sa — the winding descent through Ma
    [n('Dha_k', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [7],

  rasa: ['shant', 'veer'],

  ornaments: ['meend', 'gamak', 'kan', 'andolan'],

  description:
    'Malkauns is the raga of the deepest night — past midnight, past even the ache of ' +
    'Bageshri, into a stillness so complete that sound itself seems to emerge from silence. ' +
    'With only five swaras — all of them either achala (Sa) or komal (Ga_k, Dha_k, Ni_k) ' +
    'or shuddha (Ma) — and with both Re and Pa absent, Malkauns creates a tonal world of ' +
    'extraordinary darkness and depth. There is no perfect fifth to provide harmonic rest; ' +
    'there is no second to create stepwise motion from Sa. Instead, the raga leaps from Sa ' +
    'directly to Ga_k, and from Ma directly to Dha_k, and these wide intervals become ' +
    'spaces of contemplation. Ma is the vadi — the centre of gravity — and the phrase ' +
    'Sa-Ma-Ga(k)-Ma is the raga\'s signature: a slow circling of the fourth that feels ' +
    'like a mantra. Malkauns is associated with meditation, with inner strength, and ' +
    'traditionally with the invocation of power.',

  westernBridge:
    'Western listeners may notice a resemblance to a minor pentatonic scale (though with ' +
    'different intervals), but Malkauns\'s identity is defined by its specific phrase patterns, ' +
    'the weight given to Ma, and its association with the deepest hours of night — ' +
    'characteristics that transcend scale comparison.',

  relatedRagas: ['chandrakauns', 'bhairavi', 'hindolam'],

  gharanaVariations:
    'Agra gharana presents Malkauns with commanding power in the lower octave, using ' +
    'forceful gamak on Ma. Kirana gharana (notably Pt. Bhimsen Joshi) explores extended ' +
    'meend between Ga(k) and Ma with profound emotional depth. Gwalior tradition favours ' +
    'structured bandish presentations with rhythmic clarity. Pt. Nikhil Banerjee\'s sitar ' +
    'renditions of Malkauns are considered among the finest instrumental interpretations.',

  // Ma tuning: Malkauns omits Pa entirely. The tanpura uses Ma as the ground
  // string — the vadi of the raga and the dominant harmonic reference point.
  tanpuraTuning: 'Ma',
};
