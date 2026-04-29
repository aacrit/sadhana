/**
 * @module engine/theory/ragas/bageshri
 *
 * Raga Bageshri (also: Bageshree, Baageshri) — the raga of midnight
 * longing, of separation and the ache of love.
 *
 * Bageshri is a profoundly emotional raga from the Kafi thaat. Like
 * Bhimpalasi, it uses komal Ga and komal Ni, but its character is
 * entirely different — where Bhimpalasi is devotional and warm, Bageshri
 * is intimate and aching, associated with the pain of separation (viyog
 * shringar) in the deep hours of the night.
 *
 * The aroha omits Re, making the ascent audava (five notes). The avaroha
 * is sampoorna (all seven). Ma is the vadi — the emotional epicentre —
 * and the phrase Sa-Ma-Ga(k)-Ma is the unmistakable signature of Bageshri,
 * a phrase that seems to circle around Ma with an almost obsessive intensity.
 *
 * Thaat: Kafi
 * Time: Late night, midnight (7th and 8th prahar)
 * Rasa: Shringar (viyog — love in separation)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Bageshri — complete musicological definition.
 *
 * Aroha: S g m D n S'
 *   (Re omitted in ascent — audava)
 *   Note: Some traditions include a vakra touch: S g m D n D n S'
 *
 * Avaroha: S' n D P m g R S
 *   (All seven swaras — sampoorna)
 *
 * Vadi: Ma (the emotional centre — all phrases orbit Ma)
 * Samvadi: Sa (consonant with Ma at a perfect fourth)
 */
export const bageshri: Raga = {
  id: 'bageshri',
  name: 'Bageshri',
  nameDevanagari: 'बागेश्री',
  thaat: 'kafi',

  aroha: [
    n('Sa', 'madhya'),
    n('Ga_k', 'madhya'),
    n('Ma', 'madhya'),
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
    aroha: 'audava',
    avaroha: 'sampoorna',
  },

  vadi: 'Ma',
  samvadi: 'Sa',
  anuvadi: ['Ga_k', 'Dha', 'Ni_k', 'Pa', 'Re'],
  varjit: ['Re_k', 'Ga', 'Ma_t', 'Dha_k', 'Ni'],

  pakad: [
    // Sa Ma Ga(k) Ma — the defining phrase, circling Ma
    [n('Sa', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Ma', 'madhya')],
    // Ma Ga(k) Re Sa — descent from Ma
    [n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Dha Ni(k) Sa' Ni(k) Dha Pa Ma — upper register arc and descent
    [n('Dha', 'madhya'), n('Ni_k', 'madhya'), n('Sa', 'taar'), n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya')],
    // Ga(k) Ma Dha Ni(k) Dha Ma — the ascending-descending middle phrase
    [n('Ga_k', 'madhya'), n('Ma', 'madhya'), n('Dha', 'madhya'), n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Ma', 'madhya')],
    // Ni(k) Dha Pa Ma Ga(k) Re Sa — full descent
    [n('Ni_k', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga_k', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [7, 8],

  rasa: ['shringar'],

  ornaments: ['meend', 'kan', 'gamak', 'murki', 'khatka'],

  description:
    'Bageshri is the raga of the deep night — past midnight, when the world is silent ' +
    'and the heart becomes most honest. It is the raga of viyog shringar: the beauty ' +
    'of love experienced through separation, the ache of absence made luminous by memory. ' +
    'Ma is the vadi, and the phrase Sa-Ma-Ga(k)-Ma — a simple three-note turn — is ' +
    'perhaps the most emotionally concentrated moment in Hindustani music. The musician ' +
    'circles Ma like a moth around a flame: approaching, touching, retreating, returning. ' +
    'The komal Ga provides depth and shadow; the komal Ni adds a quality of restless ' +
    'longing. In ascent, the raga skips Re entirely, leaping from Sa to Ga(k) and then ' +
    'to Ma, as though too impatient for step-by-step movement. In descent, all seven ' +
    'swaras appear, and the return to Sa carries the weight of accumulated emotion.',

  westernBridge:
    'Western listeners may hear something reminiscent of a minor key with its komal Ga ' +
    'and komal Ni, but Bageshri\'s character is defined by its obsessive circling of Ma — ' +
    'a melodic behaviour with no direct Western counterpart.',

  ornamentMap: {
    'Ga_k': ['meend', 'andolan'], // Ga komal gets meend and subtle andolan
    'Ma': ['gamak'],              // Ma gets gamak as an emphasis tool
    'Dha': ['meend', 'kan'],      // Dha gets meend (vadi) and kan
    'Ni_k': ['kan'],              // Ni komal gets kan approaching Sa
  },

  relatedRagas: ['bhimpalasi', 'rageshri', 'kafi', 'pilu', 'dhanashri'],

  gharanaVariations:
    'Kirana gharana (notably Kishori Amonkar) developed an intensely emotive treatment ' +
    'of Bageshri with extended, slow meend around Ma and Ga(k). Jaipur-Atrauli gharana ' +
    'presents Bageshri with more structured, rhythmic taan patterns. Agra gharana ' +
    'emphasises the lower octave extensively. Pt. Jasraj\'s recordings of Bageshri are ' +
    'considered landmark interpretations that balance technical precision with ' +
    'extraordinary emotional depth.',

  // Ma tuning: standard practice for Bageshri (raga-scholar audit, rev 9).
  // Ma is the vadi — the emotional epicentre that every phrase orbits — so
  // the tanpura's Pa-string is replaced by Ma to put the raga's centre of
  // gravity in the drone. Confirmed against Kirana / Jaipur-Atrauli /
  // Agra performance practice.
  tanpuraTuning: 'Ma',
};
