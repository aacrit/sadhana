/**
 * Icon System -- Sadhana
 *
 * Barrel export for all icon components. Every icon speaks
 * Hindustani classical musical truth -- geometric, precise,
 * culturally grounded. Not generic glyphs decorated with
 * Indian motifs, but forms that could only exist in this tradition.
 *
 * Categories:
 *   Level icons    -- 200px hero + 48px badge (Shishya/Sadhaka/Varistha/Guru)
 *   Journey icons  -- 64px journey cards (Beginner/Explorer/Scholar/Master/Freeform)
 *   Raga icons     -- 48px raga cards (Bhairav/Yaman/Bhoopali/Bhimpalasi/Bageshri)
 *   UI icons       -- 24px navigation and actions
 */

// Level icons
export { default as ShishyaIcon } from './ShishyaIcon';
export { default as SadhakaIcon } from './SadhakaIcon';
export { default as VarishtaIcon } from './VarishtaIcon';
export { default as GuruIcon } from './GuruIcon';

// Journey icons
export { default as BeginnerIcon } from './BeginnerIcon';
export { default as ExplorerIcon } from './ExplorerIcon';
export { default as ScholarIcon } from './ScholarIcon';
export { default as MasterIcon } from './MasterIcon';
export { default as FreeformIcon } from './FreeformIcon';

// Raga icons
export { default as BhairavIcon } from './BhairavIcon';
export { default as YamanIcon } from './YamanIcon';
export { default as BhoopaliIcon } from './BhoopaliIcon';
export { default as BhimpalasIcon } from './BhimpalasIcon';
export { default as BageshriIcon } from './BageshriIcon';

// UI icons
export { default as MicIcon } from './MicIcon';
export { default as TanpuraIcon } from './TanpuraIcon';
export { default as BackIcon } from './BackIcon';
export { default as PlayIcon } from './PlayIcon';
export { default as CentsNeedle } from './CentsNeedle';

// Raga icon registry -- maps raga ID to component
export { default as RagaIconRegistry, getRagaIcon } from './RagaIconRegistry';

// Level icon registry -- maps level title to component
export { default as LevelIconRegistry, getLevelIcon } from './LevelIconRegistry';

// Journey icon registry -- maps journey ID to component
export { default as JourneyIconRegistry, getJourneyIcon } from './JourneyIconRegistry';
