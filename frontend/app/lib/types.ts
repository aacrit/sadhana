/**
 * @module frontend/lib/types
 *
 * Frontend-specific TypeScript types for the Sadhana UI layer.
 *
 * These types describe user state, session data, and journey structures.
 * Engine types (Raga, Swara, Tala, etc.) live in @/engine/theory/types
 * and are imported directly — never duplicated here.
 */

// ---------------------------------------------------------------------------
// Journey
// ---------------------------------------------------------------------------

/** The journey entry points (four structured + freeform). */
export type JourneyId = 'beginner' | 'explorer' | 'scholar' | 'master' | 'freeform';

/** Display metadata for a journey card. */
export interface JourneyMeta {
  readonly id: JourneyId;
  readonly name: string;
  readonly nameSanskrit: string;
  readonly description: string;
  /** Whether the journey is accessible to the current user. */
  readonly accessible: boolean;
  /** Minimum level required. 0 = open to all. */
  readonly minLevel: number;
  /** Route path relative to /journeys/. */
  readonly path: string;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

/** Level title in the Shishya-to-Guru progression. */
export type LevelTitle = 'Shishya' | 'Sadhaka' | 'Varistha' | 'Guru';

/** Map a numeric level (1-10) to its title. */
export function getLevelTitle(level: number): LevelTitle {
  if (level <= 3) return 'Shishya';
  if (level <= 6) return 'Sadhaka';
  if (level <= 9) return 'Varistha';
  return 'Guru';
}

/** Map a level title to its CSS custom property. */
export function getLevelColor(level: number): string {
  const title = getLevelTitle(level);
  const map: Record<LevelTitle, string> = {
    Shishya: 'var(--level-shishya)',
    Sadhaka: 'var(--level-sadhaka)',
    Varistha: 'var(--level-varistha)',
    Guru: 'var(--level-guru)',
  };
  return map[title];
}

export interface UserProfile {
  /** Supabase user ID. */
  readonly id: string;
  /** Detected Sa frequency in Hz. Default C4 = 261.63. */
  readonly saHz: number;
  /** Level 1-10. Determines journey access and UI depth. */
  readonly level: number;
  /** Experience points — tracks consistency, not mastery. */
  readonly xp: number;
  /** Current daily streak count. */
  readonly streak: number;
  /** Longest streak ever achieved. */
  readonly longestStreak: number;
  /** Active journey path. */
  readonly journey: JourneyId | null;
  /** Current raga being practiced (raga ID or null). */
  readonly currentRaga: string | null;
  /** Last practice session timestamp, or null if never practiced. */
  readonly lastPractice: Date | null;
  /** Whether today's riyaz has been completed. */
  readonly riyazDone: boolean;
  /** Display name (optional). */
  readonly displayName?: string;
}

/** Default user profile for unauthenticated / first-time users. */
export const DEFAULT_USER: UserProfile = {
  id: '',
  saHz: 261.63,  // C4
  level: 1,
  xp: 0,
  streak: 0,
  longestStreak: 0,
  journey: null,
  currentRaga: null,
  lastPractice: null,
  riyazDone: false,
};

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface SessionData {
  /** The raga practiced in this session. */
  readonly ragaId: string;
  /** Session duration in seconds. */
  readonly duration: number;
  /** XP earned this session. */
  readonly xpEarned: number;
  /** Overall pitch accuracy (0-1). */
  readonly accuracy: number;
  /** Number of pakad phrases recognised during session. */
  readonly pakadsFound: number;
  /** Timestamp when session started. */
  readonly startedAt: Date;
  /** Timestamp when session ended. */
  readonly endedAt: Date;
}

// ---------------------------------------------------------------------------
// Practice state
// ---------------------------------------------------------------------------

/** Current state of a live practice session. */
export type PracticePhase =
  | 'preparing'     // tanpura warming up, mic check
  | 'listening'     // tanpura playing, waiting for voice
  | 'active'        // student singing, feedback live
  | 'pakad-moment'  // cinematic pakad recognition (GSAP timeline)
  | 'completing'    // session winding down
  | 'complete';     // session finished

/** Voice pipeline output consumed by visualization components. */
export interface VoiceFeedback {
  /** Detected frequency in Hz, or null if no voice. */
  readonly hz: number | null;
  /** Deviation from target swara in cents (-50 to +50). */
  readonly centsDeviation: number;
  /** The target swara the student should be singing. */
  readonly targetSwara: string;
  /** The detected swara (nearest in raga context). */
  readonly detectedSwara: string | null;
  /** Confidence of the pitch detection (0-1). */
  readonly confidence: number;
  /** Raw amplitude (0-1). */
  readonly amplitude: number;
  /** Pitch history: last 500ms of [timestamp, hz] pairs. */
  readonly pitchHistory: readonly [number, number][];
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export type ThemeMode = 'night' | 'day';

// ---------------------------------------------------------------------------
// Recently practiced
// ---------------------------------------------------------------------------

export interface RecentRaga {
  readonly ragaId: string;
  readonly ragaName: string;
  readonly lastPracticed: Date;
  readonly bestAccuracy: number;
}
