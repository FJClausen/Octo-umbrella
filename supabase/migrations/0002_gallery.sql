-- =============================================================================
-- Team Gallery: any approved parent or coach can share game-day photos.
-- Run this in the Supabase SQL editor AFTER 0001_init.sql.
-- =============================================================================

create table if not exists public.gallery_photos (
  id            uuid primary key default gen_random_uuid(),
  url           text not null,
  storage_path  text not null,
  caption       text,
  uploaded_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists gallery_photos_created_at_idx
  on public.gallery_photos (created_at desc);

alter table public.gallery_photos enable row level security;

drop policy if exists gallery_photos_select on public.gallery_photos;
create policy gallery_photos_select on public.gallery_photos
  for select using (public.is_approved());

drop policy if exists gallery_photos_insert on public.gallery_photos;
create policy gallery_photos_insert on public.gallery_photos
  for insert with check (public.is_approved() and uploaded_by = auth.uid());

drop policy if exists gallery_photos_delete on public.gallery_photos;
create policy gallery_photos_delete on public.gallery_photos
  for delete using (uploaded_by = auth.uid() or public.is_coach());

-- Storage: any approved user may upload into photos/gallery/*. Coaches can
-- already delete anything in the "photos" bucket (see 0001_init.sql); this
-- adds the ability for a parent to remove their own gallery upload, checked
-- against the gallery_photos row rather than storage's own "owner" column
-- (which varies across Supabase storage versions).
drop policy if exists photos_gallery_insert on storage.objects;
create policy photos_gallery_insert on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = 'gallery'
    and public.is_approved()
  );

drop policy if exists photos_gallery_own_delete on storage.objects;
create policy photos_gallery_own_delete on storage.objects
  for delete using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = 'gallery'
    and exists (
      select 1 from public.gallery_photos gp
      where gp.storage_path = storage.objects.name
        and gp.uploaded_by = auth.uid()
    )
  );
