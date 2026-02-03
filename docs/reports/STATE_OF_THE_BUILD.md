# State of the Build — Pre-Flight Architecture Audit

**Date:** 2026-02-02  
**Scope:** Auth & security, database schema & types, dashboard wiring.

---

## 1. Supabase Auth & Security

### 1.1 Middleware and route protection

| Item | Status | Details |
|------|--------|--------|
| **middleware.ts** | ❌ **Missing** | There is **no** `middleware.ts` at the project root (or under `src/`). Next.js never runs a middleware entry point. |
| **proxy.ts** | ⚠️ **Present but unused** | `proxy.ts` at project root contains full auth + i18n logic: protected routes (`/dashboard`, `/settings`, `/tenders`, `/update-password`), session refresh via `supabase.auth.getUser()`, redirect of unauthenticated users to `/${locale}/login`, and redirect of authenticated users away from `/login`, `/forgot-password`, `/signup`. It is **never invoked** because Next.js only runs a file named `middleware.ts` (or `middleware.js`). |
| **Dashboard protection** | ✅ **Via layout** | `app/[locale]/dashboard/layout.tsx` and `app/[locale]/settings/layout.tsx` call `await requireAuth()`, which uses `createClient()` from `@/lib/supabase/server` and `supabase.auth.getUser()`. Unauthenticated users are redirected (default `redirectTo = '/ar/login'`). So **dashboard and settings are protected**, but only at the layout level; there is no middleware-level protection or session refresh on every request. |

**Verdict:** Dashboard routes (`/[locale]/dashboard/*`, `/[locale]/settings/*`) **are** protected, but only by layout `requireAuth()`. The logic in `proxy.ts` (session refresh + early redirect) is dead code until it is exposed as Next.js middleware (e.g. by adding `middleware.ts` that exports and calls it).

### 1.2 Supabase server and client (SSR auth / cookies)

| File | Status | Details |
|------|--------|--------|
| **lib/supabase/server.ts** | ✅ | Uses `@supabase/ssr` `createServerClient` with `cookies()` from `next/headers`. `getAll()` / `setAll()` implemented; comment notes that `setAll` may be no-op in Server Components when middleware is not refreshing sessions (consistent with current no-middleware setup). |
| **lib/supabase/client.ts** | ✅ | Uses `createBrowserClient` from `@supabase/ssr` with anon key; correct for client-side auth. |
| **createServiceClient()** | ✅ | Uses `@supabase/supabase-js` with service role key, `persistSession: false`, no cookies — correct for server-only, RLS-bypass use (e.g. sync API). |

**Verdict:** Cookie handling for SSR auth is correct for the current setup. Session refresh on every request would require middleware (e.g. wiring `proxy.ts` as `middleware.ts`).

### 1.3 Login page and auth callback

| Item | Status | Details |
|------|--------|--------|
| **app/[locale]/login/page.tsx** | ✅ | Client component; form submits to `loginAction(email, password)`. |
| **actions/auth.ts** | ✅ | `loginAction` uses `createClient()` from `@/lib/supabase/server` and `supabase.auth.signInWithPassword({ email, password })`. On success, `revalidatePath('/', 'layout')`; client redirects to `redirectTo` or `/${locale}/dashboard`. |
| **app/auth/callback/route.ts** | ✅ | Uses `createClient()` from server; handles `code` via `exchangeCodeForSession(code)`; redirects for recovery to `/[locale]/update-password`, otherwise to `next` or `/[locale]/dashboard`. Reads locale from cookie; handles `error` query param. |
| **Signup / reset / update password** | ✅ | `signupAction`, `resetPasswordAction`, `updatePasswordAction` use server `createClient()` and correct Supabase auth APIs; redirect URLs point to `auth/callback`. |

**Verdict:** Login is functional and connected to Supabase; auth callback and auth server actions are correctly implemented.

---

## 2. Database Schema & Types

### 2.1 types/database.ts vs migrations

| Area | Status | Details |
|------|--------|--------|
| **tenders** | ✅ | Row/Insert/Update include `booklet_price_sar`, `initial_guarantee_sar`, `project_duration`, `award_amount_sar`, `award_date`, `winning_bidder`, `raw_data`, etc. Aligned with migrations (e.g. 00003, 00005, 00010). |
| **evaluations** | ✅ | Row/Insert/Update include: base columns (id, tender_id, score, recommendation, summary, strengths, risks, missing_requirements, action_items, breakdown, model_used); Oracle/dual-track from 00004 (`oracle_metadata`, `predicted_budget_min`, `predicted_budget_max`, `routing_decision`); and 00014 columns (`predicted_value_sar`, `value_method`, `infratech_score`, `exotech_score`, `work_type`). TypeScript uses `number | null` for numeric columns; migration uses BIGINT/SMALLINT — consistent. |
| **00014_evaluations_dual_track.sql** | ✅ | Adds: `predicted_value_sar` (BIGINT), `value_method` (TEXT), `infratech_score` (SMALLINT), `exotech_score` (SMALLINT), `work_type` (TEXT). All appear in `types/database.ts` with correct nullability and types. |
| **Other tables** | ✅ | `crm_configs`, `crm_pushes`, `profiles`, `phrase_translations` and Enums match the described schema. |

**Verdict:** No mismatch between TypeScript types and the migrations checked; `evaluations` in types matches 00014 (and 00004) as expected.

---

## 3. Dashboard Wiring

### 3.1 Data fetching and Supabase client

| Item | Status | Details |
|------|--------|--------|
| **app/[locale]/dashboard/page.tsx** | ✅ Server Component | Async; no `"use client"`. Calls `getTenders()` from `@/lib/queries/tender`. |
| **lib/queries/tender.ts — getTenders()** | ⚠️ **Service client** | Uses `createServiceClient()` (service role), **not** `createClient()` from `@/lib/supabase/server`. So dashboard tender list **bypasses RLS**; all rows visible to the backend are returned. |
| **intent** | Design choice | If the product is “single-tenant or shared tenders for all authenticated users,” this is consistent. If it is “multi-tenant by user_id / RLS,” then the dashboard should use the user-scoped `createClient()` so RLS can filter by `auth.uid()` / `user_id`. |

**Verdict:** Dashboard fetches data on the server via `getTenders()` (good for performance and security of the server boundary). The important point is **which** client is used: currently **service client** (RLS bypass). No critical bug if the app is designed as shared tenders; **critical** if per-user data isolation is required.

### 3.2 Layout and auth

- **app/[locale]/dashboard/layout.tsx** calls `requireAuth()` then renders `AuthenticatedShell`; **app/[locale]/settings/layout.tsx** same. So the main dashboard and settings are behind the auth guard.

---

## 4. State of the Build — Summary

| Area | Overall | Notes |
|------|--------|--------|
| **Auth & security** | ⚠️ Functional, gaps | Login, callback, and layout guards work. No middleware in use; session refresh and early redirect in `proxy.ts` are unused. |
| **Database & types** | ✅ | Types align with migrations; `evaluations` matches 00014 and dual-track design. |
| **Dashboard wiring** | ✅ / ⚠️ | Server-side fetch with service client; confirm RLS vs shared-data intent. |

---

## 5. Critical Missing Pieces / Recommendations

1. **Middleware exists in spirit but is not active (critical)**  
   - **Finding:** `proxy.ts` implements session refresh and protection of `/dashboard`, `/settings`, `/tenders`, `/update-password`, but Next.js does not run it because there is no `middleware.ts`.  
   - **Impact:** Session refresh does not run on every request; protection relies entirely on layout `requireAuth()`. Users could hold stale sessions until they hit a protected layout.  
   - **Recommendation:** Add `middleware.ts` at the project root that exports the proxy logic (e.g. `export { proxy as default }` from `./proxy`, or move the implementation into `middleware.ts` and export as default). Ensure the matcher and auth logic stay aligned with `proxy.ts` (e.g. exclude `/api`, `/auth`).

2. **requireAuth redirect ignores current locale (minor)**  
   - **Finding:** `requireAuth(redirectTo = '/ar/login')` is called without passing the current locale from the URL. So an unauthenticated visit to `/en/dashboard` still redirects to `/ar/login`.  
   - **Recommendation:** Have the dashboard (and settings) layout pass the current locale into `requireAuth`, e.g. `requireAuth(\`/${locale}/login\`)`, so redirect preserves locale.

3. **Dashboard data and RLS (critical only if multi-tenant)**  
   - **Finding:** `getTenders()` (and likely other tender queries) use `createServiceClient()`, so RLS is not applied.  
   - **Recommendation:** If tenders must be scoped per user (or by RLS policy), switch dashboard data fetching to use `createClient()` from `@/lib/supabase/server` and rely on RLS. If tenders are intentionally shared for all authenticated users, document this and leave as-is.

---

*Audit based on: middleware/proxy usage, `lib/supabase/server.ts` and `client.ts`, `app/[locale]/login`, `app/auth/callback`, `lib/auth/guard.ts`, `actions/auth.ts`, `types/database.ts`, `supabase/migrations/00014_evaluations_dual_track.sql` and related migrations, `app/[locale]/dashboard/page.tsx` and layout, `lib/queries/tender.ts`.*
