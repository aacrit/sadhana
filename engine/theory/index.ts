/**
 * @module engine/theory
 *
 * The theory layer of the Sadhana music engine.
 *
 * This barrel export provides access to all musicological constructs:
 * types, swaras, thaats, ragas, ornaments, and talas.
 *
 * Usage:
 *   import { RAGAS, getRagaForTimeOfDay, SWARAS } from '@/engine/theory'
 */

// Types
export type {
  Swara,
  Octave,
  SwaraNote,
  SwaraDefinition,
  Ornament,
  OrnamentDefinition,
  RagaJati,
  Rasa,
  Prahara,
  Raga,
  Thaat,
  Tala,
  TalaBol,
  ClapType,
  TalaEvent,
  VibhagPosition,
} from './types';

export { n } from './types';

// Swaras
export {
  SA, RE_K, RE, GA_K, GA, MA, MA_T, PA, DHA_K, DHA, NI_K, NI,
  SWARAS,
  SWARA_MAP,
  getSwaraBySymbol,
  getSwaraRatio,
  getSwaraFrequency,
} from './swaras';

// Thaats
export {
  KALYAN, BILAWAL, KHAMAJ, BHAIRAV as BHAIRAV_THAAT, POORVI, MARWA,
  KAFI, ASAVARI, BHAIRAVI, TODI,
  THAATS,
  THAAT_LIST,
  findThaat,
  getRagasByThaat as getRagaIdsByThaat,
} from './thaats';

// Ragas
export {
  yaman, bhairav, bhoopali, bhimpalasi, bageshri,
  RAGAS,
  RAGA_LIST,
  getRagasByPrahara,
  getRagasByRasa,
  getRagasUsingSwara,
  getRagasByThaat,
  getRagaForTimeOfDay,
  getRagaById,
  getArohaCount,
  getRagaSwaras,
} from './ragas';

// Ornaments
export {
  MEEND, GAMAK, ANDOLAN, MURKI, KHATKA, ZAMZAMA, KAN, SPARSH,
  ORNAMENTS,
  ORNAMENT_LIST,
  getOrnament,
  getOrnamentsForRaga,
  getOrnamentsForSwara,
  generateMeendTrajectory,
  generateOscillationTrajectory,
} from './ornaments';

// Talas — Teentaal
export { teentaal } from './talas/teentaal';
export {
  getBolAtBeat,
  getVibhagForBeat,
  isSam,
  isKhali,
  getClapTypeForBeat,
  generateTheka,
} from './talas/teentaal';

// Talas — Ektaal
export { ektaal } from './talas/ektaal';
export {
  getBolAtBeat as ektaalGetBolAtBeat,
  getBeatPosition as ektaalGetBeatPosition,
  generateTheka as ektaalGenerateTheka,
  getVibhagForBeat as ektaalGetVibhagForBeat,
  isSam as ektaalIsSam,
  isKhali as ektaalIsKhali,
} from './talas/ektaal';

// Talas — Jhaptaal
export { jhaptaal } from './talas/jhaptaal';
export {
  getBolAtBeat as jhaptaalGetBolAtBeat,
  getBeatPosition as jhaptaalGetBeatPosition,
  generateTheka as jhaptaalGenerateTheka,
  getVibhagForBeat as jhaptaalGetVibhagForBeat,
  isSam as jhaptaalIsSam,
  isKhali as jhaptaalIsKhali,
} from './talas/jhaptaal';

// Talas — Rupak
export { rupak } from './talas/rupak';
export {
  getBolAtBeat as rupakGetBolAtBeat,
  getBeatPosition as rupakGetBeatPosition,
  generateTheka as rupakGenerateTheka,
  getVibhagForBeat as rupakGetVibhagForBeat,
  isSam as rupakIsSam,
  isKhali as rupakIsKhali,
} from './talas/rupak';
