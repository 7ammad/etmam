# Competition Submission — Etmam MVP

This folder contains the four deliverables for submitting the Etmam app to the competition board. All content is cross-checked against the **codebase** as source of truth (2026-02-01).

---

## Deliverables

| # | File | Purpose |
|---|------|--------|
| 1 | **01-SUMMARY-FOR-ETMAM.md** | One-page executive summary: what Etmam does, key capabilities, main outputs, tech stack, one-sentence summary. |
| 2 | **02-MVP-SCOPE.md** | MVP scope: goal, in-scope (input, processing, output, dashboard, auth, pipeline), out-of-scope, success criteria, required lead export fields. |
| 3 | **03-OPERATING-GUIDE.md** | Short operating guide: prerequisites, setup, get data, evaluate, export Excel, run app, full pipeline, calibration, quality checks, troubleshooting, key paths. |
| 4 | **04-SLIDES-10MIN.md** | 10-minute slide deck (one slide per section): problem, solution, architecture, scoring model, Odoo output, dashboard/results, demo commands, quality, delivered outputs, next steps. |

---

## How to use

- **Summary:** Share with judges or stakeholders for a quick overview.
- **MVP scope:** Use to confirm what is in/out of scope for the competition.
- **Operating guide:** Use to run the app and reproduce outputs (full details in project root `RUNBOOK.md`).
- **Slides:** Present in order (~1 min per slide) to describe the MVP and results in 10 minutes.

---

## Source of truth

Content was verified against:

- `app/`, `actions/`, `components/`, `lib/`, `scripts/`, `config/`
- `docs/MVP_SCOPE.md`, `docs/FULL_EVALUATION_PROCESS.md`, `docs/DATA_PIPELINE_REPORT.md`
- `RUNBOOK.md`, `HANDOVER_CHECKLIST.md`, `PRESENTATION_OUTLINE.md`, `DEMO_SCRIPT.md`
- `package.json`, `lib/export/odoo-excel.ts`, `lib/queries/tender.ts`, `lib/evaluation/`
