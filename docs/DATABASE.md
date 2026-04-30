# Database Schema Reference

Last updated: 2026-04-29 (rev 13 — migrations 005 + 006)

Supabase (free tier). All tables have Row Level Security (RLS) enabled. Every table is scoped to the authenticated user via `auth.uid()`.

Migrations:
- `supabase/migrations/001_initial_schema.sql` — base schema
- `supabase/migrations/002_worst_swara.sql` — adds `worst_swara` column to `sessions` table
- `supabase/migrations/003_increment_rpcs.sql` — adds `increment_xp(p_user_id, p_xp_delta)` and `increment_raga_session(p_user_id, p_raga_id)` RPCs for atomic operations; updates profiles INSERT/DELETE policies; allows `'freeform'` in journey CHECK constraint; adds index on exercise_attempts(user_id, created_at DESC)
- `supabase/migrations/004_streak_freeze_and_events.sql` — adds `streaks.freezes_remaining` (CHECK 0–3, default 0) and `streaks.last_freeze_earned_date` (date) for streak-freeze recovery; creates `public.events` telemetry table with RLS
- `supabase/migrations/005_account_deletion_export.sql` — GDPR / India DPDP / Brazil LGPD floor (audit #4). Adds `public.deletion_requests` queue table with RLS, `delete_my_account()` RPC (queues auth deletion + hard-deletes user-scoped rows), `export_my_data()` RPC (returns full user JSONB document). Both RPCs `SECURITY INVOKER` + `auth.uid()` guarded.
- `supabase/migrations/006_events_retention.sql` — events retention (audit #14). Adds `prune_old_events(retention_days int default 90)` returning rows-deleted count; best-effort `pg_cron` schedule (`prune-events-weekly`, Sunday 07:00 UTC) when extension is enabled. Otherwise driven by GitHub Action keep-alive (`.github/workflows/supabase-keepalive.yml`).

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
| `raga_id` | text | -- | NOT NULL. Can be any raga ID or `'freeform'` for open riyaz sessions. |
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
| `freezes_remaining` | integer | 0 | CHECK 0–3. Streak-freeze credits consumed on a 1-day gap. Earned one per 30 consecutive days. Cap 3. (Migration 004) |
| `last_freeze_earned_date` | date | null | Date the most recent freeze credit was earned. Prevents double-awarding within the same 30-day window. (Migration 004) |
| `updated_at` | timestamptz | now() | Auto-updated via trigger |

RLS: select own, insert own, update own.

### events

Lightweight client telemetry. One row per emitted event. Added by migration 004. Source: `frontend/app/lib/telemetry.ts` (`emit()` / `emitError()`).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | gen_random_uuid() | -- |
| `user_id` | uuid FK | -- | References profiles(id) CASCADE. Nullable for unauthenticated emissions. |
| `name` | text | -- | NOT NULL. Event name (e.g., `lesson-started`, `phase-skipped`, `mic-denied`, `error`). |
| `payload` | jsonb | null | Optional structured payload. |
| `created_at` | timestamptz | now() | -- |

Indexes: `(user_id, created_at DESC)`, `(name)`

RLS: select own, insert own.

### deletion_requests

Pending GDPR/DPDP/LGPD account deletions. Inserted by `delete_my_account()` (audit #4). One row per user (unique constraint). Project owner runs a periodic admin cleanup that walks unprocessed rows and calls `auth.admin.delete()`.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid PK | gen_random_uuid() | -- |
| `user_id` | uuid FK | -- | References profiles(id) CASCADE. UNIQUE — one pending request per user. |
| `requested_at` | timestamptz | now() | -- |
| `processed_at` | timestamptz | null | Set by admin cleanup when auth row is deleted. |

RLS: select own, insert own (no update/delete from client).

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

## RPCs (Stored Procedures)

| RPC | Signature | Purpose |
|-----|-----------|---------|
| `increment_xp` | `(p_user_id uuid, p_xp_delta int) → void` | Atomically increment user XP. Prevents race conditions when multiple sessions complete simultaneously. |
| `increment_raga_session` | `(p_user_id uuid, p_raga_id text) → void` | Atomically increment raga_encounters session_count and update last_practiced timestamp. Prevents race conditions on raga_encounters table. |
| `delete_my_account` | `() → void` | GDPR/DPDP/LGPD account deletion (audit #4, migration 005). Queues row in `deletion_requests`, blanks `profiles.display_name`, hard-deletes `events`/`sessions`/`raga_encounters`/`streaks`. SECURITY INVOKER + `auth.uid()` check. Profile row stays so RLS still resolves until the admin cleanup runs `auth.admin.delete()`. Wrapped by `requestAccountDeletion()` in `frontend/app/lib/supabase.ts`. |
| `export_my_data` | `() → jsonb` | GDPR/DPDP/LGPD data export (audit #4, migration 005). Returns single jsonb document with `exported_at`, `user_id`, `profile`, `streak`, `sessions[]`, `raga_encounters[]`, `events[]`. Caller serialises and offers as a JSON download. SECURITY INVOKER + `auth.uid()` check. |
| `prune_old_events` | `(retention_days int default 90) → int` | Events retention (audit #14, migration 006). Deletes events older than `retention_days`, returns row count. Called weekly via best-effort `pg_cron` job `prune-events-weekly` (Sunday 07:00 UTC) when the extension is enabled. SECURITY DEFINER. |

Both RPCs are wrapped by corresponding Supabase client helpers in `frontend/app/lib/supabase.ts` and are race-free (single SQL transaction per call).

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
| events | own | own | -- | -- |
| deletion_requests | own | own | -- | -- |
