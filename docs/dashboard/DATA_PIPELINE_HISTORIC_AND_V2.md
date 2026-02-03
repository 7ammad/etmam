# Historic Data Pipeline & V2 Dual-Track Engine

## Summary

- **Historic data** lives in `scraper-output/run-*.json` and can be loaded into the local DB with `pnpm load:historic` (or `--all`). The **evaluation engine uses historic data only via files**, not by reading the DB at runtime: service-type calibration comes from `data/calibration-result.json` (or built-in constants); title-similarity EV (if used) from a run-historical JSON file. To make “historic in DB” feed the engine, run **`pnpm calibrate:from-db`** after loading historic tenders. That script reads historical tenders from the DB (rows with `award_amount_sar`), classifies each by service type, and writes `data/calibration-result.json` with `service_type_calibration` so the classifier (and thus the V2 value estimator) uses DB-sourced calibration.
- **The app uses the V2 Dual-Track engine only:** `runEvaluationAction` → `scoreTenderV2`; value estimation uses `estimateValueV2` (booklet tiers from `BOOKLET_MULTIPLIERS`); dual scores and work type are persisted.

---

## 1. Historic data in the data pipeline

### Where historic data lives

| Location | Content | Used by |
|----------|--------|--------|
| `scraper-output/run-*.json` | Full scraped tenders (ScrapedTender), including historical runs with `award_amount_sar` | Sync API, load-historic script, calibrate-values (files) |
| **DB `tenders`** (rows with `award_amount_sar` set) | Same tenders after load | Dashboard (hidden from main list), `getHistoricalTenders()`, **calibrate-from-db** script |
| **`system_settings`** (key `calibration_v2`) | Service-type calibration (JSONB); **primary source** for engine | **Engine at runtime** (classifier reads from cache populated from DB) |
| `data/calibration-result.json` | Optional fallback file (or from legacy `pnpm calibrate:from-db`) | Classifier uses only if cache is empty |

### Loading historic data into the DB

- **One file (latest or chosen):**  
  `pnpm load:historic` or `pnpm load:historic scraper-output/run-historical-2026-02-01T12-22-15-075Z.json`
- **All run files merged (deduped by reference_no):**  
  `pnpm load:historic --all`

Requires dev server running and `CRON_SECRET` in `.env.local`. Tenders are upserted under the system user.

### How the engine uses historic data (under the hood)

- **Not displayed to the user:** Historic tenders are excluded from the main dashboard list (`getTenders()` filters out `award_amount_sar` non-null). They exist in the DB for calibration and future use.
- **Service-type calibration (value estimation) — zero-touch:**  
  `lib/evaluation/classifier.ts` → `getHistoricalCalibration(serviceType)`:
  1. Reads from **in-memory cache** (populated from **`system_settings`** key `calibration_v2`).
  2. If cache is empty, tries **`data/calibration-result.json`** (file).
  3. If missing or invalid, uses built-in **`HISTORICAL_CALIBRATION`** constants.
- **Auto-calibration after sync:**  
  After every successful **POST /api/cron/sync** (and thus after `pnpm load:historic`), **`recalculateCalibration()`** runs: it fetches tenders with `award_amount_sar` set, classifies by service type, computes stats, and upserts **`system_settings.calibration_v2`**. No manual `pnpm calibrate:from-db` needed unless you want a one-off refresh.
- **Title-similarity EV:**  
  `lib/evaluation/title-similarity-ev.ts` loads from a **file** (`scraper-output/run-historical-*.json` or `HISTORICAL_TENDERS_JSON`). **V2 scoring path does not use title-similarity**; it uses booklet → direct_purchase_cap → initial_guarantee → historical_calibration only.

(Calibration is now automatic after sync; optional one-off: previously you ran “as much as possible” from historic data, keep historic tenders in the DB and **regenerate calibration from the DB** with `pnpm calibrate:from-db`. That writes `service_type_calibration` into `data/calibration-result.json`, which the V2 value estimator uses.

---

## 2. V2 Dual-Track engine (mandatory path)

### Evaluation engine (score)

| Component | Location | Role |
|-----------|----------|------|
| Entry | `actions/evaluation.ts` → `runEvaluationAction` | Fetches tender, maps to scraped, calls V2, persists evaluation |
| Scorer | `lib/evaluation/rules.ts` → **`scoreTenderV2`** | Single scoring function used by the app |
| Logic | Same file | Dual scoring (`calculateDualScore`), work type (`detectWorkType`), Direct Purchase Bonus (value ≤ 100k SAR: Infra +10, Exo −15, Risk = 0), Commodity kill (work_type === 'Commodity' → score 0) |

### Value estimator (VE)

| Component | Location | Role |
|-----------|----------|------|
| Entry | `lib/evaluation/value-estimator.ts` → **`estimateValueV2`** | Used by `scoreTenderV2` when value is missing |
| Booklet | Same file → **`estimateFromBooklet`** | Uses **`BOOKLET_MULTIPLIERS`** from `lib/evaluation/constants.ts` |
| Tiers | `lib/evaluation/constants.ts` | **Tier 1:** ≤500 SAR → ×300; **Tier 2:** 500–20k SAR → ×500; **Tier 3:** >20k SAR → ×1500 |
| Order in V2 | value-estimator.ts | 0) Booklet 1) Direct purchase cap (≤500K) 2) Initial guarantee 3) Historical calibration (from classifier / calibration-result.json) |

### Persisted fields

`actions/evaluation.ts` → `upsertEvaluation` persists:

- `score`, `recommendation`, `summary`, `breakdown`
- `model_used: 'v2-deterministic'`
- `predicted_budget_min`, `predicted_budget_max`, `predicted_value_sar`, `value_method`
- **`infratech_score`**, **`exotech_score`**, **`work_type`**
- `oracle_metadata` (estimated_value_sar, ev_method, ev_confidence)

---

## 3. Recommended workflow for historic data

1. **Load historic into DB:**  
   `pnpm load:historic` or `pnpm load:historic --all`  
   Sync runs **auto-calibration** after upsert: `system_settings.calibration_v2` is updated from historic tenders. No manual step required.
2. **Optional one-off refresh:**  
   `pnpm calibrate:from-db` still writes `data/calibration-result.json` and can be used to refresh calibration from DB without running sync.
3. **Run analysis from the dashboard** as usual; V2 engine reads calibration from cache (backed by `system_settings`) or file/constants fallback.
