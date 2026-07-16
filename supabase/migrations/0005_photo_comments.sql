-- =============================================================================
-- Comments on Team Gallery photos.
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- Safe to re-run.
-- =============================================================================

create table if not exists public.photo_comments (
  id           uuid primary key default gen_random_uuid(),
  photo_id     uuid not null references public.gallery_photos (id) on delete cascade,
  author_id    uuid references public.profiles (id) on delete set null,
  -- Denormalized display name so parents can see who commented without
  -- being able to read other parents' full profiles (email/phone).
  author_name  text,
  body         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists photo_comments_photo_idx
  on public.photo_comments (photo_id, created_at);

alter table public.photo_comments enable row level security;

drop policy if exists photo_comments_select on public.photo_comments;
create policy photo_comments_select on public.photo_comments
  for select using (public.is_approved());

drop policy if exists photo_comments_insert on public.photo_comments;
create policy photo_comments_insert on public.photo_comments
  for insert with check (public.is_approved() and author_id = auth.uid());

drop policy if exists photo_comments_delete on public.photo_comments;
create policy photo_comments_delete on public.photo_comments
  for delete using (author_id = auth.uid() or public.is_coach());
