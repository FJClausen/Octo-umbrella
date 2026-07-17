-- =============================================================================
-- Let all approved team members read RSVPs, so event cards can show
-- headcounts to parents (previously only coaches and the child's own
-- parent could read them). Writing is unchanged: parents can still only
-- RSVP for their own children.
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- =============================================================================

drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps
  for select using (public.is_approved());
