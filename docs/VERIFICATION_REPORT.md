# Codebase Verification Report

**Date:** 2026-02-01  
**Scope:** Entire codebase (type-check, lint, phase verifiers, build, e2e tests).

---

## Summary

| Gate | Result | Evidence |
|------|--------|----------|
| **pnpm type-check** | ✅ PASS | Exit code 0 |
| **pnpm lint** | ❌ FAIL | Exit code 1 – see [Lint](#lint) |
| **pnpm run verify:phase-1** | ✅ PASS | 5/5 checks |
| **pnpm run verify:phase-2** | ✅ PASS | 6/6 checks |
| **pnpm run verify:historical** | ✅ PASS | 12/12 checks |
| **pnpm run build** | ✅ PASS | Exit code 0 (one config warning) |
| **pnpm test** (Playwright) | ❌ FAIL | 19 passed, 12 failed |

---

## 1. TypeScript type-check

**Command:** `pnpm type-check` → `tsc --noEmit`

**Result:** ✅ **PASS** (exit code 0)

```
> tsc --noEmit
```

---

## 2. Lint

**Command:** `pnpm lint` → `next lint`

**Result:** ❌ **FAIL** (exit code 1)

**Output:**
```
Invalid project directory provided, no such directory: C:\Dev\Builds\etmam-app\lint
```

**Cause:** Next.js 16 appears to treat the first positional as the project directory; when run as `next lint` (no explicit path), `"lint"` is being interpreted as the directory name. Known class of issues (e.g. flag/dir parsing in Next lint).

**Direct ESLint:** Project has no `eslint.config.(js|mjs|cjs)` (ESLint 9 flat config) and no `.eslintrc.*` in root, so `pnpm exec eslint .` fails with "couldn't find an eslint.config file".

**Actionable fix:**
- Run lint via Next with an explicit directory, e.g. `next lint .` — if that still fails, try updating Next.js to the latest patch.
- Or add an `eslint.config.js` (and optionally use `eslint-config-next`) and run `pnpm exec eslint .` for CI.

---

## 3. Phase verifiers

### verify:phase-1 (Foundation: Database & Schema)

**Command:** `pnpm run verify:phase-1`

**Result:** ✅ **PASS**

- Task 1.1: Database Migration  
- Task 1.2.1: types/tender.ts  
- Task 1.2.2: lib/ai/schemas.ts  
- Task 1.2.3: types/database.ts  
- TypeScript type check  

**Summary:** Passed: 5, Failed: 0, Warnings: 0  

---

### verify:phase-2 (Oracle pipeline)

**Command:** `pnpm run verify:phase-2`

**Result:** ✅ **PASS**

- Task 2.1: AI Configuration (4/4)  
- Task 2.2: Oracle Prompt (7/7)  
- Task 2.3: Oracle Action (7/7)  
- Task 2.4: Schema Alignment (2/2)  
- Database migration (Oracle fields, GIN index)  
- TypeScript type check  

**Summary:** Passed: 6, Failed: 0, Warnings: 0  

---

### verify:historical (Historical scraper)

**Command:** `pnpm run verify:historical`

**Result:** ✅ **PASS**

- Phase 1.1–1.3: config, etimad-browser, run-scraper  
- Phase 2.1–2.5: types/scraper, config labels, etimad-browser award extraction, JSON schema  
- Phase 3.1–3.3: migration 00005, types/database, tenderToDbFormat  
- ScrapedTender schema, TypeScript type-check  

**Summary:** Passed: 12, Failed: 0  

---

## 4. Production build

**Command:** `pnpm run build` → `next build`

**Result:** ✅ **PASS** (exit code 0)

**Build output (excerpt):**
- Compiled successfully in 4.6s  
- Generating static pages: 27/27  
- Routes generated for app, locale, dashboard, API routes, auth  

**Warning (non-blocking):**
```
Invalid next.config.ts options detected:
  Unrecognized key(s) in object: 'turbo' at "experimental"
```
Current `next.config.ts` only sets `experimental.serverActions`; `turbo` may be coming from the Next.js or next-intl default. Safe to ignore unless you explicitly add `experimental.turbo`; or remove it from config if it appears there.

---

## 5. Playwright e2e tests

**Command:** `pnpm test` → `playwright test`

**Result:** ❌ **FAIL** (19 passed, 12 failed)

### Failed tests (12)

| Spec | Test | Failure |
|------|------|---------|
| **crm-push.spec.ts** | CRM settings page shows Odoo section or login | `hasCRMSettings \|\| hasOdoo \|\| hasLogin` false (page content not as expected) |
| **crm-push.spec.ts** | tender detail page loads or redirect to login | `hasDashboard \|\| hasLogin` false |
| **crm-push.spec.ts** | upload form visible in empty state or dashboard has export | `hasUploadForm \|\| hasExport \|\| hasLogin \|\| hasDashboard` false |
| **home.spec.ts** | should display the app title in Arabic | `getByText('إتمام', { exact: true })` not visible |
| **home.spec.ts** | should display English content on /en route | (content/locale assertion) |
| **home.spec.ts** | should navigate to dashboard from home | Redirect to `/ar/login?redirectTo=...` instead of `/ar/dashboard` (auth required) |
| **upload-flow.spec.ts** | upload CSV imports tenders successfully | Timeout: button `رفع ملف|uploadFile` not found |
| **upload-flow.spec.ts** | upload XLSX imports tenders successfully | Same button timeout |
| **upload-flow.spec.ts** | upload invalid file shows error without crash | Same button timeout |
| **upload-flow.spec.ts** | import idempotency: ... | Same button timeout |
| **upload-flow.spec.ts** | Arabic headers are correctly mapped | Same button timeout |
| **upload-flow.spec.ts** | empty file shows appropriate error | Same button timeout |

### Likely causes

1. **Auth:** Unauthenticated sessions redirect to login; tests that expect dashboard/settings without signing in will fail unless tests run in an authenticated context (e.g. storage state / fixture).
2. **Selectors / copy:** Home page may not show "إتمام" exactly as in the test; or English copy on `/en` differs from expectations.
3. **Upload button:** Button with role and name `رفع ملف|uploadFile` not found within timeout (dashboard may be behind login, or label/role changed).

### Actionable fixes

- **Auth:** Use Playwright auth fixture or `storageState` so dashboard/settings and upload flows run while logged in; or mark auth-required tests and run them only when auth is configured.
- **Home / locale:** Align tests with current home page copy and structure (e.g. where "إتمام" and English content appear), or relax assertions (e.g. “contains” or i18n key).
- **Upload:** Ensure the upload trigger is the one with `role="button"` and the correct accessible name (e.g. from messages); if it’s a link or different control, update the selector.

---

## 6. What was run

| # | Command | Exit | Duration (approx) |
|---|---------|------|-------------------|
| 1 | `pnpm type-check` | 0 | ~6s |
| 2 | `pnpm lint` | 1 | ~3s |
| 3 | `pnpm run verify:phase-1` | 0 | ~6s |
| 4 | `pnpm run verify:phase-2` | 0 | ~5s |
| 5 | `pnpm run verify:historical` | 0 | ~5s |
| 6 | `pnpm run build` | 0 | ~15s |
| 7 | `pnpm test` | 1 | ~48s |

---

## 7. Conclusion

- **Passing:** type-check, verify:phase-1, verify:phase-2, verify:historical, production build.
- **Failing:** lint (Next.js lint directory parsing / missing ESLint config), Playwright e2e (auth, selectors, copy).

Address lint via `next lint` workaround or ESLint flat config; address e2e by adding auth to tests and updating selectors/assertions to match current UI and copy.
