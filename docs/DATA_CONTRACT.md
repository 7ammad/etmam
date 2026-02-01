# Data Contract

**Purpose:** Single source of truth for data shapes at pipeline boundaries. Use this when changing the scraper, sync API, or database schema so contracts stay consistent.

**Related docs:** `docs/DATA_PIPELINE_REPORT.md` (flow), `docs/etimad-scraped-fields-schema.json` (scraped field reference).

---

## 1. Boundaries

| Boundary | Input | Output | Code |
|----------|--------|--------|------|
| Scraper → Sync API | Scraped tender list + metadata | — | `types/scraper.ts` (ScrapedTender, SyncPayload) |
| Sync API → Database | ScrapedTender[] | upserted count, errors | `app/api/cron/sync/route.ts` |
| Database (tenders) | Insert/Update | Row | `types/database.ts`, Supabase migrations |

---

## 2. Scraper output (ScrapedTender)

**Source:** Etimad portal (https://tenders.etimad.sa).  
**Validated by:** `scrapedTenderSchema` in `types/scraper.ts` (Zod).

### Required fields

| Field | Type | Notes |
|-------|------|--------|
| `reference_no` | string | Non-empty; unique per tender. |
| `title` | string | Non-empty. |
| `entity` | string | Non-empty; government entity. |
| `deadline` | string | ISO 8601 datetime (e.g. `2026-02-10T00:00:00.000Z`). |
| `tab_sections` | Record<string, Record<string, string>> | At least one tab; raw key-value from detail tabs. |
| `source` | `'etimad'` | Literal. |
| `scraped_at` | string | ISO 8601 datetime. |

### Optional fields

| Field | Type | Notes |
|-------|------|--------|
| `estimated_value` | number \| null | SAR. |
| `booklet_price` | number \| null | SAR; null when "مجانا". |
| `initial_guarantee` | number \| null | Percentage. |
| `contract_duration` | string \| null | e.g. "10 يوم", "180 يوم". |
| `description` | string \| null | Purpose/scope. |
| `tender_url` | string \| null | Valid URL. |
| `award_amount_sar` | number \| null | Historical/awarded only. |
| `award_date` | string \| null | Historical/awarded only. |
| `winning_bidder` | string \| null | Historical/awarded only. |

Full field list and Arabic labels: `docs/etimad-scraped-fields-schema.json`.

---

## 3. Sync API (cron/sync)

**Endpoint:** `POST /api/cron/sync`  
**Auth:** `Authorization: Bearer <CRON_SECRET>`  
**Max body:** 10 MB. Max tenders per request: 1000.

### Request body (SyncPayload)

```ts
{
  tenders: ScrapedTender[]   // validated with scrapedTenderSchema
  metadata: ScrapeMetadata  // startedAt, completedAt, totalScraped, totalErrors, etc.
}
```

### Response (SyncResponse)

```ts
{
  success: boolean
  upserted: number
  errors: string[]
  metadata?: ScrapeMetadata
}
```

Upsert key: `reference_no` (unique). All scraped payload is stored in `raw_data` (JSONB); normalized columns are derived in `tenderToDbFormat()` in `app/api/cron/sync/route.ts`.

---

## 4. Database: tenders table

**Types:** `types/database.ts` → `Database['public']['Tables']['tenders']`.  
**Migrations:** `supabase/migrations/`.

### Columns (contract)

| Column | Type | Required | Notes |
|--------|------|----------|--------|
| `id` | uuid | no (generated) | PK. |
| `created_at` | timestamptz | no (generated) | |
| `updated_at` | timestamptz | no (generated) | |
| `user_id` | uuid | yes | Owner; scraper uses SYSTEM_USER_ID. |
| `reference_no` | text | yes | Unique; from scraper. |
| `title` | text | yes | |
| `entity` | text | yes | |
| `deadline` | timestamptz | yes | ISO 8601. |
| `estimated_value` | numeric | no | SAR. |
| `description` | text | no | |
| `source` | text | no | Default `'etimad'`. |
| `status` | enum | no | Default `'pending'`. See below. |
| `raw_data` | jsonb | no | Full scraped payload (incl. tab_sections). |
| `booklet_price_sar` | numeric | no | |
| `initial_guarantee_sar` | numeric | no | |
| `project_duration` | text | no | From scraper `contract_duration`. |
| `award_amount_sar` | numeric | no | Historical. |
| `award_date` | timestamptz | no | Historical. |
| `winning_bidder` | text | no | Historical. |

**Status enum:** `pending` \| `evaluating` \| `evaluated` \| `approved` \| `pushed` \| `rejected`.

---

## 5. Scraper → database field mapping

| ScrapedTender field | tenders column |
|---------------------|----------------|
| reference_no | reference_no |
| title | title |
| entity | entity |
| deadline | deadline |
| estimated_value | estimated_value |
| description | description |
| booklet_price | booklet_price_sar |
| initial_guarantee | initial_guarantee_sar |
| contract_duration | project_duration |
| award_amount_sar | award_amount_sar |
| award_date | award_date |
| winning_bidder | winning_bidder |
| (full object) | raw_data (JSONB) |
| — | source = 'etimad', status = 'pending', user_id = SYSTEM_USER_ID |

---

## 6. Where schemas live in code

| Contract | Schema / types | File |
|----------|----------------|------|
| Scraped payload | scrapedTenderSchema, ScrapedTender, SyncPayload, SyncResponse | `types/scraper.ts` |
| Sync API mapping | tenderToDbFormat() | `app/api/cron/sync/route.ts` |
| DB tenders | Database['public']['Tables']['tenders'] | `types/database.ts` |
| App tender validation | tenderSchema, TenderStatus | `types/tender.ts` |

**Rule:** When adding or changing a scraped field used in the pipeline, update (1) `types/scraper.ts` (Zod + types), (2) `tenderToDbFormat()` and DB migration if stored as a column, (3) this doc and optionally `docs/etimad-scraped-fields-schema.json`.

---

## 7. Evaluation boundary (MVP)

**Purpose:** Convert a tender into an evaluation result that is:
- deterministic
- editable via config
- exportable to CRM (Excel today, API later)

### Input to evaluation

Preferred input shape depends on run mode:

- **DB mode (existing):** records read from `tenders` table.
- **File mode (MVP-friendly):** records read from `scraper-output/*.json` or a normalized `data/tenders.normalized.json`.

Minimum required fields for evaluation (logical contract)
- reference_no: string
- title: string
- entity: string
- deadline: string | null
- estimated_value: number | null
- source: 'etimad' | 'file'

### Output of evaluation (TenderEvaluation)

Contract shape:
- reference_no: string
- score_0_100: number   // 0..100
- recommendation: 'Pursue' | 'Monitor' | 'Ignore'
- reasons: string[]     // short, human-readable
- scoring_version: string
- evaluated_at: string  // ISO 8601

Storage options:
- **Today:** file output `data/tenders.scored.json`
- **Later:** DB table `tender_evaluations` or fields on `tenders` (if you decide)

---

## 8. Odoo lead export boundary (MVP Excel)

**Purpose:** Generate an importable Excel workbook to create Leads in Odoo when API credentials are not available.

### Output file
- Path: `output/Odoo_Leads_Import.xlsx`
- Sheet name: `Leads`
- Language: English

### Excel columns (contract)

- Name
- Customer
- Expected Revenue
- Closing Date
- Description
- Score
- Recommendation
- Tender Number
- Source

### Mapping rules

- Name = title
- Customer = entity
- Expected Revenue = estimated_value (SAR) if present else blank
- Closing Date = deadline if present else blank
- Score = score_0_100
- Recommendation = recommendation
- Tender Number = reference_no
- Source = source

### Description format (contract)

Line 1: Tender Number: <reference_no>
Line 2: Score: <score_0_100> | Recommendation: <recommendation>
Then reasons, one per line, prefixed with "- "

---

## 9. Local-first run mode (MVP)

**Goal:** Allow end-to-end demonstration without Supabase and without Odoo credentials.

### Artifacts

- `data/tenders.raw.json` or `scraper-output/*.json` (scraper output)
- `data/tenders.scored.json` (evaluation output)
- `output/Odoo_Leads_Import.xlsx` (CRM-ready output)

### Notes

- Sync API and Supabase are supported by the repo, but MVP can run without them.
- When Odoo credentials arrive, enable auto-push via CRM provider configuration; Excel export remains as fallback.

---

## 10. Naming note: initial_guarantee

The scraper field `initial_guarantee` represents a percentage in the scraped payload.
The current DB column name `initial_guarantee_sar` is legacy naming; treat it as a percentage unless a future migration changes it.
