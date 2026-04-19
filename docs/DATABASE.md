# Database Schema Reference

Last updated: 2026-04-19

Supabase (free tier). All tables have Row Level Security (RLS) enabled. Every table is scoped to the authenticated user via `auth.uid()`.

Migrations:
- `supabase/migrations/001_initial_schema.sql` — base schema
- `supabase/migrations/002_worst_swara.sql` — adds `worst_swara` column to `sessions` table

---

## Tables

### profiles

Mirrors `auth.users`. Auto-created on sign-up via trigger.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | -- | References `auth.users(id)` ON DELETE CASCADE |
| `display_name` | text | null | From `raw_user_meta_data->>'full_name'` |
| `journey` | text | `'beginner'` | CHECK: beginner, explorer, scholar, master |
| `level` | text | `'shishya'` | CHECK: shishya, sadhaka, varistha, guru |
| `xp` | integer | 0 | CHECK >= 0 |
| `sa_hz` | numeric(8,4) | 261.6256 | Student's Sa reference pitch (C4 fallback) |
| `current_raga` | text | null | Last active raga ID |
| `created_at` | timestamptz | now() | -- |
| `updated_at` | timestamptz | now() | Auto-updated via trigger |

RLS: select own, update own.

### sessions

One row per practice session.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | uuid_generate_v4() | -- |
| `user_id` | uuid FK | -- | References profiles(id) CASCADE |
| `raga_id` | text | -- | NOT NULL |
| `sa_hz` | numeric(8,4) | -- | Sa at time of session |
| `duration_s` | integer | 0 | CHECK >= 0 |
| `xp_earned` | integer | 0 | CHECK >= 0 |
| `avg_accuracy` | numeric(5,4) | null | CHECK 0-1 |
| `pakad_found` | boolean | false | -- |
| `worst_swara` | text | null | Swara symbol with highest avg abs(cents_dev) for the session. Written by the app on session end. Used by `getYesterdayWorstSwara()` to surface the Return Note warmup. |
| `journey` | text | `'beginner'` | -- |
| `started_at` | timestamptz | now() | -- |
| `ended_at` | timestamptz | null | -- |

Indexes: `(user_id, started_at DESC)`, `(user_id, started_at DESC) WHERE worst_swara IS NOT NULL` (covering index for `getYesterdayWorstSwara`)

RLS: select own, insert own, update own.

### exercise_attempts

Individual pitch/phrase attempts within a session.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | uuid_generate_v4() | -- |
| `session_id` | uuid FK | -- | References sessions(id) CASCADE |
| `user_id` | uuid FK | -- | References profiles(id) CASCADE |
| `exercise_type` | text | -- | CHECK: pitch, phrase, pakad, swara_id, tala |
| `swara_target` | text | null | Target swara for the exercise |
| `raga_id` | text | null | -- |
| `hz_sung` | numeric(8,4) | null | Raw detected pitch |
| `cents_dev` | numeric(7,3) | null | Deviation from target shruti |
| `accuracy` | numeric(5,4) | null | CHECK 0-1 |
| `ornament_hint` | text | null | e.g. 'andolan' |
| `feedback_type` | text | null | correct, sharp, flat, wrong_swara, etc. |
| `created_at` | timestamptz | now() | -- |

Indexes: `(session_id, created_at)`, `(user_id, raga_id)`

RLS: select own, insert own.

### lesson_progress

Per-user lesson completion tracking.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | uuid_generate_v4() | -- |
| `user_id` | uuid FK | -- | References profiles(id) CASCADE |
| `lesson_id` | text | -- | Matches curriculum YAML |
| `journey` | text | -- | -- |
| `status` | text | `'not_started'` | CHECK: not_started, in_progress, complete |
| `best_accuracy` | numeric(5,4) | null | CHECK 0-1 |
| `attempt_count` | integer | 0 | -- |
| `completed_at` | timestamptz | null | -- |
| `updated_at` | timestamptz | now() | Auto-updated via trigger |

Unique: `(user_id, lesson_id)`

Index: `(user_id, journey, status)`

RLS: select own, insert own, update own.

### streaks

One row per user. Daily riyaz streak tracking.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `user_id` | uuid PK | -- | References profiles(id) CASCADE |
| `current_streak` | integer | 0 | CHECK >= 0 |
| `longest_streak` | integer | 0 | CHECK >= 0 |
| `last_riyaz_date` | date | null | -- |
| `updated_at` | timestamptz | now() | Auto-updated via trigger |

RLS: select own, insert own, update own.

### raga_encounters

Per-user per-raga practice history. Supports "recent ragas" display and raga unlock tracking.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | uuid_generate_v4() | -- |
| `user_id` | uuid FK | -- | References profiles(id) CASCADE |
| `raga_id` | text | -- | -- |
| `session_count` | integer | 0 | -- |
| `total_minutes` | integer | 0 | -- |
| `pakad_found` | boolean | false | -- |
| `best_accuracy` | numeric(5,4) | null | CHECK 0-1 |
| `first_practiced` | timestamptz | now() | -- |
| `last_practiced` | timestamptz | now() | -- |

Unique: `(user_id, raga_id)`

Index: `(user_id, last_practiced DESC)`

RLS: select own, insert own, update own.

---

## Client Helpers

Source: `frontend/app/lib/supabase.ts`

| Helper | Signature | Description |
|--------|-----------|-------------|
| `getRecentRagas` | `(userId, limit)` | Fetch last N raga_encounters ordered by `last_practiced DESC` |
| `getPracticeHistory` | `(userId, days)` | Aggregate sessions by day for the last N days. Returns `{ date: string, minutes: number, sessions: number }[]`. Used by the profile heatmap. |
| `getYesterdayWorstSwara` | `(userId)` | Returns the `worst_swara` value from the most recent session whose `started_at` falls on the calendar day before today. Returns `null` if no yesterday session exists or `worst_swara` is unset. Used by `useLessonEngine` to inject the Return Note warmup phase via `?warmup=` URL param. |

---

## Extensions

- `uuid-ossp`: UUID generation (`uuid_generate_v4()`)

---

## Triggers

| Trigger | Table | Function | Purpose |
|---------|-------|----------|---------|
| `on_auth_user_created` | auth.users | `handle_new_user()` | Auto-insert profile row on sign-up |
| `profiles_updated_at` | profiles | `set_updated_at()` | Auto-set updated_at on update |
| `lesson_progress_updated_at` | lesson_progress | `set_updated_at()` | Auto-set updated_at on update |
| `streaks_updated_at` | streaks | `set_updated_at()` | Auto-set updated_at on update |

---

## RLS Summary

All tables enforce `auth.uid() = user_id` (or `auth.uid() = id` for profiles). No cross-user data access. No admin bypass policies.

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | own | (trigger) | own | (cascade) |
| sessions | own | own | own | -- |
| exercise_attempts | own | own | -- | -- |
| lesson_progress | own | own | own | -- |
| streaks | own | own | own | -- |
| raga_encounters | own | own | own | -- |
