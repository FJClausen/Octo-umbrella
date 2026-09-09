-- =============================================================================
-- Pre-launch security hardening. Run this in the Supabase SQL editor AFTER
-- the earlier migrations. Safe to re-run.
--
-- Fixes, in order of severity:
--   1. Team photos were listable by anyone holding the public anon key.
--   2. Signing up while no coach existed made you an approved head coach.
--   3. Every approved parent could read every child's RSVP row.
--   4. RSVP writes and snack releases never re-checked approval.
--
-- IMPORTANT — run PART 1A, 1B, 2, 3 and 4 as SEPARATE queries, not all at
-- once. The SQL editor wraps a whole script in one transaction, which holds
-- locks on storage.objects and storage.buckets at the same time while
-- Supabase's storage service is using both — that deadlocks
-- ("40P01: deadlock detected"). One part per run keeps each lock brief.
-- A deadlock is harmless and changes nothing: just re-run that part.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1A — run on its own.
-- Cap what can be stored in the bucket, and to which image types.
-- Touches storage.buckets only.
-- -----------------------------------------------------------------------------

set lock_timeout = '5s';

update storage.buckets
set file_size_limit = 10485760,  -- 10 MB
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'
    ]
where id = 'photos';

-- -----------------------------------------------------------------------------
-- PART 1B — run on its own, after 1A.
-- Storage: stop anonymous enumeration of the photos bucket.
--
-- The old policy granted `select` on storage.objects to every role including
-- anon, which is what the storage *list* endpoint checks — so anyone with the
-- anon key (it ships in the browser bundle) could list every stored file,
-- including the children's roster photos. Reading an object by its exact URL
-- still works, because the bucket is public and that route ignores RLS; object
-- paths are random UUIDs, so they can't be guessed. The app itself never lists
-- or downloads from storage, so nothing breaks.
-- -----------------------------------------------------------------------------

set lock_timeout = '5s';

drop policy if exists photos_public_read on storage.objects;
drop policy if exists photos_read_approved on storage.objects;
create policy photos_read_approved on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and public.is_approved());

-- -----------------------------------------------------------------------------
-- PART 2 — run on its own.
-- New accounts are always pending parents.
--
-- The head coach already exists, so the "first signup becomes coach"
-- bootstrap is now only a liability: it re-arms whenever the coach count
-- reaches zero. Promote additional coaches from Coaching Corner -> Approvals.
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'parent',
    'pending'
  );
  return new;
end;
$$;

-- Never let the team end up with no approved coach (which would re-open the
-- bootstrap above and lock everyone out of the Coaching Corner).
create or replace function public.guard_last_coach()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  was_coach boolean;
  remaining int;
begin
  was_coach := (old.role = 'coach' and old.status = 'approved');
  if not was_coach then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'UPDATE'
     and new.role = 'coach' and new.status = 'approved' then
    return new;
  end if;

  select count(*) into remaining
  from public.profiles
  where role = 'coach' and status = 'approved' and id <> old.id;

  if remaining = 0 then
    raise exception 'Cannot remove the last approved coach';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists profiles_guard_last_coach on public.profiles;
create trigger profiles_guard_last_coach
  before update or delete on public.profiles
  for each row execute function public.guard_last_coach();

-- -----------------------------------------------------------------------------
-- PART 3 — run on its own.
-- RSVPs: back to per-family rows, with headcounts via a function.
--
-- Making every RSVP row readable by every parent also exposed the free-text
-- `note` field. Parents now see only their own children's rows; the event
-- cards get their headcounts from rsvp_counts() instead.
-- -----------------------------------------------------------------------------

drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps
  for select using (
    public.is_coach()
    or exists (
      select 1 from public.players p
      where p.id = rsvps.player_id and p.parent_id = auth.uid()
    )
  );

create or replace function public.rsvp_counts()
returns table (event_id uuid, going int, maybe int, not_going int)
language sql
stable
security definer
set search_path = public
as $$
  select r.event_id,
         count(*) filter (where r.status = 'going')::int,
         count(*) filter (where r.status = 'maybe')::int,
         count(*) filter (where r.status = 'not_going')::int
  from public.rsvps r
  where public.is_approved()
  group by r.event_id;
$$;

grant execute on function public.rsvp_counts() to authenticated;

-- -----------------------------------------------------------------------------
-- PART 4 — run on its own.
-- Re-check approval on writes.
--
-- A parent whose access was revoked still "owns" their child rows, so the
-- ownership test alone kept letting them write.
-- -----------------------------------------------------------------------------

drop policy if exists rsvps_write on public.rsvps;
create policy rsvps_write on public.rsvps
  for all
  using (
    public.is_approved() and (
      public.is_coach()
      or exists (
        select 1 from public.players p
        where p.id = rsvps.player_id and p.parent_id = auth.uid()
      )
    )
  )
  with check (
    public.is_approved() and (
      public.is_coach()
      or exists (
        select 1 from public.players p
        where p.id = rsvps.player_id and p.parent_id = auth.uid()
      )
    )
  );

create or replace function public.release_snack_slot(slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_approved() then
    raise exception 'Not authorized';
  end if;

  update public.snack_slots
  set claimed_by = null,
      claimed_by_name = null
  where id = slot_id
    and (claimed_by = auth.uid() or public.is_coach());
end;
$$;

grant execute on function public.release_snack_slot(uuid) to authenticated;
