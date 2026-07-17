-- =============================================================================
-- Saved Exercises refinement: split the single description into Setup and
-- Run of Play, and add multi-select tags. Existing descriptions are moved
-- into Setup so no data is lost.
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- Safe to re-run.
-- =============================================================================

alter table public.exercise_templates add column if not exists setup text;
alter table public.exercise_templates add column if not exists run_of_play text;
alter table public.exercise_templates add column if not exists tags text[] not null default '{}';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercise_templates'
      and column_name = 'description'
  ) then
    update public.exercise_templates
    set setup = coalesce(nullif(setup, ''), description)
    where description is not null and description <> '';

    alter table public.exercise_templates drop column description;
  end if;
end $$;
