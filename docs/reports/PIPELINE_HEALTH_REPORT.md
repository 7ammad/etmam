# Data Ingestion Pipeline Health Report

**Date:** 2026-02-02  
**Scope:** Source definition → transformation → persistence for scraped tender fields (Booklet Price, Estimated Value, Initial Guarantee, and related).

---

## 1. Source Definition

**File:** `types/scraper.ts`

| Field               | In ScrapedTender / scrapedTenderSchema | Notes |
|---------------------|----------------------------------------|-------|
| `booklet_price`     | ✅ Yes (line 41)                       | `z.number().nullable().optional()` |
| `initial_guarantee` | ✅ Yes (line 42)                       | `z.number().nullable().optional()` |
| `estimated_value`   | ✅ Yes (line 33)                       | `z.number().nullable().optional()` |
| `contract_duration`| ✅ Yes (line 44)                       | Maps to DB `project_duration` |
| `award_amount_sar`   | ✅ Yes (line 37)                       | Award fields |
| `award_date`        | ✅ Yes (line 38)                       | |
| `winning_bidder`    | ✅ Yes (line 39)                       | |

**Verdict:** `ScrapedTender` includes `booklet_price` and `initial_guarantee` (and all other fields listed above). No missing fields in the type for the pipeline.

---

## 2. Transformation Logic

### 2.1 Scraped → DB (`tenderToDbFormat`)

**Location:** `app/api/cron/sync/route.ts` (lines 71–102).  
There is no `scrapedToTenderRow` in `lib/evaluation/db-adapter.ts`; the scraped→DB mapping lives in the sync route as `tenderToDbFormat`.

| ScrapedTender field   | Mapped to DB column        | How |
|-----------------------|----------------------------|-----|
| `booklet_price`       | `booklet_price_sar`        | ✅ `toSar(tender.booklet_price, 'booklet_price')` |
| `initial_guarantee`   | `initial_guarantee_sar`    | ✅ `tender.initial_guarantee ?? null` (pass-through) |
| `estimated_value`     | `estimated_value`          | ✅ `toSar(tender.estimated_value, 'estimated_value')` |
| `contract_duration`  | `project_duration`        | ✅ `tender.contract_duration ?? null` |
| `award_amount_sar`     | `award_amount_sar`         | ✅ `toSar(...)` |
| `award_date`          | `award_date`               | ✅ |
| `winning_bidder`      | `winning_bidder`           | ✅ |
| Full payload          | `raw_data`                 | ✅ `{ ...tender, tab_sections }` |

- No **TODO** comments in `tenderToDbFormat`.
- No hardcoded `null` for these fields; nulls are from `?? null` when the scraped value is missing.

**Note – `initial_guarantee` unit:**  
`initial_guarantee` is not passed through `toSar()`. Only `estimated_value`, `booklet_price`, and `award_amount_sar` use `lib/currency.ts`. If the scraper ever sends `initial_guarantee` in halala (like booklet_price), it would not be converted to SAR here. The scraper currently uses `parsePercentage()` for the guarantee label (percentage), so the semantic may differ from other money fields; worth confirming intended unit (SAR vs % vs halala) for consistency.

### 2.2 DB → Scraped (`tenderRowToScraped`)

**Location:** `lib/evaluation/db-adapter.ts` (lines 9–23).

| DB column              | Mapped to ScrapedTender field | Notes |
|------------------------|-------------------------------|-------|
| `booklet_price_sar`    | `booklet_price`               | ✅ `tender.booklet_price_sar ?? null` |
| `initial_guarantee_sar`| `initial_guarantee`           | ✅ `tender.initial_guarantee_sar ?? null` |
| `estimated_value`     | `estimated_value`             | ✅ `tender.estimated_value ?? null` |
| `description`         | `description`                 | ✅ |

- **Stub:** `tab_sections` is hardcoded to `{ basic_info: {} }` because the DB row does not store full tab sections; this is intentional for “Run analysis” from the dashboard (DB row → ScrapedTender for scoring).
- No TODOs in this file; nulls are from `?? null` for missing DB values.

**Verdict:** Both directions correctly map `booklet_price` / `booklet_price_sar` and `initial_guarantee` / `initial_guarantee_sar`. No field present in the type is missing in the adapter or in `tenderToDbFormat`.

---

## 3. Persistence Layer

**Upsert location:** `lib/queries/tender.ts` does **not** define `upsertTender`. The pipeline uses:

- **File:** `app/api/cron/sync/route.ts`  
- **Flow:** Validated `ScrapedTender[]` → `tenderToDbFormat(tender)` → `TenderInsert[]` → `supabase.from('tenders').upsert(dbTenders, { onConflict: 'user_id,reference_no', ignoreDuplicates: false })`.

**Insert payload (from `tenderToDbFormat`):**

- `user_id`, `reference_no`, `title`, `entity`, `deadline`
- `estimated_value`, `description`, `source`, `status`
- `booklet_price_sar`, `initial_guarantee_sar`, `project_duration`
- `award_amount_sar`, `award_date`, `winning_bidder`
- `raw_data` (full scraped payload)

**Verdict:** The sync route’s upsert **does** pass `booklet_price_sar` and `initial_guarantee_sar` (and the other mapped fields) to Supabase. The DB types in `types/database.ts` include `booklet_price_sar` and `initial_guarantee_sar` on `tenders` Row/Insert/Update.

**Side note:** `lib/queries/tender.ts` has `createTender` and `createTenders` whose **typed** parameters do not include `booklet_price_sar` or `initial_guarantee_sar`. Those functions are not used by the scraper pipeline; the pipeline uses only the sync route. If you later use `createTender`/`createTenders` for manual or bulk create with these fields, you’d need to extend the parameter types and pass the values through.

---

## 4. Pipeline Health Summary

| Check | Status |
|-------|--------|
| `booklet_price` / `initial_guarantee` in `ScrapedTender` | ✅ Present |
| `tenderToDbFormat` maps them to DB columns | ✅ Yes |
| `tenderRowToScraped` maps DB columns back | ✅ Yes |
| Sync route upsert passes these fields to Supabase | ✅ Yes |
| TODOs or erroneous hardcoded nulls in mapping | ✅ None found |

**Fields in Type but missing in Adapter or Query:** **None.**  
All of `booklet_price`, `initial_guarantee`, and `estimated_value` (and the other audited fields) are present in the type, in the scraped→DB mapping, in the DB→scraped adapter, and in the sync upsert.

**Recommendations:**

1. **Unit for `initial_guarantee`:** Confirm whether the scraper sends guarantee as SAR, percentage, or halala. If it is ever in halala, add a normalization step (e.g. extend `lib/currency.ts` and use it in `tenderToDbFormat`) so the rest of the app sees SAR consistently.
2. **Optional:** If `createTender` / `createTenders` in `lib/queries/tender.ts` should support booklet price and initial guarantee, add `booklet_price_sar` and `initial_guarantee_sar` to their parameter types and pass them into the insert payload.

---

*Report generated from audit of `types/scraper.ts`, `lib/evaluation/db-adapter.ts`, `app/api/cron/sync/route.ts`, and `types/database.ts`.*
