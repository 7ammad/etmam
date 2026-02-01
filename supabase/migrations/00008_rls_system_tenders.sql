-- Migration: Phase 8B — RLS for system tenders and app config
-- Purpose: Authenticated users can read tenders owned by SYSTEM_USER_ID (scraper)
--          and read/write own profile. Anonymous cannot read tenders or profiles.
-- Uses app_config + get_system_user_id() so RLS can allow "read system tenders".

-- ============================================================
-- 1. App config table and system user id (for RLS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

COMMENT ON TABLE public.app_config IS 'Key-value config for RLS and app (e.g. system_user_id).';

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
-- No policies: only get_system_user_id() (SECURITY DEFINER) and service role can read.

INSERT INTO public.app_config (key, value)
VALUES ('system_user_id', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (key) DO NOTHING;

-- Function used by RLS policies: returns UUID of the system user (scraper owner).
-- Update app_config set value = '<your SYSTEM_USER_ID>' where key = 'system_user_id'; to match .env.
CREATE OR REPLACE FUNCTION public.get_system_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT value::uuid FROM public.app_config WHERE key = 'system_user_id' LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_system_user_id() IS 'Returns system user UUID for RLS (tenders owned by scraper).';

-- ============================================================
-- 2. Tenders: allow SELECT for own rows OR system user rows
-- ============================================================

DROP POLICY IF EXISTS "Users can view own tenders" ON public.tenders;

CREATE POLICY "Users can view own or system tenders"
  ON public.tenders FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = public.get_system_user_id()
  );

-- INSERT/UPDATE/DELETE stay owner-only (sync API uses service role for system inserts).

-- ============================================================
-- 3. Evaluations: allow SELECT when tender is own or system
-- ============================================================

DROP POLICY IF EXISTS "Users can view evaluations for own tenders" ON public.evaluations;

CREATE POLICY "Users can view evaluations for own or system tenders"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenders t
      WHERE t.id = evaluations.tender_id
      AND (t.user_id = (SELECT auth.uid()) OR t.user_id = public.get_system_user_id())
    )
  );

-- INSERT/UPDATE/DELETE stay as-is (only for own tenders; system evaluations via service role).

-- ============================================================
-- 4. CRM Pushes: allow SELECT when tender is own or system
-- ============================================================

DROP POLICY IF EXISTS "Users can view pushes for own tenders" ON public.crm_pushes;

CREATE POLICY "Users can view pushes for own or system tenders"
  ON public.crm_pushes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenders t
      WHERE t.id = crm_pushes.tender_id
      AND (t.user_id = (SELECT auth.uid()) OR t.user_id = public.get_system_user_id())
    )
  );

-- INSERT/UPDATE/DELETE unchanged.
