# Dashboard RLS Fix — Implementation Report

**Date:** 2026-02-02  
**Scope:** Fix dashboard bypassing Row-Level Security (RLS) per security audit.

## 1. Data fetching

- **File:** `lib/queries/tender.ts`
- **Change:** All tender queries now use `createClient()` from `@/lib/supabase/server` (async, session/cookie-based) instead of `createServiceClient()` (service role, bypasses RLS).
- **Updated functions:**
  - `getTenders`, `getHistoricalTenders`, `getTenderById`, `getTenderStats`, `getTendersByRouting` — dashboard reads.
  - `createTender`, `createTenders` — use `supabase.auth.getUser()` for `user_id`; throw if unauthenticated.
  - `updateTender`, `deleteTender`, `clearAllTenders` — now run under RLS (user can only affect own + visible tenders).
- **Diagnostic:** `testDatabaseConnection` now takes `Awaited<ReturnType<typeof createClient>>` (RLS-scoped client).
- **Type fix:** `clearAllTenders` select result cast to `{ id: string }[]` for correct inference.

## 2. Policies

- **Checked:** `supabase/migrations` for `tenders` RLS.
- **Result:** RLS already enabled and SELECT policy present:
  - `00001_initial_schema.sql`: RLS enabled; "Users can view own tenders".
  - `00008_rls_system_tenders.sql` / `00009_rls_optimize_system_user_id.sql`: Policy "Users can view own or system tenders" (`user_id = auth.uid() OR user_id = get_system_user_id()`).
- **Decision:** No new migration. Adding a policy with `USING (true)` would allow any authenticated user to read all tenders; current policy is correct.

## 3. Verification

- `pnpm type-check` — pass.
- Dashboard page still calls `getTenders()` from `app/[locale]/dashboard/page.tsx`; no change there (data now respects RLS via `createClient()` in `lib/queries/tender.ts`).
- Cron/sync and evaluation sync routes continue to use `createServiceClient()` where system-level operations are required; unchanged.

## 4. Summary

| Item | Status |
|------|--------|
| Tender queries use `createClient()` (server, RLS) | Done |
| Create tender/tenders use session user | Done |
| Tenders SELECT policy exists | Confirmed (no new migration) |
| Type-check | Pass |
