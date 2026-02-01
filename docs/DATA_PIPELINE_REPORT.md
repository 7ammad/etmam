# Data Pipeline Report

**Etmaam Tender Data Pipeline — Logic & Technical Overview**

**Report date:** 2026-01-31  
**Scope:** End-to-end flow from Etimad portal to database and downstream use.

---

## 1. Executive Summary

The pipeline **ingests tender data from the Saudi Etimad portal** (https://tenders.etimad.sa) and **stores it in Supabase** for use by the CRM dashboard and by an **estimation model** that produces estimated values for new tenders. It runs in two modes:

- **Active:** Open-for-bids tenders (Telecom/IT only) → pipeline and CRM.
- **Historical:** Awarded tenders (Telecom/IT only) → estimation model input (award amounts, dates, winning bidders).

Both modes share the same technical path: **Scraper → Sync API → Supabase**. Logic differs by filter (status + activity), page size, pagination, and scheduling.

---

## 2. Logic (What the Pipeline Does)

### 2.1 Purpose of Each Stream

| Stream       | Source filter              | Purpose |
|-------------|----------------------------|---------|
| **Active**  | Status = open for bids (2), Activity = Telecom & IT (9), Sub = IT (902) | Feed CRM and pipeline with **current opportunities**; users see and act on live tenders. |
| **Historical** | Status = awarded (6), Activity = Telecom & IT (9), Sub = IT (902) | Build a **dataset of actual awards** (amount, date, winner) so the **estimation model** can produce **estimated values for new (active) tenders** and inform bidding. |

### 2.2 Data Flow (Logic)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ETIMAD PORTAL (tenders.etimad.sa)                                          │
│  • Active tenders (open for bids)                                            │
│  • Awarded tenders (historical)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    │  Scraper (Playwright)
                    │  • Filter: Telecom & IT (9) / IT (902)
                    │  • Active: status 2 | Historical: status 6
                    │  • 24 items/page, pagination
                    │  • Deep scrape: tabs d-1..d-6, award from d-5
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SCRAPED PAYLOAD (ScrapedTender[])                                            │
│  • reference_no, title, entity, deadline, booklet_price, …                   │
│  • award_amount_sar, award_date, winning_bidder (historical)                 │
│  • tab_sections (raw per-tab key/value)                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    │  POST /api/cron/sync (Bearer CRON_SECRET)
                    │  • Validate with Zod (scrapedTenderSchema)
                    │  • Map to DB shape (tenderToDbFormat)
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPABASE (PostgreSQL)                                                       │
│  • tenders: reference_no, title, entity, deadline, estimated_value,        │
│    booklet_price_sar, award_amount_sar, award_date, winning_bidder,        │
│    raw_data (JSONB full scrape), user_id = SYSTEM_USER_ID                  │
│  • Upsert key: user_id, reference_no                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────────┐   ┌───────────────────────────────────────────────────┐
│  CRM / DASHBOARD  │   │  ESTIMATION MODEL (Oracle)                         │
│  • Active tenders │   │  • Uses historical rows (award_amount_sar, etc.)   │
│  • List / detail  │   │  • Produces estimated value for new tenders         │
│  • Pipeline      │   │  • Informed by fresh daily historical scrape       │
└───────────────────┘   └───────────────────────────────────────────────────┘
```

### 2.3 Business Rules (Logic)

- **Sector:** Only **Telecom & IT** (main activity 9, sub-activity IT 902). No other sectors.
- **Active:** Only tenders with status **open for bids** (2). No awarded or closed.
- **Historical:** Only tenders with status **awarded** (6). Used only for estimation input.
- **Deduplication:** Upsert by `user_id, reference_no`; same tender can be re-scraped and updated.
- **Ownership:** All scraped tenders stored under `user_id = SYSTEM_USER_ID` (env).

---

## 3. Technical (How the Pipeline Works)

### 3.1 Components

| Component        | Role |
|------------------|------|
| **Scraper**      | Playwright (Chromium). Navigates list page, applies filters via UI, sets 24 items/page, collects URLs with pagination, deep-scrapes each detail page (tabs d-1–d-6), extracts award from d-5 for historical. Output: `ScrapedTender[]`. |
| **Test / Run scripts** | `scripts/test-scraper.ts`, `scripts/run-scraper.ts`. Test: no API, optional file save. Run: POSTs to Sync API. Modes: `--active` (default) or `--historical`. Smoke: `--smoke` (6 tenders, no save). |
| **Sync API**     | `POST /api/cron/sync`. Validates body with Zod, maps each tender to DB row (`tenderToDbFormat`), upserts into `tenders` (Supabase). Auth: `Authorization: Bearer <CRON_SECRET>`. |
| **Database**     | Supabase (PostgreSQL). Table `tenders`: columns for core + award fields; `raw_data` JSONB holds full scrape (including `tab_sections`). |

### 3.2 Technology Stack

| Layer           | Technology |
|-----------------|------------|
| Browser automation | Playwright (`@playwright/test`), Chromium |
| Runtime validation | Zod (`scrapedTenderSchema`) |
| API              | Next.js 16 App Router, `app/api/cron/sync/route.ts` |
| Database         | Supabase (PostgreSQL), `createServiceClient` |
| Language         | TypeScript (strict) |
| Scheduling       | GitHub Actions (`.github/workflows/scraper.yml`, `scraper-historical.yml`) |

### 3.3 Scraper Flow (Technical)

1. **Init:** Launch Chromium, ar-SA locale, viewport 1920×1080.
2. **List page:** Navigate to `.../Tender/AllTendersForVisitor`, open filter panel.
3. **Filter:** Set `#TenderCategory` (2 or 6), `#activitiesList` (9), `#subActivitiesList` (902); dispatch `change`; click Search; wait for `#cardsresult`.
4. **Page size:** Set `#itemsPerPage` to 24; wait for reload.
5. **Collect URLs:** Extract links from `.tender-card h3 a`; next page via `.pagination .page-link[rel="next"]` or `PageNumber=N+1`; stop when 0 results, no next, or cap (e.g. 5000 historical).
6. **Deep scrape:** For each URL (up to `batchSize`): navigate, extract tabs d-1–d-6; for d-5 use `extractAwardDataFromTables` when needed; parse amounts/dates; validate with Zod.
7. **Output:** Return `ScrapeResult { tenders, errors, metadata }`.

### 3.4 Sync API (Technical)

- **POST body:** `SyncPayload = { tenders: ScrapedTender[], metadata }`.
- **Validation:** Each tender validated with `scrapedTenderSchema`; invalid rows skipped, errors collected.
- **Mapping:** `tenderToDbFormat(tender)` → `TenderInsert` (reference_no, title, entity, deadline, estimated_value, booklet_price_sar, initial_guarantee_sar, project_duration, award_amount_sar, award_date, winning_bidder, raw_data, source: 'etimad', status: 'pending', user_id: SYSTEM_USER_ID).
- **Upsert:** By `user_id, reference_no`; max 1000 tenders per request; 10MB body limit.
- **Response:** `SyncResponse = { success, upserted, errors[] }`.

### 3.5 Database Schema (Relevant Parts)

- **tenders:** `reference_no`, `user_id` (composite unique with reference_no), `title`, `entity`, `deadline`, `estimated_value`, `description`, `source`, `status`, `booklet_price_sar`, `initial_guarantee_sar`, `project_duration`, `award_amount_sar`, `award_date`, `winning_bidder`, `raw_data` (JSONB), timestamps.
- **raw_data:** Full `ScrapedTender` (including `tab_sections`) for replay and analytics.

### 3.6 Evaluation and Sync (Post-Scrape)

After scraping, the pipeline runs:

1. **run-scraper.ts** writes scraped tenders to `scraper-output/run-<timestamp>.json` so the next step has input.
2. **evaluate-tenders** (`pnpm evaluate-tenders`) reads the latest `scraper-output/*.json`, scores each tender, and writes `data/tenders.scored.json`.
3. **sync:evaluations** (`pnpm sync:evaluations`) POSTs `data/tenders.scored.json` to `POST /api/sync/evaluations` (Bearer `CRON_SECRET`), which upserts into the `evaluations` table for CRM push.

In CI, the sync step calls the **deployed app**; set `APP_BASE_URL` (e.g. `https://your-app.vercel.app`) so `NEXT_PUBLIC_APP_URL` is set in the workflow for the sync script.

### 3.7 Scheduling and Automation

| Workflow                 | File                        | Schedule (if enabled) | Pipeline steps |
|--------------------------|-----------------------------|------------------------|----------------|
| Active scraper           | `.github/workflows/scraper.yml` | When enabled: daily 06:00 UTC (schedule currently commented out) | scrape → evaluate-tenders → sync:evaluations |
| Historical scraper      | `.github/workflows/scraper-historical.yml` | Daily 02:00 UTC        | scrape → evaluate-tenders → sync:evaluations |

Secrets: `SCRAPER_API_URL`, `CRON_SECRET`, `APP_BASE_URL` (deployed app origin for evaluation sync). Playwright Chromium installed in CI.

### 3.8 Verification and Quality

| Check              | How |
|--------------------|-----|
| **Code + logic (active)** | `pnpm verify:scraper-active` (filter, 24/page, pagination code; optional `RUN_LOGIC_CHECK=1` runs scraper and asserts log + no filter failure). |
| **Historical**     | `pnpm verify:historical` (config, types, migration, sync mapping, Zod). |
| **Review saved data** | `pnpm review:scraped` (loads `scraper-output/*.json`, runs `detectNonItTenders`, reports violations). |
| **Smoke test**     | `pnpm scrape:smoke` (6 tenders, no file save; confirms full flow without changing defaults). |
| **Strict filter**  | `STRICT_FILTER_VERIFY=true` when running scraper: fails run if any scraped tender matches non-IT title patterns. |

---

## 4. End-to-End Flow (Technical)

```
[Etimad] → [Playwright] → [Zod] → [ScrapeResult]
                ↓
         run-scraper.ts → scraper-output/run-<ts>.json
                ↓
         POST /api/cron/sync (Bearer CRON_SECRET) → tenders table
                ↓
         evaluate-tenders → data/tenders.scored.json
                ↓
         sync:evaluations → POST /api/sync/evaluations (Bearer CRON_SECRET) → evaluations table
                ↓
         [CRM Push] + [Estimation model]
```

**Combined run (local):** `pnpm pipeline:full` or `pnpm pipeline:full --historical` runs scrape → evaluate → sync in sequence.

---

## 5. Summary Table

| Aspect        | Active | Historical |
|---------------|--------|------------|
| **Filter status** | 2 (open for bids) | 6 (awarded) |
| **Activity**  | 9 / 902 (Telecom/IT, IT) | 9 / 902 |
| **List page size** | 24 | 24 |
| **URL collection** | Until batchSize or no next page | All pages (cap 5000) |
| **Award fields** | Not used | From tab d-5 |
| **Primary consumer** | CRM / pipeline | Estimation model |
| **Schedule**  | scraper.yml (when enabled: daily 06:00 UTC; currently disabled) | scraper-historical.yml (daily 02:00 UTC) |

---

## 6. References

- **Scraper config:** `lib/scraper/config.ts`
- **Scraper flow:** `lib/scraper/etimad-browser.ts`
- **Sync API:** `app/api/cron/sync/route.ts`
- **DB types:** `types/database.ts`, `types/scraper.ts`
- **Historical report:** `etmam-docs/MVP 2.0/implementation/HISTORICAL_SCRAPING_REPORT.md`
- **Active fix plan:** `etmam-docs/MVP 2.0/implementation/SCRAPER_ACTIVE_FIX_PLAN.md`
- **Data gathering report:** `docs/DATA_GATHERING_PHASE_REPORT.md`
