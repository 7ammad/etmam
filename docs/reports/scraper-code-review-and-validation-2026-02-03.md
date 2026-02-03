# Scraper Code Review & Validation Report

**Date:** 2026-02-03  
**Scope:** Etimad scraper pagination and batch behavior (active + historic)  
**Artifacts reviewed:** `lib/scraper/etimad-browser.ts`, `lib/scraper/config.ts`, `scripts/run-scraper.ts`, `scripts/run-scraper-for-api.ts`, `types/scraper.ts`

---

## 1. Context

- **Code reviewer** (context → security → performance → type safety → code quality) and **scraper-validator** (structure, schema, pipeline health) findings are combined below.
- Issues reported by user:
  - **Active tenders:** (1) only 3 pages max despite **10 pages** (240+ tenders) available, (2) keeps going when page shows 0 tenders, (3) only fetches 50 tenders when 70+ found.
  - **Historic tenders:** (1) only 2–3 pages then rest show 0 tenders, (2) keeps going when page has 0 tenders; portal shows **1368 pages** for historic result set (requires safe cap).

---

## 2. Review by Severity

### Critical

| # | File | Finding | Recommendation |
|---|------|---------|----------------|
| C1 | `lib/scraper/etimad-browser.ts` | **No early exit when a page adds 0 new unique URLs.** Loop only breaks when `pageUrls.length === 0`. When the portal returns the same list (e.g. page 4+ shows duplicates or same DOM), `added === 0` but `pageUrls.length > 0`, so pagination continues indefinitely until `maxPages`. | Break when `added === 0` (after the first page) or after N consecutive pages with no new URLs (e.g. 1–2). |
| C2 | `lib/scraper/etimad-browser.ts` | **URL-based pagination fallback always returns `true`.** In `goToNextListPage`, the fallback builds `PageNumber+1` and navigates without checking if a “next” page actually exists. Combined with C1, this causes the scraper to keep requesting page 4, 5, … 16+ even when each returns 0 new tenders. | After navigation, verify that the list content or URL changed (e.g. same URL or same first tender ID → treat as no next page). Or stop when `added === 0` (C1) so fallback behavior is bounded. |

### High

| # | File | Finding | Recommendation |
|---|------|---------|----------------|
| H1 | `scripts/run-scraper.ts`, `scripts/run-scraper-for-api.ts` | **Default `BATCH_SIZE=50`** caps URL collection and deep-scrape at 50. With 24 items/page, active mode stops after ~3 pages (24+24+2). User expects more pages and more tenders when 70+ exist. | Increase default (e.g. 120) or add a separate “max pages” / “max URLs to collect” for active mode; keep a safe upper cap. |
| H2 | `lib/scraper/etimad-browser.ts` | **Next-page detection may not match portal.** Selectors: `.pagination .page-link[rel="next"], .pagination-next`. If the portal uses different markup (e.g. `data-page`, no `rel="next"`), we always fall back to URL pagination. If the portal uses a different query param than `PageNumber`, the fallback may request wrong or duplicate pages. | Verify on live portal: actual pagination link selector, `href` shape, and query param name (e.g. `PageNumber`, `page`, `pageNum`). Update config and/or fallback. |
| H3 | `lib/scraper/etimad-browser.ts` | **Return slice for active mode.** `return isHistorical ? [...seen] : [...seen].slice(0, this.config.batchSize)` — so we intentionally limit deep-scrape to `batchSize`. With H1, this is why “only 50 tenders” are fetched when 70+ URLs are available (we may not even collect 70 if we stop at 50). | Align with product: either “collect up to X URLs, deep-scrape up to Y” (X ≥ Y) or “collect and deep-scrape up to same cap” with a higher default. |

### Medium

| # | File | Finding | Recommendation |
|---|------|---------|----------------|
| M1 | `lib/scraper/etimad-browser.ts` | **Log shows “added” not “on-page” count.** Console logs `Page N: ${added} URLs (total: ${seen.size})`. When page 4+ returns duplicates, log shows “0 URLs” (0 added) but we don’t break. Adding `pageUrls.length` to the log would clarify “0 on page” vs “0 new (duplicates)”. | Log both: e.g. `Page N: X URLs on page, Y new (total: Z)`. |
| M2 | `lib/scraper/config.ts` | **Next-page selector is single-line; no verification note for current portal.** | After verifying live markup, add a short comment with the verified selector and, if applicable, the pagination query param. |

### Low

| # | File | Finding | Recommendation |
|---|------|---------|----------------|
| L1 | Types and config | **No security or RTL issues** in the reviewed scraper paths. Type safety is adequate (ScraperConfig, ScrapeResult). | No change required for this scope. |

---

## 3. Root Cause Summary

| User issue | Root cause |
|------------|------------|
| Active: only 3 pages max | `batchSize=50` and 24 items/page → stop when `seen.size >= 50` (~3 pages). Not a pagination bug; cap is too low for “5+ pages”. |
| Active: keeps going when 0 tenders | We only break on `pageUrls.length === 0`. When page returns same links (duplicates), `added === 0` but we don’t break (see C1). |
| Active: only 50 tenders when 70+ found | Default `BATCH_SIZE=50` in runners; we collect and deep-scrape at most 50 (H1, H3). |
| Historic: only 2–3 pages then 0 | After page 3, each page yields 0 *new* URLs (either extractor returns empty or same links). goToNextListPage may not be changing content (selector/URL), or portal returns same list. |
| Historic: keeps going when 0 tenders | Same as active: no exit when `added === 0` (C1); URL fallback always returns true (C2). |

---

## 4. Security & Performance (Code Reviewer)

- **Security:** No auth or PII in scraper; no new concerns for this scope.
- **Performance:** Unbounded loop when every page returns duplicates wastes time and requests until `maxPages`. Fixing C1/C2 bounds this.
- **Type safety:** Adequate; no changes required for this fix.

---

## 5. Scraper Validator – Pipeline Health

- **Schema:** `ScrapedTender` and scrape result structure are consistent with `types/scraper.ts`.
- **Pipeline:** Failures are due to pagination/batch logic (early exit and batch cap), not schema or sync contract.
- **Validation:** Recommend adding an assertion in verification scripts: “after run, if list has 5+ pages, expect more than 3 pages of URLs collected” (when not capped by batchSize).

---

## 6. Verification Checklist

- [ ] Add early exit when `added === 0` (and optionally after N consecutive zero-added pages).
- [ ] Verify next-page selector and pagination query param on live portal; update config/fallback if needed.
- [ ] Raise or make configurable default batch size for active mode (e.g. 120) and document cap.
- [ ] Improve log to show “on page” vs “new” counts.
- [ ] Re-run active and historic scraper; confirm page count and tender count match expectations and that loop stops when no new tenders.

---

## 7. Executive Summary

The reported behavior comes from **(1) no stop when a page adds 0 new unique URLs,** **(2) next-page fallback always advancing,** and **(3) default batch size 50 limiting active runs to ~3 pages and 50 tenders.** Playwright official docs ([goto waitUntil](https://playwright.dev/docs/api/class-page#page-goto), [getByRole](https://playwright.dev/docs/locators#locate-by-role), [waitFor](https://playwright.dev/docs/api/class-locator#locator-wait-for)) support root causes: use of `networkidle` (discouraged; can race with JS-updated list), link selector for Next (portal uses a **button**), and no wait for list content after navigation. Fixing early exit (C1/C2), batch cap (H1/H3), and pagination/wait strategy (H2) per implementation plan will address all issues. Implementation plan with citations: `docs/reports/implementations/scraper-pagination-and-batch-fix-2026-02-03.md`.

---

## 8. Playwright MCP verification (2026-02-03)

Live portal checks were run via Playwright MCP to confirm the fixing direction.

### Pagination behavior

- **URL params:** Portal uses `PageNumber` and `PageSize` in the query string (e.g. `PageNumber=2`, `PageSize=24`). Our URL fallback param name is correct.
- **Next control:** The "next page" control is a **button** ("Next" »), not a link with `rel="next"`. Selector `.pagination .page-link[rel="next"]` will not match; `.pagination-next` may match if the button has that class. So `goToNextListPage` often falls back to URL-based pagination (currentUrl + PageNumber+1).
- **When there are no more pages:** On the last page (e.g. page 3 for historical IT with 24/page), the **Next button is disabled**. So if we relied on clicking Next, we would not advance; with URL fallback we still navigate to PageNumber=4.

### Historic (awarded) + Telecom/IT + IT sub-activity, 24 per page

- **Page 1:** 24 tenders; first STenderId e.g. `8qBpu74EJUDZMWEF4jCxfg==`.
- **Page 2:** 24 different tenders; first STenderId `r7yYjt4sj1nCKZxlnZNI6Q==`; URL has `PageNumber=2`.
- **Page 3:** 24 different tenders; first STenderId `ftKb3sJB04hNKzpx786Tyw==`; URL has `PageNumber=3`; **Next button is disabled** (only 3 pages for this result set).
- **Page 4 (direct navigate to PageNumber=4):** Server returns **the same content as page 1** (first tender again `8qBpu74EJUDZMWEF4jCxfg==`). So requesting page 4 yields **duplicate** tenders, not new ones → `added === 0` in our loop.

### Conclusion

1. **Early exit when `added === 0`** is correct and necessary: page 4+ can return duplicate content (same as page 1), so we must stop when a page adds 0 new unique URLs.
2. **URL fallback** is correct in using `PageNumber`; the problem is we never stop because we don't break on `added === 0`.
3. **Next button** is a button, not a link; consider adding a selector for the Next button (e.g. by role/aria or class) so we can avoid advancing when it's disabled, as an extra safeguard.
4. For this filter there are only **3 pages** (72 tenders at 24/page); the "0 tenders on page 4+" in logs is explained by duplicate content (same 24 as page 1) → 0 new URLs, but we didn't break.
