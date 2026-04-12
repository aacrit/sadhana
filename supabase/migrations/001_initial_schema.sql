-- ============================================================
-- Sādhanā — initial schema migration
-- All tables scoped per authenticated user via RLS
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- Mirrors auth.users. Created automatically on first sign-in.
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  display_name  text,
  journey       text        not null default 'beginner'
                            check (journey in ('beginner','explorer','scholar','master')),
  level         text        not null default 'shishya'
                            check (level in ('shishya','sadhaka','varistha','guru')),
  xp            integer     not null default 0 check (xp >= 0),
  sa_hz         numeric(8,4) not null default 261.6256,  -- C4 fallback
  current_raga  text,                                    -- last active raga id
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- PRACTICE SESSIONS
-- One row per daily practice block.
-- ─────────────────────────────────────────────────────────────
create table public.sessions (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  raga_id       text        not null,
  sa_hz         numeric(8,4) not null,
  duration_s    integer     not null default 0 check (duration_s >= 0),
  xp_earned     integer     not null default 0 check (xp_earned >= 0),
  -- aggregate accuracy for the session (0.0–1.0)
  avg_accuracy  numeric(5,4) check (avg_accuracy between 0 and 1),
  pakad_found   boolean     not null default false,
  journey       text        not null default 'beginner',
  started_at    timestamptz not null default now(),
  ended_at      timestamptz
);

alter table public.sessions enable row level security;

create policy "Users can read own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

create index sessions_user_started_idx on public.sessions (user_id, started_at desc);

-- ─────────────────────────────────────────────────────────────
-- EXERCISE ATTEMPTS
-- Individual pitch/phrase attempts within a session.
-- ─────────────────────────────────────────────────────────────
create table public.exercise_attempts (
  id            uuid        primary key default uuid_generate_v4(),
  session_id    uuid        not null references public.sessions(id) on delete cascade,
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  exercise_type text        not null
                            check (exercise_type in ('pitch','phrase','pakad','swara_id','tala')),
  swara_target  text,                    -- which swara the exercise was targeting
  raga_id       text,
  hz_sung       numeric(8,4),            -- raw pitch detected
  cents_dev     numeric(7,3),            -- deviation from target shruti
  accuracy      numeric(5,4) check (accuracy between 0 and 1),
  ornament_hint text,                    -- e.g. 'andolan' if hint was shown
  feedback_type text,                    -- 'correct'|'sharp'|'flat'|'wrong_swara'|...
  created_at    timestamptz not null default now()
);

alter table public.exercise_attempts enable row level security;

create policy "Users can read own attempts"
  on public.exercise_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own attempts"
  on public.exercise_attempts for insert
  with check (auth.uid() = user_id);

create index attempts_session_idx on public.exercise_attempts (session_id, created_at);
create index attempts_user_raga_idx on public.exercise_attempts (user_id, raga_id);

-- ─────────────────────────────────────────────────────────────
-- LESSON PROGRESS
-- Which lessons a user has started / completed per journey.
-- ─────────────────────────────────────────────────────────────
create table public.lesson_progress (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  lesson_id     text        not null,     -- matches content/curriculum YAML lesson id
  journey       text        not null,
  status        text        not null default 'not_started'
                            check (status in ('not_started','in_progress','complete')),
  best_accuracy numeric(5,4) check (best_accuracy between 0 and 1),
  attempt_count integer     not null default 0,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy "Users can read own lesson progress"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "Users can upsert own lesson progress"
  on public.lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lesson progress"
  on public.lesson_progress for update
  using (auth.uid() = user_id);

create index lesson_progress_user_idx on public.lesson_progress (user_id, journey, status);

-- ─────────────────────────────────────────────────────────────
-- STREAKS
-- Daily riyaz streak. One row per user.
-- ─────────────────────────────────────────────────────────────
create table public.streaks (
  user_id         uuid      primary key references public.profiles(id) on delete cascade,
  current_streak  integer   not null default 0 check (current_streak >= 0),
  longest_streak  integer   not null default 0 check (longest_streak >= 0),
  last_riyaz_date date,
  updated_at      timestamptz not null default now()
);

alter table public.streaks enable row level security;

create policy "Users can read own streak"
  on public.streaks for select
  using (auth.uid() = user_id);

create policy "Users can upsert own streak"
  on public.streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streak"
  on public.streaks for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- RAGA ENCOUNTERS
-- Which ragas a user has practiced and how deeply.
-- Supports "recent ragas" and raga unlock tracking.
-- ─────────────────────────────────────────────────────────────
create table public.raga_encounters (
  id              uuid      primary key default uuid_generate_v4(),
  user_id         uuid      not null references public.profiles(id) on delete cascade,
  raga_id         text      not null,
  session_count   integer   not null default 0,
  total_minutes   integer   not null default 0,
  pakad_found     boolean   not null default false,
  best_accuracy   numeric(5,4) check (best_accuracy between 0 and 1),
  first_practiced timestamptz not null default now(),
  last_practiced  timestamptz not null default now(),
  unique (user_id, raga_id)
);

alter table public.raga_encounters enable row level security;

create policy "Users can read own raga encounters"
  on public.raga_encounters for select
  using (auth.uid() = user_id);

create policy "Users can upsert own raga encounters"
  on public.raga_encounters for insert
  with check (auth.uid() = user_id);

create policy "Users can update own raga encounters"
  on public.raga_encounters for update
  using (auth.uid() = user_id);

create index raga_encounters_user_last_idx on public.raga_encounters (user_id, last_practiced desc);

-- ─────────────────────────────────────────────────────────────
-- HELPER: updated_at trigger
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger lesson_progress_updated_at
  before update on public.lesson_progress
  for each row execute procedure public.set_updated_at();

create trigger streaks_updated_at
  before update on public.streaks
  for each row execute procedure public.set_updated_at();
