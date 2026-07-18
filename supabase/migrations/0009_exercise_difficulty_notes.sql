-- =============================================================================
-- Saved exercises: difficulty level + post-practice experience notes.
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- Safe to re-run.
-- =============================================================================

alter table public.exercise_templates add column if not exists difficulty text
  check (difficulty in ('Easy', 'Standard', 'Challenge'));

create table if not exists public.exercise_notes (
  id          uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercise_templates(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  note        text not null,
  created_at  timestamptz not null default now()
);

alter table public.exercise_notes enable row level security;

drop policy if exists exercise_notes_all on public.exercise_notes;
create policy exercise_notes_all on public.exercise_notes
  for all using (public.is_coach()) with check (public.is_coach());
