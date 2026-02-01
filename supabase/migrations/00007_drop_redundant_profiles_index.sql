-- Migration: Drop redundant index on profiles(id) (Postgres best practice)
-- Purpose: Primary key on profiles(id) already creates a unique B-tree index.
-- A separate idx_profiles_id is redundant (duplicate index); drop it.

DROP INDEX IF EXISTS public.idx_profiles_id;
