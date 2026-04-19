# Lesson Renderer Spec

Last updated: 2026-04-19 (rev 2)

The lesson renderer loads a YAML lesson file and its copy overlay, then drives a state machine through phases. All singing phases share a single persistent `LessonPracticeSurface` — Tantri is always visible. `SwaraIntroduction` and `PhrasePlayback` are thin label overlays that drive `Tantri.pitchHz` via `onHighlightString`; they do not mount/unmount the surface. Phase transition: enter 0.18s, exit 0.15s. The 500ms inter-phase pause and the Ready/Begin transition page have been removed.

---

## File Structure

Each lesson consists of two files:

- `content/curriculum/{id}.yaml` -- structure, engine parameters, phase sequence
- `content/curriculum/{id}-copy.yaml` -- display text, feedback strings, theory/cultural notes

The copy file is keyed by phase `id`. The renderer merges copy onto the phase object before passing it to the component. Phase YAML fields are authoritative for engine behavior; copy fields are authoritative for display text.

## Loading

```
1. Parse {id}.yaml -> LessonDef
2. Parse {id}-copy.yaml -> CopyDef
3. For each phase in LessonDef.phases:
   merge CopyDef.phases[phase.id] onto phase (copy wins for display fields)
4. Attach CopyDef.theory_note, western_bridge, cultural_note to lesson metadata
5. Initialize state machine at phase index 0
```

---

## Phase Type Registry

Each `type` value maps to one React component. Required fields listed per type.

### `tanpura_drone`

Starts tanpura, shows instruction, auto-advances after `duration_s`.

| Field | Type | Required |
|-------|------|----------|
| duration_s | number | yes |
| tanpura.strings | string[] | yes |
| tanpura.sa_hz | number or null | yes (null = user Sa) |
| tanpura_presence | "off" | no |

Component: `<TanpuraDronePhase />`

**Continue button:** Always rendered. Visible at 0.45 opacity while `duration_s` is counting; full opacity on completion. Prevents freeze if timer fails.

### `sa_detection`

Pitch detection loop to calibrate user's Sa. Skippable via `skip_if`.

| Field | Type | Required |
|-------|------|----------|
| attempts | number | yes |
| min_clarity | number | yes (documentation-only — not read by runtime; see AUDIO-ENGINE.md) |
| fallback_hz | number | yes |
| skip_if | string | no |

`skip_if: sa_already_set` is evaluated by `useLessonEngine` against `saHz !== 261.6256` (the default fallback). When a new Sa is detected in-lesson, `updateSa(userId, hz)` is called and persists the value to `profiles.sa_hz`. `SaSeedBridge` seeds `VoiceWaveContext` from the profile on mount so subsequent phases use the correct Sa immediately.

Component: `<SaDetectionPhase />`

### `swara_introduction`

Plays swaras one at a time (or in comparison pairs). Audio before labels.

| Field | Type | Required |
|-------|------|----------|
| swaras | string[] | yes |
| presentation | "sequential" or "comparison" | yes |
| audio_first | boolean | yes |

Component: `<SwaraIntroPhase />`

### `phrase_playback`

Plays a phrase with optional labels. User listens, does not sing. Aroha and avaroha are paired into a single `phrase_playback` phase (rather than two sequential phases), matching standard Hindustani pedagogy.

| Field | Type | Required |
|-------|------|----------|
| phrase | string[] | yes |
| repeat | number | yes |
| show_labels | boolean | yes |

Component: `<PhrasePlaybackPhase />`

**Continue button:** Always visible. Opacity 0.35 mid-playback, full opacity when all repeats complete. `handleContinue` cancels the internal timer before advancing to prevent double-fires.

### `pitch_exercise`

Single-swara pitch hold. Voice pipeline active, feedback displayed.

| Field | Type | Required |
|-------|------|----------|
| target_swara | string or null | yes (null = any allowed) |
| duration_s | number | yes |
| feedback_layer | "minimal" or "standard" or "full" | yes |
| level_tolerance | string | yes |

Optional: `allowed_swaras` (string[]) when target_swara is null.

Component: `<PitchExercisePhase />`

### `phrase_exercise`

Multi-swara guided singing. Guide tone plays ahead, student follows.

| Field | Type | Required |
|-------|------|----------|
| phrase | string[] | yes |
| guide_tone | boolean | yes |
| feedback_layer | string | yes |

Component: `<PhraseExercisePhase />`

### `call_response`

Engine plays a note, student sings back (same or complement).

| Field | Type | Required |
|-------|------|----------|
| rounds | number | yes |
| calls | array of {engine_plays, student_sings} | yes |
| feedback_layer | string | yes |
| level_tolerance | string | yes |

Component: `<CallResponsePhase />`

### `raga_opening`

Ambient tanpura listen with raga intro. Minimal UI, same behavior as `tanpura_drone`. No student interaction required. Auto-advances after `duration_s`.

Component: routed through `<TanpuraDronePhase />` in `LessonRenderer`.

### `sing_along`

Teacher phrase plays (via phrase-playback route), student echoes immediately. `guide_tone: true` is standard; explicit teacher-then-student gating is stored in YAML but not yet enforced by the runtime (known gap — see Known Gaps).

| Field | Type | Required |
|-------|------|----------|
| phrase | string[] | yes |
| guide_tone | boolean | yes |
| feedback_layer | string | yes |

Component: routed through `<PhrasePlaybackPhase />` in `LessonRenderer`.

### `passive_phrase_recognition`

Free singing with pakad detection running in background.

| Field | Type | Required |
|-------|------|----------|
| duration_s | number | yes |
| watch_for_pakad | boolean | yes |
| pakad_reward.xp_bonus | number | no |
| pakad_reward.ceremony | string | no |

Component: `<FreeSingingPhase />`

### `session_summary`

End screen. Shows accuracy, streak, XP, message.

| Field | Type | Required |
|-------|------|----------|
| show_accuracy | boolean | yes |
| show_streak | boolean | yes |
| message | string | yes |

Component: `<SessionSummaryPhase />`

---

## State Machine

```
States: LOADING -> READY -> PHASE_ACTIVE -> PHASE_COMPLETE -> (next phase or LESSON_COMPLETE)

Transitions:
  LOADING: fetch + parse YAML + copy -> READY
  READY: user taps "Begin" (or auto-start if returning) -> PHASE_ACTIVE[0]
  PHASE_ACTIVE[n]:
    - Timer phases (tanpura_drone): auto-complete after duration_s
    - Detection phases (sa_detection): complete on successful detection or skip
    - Playback phases: complete after all repeats finish
    - Exercise phases: complete after duration_s or user taps "Next"
    - Free singing: complete after duration_s or user taps "Done"
    - Summary: user taps "Finish"
    -> PHASE_COMPLETE[n]
  PHASE_COMPLETE[n]:
    if n < phases.length - 1 -> PHASE_ACTIVE[n+1] (auto-advance, no inter-phase pause)
    if n == phases.length - 1 -> LESSON_COMPLETE
  LESSON_COMPLETE:
    - Write session to Supabase (accuracy, duration, pakad detected)
    - Evaluate unlock_next conditions
    - Return to journey home
```

### Phase Completion Conditions

| Type | Completes when |
|------|---------------|
| tanpura_drone | duration_s elapsed |
| sa_detection | Sa detected with min_clarity, or skip_if met, or fallback after attempts |
| swara_introduction | All swaras played (sequential) or both played (comparison) |
| phrase_playback | All repeats played |
| pitch_exercise | duration_s elapsed or user taps Next |
| phrase_exercise | Student completes phrase or 3 failed attempts (advances anyway) |
| call_response | All rounds completed |
| passive_phrase_recognition | duration_s elapsed or user taps Done |
| session_summary | User taps Finish |

---

## Error States

| Error | Behavior |
|-------|----------|
| YAML parse failure | Show "Lesson unavailable" with retry |
| Copy file missing | Render without copy (phase instruction fields used as fallback) |
| Unknown phase type | Skip phase, log warning, advance to next |
| Audio context blocked | Show "Tap to enable audio" overlay (iOS requirement) |
| Mic permission denied | Skip voice phases, show listen-only mode |
| No phases in YAML | Show "Lesson unavailable" |

---

## Tanpura Lifecycle

The tanpura starts in the first `tanpura_drone` phase and does NOT stop until the lesson ends. It persists across all subsequent phases — only the gain changes per phase type (see `PHASE_TANPURA_GAIN` in `docs/AUDIO-ENGINE.md`). The `session_summary` phase fades it out over 2 seconds. Any phase can carry the optional `tanpura_presence: off` YAML flag to silence the tanpura for that phase only.

## Copy Overlay Rules

1. Copy fields with matching phase ID override display text only
2. Phase `instruction` field is the fallback if copy `body` is missing
3. `screen_title` comes exclusively from copy (no fallback in YAML)
4. `feedback` object in copy provides all feedback strings for exercise phases
5. `theory_note`, `western_bridge`, `cultural_note` are accessible via info panel, not shown inline during practice

---

## Known Gaps

| Gap | Detail |
|-----|--------|
| `sa_already_set` exact equality | `skip_if: sa_already_set` compares `saHz !== 261.6256` (exact float). If a stored Sa round-trips to the default value, the phase will not be skipped. |
| `guide_tone` gating in `sing_along` | `guide_tone: true` YAML field is stored but `sing_along` does not yet enforce explicit teacher-then-student sequencing. Both teacher phrase and student echo window are active concurrently. |
