-- =============================================================================
-- Migration 006 — Events table retention (audit #14)
-- =============================================================================
--
-- The events table grows unbounded with every emit() call site. With
-- ~30 events per session × 1 session/day × 1000 users × 30 days the
-- table reaches 900k rows in one month — well within the free-tier
-- 500MB ceiling but uncomfortable for read latency.
--
-- This migration adds:
--   1. A retention function that deletes events older than 90 days.
--   2. A pg_cron job (if available) that runs it weekly.
--
-- pg_cron is opt-in on Supabase. If the extension isn't enabled the
-- function still exists; the project owner can call it manually or
-- wire it to a GitHub Action.
-- =============================================================================

create or replace function public.prune_old_events(retention_days integer default 90)
returns integer
language plpgsql
security definer
as $$
declare
  rows_deleted integer;
begin
  delete from public.events
   where created_at < now() - (retention_days || ' days')::interval;
  get diagnostics rows_deleted = row_count;
  return rows_deleted;
end;
$$;

comment on function public.prune_old_events is
  'Deletes events older than retention_days (default 90). Returns row count. Call weekly via pg_cron or GitHub Action.';

-- Best-effort pg_cron schedule. If pg_cron is not enabled this DO block
-- silently no-ops so the migration succeeds in dev environments.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'prune-events-weekly',
      '0 7 * * 0',          -- Sunday 07:00 UTC
      $cron$ select public.prune_old_events(90) $cron$
    );
  end if;
end
$$;
