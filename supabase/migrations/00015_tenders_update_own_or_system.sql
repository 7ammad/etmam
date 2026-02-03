-- Allow authenticated users to UPDATE tenders they can see (own or system).
-- Without this, Run analysis on system tenders fails: updateTender uses user-scoped
-- client and RLS only allowed UPDATE for owner, so 0 rows → PGRST116.
-- Aligns UPDATE with SELECT visibility (Supabase RLS: same principle for read/write).

DROP POLICY IF EXISTS "Users can update own tenders" ON public.tenders;

CREATE POLICY "Users can update own or system tenders"
  ON public.tenders FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR user_id = (SELECT public.get_system_user_id())
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR user_id = (SELECT public.get_system_user_id())
  );
