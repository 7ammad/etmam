# docs/dashboard/DATA_SOURCES.md

**Status**
- Phase: 7.1
- Scope: Spec only, no implementation

**Goal**
Define the dashboard's data sources and mapping so Phase 7.2+ can be implemented without guesswork and without inventing repo state.

This doc only defines what the dashboard is allowed to read and how to label Unknown when a field is not available yet.

---

## Source-of-truth requirements from the Arabic MVP request

MVP data and UI requirements:
- Pull tenders from Etimad, or start from a source file like Excel or CSV.
- Evaluate each tender with an editable model: score 0–100 with short reasons.
- Create a CRM record with core fields: entity, title, tender number, deadline, estimated value, score, recommendation.
- Provide a simple screen showing tenders and evaluation results, or an auto-generated report.

Evaluation criteria includes minimum security and protection of login data.

---

## Confirmed artifacts and commands

Confirmed CLI pipeline outputs:
- `pnpm evaluate-tenders` produces `data/tenders.scored.json`.
- `pnpm export:odoo-excel` produces `output/Odoo_Leads_Import.xlsx`.

Confirmed Odoo Excel content:
- Sheet: Leads
- Columns: Name, Customer, Expected Revenue, Closing Date, Description, Score, Recommendation, Tender Number, Source

Confirmed evaluation config:
- `config/scoring.config.json` defines thresholds, weights, and rule parameters for a 0–100 score and recommendation.

Confirmed minimum security implementation scope:
- Supabase Auth, cookie-based SSR session
- Protected routes: `/[locale]/dashboard/*`, `/[locale]/settings/*` via `requireAuth()` in layout and proxy `proxy.ts`

---

## Dashboard data sources

### Primary runtime source for the web app
- Supabase is required to run the app's login and protected dashboard.
- The dashboard must only read data through server-side routes or server components behind auth.

Confidence
- Confirmed: Supabase is required for auth and access control.
- Unknown: Exact Supabase table names and column names used by the dashboard data layer. This must be verified in Phase 7.2 by inspecting the repo query modules used by dashboard pages.

### Secondary, confirmed local artifacts for evaluation and export
The system is explicitly designed to run the evaluation and export locally without Supabase credentials.

Therefore, the dashboard must support a "partial data" state where tenders exist but evaluation is missing or not yet stored in the DB.

---

## UI-level data contract

This defines the data that the UI expects. Any backing store must map to this.

### TenderUI model
Required fields:
- id: string
- entity: string
- title: string
- referenceNo: string
- deadline: ISO date string or null
- estimatedValueSar: number or null
- status: enum string or null

Optional fields:
- description: string or null
- source: string or null
- createdAt: ISO datetime string or null
- rawData: unknown JSON or null

Evidence for labels and expected fields in UI:
- Tender labels are present in i18n as: entity, referenceNo, deadline, estimatedValue, status, description, source, createdAt.

### EvaluationUI model
Required fields when present:
- tenderId: string
- score: number 0–100
- recommendation: qualified | conditional | excluded

Optional fields:
- reasons: string[] or null
- summary: string or null
- strengths: string[] or null
- risks: string[] or null
- missingRequirements: string[] or null
- actionItems: string[] or null
- breakdown: object or null

Evidence for evaluation field set and labels:
- evaluation: score, recommendation, strengths, risks, summary, missingRequirements, actionItems, breakdown.
- recommendation value set includes notEvaluated.

---

## Derived fields and computation rules

### Deadline status
Used by list table chip and filter:
- past if deadline < today
- closing_soon if deadline is within 7 days inclusive
- open otherwise

### KPI computation
KPIs are computed from:
- tenders total count
- evaluation recommendations grouped when evaluation exists
- pending evaluation count when evaluation missing
- total estimated value sum (ignore nulls)
- pushed to CRM count derived from tender.status if status values exist for pushed

Status values already present in i18n include pushed.

---

## Data source selection logic per screen

### Dashboard list: `/[locale]/dashboard`
Inputs required:
- Tenders list: TenderUI[]
- Evaluations: map tenderId -> EvaluationUI

Source selection:
- Preferred: Fetch tenders and evaluation data from Supabase in server context behind auth.
- Required fallback behavior: If evaluation data is not present for a tender, show Score = "—" and Recommendation = "Not evaluated".

### Tender detail: `/[locale]/dashboard/[tenderId]`
Inputs required:
- One tender: TenderUI
- Optional evaluation: EvaluationUI
- Optional rawData viewer

Fallback behavior:
- If evaluation missing: show "Not evaluated" and hide evaluation detail lists.

---

## CRM integration path in MVP

Confirmed MVP integration artifact:
- Odoo import-ready Excel is the primary integration method because Odoo API details were not provided.

UI implication for Phase 7.5:
- Dashboard must provide a way to produce or download the Excel artifact, but API push remains deferred until credentials exist.

---

## Security and data handling constraints

- Do not read Supabase service role key in the client.
- Do not emit secrets in client logs.
- All dashboard data reads must happen behind auth.
Evidence:
- Protected routes for dashboard are enforced via `requireAuth()` in layout.

---

## Verification plan for Phase 7.2+ implementation

Required gates before marking any Phase 7 task "Done":
- pnpm type-check
- pnpm verify:phase-1
- pnpm verify:phase-2

Minimum manual verification:
- Login and open `/[locale]/dashboard`
- Confirm list renders and supports filters
- Open a tender detail page
- Confirm logged-out users cannot access dashboard routes
