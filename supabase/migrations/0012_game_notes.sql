-- =============================================================================
-- Coaches' private notes on games already played (how it went, what to work
-- on). Coach-only: parents can never read these, so they live in their own
-- table rather than a column on events.
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- Safe to re-run.
-- =============================================================================

create table if not exists public.game_notes (
  event_id   uuid primary key references public.events(id) on delete cascade,
  note       text not null default '',
  author_id  uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.game_notes enable row level security;

drop policy if exists game_notes_all on public.game_notes;
create policy game_notes_all on public.game_notes
  for all using (public.is_coach()) with check (public.is_coach());
