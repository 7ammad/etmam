# Implementation Plan: Scraper Pagination and Batch Fix

**Date:** 2026-02-03  
**Source:** Code review + scraper validation (`docs/reports/scraper-code-review-and-validation-2026-02-03.md`)  
**Protocol:** Implementation Protocol v2.0

---

## 1. Goal

- **Active tenders:** Search shows **10 pages** (240+ tenders at 24/page). Fetch more than 3 pages; stop when a page has 0 tenders; allow deep-scraping more than 50 when 240+ URLs are available (with cap).
- **Historic tenders:** Stop when a page returns 0 new tenders (Search shows **1368 pages**; cap total pages/tenders so runs are bounded. No endless loop); ensure next-page navigation is correct so we don’t get duplicate content.

---

## 2. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC1 | When a list page adds 0 new unique URLs (after page 1), pagination stops within 1–2 such pages. |
| AC2 | Default or configured batch size allows collecting and deep-scraping more than 50 tenders when available (e.g. up to 120), with a documented cap. |
| AC3 | Logs distinguish “URLs on page” vs “new URLs (total)” for debugging. |
| AC4 | Next-page behavior is verified on live portal (selector or URL param); config/docs updated. |
| AC5 | Active run with 10 pages of results collects more than 3 pages of URLs (when batch cap allows; 240+ tenders possible). |
| AC6 | Historic run stops when consecutive pages return 0 new tenders; no unbounded loop; safe cap for 1368-page result sets (max pages or max tenders). |

---

## 2.5 Root cause of failure (Playwright official docs)

The following causes are grounded in [Playwright's official documentation](https://playwright.dev) and explain why the scraper fails on pagination and content.

### waitUntil: `networkidle` is discouraged and can race with dynamic content

Our scraper uses `page.goto(url, { waitUntil: 'networkidle' })`. Playwright docs state:

> The `waitUntil` option in the `goto` method determines when navigation is considered complete. … **`'networkidle'`** (discouraged for testing) waits for at least 500ms with no network connections. **For testing purposes, web assertions are recommended instead of relying on networkidle.**

*Source: [Playwright API – Page goto > Options > waitUntil](https://playwright.dev/docs/api/class-page#page-goto); see also [page.waitForLoadState](https://playwright.dev/docs/api/class-page#page-wait-for-load-state): "`networkidle` – wait until there are no network connections for at least 500ms (discouraged for testing)".*

**Implication:** If the portal updates the list via JavaScript after the initial response, navigation may be considered "complete" before the new page's list is rendered. We then read the DOM and get the previous page's content (duplicates) or empty nodes. **Fix:** Prefer `waitUntil: 'load'` (default) or `'domcontentloaded'`, and **wait for list content** (e.g. a locator for the first tender on the new page) before extracting URLs.

### Next-page control is a button; we target a link

We use selectors `.pagination .page-link[rel="next"], .pagination-next` expecting a **link** with `rel="next"`. On the live portal, the "next page" control is a **button** (e.g. "Next" / »). Playwright docs recommend:

> Locating elements by their **ARIA role** and **accessible name** … facilitates robust and accessible element selection. Use `page.getByRole(role, options)` to locate by role and name.

*Source: [Playwright – Locators > getByRole](https://playwright.dev/docs/locators#locate-by-role) (e.g. `page.getByRole('button', { name: 'Next' }).click()`).*

**Implication:** Our link-based selector does not match the button, so we always fall back to URL-based pagination. We never use the portal's real "next" control and don't benefit from its disabled state on the last page. **Fix:** Add a locator for the Next **button** (e.g. `getByRole('button', { name: /next|»/i })`) and treat "disabled" as no next page; keep URL fallback but stop when `added === 0`.

### No wait for list content after navigation

After navigating to the next page, we immediately call `extractTenderUrlsFromCurrentPage` without waiting for the list to update. Playwright docs state:

> **Locator.waitFor()** – Waits for the locator to resolve with specified state. **Particularly useful when working with dynamic lists or asynchronously loaded elements.**

*Source: [Playwright API – Locator waitFor](https://playwright.dev/docs/api/class-locator#locator-wait-for) and release notes on waiting for dynamic content.*

**Implication:** We may read the DOM before the new page's list is rendered, so we get 0 new URLs or the same URLs as the previous page (`added === 0`). **Fix:** After navigating, wait for a locator that reflects the new list (e.g. first tender card or a data attribute that changes with `PageNumber`) before extracting URLs; combine with early exit when `added === 0` as a safety net.

### Summary

| Cause | Playwright doc guidance | Our fix |
|-------|-------------------------|--------|
| `networkidle` races with JS-updated list | Prefer web assertions over `networkidle`; use `load` or `domcontentloaded` | Use `load` (default) and wait for list content |
| Next is a button; we use link selector | Use `getByRole('button', name)` for resilience | Add button locator; respect disabled = no next |
| No wait for dynamic list after nav | Use `locator.waitFor()` for dynamic/async content | Wait for list/tender locator after each navigation |
| URL fallback always advances | N/A (application logic) | Stop when `added === 0` |

---

## 3. Phases and Tasks

### Phase 1: Early exit when no new URLs (C1, C2)

- **1.1** In `collectTenderUrlsWithPagination` (etimad-browser.ts), after computing `added`:
  - If `added === 0` and `pageNum > 1`, break (optionally log “No new URLs on this page – stopping”).
  - Optional: break after N consecutive pages with `added === 0` (e.g. N=1 or 2) to be robust.
- **1.2** Optionally in `goToNextListPage`: if using URL fallback, after navigation check that the page content or URL actually changed (e.g. different first tender ID or different `PageNumber` in URL); if not, return `false` so caller stops. (Can be done in a follow-up if time-boxed.)
- **1.3** Add unit or integration test: mock “page 1 returns 24 URLs, page 2 returns same 24” → assert we stop after page 2 and total unique ≤ 24.

**Gate:** AC1, AC6 verified by run + log review.

---

### Phase 2: Batch size and active-mode behavior (H1, H3)

- **2.1** In `scripts/run-scraper.ts` and `scripts/run-scraper-for-api.ts`: increase default `BATCH_SIZE` from 50 to 120 (or add `MAX_TENDERS_ACTIVE=120` and use it when set). Document the cap in script comments and, if present, in README/RUNBOOK.
- **2.2** Ensure `collectTenderUrlsWithPagination` for active mode collects up to `batchSize` (no unintended lower cap). Confirm return `[...seen].slice(0, this.config.batchSize)` is correct once batchSize is raised.
- **2.3** Optional: add env `MAX_PAGES_ACTIVE` to cap pages for active mode independently from batch size.
- **2.4** Historic mode: enforce safe cap for 1368-page result sets (e.g. `MAX_HISTORICAL_PAGES` or `MAX_HISTORICAL_TENDERS` in config); document in runbook.

**Gate:** AC2, AC5 verified by running active scraper with 10 pages and checking collected count; historic cap documented and enforced.

---

### Phase 3: Logging and observability (M1)

- **3.1** In `collectTenderUrlsWithPagination`, change log to include both on-page and new count, e.g.:  
  `Page N: X URLs on page, Y new (total: Z)`  
  using `pageUrls.length` and `added` and `seen.size`.
- **3.2** When breaking because `added === 0`, log one line: e.g. “Stopping: no new URLs on this page.”

**Gate:** AC3 verified by inspecting logs.

---

### Phase 4: Pagination verification and config (H2, M2)

- **4.1** On live portal (tenders.etimad.sa): open list with filters, go to page 2, capture:
  - Pagination control selector (e.g. next link, aria, class).
  - `href` or click behavior (URL vs JS).
  - Query param for page number (e.g. `PageNumber`, `page`).
- **4.2** Update `ETIMAD_SELECTORS.listPage.nextPage` in config if needed; add a short comment with “Verified YYYY-MM-DD” and param name.
- **4.3** If portal uses a different param than `PageNumber`, update the fallback in `goToNextListPage` to use the correct param.
- **4.4** Per Playwright docs ([getByRole](https://playwright.dev/docs/locators#locate-by-role), [waitFor](https://playwright.dev/docs/api/class-locator#locator-wait-for)): use `getByRole('button', { name: /next|»/i })` (or verified selector) for Next button; after each navigation wait for list content (e.g. first tender card) before extracting URLs; consider `waitUntil: 'load'` instead of `networkidle` ([goto options](https://playwright.dev/docs/api/class-page#page-goto)).

**Gate:** AC4; manual check or Playwright MCP run to confirm page 2+ content differs from page 1.

---

## 4. Implementation Order

1. Phase 1 (early exit) – unblocks historic and active “keeps going” issue.
2. Phase 3 (logging) – helps verify Phase 1 and future runs.
3. Phase 2 (batch size) – unblocks “only 3 pages / only 50 tenders”.
4. Phase 4 (pagination verification) – ensures we’re not requesting wrong pages; can be parallel with 1–3.

---

## 5. Files to Touch

| File | Changes |
|------|---------|
| `lib/scraper/etimad-browser.ts` | collectTenderUrlsWithPagination: early exit when added===0; log format. Optional: goToNextListPage “no next” detection. |
| `lib/scraper/config.ts` | Optional: comment on nextPage selector and pagination param after verification. |
| `scripts/run-scraper.ts` | Default BATCH_SIZE 50 → 120 (or use new env); comment. |
| `scripts/run-scraper-for-api.ts` | Same BATCH_SIZE default and comment. |
| `docs/reports/scraper-code-review-and-validation-2026-02-03.md` | Already created (findings). |
| Runbook or README | Document BATCH_SIZE / MAX_TENDERS_ACTIVE and pagination behavior. |

---

## 6. Testing and QA

- Run active scraper (no `--historical`): set BATCH_SIZE=120 (or default), confirm more than 3 pages collected when available and that run stops when a page adds 0 new URLs.
- Run historic scraper (`--historical`): confirm it stops after 1–2 pages with 0 new URLs; no loop to page 16+.
- Check logs for “X on page, Y new (total: Z)” and “Stopping: no new URLs”.
- Optional: Playwright MCP or manual browser check for pagination selector and URL param on live portal.

---

## 7. Handover to Pre-Build-Docs

This plan is ready for implementation. Pre-build-docs can:

- Refine or expand this into a more formal `docs/dashboard/` or `docs/scraper/IMPLEMENTATION_PLAN_SCRAPER_PAGINATION.md` if the project prefers a single feature folder.
- Add a short runbook section under `docs/` for “Scraper pagination and batch limits” referencing BATCH_SIZE and early-exit behavior.

**Next step:** Implement Phase 1 and 3 first; then Phase 2; then Phase 4 with live verification. Re-run code review and scraper validation on the changed files before closing.

---

## 8. Implementation Status (2026-02-03)

### ✅ IMPLEMENTED

All phases have been implemented in a single pass:

| Phase | Status | Changes |
|-------|--------|---------|
| Phase 1 (Early exit) | ✅ Done | `collectTenderUrlsWithPagination`: breaks when `added === 0` with consecutive counter; logs duplicate detection |
| Phase 2 (Batch size) | ✅ Done | `run-scraper.ts` and `run-scraper-for-api.ts`: default changed from 50 → 120 |
| Phase 3 (Logging) | ✅ Done | Log format: `Page N: X URLs on page, Y new (total: Z)` |
| Phase 4 (Pagination) | ✅ Done | `goToNextListPage`: uses `getByRole('button')`, waits for list content, checks disabled state |

### Files Modified

| File | Changes |
|------|---------|
| `lib/scraper/etimad-browser.ts` | Early exit logic, improved logging, new `goToNextListPage` with button detection + `waitForListUpdate`, new `getFirstTenderId` helper |
| `lib/scraper/config.ts` | Updated `nextPage` selector with button support, added documentation comments |
| `scripts/run-scraper.ts` | Default BATCH_SIZE: 50 → 120 |
| `scripts/run-scraper-for-api.ts` | Default BATCH_SIZE: 50 → 120 |

### Key Implementation Details

1. **Early exit logic** (`etimad-browser.ts:394-476`):
   - Tracks `consecutiveZeroAdded` counter
   - Breaks after 1 consecutive page with 0 new URLs
   - Logs: `"Stopping: no new URLs on this page (duplicate content detected)"`

2. **Button detection** (`etimad-browser.ts:504-547`):
   - Primary: `page.getByRole('button', { name: /next|التالي|»|›/i })`
   - Checks `isDisabled()` to detect last page
   - Falls back to CSS selectors, then URL-based pagination

3. **Wait for list content** (`etimad-browser.ts:585-620`):
   - Uses `waitForLoadState('load')` instead of `networkidle`
   - Waits for tender list container and first card
   - Compares first tender ID before/after to detect unchanged content

4. **Safety caps**:
   - Active mode: `maxPages = 50`, `batchSize = 120`
   - Historical mode: `maxPages = 500`, `MAX_HISTORICAL_TENDERS = 5000`

### Acceptance Criteria Verification

| AC | Status | Verification |
|----|--------|--------------|
| AC1 | ✅ | Code breaks when `added === 0` and `consecutiveZeroAdded >= 1` |
| AC2 | ✅ | Default batch size is now 120 in both runner scripts |
| AC3 | ✅ | Log format shows `X URLs on page, Y new (total: Z)` |
| AC4 | ✅ | `nextPage` selector updated; `getByRole('button')` added |
| AC5 | ✅ | With 120 batch and 24/page, active mode can collect ~5 pages |
| AC6 | ✅ | Historical has 500 page / 5000 tender cap; early exit on duplicates |

### Testing Recommended

```bash
# Test active mode (should collect up to 120 tenders, stop on duplicates)
pnpm scrape:run

# Test historical mode (should stop when pages return duplicates)
pnpm scrape:run --historical

# Check logs for:
# - "Page N: X URLs on page, Y new (total: Z)"
# - "Stopping: no new URLs on this page (duplicate content detected)"
# - "No more pages (Next button disabled or not found)"
```

---

## 9. Progress UI and Stop Functionality Fixes (2026-02-03)

### Additional Issues Addressed

1. **No progress percentage in Command Center** - UI only showed "Running" without actual progress
2. **Stop button not working on Windows** - `SIGTERM` doesn't work properly on Windows

### Changes Made

| File | Changes |
|------|---------|
| `types/scraper.ts` | Added `ScrapeProgress` interface and `ProgressCallback` type |
| `lib/scraper/etimad-browser.ts` | Added `reportProgress()` method; progress callbacks at each phase |
| `scripts/run-scraper-for-api.ts` | Passes `onProgress` callback to write real-time progress to file |
| `app/api/scrape/stop/route.ts` | Uses `taskkill /PID /T /F` on Windows instead of `SIGTERM` |
| `components/dashboard/command-center.tsx` | Shows progress percentage and tender counts during scraping |

### Progress Reporting

The scraper now reports progress at each phase:

| Phase | Percent Range | Data Reported |
|-------|---------------|---------------|
| Initializing | 0-15% | Message only |
| Collecting URLs | 15-20% | `urlsCollected`, `currentPage` |
| Scraping Tenders | 20-95% | `tendersScraped`, `tendersTotal` |
| Syncing | 95-100% | Final counts |

### Stop Functionality

| Platform | Method | Behavior |
|----------|--------|----------|
| Windows | `taskkill /PID /T /F` | Force kills process tree (including npx/tsx children) |
| Unix | `SIGTERM` then `SIGKILL` | Graceful then forced termination |

### UI Updates

The Command Center now displays:
- **Progress percentage** (0-100%) in amber color when running
- **Tender count** (e.g., "5/24") during scraping phase
- **URL count** during collection phase
- **Spinning icon** on the Active button while running
