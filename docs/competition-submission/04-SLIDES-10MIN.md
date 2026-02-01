# 10-Minute Slides — Etmam MVP (Competition Board)

**Use:** One slide per section; ~1 min per slide. Present MVP and outputs/results.  
**Source of truth:** Codebase and docs verified 2026-02-01.

---

## Slide 1 — Problem (1 min)

- Teams need to **quickly screen** Saudi government tenders (Etimad) and decide what to pursue.
- **Manual review** is slow and inconsistent.
- Need a **simple, adjustable** model: score 0–100 with brief reasons and a clear recommendation — **"نموذج بسيط قابل للتعديل"**.

---

## Slide 2 — Solution: Etmam MVP (1 min)

- **Input:** Tenders from Etimad (scraper or sync to DB; optional upload).
- **Processing:** Config-driven evaluation (0–100 score, short reasons, recommendation: Pursue / Monitor / Ignore).
- **Output:**  
  - Scored tenders (`data/tenders.scored.json`).  
  - **Odoo-ready Excel** (`output/Odoo_Leads_Import.xlsx`) — Leads sheet in English.  
  - Optional: Push lead to Odoo via API when credentials are set.

---

## Slide 3 — Architecture (1 min)

```
Etimad Portal → Scraper (Playwright) → Sync API → Supabase (tenders)
                     ↓
              scraper-output/*.json
                     ↓
       evaluate-tenders (config/scoring.config.json)
                     ↓
              data/tenders.scored.json
                     ↓
       export:odoo-excel → output/Odoo_Leads_Import.xlsx
```

- **Dashboard:** Next.js app (en/ar), login, list active tenders, Run analysis, Export Excel, Push to CRM.

---

## Slide 4 — Scoring model (1 min)

- **Rule-based (primary):** Editable `config/scoring.config.json` — weights and thresholds.
- **Five dimensions:** budget_fit, timeline_fit, cost_of_entry, scope_clarity, risk_penalty → weighted score 0–100.
- **Recommendation:** Pursue (≥70), Monitor (≥40), Ignore (&lt;40).
- **Short reasons** per tender (e.g. "Estimated value in range", "25 days until deadline").
- **Value estimation:** When estimated_value is missing — initial guarantee, booklet tiers, or fallback; tiers can be calibrated from historical award data (`pnpm calibrate-values`).

---

## Slide 5 — Odoo output (1 min)

- **File:** `output/Odoo_Leads_Import.xlsx`  
- **Sheet:** Leads  
- **Columns (English):** Name, Customer, Expected Revenue, Closing Date, Description, Score, Recommendation, Tender Number, Source  
- **Recommendation labels:** Pursue, Monitor, Ignore  
- **Description:** Includes tender number, score, recommendation, and reasons — ready for Odoo Lead import.

---

## Slide 6 — Dashboard and results (1 min)

- **Dashboard:** Active tenders only; filters (search, recommendation, status); Run analysis (single / selected / all); tender detail with score card; **Download Odoo Excel**; **Push to CRM** (if Odoo configured); upload tenders (CSV/XLSX).
- **Results:** Same scoring logic in UI and CLI; evaluations stored in DB; Excel export from dashboard or CLI.

---

## Slide 7 — Demo commands (1 min)

```powershell
pnpm evaluate-tenders              # → data/tenders.scored.json
pnpm export:odoo-excel             # → output/Odoo_Leads_Import.xlsx
pnpm dev                           # → app at http://localhost:3000
```

Optional: `pnpm scrape:run` (active) or `pnpm scrape:run -- --historical`; `pnpm pipeline:full` when API and DB are set.

---

## Slide 8 — Quality and reproducibility (1 min)

- **Verification:** `pnpm type-check`, `pnpm verify:phase-1`, `pnpm verify:phase-2`, `pnpm test`.
- **Runbook:** `RUNBOOK.md` — setup, pipeline, DB migrations, troubleshooting.
- **Operating guide:** Short steps in `docs/competition-submission/03-OPERATING-GUIDE.md`.

---

## Slide 9 — Delivered outputs (1 min)

| Deliverable | Location |
|-------------|----------|
| Scored tenders | `data/tenders.scored.json` |
| Odoo Leads Excel | `output/Odoo_Leads_Import.xlsx` |
| Summary for Etmam | `docs/competition-submission/01-SUMMARY-FOR-ETMAM.md` |
| MVP scope | `docs/competition-submission/02-MVP-SCOPE.md` |
| Operating guide | `docs/competition-submission/03-OPERATING-GUIDE.md` |
| This slide deck | `docs/competition-submission/04-SLIDES-10MIN.md` |

---

## Slide 10 — Next steps (1 min)

- **When Odoo credentials are provided:** Enable Odoo base URL and auth; keep Excel export as fallback.
- **Ongoing:** Re-run `pnpm calibrate-values` as more historical award data is collected to refine value-estimation tiers.
- **Competition:** All MVP outputs and docs are in-repo; use RUNBOOK and operating guide to reproduce.

---

**End of 10-minute deck.**
