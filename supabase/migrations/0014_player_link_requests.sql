-- =============================================================================
-- Let a newly approved parent claim their child themselves: they pick the
-- player from the roster, which raises a request the coach approves. Until
-- now a coach had to notice and link every family by hand.
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- Safe to re-run.
-- =============================================================================

create table if not exists public.player_link_requests (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.players(id) on delete cascade,
  parent_id  uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending'
             check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  unique (player_id, parent_id)
);

alter table public.player_link_requests enable row level security;

-- A parent sees and raises only their own requests; coaches see them all.
drop policy if exists player_link_requests_select on public.player_link_requests;
create policy player_link_requests_select on public.player_link_requests
  for select using (parent_id = auth.uid() or public.is_coach());

drop policy if exists player_link_requests_insert on public.player_link_requests;
create policy player_link_requests_insert on public.player_link_requests
  for insert with check (parent_id = auth.uid() and public.is_approved());

-- Withdrawing your own request is fine; deciding one is the coach's job.
drop policy if exists player_link_requests_delete on public.player_link_requests;
create policy player_link_requests_delete on public.player_link_requests
  for delete using (
    public.is_coach()
    or (parent_id = auth.uid() and status = 'pending')
  );

drop policy if exists player_link_requests_update on public.player_link_requests;
create policy player_link_requests_update on public.player_link_requests
  for update using (public.is_coach()) with check (public.is_coach());
