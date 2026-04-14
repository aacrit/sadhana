/**
 * @module engine/theory/ragas/bhimpalasi
 *
 * Raga Bhimpalasi (also: Bhimpalas) — the raga of the late afternoon,
 * when shadows lengthen and the day's intensity begins to yield.
 *
 * Bhimpalasi belongs to the Kafi thaat, using komal Ga and komal Ni.
 * It is an audava-sampoorna raga: the aroha (ascent) omits Re and Dha,
 * using only five swaras, while the avaroha (descent) uses all seven.
 * This asymmetry gives Bhimpalasi its distinctive quality — ascending
 * in broad strokes, descending with detailed, step-by-step expression.
 *
 * Ma is the vadi — the note that receives the most emphasis and around
 * which the raga's emotional gravity revolves. The phrase Ni(k)-Sa-Ga(k)-Ma
 * is the raga's signature: a rising arc from the lower register that
 * arrives on Ma with a quality of deep devotion.
 *
 * Thaat: Kafi
 * Time: Late afternoon (3rd and 4th prahar)
 * Rasa: Karuna (pathos), Shringar (devotion)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Bhimpalasi — complete musicological definition.
 *
 * Aroha: N(k) S g m P N(k) S'
 *   (Re and Dha omitted in ascent — audava)
 *
 * Avaroha: S' N(k) D P m g R S
 *   (All seven swaras present — sampoorna)
 *
 * Vadi: Ma (the fourth — the raga's gravitational centre)
 * Samvadi: Sa (the tonic — consonant with Ma at a perfect fourth)
 */
export const bhimpalasi: Raga = {
  id: 'bhimpalasi',
  name: 'Bhimpalasi',
  nameDevanagari: 'भीमपलासी',
  thaat: 'kafi',

  aroha: [
    n('Ni_k', 'mandra'),
    n('Sa', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma', 'madhya'),
    n('Pa', 'madhya'),
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
    aroha: 'audava',
    avaroha: 'sampoorna',
  },

  vadi: 'Ma',
  samvadi: 'Sa',
  anuvadi: ['Ga_k', 'Pa', 'Ni_k', 'Re', 'Dha'],
  varjit: ['Re_k', 'Ga', 'Ma_t', 'Dha_k', 'Ni'],

  pakad: [
    // Ni(k) Sa Ga(k) Ma — the signature ascending arc
    [n('Ni_k', 'mandra'), n('Sa', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya')],
    // Ma Pa Ni(k) Dha Pa — ascending through the upper register
    [n('Ma', 'madhya'), n('Pa', 'madhya'), n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma Ga(k) Re Sa — the characteristic descent
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Ma Ga(k) Ma Pa — the turn around Ma
    [n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Ga(k) Ma Ga(k) Re Sa — descent from the emotional centre
    [n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [3, 4],

  rasa: ['karuna', 'shringar'],

  ornaments: ['meend', 'kan', 'gamak', 'murki'],

  description:
    'Bhimpalasi is the raga of late afternoon — the sun past its zenith, the world ' +
    'softening into golden light, the first hint of evening coolness. Its character ' +
    'is devotional and tender, with a depth that can shade into melancholy without ' +
    'ever becoming heavy. Ma is the vadi, and the way a musician approaches Ma — ' +
    'through the signature phrase Ni(k)-Sa-Ga(k)-Ma, rising from the lower register ' +
    'with gathering intensity — is the heart of the raga. The komal Ga gives the ' +
    'raga its emotional depth; the komal Ni adds a quality of yearning. In descent, ' +
    'the raga opens up fully, adding Re and Dha to create a richer, more detailed ' +
    'return to Sa. This asymmetry between the spare ascent and full descent is ' +
    'Bhimpalasi\'s structural genius.',

  westernBridge:
    'Western listeners may sense something akin to a Dorian or natural minor quality from ' +
    'the komal Ga and komal Ni, but Bhimpalasi\'s identity lies in its vakra (oblique) ' +
    'movement and the emotional centrality of Ma — characteristics without Western parallel.',

  vakra: [
    // Ma-Ga(k)-Ma-Pa — the characteristic turn around Ma (descending touch before ascending)
    [n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Pa', 'madhya')],
    // Pa-Ni(k)-Dha-Pa — upper register vakra
    [n('Pa', 'madhya'), n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
  ],

  ornamentMap: {
    'Ga_k': ['meend', 'kan'],   // Ga komal receives meend from Ma and kan
    'Ma': ['gamak'],             // Ma gets gamak (oscillation) as the vadi
    'Ni_k': ['kan'],             // Ni komal gets kan when approaching Sa
    'Pa': ['meend'],             // Meend to/from Pa
  },

  relatedRagas: ['dhanashri', 'pilu', 'kafi', 'bageshri'],

  gharanaVariations:
    'Kirana gharana explores extended alap with long meend passages between Ga(k) and Ma. ' +
    'Jaipur-Atrauli gharana often emphasises the Pa-Ni(k)-Dha-Pa phrase more prominently. ' +
    'Agra gharana brings a more robust, powerful approach to the lower octave. ' +
    'The Gwalior tradition frequently presents Bhimpalasi in vilambit teentaal with ' +
    'elaborated bandish-based exposition.',
};
