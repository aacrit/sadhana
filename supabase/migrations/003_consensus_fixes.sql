-- ============================================================
-- Migration 003: Consensus fixes (db-reviewer + sadhana-ciso)
--
-- 003.1 — increment_xp RPC: atomic XP updates eliminate the
--         lost-update race when concurrent sessions complete.
-- 003.2 — Explicit INSERT/DELETE policies on profiles.
-- 003.3 — Allow 'freeform' as a valid journey value.
-- 003.4 — Index for time-bucket queries on exercise_attempts.
-- 003.5 — increment_raga_session RPC: race-free upsert of
--         raga_encounters from saveSession() in supabase.ts.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 003.1  Atomic XP increment
-- Eliminates the lost-update race in addXp() where concurrent
-- writers could overwrite each other's increments.
-- ─────────────────────────────────────────────────────────────
create or replace function public.increment_xp(p_user_id uuid, p_xp_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_xp integer;
begin
  update public.profiles
    set xp = greatest(0, xp + p_xp_delta), updated_at = now()
    where id = p_user_id and id = auth.uid()
    returning xp into new_xp;
  return new_xp;
end;
$$;

grant execute on function public.increment_xp(uuid, integer) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 003.2  Explicit INSERT/DELETE policies on profiles
-- Migration 001 declared SELECT and UPDATE only. The auth-user
-- trigger inserts via SECURITY DEFINER, but client-side inserts
-- (e.g. backfill flows) need an explicit policy. DELETE is
-- required for the "delete my account" data-export path.
-- ─────────────────────────────────────────────────────────────
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- 003.3  Allow 'freeform' in journey CHECK constraints
-- The freeform journey ships in v1 but was missing from the
-- 001 schema. Without this, freeform session inserts fail.
-- ─────────────────────────────────────────────────────────────
alter table public.profiles drop constraint if exists profiles_journey_check;
alter table public.profiles add constraint profiles_journey_check
  check (journey in ('beginner', 'explorer', 'scholar', 'master', 'freeform'));

alter table public.sessions drop constraint if exists sessions_journey_check;
alter table public.sessions add constraint sessions_journey_check
  check (journey in ('beginner', 'explorer', 'scholar', 'master', 'freeform'));

-- ─────────────────────────────────────────────────────────────
-- 003.4  Index for time-based queries on exercise_attempts
-- Supports analytics + retention queries (e.g. "attempts in the
-- last 7 days for user X"). The existing attempts_user_raga_idx
-- is for raga lookup; this one is for time-bucketing.
-- ─────────────────────────────────────────────────────────────
create index if not exists idx_exercise_attempts_user_created
  on public.exercise_attempts (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 003.5  Atomic raga_encounters upsert
-- Replaces the SELECT-then-INSERT-or-UPDATE pattern in
-- supabase.ts saveSession() which had a TOCTOU race when two
-- sessions for the same raga completed in parallel.
--
-- Returns the new session_count so the caller can persist it
-- in their session record without a follow-up read.
-- ─────────────────────────────────────────────────────────────
create or replace function public.increment_raga_session(
  p_user_id        uuid,
  p_raga_id        text,
  p_minutes        integer,
  p_accuracy       numeric,
  p_pakad_found    boolean
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_count integer;
begin
  -- Caller must be the owning user
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  insert into public.raga_encounters (
    user_id, raga_id, session_count, total_minutes,
    best_accuracy, pakad_found, first_practiced, last_practiced
  )
  values (
    p_user_id, p_raga_id, 1, greatest(0, p_minutes),
    p_accuracy, coalesce(p_pakad_found, false), now(), now()
  )
  on conflict (user_id, raga_id) do update
    set session_count  = public.raga_encounters.session_count + 1,
        total_minutes  = public.raga_encounters.total_minutes + greatest(0, excluded.total_minutes),
        best_accuracy  = greatest(
                           coalesce(public.raga_encounters.best_accuracy, 0),
                           coalesce(excluded.best_accuracy, 0)
                         ),
        pakad_found    = public.raga_encounters.pakad_found or coalesce(excluded.pakad_found, false),
        last_practiced = now()
  returning session_count into new_count;

  return new_count;
end;
$$;

grant execute on function public.increment_raga_session(uuid, text, integer, numeric, boolean) to authenticated;
