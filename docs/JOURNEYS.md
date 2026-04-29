# Journey UX Specs

Last updated: 2026-04-29

Four entry points to the same engine. Different interfaces, different depth, same musical truth.

---

## Journey Selection (Home)

Source: `frontend/app/page.tsx`

The root page shows all four journeys as cards with Framer Motion stagger animation. Ambient TanpuraViz canvas runs in the background. Header displays the Logo (full variant, 48px) and tagline.

### Journey Cards

| Journey | Sanskrit | Accessible (v1) | Min Level | Description |
|---------|----------|-----------------|-----------|-------------|
| Beginner | Shishya | Yes | 0 | Guided daily riyaz. Discover your Sa, sing with the tanpura, learn to hear the swaras. |
| Explorer | Sadhaka | Yes | 0 | Browse ragas by time and emotion. Ear training exercises. Build your phrase library. |
| Scholar | Varistha | Level-gated | 2 | Full raga grammar. Shruti analysis. Deep theory. The engine speaks to you directly. |
| Master | Guru | Level-gated | 4 | Composition. Phrase generation. Teaching tools. The engine becomes your instrument. |

Journey cards are filtered by user level via `visibleJourneys = JOURNEYS.filter(j => userLevel >= j.minLevel)`. New users (level 1) see only Beginner and Explorer. Scholar appears at level 2; Master at level 4. Scholar and Master pages show "being built" messaging when reached. All cards link to `/journeys/{id}`.

Today's raga (from `getRagaForTimeOfDay(hour)`) and streak count displayed above the grid.

### Daily Goal Ring

An SVG ring displayed on the home page shows today's riyaz completion status. The ring is empty (unfilled) until the daily riyaz is complete, then fills and applies `--accent` (saffron) color. Status text reads "Complete" when done, "Not yet — begin when ready" when pending. Driven by `profile.riyazDone`.

---

## Beginner Journey

Source: `frontend/app/journeys/beginner/page.tsx`

### Daily Loop Rituals

**Arriving moment:** On the first open of any daily riyaz lesson, a 6s cinematic overlay fires (localStorage-gated per calendar day — will not repeat). The overlay shows a sun or moon SVG glyph appropriate to the current prahara (sun for prahars 1–4, moon for 5–8), plus the prahar name in Devanagari (e.g., प्रथम प्रहर). Pure CSS animation, no audio. Fades out and gives way to the lesson. Implemented in `LessonClient.tsx`.

**Return Note warmup:** When `?warmup=[swara]` is present in the URL (set by `getYesterdayWorstSwara()` Supabase query), `useLessonEngine` injects a silent warmup phase at index 0 before the lesson's normal first phase. The warmup reuses the `pitch_exercise` phase type with the specified swara as target. Mastery condition: ±25 cents for 8 continuous seconds → auto-advances. 60s fallback auto-advance. `LessonClient.tsx` wraps the engine in `<Suspense>` for static export compatibility.

**Phase-0 re-entry:** `useLessonEngine` resets `prevPhaseIndexRef` to `-1` in both `begin()` and `exitLesson()`. This ensures the phase-audio effect re-fires for phase 0 when the student exits and re-begins a lesson (previously, the guard was never reset, silently skipping tanpura start and the Sa prompt on re-entry).

**Continue escape hatch (`tanpura_drone`):** `TanpuraDronePhase` always renders a Continue button. It appears at 0.45 opacity while `duration_s` is counting down and at full opacity when the timer completes. This prevents students from getting frozen if the timer fails (Strict Mode double-unmount, backgrounded tab, AudioContext user-gesture block).

**Continue escape hatch (`phrase_playback`):** `PhrasePlaybackPhase` Continue button is always visible (0.35 opacity mid-playback, full opacity when `allComplete`). `handleContinue` cancels the internal `timerRef` before advancing to prevent double-fires on mid-playback clicks. Previously, the button was gated behind `allComplete === true`, causing "Continue did nothing" during multi-repeat phrases.

**Tanpura ducking across phase types:** `useLessonEngine` sets tanpura gain on every phase transition via `PHASE_TANPURA_GAIN` (see `docs/AUDIO-ENGINE.md`). Full gain on `tanpura_drone`, `passive_phrase_recognition`, `session_summary`; ducked (0.35×) on all focus phases. Optional YAML field `tanpura_presence: off` silences it entirely for a phase. The tanpura is never stopped between phases.

**Phase consolidation (beginner lessons):** Aroha and avaroha are now paired into a single `phrase_playback` phase rather than presented as two separate sequential phases, matching how Hindustani teachers actually present scale movement. Phase counts after consolidation: beginner-01-bhoopali 7 phases, beginner-03-yaman 9, beginner-04-bhairav 9, beginner-05-bhimpalasi 10, beginner-06-bageshri 9.

**Prahara-aware raga picker (freeform):** In the freeform raga selector, ragas outside the current prahara are rendered at 40% opacity with a tooltip: "Traditional time: [prahara label]". On-prahara ragas render at full opacity. Opacity is visual suggestion only — all ragas remain selectable.

**Dawn gate (beginner-08-challenge):** The `dawn_gate` block in `beginner-08-challenge.yaml` requires the student to complete 3 Bhairav sessions during prahara 1 (04:00–07:00) on 3 different calendar dates. This is the gate for the Shishya → Sadhaka level unlock.

### Home View (~230 lines)

The Beginner page is a clean home view. All lessons (including Bhoopali) route to `/journeys/beginner/lessons/[id]` and are rendered by the YAML-driven `LessonClient` + `useLessonEngine` + `LessonRenderer` system. There is no inline lesson system in `page.tsx`. Sections:

1. **Today's riyaz card** -- raga selected by time of day via `getRagaForTimeOfDay`. Shows raga name, description, prahara number, time label (Dawn/Morning/Afternoon/etc.). "Begin" button when riyaz not done, "Today's riyaz complete" when finished. The "Begin" link resolves the correct YAML lesson via `RAGA_TO_LESSON` map (e.g., `yaman` -> `beginner-03-yaman`, `bhairav` -> `beginner-04-bhairav`). Ragas without a dedicated lesson fall back to `beginner-01-bhoopali`.

2. **Progress** -- current level badge (Shishya/Sadhaka/Varistha/Guru with color from `--level-*` tokens), XP bar (tracks consistency, 100 XP per level), day streak count (saffron when > 0).

3. **Recently practiced** -- list of raga cards with name and best accuracy percentage. Empty state: "No practice sessions yet."

4. **Lesson catalog** -- all 8 beginner lessons listed as links to `/journeys/beginner/lessons/[id]`: beginner-01-bhoopali (Your First Raga), beginner-02-sa-pa-drone (Sa and Pa), beginner-03-yaman (Evening Light), beginner-04-bhairav (Dawn Austerity), beginner-05-bhimpalasi (Afternoon Longing), beginner-06-bageshri (Night Intimacy), beginner-07-consolidation (Five Ragas), beginner-08-challenge (Shishya Challenge).

5. **First-time callout** -- shown when `lastPractice === null`. Explains Sadhana philosophy: practice, not explanation. 5-15 minutes. One raga at a time.

Framer Motion stagger container with fadeUp animation (opacity 0->1, y 16->0, 0.08s stagger, ease-out).

---

## Practice Session

Source: `frontend/app/components/PracticeSession.tsx`

The core practice component. Props: `ragaId`, `onComplete?`.

### Phase Machine

```
preparing -> listening -> active <-> pakad-moment -> completing -> complete
```

| Phase | Duration | What happens |
|-------|----------|-------------|
| `preparing` | 2s auto | "Preparing tanpura..." message. Tanpura not yet active. |
| `listening` | manual | Tanpura active. Waiting for student to start singing. |
| `active` | manual | Student singing. Voice feedback live. Timer running. |
| `pakad-moment` | 5.2s auto | Cinematic pakad overlay. Tanpura continues. Returns to active. |
| `completing` | 1s auto | "Completing session..." message. |
| `complete` | terminal | Stats display: duration, XP earned, pakad found. |

### Controls

- **Spacebar**: toggle between listening and active
- **Escape**: trigger completing phase
- **Sing/Pause button**: toggle active/listening
- **End button**: trigger completing phase

### Session Layout

1. **TanpuraViz** (ambient background, z-index -1)
2. **Header**: raga name + session timer
3. **Target section**: "Sing" label + current target swara
4. **Visualization area**: VoiceVisualization component + exercise prompt (aroha display)
5. **Controls**: End and Sing/Pause buttons

### Pakad Moment (Cinematic)

Triggered once per session when pakad is detected. 2-layer reveal:

**Layer 1 -- Cinematic pause (5.2s):**
- Framer Motion overlay fades in using `ENTRY_EASE [0.22, 0.61, 0.36, 1]` (slower ceremonial curve)
- Tanpura gain ducks to 0 on entry, restores over 400ms starting at 3800ms
- Raga name appears with `motion.h2` (Devanagari or romanized per script toggle)
- Sargam notation below
- `PakadMoment.tsx` receives `primeExpectedPhrase` calls from YAML `prime_pakad` blocks in beginner-01 through beginner-06, ensuring pakad fires on the lesson's intended phrase rather than any matching phrase

**Layer 2 -- Settles:**
- After 4s, overlay fades out
- Persistent toast remains: "You sang the pakad of {raga.name}"
- Toast stays until session ends (visible at bottom)

### Session Data

On complete, emits `SessionData`:
```typescript
{
  ragaId: string,
  duration: number,      // seconds
  xpEarned: number,      // floor(duration / 10) -- 1 XP per 10s
  accuracy: number,      // placeholder, computed from voice pipeline
  pakadsFound: number,
  startedAt: Date,
  endedAt: Date,
}
```

---

## Voice Visualization

Source: `frontend/app/components/VoiceVisualization.tsx`

3-layer feedback system. Props: `feedback: VoiceFeedback`, `centsExpanded?`, `className?`.

### Layer 1 -- Waveform (ambient, always present)

Canvas element drawing voice pitch history as a waveform. Opacity modulated by amplitude. Renders via `requestAnimationFrame` (or static draw when `prefers-reduced-motion`).

### Layer 2 -- Target + Pitch Dot (primary interaction)

- Target swara displayed as a styled circle with status color (correct/in-progress/needs-work)
- Student's pitch as a `motion.div` dot with spring physics (stiffness 300, damping 25)
- Dot position maps cents deviation to vertical offset (35% of container height range, clamped to +/-50 cents)
- Dot color: green (<=10c), amber (<=25c), red (>25c)

### Layer 3 -- Cents Needle (precision detail)

- Scale from -50 to +50 cents with center mark
- Needle position: `(cents + 50) / 100 * 100%`
- Collapsed by default for Beginner/Explorer. Click/tap to expand.
- Always expanded for Varistha+ (`centsExpanded={true}`)
- Shows exact value: "+23 cents" / "-12 cents"
- "Tap for precision" hint shown when collapsed

ARIA: `role="img"` with descriptive label including swara name and deviation.

---

## Tanpura Visualization

Source: `frontend/app/components/TanpuraViz.tsx`

Canvas-based ambient background for practice sessions. 4 waveforms representing tanpura strings.

- String 1 (Sa): saffron, strokeWidth 2
- String 2 (Pa): muted, strokeWidth 1.2, opacity 0.6
- String 3 (upper Sa): muted, opacity 0.4
- String 4 (highest partial): muted, opacity 0.25

Behavior:
- **Active + aligned**: strings converge (phase offset decreases), amplitude increases
- **Active + off-pitch**: strings diverge
- **Inactive**: low-amplitude static waveforms
- `prefers-reduced-motion`: single static render, no animation loop

Night/day mode: reads `data-theme` attribute, switches string color palette.

Props: `partialFrequencies?`, `voiceAmplitude?`, `active?`, `className?`, `style?`.

---

## Component Inventory

| Component | File | Purpose |
|-----------|------|---------|
| `Logo` | components/Logo.tsx | SVG mark + optional wordmark. CSS wave animation, Framer Motion hover/press springs. |
| `TanpuraViz` | components/TanpuraViz.tsx | Canvas tanpura waveform background |
| `VoiceVisualization` | components/VoiceVisualization.tsx | 3-layer voice feedback |
| `PracticeSession` | components/PracticeSession.tsx | Core practice session with phase machine |
| `ScriptToggle` | components/ScriptToggle.tsx | Global Devanagari/romanized toggle (fixed bottom-right) |
| `Tantri` | components/Tantri.tsx | 12-string swara field renderer. Canvas-based. Reads CSS tokens via `resolveNum()`. Wired to voice pipeline (pitchHz/pitchClarity) and synthesis via `onPlayString` / `timbre`. Three display variants: `full` (default, all 12 strings), `portal` (centered ~40vh band, guitar-like, with integrated pitch trail), `compact`. Performance: pre-allocated `Float32Array` pool for oscilloscope (zero-alloc hot path); animation loop pauses when `document.hidden` (tab visibility guard). Pointer events disabled in beginner lesson context (visual-only). |
| `VoiceTimbreSelector` | components/VoiceTimbreSelector.tsx | Harmonium / voice-male / voice-female selector. Drives `timbre` prop on `useLessonAudio`. |
| `VoiceWave` | components/VoiceWave.tsx | Ambient voice waveform visualization. Uses VoiceWaveContext for cross-component pitch data. Fixed canvas, `position: fixed`. Animation loop pauses when `document.hidden` (tab visibility guard). Animation timestep uses actual RAF delta (`timestamp - prevTimestamp`) so speed is frame-rate independent (correct at 60Hz, 120Hz, 144Hz, and slow devices). |
| `GuidedPractice` | components/GuidedPractice.tsx | 4-stage guided raga practice with 0-3 star scoring per stage. Used in Explorer raga detail practice route. Driven by `useGuidedPractice` hook. |

---

## Frontend Types

Source: `frontend/app/lib/types.ts`

| Type | Description |
|------|-------------|
| `JourneyId` | `'beginner' \| 'explorer' \| 'scholar' \| 'master'` |
| `JourneyMeta` | Card display metadata |
| `LevelTitle` | `'Shishya' \| 'Sadhaka' \| 'Varistha' \| 'Guru'` |
| `UserProfile` | id, saHz, level, xp, streak, lastPractice, riyazDone |
| `SessionData` | ragaId, duration, xpEarned, accuracy, pakadsFound, timestamps |
| `PracticePhase` | 6 phases of the session state machine |
| `VoiceFeedback` | Pipeline output for visualization: hz, cents, swara, confidence, amplitude, history |
| `ThemeMode` | `'night' \| 'day'` |
| `RecentRaga` | ragaId, ragaName, lastPracticed, bestAccuracy |
| `FreeformState` | Live pitch, swara history, session duration, tanpura/mic status (from `useFreeformSession`) |
| `SwaraEvent` | swara, swaraFull, devanagari, hz, timestamp, durationMs, inTune, harmonyStrength |

Helper functions: `getLevelTitle(level)` maps 1-10 to title, `getLevelColor(level)` maps to CSS variable.

`DEFAULT_USER`: unauthenticated/first-time profile (Sa=261.63 Hz, level 1, 0 XP, 0 streak).

---

## Freeform Journey

Source: `frontend/app/journeys/freeform/page.tsx`

No goals. No exercises. No scoring. Just the tanpura and the student's voice. The most cinematic surface in the app.

### States

| State | What happens |
|-------|-------------|
| Start | Logo + title + "Begin" button. Tanpura waveform ambient at 15% opacity. |
| Active | Full cinematic mode with live pitch tracking. Three visual layers. |
| Permission denied | Gentle message + retry button + "Return home" link. |

### Visual Layers

1. **Ambient voice waveform** (VoiceWave, background, 15% opacity) -- replaced TanpuraViz as of commit 5bb2983.
2. **Tantri portal** -- Tantri component in `variant="portal"`, a centered ~40vh horizontal band of 12 strings with an integrated pitch trail rendered behind the strings. The pitch trail is a flowing line of recent voice pitch positions. Strings glow on voice detection per accuracy color.
3. **Harmony pulse** -- radial gradient that fires when the student sings a consonant interval with Sa. Strong consonance (>0.80, e.g., Pa) triggers gold; moderate consonance triggers saffron. Fades over 1.2s.

### HUD

Top overlay shows session timer (left, mono) and total swara count (right, mono).

### Cents Needle

Always visible in freeform mode. Maps -50 to +50 cents. Color: green (<=20c), amber (<=35c), red (>35c).

### Controls

- **Tanpura toggle** -- waveform icon + "Tanpura" label. Mute/unmute the drone.
- **End riyaz** -- stops listening, disposes audio, navigates back via `window.history.back()`.

### Raga Selector

The freeform page exposes a raga selector (dropdown/list) so the student can choose which raga's tanpura tuning and string visibility to use. Default is the time-of-day raga (from `getRagaForTimeOfDay`). Selecting a raga updates Tantri's raga-aware string visibility and the tanpura drone's Sa reference without interrupting the session.

### Session Persistence

Uses `useFreeformSession` hook. Sessions >= 30s are saved to Supabase `sessions` table with `raga_id: 'freeform'`, `journey: 'freeform'`. XP: 2 per minute. Fire-and-forget -- errors logged but never thrown to UI.

### Audio Hook

See `docs/AUDIO-ENGINE.md` -- useFreeformSession section.

---

## Auth Flow

Source: `frontend/app/auth/page.tsx`, `frontend/app/auth/callback/page.tsx`

### Design Language

Void design language: pure black background, elements floating. The Logo (64px icon) is the only warm element, with a saffron radial glow behind it.

### Auth Paths

| Path | Prominence | Implementation |
|------|-----------|----------------|
| Google OAuth | Primary. Full-width button with Google logo. | `signIn('google')` -- redirects to Google, returns to `/auth/callback`. |
| Email/password | Secondary. Collapsed behind "Sign in with email" text link. Expands to reveal email + password form. | `signIn('email', email, password)` or `signUp(email, password)`. Sign-up sends Supabase confirmation email. |
| Guest | Tertiary. Near-invisible link at bottom: "Enter without an account". | `setGuest()` -- sets guest flag, redirects to `/`. No persistence. |

### Behavior

- If already signed in (`user` exists), redirects to `/` immediately.
- Email form is collapsed by default (aria-expanded). Inputs are `tabIndex={-1}` when collapsed.
- Sign-in / sign-up mode toggles via inline button.

---

## Profile Page

Source: `frontend/app/profile/page.tsx`

### Auth States

| State | Display |
|-------|---------|
| Loading | Saffron pulse dot (loading indicator). |
| Guest | Heading: "You are practicing as a guest." Prompt to sign in with link to `/auth`. |
| Authenticated | Full profile display (below). |

### Authenticated Sections

1. **Identity** -- display name + level badge (colored by level: Shishya `#0A1A14`, Sadhaka `#2D6A4F`, Varistha `#1E3A5F`, Guru `#D4AF37`). Journey path if set.
2. **XP + Streak** -- XP count, day streak with geometric taper SVG mark (saffron when > 0), longest streak sub-label, Sa reference frequency in Hz.
3. **Encouragement** -- contextual Hindustani classical message. Varies by level and streak. Examples: "Seven days of Sa. The tanpura has learned your breath." (7-day streak), "At this depth, silence between swaras becomes grammar." (Varistha level).
4. **Recent ragas** -- up to 3 recently practiced ragas with name and "X days ago" label. Empty state: "No ragas practiced yet."
5. **Level progression** -- vertical track with 4 nodes (Shishya/Sadhaka/Varistha/Guru). Shows XP thresholds (0/500/2000/8000). Current level highlighted, completed levels filled, future levels dimmed.
6. **Sign out** -- button at bottom.

---

## Explorer, Scholar, Master

v1 state: Explorer has a full page at `frontend/app/journeys/explorer/page.tsx` with raga browser, ear training (`/ear-training`), interval training (`/interval-training`), and raga detail (`/[ragaId]`) routes. Scholar and Master have pages at `frontend/app/journeys/{scholar,master}/page.tsx` with "being built" messaging. All three are navigable from the home page.

### Explorer — Guided Practice (Star Scoring)

Source: `frontend/app/components/GuidedPractice.tsx`, `frontend/app/lib/useGuidedPractice.ts`, `engine/analysis/practice-scoring.ts`

The Explorer raga detail pages link to `/journeys/explorer/[ragaId]/practice`, which renders the `GuidedPractice` component via `PracticeClient.tsx`.

4 stages in sequence: Individual Swaras → Aroha → Avaroha → Pakad. Each stage has 3 phases: `listen` (guide tone plays), `sing` (voice pipeline active, events collected), `result` (0-3 stars displayed).

| Stage | Target |
|-------|--------|
| swaras | Each swara in the raga's aroha, one at a time |
| aroha | Full ascending scale |
| avaroha | Full descending scale |
| pakad | The raga's characteristic phrase |

Stars per stage are computed by `scoreToStars(score)`: 0 stars < 0.40, 1 star >= 0.40, 2 stars >= 0.65, 3 stars >= 0.85. XP is the delta above the student's previous best for that raga (no repeat grinding). Overall result is a `PracticeResult` from `engine/analysis/practice-scoring.ts`.

Hook: `useGuidedPractice(raga, saHz, level)` returns `GuidedPracticeControls`. Uses `useLessonAudio` for tanpura and voice pipeline.

### Explorer — Tantri Integration

The Explorer raga detail pages render Tantri in `portal` variant with raga-aware string visibility. Only the swaras present in the selected raga's aroha and avaroha are shown — strings for varjit (forbidden) swaras are hidden. This gives the student a visual map of the raga's swara set before they practice.

### Explorer — Interval Training

Source: `frontend/app/journeys/explorer/interval-training/page.tsx`

10-round binaural ear-training exercise. Raga-aware: intervals are drawn from the time-of-day raga's swara set.

| Rounds | Mode | Description |
|--------|------|-------------|
| 1–5 | Sequential | Sa plays first, then the target swara. Student identifies the swara from 4 options. |
| 6–10 | Binaural | Sa and the target swara play simultaneously — Sa panned hard left, target panned hard right. Student must separate and identify the right-ear swara. |

Audio: 4-partial additive synthesis via `StereoPannerNode` + `Web Audio API` (no external library). Just-intonation tuning via `getSwaraFrequency`. 8 XP per correct answer. Wrong answers replay the interval sequentially before advancing.

### Profile — Practice Heatmap

Source: `frontend/app/profile/page.tsx`

A 90-day grid heatmap is displayed on the profile page (Section 5). Each cell represents one day; intensity levels 0–4 encode practice volume (minutes). Data fetched via `getPracticeHistory(userId, 90)` from Supabase. A legend and total-minutes label accompany the grid. Cell intensity thresholds: 0 = no practice, 1 = 1–5 min, 2 = 6–15 min, 3 = 16–30 min, 4 = >30 min.

---

## Pedagogy Wiring (rev 11) — silent-drop fields now rendered

The v1 audit surfaced four classes of silent-drop YAML fields. All four are now wired:

| Field | YAML Phase Types | Renderer | Behaviour |
|-------|---|---|---|
| `presentation: comparison` | `swara_introduction` (2 swaras) | `SwaraComparison.tsx` | Side-by-side A/B cards with independent Listen buttons; Continue gates softly until both heard |
| `call_response.calls` loop | `call_response` | `CallResponseCycle.tsx` | Engine plays each `engine_plays`, opens a `student_sings` window (1.1s/swara, 2–6s clamp), repeats `response_cycles` × `rounds` times |
| `mastery_challenge.tolerance_cents` | `mastery_challenge` | `MasteryChallenge.tsx` | Per-target hold meter; consecutive ms within ±tolerance × confidence ≥ 0.4 → pass; verdict gated on `min_accuracy` (default 0.85) |
| `interval_pool` + `answer_mode: listen_then_choose` | `interval_exercise` | `IntervalChoice.tsx` | Plays target × `play_count`, shows pool as multiple choice, advances on round count |
| `tala_id`, `tempo_bpm`, `cycles`, `mode` | `tala_exercise`, `tala_melody_exercise` | `TalaPhase.tsx` | Starts engine TalaPlayer, beat strip with sam (saffron) / khali (hollow) markers, advances after `cycles` cycles |
| `swara_a`, `swara_b` | `swara_comparison` | `SwaraComparison.tsx` | Same A/B surface as comparison-presentation |
| Cluster F instruction-led | `bandish_exercise`, `composition_exercise`, `taan_exercise`, `teaching_exercise`, `raga_rendering`, `modulation_awareness`, `controlled_deviation`, `shruti_exercise`, `ornament_context_exercise`, `grammar_exercise` | `StructuredPhase.tsx` | Renders meta strip (raga · mode · tempo), instruction body, phrase chips, Listen button (when phrase present, tempo-aware), Continue |

`call_response` and `mastery_challenge` are now in `VOICE_PHASE_TYPES` so the voice pipeline starts and Tantri shows live pitch during sing windows.

### rev 12 — Enhancement plan execution

Subsequent work tackled the items deferred at rev 11. Status as of this rev:

| Tier | Item | Status | Notes |
|------|------|--------|-------|
| Tier 0 | T0.1 XP awarded on completion | Shipped | `LessonClient.handleComplete` wires `addXp`. |
| Tier 0 | T0.2 Beginner riyaz increments streak | Shipped | `completeRiyaz` called from beginner + explorer flows. |
| Tier 0 | T0.3 Sessions persisted | Shipped | `saveSession` called from beginner + explorer. |
| Tier 1 | T1.1+T5.2 Sadhaka/Varistha/Guru activation | Shipped | 31 orphaned YAMLs reachable via 3 new dynamic routes. 114 → 115 prerendered. |
| Tier 1 | T1.2 Resume CTA | Shipped | `getNextLessonId(userId, catalog)` + Beginner home banner. |
| Tier 1 | T1.3 Level-up engine (gates) | Foundation shipped | `engine/progression/level-gates.ts` — predicates + `deriveLevel`. UI integration deferred (still needs profile-page wire-up + event-emit calls in lesson flow). |
| Tier 1 | T1.4 Streak freeze + Notifications | Shipped | Migration 004; freezes consumed on 1-day gap; PracticeReminder local Notifications. |
| Tier 2 | T2.1 Ornament evaluator wired into MasteryChallenge | Shipped | `phase.exercise === 'ornament_challenge'` branches to OrnamentChallenge subcomponent. |
| Tier 2 | T2.2 Modulation + deviation analyzers | Shipped | `engine/analysis/modulation.ts` + `deviation.ts` with 10 unit tests. Frontend integration into Guru-03/04 still pending. |
| Tier 2 | T2.3 Tala onset detection | Shipped | `engine/voice/onset-detection.ts` + 11 unit tests. TalaPhase consumes it for clap_sam scoring. |
| Tier 2 | T2.4 Scholar engine surface | Initial shipped | `/journeys/scholar/reference` shrutis table. Per-raga reference views (`ragas/[id]`, `thaats`, `talas`) remain to author. |
| Tier 3 | T3.1 Frontend test harness | Shipped | Vitest config extended; lesson-loader has 9 unit tests. RTL component tests + Playwright UAT still to add. |
| Tier 3 | T3.2 PWA pre-cache | Shipped | sw.js v3 caches all 39 lesson YAMLs + shell + manifest at install. |
| Tier 3 | T3.3 Voice corpus | **Deferred** | Requires recording 30–60 voice samples — not codifiable here. Plan documents the corpus structure (`engine/voice/__fixtures__/`) and `pipeline.regression.test.ts` skeleton. |
| Tier 3 | T3.4 Telemetry events | Shipped | Migration 004 events table + `lib/telemetry.ts` `emit()` / `emitError()`. Insights view still to build. |
| Tier 4 | T4.1 i18n Hindi | **Deferred** | Requires `next-intl` install + extracting ~200 UI strings. Plan saved as `project_sadhana_i18n_fonts.md`. Hindi-only at v1 (no Marathi). |
| Tier 4 | T4.2 Accessibility audit | Shipped | Tantri canvas aria-live status announcer; remaining work (RAG dual-encoding, motion gating in cinematic overlays) ongoing. |
| Tier 4 | T4.3 Devanagari font consistency | Shipped | Explicit fallback chain (Noto Sans Devanagari → Mangal → Devanagari MT → system-ui) replaces generic serif fallback. font-feature-settings calt+liga+dlig enforced. |
| Tier 4 | T4.4 Sa robustness | Shipped | Clarity floor 0.50 → 0.35; range 70–530 Hz; `/profile` manual override. |
| Tier 5 | T5.1 Raga-aware Tantri tuning | **Deferred** | Requires per-swara ornament metadata on each Raga object (currently only raga-level ornament list). Engine refactor required first. |

### Test counts

- Engine: 446 → 476 (added onset-detection 11, modulation 5, deviation 5, level-gates 9).
- Frontend: 0 → 9 (lesson-loader pure-logic tests).

### Routes

- 83 (rev 10) → 114 (rev 11) → 115 (rev 12, +Scholar reference page).
