# MVP Runbook — Etimad Tender Scoring to Odoo Lead Import (Excel)

## Local DB only

**This project uses only the local Supabase database.** Do not link a remote project. Set `.env.local` to your local Supabase URL (e.g. `http://127.0.0.1:54321`) and keys from `pnpm supabase status`. The remote project has been unlinked; keep it that way.

**Warning:** `pnpm supabase db reset` wipes the local DB and reapplies all migrations — all tenders, evaluations, and other data are lost. To apply a new migration without losing data, run the migration SQL in Supabase Studio (http://127.0.0.1:54323) → SQL Editor instead of `db reset`.

---

## What this does

This repo can:

- Read tender data from a local scraper output file
- Score each tender 0–100 with short reasons and a recommendation
- Generate an English Excel workbook suitable for importing Leads into Odoo

Key outputs:

- data/tenders.scored.json
- output/Odoo_Leads_Import.xlsx

## Prerequisites

- Node.js installed
- pnpm installed
- Supabase CLI installed (for local DB: `supabase start`)

## Setup

1) Install dependencies

- pnpm install

2) Local database first (recommended)

The app talks to whatever Supabase URL and keys are in `.env.local`. Use a **local** Supabase instance so everything (auth, dashboard, scraper sync) runs against a local DB. Remote syncing can be figured out later.

- Start local Supabase: `pnpm supabase start` (or `npx supabase start`)
- Get local API URL and keys: `pnpm supabase status` — copy **API URL**, **anon key**, and **service_role key**
- Copy `.env.local.template` to `.env.local` and set:
  - `NEXT_PUBLIC_SUPABASE_URL` = local API URL (e.g. `http://127.0.0.1:54321`)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = local anon key
  - `SUPABASE_SERVICE_ROLE_KEY` = local service_role key
- Apply schema locally (all migrations, including tenders): `pnpm supabase db reset` (or `npx supabase db reset`)
- Optional: `CRON_SECRET` for scraper/sync (generate: `pnpm generate:cron-secret`). For local scrape → DB, set `API_URL=http://127.0.0.1:3000/api/cron/sync` when running the app on port 3000.

No remote project or link/push needed. The app and scraper sync use the local DB only.

3) Environment variables (if not using local DB)

- Copy `.env.local.template` to `.env.local`
- Fill the Supabase auth vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- For the full list (AI, scraper, Odoo), see `.env.example`

4) Confirm the scoring config exists

- config/scoring.config.json

## Input data

This pipeline expects an existing scraped tenders JSON file.

Default behavior:

- The evaluation script will try to load the latest file under scraper-output/

If you already have a scraper output file, keep it under:

- scraper-output/<any-name>.json

## Load historic data into the database

Historic scraped data lives in **scraper-output/run-*.json**. To load it into the local DB:

1. **Start the dev server** (so the sync API is available): `pnpm dev`
2. **Set CRON_SECRET** in `.env.local` (e.g. `pnpm generate:cron-secret`).
3. In another terminal, run one of:

- **Latest file only:**  
  `pnpm load:historic`  
  Syncs the most recent `scraper-output/run-*.json` (by file mtime).

- **Specific file:**  
  `pnpm load:historic scraper-output/run-2026-01-31T23-48-56-987Z.json`

- **All run files (merged, deduped by reference_no):**  
  `pnpm load:historic --all`

The script POSTs to `/api/cron/sync`; tenders are upserted by `(user_id, reference_no)` (system user). After loading historic tenders, run **`pnpm calibrate:from-db`** to regenerate `data/calibration-result.json` from the DB so the V2 value estimator uses historic data under the hood. Then you can run analysis from the dashboard or sync evaluations from `data/tenders.scored.json` with `pnpm sync:evaluations` (tenders must exist in DB first).

## Run the pipeline

**Full pipeline (scrape → evaluate → sync):** `pnpm pipeline:full` or `pnpm pipeline:full --historical`. Requires `API_URL`, `CRON_SECRET`, and (for sync) `NEXT_PUBLIC_APP_URL` or `APP_BASE_URL` in CI.

**Step by step:**

1) Evaluate tenders to file

- pnpm evaluate-tenders

Optional: Evaluate a specific scraper output file

- pnpm evaluate-tenders path/to/your-scraped-file.json

Expected output:

- data/tenders.scored.json

2) Export Odoo Excel (English)

- pnpm export:odoo-excel

Optional: Export using a specific scored file

- pnpm export:odoo-excel data/tenders.scored.json

Expected output:

- output/Odoo_Leads_Import.xlsx
- Sheet name: Leads

## Database migrations

Your app uses the Supabase instance in `.env.local` (local or remote). Schema must be applied to that instance.

**Local DB (recommended first):** Run `pnpm supabase db reset` (or `npx supabase db reset`). That applies all migrations (00001–00010) to the local database. No link or remote needed. Scraper sync and dashboard then work against the local DB.

**Remote / syncing later:** When you want to use a hosted Supabase project or push schema to it:

- **Option A — Script:** Set `SUPABASE_ACCESS_TOKEN` (and optionally `SUPABASE_DB_PASSWORD`) in `.env.local`, then run `powershell -ExecutionPolicy Bypass -File ./scripts/supabase-link-and-push.ps1` to link and push all migrations.
- **Option B — Manual SQL:** In [Supabase Dashboard](https://supabase.com/dashboard) → your project → SQL Editor, run the migration files in order (00001 through 00010) as needed.

**After 00008 (RLS):** If your `SYSTEM_USER_ID` in `.env.local` differs from `00000000-0000-0000-0000-000000000001`, run in SQL (local: `supabase db execute` or Dashboard):  
`UPDATE public.app_config SET value = '<your SYSTEM_USER_ID>' WHERE key = 'system_user_id';`  
See `docs/RLS_POLICY_SUMMARY.md`.

## Run the app (optional)

To run the web app (login and protected dashboard):

- `pnpm dev` → open `http://localhost:3000` (or `/ar/login`)
- Requires Supabase auth vars in `.env.local` (see Setup step 2).

## Dashboard and UI

After logging in you can:

1. **Dashboard list** — `/[locale]/dashboard` shows:
   - Page title "Dashboard" (or "لوحة التحكم" in Arabic)
   - Export Odoo card (download Excel)
   - KPI row (total tenders, qualified, conditional, excluded, not evaluated, deadlines)
   - Filters (search, recommendation, status, sort)
   - Tenders table (entity, title, reference, deadline, value, score, recommendation, status) or empty state "No tenders found"
2. **Tender detail** — Click a row or open `/[locale]/dashboard/[tenderId]` to see tender data and evaluation.
3. **Export** — Use "Download Odoo Excel" on the dashboard, or run `pnpm export:odoo-excel` for the same file.

Logged-out users hitting `/dashboard` or `/settings` are redirected to login. Session survives refresh.

## Quality checks

Run these before submission:

- pnpm type-check
- pnpm verify:phase-1
- pnpm verify:phase-2
- pnpm test (Playwright UI smoke tests; start app with `pnpm dev` in another terminal, or set `START_SERVER=1 pnpm test`)

## Troubleshooting

If evaluation fails:

- Confirm there is at least one JSON file under scraper-output/
- Confirm the file contains tenders with reference_no, title, and entity fields

If export fails:

- Confirm data/tenders.scored.json exists
- Confirm the scored file includes source_file and tenders[]
- Confirm the referenced source_file exists, or export will proceed with partial fields and warnings

**Sync fails with "Could not find the 'booklet_price_sar' column":**

- The `tenders` table is missing columns required by the sync API (migrations 00004/00005 or 00010 not applied).
- **Fix:** Apply `supabase/migrations/00010_add_missing_tender_columns.sql` to your Supabase project (see "Database migrations" above — Option A or B). Then retry sync.

**`[translation-cache] Could not find the table 'public.phrase_translations'`:**

- The translation cache table was not applied to your database.
- **Fix (local):** Run `pnpm supabase db reset` to apply all migrations (including `00013_phrase_translations.sql`). This resets the local DB. If you must keep data, run the SQL in the next option instead.
- **Fix (local or remote, no reset):** In [Supabase Dashboard](https://supabase.com/dashboard) → your project → SQL Editor, paste and run the contents of `docs/supabase-phrase-translations-manual.sql`. For local Supabase, use the SQL Editor in the local dashboard at the URL shown by `pnpm supabase status`.

**Run analysis fails with PGRST116 / "Cannot coerce the result to a single JSON object" / "Failed to update tender":**

- The tender was created by the system user (scraper). RLS allowed SELECT but only the owner could UPDATE, so the status update affected 0 rows.
- **Fix:** Apply migration `00015_tenders_update_own_or_system.sql` so authenticated users can UPDATE tenders they can see (own or system). **Local:** Run `pnpm supabase db reset` (applies all migrations). **Remote:** Push migrations (`pnpm supabase db push`) or run the contents of `supabase/migrations/00015_tenders_update_own_or_system.sql` in Supabase SQL Editor.
