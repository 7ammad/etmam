# Actual Evaluation Document and Logic (Current)

**Purpose:** Single source of truth for the evaluation logic and scoring we use **right now**.  
**Why tenders often score low:** Most tenders lack `estimated_value`; budget_fit has 25% weight and is heavily penalized when value is missing or estimated with low confidence.

---

## 1. Score scale and thresholds

| Item | Value |
|------|--------|
| **Score range** | **0–100** (not 50). Display and logic use 0–100 everywhere. |
| **qualified** | score ≥ **70** |
| **conditional** | **40** ≤ score < 70 |
| **excluded** | score < **40** |

**Code:** `types/evaluation.ts` — `SCORE_THRESHOLDS`, `getRecommendationFromScore(score)`.

---

## 2. Which evaluation runs

- **Dashboard “Run analysis”** and **“Evaluate all”**:  
  - If **`config/scoring.config.json` exists** → **rule-based** evaluation (primary).  
  - If config is missing → **AI** evaluation (fallback).  
- **CLI:** `pnpm evaluate-tenders [path]` → always **rule-based** (uses same config).  
- **Oracle:** Disabled; not used in UI.

**Code:** `actions/evaluation.ts` → `runEvaluationAction()`: `loadScoringConfig()` then either `scoreTender(scraped, config)` or `evaluateTender(tender)`.

---

## 3. Rule-based evaluation (primary path)

Used when `config/scoring.config.json` is present (dashboard and CLI).

### 3.1 Config file

**Path:** `config/scoring.config.json`

- **thresholds:** `qualified: 70`, `conditional: 40`
- **weights:** Must sum to 1.0  
  - budget_fit **0.25**  
  - timeline_fit **0.25**  
  - cost_of_entry **0.2**  
  - scope_clarity **0.15**  
  - risk_penalty **0.15**
- **rules:** Per-dimension parameters (see below).
- **value_estimation:** Used when `estimated_value` is missing (booklet tiers, initial guarantee %, title/entity inference, fallback).

### 3.2 Final score formula

```
score = round(clamp(0, 100,
  budget_fit × 0.25 +
  timeline_fit × 0.25 +
  cost_of_entry × 0.2 +
  scope_clarity × 0.15 +
  risk_penalty × 0.15
))
```

Each dimension is scored **0–100** first, then weighted and summed.

### 3.3 Dimension logic (exact)

**Code:** `lib/evaluation/rules.ts` → `scoreTender(tender, config)`.

| Dimension | Weight | How it’s computed (0–100) |
|-----------|--------|---------------------------|
| **risk_penalty** | 0.15 | Start at 100. Subtract: no deadline 100, no entity 30, no reference_no 50. Floor at 0. |
| **budget_fit** | 0.25 | If no value (and estimation fails or gives 0): 0. If has value (real or estimated): 50 base; if value in [min_value_sar, max_value_sar] (config: 10K–50M SAR) add 50. For **estimated** values, both base and range bonus are multiplied by (confidence / 100). |
| **timeline_fit** | 0.25 | `days = daysUntilDeadline(deadline)`. If invalid/missing: 0. If past: min_score_if_past (0). Else: min(100, days × days_per_point), with days capped at max_days_cap (60). Config: days_per_point=2 → max 60×2=120 → capped to 100. |
| **cost_of_entry** | 0.2 | Start 100. Subtract: booklet penalty = min(100, (booklet_price / booklet_max_penalty_sar) × 100) (config: booklet_max_penalty_sar=100000). Subtract: guarantee penalty = min(100, (guarantee / guarantee_max_penalty_pct) × 100) (config: guarantee_max_penalty_pct=10 — **interpreted as %**, e.g. 10 = 10%). Floor at 0. |
| **scope_clarity** | 0.15 | title present → +40% of 100; description present → +60% of 100. Max 100. |

**Important:** `initial_guarantee` in the **scraper/DB adapter** is mapped from `initial_guarantee_sar` (amount in SAR). In **value_estimation**, that amount is used as “guarantee amount” and divided by config % to get estimated budget. In **cost_of_entry**, the rule comment says “guarantee is a percentage” — if your data stores guarantee as **SAR amount**, the cost_of_entry penalty can be huge (e.g. 500000/10*100). Worth verifying your schema: percentage vs amount.

### 3.4 Value estimation (when estimated_value is missing)

**Code:** `lib/evaluation/value-estimator.ts` — `estimateValue(tender, config)`.

Order of use:

1. **Initial guarantee** (if `initial_guarantee` > 0): midpoint = guarantee / (initial_guarantee_pct/100), range ± initial_guarantee_spread. Confidence 95%.
2. **Booklet price:** Match tier from `value_estimation.booklet_tiers`; apply entity/title multipliers. Confidence 75%.
3. **Title/entity inference:** Use title_keywords and entity_multipliers on fallback_estimate range. Confidence 55%.
4. **Fallback:** Use `fallback_estimate` (e.g. 1M–3M SAR). Confidence 35%.

Estimated value is then used in **budget_fit** with a confidence penalty: base and range bonus are scaled by (confidence / 100), so low-confidence estimates (e.g. fallback 35%) heavily reduce budget_fit.

### 3.5 Why rule-based scores are often low

- **budget_fit (25%):** Many tenders have no `estimated_value`. Value estimation either fails (budget_fit = 0) or gives low confidence → small budget_fit contribution.
- **timeline_fit (25%):** Short time to deadline (e.g. 1–14 days) → low points (2 pts/day, cap 60 days).
- **risk_penalty (15%):** Missing deadline/entity/reference pulls down the score.
- **cost_of_entry (20%)** and **scope_clarity (15%)** help only when booklet/guarantee are low and title/description present.

So it’s expected that **no** tender is “fit” (qualified) if most have no value, short deadlines, and/or missing fields — unless timeline is long and other dimensions are good (e.g. one tender in data scored 75 due to “26995 days” and low cost of entry).

---

## 4. AI evaluation (fallback path)

Used only when `config/scoring.config.json` is **not** available.

**Code:** `lib/ai/evaluator.ts` → `evaluateTender(tender)`, `lib/ai/prompts.ts` → `buildEvaluationPrompt`, `EVALUATOR_SYSTEM_PROMPT`.

- **Breakdown (0–100 each):** budget_fit, technical_fit, timeline_fit, strategic_fit, risk_score.
- **Weights:** 0.2 each (in `lib/ai/prompts.ts` — `BREAKDOWN_WEIGHTS`).
- **Score:** Overridden in code:  
  `score = round(clamp(0, 100, weighted sum of breakdown))`  
  Recommendation: `getRecommendationFromScore(score)` (same thresholds: 70 / 40).
- **Output:** summary, strengths, risks, missing_requirements, action_items (Arabic).

---

## 5. Files reference

| What | File |
|------|------|
| Thresholds & recommendation | `types/evaluation.ts` (SCORE_THRESHOLDS, getRecommendationFromScore) |
| Rule-based scoring | `lib/evaluation/rules.ts` (scoreTender) |
| Value estimation | `lib/evaluation/value-estimator.ts` (estimateValue, needsValueEstimation) |
| Config load | `lib/evaluation/config-loader.ts` (loadScoringConfig) |
| DB → scraped shape | `lib/evaluation/db-adapter.ts` (tenderRowToScraped) |
| Config content | `config/scoring.config.json` |
| Dashboard action | `actions/evaluation.ts` (runEvaluationAction) |
| AI evaluator | `lib/ai/evaluator.ts`, `lib/ai/prompts.ts` |
| Full process doc | `docs/FULL_EVALUATION_PROCESS.md` |

---

## 6. Summary

- **Score is 0–100.** Qualified ≥ 70, conditional ≥ 40, excluded < 40.
- **Primary logic is rule-based** from `config/scoring.config.json` and `lib/evaluation/rules.ts`.
- **Low scores are largely from:** missing or low-confidence `estimated_value` (budget_fit 25%), short deadlines (timeline_fit 25%), and missing risk fields (risk_penalty 15%).
- To get more “fit” tenders you can: relax budget range or confidence penalty, add/improve value estimation, or adjust weights/thresholds in config — all in the same config and rule code above.
