-- =============================================================================
-- Girls Soccer Team Site — initial schema, security, and storage.
-- Run this in the Supabase SQL editor (or via the Supabase CLI) once, on a
-- fresh project. Safe to re-run: it uses IF NOT EXISTS / CREATE OR REPLACE and
-- drops policies before recreating them.
-- =============================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

-- One row per authenticated user (parent or coach).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text,
  phone       text,
  role        text not null default 'parent' check (role in ('coach', 'parent')),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at  timestamptz not null default now()
);

-- Player roster. Only kid-safe fields live here (parents can read these).
create table if not exists public.players (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null,
  jersey_number  int,
  position       text,
  photo_url      text,
  parent_id      uuid references public.profiles (id) on delete set null,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Sensitive player details — coaches only.
create table if not exists public.player_private (
  player_id          uuid primary key references public.players (id) on delete cascade,
  last_name          text,
  medical_notes      text,
  emergency_contact  text
);

-- Calendar: games, practices, team events.
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'game' check (type in ('game', 'practice', 'event')),
  title       text not null,
  opponent    text,
  location    text,
  -- Stored as local wall-clock (no time zone): the site shows exactly the time
  -- a coach typed, which is what a single-locale team wants.
  starts_at   timestamp not null,
  ends_at     timestamp,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Per-child RSVP for an event.
create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  player_id   uuid not null references public.players (id) on delete cascade,
  status      text not null check (status in ('going', 'maybe', 'not_going')),
  note        text,
  updated_at  timestamptz not null default now(),
  unique (event_id, player_id)
);

-- Team news / announcements.
create table if not exists public.news (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null default '',
  image_url   text,
  author_id   uuid references public.profiles (id) on delete set null,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Snack schedule. A slot may be tied to an event or just a date. Parents claim
-- open slots (claimed_by null = open).
create table if not exists public.snack_slots (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references public.events (id) on delete set null,
  slot_date       date not null,
  label           text,
  claimed_by      uuid references public.profiles (id) on delete set null,
  -- Denormalized display name of the claimer so parents can see who signed up
  -- without being able to read other parents' full profiles (email/phone).
  claimed_by_name text,
  notes           text,
  created_at      timestamptz not null default now()
);

-- Coaches Corner: private notes (coaches only).
create table if not exists public.coach_notes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null default '',
  author_id   uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Coaches Corner: shared documents / links (coaches only).
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  url         text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- Coaches Corner: lineup & game plan per event (coaches only).
create table if not exists public.lineups (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  formation   text,
  plan        text,
  created_at  timestamptz not null default now(),
  unique (event_id)
);

create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists rsvps_event_idx on public.rsvps (event_id);
create index if not exists rsvps_player_idx on public.rsvps (player_id);
create index if not exists snack_slots_date_idx on public.snack_slots (slot_date);
create index if not exists players_parent_idx on public.players (parent_id);

-- -----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so RLS policies can call them without
-- recursing into the profiles table's own policies).
-- -----------------------------------------------------------------------------

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach' and status = 'approved'
  );
$$;

grant execute on function public.is_approved() to authenticated, anon;
grant execute on function public.is_coach() to authenticated, anon;

-- -----------------------------------------------------------------------------
-- New-user trigger: create a profile automatically. The very first coach-less
-- signup becomes the head coach (approved); everyone else starts as a pending
-- parent awaiting coach approval.
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_coach boolean;
begin
  select exists (select 1 from public.profiles where role = 'coach') into has_coach;

  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    case when has_coach then 'parent' else 'coach' end,
    case when has_coach then 'pending' else 'approved' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent parents from escalating their own role/status. Only coaches may
-- change these fields; other users' updates keep the previous values.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coach() then
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- Keep rsvps.updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists rsvps_touch_updated_at on public.rsvps;
create trigger rsvps_touch_updated_at
  before update on public.rsvps
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Snack claim / release RPCs. These run as SECURITY DEFINER so parents can only
-- claim an OPEN slot and only release their OWN slot — without granting broad
-- update rights on the table.
-- -----------------------------------------------------------------------------

create or replace function public.claim_snack_slot(slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  claimer_name text;
begin
  if not public.is_approved() then
    raise exception 'Not authorized';
  end if;

  select full_name into claimer_name from public.profiles where id = auth.uid();

  update public.snack_slots
  set claimed_by = auth.uid(),
      claimed_by_name = coalesce(nullif(claimer_name, ''), 'A parent')
  where id = slot_id and claimed_by is null;

  if not found then
    raise exception 'That snack slot is already taken';
  end if;
end;
$$;

create or replace function public.release_snack_slot(slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.snack_slots
  set claimed_by = null,
      claimed_by_name = null
  where id = slot_id
    and (claimed_by = auth.uid() or public.is_coach());
end;
$$;

grant execute on function public.claim_snack_slot(uuid) to authenticated;
grant execute on function public.release_snack_slot(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.players        enable row level security;
alter table public.player_private enable row level security;
alter table public.events         enable row level security;
alter table public.rsvps          enable row level security;
alter table public.news           enable row level security;
alter table public.snack_slots    enable row level security;
alter table public.coach_notes    enable row level security;
alter table public.documents      enable row level security;
alter table public.lineups        enable row level security;

-- profiles ---------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_coach());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_coach())
  with check (id = auth.uid() or public.is_coach());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete using (public.is_coach());

-- players ----------------------------------------------------------------------
drop policy if exists players_select on public.players;
create policy players_select on public.players
  for select using (public.is_approved());

drop policy if exists players_write on public.players;
create policy players_write on public.players
  for all using (public.is_coach()) with check (public.is_coach());

-- player_private (coaches only) -----------------------------------------------
drop policy if exists player_private_all on public.player_private;
create policy player_private_all on public.player_private
  for all using (public.is_coach()) with check (public.is_coach());

-- events -----------------------------------------------------------------------
drop policy if exists events_select on public.events;
create policy events_select on public.events
  for select using (public.is_approved());

drop policy if exists events_write on public.events;
create policy events_write on public.events
  for all using (public.is_coach()) with check (public.is_coach());

-- rsvps ------------------------------------------------------------------------
drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps
  for select using (
    public.is_coach()
    or exists (
      select 1 from public.players p
      where p.id = rsvps.player_id and p.parent_id = auth.uid()
    )
  );

drop policy if exists rsvps_write on public.rsvps;
create policy rsvps_write on public.rsvps
  for all using (
    public.is_coach()
    or exists (
      select 1 from public.players p
      where p.id = rsvps.player_id and p.parent_id = auth.uid()
    )
  ) with check (
    public.is_coach()
    or exists (
      select 1 from public.players p
      where p.id = rsvps.player_id and p.parent_id = auth.uid()
    )
  );

-- news -------------------------------------------------------------------------
drop policy if exists news_select on public.news;
create policy news_select on public.news
  for select using (public.is_coach() or (public.is_approved() and published));

drop policy if exists news_write on public.news;
create policy news_write on public.news
  for all using (public.is_coach()) with check (public.is_coach());

-- snack_slots ------------------------------------------------------------------
-- Approved users can read; only coaches can insert/delete or directly update.
-- Parents claim/release via the SECURITY DEFINER RPCs above.
drop policy if exists snack_slots_select on public.snack_slots;
create policy snack_slots_select on public.snack_slots
  for select using (public.is_approved());

drop policy if exists snack_slots_insert on public.snack_slots;
create policy snack_slots_insert on public.snack_slots
  for insert with check (public.is_coach());

drop policy if exists snack_slots_update on public.snack_slots;
create policy snack_slots_update on public.snack_slots
  for update using (public.is_coach()) with check (public.is_coach());

drop policy if exists snack_slots_delete on public.snack_slots;
create policy snack_slots_delete on public.snack_slots
  for delete using (public.is_coach());

-- coach_notes (coaches only) ---------------------------------------------------
drop policy if exists coach_notes_all on public.coach_notes;
create policy coach_notes_all on public.coach_notes
  for all using (public.is_coach()) with check (public.is_coach());

-- documents (coaches only) -----------------------------------------------------
drop policy if exists documents_all on public.documents;
create policy documents_all on public.documents
  for all using (public.is_coach()) with check (public.is_coach());

-- lineups (coaches only) -------------------------------------------------------
drop policy if exists lineups_all on public.lineups;
create policy lineups_all on public.lineups
  for all using (public.is_coach()) with check (public.is_coach());

-- -----------------------------------------------------------------------------
-- Storage: a public "photos" bucket. Anyone can read (needed for <img>), only
-- coaches can upload/change/delete.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists photos_public_read on storage.objects;
create policy photos_public_read on storage.objects
  for select using (bucket_id = 'photos');

drop policy if exists photos_coach_insert on storage.objects;
create policy photos_coach_insert on storage.objects
  for insert with check (bucket_id = 'photos' and public.is_coach());

drop policy if exists photos_coach_update on storage.objects;
create policy photos_coach_update on storage.objects
  for update using (bucket_id = 'photos' and public.is_coach());

drop policy if exists photos_coach_delete on storage.objects;
create policy photos_coach_delete on storage.objects
  for delete using (bucket_id = 'photos' and public.is_coach());
