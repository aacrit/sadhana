/**
 * @module engine/theory/ragas/hamsadhwani
 *
 * Raga Hamsadhwani — the raga of the swan's call, of auspicious beginnings,
 * of a brightness so pure it feels like an invocation.
 *
 * Hamsadhwani is a pentatonic (audava) raga that uses Sa, Re, Ga, Pa, and Ni —
 * omitting both Ma and Dha. This particular omission creates a scale of
 * extraordinary brightness and forward momentum, each swara seeming to
 * propel the melody upward.
 *
 * Originally a Carnatic raga (created by the South Indian composer
 * Ramaswami Dikshitar), Hamsadhwani has been enthusiastically adopted
 * into Hindustani practice. Its name means "the cry of the swan" —
 * the hamsa being a symbol of spiritual discernment in Indian philosophy.
 *
 * Thaat: Bilawal (all shuddha swaras used)
 * Time: Evening, any auspicious occasion (5th prahar)
 * Rasa: Adbhut (wonder), Shringar (beauty)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Hamsadhwani — complete musicological definition.
 *
 * Aroha: S R G P N S'
 *   (Ma and Dha omitted — audava)
 *
 * Avaroha: S' N P G R S
 *   (Ma and Dha omitted — audava)
 *
 * Vadi: Ga (the third — the raga's luminous centre)
 * Samvadi: Ni (the seventh — consonant with Ga)
 *
 * The omission of Ma and Dha creates wider intervals that give the
 * raga its characteristic buoyancy and ascending energy.
 */
export const hamsadhwani: Raga = {
  id: 'hamsadhwani',
  name: 'Hamsadhwani',
  nameDevanagari: 'हंसध्वनि',
  thaat: 'bilawal',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
    n('Ga', 'madhya'),
    n('Pa', 'madhya'),
    n('Ni', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni', 'madhya'),
    n('Pa', 'madhya'),
    n('Ga', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'audava',
    avaroha: 'audava',
  },

  vadi: 'Ga',
  samvadi: 'Ni',
  anuvadi: ['Re', 'Pa'],
  varjit: ['Re_k', 'Ga_k', 'Ma', 'Ma_t', 'Dha_k', 'Dha', 'Ni_k'],

  pakad: [
    // Sa Re Ga Pa Ni Sa' — the brilliant ascending sweep
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Pa', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar')],
    // Ga Re Ga Pa Ni Pa Ga — the characteristic turn through upper register
    [n('Ga', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Pa', 'madhya'), n('Ni', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya')],
    // Ni Pa Ga Re Sa — the bright descent
    [n('Ni', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ga Pa Ni Sa' Ni Pa Ga — the soaring upper phrase
    [n('Ga', 'madhya'), n('Pa', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Pa', 'madhya'), n('Ga', 'madhya')],
  ],

  prahara: [5],

  rasa: ['adbhut', 'shringar'],

  ornaments: ['kan', 'murki', 'meend'],

  description:
    'Hamsadhwani is the raga of the swan\'s cry — an auspicious sound, a beginning ' +
    'filled with promise. With five shuddha swaras and the omission of both Ma and Dha, ' +
    'it creates a pentatonic scale of extraordinary brightness and forward energy. Where ' +
    'Bhoopali (which also omits two swaras) has a settling, dusk-like quality, Hamsadhwani ' +
    'is all ascent — each swara propels the melody upward, as if the scale itself is taking ' +
    'flight. Ga is the vadi, and the phrase Ga-Pa-Ni-Sa\' has a soaring quality that ' +
    'justifies the raga\'s avian name. Originally from the Carnatic tradition, Hamsadhwani ' +
    'has been warmly adopted in Hindustani music for its beauty and its association with ' +
    'auspicious occasions — concerts often begin with this raga.',

  westernBridge:
    'Western listeners may find Hamsadhwani uniquely accessible — its all-shuddha, ' +
    'pentatonic structure has a brightness that transcends cultural boundaries, though ' +
    'its specific phrase patterns and the Ga-Ni emphasis give it a character distinct ' +
    'from any Western pentatonic usage.',

  relatedRagas: ['bhoopali', 'shuddha_kalyan', 'bilawal'],

  gharanaVariations:
    'As a relatively recent adoption from Carnatic music, Hamsadhwani does not have ' +
    'deep gharana-specific variations in the Hindustani tradition. However, Pt. Ravi ' +
    'Shankar\'s sitar renditions helped establish its Hindustani identity. Vocalists ' +
    'across traditions use it as an auspicious opening raga. In the Carnatic tradition, ' +
    'it is attributed to Ramaswami Dikshitar (father of Muthuswami Dikshitar) and has ' +
    'a more extensive compositional repertoire.',
};
