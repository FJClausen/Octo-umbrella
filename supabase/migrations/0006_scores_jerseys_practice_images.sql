-- =============================================================================
-- Jersey color per game, final scores for played games, and photo attachments
-- on practice plans / exercise templates.
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- Safe to re-run.
-- =============================================================================

alter table public.events
  add column if not exists jersey_color text
    check (jersey_color in ('blue', 'red') or jersey_color is null);

alter table public.events add column if not exists score_us int;
alter table public.events add column if not exists score_them int;

alter table public.practice_plans add column if not exists image_url text;
alter table public.exercise_templates add column if not exists image_url text;
