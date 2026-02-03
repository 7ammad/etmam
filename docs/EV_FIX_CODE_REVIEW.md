# Code Review: EV Fix (100x Currency + Canonical EV Pipeline)

## Summary

Review of the Estimated Value (EV) fix: currency normalization (halala → SAR), single canonical EV pipeline, calibration loader, and UI badges. Aligned with code-review-excellence and verification-before-completion.

## Strengths

- **Single boundary for currency**: `lib/currency.ts` provides `normalizeToSar` / `toSar` and `normalizeTenderMoneyFields`; applied only at sync API and calibrate script. Rest of app works in SAR.
- **Canonical EV pipeline**: `getEffectiveEstimatedValueSar` runs before both scoring paths; AI never sets EV (passed in as `effectiveValueSar`); predicted_budget_min/max come from our pipeline.
- **Fail-safe calibration**: Classifier loads `data/calibration-result.json` when present; missing file does not crash; fallback to built-in constants.
- **Server Actions**: Evaluation action returns `{ success, data } | { success: false, error }`; uses `revalidatePath` after mutations (Next.js best practice).
- **Verification**: `scripts/verify-currency-normalization.ts` and `docs/EV_FIX_100X_CURRENCY.md` document and verify normalization; type-check, verify:phase-1, verify:phase-2 all passed.

## Required Changes (addressed)

- **Existing DB data**: Doc updated to state that tenders synced before the fix may have halala-as-SAR; re-sync or backfill to correct.
- **Edge case comment**: `lib/currency.ts` documents the estimated_value integer ≥100 heuristic (100 SAR as integer would become 1 SAR; acceptable for MVP).

## Suggestions (optional)

- **Unit tests**: Consider adding Jest/Vitest tests for `normalizeToSar` (null, 0, negative, NaN, integer 99 vs 100) and for `getEffectiveEstimatedValueSar` priority order. Not blocking.
- **Backfill script**: Optional one-off script to normalize existing DB rows (read → toSar → update) for tenders synced before this release.

## Verdict

**Approve.** Logic is correct; boundaries are clear; verification evidence is in place. Minor doc and comment updates applied.

## Verification Evidence

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `pnpm type-check` | Pass (exit 0) |
| Phase 1 | `pnpm verify:phase-1` | 5/5 passed |
| Phase 2 | `pnpm verify:phase-2` | 6/6 passed |
| Currency | `pnpm exec tsx scripts/verify-currency-normalization.ts scraper-output/run-historical-2026-02-01T12-22-15-075Z.json` | All normalization checks passed |
