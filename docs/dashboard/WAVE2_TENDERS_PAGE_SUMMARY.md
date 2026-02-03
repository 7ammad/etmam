# Wave 2: Tenders Page — Implementation Summary

**Date:** 2026-02-03  
**Reference:** SESSION_STARTER_AND_QC.md, WORLD_CLASS_UX_PLAN.md, ACCEPTANCE_CRITERIA.md

---

## Completed Items

### 1. TenderIngestionStrip component
- **Done:** New `TenderIngestionStrip` replaces `TenderDataBlock` in `TendersListClient`.
- **Done:** Single-row layout, min-height 48px, background `var(--surface-muted)`, border-radius `var(--radius-card)`.
- **Done:** Left: Get Active (run scrape), Get Historic (sync-latest), Stop (when running), Upload (UploadTenderTrigger).
- **Done:** Right: Status — Idle "Ready to fetch" (`tenders.ingestion.ready`), Scraping spinner + "Fetching tenders..." (`tenders.ingestion.fetching`), Complete "X new tenders found" (`tenders.ingestion.found`) with auto-dismiss 5s (sync-latest only; scrape completion does not show count from API), Error red text + Close button.
- **Done:** Scraping state disables buttons and shows spinner; success from sync-latest shows count and auto-dismisses after 5s.

### 2. Bulk actions bar
- **Done:** When 1+ checkboxes selected, contextual bar appears below filters.
- **Done:** Bar shows "X tenders selected" + [Evaluate All] [Create Opportunities] ✕.
- **Done:** "Evaluate All" runs `runEvaluationAction` for each selected tender in sequence; progress "Evaluating 2/5..."; then clears selection and `router.refresh()`.
- **Done:** "Create Opportunities" navigates to `/${locale}/dashboard/opportunities`.
- **Done:** ✕ clears selection.

### 3. Table row accent bars
- **Done:** Each row has 3px left accent bar: INVEST = `var(--color-primary-500)` (emerald), REVIEW = `var(--color-conditional-text)` (amber), SKIP = `var(--color-excluded-text)` (gray/red), no eval = 3px dashed `var(--gray-8)`.
- **Done:** Inline quick actions: Actions column added with View (Eye icon, link to detail) and Evaluate (Play icon, runs evaluation). Icons fade in 150ms on row hover via `.dashboard-tender-row .row-actions` / `.dashboard-tender-row:hover .row-actions` in `globals.css`.

### 4. Empty state enhancement
- **Done:** When `tenders.length === 0`: centered FileText icon, heading "No tenders yet" (`tenders.empty.title`), guidance text (`tenders.empty.guidance`), [Get Active Tenders] [Upload File].
- **Done:** "Get Active Tenders" calls POST `/api/scrape` and `router.refresh()`; "Upload File" is `UploadTenderTrigger`.
- **Done:** When filters return no matches, copy remains "No tenders match your filters" with Clear Filters button (unchanged).

---

## Acceptance criteria (Wave 2)

| Criterion | Status |
|-----------|--------|
| AC-1.3: TenderIngestionStrip replaces TenderDataBlock | ✅ |
| AC-1.3: Single-row 48px, subtle background | ✅ |
| AC-1.3: Get Active, Get Historic, Upload; status right | ✅ |
| AC-1.3: Scraping spinner, buttons disabled | ✅ |
| AC-1.3: Success "X new tenders found" 5s auto-dismiss (sync path) | ✅ |
| AC-1.4: Bulk bar when 1+ selected | ✅ |
| AC-1.4: "X selected" + Evaluate All + Create Opportunities + ✕ | ✅ |
| AC-1.4: Evaluate All batch with progress | ✅ |
| AC-1.4: Create Opportunities → Opportunities page | ✅ |
| AC-1.4: ✕ clears selection | ✅ |
| AC-1.5: 3px left accent bar per recommendation | ✅ |
| AC-1.5: Inline quick actions (View, Evaluate) on hover, 150ms | ✅ |
| AC-1.6: Icon + "No tenders yet" + guidance + two buttons | ✅ |
| AC-1.6: Buttons trigger Get Active / Upload | ✅ |

---

## Flags (not 100% or pre-existing)

1. **Lint:** `pnpm lint` still fails with the **pre-existing** `react-hooks/set-state-in-effect` error in `tenders-list-client.tsx` (URL sync effect). Not introduced by Wave 2.
2. **Scrape success message:** "X new tenders found" with auto-dismiss is implemented for **sync-latest** (Historic) only. Scrape (Get Active) completion does not return a count from the API; strip shows completion via poll then `router.refresh()` without a success message. Plan says "Success shows 'X new tenders found' for 5 seconds" — 100% satisfied for sync; scrape path has no count unless progress file is extended later.
3. **Design tokens:** Accent bar for REVIEW uses `--color-conditional-text` (plan: "Amber"). SKIP uses `--color-excluded-text`. Both are existing semantic tokens.

---

## Files changed / added

- **Added:** `components/dashboard/tender-ingestion-strip.tsx` — new strip component.
- **Modified:** `components/dashboard/tenders-list-client.tsx` — use TenderIngestionStrip, bulk bar, accent bars, Actions column, empty state.
- **Modified:** `app/globals.css` — `.row-actions` opacity on row hover (150ms).
- **Modified:** `messages/en.json` — `tenders.empty.*` (title, guidance, getActive, uploadFile).
- **Modified:** `messages/ar.json` — same keys in Arabic.

---

## Next steps (Wave 3)

- Decision Panel with Dual-Track visualization (Infratech/Exotech)
- AI Price Intelligence display
- 6-dimension Score Breakdown (V2 Engine)
- Evaluation tabs (replace stacked cards)
