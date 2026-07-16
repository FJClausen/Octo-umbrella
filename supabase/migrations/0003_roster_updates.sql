-- =============================================================================
-- Roster changes: drop jersey numbers, support multiple positions per
-- player, and replace emergency contact / medical notes with a free-text
-- coaching notes field.
-- Run this in the Supabase SQL editor AFTER 0001_init.sql and 0002_gallery.sql.
-- Safe to re-run.
-- =============================================================================

-- Positions: move from a single value to a list (e.g. a player who covers
-- both Midfielder and Forward).
alter table public.players
  add column if not exists positions text[] not null default '{}';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'players' and column_name = 'position'
  ) then
    update public.players
    set positions = array[position]
    where position is not null and position <> '';

    alter table public.players drop column position;
  end if;
end $$;

alter table public.players drop column if exists jersey_number;

-- Private per-player coach notes, replacing emergency contact / medical notes.
alter table public.player_private add column if not exists coaching_notes text;
alter table public.player_private drop column if exists emergency_contact;
alter table public.player_private drop column if exists medical_notes;
