/**
 * @module engine
 *
 * The Sadhana Music Engine — barrel export.
 *
 * This is the single entry point for all engine functionality.
 * It re-exports from all five engine layers:
 *
 *   physics/   — Harmonic series, just intonation, resonance
 *   theory/    — Swaras, ragas, talas, thaats, ornaments
 *   analysis/  — Pitch mapping, raga grammar, phrase recognition
 *   synthesis/ — Tanpura drone, swara playback
 *   voice/     — Voice pipeline, accuracy scoring, feedback
 *
 * Usage:
 *   import { mapPitchToSwara, VoicePipeline, TanpuraDrone } from '@/engine'
 */

// ============================================================================
// PHYSICS
// ============================================================================

export {
  // Functions
  harmonicRatio,
  octaveReducedRatio,
  partialFrequency,
  harmonicSeries,
  overtoneAmplitude,
  tanpuraPartials,
  ratioToCents,
  centsToRatio,
  beatFrequency,
} from './physics/harmonics';

export type {
  Partial,
  TanpuraStringProfile,
} from './physics/harmonics';

export {
  // Constants
  SHRUTIS,
  PRINCIPAL_SWARAS,
  UPPER_SA,
  // Functions
  shrutiToHz,
  swaraToHz,
  centsDeviation,
  nearestShruti,
  nearestSwara,
  getSwaraByName,
  getShrutiByNumber,
  shrutisForSwara,
  frequencyTable,
} from './physics/just-intonation';

export type {
  Ratio,
  Shruti,
  SwaraName,
  PrincipalSwara,
} from './physics/just-intonation';

// ============================================================================
// THEORY (re-export the theory barrel)
// ============================================================================

export {
  // Types (re-exported as values where possible)
  n,
  // Swaras
  SA, RE_K, RE, GA_K, GA, MA, MA_T, PA, DHA_K, DHA, NI_K, NI,
  SWARAS,
  SWARA_MAP,
  getSwaraBySymbol,
  getSwaraRatio,
  getSwaraFrequency,
  // Thaats
  THAATS,
  THAAT_LIST,
  findThaat,
  getRagaIdsByThaat,
  // Ragas
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
  // Ornaments
  MEEND, GAMAK, ANDOLAN, MURKI, KHATKA, ZAMZAMA, KAN, SPARSH,
  ORNAMENTS,
  ORNAMENT_LIST,
  getOrnament,
  getOrnamentsForRaga,
  getOrnamentsForSwara,
  generateMeendTrajectory,
  generateOscillationTrajectory,
  // Talas
  teentaal,
  getBolAtBeat,
  getVibhagForBeat,
  isSam,
  isKhali,
  getClapTypeForBeat,
  generateTheka,
} from './theory';

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
} from './theory';

// ============================================================================
// ANALYSIS
// ============================================================================

export {
  mapPitchToSwara,
  isValidInRaga,
  getAccuracyScore,
  isPitchCorrect,
  nearestValidSwaraInRaga,
  swaraToSwaraName,
  swaraNameToSwara,
  LEVEL_TOLERANCE,
} from './analysis/pitch-mapping';

export type {
  Level,
  PitchResult,
} from './analysis/pitch-mapping';

export {
  validatePhrase,
  checkForbiddenSwaras,
} from './analysis/raga-grammar';

export type {
  GrammarResult,
  GrammarViolation,
} from './analysis/raga-grammar';

export {
  recognizePakad,
  recognizePakadInRaga,
  pakadToSargam,
} from './analysis/phrase-recognition';

export type {
  PakadMatch,
} from './analysis/phrase-recognition';

// ============================================================================
// SYNTHESIS
// ============================================================================

export {
  TanpuraDrone,
  DEFAULT_TANPURA_CONFIG,
} from './synthesis/tanpura';

export type {
  TanpuraConfig,
} from './synthesis/tanpura';

export {
  playSwara,
  playSwaraNote,
  playPhrase,
  playPakad,
  playAroha,
  playAvaroha,
  ensureAudioReady,
} from './synthesis/swara-voice';

export type {
  PlaySwaraOptions,
  PlayPhraseOptions,
} from './synthesis/swara-voice';

// ============================================================================
// INTERACTION (Tantri)
// ============================================================================

export {
  ACCURACY_THRESHOLDS,
  SPRING_PRESETS,
  createTantriField,
  mapVoiceToStrings,
  updateFieldFromVoice,
  triggerString,
  releaseString,
  updateRagaContext,
  getVisibleStrings,
  applyLevelVisibility,
  accuracyToOpacity,
  accuracyToColor,
  stringDisplacement,
  generateStringWaveform,
} from './interaction/tantri';

export type {
  AccuracyBand,
  StringVisibility,
  TantriStringState,
  TantriField,
  TantriTimbre,
  TantriPlayEvent,
  VoiceMapResult,
} from './interaction/tantri';

// ============================================================================
// VOICE
// ============================================================================

export {
  VoicePipeline,
} from './voice/pipeline';

export type {
  VoiceEvent,
  VoicePipelineConfig,
} from './voice/pipeline';

export {
  scoreSession,
  scorePhrase,
} from './voice/accuracy';

export type {
  AccuracyScore,
  SessionStats,
} from './voice/accuracy';

export {
  generateFeedback,
  generateSilenceFeedback,
} from './voice/feedback';

export type {
  FeedbackMessage,
} from './voice/feedback';
