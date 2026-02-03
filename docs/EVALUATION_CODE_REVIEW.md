# Evaluation System & Prompting — Code Review

**Scope:** Evaluation logic, value estimation, prompting, and the inconsistency between "table estimation" and "AI summary estimation." Current status only.

---

## Summary

- **Root cause of "table vs summary" mismatch:** Two different sources of "estimation" with no single source of truth when the AI path is used; when the rule-based path is used, the summary never states the same value as the table.
- **Logic/code issues:** Guarantee treated as percentage in V1 rules while DB stores SAR amount; AI path never runs value estimation; rule-based summary omits the estimated value; possible midpoint rounding mismatch between stored min/max and value-estimator midpoint.
- **Historical data:** Used at runtime only as hardcoded stats in `lib/evaluation/classifier.ts`. Generated calibration (script output, DB historical tenders) is not loaded at runtime.

---

## 1. Table vs AI Summary — Why They Can Diverge

### 1.1 Data flow (rule-based path — primary when config exists)

| Place            | Value source |
|-----------------|--------------|
| **Table (value column)** | `getEffectiveValue(tender.estimated_value, ev.predicted_budget_min, ev.predicted_budget_max)` → rule-based `estimateValue` / `estimateValueV2` when `estimated_value` is missing |
| **Detail hero**         | Same as table (same `getEffectiveValue` on same inputs) |
| **Summary text**        | `generateScoreSummary(score, breakdown, recommendation)` in `actions/evaluation.ts` — **no SAR value**; only dimension labels and scores (e.g. "Budget Fit is strong (80). Timeline is a concern (40).") |

So when rule-based runs:

- Table and hero show the **same** number (DB `estimated_value` or rule-based `predicted_budget_min/max` midpoint).
- Summary **never mentions** that number. It only explains score via breakdown. So the summary does not "give another estimation" — it gives no estimation at all. User expectation that the summary should state the same value as the table is not met.

### 1.2 Data flow (AI fallback path — when config is missing)

| Place            | Value source |
|-----------------|--------------|
| **Table (value column)** | `getEffectiveValue(tender.estimated_value, ev.predicted_budget_min, ev.predicted_budget_max)`. AI path **does not** write `predicted_budget_min` / `predicted_budget_max` to the DB, so table shows only `tender.estimated_value` (or "—" if null). |
| **Summary text**        | AI free-form `summary` — model can **infer or state a value** in Arabic (e.g. "القيمة التقديرية حوالي ٣ ملايين ر.س"). That value is not from `value-estimator` and is not stored as a structured field. |

So when AI runs:

- Table = DB `estimated_value` only (often null → "—").
- Summary = free text that may contain a **different** or **only** estimation (e.g. "حوالي ٣ ملايين").
- **Two sources of "estimation":** table (DB + no rule-based prediction) vs summary (AI-inferred, uncoordinated).

### 1.3 Root cause (concise)

1. **Rule-based:** Summary is generated from breakdown only and never includes the estimated value, so it cannot "agree" with the table in text.
2. **AI path:** Value estimation is never run; `predicted_budget_*` are never stored; the model is only given `tender.estimated_value` (or "غير محدد") and may invent a value in the summary, so table and summary can show different numbers.

---

## 2. Historical data — current status

**Used at runtime:** `lib/evaluation/classifier.ts` exports hardcoded `HISTORICAL_CALIBRATION` and `ENTITY_CALIBRATION` (comment: "from 94 historical tenders"). Each service type has `count`, `median`, `p25`, `p75`, `min`, `max`; each entity category has `multiplier`. `getHistoricalCalibration(serviceType)` and `getEntityCalibration(entityCategory)` return these. `lib/evaluation/value-estimator.ts` → `estimateValueV2` uses them when value is missing and neither direct_purchase_cap nor initial_guarantee applies: base range = `historicalData.p25`–`historicalData.p75`, median = `historicalData.median`; then duration and entity multipliers are applied. Confidence is set from `historicalData.count` (e.g. ≥20 → 90%, &lt;5 → 70%). So historical data **is** used, but only from **in-code constants**, not from files or DB.

**Not used at runtime:** `lib/evaluation/historical-calibrator.ts` → `calibrateFromHistorical(tenders)` computes stats from tenders with `award_amount_sar`; `scripts/calibrate-values.ts` runs it and writes `calibration-result.json`. That file is never read by the evaluator or value-estimator. Config type has `historical_calibration_path`; no code path loads it. `lib/queries/tender.ts` → `getHistoricalTenders()` returns awarded tenders from DB for calibration; that query is used by scripts (e.g. calibrate pipeline), not by the dashboard evaluation path. So: generated calibration and DB historical tenders are **not** loaded when scoring a tender.

---

## 3. Code & Logic Issues

### 3.1 [blocking] V1 rules: `initial_guarantee` treated as percentage but DB provides SAR amount

**Where:** `lib/evaluation/rules.ts` (V1 `scoreTender`), cost_of_entry block. `guarantee` is used as `(guarantee / guarantee_max_penalty_pct) * 100` (percentage). `lib/evaluation/db-adapter.ts` maps `initial_guarantee_sar` → `initial_guarantee` (SAR amount).

**Current status:** Penalty becomes huge (e.g. 500000/10*100 → cap 100), cost_of_entry = 0 when V1 runs with non-zero guarantee. Dashboard uses V2 (no guarantee penalty there); CLI can use V1.

---

### 3.2 [important] AI path does not run value estimation

**Where:** `actions/evaluation.ts` — when config is missing, only `evaluateTender(tender)`; no value estimator; `upsertEvaluation` does not set `predicted_budget_min` / `predicted_budget_max`.

**Current status:** Table shows only `tender.estimated_value` (or "—"). AI summary can state a different value; two uncoordinated sources.

---

### 3.3 [important] Rule-based summary never states the estimated value

**Where:** `actions/evaluation.ts` — `generateScoreSummary(score, breakdown, recommendation)` uses only dimension names and scores.

**Current status:** Summary never mentions SAR; table and summary cannot align in text.

---

### 3.4 [nit] Midpoint: UI uses (min+max)/2, estimator has separate midpoint

**Where:** Stored `predicted_budget_min/max`; UI `getEffectiveValue` uses `(predictedMin + predictedMax) / 2`; value-estimator also returns `midpoint` (can differ by rounding).

**Current status:** Minor display difference; scoring uses estimator midpoint.

---

### 3.5 Prompting: AI gets only raw estimated_value (or "غير محدد"); no "do not invent value" instruction

**Where:** `lib/ai/prompts.ts` — `buildEvaluationPrompt`, `EVALUATOR_SYSTEM_PROMPT`.

**Current status:** Model can infer and state a contract value in the summary; not tied to rule-based estimate.

---

## 4. What to Change (prioritized)

| Priority   | Issue | Action |
|-----------|--------|--------|
| Blocking  | V1 cost_of_entry uses guarantee as % but DB gives SAR | Fix V1 to use amount (or percentage from DB) or retire V1; document. |
| Important | AI path skips value estimation | Run value estimator on AI path; store predicted_budget_*; pass effective value into prompt. |
| Important | Rule-based summary omits value | Include effective value (or range) in `generateScoreSummary` when available. |
| Nice-to-have | Midpoint vs (min+max)/2 | Store midpoint for display or document rounding difference. |
| Nice-to-have | AI invents value in summary | Add instruction: do not invent contract value; use only provided value/range. |

---

## 5. Files Touched (reference)

| File | Role |
|------|------|
| `actions/evaluation.ts` | Chooses rule-based vs AI; builds summary; writes predicted_budget_* only for rule-based. |
| `lib/evaluation/rules.ts` | V1 cost_of_entry guarantee-as-% bug; V2 budget_fit/value logic. |
| `lib/evaluation/value-estimator.ts` | Single source of rule-based value estimation (V1/V2). |
| `lib/evaluation/db-adapter.ts` | Maps `initial_guarantee_sar` → `initial_guarantee` (SAR). |
| `lib/ai/prompts.ts` | Builds AI prompt with `estimated_value` or "غير محدد"; no value-estimate input. |
| `lib/ai/evaluator.ts` | AI evaluation only; no value estimation. |
| `app/[locale]/dashboard/[tenderId]/page.tsx`, `components/dashboard/tenders-list-client.tsx` | `getEffectiveValue(estimated_value, predicted_budget_min, predicted_budget_max)` for table and detail. |
| `lib/evaluation/classifier.ts` | Hardcoded `HISTORICAL_CALIBRATION`, `ENTITY_CALIBRATION`; `getHistoricalCalibration`, `getEntityCalibration` used by value-estimator. |
| `lib/evaluation/historical-calibrator.ts` | `calibrateFromHistorical`; used by scripts only, not by evaluation at runtime. |

---

## 6. Verification after fixes

1. **Rule-based:** For a tender with no `estimated_value` but with `initial_guarantee_sar`, run evaluation; confirm table shows "~X SAR" and summary text includes the same (or compatible) value.
2. **AI path:** With config missing (or forced AI path), run value estimation, store predicted_budget_* and pass value into prompt; re-run and confirm table shows "~X SAR" and AI summary does not state a different value.
3. **V1 (if kept):** Call `scoreTender` with a scraped tender that has `initial_guarantee` = 500000 (SAR); confirm cost_of_entry is not 0 unless intended by design.
