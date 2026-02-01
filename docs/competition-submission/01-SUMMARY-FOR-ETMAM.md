# Summary for Etmam — Competition Submission

**Product:** Etmam — Tender evaluation and CRM lead pipeline for Saudi government tenders (Etimad)  
**Version:** MVP 0.1.0  
**Source of truth:** Codebase verified 2026-02-01

---

## What Etmam Does

Etmam is a **tender evaluation and CRM pipeline** that:

1. **Ingests** Saudi government tenders from the **Etimad portal** (tenders.etimad.sa), either by automated scraping (Telecom & IT sector) or by manual file upload.
2. **Evaluates** each tender with a **0–100 score**, **short reasons**, and a **recommendation** (Pursue / Monitor / Ignore) using a **simple, adjustable, config-driven model** — no AI hallucination; logic is editable via a JSON config file.
3. **Outputs** results for CRM use: **Odoo-ready Excel import** (Leads sheet in English) and optional **push to Odoo** when credentials are configured.

The system is built to match the Arabic product requirement: **"تقييم كل منافسة بنموذج بسيط قابل للتعديل"** (evaluate each tender with a simple, adjustable model).

---

## Key Capabilities (Verified in Code)

| Capability | Implementation |
|------------|----------------|
| **Data source** | Etimad scraper (Playwright), active (open-for-bids) and historical (awarded) modes; sync to Supabase via `POST /api/cron/sync`. |
| **Dashboard** | Next.js 16 app with Arabic/English; login (Supabase Auth); protected dashboard showing **active tenders only** (awarded tenders used only for value calibration). |
| **Evaluation** | **Rule-based primary:** `config/scoring.config.json` + `lib/evaluation/rules.ts` (budget_fit, timeline_fit, cost_of_entry, scope_clarity, risk_penalty). Score 0–100; recommendation qualified ≥70, conditional ≥40, excluded &lt;40. **AI fallback** when config is missing. |
| **Value estimation** | When `estimated_value` is missing: initial guarantee (±10%), booklet-price tiers (data-driven), or fallback 1–3M SAR. **Historical calibration:** `pnpm calibrate-values` uses award data to refine tiers. |
| **CRM output** | **Excel:** `output/Odoo_Leads_Import.xlsx` (Leads sheet: Name, Customer, Expected Revenue, Closing Date, Description, Score, Recommendation, Tender Number, Source). **Push to CRM:** Odoo provider (optional; requires base URL and auth). |
| **Security** | Supabase Auth; protected routes for dashboard and settings; cron sync secured with `CRON_SECRET`. |

---

## Main Outputs and Results

- **Scored tenders:** `data/tenders.scored.json` (reference_no, title, score, recommendation, reasons).  
- **Odoo import file:** `output/Odoo_Leads_Import.xlsx` — English Leads sheet ready for Odoo import.  
- **Dashboard:** List and detail view of active tenders with score, recommendation, filters, Run analysis (single/selected/all), Push to CRM, and Download Odoo Excel.  
- **Reproducibility:** Full pipeline from scrape → evaluate → sync → export documented in RUNBOOK; verification scripts: `pnpm type-check`, `pnpm verify:phase-1`, `pnpm verify:phase-2`.

---

## Technology Stack (from package.json and app)

- **Frontend:** Next.js 16, React 19, next-intl (en/ar), Radix UI, Tailwind.  
- **Backend / DB:** Supabase (PostgreSQL, Auth).  
- **Scraper:** Playwright (Chromium).  
- **Export:** xlsx (Odoo Excel).  
- **Validation:** Zod.  

---

## One-Sentence Summary

**Etmam** ingests Saudi Etimad tenders, evaluates them with a simple config-driven model (score 0–100, Pursue/Monitor/Ignore), and delivers Odoo-ready Leads via Excel (and optional API push) for competition board and CRM use.
