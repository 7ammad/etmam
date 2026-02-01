# Handover Checklist — MVP Tender Scoring to Odoo (Excel)

## What you are receiving

This MVP provides an end-to-end workflow to:

1) read tender data from a local scraper output file  
2) evaluate each tender with a 0–100 score, short reasons, and a recommendation  
3) generate an English Excel workbook ready to import Leads into Odoo  

Odoo auto-push (API) is not enabled in this delivery because Odoo connection details were not provided. The Excel export is the primary integration method for the MVP.

---

## Requirements → Evidence mapping

### 1) Tender dataset exists

Evidence:

- Input data file under `scraper-output/` used by evaluation
- The scored file records which source file was used:
  - `data/tenders.scored.json` → `source_file`

### 2) Evaluation engine: score 0–100, reasons, recommendation

Evidence:

- Scoring config:
  - `config/scoring.config.json`
- Pure scoring rules:
  - `lib/evaluation/rules.ts`
- Output artifact:
  - `data/tenders.scored.json`

### 3) CRM/Odoo creation artifact

Evidence:

- Excel export script:
  - `scripts/export-odoo-excel.ts`
- Output artifact:
  - `output/Odoo_Leads_Import.xlsx`
- Sheet:
  - `Leads`
- Columns:
  - Name, Customer, Expected Revenue, Closing Date, Description, Score, Recommendation, Tender Number, Source

### 4) Runbook

Evidence:

- `RUNBOOK.md`

### 5) 10-minute demo walkthrough

Evidence:

- `DEMO_SCRIPT.md`
- Optional slide outline:
  - `PRESENTATION_OUTLINE.md`

### 6) Quality protocol and reproducibility

Evidence:

- `docs/QUALITY_PROTOCOL.md`
- Verification gates:
  - `pnpm type-check`
  - `pnpm verify:phase-1`
  - `pnpm verify:phase-2`

### 7) Minimum security (auth and protected access)

Evidence:

- `docs/PHASE_6_AUTH_REVIEW_REPORT.md`
- Auth: Supabase Auth, cookie-based session (SSR). Login, forgot-password, update-password, auth callback.
- Protected routes: `/[locale]/dashboard/*`, `/[locale]/settings/*` via layout `requireAuth()` and Next.js 16 proxy (`proxy.ts`).
- Env template: `.env.local.template` includes Supabase auth vars; RUNBOOK Setup points to it.

---

## Reviewer quick-start (copy/paste)

1) Install

- pnpm install

2) Environment (required to run the app)

- Copy `.env.local.template` to `.env.local`
- Fill Supabase auth vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- (Optional for CLI-only: evaluate + export work without Supabase; app and login require these.)

3) Evaluate tenders (uses latest scraper-output file by default)

- pnpm evaluate-tenders

4) Export Odoo Excel

- pnpm export:odoo-excel

5) Verify

- pnpm type-check
- pnpm verify:phase-1
- pnpm verify:phase-2

Outputs to review:

- data/tenders.scored.json
- output/Odoo_Leads_Import.xlsx

---

## Code quality review (2026-01-31)

The following issues were identified and fixed during pre-handover review:

| Severity | Issue | File | Fix Applied |
|----------|-------|------|-------------|
| CRITICAL | Guarantee penalty formula was broken | `lib/evaluation/rules.ts` | Fixed multiplication factor |
| HIGH | JSON parsing without error handling | `scripts/evaluate-tenders.ts` | Added try-catch guards |
| HIGH | JSON parsing without error handling | `scripts/export-odoo-excel.ts` | Added try-catch guards |
| HIGH | No config validation | `lib/evaluation/rules.ts` | Added weights sum + threshold validation |
| MEDIUM | Scope clarity could exceed 100 | `lib/evaluation/rules.ts` | Added Math.min cap |
| MEDIUM | Missing reason for invalid deadline | `lib/evaluation/rules.ts` | Added reason string |

All verification gates pass after fixes:
- `pnpm type-check` ✓
- `pnpm verify:phase-1` ✓ (5/5)
- `pnpm verify:phase-2` ✓ (6/6)

---

## What is intentionally deferred

- Direct Odoo API push (requires Odoo base URL + auth details)
- Any custom Odoo fields mapping beyond standard import columns
- Production hosting and full multi-tenant RBAC (auth and protected dashboard are in place)
