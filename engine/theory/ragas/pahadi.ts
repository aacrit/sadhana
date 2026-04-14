/**
 * @module engine/theory/ragas/pahadi
 *
 * Raga Pahadi — the raga of the hills, of folk simplicity, of open
 * landscapes and uncomplicated joy.
 *
 * Pahadi is a light, folk-derived raga of the Bilawal thaat. It uses
 * all shuddha swaras in a straightforward sampoorna structure with no
 * komal or tivra alterations. Its character comes entirely from its
 * phrasing — particularly the emphasis on Sa, Re, and Pa, and the way
 * phrases move in stepwise, song-like patterns.
 *
 * Unlike Bilawal (its thaat parent), Pahadi has no strict time restriction
 * and is often classified as a "prahar-mukt" (time-free) raga. Its folk
 * origins make it accessible and universally appealing, though it lacks
 * the depth for extended classical exploration.
 *
 * Thaat: Bilawal
 * Time: Any time (prahar-mukt)
 * Rasa: Shant (contentment), Shringar (simple beauty)
 */

import type { Raga } from '../types';
import { n } from '../types';

/**
 * Raga Pahadi — complete musicological definition.
 *
 * Aroha: S R G P D S'
 *   (Ma and Ni omitted — audava, pentatonic)
 *
 * Avaroha: S' N D P M G R S
 *   (All seven swaras — sampoorna)
 *
 * Vadi: Sa (the tonic — unusually, the raga centres on Sa itself)
 * Samvadi: Pa (the fifth — the natural complement)
 *
 * Pahadi's pentatonic aroha shares notes with Bhoopali but differs
 * in emphasis: Pahadi centres on Sa and Pa, Bhoopali on Ga and Dha.
 */
export const pahadi: Raga = {
  id: 'pahadi',
  name: 'Pahadi',
  nameDevanagari: 'पहाड़ी',
  thaat: 'bilawal',

  aroha: [
    n('Sa', 'madhya'),
    n('Re', 'madhya'),
    n('Ga', 'madhya'),
    n('Pa', 'madhya'),
    n('Dha', 'madhya'),
    n('Sa', 'taar'),
  ],

  avaroha: [
    n('Sa', 'taar'),
    n('Ni', 'madhya'),
    n('Dha', 'madhya'),
    n('Pa', 'madhya'),
    n('Ma', 'madhya'),
    n('Ga', 'madhya'),
    n('Re', 'madhya'),
    n('Sa', 'madhya'),
  ],

  jati: {
    aroha: 'audava',
    avaroha: 'sampoorna',
  },

  vadi: 'Sa',
  samvadi: 'Pa',
  anuvadi: ['Re', 'Ga', 'Ma', 'Dha', 'Ni'],
  varjit: ['Re_k', 'Ga_k', 'Ma_t', 'Dha_k', 'Ni_k'],

  pakad: [
    // Sa Re Ga Re Sa — the folk-like opening
    [n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
    // Pa Dha Ni Sa' Ni Dha Pa — the upper register hill song
    [n('Pa', 'madhya'), n('Dha', 'madhya'), n('Ni', 'madhya'), n('Sa', 'taar'), n('Ni', 'madhya'), n('Dha', 'madhya'), n('Pa', 'madhya')],
    // Ga Re Sa Re Ga Pa — the ascending opening from Sa
    [n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya'), n('Re', 'madhya'), n('Ga', 'madhya'), n('Pa', 'madhya')],
    // Pa Ma Ga Re Sa — the stepwise descent home
    [n('Pa', 'madhya'), n('Ma', 'madhya'), n('Ga', 'madhya'), n('Re', 'madhya'), n('Sa', 'madhya')],
  ],

  prahara: [1, 2, 3, 4, 5, 6, 7, 8],

  rasa: ['shant', 'shringar'],

  ornaments: ['kan', 'murki', 'meend'],

  description:
    'Pahadi is the raga of open hills — the wide valleys of the Himalayas, the ' +
    'uncomplicated joy of folk song carried on mountain air. It is among the most ' +
    'accessible ragas in the Hindustani system, with all shuddha swaras and a pentatonic ' +
    'ascent that feels instantly familiar. Sa is the vadi — the raga rests on the tonic ' +
    'with a contentment that distinguishes it from Bhoopali (which shares the same pentatonic ' +
    'ascent but centres on Ga). Pahadi\'s folk origins make it time-free — it carries no ' +
    'burden of prahar restriction, no weight of raga-time doctrine. Many beloved Hindi film ' +
    'songs draw from Pahadi\'s simple, song-like phrases. Its beauty lies in its directness: ' +
    'no complex ornaments, no vakra movements, just the pure pleasure of melody.',

  westernBridge:
    'Western listeners will recognise the major pentatonic scale in the aroha and the full ' +
    'major scale in the avaroha — Pahadi is the most "familiar-sounding" raga for Western ' +
    'ears, though its identity comes from its folk phrasing patterns and Sa-Pa emphasis.',

  relatedRagas: ['bhoopali', 'bilawal', 'bhupeshwari'],

  gharanaVariations:
    'Pahadi is primarily a folk and light-classical raga, and as such it does not have ' +
    'strong gharana-specific treatments. However, it is widely used in devotional music ' +
    '(bhajan) and film music. Classical musicians sometimes use Pahadi as a lighter piece ' +
    'in a recital, often in the final movement. The raga is deeply associated with ' +
    'Himalayan folk traditions, particularly from Himachal Pradesh and Uttarakhand.',
};
