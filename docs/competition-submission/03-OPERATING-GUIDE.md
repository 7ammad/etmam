# Short Operating Guide — Etmam MVP

**Purpose:** Minimal steps to run the app and produce competition/demo outputs.  
**Full details:** See `RUNBOOK.md` in project root.

---

## Prerequisites

- **Node.js** and **pnpm** installed  
- **Supabase** (local or hosted): for app login and dashboard DB  
- **PowerShell:** If scripts are blocked, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

## 1. One-time setup

```powershell
# Install dependencies
pnpm install

# Environment
# Copy .env.local.template to .env.local and set:
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# Optional: CRON_SECRET (for scrape/sync), Odoo vars (for push)

# Local DB (recommended first)
pnpm supabase start
# Then set .env.local with local API URL and keys from: pnpm supabase status
pnpm supabase db reset

# Config
# Ensure config/scoring.config.json exists (in repo)
```

---

## 2. Get tender data

**Option A — Scraper (no DB required for file-only pipeline):**

```powershell
# Active (open) tenders — default
pnpm scrape:run

# Historical (awarded) tenders — for calibration
pnpm scrape:run -- --historical
```

Output: `scraper-output/<timestamp>.json`. For DB pipeline, set `API_URL` and `CRON_SECRET` and run scraper so it POSTs to `POST /api/cron/sync`.

**Option B — Use existing file:** Place a scraper-output JSON under `scraper-output/` or pass path to evaluate-tenders.

**Option C — Dashboard upload:** Run app (`pnpm dev`), log in, use upload form on dashboard when list is empty.

---

## 3. Evaluate tenders

```powershell
# Use latest file in scraper-output/
pnpm evaluate-tenders

# Or specific file
pnpm evaluate-tenders path/to/scraped-file.json
```

Output: `data/tenders.scored.json` (score, recommendation, reasons per tender).

---

## 4. Export Odoo Excel

```powershell
pnpm export:odoo-excel
# Or: pnpm export:odoo-excel data/tenders.scored.json
```

Output: `output/Odoo_Leads_Import.xlsx` — sheet **Leads**, English columns for Odoo import.

---

## 5. Run the web app (optional)

```powershell
pnpm dev
```

Open `http://localhost:3000` (or `/ar` for Arabic). Log in → Dashboard: list active tenders, Run analysis, Evaluate selected/all, Download Odoo Excel, Push to CRM (if Odoo configured).

---

## 6. Full pipeline (scrape → evaluate → sync → export)

When `API_URL`, `CRON_SECRET`, and Supabase are set:

```powershell
pnpm pipeline:full
# Or historical: pnpm pipeline:full --historical
```

Then export from DB-backed scored data or run `pnpm evaluate-tenders` + `pnpm export:odoo-excel` as above.

---

## 7. Calibration (optional)

To refine value-estimation tiers from historical award data:

```powershell
pnpm calibrate-values
# Or: pnpm calibrate-values scraper-output/file1.json scraper-output/file2.json
```

Output: `data/calibration-result.json`. Use suggested tiers to update `config/scoring.config.json` → `value_estimation.booklet_tiers`.

---

## 8. Quality checks (before submission)

```powershell
pnpm type-check
pnpm verify:phase-1
pnpm verify:phase-2
pnpm test
```

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| **pnpm scripts blocked (PowerShell)** | `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` or use **cmd.exe**. |
| **No tenders after evaluate** | Ensure at least one JSON in `scraper-output/` (or path given) with valid tenders (reference_no, title, entity). |
| **Export fails** | Ensure `data/tenders.scored.json` exists and has `tenders` array; run `pnpm evaluate-tenders` first. |
| **Sync fails (missing column)** | Apply DB migrations: `pnpm supabase db reset` or run migration SQL (e.g. 00010) on your Supabase project. |
| **Dashboard empty** | Dashboard shows only **active** tenders (award_amount_sar null). Sync active scrape or upload tenders. |

---

## Key paths (source of truth)

| What | Where |
|------|--------|
| Scoring config | `config/scoring.config.json` |
| Scored output | `data/tenders.scored.json` |
| Odoo Excel | `output/Odoo_Leads_Import.xlsx` |
| Calibration output | `data/calibration-result.json` |
| Full runbook | `RUNBOOK.md` |
