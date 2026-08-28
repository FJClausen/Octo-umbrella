-- TriLift initial schema.
-- Every table is per-user and protected by row-level security: a signed-in user
-- can only ever see rows where user_id = auth.uid().

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  display_name             text,
  dob                      date,
  height_cm                numeric(5,1),
  sex                      text check (sex in ('male','female','other')),
  start_weight_kg          numeric(5,2),
  goal_weight_kg           numeric(5,2),
  ftp_watts                integer,
  weekly_loss_target_kg    numeric(3,2) not null default 0.45,
  protein_g_per_kg         numeric(3,1) not null default 2.0,
  photo_analysis_days      integer not null default 30,
  -- Everything is stored in kg; this only changes what the UI shows and accepts.
  unit_system              text not null default 'metric' check (unit_system in ('metric','imperial')),
  onboarded_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- body_logs — weekly check-in: weight, optional photo, optional tape measures
-- ---------------------------------------------------------------------------
create table public.body_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  logged_on    date not null default current_date,
  weight_kg    numeric(5,2),
  photo_path   text,
  measurements jsonb not null default '{}'::jsonb,
  notes        text,
  created_at   timestamptz not null default now(),
  unique (user_id, logged_on)
);
create index body_logs_user_date_idx on public.body_logs (user_id, logged_on desc);

-- ---------------------------------------------------------------------------
-- strength_sessions — one row per completed session
-- exercises shape: [{ key, name, sets: [{ weight_kg, reps, rpe }] }]
-- ---------------------------------------------------------------------------
create table public.strength_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  performed_on  date not null default current_date,
  template_key  text,
  exercises     jsonb not null default '[]'::jsonb,
  duration_min  integer,
  achilles_pain integer check (achilles_pain between 0 and 10),
  notes         text,
  created_at    timestamptz not null default now()
);
create index strength_sessions_user_date_idx
  on public.strength_sessions (user_id, performed_on desc);

-- ---------------------------------------------------------------------------
-- strava_accounts — OAuth tokens. NEVER exposed to the client: no RLS policy
-- grants select, so only the service role (edge functions) can read them.
-- ---------------------------------------------------------------------------
create table public.strava_accounts (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  athlete_id    bigint,
  athlete_name  text,
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz not null,
  scope         text,
  last_synced_at timestamptz,
  created_at    timestamptz not null default now()
);

-- Safe projection the app *can* read: connection state without the tokens.
-- Deliberately NOT security_invoker — the view runs as its owner so it can read
-- the base table, and does its own filtering by auth.uid(). That is what lets
-- the app show "connected" without ever being able to select a token.
create view public.strava_connection as
  select user_id, athlete_id, athlete_name, scope, last_synced_at, created_at
  from public.strava_accounts
  where user_id = (select auth.uid());

-- ---------------------------------------------------------------------------
-- strava_activities — synced cache of rides / swims / everything else
-- ---------------------------------------------------------------------------
create table public.strava_activities (
  id                       bigint primary key,
  user_id                  uuid not null references auth.users(id) on delete cascade,
  type                     text not null,
  sport_type               text,
  name                     text,
  start_date               timestamptz not null,
  elapsed_time_s           integer,
  moving_time_s            integer,
  distance_m               numeric(10,1),
  total_elevation_gain_m   numeric(8,1),
  average_watts            numeric(6,1),
  weighted_average_watts   numeric(6,1),
  max_watts                numeric(6,1),
  average_heartrate        numeric(5,1),
  max_heartrate            numeric(5,1),
  suffer_score             numeric(6,1),
  kilojoules               numeric(8,1),
  raw                      jsonb not null default '{}'::jsonb,
  synced_at                timestamptz not null default now()
);
create index strava_activities_user_date_idx
  on public.strava_activities (user_id, start_date desc);
create index strava_activities_user_type_idx
  on public.strava_activities (user_id, type, start_date desc);

-- ---------------------------------------------------------------------------
-- nutrition_logs — lightweight: a daily calorie + protein tally
-- ---------------------------------------------------------------------------
create table public.nutrition_logs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  logged_on  date not null default current_date,
  calories   integer,
  protein_g  integer,
  notes      text,
  updated_at timestamptz not null default now(),
  primary key (user_id, logged_on)
);

-- ---------------------------------------------------------------------------
-- photo_analyses — results of the AI progress-photo read
-- ---------------------------------------------------------------------------
create table public.photo_analyses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  body_log_id  uuid references public.body_logs(id) on delete set null,
  model        text,
  summary      text,
  emphasis     jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);
create index photo_analyses_user_idx on public.photo_analyses (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.body_logs          enable row level security;
alter table public.strength_sessions  enable row level security;
alter table public.strava_accounts    enable row level security;
alter table public.strava_activities  enable row level security;
alter table public.nutrition_logs     enable row level security;
alter table public.photo_analyses     enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own body logs" on public.body_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own strength sessions" on public.strength_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own nutrition logs" on public.nutrition_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own photo analyses" on public.photo_analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Activities are written by the sync edge function (service role, which bypasses
-- RLS); the app only ever reads them.
create policy "read own activities" on public.strava_activities
  for select using (auth.uid() = user_id);

-- strava_accounts has NO policies at all: the client can neither read nor write
-- it, so a token can never leave the server. Disconnecting goes through the
-- security-definer function below.
--
-- (A delete policy would not work here anyway: with no select policy, Postgres
-- matches zero rows for `delete ... where user_id = ...`, because referencing a
-- column in the WHERE clause requires select access. The delete would silently
-- succeed while removing nothing.)

-- ---------------------------------------------------------------------------
-- Create a profile row automatically on signup
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Disconnecting Strava
-- ---------------------------------------------------------------------------
create function public.disconnect_strava()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.strava_accounts where user_id = (select auth.uid());
$$;

revoke all on function public.disconnect_strava() from public;
grant execute on function public.disconnect_strava() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private bucket for progress photos, keyed by <user_id>/<file>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "own photos read" on storage.objects
  for select using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own photos write" on storage.objects
  for insert with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own photos delete" on storage.objects
  for delete using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
