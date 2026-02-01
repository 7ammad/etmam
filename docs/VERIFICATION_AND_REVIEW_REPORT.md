# Verification and Code Review Report

**Date:** 2026-02-01  
**Scope:** Recent changes since dashboard work (Supabase local, scraper, signup, dashboard fixes).

---

## 1. Verification Evidence

### 1.1 TypeScript

| Command | Result | Evidence |
|--------|--------|----------|
| `pnpm run type-check` | **PASS** | Exit code 0. |

**Fix applied:** `components/dashboard/scrape-actions-card.tsx` — added `completedAt?: number | string` to local `ScrapeStatus` interface so setState after sync-from-file and API response are type-correct.

### 1.2 Build

| Command | Result | Evidence |
|--------|--------|----------|
| `pnpm run build` | **PASS** | Exit code 0. All routes compiled; `/[locale]/signup` present. |

**Note:** Next.js warns: `Unrecognized key(s) in object: 'turbo' at "experimental"`. Non-blocking; consider removing invalid key from config.

### 1.3 Lint

| Command | Result | Evidence |
|--------|--------|----------|
| `pnpm run lint` | **FAIL** | `Invalid project directory provided, no such directory: .../lint`. |

**Conclusion:** Next/ESLint config or invocation issue (e.g. directory argument). Not caused by recent code changes. Fix separately (ESLint config / `next lint` args).

### 1.4 Scraper smoke

| Command | Result | Evidence |
|--------|--------|----------|
| `pnpm run scrape:smoke` | **FLAKY** | Passed in earlier run (6 tenders, 0 errors). In later run, timed out on tender 3 (loader still intercepting d-5/d-6 tab click). |

**Fixes applied:**

- **Loader wait (etimad-browser.ts):** Wait for `#loader` hidden (20s) and `.modal-backdrop` hidden (8s), then 200ms delay; for tabs d-5 and d-6 only, extra 2.5s delay before click to allow slow content load.
- Smoke can still time out on slow portal responses; consider increasing smoke timeout or reducing batch in CI.

### 1.5 E2E (Playwright)

| Command | Result | Evidence |
|--------|--------|----------|
| `pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/dashboard.spec.ts tests/e2e/upload-flow.spec.ts tests/e2e/crm-push.spec.ts` | **13 passed, 18 failed** | See below. |

**Failure categories (pre-existing / environment):**

1. **Auth redirect:** Dashboard and tender-detail tests hit `requireAuth()` and redirect to login when run unauthenticated. Tests expect dashboard URL or content without logging in.
2. **Home copy:** Tests expect exact text "Etmaam" / "إتمام" on home; copy or structure may have changed.
3. **Upload flow:** Tests look for button with name `/رفع ملف|uploadFile/i`; selector may not match current dashboard upload UI (or page is login, so button absent).

**Recommendation:** Either add auth fixture (login before dashboard/upload tests) or adjust expectations (e.g. “login page or dashboard”). Align upload button selector with actual label/role.

---

## 2. Files in Scope (Recent Changes)

| Area | Files |
|------|--------|
| **Supabase local** | `supabase/config.toml` (seed `sql_paths = []`), `.env.local` (local URL/keys; not in repo). |
| **Scraper** | `lib/scraper/etimad-browser.ts` (loader wait + d-5/d-6 delay), `scripts/run-scraper.ts` (`.env.local` loader). |
| **Signup** | `app/[locale]/login/page.tsx` (Sign up link), `app/[locale]/signup/page.tsx` (new), `actions/auth.ts` (signupAction), `messages/en.json`, `messages/ar.json` (auth keys). |
| **Dashboard** | `components/dashboard/scrape-actions-card.tsx` (ScrapeStatus + `completedAt`). |

---

## 3. Code Review Summary

### 3.1 Signup flow

- **Logic:** Client checks password match and length ≥ 8 before calling `signupAction`. Server-side Supabase `signUp` performs real validation.
- **Security:** `signupAction` uses server Supabase client; no secrets in client. Error messages are generic enough (e.g. “An account with this email already exists”).
- **Edge:** Empty email is still sent to server; Supabase rejects. Optional improvement: trim and non-empty check on client for UX.
- **i18n:** Signup and login copy use `auth.*` keys in en.json and ar.json; both locales covered.

### 3.2 Auth action (signupAction)

- **Redirect:** `emailRedirectTo` uses `NEXT_PUBLIC_APP_URL` with `/auth/callback`; correct for email confirmation.
- **Error handling:** “already registered” is detected via string inclusion; robust enough. Other errors surfaced as-is; consider sanitizing for production (e.g. avoid leaking internal codes).

### 3.3 run-scraper.ts .env.local loader

- **Behavior:** Only sets `process.env[key]` when not already set; shell/env overrides preserved.
- **Parsing:** Skips comments and malformed lines; strips optional quotes. No variable expansion (e.g. `${VAR}`); acceptable for `.env.local`.
- **Placement:** `loadEnvFile` runs at top level before main(); `API_URL` and `CRON_SECRET` available for `pnpm scrape:run`.

### 3.4 Scraper (etimad-browser.ts)

- **Loader:** Wait for `#loader` and `.modal-backdrop` hidden, then short delay; extra delay only for d-5/d-6 to reduce flakiness on slow pages.
- **Failure handling:** Per-tab failures are caught and logged; extraction continues for other tabs. Empty d-5 falls back to table extraction. Appropriate for robustness.

### 3.5 scrape-actions-card.tsx

- **Types:** `ScrapeStatus` now includes `completedAt?: number | string` so both API (string/ISO) and local `Date.now()` (number) are valid. No other logic change.

### 3.6 supabase/config.toml

- **Seed:** `sql_paths = []` avoids missing `seed.sql` on `db reset`. Document in README or runbook that adding `supabase/seed.sql` and setting `sql_paths = ["./seed.sql"]` re-enables seeding.

---

## 4. Fixes Applied This Session

| Issue | Fix |
|-------|-----|
| TS2353 in `scrape-actions-card.tsx`: `completedAt` not in `ScrapeStatus` | Added `completedAt?: number | string` to interface. |
| Scraper smoke timeout on d-5/d-6 (loader intercepts click) | Longer loader/backdrop wait (20s/8s), plus 2.5s delay before clicking d-5/d-6. |

---

## 5. Recommendations

1. **Lint:** Resolve `next lint` / directory error (config or script) so CI can run lint.
2. **E2E:** Add auth fixture or adjust tests for protected routes; align upload button selector with UI.
3. **Next config:** Remove invalid `experimental.turbo` (or align with Next 16 docs) to clear warning.
4. **Signup:** Optionally add client-side email trim/non-empty check before calling `signupAction`.
5. **Scraper smoke:** In CI, consider longer timeout for `scrape:smoke` or run with smaller batch; document flakiness due to external portal.

---

## 6. Sign-off

| Check | Status |
|-------|--------|
| Type-check | ✅ Pass |
| Build | ✅ Pass |
| Lint | ⚠️ Config/script issue (unchanged by recent code) |
| Scraper smoke | ⚠️ Flaky; logic improved |
| E2E | ⚠️ 13 pass, 18 fail (auth/copy/selectors; pre-existing) |
| Code review | ✅ No blocking issues; nits and recommendations above |

**Conclusion:** Recent changes (Supabase local, scraper loader/env, signup, dashboard ScrapeStatus) are type-correct, build successfully, and are consistent with existing patterns. Remaining failures are in lint configuration, E2E auth/selectors, and scraper smoke environment; addressing them is tracked in recommendations.
