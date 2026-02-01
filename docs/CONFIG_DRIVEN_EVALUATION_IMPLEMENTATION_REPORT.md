# Config-Driven Evaluation — Implementation Report

**Date:** 2026-02-01  
**Requirement:** Arabic file "علاقات العملاء - فكرة .txt" — **"تقييم كل منافسة بنموذج بسيط قابل للتعديل"** (Evaluate each tender with a simple, adjustable model). Score 0–100 with brief reasons; clear, adjustable logic.

---

## 1. What Was Done

### 1.1 Rule-based as primary (dashboard)

- **`actions/evaluation.ts`**  
  - When `config/scoring.config.json` is present, "Run analysis" uses the **rule-based engine** only (no AI).
  - Converts DB tender to scraped shape via `tenderRowToScraped`, calls `scoreTender(scraped, config)`, then upserts to `evaluations` with `model_used: 'rule-based'`, `summary` from `reasons`, and empty `breakdown`.
  - When config is **not** present, falls back to existing AI evaluator.

### 1.2 Config loader and DB adapter

- **`lib/evaluation/config-loader.ts`**  
  - `loadScoringConfig()` reads `config/scoring.config.json` (server/Node only). Returns `ScoringConfig | null`.

- **`lib/evaluation/db-adapter.ts`**  
  - `tenderRowToScraped(tender)` maps `Tables<'tenders'>` to `ScrapedTender` so the same `scoreTender()` logic can run from the dashboard (DB row) and from the CLI (scraper output).

- **`lib/evaluation/index.ts`**  
  - Exports `loadScoringConfig` and `tenderRowToScraped`.

### 1.3 Strict config-executor prompt (optional AI path)

- **`lib/ai/prompts.ts`**  
  - `buildStrictEvalPrompt(tenderText, config)` added. Instructs the model to **execute the given CONFIG only** (extract data, apply rule dimensions, output score/recommendation/reasons). No opinion, no invented requirements. Use when you want an optional "AI as config executor" instead of full rule-only.

### 1.4 Oracle disabled

- **`app/actions/oracle.ts`**  
  - Top-of-file comment: Oracle 3-stage (Requirement Hallucination → Budget Triangulation → Fit Scoring) is **disabled** per product requirement; do not wire `runOracleEvaluation` in the UI.

### 1.5 Docs

- **`docs/PROJECT_LOGIC_AND_EVALUATION_REPORT.md`**  
  - Updated: primary path = Rule-based (when config exists); AI = fallback; Oracle = disabled. Conclusion and path table adjusted.

---

## 2. Verification

| Check | Command / action | Result |
|-------|-------------------|--------|
| Rule-based CLI | `pnpm evaluate-tenders` | Exit 0; wrote 50 scored tenders to `data/tenders.scored.json` |
| Build | `pnpm run build` | Exit 0; TypeScript and Next.js build succeeded |
| Lint | IDE / read_lints on changed files | No linter errors reported |

---

## 3. How to adjust behaviour

- **Control panel:** `config/scoring.config.json`  
  - Edit `weights`, `thresholds`, and `rules` (budget_fit, timeline_fit, cost_of_entry, scope_clarity, risk_penalty).  
  - Weights must sum to 1.0; thresholds define qualified (≥70) and conditional (≥40).

- **Dashboard "Run analysis":**  
  - If config is present → rule-based only (deterministic, no AI).  
  - If config is missing → current AI evaluator (fallback).

- **Oracle:** Do not call `runOracleEvaluation` from the UI; it remains in code but is disabled by policy.

---

## 4. Files touched

| File | Change |
|------|--------|
| `actions/evaluation.ts` | Primary path = rule-based when config loaded; fallback = AI |
| `lib/evaluation/config-loader.ts` | New: `loadScoringConfig()` |
| `lib/evaluation/db-adapter.ts` | New: `tenderRowToScraped()` |
| `lib/evaluation/index.ts` | Export config-loader and db-adapter |
| `lib/ai/prompts.ts` | New: `buildStrictEvalPrompt(tenderText, config)` |
| `app/actions/oracle.ts` | Disabled-by-policy comment |
| `docs/PROJECT_LOGIC_AND_EVALUATION_REPORT.md` | Primary = rule-based; Oracle disabled |
| `docs/CONFIG_DRIVEN_EVALUATION_IMPLEMENTATION_REPORT.md` | This report |

---

## 5. Summary

- **Requirement:** Simple, adjustable model; score 0–100 with brief reasons; no invented requirements.  
- **Implementation:** Dashboard "Run analysis" uses the **rule-based engine** (config-driven) when `config/scoring.config.json` exists; otherwise it uses the existing AI evaluator. Oracle is **not** used in the UI.  
- **Verification:** `pnpm evaluate-tenders` and `pnpm run build` both succeeded; no new lint issues.  
- **Adjustability:** Change behaviour by editing `config/scoring.config.json` only; no code change required for weight/threshold/rule tweaks.
