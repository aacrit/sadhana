-- =============================================================================
-- Migration 005 — Account deletion + data export RPCs (audit #4)
-- =============================================================================
--
-- GDPR / India DPDP / Brazil LGPD floor. Two RPCs:
--
--   delete_my_account() — queues the user's auth record for deletion,
--     which cascades through every user-scoped table via the FK
--     constraints set in migration 001. We use a queued
--     deletion_requests row rather than calling auth.admin.delete()
--     synchronously because clients cannot hit admin endpoints; the
--     supabase project owner runs a periodic cleanup that walks the
--     queue and deletes via the admin API. Until then, the user's data
--     is logically deleted (signed out, marked) so they no longer see
--     it in the UI.
--
--   export_my_data() — returns a single jsonb document containing every
--     user-scoped row across profiles, sessions, raga_encounters,
--     streaks, events. Caller serialises and offers it as a download.
--
-- Both RPCs are SECURITY INVOKER + auth.uid() check, so they cannot be
-- called for someone else.
-- =============================================================================

-- 1. Deletion request queue
create table if not exists public.deletion_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (user_id)  -- one pending request per user
);

alter table public.deletion_requests enable row level security;

create policy "Users can request own deletion"
  on public.deletion_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can read own deletion request"
  on public.deletion_requests for select
  using (auth.uid() = user_id);

-- 2. delete_my_account() — queues request, soft-deletes profile data
create or replace function public.delete_my_account()
returns void
language plpgsql
security invoker
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'not authenticated';
  end if;

  -- Queue the deletion request (idempotent via unique constraint)
  insert into public.deletion_requests (user_id)
  values (caller_id)
  on conflict (user_id) do nothing;

  -- Logical deletion: blank profile fields so the user effectively
  -- vanishes from the app immediately, even before the admin cleanup
  -- runs the auth.admin.delete pass.
  update public.profiles
     set display_name = null,
         updated_at = now()
   where id = caller_id;

  -- Hard delete user-scoped rows the user can write to.
  delete from public.events            where user_id = caller_id;
  delete from public.sessions          where user_id = caller_id;
  delete from public.raga_encounters   where user_id = caller_id;
  delete from public.streaks           where user_id = caller_id;
  -- profiles row stays so RLS continues to work; admin cleanup nukes it.
end;
$$;

-- 3. export_my_data() — returns all user-scoped rows as a single jsonb
create or replace function public.export_my_data()
returns jsonb
language plpgsql
security invoker
as $$
declare
  caller_id uuid := auth.uid();
  result jsonb;
begin
  if caller_id is null then
    raise exception 'not authenticated';
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'user_id',     caller_id,
    'profile',     (select row_to_json(p)::jsonb from public.profiles p where p.id = caller_id),
    'streak',      (select row_to_json(s)::jsonb from public.streaks s where s.user_id = caller_id),
    'sessions',    (select coalesce(jsonb_agg(row_to_json(s)::jsonb), '[]'::jsonb) from public.sessions s where s.user_id = caller_id),
    'raga_encounters', (select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb) from public.raga_encounters r where r.user_id = caller_id),
    'events',      (select coalesce(jsonb_agg(row_to_json(e)::jsonb), '[]'::jsonb) from public.events e where e.user_id = caller_id)
  ) into result;

  return result;
end;
$$;

comment on function public.delete_my_account is 'GDPR/DPDP/LGPD account deletion. Hard-deletes user data + queues auth.users deletion via deletion_requests.';
comment on function public.export_my_data  is 'GDPR/DPDP/LGPD data export. Returns all user-scoped rows as a single jsonb document.';
