-- Migration: Phase 8B RLS performance — evaluate get_system_user_id() once per statement
-- Purpose: Wrap get_system_user_id() in (SELECT ...) so it is not called per row (Postgres best practice 3.3).

-- Tenders SELECT: (SELECT get_system_user_id()) instead of get_system_user_id()
DROP POLICY IF EXISTS "Users can view own or system tenders" ON public.tenders;

CREATE POLICY "Users can view own or system tenders"
  ON public.tenders FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = (SELECT public.get_system_user_id())
  );

-- Evaluations SELECT: same optimization in subquery
DROP POLICY IF EXISTS "Users can view evaluations for own or system tenders" ON public.evaluations;

CREATE POLICY "Users can view evaluations for own or system tenders"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenders t
      WHERE t.id = evaluations.tender_id
      AND (t.user_id = (SELECT auth.uid()) OR t.user_id = (SELECT public.get_system_user_id()))
    )
  );

-- CRM Pushes SELECT: same optimization
DROP POLICY IF EXISTS "Users can view pushes for own or system tenders" ON public.crm_pushes;

CREATE POLICY "Users can view pushes for own or system tenders"
  ON public.crm_pushes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenders t
      WHERE t.id = crm_pushes.tender_id
      AND (t.user_id = (SELECT auth.uid()) OR t.user_id = (SELECT public.get_system_user_id()))
    )
  );
