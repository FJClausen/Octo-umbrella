-- =============================================================================
-- Optional sample data so the site isn't empty on first run.
-- Run AFTER 0001_init.sql. Everything here is safe to delete later from the
-- Coaches Corner. It does not create any login accounts.
-- =============================================================================

-- Sample roster (first names only shown publicly; last names are coach-only) --
insert into public.players (first_name, positions) values
  ('Ava', array['Forward']),
  ('Mia', array['Midfielder']),
  ('Sofia', array['Defender']),
  ('Zoe', array['Goalkeeper']),
  ('Lily', array['Forward']),
  ('Emma', array['Midfielder', 'Defender']),
  ('Olivia', array['Defender']),
  ('Harper', array['Midfielder'])
on conflict do nothing;

-- Sample calendar --------------------------------------------------------------
insert into public.events (type, title, opponent, location, starts_at, ends_at, notes) values
  ('practice', 'Team Practice', null, 'Riverside Field 3',
     (now() + interval '2 days')::date + time '17:30', (now() + interval '2 days')::date + time '19:00',
     'Bring water and shin guards.'),
  ('game', 'Home Game', 'Northside United', 'Riverside Field 1',
     (now() + interval '5 days')::date + time '10:00', (now() + interval '5 days')::date + time '11:30',
     'Arrive 30 minutes early for warm-ups.'),
  ('game', 'Away Game', 'Valley Strikers', 'Valley Sports Complex',
     (now() + interval '12 days')::date + time '13:00', (now() + interval '12 days')::date + time '14:30',
     'Carpool sign-up coming soon.'),
  ('event', 'Team Pizza Party', null, 'Tony''s Pizzeria',
     (now() + interval '18 days')::date + time '18:00', (now() + interval '18 days')::date + time '20:00',
     'End-of-month celebration for players and families.')
on conflict do nothing;

-- Sample news ------------------------------------------------------------------
insert into public.news (title, body, published) values
  ('Welcome to the team site!',
   'This is our home base for the season. Check the calendar for games and practices, RSVP for each event, sign up for snacks, and read team news here. Parents, please complete your account so we know who''s who!',
   true),
  ('Uniforms have arrived',
   'Jerseys and shorts are in! We''ll hand them out at the next practice. Please label everything with your player''s name.',
   true)
on conflict do nothing;

-- Sample snack slots tied to upcoming games -----------------------------------
insert into public.snack_slots (event_id, slot_date, label)
select e.id, e.starts_at::date, 'Half-time snack + water'
from public.events e
where e.type = 'game'
on conflict do nothing;
