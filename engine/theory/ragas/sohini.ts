/**
 * @module engine/theory/ragas/sohini
 *
 * Raga Sohini (also: Sohani) — the raga of the late night's tenderness,
 * of a beauty that is light, delicate, and luminous despite the hour.
 *
 * Sohini belongs to the Marwa thaat and shares Marwa's radical omission
 * of Pa. But where Marwa is heavy, austere, and full of unresolved tension,
 * Sohini is light, graceful, and almost playful. This contrast — same thaat,
 * opposite character — is one of the most instructive examples of how a
 * raga's identity transcends its scale.
 *
 * The lightness of Sohini comes from its emphasis on the upper tetrachord
 * and its characteristic use of meend and quick ornaments. Dha is the vadi,
 * and the raga's most beautiful phrases occur in the Dha-Ni-Sa' region.
 *
 * Thaat: Marwa
 * Time: Late night, approaching dawn (7th and 8th prahar)
 * Rasa: Shringar (delicate beauty), Shant (luminous peace)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Sohini — complete musicological definition.
 *
 * Aroha: S r G M(t) D N S'
 *   (Pa omitted — shadava)
 *
 * Avaroha: S' N D M(t) G r S
 *   (Pa omitted — shadava)
 *
 * Vadi: Dha (the sixth — the raga's luminous centre)
 * Samvadi: Ga (consonant with Dha)
 *
 * CRITICAL: Pa is varjit (forbidden), same as Marwa.
 * But unlike Marwa's heaviness, Sohini treats the absent Pa with
 * lightness — the leap from Ma(t) to Dha is graceful rather than dramatic.
 */
export const sohini: Raga = {
  id: 'sohini',
  name: 'Sohini',
  nameDevanagari: 'सोहनी',
  thaat: 'marwa',

  aroha: [
    n('Sa', 'madhya'),
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
    n('Re_k', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'shadava',
    avaroha: 'shadava',
  },

  vadi: 'Dha',
  samvadi: 'Ga',
  anuvadi: ['Re_k', 'Ma_t', 'Ni'],
  varjit: ['Re', 'Ga_k', 'Ma', 'Pa', 'Dha_k', 'Ni_k'],

  pakad: [
    // Ga Ma(t) Dha Ni Sa' — the ascending arc to taar Sa
    [n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar')],
    // Sa' Ni Dha Ma(t) Ga — the graceful descent
    [n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya')],
    // Dha Ni Dha Ma(t) Ga Re(k) Sa — the full descent from Dha
    [n('Dha', 'madhya'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
    // Re(k) Ga Ma(t) Dha — ascending through the lower register
    [n('Re_k', 'madhya'), n('Ga', 'madhya'), n('Ma_t', 'madhya'), n('Dha', 'madhya')],
    // Ni Dha Ma(t) Ga Re(k) Sa — settling phrase
    [n('Ni', 'madhya'), n('Dha', 'madhya'), n('Ma_t', 'madhya'), n('Ga', 'madhya'), n('Re_k', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [7, 8],

  rasa: ['shringar', 'shant'],

  ornaments: ['meend', 'kan', 'murki', 'khatka'],

  description:
    'Sohini is the raga of the late night\'s delicate beauty — not the heavy darkness of ' +
    'Darbari or the meditative depth of Malkauns, but a luminous, almost jewel-like quality ' +
    'that suggests the first distant intimation of dawn. It shares the Marwa thaat\'s radical ' +
    'omission of Pa, but where Marwa treats this absence with austere gravity, Sohini treats ' +
    'it with lightness and grace. The leap from Ma(t) to Dha is effortless, almost playful, ' +
    'and the raga\'s characteristic ornaments — quick murkis and delicate kans — give it a ' +
    'sparkling quality. Dha is the vadi, and the most beautiful phrases in Sohini occur in ' +
    'the upper register, where Dha-Ni-Sa\' creates an arc of luminous aspiration. Sohini is ' +
    'often taught in contrast to Marwa precisely because they share the same scale but ' +
    'embody opposite emotional worlds.',

  westernBridge:
    'Western listeners will find the same scalar structure as Marwa (no direct modal equivalent), ' +
    'but Sohini\'s light, ornamental treatment creates a character more reminiscent of certain ' +
    'Baroque ornamental practices — quick grace notes and scalar runs — though the underlying ' +
    'harmonic framework is entirely Indian.',

  relatedRagas: ['marwa', 'puriya', 'basant'],

  gharanaVariations:
    'Jaipur-Atrauli gharana excels in Sohini with precise, ornamental taan patterns ' +
    'that suit the raga\'s light character. Kirana gharana explores extended meend on Dha ' +
    'with a more contemplative approach. Agra gharana brings a slightly weightier treatment, ' +
    'drawing out the contrast with Marwa. Pt. Jasraj\'s recordings of Sohini are noted for ' +
    'their balance of precision and emotional warmth.',
};
