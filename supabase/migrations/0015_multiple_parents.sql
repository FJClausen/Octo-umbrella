-- =============================================================================
-- Allow more than one parent per child (two guardians, separated families,
-- a grandparent who does pickup). Replaces the single players.parent_id with
-- a join table, and moves the RSVP policies onto it.
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- Safe to re-run.
-- =============================================================================

create table if not exists public.player_parents (
  player_id  uuid not null references public.players(id) on delete cascade,
  parent_id  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (player_id, parent_id)
);

create index if not exists player_parents_parent_idx
  on public.player_parents (parent_id);

alter table public.player_parents enable row level security;

-- A parent sees their own links; coaches see and manage all of them.
drop policy if exists player_parents_select on public.player_parents;
create policy player_parents_select on public.player_parents
  for select using (parent_id = auth.uid() or public.is_coach());

drop policy if exists player_parents_write on public.player_parents;
create policy player_parents_write on public.player_parents
  for all using (public.is_coach()) with check (public.is_coach());

-- Carry over every link that already exists.
insert into public.player_parents (player_id, parent_id)
select id, parent_id from public.players where parent_id is not null
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- "Is this one of my children?" — used by the RSVP policies. Security definer
-- so the check itself isn't filtered by player_parents' own RLS.
-- -----------------------------------------------------------------------------

create or replace function public.is_my_player(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.player_parents pp
    where pp.player_id = pid and pp.parent_id = auth.uid()
  );
$$;

grant execute on function public.is_my_player(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RSVP policies now follow the join table rather than players.parent_id.
-- -----------------------------------------------------------------------------

drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps
  for select using (
    public.is_coach() or public.is_my_player(rsvps.player_id)
  );

drop policy if exists rsvps_write on public.rsvps;
create policy rsvps_write on public.rsvps
  for all
  using (
    public.is_approved()
    and (public.is_coach() or public.is_my_player(rsvps.player_id))
  )
  with check (
    public.is_approved()
    and (public.is_coach() or public.is_my_player(rsvps.player_id))
  );

-- players.parent_id is now unused by the app and kept only so this migration
-- stays reversible. player_parents is the source of truth; drop the column
-- once you're happy the new flow works:
--   alter table public.players drop column parent_id;
