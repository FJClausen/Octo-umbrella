-- =============================================================================
-- Practice plans: general coach's notes field (replaces free text in the
-- warmup/exercises/scrimmages sections, which now hold selected exercises).
-- Run this in the Supabase SQL editor AFTER the earlier migrations.
-- Safe to re-run.
-- =============================================================================

alter table public.practice_plans add column if not exists notes text;
