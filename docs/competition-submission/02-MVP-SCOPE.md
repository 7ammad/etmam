# MVP Scope — Competition Submission

**Product:** Etmam  
**Source of truth:** Codebase and docs (MVP_SCOPE.md, implementation.md, RUNBOOK) verified 2026-02-01

---

## Goal

Ingest tenders from the Saudi Etimad portal, evaluate each with a **0–100 score** and **short reasons**, assign a **recommendation** (Pursue / Monitor / Ignore), and produce **Odoo-ready CRM lead output** (Excel and optional API push).

---

## In Scope (MVP)

| Area | Scope | Evidence in codebase |
|------|--------|----------------------|
| **Input** | Tenders from Etimad: scraper output (active/historical) or sync to DB; optional manual upload (CSV/XLSX) on dashboard | `lib/scraper/etimad-browser.ts`, `app/api/cron/sync`, `components/dashboard/upload-tender-form.tsx` |
| **Processing** | Normalize to stable schema; evaluate with **config-driven rules** (editable `config/scoring.config.json`); optional value estimation when estimated_value missing; historical calibration for tiers | `lib/evaluation/rules.ts`, `lib/evaluation/value-estimator.ts`, `lib/evaluation/historical-calibrator.ts`, `config/scoring.config.json` |
| **Evaluation output** | Score 0–100, recommendation (qualified/conditional/excluded → Pursue/Monitor/Ignore), short reasons | `types/evaluation.ts`, `lib/export/odoo-excel.ts` (RECOMMENDATION_LABELS) |
| **CRM primary output** | **Odoo-ready Excel:** `output/Odoo_Leads_Import.xlsx`, sheet **Leads**, columns: Name, Customer, Expected Revenue, Closing Date, Description, Score, Recommendation, Tender Number, Source | `lib/export/odoo-excel.ts`, `scripts/export-odoo-excel.ts`, `app/api/export/odoo-excel` |
| **CRM optional** | Push lead to Odoo via API (when base URL and auth provided); scaffold in `lib/crm/`, disabled by default | `actions/crm.ts`, `lib/crm/providers/odoo.ts`, `components/dashboard/push-to-crm-button.tsx` |
| **Dashboard** | Protected (auth); list active tenders only; filters; Run analysis (single/selected/all); tender detail; Push to CRM; Download Odoo Excel; upload tenders | `app/[locale]/dashboard/`, `lib/queries/tender.ts` (getTenders: award_amount_sar null) |
| **Auth** | Login, signup, forgot-password, update-password; Supabase Auth; protected routes | `app/[locale]/login`, `lib/auth/guard.ts` |
| **Pipeline** | Scrape → evaluate-tenders → sync evaluations → export Odoo Excel (CLI and/or cron) | `scripts/pipeline-full.ts`, `scripts/evaluate-tenders.ts`, `scripts/sync-evaluations.ts`, `RUNBOOK.md` |
| **Localization** | Arabic and English (next-intl) | `messages/ar.json`, `messages/en.json`, `i18n/` |

---

## Out of Scope (MVP)

| Item | Note |
|------|------|
| Manual import as primary input | Supported as optional upload; primary input is scraper/sync. |
| Odoo auto-push as default | Requires credentials; Excel export is the guaranteed deliverable. |
| Other sectors beyond Telecom & IT | Scraper filter is activity 9 / IT 902 only. |
| Oracle / 3-stage AI evaluation | Disabled per product requirement (simple adjustable model). |
| Public-facing marketing site | App is login-protected dashboard + auth pages. |

---

## Success Criteria (for competition / demo)

- Scraper or sync produces tender records in DB or file.  
- Evaluation produces scores 0–100 with reasons and recommendation for each tender.  
- Excel export is generated and contains the required Leads columns in English.  
- Runbook/operating guide allows reproduction with copy-paste commands.  
- Dashboard shows active tenders, evaluation results, and export/push actions.

---

## Required Lead Export Fields (from code)

- **Name** (tender title)  
- **Customer** (entity)  
- **Closing Date** (deadline)  
- **Expected Revenue** (estimated value if available)  
- **Description** (includes Tender Number, Score, Recommendation, reasons)  
- **Score**  
- **Recommendation** (Pursue / Monitor / Ignore)  
- **Tender Number** (reference_no)  
- **Source** (e.g. etimad)
