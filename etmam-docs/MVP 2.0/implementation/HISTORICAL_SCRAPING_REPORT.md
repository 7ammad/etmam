# Historical Data Scraping Process Report

**Etimad Tender Portal – Awarded (Historical) Tenders**

**Report Generated:** 2026-01-31  
**Scope:** MVP 2.0 – Historical scraping for estimation model input

---

## 1. Purpose & Scope

### 1.1 Why Historical Scraping

- **Active tenders** (open for bids) are scraped by the main scraper for pipeline and CRM use.
- **Historical (awarded) tenders** are scraped separately to build a dataset of **actual award amounts, dates, and winning bidders**.
- This historical dataset is used by the **estimation model** to produce **estimated values for new (active) tenders** and to inform bidding decisions.

### 1.2 Objectives

| Objective | Description |
|-----------|-------------|
| **Volume** | Scrape **all available** awarded Telecom/IT tenders, not just a small batch. |
| **Page size** | Use **24 items per page** (عدد العناصر) on the search results to reduce pagination rounds. |
| **Full pagination** | Follow **next page** until no more results (all pages collected). |
| **Award data** | Extract **award_amount_sar**, **award_date**, **winning_bidder** from the Award Results tab (d-5). |
| **Fresh data** | Run historical scraping as a **daily scheduled task** so the estimation model always has up-to-date historical data. |

---

## 2. Architecture Overview

### 2.1 Mode: Active vs Historical

| Aspect | Active | Historical |
|--------|--------|------------|
| **Tender status filter** | Open for bids (value `2`) | Awarded (value `6` – تم اعلان الترسية) |
| **List page size** | 6 (default) | 24 |
| **URL collection** | Until `batchSize` or no next page | All pages (up to 500 pages / 5000 tenders cap) |
| **Scrape count** | First `batchSize` tenders | First `batchSize` of collected URLs (production uses 5000) |
| **Award fields** | N/A | Populated from tab d-5 |

### 2.2 Key Files

```
lib/scraper/
├── etimad-browser.ts   # setListPageSize(), collectTenderUrlsWithPagination() (historical logic)
├── config.ts           # TENDER_STATUS_FILTERS.awarded = '6', itemsPerPage selector
└── utils.ts            # parseSARAmount() (European decimal comma handling)

types/
├── scraper.ts          # ScraperConfig.mode, listPageSize; award fields in ScrapedTender
└── database.ts         # award_amount_sar, award_date, winning_bidder on tenders

scripts/
├── run-scraper.ts      # --historical, SCRAPER_MODE, listPageSize: 24
└── test-scraper.ts    # --historical, listPageSize: 24

.github/workflows/
└── scraper-historical.yml   # Daily schedule, SCRAPER_MODE=historical

supabase/migrations/
└── 00005_add_award_columns.sql   # award_amount_sar, award_date, winning_bidder

app/api/cron/sync/
└── route.ts            # tenderToDbFormat() maps award fields to DB
```

---

## 3. Scraping Flow (Historical)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. INITIALIZE                                                           │
│     - Launch Chromium (headless), ar-SA locale, viewport 1920x1080       │
└─────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  2. NAVIGATE TO LIST PAGE                                               │
│     URL: .../Tender/AllTendersForVisitor                                │
│     - Check for blocking/CAPTCHA                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  3. APPLY FILTERS VIA UI                                                 │
│     - #TenderCategory = "6" (awarded)                                   │
│     - #activitiesList = "9" (Telecom & IT)                              │
│     - #subActivitiesList = "902" (IT)                                    │
│     - Click #searchBtn                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  3b. SET LIST PAGE SIZE (عدد العناصر)                                   │
│     - #itemsPerPage = "24"                                               │
│     - Wait for list to reload                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  4. COLLECT TENDER URLs (FULL PAGINATION)                                │
│     - Extract URLs from current page (.tender-card h3 a)                 │
│     - Next page: .pagination .page-link[rel="next"] or PageNumber=N+1    │
│     - Stop when: 0 URLs on page, no next link, or 500 pages / 5000 URLs │
└─────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  5. DEEP SCRAPE EACH TENDER (first batchSize of collected URLs)          │
│     - Tabs: d-1 (basic), d-2 (addresses/dates), d-3 (classification),   │
│       d-5 (award results), d-6 (local content)                          │
│     - Award tab: extract award_amount_sar, award_date, winning_bidder    │
│     - Validate with Zod; delay between requests                         │
└─────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  6. OUTPUT & SYNC                                                       │
│     - ScrapeResult → optional JSON file → POST /api/cron/sync           │
│     - DB: tenders table (incl. award columns + raw_data JSONB)          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Configuration

### 4.1 ScraperConfig (types/scraper.ts)

| Option | Type | Default (historical) | Description |
|--------|------|------------------------|-------------|
| `mode` | `'active' \| 'historical'` | `'historical'` when `--historical` | Tender status filter and pagination behaviour |
| `listPageSize` | `6 \| 12 \| 18 \| 24` | `24` for historical | Items per page on search results |
| `batchSize` | number | 5000 (production historical) | Max tenders to scrape in one run |

### 4.2 Portal Selectors (config.ts)

| Purpose | Selector | Notes |
|---------|----------|--------|
| Tender status | `#TenderCategory` | Value `6` = awarded |
| Items per page | `#itemsPerPage` | Values 6, 12, 18, 24 |
| Next page | `.pagination .page-link[rel="next"], .pagination-next` | Fallback: URL `PageNumber=N+1` |

### 4.3 Caps (etimad-browser.ts)

| Constant | Value | Purpose |
|----------|-------|--------|
| `MAX_HISTORICAL_TENDERS` | 5000 | Max URLs to collect in one historical run |
| Historical `maxPages` | 500 | Max list pages to traverse |

---

## 5. Scheduling & Automation

### 5.1 Daily Workflow

| Item | Value |
|------|--------|
| **File** | `.github/workflows/scraper-historical.yml` |
| **Schedule** | `0 2 * * *` (daily 02:00 UTC, 05:00 Saudi Arabia) |
| **Manual trigger** | `workflow_dispatch` with optional `batch_cap` (default 5000) |
| **Command** | `pnpm scrape:run -- --historical` |
| **Env** | `SCRAPER_MODE=historical`, `BATCH_SIZE=5000` (or input), `API_URL`, `CRON_SECRET` |
| **Timeout** | 120 minutes |

### 5.2 Required Secrets

- **SCRAPER_API_URL** – Sync endpoint (e.g. `https://<app>/api/cron/sync`)
- **CRON_SECRET** – Bearer token for sync API

### 5.3 Concurrency

- Concurrency group: `scraper-historical`
- No cancel-in-progress (one historical run at a time)

---

## 6. Database & Sync

### 6.1 Award Columns (tenders table)

| Column | Type | Source |
|--------|------|--------|
| `award_amount_sar` | NUMERIC | Tab d-5, value for "قيمة الترسية" / "قيمة العقد" |
| `award_date` | TEXT | Tab d-5, value for "تاريخ الترسية" / "تاريخ الإعلان" |
| `winning_bidder` | TEXT | Tab d-5, value for "إسم المورد" / "المورد الفائز" |

Migration: `supabase/migrations/00005_add_award_columns.sql`.

### 6.2 Sync API

- **Endpoint:** `POST /api/cron/sync`
- **Auth:** `Authorization: Bearer <CRON_SECRET>`
- **Body:** `{ tenders: ScrapedTender[], metadata }`
- **Behaviour:** Upserts tenders by reference_no; maps award fields into `tenders` and stores full payload in `raw_data` (JSONB).

---

## 7. Verification & Testing

### 7.1 Local Test (no API)

```bash
pnpm scrape:test -- --historical
```

- Uses `listPageSize: 24`, collects all pages (up to caps), scrapes first `BATCH_SIZE` (default 5 in test).
- Output: console summary + optional JSON under `scraper-output/`.

### 7.2 Production Run (with sync)

```bash
SCRAPER_MODE=historical BATCH_SIZE=5000 API_URL=... CRON_SECRET=... pnpm scrape:run -- --historical
```

Or via workflow: trigger `scraper-historical` manually or wait for schedule.

### 7.3 Expected Logs (historical)

- `[Scraper] Tender status: historical (awarded) (value 6)`
- `[Scraper] List page size set to 24 items`
- `[Scraper] Page 1: 24 URLs (total: 24)` … until no more pages or cap
- `[Scraper] Tab d-5 (award_results): 3 fields` per tender

### 7.4 Stop Conditions (pagination)

- No “next” link and URL fallback fails.
- Current page returns **0** tender URLs (after first page).
- Reached **500 pages** or **5000** collected URLs.

---

## 8. Summary

| Item | Status |
|------|--------|
| List page size 24 (عدد العناصر) | Implemented in `setListPageSize()` |
| Full pagination (next page until done) | Implemented; next-link + URL `PageNumber` fallback |
| Historical filter (awarded = 6) | Applied in `applyFiltersViaUI()` when `mode === 'historical'` |
| Award extraction (d-5) | `extractAwardDataFromTables()`; SAR amount comma fix in `parseSARAmount()` |
| DB storage & sync | Migration 00005; `tenderToDbFormat()` in sync route |
| Daily scheduled task | `scraper-historical.yml` at 02:00 UTC |

Historical scraping runs daily to keep awarded Telecom/IT data fresh for the estimation model that produces estimated values for new tenders.
