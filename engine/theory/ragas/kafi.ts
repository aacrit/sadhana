/**
 * @module engine/theory/ragas/kafi
 *
 * Raga Kafi — the raga of spring, of Holi colours, of playful devotion.
 *
 * Kafi is the principal raga of its thaat — the Kafi thaat is named
 * after this raga. It uses komal Ga and komal Ni, creating a scale
 * that Western listeners might loosely associate with the Dorian mode,
 * though Kafi's identity is far richer than any modal comparison.
 *
 * Kafi is a raga of enormous range: it can be deeply devotional in
 * khayal, playful and colourful in thumri and hori, and stately in
 * dhrupad. Its association with the spring festival of Holi gives
 * it a quality of joyful abandon tempered by the tenderness of
 * komal Ga.
 *
 * Thaat: Kafi
 * Time: Late morning to early afternoon
 * Rasa: Shringar (love), Hasya (playfulness)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Kafi — complete musicological definition.
 *
 * Aroha: S R g m P D n S'
 * Avaroha: S' n D P m g R S
 *
 * Both aroha and avaroha are sampoorna (all seven swaras).
 * Komal Ga and komal Ni are the defining alterations.
 *
 * Vadi: Pa (the fifth — the raga's centre of gravity)
 * Samvadi: Sa (consonant with Pa)
 *
 * Note: In practice, Kafi sometimes admits shuddha Ga and shuddha Ni
 * as occasional embellishments, particularly in lighter forms. However,
 * the core identity of the raga rests on komal Ga and komal Ni.
 */
export const kafi: Raga = {
  id: 'kafi',
  name: 'Kafi',
  nameDevanagari: 'काफी',
  thaat: 'kafi',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha', 'madhya'),
    n('Ni_k', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni_k', 'madhya'),
    n('Dha', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'sampoorna',
    avaroha: 'sampoorna',
  },

  vadi: 'Pa',
  samvadi: 'Sa',
  anuvadi: ['Re', 'Ga_k', 'Ma', 'Dha', 'Ni_k'],
  varjit: ['Re_k', 'Ga', 'Ma_t', 'Dha_k', 'Ni'],

  pakad: [
    // Sa Re Ga(k) Ma Pa — the straightforward ascending identity
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Ma Pa Dha Ma Pa — the characteristic turn around Pa
    [n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Pa Dha Ni(k) Dha Pa — upper register phrase
    [n('Pa', 'madhya'), n('Dha', 'madhya'), n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Ma Ga(k) Re Sa — the tender descent
    [n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ga(k) Ma Pa Dha Ni(k) Sa' — full ascent to taar Sa
    [n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya'), n('Dha', 'madhya'), n('Ni_k', 'madhya'), n('Sa', 'taar')],
  ],

  prahara: [2, 3],

  rasa: ['shringar', 'hasya'],

  ornaments: ['meend', 'kan', 'murki', 'khatka', 'gamak'],

  description:
    'Kafi is the raga of spring — the world in bloom, colours thrown in celebration, ' +
    'the boundary between sacred and playful dissolved in festival joy. It is the parent ' +
    'raga of the Kafi thaat, and its character perfectly embodies that thaat\'s nature: ' +
    'the komal Ga adds emotional depth and warmth, while the komal Ni provides a quality ' +
    'of gentle longing that prevents the raga from becoming merely cheerful. Pa is the ' +
    'vadi, and the way phrases orbit Pa — ascending to it with anticipation, lingering on ' +
    'it, departing reluctantly — gives Kafi its characteristic momentum. In khayal, Kafi ' +
    'can be profoundly moving; in thumri and hori, it becomes playful and colourful, the ' +
    'raga of Holi itself.',

  westernBridge:
    'Western listeners may recognise a resemblance to the Dorian mode (natural minor ' +
    'with raised sixth), but Kafi\'s identity is inseparable from its ornamental vocabulary ' +
    'and its cultural association with spring and devotional love.',

  relatedRagas: ['bhimpalasi', 'bageshri', 'pilu', 'dhanashri', 'sindhura'],

  gharanaVariations:
    'Gwalior gharana presents Kafi with a balanced, stately treatment in khayal. ' +
    'The Lucknow thumri tradition treats Kafi with elaborate bol-baant and romantic ' +
    'expression. Kirana gharana explores extended alap with slow meend on Ga(k). ' +
    'In the Benares thumri tradition, Kafi is rendered with considerable freedom, ' +
    'occasionally admitting shuddha Ga and shuddha Ni as passing touches.',
};
