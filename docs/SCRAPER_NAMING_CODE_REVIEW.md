# Code Review: Scraper Output Naming (run-active-* / run-historical-*)

**Scope:** Changes that introduced `run-{active|historical}-{timestamp}.json` and related consumers/docs. Reviewed against Context7 Node.js docs and code-review-excellence.

---

## Summary

- **Change:** `run-scraper.ts` and `run-scraper-for-api.ts` now write `run-{mode}-{timestamp}.json` so active vs historical is clear from the filename.
- **Verdict:** Logic and consumers are correct. A few improvements: make file content self-describing (`mode` in JSON), update docs, and add minimal error handling around write.

---

## Strengths

- **Single source of truth for mode:** `scraperMode` (run-scraper) and `isHistorical ? 'historical' : 'active'` (run-scraper-for-api) produce the same string; no duplication of logic.
- **Backward compatibility:** `sync-latest` and `evaluate-tenders` use `f.startsWith('run-')` and `*.json`; old `run-<timestamp>.json` and new `run-active-*` / `run-historical-*` all match.
- **Directory creation:** `mkdirSync(..., { recursive: true })` matches Node.js docs (create parent dirs; avoid ENOENT).
- **Timestamp format:** ISO with `[:.]` replaced by `-` is filesystem-safe and sortable.

---

## Required / Suggested Fixes

### 1. [important] File content not self-describing

**Current:** Written JSON is `{ tenders, metadata }`. No `mode` field. Downstream (e.g. calibrate-values, future tools) cannot infer active vs historical from content.

**Context7/Node:** No specific requirement; best practice is that output files be self-describing when the distinction matters.

**Action:** Add `mode: 'active' | 'historical'` to the payload in both `run-scraper.ts` and `run-scraper-for-api.ts`.

---

### 2. [nit] sync-latest comment outdated

**Where:** `app/api/scrape/sync-latest/route.ts` — comment says "latest scraper-output/run-*.json".

**Action:** Update to "latest scraper-output/run-*.json (run-active-* or run-historical-*)" so readers know the naming convention.

---

### 3. [nit] Docs still say run-&lt;timestamp&gt;

**Where:** `docs/DATA_PIPELINE_REPORT.md` — "run-<timestamp>.json" and "run-<ts>.json".

**Action:** Replace with "run-<mode>-<timestamp>.json" (e.g. run-active-..., run-historical-...) so docs match implementation.

---

### 4. [suggestion] Error handling on write

**Context7/Node:** Docs show handling write errors (e.g. callback or try/catch). `writeFileSync` can throw (disk full, permissions).

**Current:** No try/catch; failure throws and is caught by outer catch in main().

**Action:** Optional: wrap `writeFileSync` in try/catch, log path and error, then rethrow so logs are clearer. Not blocking.

---

## What Not to Change

- **getLatestRunFile:** Picking "latest by mtime" regardless of mode is correct; no need to prefer active over historical.
- **evaluate-tenders:** Uses latest `.json` by mtime; no change needed.
- **RUNBOOK.md:** "scraper-output/<any-name>.json" remains correct.

---

## Verification (after fixes)

1. Run smoke: `pnpm scrape:smoke` then `pnpm scrape:smoke -- --historical` (with SAVE_TO_FILE=true to generate files); confirm filenames include active/historical.
2. Confirm written JSON includes `mode` and that sync-latest still finds and syncs the file.
3. type-check: `pnpm type-check`.

---

## Final Code-Review-Excellence Pass (post-fix)

**Logic & correctness:** Mode in filename and in JSON; single source (scraperMode / isHistorical). Backward compatible (run-*.json still matched). Edge case: empty tenders → no file written; OK.

**Security:** No user input in path; timestamp from Date(); mode from script/env. No injection risk.

**Performance:** writeFileSync is blocking but one file per run; acceptable. mkdirSync recursive once per run.

**Maintainability:** Naming convention documented in sync-latest comment and DATA_PIPELINE_REPORT; SCRAPER_NAMING_CODE_REVIEW.md captures rationale. Try/catch on write gives clear error message.

**Verdict:** Approve. Required fixes (mode in JSON, docs, comment) applied; optional write error handling applied.
