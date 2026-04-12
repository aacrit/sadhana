/**
 * @module engine/theory/thaats
 *
 * The 10 Bhatkhande Thaats — the parent scale framework of
 * Hindustani Classical Music.
 *
 * Vishnu Narayan Bhatkhande (1860-1936) organised the vast universe of
 * Hindustani ragas under 10 parent scales (thaats), each defined by a
 * unique combination of seven swaras. Every raga is assigned to the thaat
 * whose swaras most closely match its own.
 *
 * Important: a thaat is an organisational tool, not a creative one.
 * Musicians do not "play a thaat" — they play ragas. Two ragas in the
 * same thaat can sound utterly different because raga identity comes from
 * movement, emphasis, ornament, and emotion — not just the note set.
 *
 * The thaats are named after their most representative raga.
 */

import type { Swara, Thaat } from './types';

/**
 * Kalyan Thaat — all shuddha swaras except Ma tivra.
 * The Lydian-adjacent thaat. Bright, aspiring, open.
 * Parent of: Yaman, Bhoopali, Shuddha Kalyan, Hameer, Kedar.
 */
export const KALYAN: Thaat = {
  id: 'kalyan',
  name: 'Kalyan',
  nameDevanagari: 'कल्याण',
  swaras: ['Sa', 'Re', 'Ga', 'Ma_t', 'Pa', 'Dha', 'Ni'],
  description:
    'All shuddha swaras except Tivra Madhyam. The raised fourth gives this thaat ' +
    'an open, aspiring quality. Ragas of the Kalyan thaat tend toward evening ' +
    'performance and carry a sense of devotion or romantic yearning.',
  commonRagas: ['yaman', 'bhoopali', 'shuddha_kalyan', 'hameer', 'kedar'],
};

/**
 * Bilawal Thaat — all shuddha swaras (the "natural" scale).
 * The Ionian-adjacent thaat. Bright, pure, unadorned.
 * Parent of: Bilawal, Alhaiya Bilawal, Deshkar.
 */
export const BILAWAL: Thaat = {
  id: 'bilawal',
  name: 'Bilawal',
  nameDevanagari: 'बिलावल',
  swaras: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'],
  description:
    'All seven shuddha swaras — no komal, no tivra. The "natural" scale of ' +
    'Hindustani music. Ragas of this thaat have a pure, bright quality, often ' +
    'associated with morning or midday.',
  commonRagas: ['bilawal', 'alhaiya_bilawal', 'deshkar'],
};

/**
 * Khamaj Thaat — komal Ni, all others shuddha.
 * The Mixolydian-adjacent thaat. Light, folk-influenced.
 * Parent of: Khamaj, Desh, Tilak Kamod, Jhinjhoti.
 */
export const KHAMAJ: Thaat = {
  id: 'khamaj',
  name: 'Khamaj',
  nameDevanagari: 'खमाज',
  swaras: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni_k'],
  description:
    'Komal Nishad with all other swaras shuddha. This thaat has a romantic, ' +
    'light quality often associated with thumri, dadra, and folk forms. ' +
    'Many of its ragas use both Ni and komal Ni contextually.',
  commonRagas: ['khamaj', 'desh', 'tilak_kamod', 'jhinjhoti'],
};

/**
 * Bhairav Thaat — komal Re and komal Dha, all others shuddha.
 * The double-flat thaat. Grave, austere, dawn-associated.
 * Parent of: Bhairav, Jogiya, Ahir Bhairav, Nat Bhairav.
 */
export const BHAIRAV: Thaat = {
  id: 'bhairav',
  name: 'Bhairav',
  nameDevanagari: 'भैरव',
  swaras: ['Sa', 'Re_k', 'Ga', 'Ma', 'Pa', 'Dha_k', 'Ni'],
  description:
    'Komal Rishabh and komal Dhaivat with all other swaras shuddha. The symmetric ' +
    'placement of both komal swaras (Re and Dha) creates a distinctive gravity. ' +
    'Ragas of this thaat are overwhelmingly associated with dawn and carry ' +
    'an austere, meditative character.',
  commonRagas: ['bhairav', 'jogiya', 'ahir_bhairav', 'nat_bhairav', 'kalingda'],
};

/**
 * Poorvi Thaat — komal Re, komal Dha, and tivra Ma.
 * Deep tension between the lowered and raised swaras.
 * Parent of: Poorvi, Puriya Dhanashri, Paraj.
 */
export const POORVI: Thaat = {
  id: 'poorvi',
  name: 'Poorvi',
  nameDevanagari: 'पूर्वी',
  swaras: ['Sa', 'Re_k', 'Ga', 'Ma_t', 'Pa', 'Dha_k', 'Ni'],
  description:
    'Komal Rishabh, Tivra Madhyam, and komal Dhaivat. This thaat carries ' +
    'intense emotional tension — the tivra Ma pushes upward while the two komal ' +
    'swaras pull downward. Evening ragas with a searching, restless quality.',
  commonRagas: ['poorvi', 'puriya_dhanashri', 'paraj'],
};

/**
 * Marwa Thaat — komal Re, tivra Ma, no Pa emphasis.
 * Unusual, tense, sunset-associated.
 * Parent of: Marwa, Puriya, Sohini.
 */
export const MARWA: Thaat = {
  id: 'marwa',
  name: 'Marwa',
  nameDevanagari: 'मारवा',
  swaras: ['Sa', 'Re_k', 'Ga', 'Ma_t', 'Pa', 'Dha', 'Ni'],
  description:
    'Komal Rishabh and Tivra Madhyam with shuddha Dha and Ni. Many Marwa-thaat ' +
    'ragas de-emphasise or omit Pa, creating an unstable, searching quality. ' +
    'Associated with sunset — the liminal moment between day and night.',
  commonRagas: ['marwa', 'puriya', 'sohini'],
};

/**
 * Kafi Thaat — komal Ga and komal Ni, all others shuddha.
 * The Dorian-adjacent thaat. Emotional, folk-connected.
 * Parent of: Kafi, Bhimpalasi, Bageshri, Pilu, Dhanashri.
 */
export const KAFI: Thaat = {
  id: 'kafi',
  name: 'Kafi',
  nameDevanagari: 'काफी',
  swaras: ['Sa', 'Re', 'Ga_k', 'Ma', 'Pa', 'Dha', 'Ni_k'],
  description:
    'Komal Gandhar and komal Nishad with all other swaras shuddha. This thaat ' +
    'has a deep emotional character — the two komal swaras create a quality of ' +
    'pathos and longing. Many semi-classical and folk forms draw from Kafi ragas.',
  commonRagas: ['kafi', 'bhimpalasi', 'bageshri', 'pilu', 'dhanashri'],
};

/**
 * Asavari Thaat — komal Ga, komal Dha, komal Ni.
 * The natural minor-adjacent thaat. Pathos, gravity.
 * Parent of: Asavari, Darbari Kanada, Jaunpuri, Adana.
 */
export const ASAVARI: Thaat = {
  id: 'asavari',
  name: 'Asavari',
  nameDevanagari: 'आसावरी',
  swaras: ['Sa', 'Re', 'Ga_k', 'Ma', 'Pa', 'Dha_k', 'Ni_k'],
  description:
    'Three komal swaras: Gandhar, Dhaivat, and Nishad. This gives the thaat ' +
    'a heavy, contemplative quality. Ragas of this thaat often carry deep pathos ' +
    'and are associated with late night or the weight of separation.',
  commonRagas: ['asavari', 'darbari_kanada', 'jaunpuri', 'adana'],
};

/**
 * Bhairavi Thaat — all komal swaras (Re, Ga, Dha, Ni) except Ma shuddha.
 * The most-flattened thaat. Devotional, conclusive.
 * Parent of: Bhairavi, Malkauns, Bilaskhani Todi.
 */
export const BHAIRAVI: Thaat = {
  id: 'bhairavi',
  name: 'Bhairavi',
  nameDevanagari: 'भैरवी',
  swaras: ['Sa', 'Re_k', 'Ga_k', 'Ma', 'Pa', 'Dha_k', 'Ni_k'],
  description:
    'Four komal swaras: Rishabh, Gandhar, Dhaivat, and Nishad. The most "flattened" ' +
    'thaat, yet far from dark — Bhairavi ragas are among the most beloved in ' +
    'Hindustani music, often sung as the concluding raga of a concert. ' +
    'Deep devotion, acceptance, and emotional completeness.',
  commonRagas: ['bhairavi', 'malkauns', 'bilaskhani_todi'],
};

/**
 * Todi Thaat — komal Re, komal Ga, tivra Ma, komal Dha.
 * The most chromatically dense thaat. Intellectual, intense.
 * Parent of: Todi, Multani, Gujari Todi.
 */
export const TODI: Thaat = {
  id: 'todi',
  name: 'Todi',
  nameDevanagari: 'तोड़ी',
  swaras: ['Sa', 'Re_k', 'Ga_k', 'Ma_t', 'Pa', 'Dha_k', 'Ni'],
  description:
    'Three komal swaras (Re, Ga, Dha) combined with Tivra Madhyam. This creates ' +
    'a chromatically dense, intellectually demanding thaat. Todi ragas are ' +
    'considered among the most difficult and are associated with late morning. ' +
    'The contrast between the compressed lower tetrachord and the open upper ' +
    'tetrachord gives these ragas their distinctive tension.',
  commonRagas: ['todi', 'multani', 'gujari_todi'],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * All 10 Bhatkhande thaats, indexed by ID.
 */
export const THAATS: Readonly<Record<string, Thaat>> = {
  kalyan: KALYAN,
  bilawal: BILAWAL,
  khamaj: KHAMAJ,
  bhairav: BHAIRAV,
  poorvi: POORVI,
  marwa: MARWA,
  kafi: KAFI,
  asavari: ASAVARI,
  bhairavi: BHAIRAVI,
  todi: TODI,
};

/**
 * All 10 thaats as an ordered array.
 * Ordered by Bhatkhande's traditional listing.
 */
export const THAAT_LIST: readonly Thaat[] = [
  BILAWAL,
  KALYAN,
  KHAMAJ,
  BHAIRAV,
  POORVI,
  MARWA,
  KAFI,
  ASAVARI,
  BHAIRAVI,
  TODI,
] as const;

/**
 * Find which thaat a given set of swaras belongs to.
 * @param swaras - Array of 7 swaras (Sa through Ni, choosing komal/tivra variants).
 * @returns The matching Thaat, or undefined if no exact match.
 */
export function findThaat(swaras: readonly Swara[]): Thaat | undefined {
  const key = swaras.join(',');
  return THAAT_LIST.find(t => t.swaras.join(',') === key);
}

/**
 * Get all ragas listed under a given thaat.
 * @param thaatId - The thaat identifier.
 * @returns Array of raga IDs, or empty array if thaat not found.
 */
export function getRagasByThaat(thaatId: string): readonly string[] {
  return THAATS[thaatId]?.commonRagas ?? [];
}
