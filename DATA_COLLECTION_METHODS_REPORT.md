# Data Collection Methods — Codebase Report

*Source: codebase only (no external docs).*

---

## 1. Web scraping (Etimad portal)

### Entry points

| Location | Role |
|----------|------|
| `lib/scraper/index.ts` | Public API: `EtimadScraper`, `scrapePublicTenders()` |
| `lib/scraper/etimad-browser.ts` | Browser-based scraper implementation |
| `scripts/run-scraper.ts` | Production runner: scrape → POST to sync API |

### Flow (from code)

1. **Init**  
   `EtimadScraper.init()` launches Chromium via `@playwright/test` (headless, `ar-SA` locale).

2. **List URL**  
   `buildListUrl()` builds `baseUrl + /Tender/AllTendersForVisitor` with optional query params:  
   `TenderActivityId`, `TenderSubActivityId` (from `lib/scraper/config.ts`: `ACTIVITY_IDS`, `SUB_ACTIVITY_IDS`, `ETMAM_ACTIVITY_FILTERS`).

3. **List page**  
   - `navigateWithRetry(page, listUrl)` with configurable `timeout`, `maxRetries`, `delayMs`.  
   - `checkForBlock(page)` (from `lib/scraper/utils.ts`) checks page content for `BLOCK_INDICATORS` (e.g. "Access Denied", "captcha", "429").  
   - `applyActiveFilter(page)` optionally sets `#TenderCategory` to active tenders (`'1'`).  
   - `extractTenderUrls(page)` uses `ETIMAD_SELECTORS.listPage.tenderLink` (e.g. `.tender-card h3 a, a[href*="DetailsForVisitor"]`) to get detail URLs; normalizes to absolute URLs.

4. **Detail scrape**  
   For each URL (up to `config.batchSize`):  
   - `navigateWithRetry(page, url)` → `checkForBlock(page)` → `extractTenderData(page, url)`.  
   - **Structured extraction**: `page.evaluate()` with `ETIMAD_SELECTORS.detailPage` (`dataList`, `dataItem`, `itemLabel`, `itemValue`, `purposeFull`, `purposeTruncated`) plus h1 for title.  
   - **Fallback**: `findValueByArabicLabel(page, labels.*)` for fields in `ETIMAD_SELECTORS.arabicLabels` (e.g. reference_no, entity, deadline, estimated_value, booklet_price, initial_guarantee, contract_duration).  
   - Parsing helpers from `lib/scraper/utils.ts`: `parseSARAmount`, `parsePercentage`, `parseDuration`, `parseDate`, `sanitizeText`.  
   - Output validated with `scrapedTenderSchema` (Zod) from `types/scraper.ts`; on failure throws `ValidationError`.

5. **Output**  
   Returns `ScrapeResult`: `{ success, tenders: ScrapedTender[], errors: ScrapeError[], metadata }`.  
   Each `ScrapedTender` includes: `reference_no`, `title`, `entity`, `deadline`, `estimated_value`, `booklet_price`, `initial_guarantee`, `contract_duration`, `description`, `tender_url`, `source: 'etimad'`, `scraped_at`.

### Config (code only)

- **`lib/scraper/config.ts`**: `DEFAULT_CONFIG` (baseUrl, batchSize, delayMs, maxRetries, userAgent, headless, timeout), `ETIMAD_URLS`, `ETIMAD_SELECTORS`, `ETMAM_ACTIVITY_FILTERS`, `TENDER_STATUS_FILTERS`, `TENDER_TYPE_FILTERS`, `ERROR_CODES`, `BLOCK_INDICATORS`.  
- **`lib/scraper/errors.ts`**: `ScraperError`, `NavigationError`, `BlockedError`, `TimeoutError`, `ValidationError`, etc., plus `wrapError`, `isScraperError`.

### Runner → API

- **`scripts/run-scraper.ts`**: Reads `API_URL`, `CRON_SECRET`, optional `BATCH_SIZE`, `DELAY_MS`, `ACTIVITY_ID`, `SUB_ACTIVITY_ID`. Calls `scrapePublicTenders(...)`, then `fetch(apiUrl, { method: 'POST', headers: { Authorization: 'Bearer ' + cronSecret }, body: JSON.stringify({ tenders, metadata }) })`. Exits 0 on scrape + sync success (or partial).

---

## 2. Sync API (scraped data → DB)

### Endpoint

| Location | Role |
|----------|------|
| `app/api/cron/sync/route.ts` | POST: accept scraped tenders, validate, upsert to Supabase |

### Flow (from code)

1. **Auth**  
   `verifyCronSecret(request)`: expects `Authorization: Bearer <CRON_SECRET>` (or raw token); returns 401 if missing or wrong.

2. **Limits**  
   Rejects if body size > 10MB or `tenders.length` > 1000.

3. **Validation**  
   Body must have `tenders` array. Each element validated with `scrapedTenderSchema` (Zod); errors formatted by index and field.

4. **DB write**  
   - `tenderToDbFormat(tender)`: maps to DB insert shape (`user_id` = `SYSTEM_USER_ID` from env, `reference_no`, `title`, `entity`, `deadline`, `estimated_value`, `description`, `source: 'etimad'`, `status: 'pending'`, `raw_data` with booklet_price, initial_guarantee, contract_duration, tender_url, scraped_at).  
   - Single batch `supabase.from('tenders').upsert(dbTenders, { onConflict: 'user_id,reference_no', ignoreDuplicates: false })` via `createServiceClient()`.

5. **Response**  
   `SyncResponse`: `{ success, upserted, errors }`; optional `metadata` echoed if sent.

GET (same route): returns JSON usage/contract when authorized.

---

## 3. File-based import (CSV / Excel)

### Entry points

| Location | Role |
|----------|------|
| `lib/parser/index.ts` | `parseFile(file, options?)` → CSV or Excel by type |
| `lib/parser/csv-parser.ts` | `parseCSV(file)`, `parseCSVString(content)` |
| `lib/parser/excel-parser.ts` | `parseExcel(file)`, `parseExcelBuffer(buffer)` |
| `lib/parser/column-mapper.ts` | `mapColumns`, `validateMappedRow`, `COLUMN_MAPPING` (Arabic/English) |
| `actions/tender.ts` | `importTendersAction(formData)` → parse → createTenders |

### Flow (from code)

1. **File type**  
   `getFileType(file)` uses MIME and extension; `SUPPORTED_FILE_TYPES` in `lib/parser/index.ts`: csv (text/csv, .csv), excel (xlsx/xls MIMEs, .xlsx/.xls).

2. **CSV**  
   `parseCSV`: Papa.parse (header, skipEmptyLines, UTF-8); each row passed to `mapColumns(row, columnMap)` then `validateMappedRow(mapped)`; valid rows pushed to result; per-row errors collected.  
   `parseCSVString`: same logic on string input.

3. **Excel**  
   `parseExcel`: FileReader → `XLSX.read(data, { type: 'array' })`; sheet by `sheetName` or `sheetIndex` (default 0); `XLSX.utils.sheet_to_json`; same mapColumns + validateMappedRow per row.  
   `parseExcelBuffer`: same for Buffer.

4. **Column mapping**  
   `column-mapper.ts`: `COLUMN_MAPPING` maps Arabic/English headers to `CreateTenderInput` keys (entity, title, reference_no, deadline, estimated_value, description, source). `mapColumns` builds partial `CreateTenderInput` plus `raw_data`; `validateMappedRow` enforces required fields.

5. **Persistence**  
   `importTendersAction`: gets `file` from FormData; `parseFile(file)`; maps `parseResult.data` to tender rows (deadline to ISO, source `'import'`, raw_data); `createTenders(tendersToCreate)` in `lib/queries/tender.ts` (service client, batch insert); returns `{ created, errors }` (parsing + DB errors).  
   `createTenders` in `lib/queries/tender.ts`: uses a placeholder user_id in code (TODO: auth); inserts in batch and returns `{ created, errors }`.

---

## 4. Single tender creation (manual)

### Location

- **`actions/tender.ts`**: `createTenderAction(formData)`  
  Reads entity, title, reference_no, deadline, estimated_value, description, source from FormData; validates with `createTenderSchema`; calls `createTender(...)` from `lib/queries/tender.ts` (single insert via service client).  
  Not a “bulk collect” method; included for completeness.

---

## 5. Oracle evaluation (derived data, not ingestion)

### Location

- **`app/actions/oracle.ts`**: `runOracleEvaluation(tenderId)`  
  Loads tender by id, optionally uses cached evaluation, calls AI (`generateOracleOutput`), validates with `validateOracleOutput`, then `upsertEvaluation(...)` with oracle_metadata, predicted_budget_*, routing_decision.  
  This consumes existing tender data and writes evaluation rows; it is not a data collection method.

---

## Summary table (codebase only)

| Method | Trigger | Source | Persistence |
|--------|---------|--------|-------------|
| Etimad scraper | `scrapePublicTenders()` / `scripts/run-scraper.ts` | https://tenders.etimad.sa (browser) | POST `/api/cron/sync` → Supabase `tenders` upsert |
| Cron sync API | HTTP POST with CRON_SECRET | Request body (scraped payload) | Supabase `tenders` upsert (batch) |
| File import | `importTendersAction(formData)` (file in FormData) | CSV or Excel file | `createTenders()` → Supabase `tenders` insert |
| Manual single | `createTenderAction(formData)` | Form fields | `createTender()` → Supabase `tenders` insert |

---

## Key types and schemas (codebase)

- **`types/scraper.ts`**: `ScrapedTender`, `scrapedTenderSchema`, `ScraperConfig`, `ScrapeResult`, `ScrapeError`, `ScrapeMetadata`, `SyncPayload`, `SyncResponse`, `EtimadSelectors`, `ActivityFilter`.  
- **`lib/queries/tender.ts`**: `createTender`, `createTenders` (signatures and Supabase usage).  
- **`types/tender.ts`**: `CreateTenderInput` (used by parser and actions).

No external documentation was used; all content is derived from the listed source files.
