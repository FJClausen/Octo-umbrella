-- ---------------------------------------------------------------------------
-- The shared podium for Asha's Adventure.
--
-- Run this once in the Supabase SQL editor, then paste your Project URL and
-- anon public key into ../src/config.js.
--
-- The page is public, so anyone with the link can add a score. That is fine for
-- a family game, but the checks below keep the table from being filled with
-- nonsense: names are short, and a time has to be somewhere between one second
-- and two hours.
-- ---------------------------------------------------------------------------

create table if not exists public.asha_scores (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 24),
  total_ms   integer not null check (total_ms between 1000 and 7200000),
  falls      integer not null default 0 check (falls between 0 and 500),
  hearts     integer not null default 0 check (hearts between 0 and 200),
  created_at timestamptz not null default now()
);

-- Reading the podium is the common case, so index the ordering it uses.
create index if not exists asha_scores_total_ms_idx
  on public.asha_scores (total_ms asc);

alter table public.asha_scores enable row level security;

-- Anyone may read the list and add their own run. Nobody may change or delete
-- an existing row -- there is no policy for update or delete, so those are
-- refused.
drop policy if exists "anyone can read the podium" on public.asha_scores;
create policy "anyone can read the podium"
  on public.asha_scores for select
  using (true);

drop policy if exists "anyone can add a run" on public.asha_scores;
create policy "anyone can add a run"
  on public.asha_scores for insert
  with check (true);

grant select, insert on public.asha_scores to anon;

-- To wipe the podium before sending the game to her:
--   truncate public.asha_scores;
