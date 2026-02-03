# EV Fix: 100x Currency Bug and Canonical EV Pipeline

## Where the 100x bug was

- **Scraped JSON**: `award_amount_sar` and `booklet_price` (and sometimes `estimated_value`) are stored as **halala** integers (1 SAR = 100 halala) but were treated as SAR in the pipeline.
- **Evidence**: In `scraper-output/run-historical-*.json`, `award_results["قيمة الترسية"]` is a decimal string in SAR (e.g. `"60547.50"`) while `award_amount_sar` is `6054750` (= 100 × 60547.50). Similarly `basic_info["قيمة وثائق المنافسة"]` is `"200.00"` while `booklet_price` is `20000`.
- **Impact**: Any use of these integers as SAR (sync API storing to DB, value-estimator booklet tiers, calibration, list/detail display) showed values 100× too large.

## How it was fixed

1. **Currency normalization** (`lib/currency.ts`) — provenance-based, no magnitude heuristic
   - `normalizeToSar(value, source)` / `toSar(value, source)` with `source`: `award_amount_sar` | `booklet_price` | `estimated_value`.
   - **award_amount_sar**, **booklet_price**: known scraped integer money fields → halala → divide by 100.
   - **estimated_value**: treated as SAR (pass-through); no integer magnitude heuristic.
   - `normalizeTenderMoneyFields(tender)` normalizes only booklet_price and award_amount_sar to SAR; estimated_value is pass-through.

2. **Applied at boundaries**
   - **Sync API** (`app/api/cron/sync/route.ts`): When building `tenderToDbFormat`, all three fields are normalized to SAR before insert/update. DB and downstream (list, detail, evaluation) now see SAR only.
   - **Calibrate script** (`scripts/calibrate-values.ts`): When loading tenders from `run-*.json`, each tender is normalized with `normalizeTenderMoneyFields` so calibration stats are in SAR.

3. **One canonical EV pipeline** (`lib/evaluation/effective-value.ts`)
   - `getEffectiveEstimatedValueSar(tender, evaluation?, config?)` returns a single EV in SAR plus optional predicted min/max.
   - Priority: (a) Etimad `estimated_value` (already SAR after sync), (b) existing evaluation `predicted_budget_min/max` midpoint, (c) deterministic estimator V2.
   - Used in `actions/evaluation.ts` **before** both branches: rule-based scoring and AI fallback. AI fallback receives EV via `effectiveValueSar` in the prompt and **never** sets EV; predicted_budget_min/max are taken from `getEffectiveEstimatedValueSar`, not from the model.

4. **Calibration at runtime** (`lib/evaluation/classifier.ts`)
   - `getHistoricalCalibration(serviceType, calibrationPath?)` tries to load `data/calibration-result.json` (or `value_estimation.historical_calibration_path`). If the file has `service_type_calibration` array, it is used; else built-in constants. Missing file does not crash.

5. **UI**
   - List and detail use the same EV (from DB `estimated_value` and evaluation `predicted_budget_min/max`, all in SAR after sync).
   - Badge "Estimated" when EV is from prediction; "Provided" when EV is from Etimad.

## How to verify

- **Normalization**:  
  `pnpm exec tsx scripts/verify-currency-normalization.ts scraper-output/run-historical-2026-02-01T12-22-15-075Z.json`  
  Checks that for 3 awarded tenders, `integer / 100` equals the decimal SAR from `award_results` / `basic_info` within rounding.

- **Build**:  
  `pnpm type-check`  
  `pnpm verify:phase-1`  
  `pnpm verify:phase-2`

- **Behavioral**: Re-run analysis for the same tender once with scoring config present and once with config removed (AI fallback). The displayed EV (list + detail) must be the same in both runs.

## Existing data

Tenders already in the DB that were synced **before** this fix may have `estimated_value`, `booklet_price_sar`, and `award_amount_sar` stored as halala-as-SAR (100× too large). To correct them, re-sync those tenders (e.g. re-run the scraper and POST to the sync API) or run a one-time backfill that applies `toSar(..., source)` to the stored values before updating the rows.
