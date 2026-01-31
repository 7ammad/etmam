# Scraper Fix Plan: Active Mode (Filter + 24/Page + Pagination)

**Goal:** Active scraper returns **only IT/Telecom tenders**, uses **24 items per page**, and **paginates to next page** until batch size or no more results. Verification validates **logic** (behavior) as well as code.

**Reference:** Terminal run showed non-IT tenders (cars, electrical, medical, building) and only 6 URLs from page 1 — filter and page size/pagination not delivering intended behavior.

---

## Principles

- **Verification = logic + code.** Checks must assert that the scraper *behaves* as required (IT-only results, 24 per page, pagination), not only that certain files or types exist.
- **Each phase:** small tasks → build → **verify (logic)** → review → test. No phase passes until logic verification passes.

---

## Phase 1: Filter Correctness (IT-Only Tenders)

**Objective:** Applied filters (Tender status = active, Main activity = Telecom & IT (9), Sub-activity = IT (902)) are actually used by the portal; scraped tenders are only IT/Telecom.

**If filter still returns non-IT tenders:** Verify on the live portal that the **Search submit** button is correct. We use `#searchBtn`; the panel toggle is `#searchBtnColaps`. If the portal uses one button for both, or a different id for the submit (e.g. a "بحث" inside `#Search` or `#basicInfo`), update `filterSearchButton` in `lib/scraper/config.ts`.

### Task 1.1: Harden filter application (code) ✅

- [x] After each `selectOption`, dispatch `change` on the `<select>` so portal JS (e.g. bootstrap-select) updates.
- [x] After clicking Search, wait for results area: wait for `#cardsresult` (tenderList) visible.
- [ ] Optionally re-read select values before Search and log them; if wrong, retry or fail fast.

**Verification (logic):** Run active scraper; inspect first 5 tender titles + entities. **Pass only if** they are IT/Telecom-related (e.g. software, networks, communications, تقنية, اتصالات). **Fail if** any is clearly non-IT (e.g. cars, قطع غيار سيارات, medical, بناء).

### Task 1.2: Post-scrape classification check (code) ✅

- [x] Added `detectNonItTenders()` in `lib/scraper/utils.ts`: checks titles against non-IT patterns (cars, electrical, building, medical, etc.).
- [x] When `STRICT_FILTER_VERIFY=true`, scraper calls it after scrape and adds an error if any tender matches (run fails logic verification).
- [x] Documented: "Logic verification: scraped set must be IT-only; use STRICT_FILTER_VERIFY=true."

**Verification (logic):** Same as 1.1; plus if run with `STRICT_FILTER_VERIFY=true`, run fails when any tender fails classification check.

### Task 1.3: Review and test

- [ ] Code review: filter flow, selectors, timing.
- [ ] Manual test: `pnpm scrape:test` (active); confirm only IT tenders in output.

---

## Phase 2: 24 Items Per Page (Active + Historical)

**Objective:** List page shows **24 tenders per page** for both active and historical modes (no 6-only default for active).

### Task 2.1: Default list page size 24 for both modes (code) ✅

- [x] In scraper: default `listPageSize` to **24** when not set (`setListPageSize` uses `this.config.listPageSize ?? 24`).
- [x] In `scripts/run-scraper.ts` and `scripts/test-scraper.ts`: pass `listPageSize: 24` for both active and historical.

**Verification (logic):** Run active scraper when portal has ≥24 results. **Pass only if** log shows "List page size set to 24 items" and "Page 1: 24 URLs" (or N URLs with N ≤ 24). **Fail if** "Page 1: 6 URLs" with no page-size setting.

### Task 2.2: Review and test

- [ ] Code review: no path leaves active mode at 6 per page.
- [ ] Manual test: `pnpm scrape:test`; expect "List page size set to 24 items" and Page 1 URL count ≤ 24.

---

## Phase 3: Next-Page Pagination (Active)

**Objective:** Active mode **follows next page** until `batchSize` is reached or there are no more pages (same pagination logic as historical, with batch cap).

### Task 3.1: Confirm and harden pagination (code) ✅

- [x] `collectTenderUrlsWithPagination` for active: collects from current page; if `seen.size < batchSize` calls `goToNextListPage`; stops when no next page, or 0 URLs on page (and page > 1), or `seen.size >= batchSize`.
- [x] `goToNextListPage`: tries link selector first, then URL fallback `PageNumber=N+1`; empty-page stop already in place.
- [x] Logs "No more pages" or "No more results (empty page)" when stopping.

**Verification (logic):** When portal has >24 active IT tenders, run active scraper with `batchSize=50`. **Pass only if** log shows at least 2 pages (e.g. "Page 1: 24 URLs", "Page 2: … URLs") and total URLs ≥ 24. **Fail if** only one page is collected when more exist.

### Task 3.2: Review and test

- [ ] Code review: pagination loop and stop conditions for active mode.
- [ ] Manual test: run with `BATCH_SIZE=50`; expect multiple pages when available.

---

## Phase 4: Verification Script (Logic + Code)

**Objective:** A single verification script that asserts **both** code presence **and** runtime behavior (logic).

### Task 4.1: Verification script content ✅

- [x] **Code checks:** Config has activity filter (9/902); selectors for filter, itemsPerPage, next page; `setListPageSize` and `collectTenderUrlsWithPagination` exist; default or passed `listPageSize` is 24 for active.
- [x] **Logic checks (optional):** Set `RUN_LOGIC_CHECK=1` to run a short scrape and assert: (1) no "Filter verification failed" (STRICT_FILTER_VERIFY), (2) log contains "List page size set to 24 items".

**Verification (logic):** Script exit 0 only when all code checks pass; when `RUN_LOGIC_CHECK=1`, logic checks must also pass.

### Task 4.2: Integrate into workflow ✅

- [x] Added `pnpm verify:scraper-active` (runs `scripts/verify-scraper-active.ts`).
- [ ] Document in HANDOVER_GUIDE or PHASE doc: "Before marking scraper complete, run verify:scraper-active; with RUN_LOGIC_CHECK=1 for full logic verification."

---

## Summary Table

| Phase | Focus           | Logic verification                                      |
|-------|-----------------|---------------------------------------------------------|
| 1     | Filter (IT-only)| Scraped tenders are IT/Telecom only                     |
| 2     | 24/page         | Log shows 24 items per page and Page 1 has up to 24 URLs |
| 3     | Next page       | Multiple pages collected when >24 results exist         |
| 4     | Verification    | Script asserts code + behavior; exit 0 only when both pass |

---

## Definition of Done (per phase)

- All tasks in the phase built.
- **Logic verification** for that phase passes (behavior, not only code).
- Code review done.
- Manual test run confirms expected behavior.

No phase is "complete" until logic verification passes.
