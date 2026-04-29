-- =============================================================================
-- Migration 004 — Streak freeze + lightweight events table
-- =============================================================================
--
-- Two related additions:
--
--  1. Streak freeze (T1.4) — students who miss exactly one day no longer
--     reset to streak 1. They consume one "freeze" credit and the streak
--     continues. Freezes are earned by sustained practice (one per 30
--     consecutive days) and capped at 3.
--
--  2. Events table (T3.4) — opt-in client telemetry so progress-analyst
--     and future debugging have something to read. Events are deliberately
--     small: a name, an optional payload (jsonb), and a timestamp. RLS
--     ensures users can only read/write their own events.
--
-- Both additions are non-destructive — running this migration on an
-- existing database adds columns / a new table without touching the
-- existing schema or rows.
-- =============================================================================

-- 1. Streak freeze ----------------------------------------------------------

alter table public.streaks
  add column if not exists freezes_remaining integer not null default 0
    check (freezes_remaining >= 0 and freezes_remaining <= 3);

alter table public.streaks
  add column if not exists last_freeze_earned_date date;

comment on column public.streaks.freezes_remaining is
  'Number of streak-freeze credits the user can consume to recover from a 1-day gap. Earned by sustained practice. Cap = 3.';

-- 2. Events table -----------------------------------------------------------

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  name        text not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_events_user_created
  on public.events (user_id, created_at desc);

create index if not exists idx_events_name
  on public.events (name);

alter table public.events enable row level security;

create policy "Users can insert own events"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "Users can read own events"
  on public.events for select
  using (auth.uid() = user_id);

comment on table public.events is
  'Lightweight client telemetry. Each row is a single event (lesson-started, phase-skipped, mic-denied, etc.) with an optional jsonb payload. RLS ensures users only see their own events.';
