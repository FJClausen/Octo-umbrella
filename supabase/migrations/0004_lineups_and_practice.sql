-- =============================================================================
-- Lineups rework (general lineup + event-specific variations, formation
-- presets, per-player notes) and a new Practice Planner (replacing the old
-- free-text Coach Notes page).
-- Run this in the Supabase SQL editor AFTER 0001_init.sql, 0002_gallery.sql,
-- and 0003_roster_updates.sql. Safe to re-run.
--
-- NOTE: this migration does NOT drop the old `coach_notes` table — the app
-- no longer reads/writes it, but any notes a coach already saved are left
-- in place. Drop it yourself later if you're sure you don't need that data:
--   drop table if exists public.coach_notes;
-- =============================================================================

-- Lineups: allow a single "general" lineup (event_id is null) in addition to
-- per-event variations, add a formation preset key, and structured per-slot
-- player assignments + notes (replacing the old free-text "formation").
alter table public.lineups alter column event_id drop not null;
alter table public.lineups add column if not exists formation_key text;
alter table public.lineups add column if not exists slots jsonb not null default '[]'::jsonb;
alter table public.lineups drop column if exists formation;

-- Only one general (event_id is null) lineup may exist. The table's existing
-- `unique (event_id)` constraint does NOT enforce this on its own, since
-- standard unique constraints allow multiple NULLs.
create unique index if not exists lineups_general_singleton_idx
  on public.lineups ((event_id is null))
  where event_id is null;

-- Practice Planner ------------------------------------------------------------

create table if not exists public.practice_plans (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events (id) on delete set null,
  session_date  date not null,
  warmup        text,
  exercises     text,
  scrimmages    text,
  created_at    timestamptz not null default now()
);

create index if not exists practice_plans_session_date_idx
  on public.practice_plans (session_date desc);

alter table public.practice_plans enable row level security;

drop policy if exists practice_plans_all on public.practice_plans;
create policy practice_plans_all on public.practice_plans
  for all using (public.is_coach()) with check (public.is_coach());

create table if not exists public.exercise_templates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.exercise_templates enable row level security;

drop policy if exists exercise_templates_all on public.exercise_templates;
create policy exercise_templates_all on public.exercise_templates
  for all using (public.is_coach()) with check (public.is_coach());
