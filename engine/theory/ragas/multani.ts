/**
 * @module engine/theory/ragas/multani
 *
 * Raga Multani — the raga of the burning afternoon, of intense midday heat,
 * of an austerity that burns away everything inessential.
 *
 * Multani belongs to the Todi thaat family and shares Todi's four altered
 * swaras (Re_k, Ga_k, Ma_t, Dha_k), but with a different melodic personality.
 * Where Todi is contemplative and chromatic, Multani is more direct and
 * dramatic. The aroha omits Re and Dha entirely, creating a leaping, angular
 * ascent (Sa Ga_k Ma_t Pa Ni Sa') that captures the harshness of the
 * afternoon sun.
 *
 * Thaat: Todi
 * Time: Afternoon (3rd–4th prahar)
 * Rasa: Karuna (pathos), Veer (austere strength)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Multani — complete musicological definition.
 *
 * Aroha: S g M(t) P N S'
 *   (Re and Dha omitted — audava)
 *
 * Avaroha: S' N D(k) P M(t) g r S
 *   (All seven swaras — sampoorna, with Re_k, Ga_k, Dha_k)
 *
 * Vadi: Ma_t (the tivra fourth — the raga's burning centre)
 * Samvadi: Sa (consonant with Ma_t at a tritone, resolved by context)
 */
export const multani: Raga = {
  id: 'multani',
  name: 'Multani',
  nameDevanagari: 'मुलतानी',
  thaat: 'todi',

  aroha: [
    n('Sa', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Pa', 'madhya'),
    n('Ni', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni', 'madhya'),
    n('Dha_k', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma_t', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Re_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'audava',
    avaroha: 'sampoorna',
  },

  vadi: 'Ma_t',
  samvadi: 'Sa',
  anuvadi: ['Ga_k', 'Pa', 'Dha_k', 'Ni', 'Re_k'],
  varjit: ['Re', 'Ga', 'Ma', 'Dha', 'Ni_k'],

  pakad: [
    // Ga(k) Ma(t) Pa Ni — the leaping ascent, skipping Re and Dha
    [n('Ga_k', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya'), n('Ni', 'madhya')],
    // Pa Ma(t) Ga(k) Re(k) Sa — the chromatic descent
    [n('Pa', 'madhya'), n('Ma_t', 'madhya'), n('Ga_k', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Ni Dha(k) Pa Ma(t) Ga(k) — upper descent through Dha(k)
    [n('Ni', 'madhya'), n('Dha_k', 'madhya'), n('Pa', 'madhya'), n('Ma_t', 'madhya'), n('Ga_k', 'madhya')],
    // Sa Ga(k) Ma(t) Pa — the stark opening
    [n('Sa', 'madhya'), n('Ga_k', 'madhya'), n('Ma_t', 'madhya'), n('Pa', 'madhya')],
  ],

  prahara: [3, 4],

  rasa: ['karuna', 'veer'],

  ornaments: ['meend', 'gamak', 'kan', 'andolan'],

  description:
    'Multani is the raga of the fierce afternoon — the sun at its zenith, shadows ' +
    'retreating, the world reduced to essential forms by the intensity of light. It shares ' +
    'Todi\'s four altered swaras but deploys them with a very different strategy: the audava ' +
    'aroha omits Re and Dha entirely, creating angular leaps (Sa to Ga_k, Ma_t to Pa, Pa to ' +
    'Ni) that give the ascent a dramatic, almost austere quality. Ma_t is the vadi — the ' +
    'raga burns on this swara, lingering with an intensity that captures the relentless heat ' +
    'of midday. The sampoorna avaroha reveals Dha_k and Re_k only in descent, adding ' +
    'chromatic depth to the return journey. Multani is powerful and direct where Todi is ' +
    'subtle and chromatic — the same swara material, but a completely different emotional ' +
    'architecture.',

  westernBridge:
    'Western listeners may hear echoes of the harmonic minor scale in Multani\'s leaping ' +
    'intervals, but the specific combination of komal Re, komal Ga, tivra Ma, and komal Dha ' +
    'creates a tonal world without Western parallel.',

  relatedRagas: ['todi', 'gurjari_todi', 'madhuvanti'],

  gharanaVariations:
    'Agra gharana presents Multani with commanding power, emphasising the stark leaps of ' +
    'the audava aroha. Jaipur-Atrauli gharana distinguishes carefully between Multani and ' +
    'Todi through precise phrasing differences. Kirana gharana explores the emotional depth ' +
    'of the Ga_k-Ma_t relationship with extended meend. The afternoon timing of Multani ' +
    'versus the morning timing of Todi is a key distinguishing factor in practice.',
};
