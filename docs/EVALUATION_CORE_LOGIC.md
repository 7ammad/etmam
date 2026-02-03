# Evaluation Core Logic

Single reference for how evaluation runs and how the final score is produced.

---

## 0. Current pipeline (MVP) — start to finish

**What runs today:** One deterministic path. No config check; no AI branch.

| Step | What happens |
|------|----------------|
| **1. Trigger** | Dashboard "Run analysis" or "Evaluate all" → `runEvaluationAction(tenderId)` (or loop over pending). |
| **2. Load** | Get tender by ID; set `status = 'evaluating'`. |
| **3. Estimation (EV)** | `getEffectiveEstimatedValueSar(tender)` in `lib/evaluation/effective-value.ts`: |
| | 1) **award_amount_sar** > 0 → EV = that (source: `award`); min = max = EV. |
| | 2) **estimated_value** > 0 → EV = that (source: `etimad`); min = max = EV. |
| | 3) **Title similarity** → `estimateEvFromTitleSimilarity(title)` in `lib/evaluation/title-similarity-ev.ts`: load historical awarded tenders JSON, tokenize title, BM25-like match, EV = median(award_amount_sar) of top K matches; min/max from p25/p75 or tightened spread (0.8×–1.2× if sample &lt; 8). Source: `title_similarity`. |
| | 4) **Fallback** → EV = 1,500,000 SAR; min/max = 0.8×–1.2× EV. Source: `fallback`. |
| **4. Shape** | `tenderRowToScraped(tender)` → `ScrapedTender` (for scoring). |
| **5. Scoring** | `scoreTenderMVP(scraped, effectiveEv.evSar)` in `lib/evaluation/rules.ts`: five factors (each 0–100), fixed weights: |
| | **Value Fit (40%)**: EV &gt; 0 → 50; if EV in [10k, 50M] SAR add 50. |
| | **Scope Fit (25%)**: `calculateCompanyFit(title, description)` (core/adjacent/avoid). |
| | **Time Fit (15%)**: days until deadline: &lt;0→0, &lt;7→25, &lt;14→50, &lt;30→75, else 100; missing→30. |
| | **Clarity (10%)**: title present 50 + description present 50. |
| | **Risk (10%)**: start 100; −40 no deadline, −20 no entity, −30 no reference_no, −20 if &lt;7 days. |
| | **Score** = round(clamp(0, 100, weighted sum)). **Recommendation**: INVEST (≥70), REVIEW (40–69), SKIP (&lt;40). |
| **6. Persist** | Summary = top 3 reasons joined; breakdown → DB shape; `oracle_metadata` = { estimated_value_sar, ev_method, ev_confidence, matched_examples_count }; `upsertEvaluation(..., predicted_budget_min/max, oracle_metadata)`; `model_used = 'mvp-deterministic'`. |
| **7. Done** | Set `status = 'evaluated'`; revalidate paths; return score and recommendation. |

**Historical data for title similarity:** `lib/evaluation/title-similarity-ev.ts` reads `scraper-output/run-historical-*.json` (or `HISTORICAL_TENDERS_JSON` env). Currency in file is normalized to SAR when loading.

---

## 1. Entry point (code reference)

**Dashboard:** `actions/evaluation.ts` → `runEvaluationAction(tenderId)` — **MVP only** (no config, no AI).

- Load tender, set status = 'evaluating'
- EV = getEffectiveEstimatedValueSar(tender)
- scraped = tenderRowToScraped(tender)
- scored = scoreTenderMVP(scraped, effectiveEv.evSar)
- upsertEvaluation(score, recommendation, summary, predicted_budget_min/max, oracle_metadata)
- status = 'evaluated'

**CLI:** `pnpm evaluate-tenders [path]` uses rule-based + config (writes `data/tenders.scored.json`); not the same path as dashboard MVP.

---

## 2. Score scale and recommendation

| Item | Value |
|------|--------|
| **Score range** | 0–100 |
| **qualified** | score ≥ 70 |
| **conditional** | 40 ≤ score < 70 |
| **excluded** | score < 40 |

**Code:** `types/evaluation.ts` → `getRecommendationFromScore(score)`, `SCORE_THRESHOLDS`.

---

## 3. Rule-based core (V2 — what the dashboard uses)

**Function:** `lib/evaluation/rules.ts` → `scoreTenderV2(tender, config)`  
**Input:** `ScrapedTender` (from `tenderRowToScraped(tender)`), `ScoringConfig` (from `config/scoring.config.json`).

### 3.1 Value used for budget

- If `tender.estimated_value` is present and > 0 → use it.
- Else → `estimateValueV2(tender, config)` (`lib/evaluation/value-estimator.ts`); use `valueEstimate.midpoint` as effective value. Result also gives `min`, `max`, `method`, `confidence` (stored as `predicted_budget_min/max`, `budget_estimation_method`, `budget_estimation_confidence`).

### 3.2 Value estimation order (V2)

1. **Direct purchase cap** — If tender type has a legal max (e.g. 500K SAR), use it. Confidence 95%.
2. **Initial guarantee** — If `initial_guarantee` (SAR) > 0: `midpoint = guarantee / (initial_guarantee_pct/100)`, range ± spread. Confidence 95%.
3. **Historical calibration** — By service type + entity + duration from classifier; use calibrated range. Confidence from calibration.
4. **Fallback to V1** — Booklet tier → title/entity multipliers → fallback_estimate. Confidence 35–75%.

Config: `config/scoring.config.json` → `value_estimation` (and defaults in `value-estimator.ts`).

### 3.3 Historical data — current status

**Used at runtime:** `lib/evaluation/classifier.ts` has hardcoded `HISTORICAL_CALIBRATION` (per service type: count, median, p25, p75, min, max) and `ENTITY_CALIBRATION` (per entity category: multiplier). `getHistoricalCalibration(serviceType)` and `getEntityCalibration(entityCategory)` return these. When value is missing and neither direct_purchase_cap nor initial_guarantee applies, `estimateValueV2` uses them: base range = `historicalData.p25`–`p75`, median = `historicalData.median`; then duration and entity multipliers; confidence from `historicalData.count` (e.g. ≥20 → 90%, &lt;5 → 70%). So historical data **is** used, but only from **in-code constants** in classifier.

**Not used at runtime:** `lib/evaluation/historical-calibrator.ts` → `calibrateFromHistorical(tenders)`; `scripts/calibrate-values.ts` writes `calibration-result.json`. That file is never read by the evaluator. Config has `historical_calibration_path`; no code loads it. `getHistoricalTenders()` (DB) is used by scripts only, not by the evaluation path.

### 3.4 Six dimensions (each 0–100), then weighted sum

| Dimension | Weight (default) | How it's computed (0–100) |
|-----------|------------------|----------------------------|
| **service_fit** | 0.25 | Company capability match: `calculateCompanyFit(title, description)` → core/adjacent/avoid; score from classifier. |
| **budget_fit** | 0.20 | effectiveValue > 0: base 50; if in [min_value_sar, max_value_sar] add 50. If value is *estimated*, multiply base and range bonus by (confidence/100). Else 0. |
| **timeline_fit** | 0.20 | daysUntilDeadline(deadline): &lt;0 → 0; &lt;7 → 20; &lt;14 → 50; &lt;30 → 75; else 100. Missing → 30. |
| **complexity_fit** | 0.15 | From classification: low 70, medium 100, high 80, very_high 50. |
| **strategic_fit** | 0.10 | Entity category: authority/royal 80, ministry 70, municipality 60, healthcare/education 55, else 50. |
| **risk_score** | 0.10 | Start 100; subtract for missing deadline (40), missing entity (20), missing reference_no (30), low value confidence &lt;60 (15), very short timeline &lt;7 days (20). Floor 0. |

Rule config (ranges, thresholds): `config.rules` (e.g. `budget_fit.min_value_sar`, `max_value_sar`). Weights: `config.weights_v2` or `DEFAULT_WEIGHTS_V2` in `rules.ts`.

### 3.5 Final score (V2)

```
score = round(clamp(0, 100,
  service_fit × w.service_fit +
  budget_fit   × w.budget_fit +
  timeline_fit × w.timeline_fit +
  complexity_fit × w.complexity_fit +
  strategic_fit × w.strategic_fit +
  risk_score   × w.risk_score
))
recommendation = getRecommendationFromScore(score)
```

---

## 4. AI fallback core (no config)

**Function:** `lib/ai/evaluator.ts` → `evaluateTender(tender)`  
**Prompt:** `lib/ai/prompts.ts` → `buildEvaluationPrompt(tender)`, `EVALUATOR_SYSTEM_PROMPT`.

- Model receives: title, entity, reference_no, **estimated_value** (or "غير محدد"), deadline, description.
- Model returns JSON: `breakdown` (budget_fit, technical_fit, timeline_fit, strategic_fit, risk_score, each 0–100), `score`, `recommendation`, `summary`, `strengths`, `risks`, `missing_requirements`, `action_items`.
- Score is **overridden** in code: `score = round(clamp(0, 100, weighted sum of breakdown))` with weights 0.2 each (`BREAKDOWN_WEIGHTS` in `prompts.ts`). Recommendation = `getRecommendationFromScore(score)`.
- No value estimation is run; no `predicted_budget_min/max` are stored.

---

## 5. Where it lives

| What | File |
|------|------|
| Entry, which path runs | `actions/evaluation.ts` (`runEvaluationAction`, `loadScoringConfig`) |
| Rule-based scoring (V2) | `lib/evaluation/rules.ts` (`scoreTenderV2`) |
| Value estimation (V1 & V2) | `lib/evaluation/value-estimator.ts` (`estimateValue`, `estimateValueV2`, `needsValueEstimation`) |
| Classification / service fit | `lib/evaluation/classifier.ts` (`classifyTender`, `calculateCompanyFit`; hardcoded `HISTORICAL_CALIBRATION`, `ENTITY_CALIBRATION`) |
| Historical calibrator (scripts only) | `lib/evaluation/historical-calibrator.ts` (`calibrateFromHistorical`); not loaded at evaluation runtime |
| DB row → scraped shape | `lib/evaluation/db-adapter.ts` (`tenderRowToScraped`) |
| Config load | `lib/evaluation/index.ts` / config-loader |
| Score thresholds & recommendation | `types/evaluation.ts` (`getRecommendationFromScore`, `SCORE_THRESHOLDS`) |
| AI evaluation | `lib/ai/evaluator.ts`, `lib/ai/prompts.ts` |

---

## 6. One-line summary

**Rule-based (V2):** Classify tender → estimate value if missing → score 6 dimensions (service_fit, budget_fit, timeline_fit, complexity_fit, strategic_fit, risk_score) → weighted sum → round to 0–100 → recommendation from thresholds. **AI:** Same thresholds; model returns breakdown and summary; score recomputed from breakdown in code.
