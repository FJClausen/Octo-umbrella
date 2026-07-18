-- =============================================================================
-- Saved exercises: coaches' 1-5 star rating.
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- Safe to re-run.
-- =============================================================================

alter table public.exercise_templates add column if not exists rating int
  check (rating between 1 and 5);
