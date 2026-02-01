# Full Evaluation Process

**Purpose:** End-to-end description of how tenders are evaluated — from trigger to storage.  
**Requirement:** "نموذج بسيط قابل للتعديل" (simple adjustable model): score 0–100, brief reasons, config-driven logic.

---

## 1. High-level flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TRIGGERS                                                                      │
│ • Dashboard: "Run analysis" (single) / "Evaluate selected" / "Evaluate all"   │
│ • CLI: pnpm evaluate-tenders [path]                                          │
│ • Cron/CI: scrape → evaluate-tenders → POST /api/sync/evaluations             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DASHBOARD PATH (actions/evaluation.ts)                                        │
│ 1. Load tender(s) from DB                                                    │
│ 2. Set status = 'evaluating'                                                  │
│ 3. loadScoringConfig() → config/scoring.config.json                          │
│    ├── Config exists → RULE-BASED (primary)                                  │
│    │     • tenderRowToScraped(tender) → scoreTender(scraped, config)          │
│    │     • Upsert evaluations (score, recommendation, summary from reasons)    │
│    │     • model_used = 'rule-based'                                          │
│    └── Config missing → AI FALLBACK                                          │
│          • evaluateTender(tender) → LLM → breakdown → score → recommendation  │
│          • Upsert evaluations (breakdown, summary, strengths, risks, etc.)   │
│ 4. Set status = 'evaluated'; revalidate UI                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ OUTPUT                                                                        │
│ • evaluations table: tender_id, score, recommendation, summary, breakdown,   │
│   strengths, risks, action_items, model_used                                  │
│ • data/tenders.scored.json (CLI only): reference_no, title, score,            │
│   recommendation, reasons                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Oracle path:** `runOracleEvaluation(tenderId)` exists but is **disabled**; do not use in UI.

### 1.1 Dashboard tender scope (active only)

- **getTenders()** and **getTenderStats()** filter with `.is('award_amount_sar', null)` → only **active** (open) tenders appear in the dashboard.
- **Historical tenders** (award_amount_sar populated) do **not** appear as actionable items; they are used only for value-estimation calibration.
- **getHistoricalTenders()** (`lib/queries/tender.ts`) returns awarded tenders for calibration use (e.g. calibrate-values script); not exposed in the dashboard UI.

### 1.2 Scraper behavior

- Scraper stops as soon as **any** page returns 0 results (including page 1). No further pagination after an empty page.

---

## 2. Rule-based process (primary)

Used when **config/scoring.config.json** is present (dashboard and CLI).

### 2.1 Config (control panel)

**File:** `config/scoring.config.json`

| Section | Role |
|--------|------|
| **thresholds** | qualified ≥ 70, conditional ≥ 40 → recommendation labels |
| **weights** | budget_fit, timeline_fit, cost_of_entry, scope_clarity, risk_penalty (must sum to 1.0) |
| **rules** | Per-dimension parameters (ranges, penalties, caps) |

**Current default weights:** budget_fit 0.25, timeline_fit 0.25, cost_of_entry 0.2, scope_clarity 0.15, risk_penalty 0.15.

### 2.2 Dimensions and scoring (lib/evaluation/rules.ts)

For each tender, **scoreTender(tender, config)** computes five dimension scores (0–100 each), then:

**score** = Σ (dimension_score × weight) → clamped 0–100, rounded  
**recommendation** = qualified if score ≥ 70, conditional if score ≥ 40, else excluded  
**reasons** = short text list (e.g. "Missing deadline", "Estimated value in range", "25 days until deadline")

| Dimension | Logic (summary) | Config knobs |
|-----------|----------------|--------------|
| **risk_penalty** | Start 100; subtract for missing deadline, entity, reference_no | no_deadline_penalty, no_entity_penalty, no_reference_penalty |
| **budget_fit** | 0 if no estimated_value; 50 if has value; +50 if in [min_value_sar, max_value_sar] | has_value_score, in_range_bonus, min_value_sar, max_value_sar |
| **timeline_fit** | days until deadline × days_per_point, capped at max_days_cap; 0 if past | days_per_point, max_days_cap, min_score_if_past |
| **cost_of_entry** | Start 100; subtract penalties for booklet_price and initial_guarantee | booklet_free_score, booklet_max_penalty_sar, guarantee_* |
| **scope_clarity** | title_weight×100 if title, description_weight×100 if description (sum capped 100) | title_weight, description_weight |

### 2.3 Dashboard rule-based path (step-by-step)

1. **runEvaluationAction(tenderId)**  
   - getTenderById(tenderId)  
   - updateTender(id, { status: 'evaluating' })  
   - loadScoringConfig() → read `config/scoring.config.json`

2. **If config exists:**  
   - tenderRowToScraped(tender) → map DB row to ScrapedTender shape (reference_no, title, entity, deadline, estimated_value, booklet_price, initial_guarantee, description, tab_sections, source, scraped_at)  
   - scoreTender(scraped, config) → { reference_no, title, score, recommendation, reasons }

3. **Upsert to evaluations:**  
   - tender_id, score, recommendation  
   - summary = reasons.join('. ') or "Rule-based evaluation."  
   - strengths = null, risks = reasons (or null), missing_requirements = null, action_items = null  
   - breakdown = {}  
   - model_used = 'rule-based'

4. **updateTender(id, { status: 'evaluated' })**  
5. **revalidatePath** dashboard and tender detail

### 2.4 CLI rule-based path (scripts/evaluate-tenders.ts)

1. **Input:** Path to scraper output JSON, or latest file in `scraper-output/*.json`  
2. **Load:** tenders array from JSON; loadScoringConfig() or use default config  
3. **For each tender:** normalize to ScrapedTender (tab_sections required), then scoreTender(tender, config)  
4. **Output:** Write `data/tenders.scored.json` with { generated_at, source_file, config_used, tenders: ScoredTender[] }  
5. **Optional:** POST `data/tenders.scored.json` to `POST /api/sync/evaluations` to upsert into DB by reference_no

---

## 3. AI fallback process

Used when **config/scoring.config.json** is not available (e.g. config missing or unreadable).

### 3.1 Flow

1. **runEvaluationAction(tenderId)** loads tender, sets status to `evaluating`, calls **evaluateTender(tender)** (`lib/ai/evaluator.ts`).  
2. **evaluateTender:**  
   - buildEvaluationPrompt(tender) — Arabic prompt with title, entity, reference_no, estimated_value, deadline, description  
   - generateText(model, system: EVALUATOR_SYSTEM_PROMPT, prompt)  
   - Parse JSON from response; validate with aiEvaluationResponseSchema  
   - **Override** score = weighted average of breakdown (0.2 per dimension); recommendation = getRecommendationFromScore(score)  
3. **Upsert evaluations:** score, recommendation, summary, strengths, risks, missing_requirements, action_items, breakdown, model_used (e.g. deepseek-chat).  
4. Set tender status to `evaluated`; revalidate.

### 3.2 AI dimensions and thresholds

- **Breakdown (0–100 each):** budget_fit, technical_fit, timeline_fit, strategic_fit, risk_score (weights 0.2 each).  
- **Score** = weighted average of breakdown, rounded.  
- **Recommendation:** qualified ≥ 70, conditional 40–69, excluded &lt; 40 (same as rule-based).

---

## 4. Evaluation sync API (CLI → DB)

**Endpoint:** `POST /api/sync/evaluations`  
**Body:** JSON with array of scored items (e.g. from `data/tenders.scored.json`), each with at least reference_no, score, recommendation; optional summary, strengths, risks, etc.

**Process:**  
- Resolve tender_id from reference_no (lookup tenders table).  
- Upsert into evaluations (score, recommendation, summary, strengths, risks, missing_requirements, action_items, breakdown when provided).  
- Used after `pnpm evaluate-tenders` to push rule-based results into the same evaluations table the dashboard reads.

---

## 5. Stored output (evaluations table)

| Column | Rule-based | AI fallback |
|--------|------------|-------------|
| tender_id | ✓ | ✓ |
| score | 0–100 from config weights | 0–100 from breakdown average |
| recommendation | qualified / conditional / excluded | same |
| summary | reasons joined | Arabic summary from LLM |
| strengths | null | from LLM |
| risks | reasons or null | from LLM |
| missing_requirements | null | from LLM |
| action_items | null | from LLM |
| breakdown | {} | five dimensions 0–100 |
| model_used | 'rule-based' | e.g. 'deepseek-chat' |

---

## 6. Quick reference

| What | Where |
|------|--------|
| **Config** | `config/scoring.config.json` (rules + value_estimation) |
| **Rule scoring** | `lib/evaluation/rules.ts` → scoreTender() |
| **Config loader** | `lib/evaluation/config-loader.ts` → loadScoringConfig() |
| **DB → scraped** | `lib/evaluation/db-adapter.ts` → tenderRowToScraped() |
| **Value estimation** | `lib/evaluation/value-estimator.ts` (missing estimated_value) |
| **Historical calibration** | `lib/evaluation/historical-calibrator.ts`; CLI: `pnpm calibrate-values` → `data/calibration-result.json` |
| **Dashboard action** | `actions/evaluation.ts` → runEvaluationAction, evaluateAllPendingAction, rerunEvaluationAction |
| **Dashboard tenders** | `lib/queries/tender.ts` → getTenders() (active only: award_amount_sar null); getHistoricalTenders() (calibration only) |
| **AI evaluator** | `lib/ai/evaluator.ts`, `lib/ai/prompts.ts` |
| **CLI** | `scripts/evaluate-tenders.ts`; `scripts/calibrate-values.ts`; sync: `scripts/sync-evaluations.ts` + `app/api/sync/evaluations/route.ts` |
| **Thresholds** | qualified ≥ 70, conditional ≥ 40, excluded &lt; 40 (types/evaluation.ts: getRecommendationFromScore, SCORE_THRESHOLDS) |
| **Oracle** | Disabled; `app/actions/oracle.ts` — do not use in UI |
| **Scraper** | Stops on first empty page (including page 1); `lib/scraper/etimad-browser.ts` |

---

## 7. Value Estimation (for missing estimated_value)

When `estimated_value` is not provided by Etimad, the system estimates it from available signals.

### 7.1 Tightened value ranges (current)

| Method | Old range | New range |
|--------|-----------|-----------|
| **Initial Guarantee** | ±20% | ±10% |
| **Booklet ≤5K SAR** | 100K–2M (20x) | 500K–3M (6x) |
| **Booklet 5K–50K SAR** | 2M–10M (5x) | 2M–12M (6x) |
| **Booklet >50K SAR** | 10M–50M (5x) | 40M–300M (7.5x) |
| **Fallback** | 500K–5M (10x) | 1M–3M (3x) |

### 7.2 Estimation methods (priority order)

| Method | Confidence | Description |
|--------|------------|-------------|
| **Initial Guarantee** | 95% | Divides guarantee by config % (e.g. 5%); range ±`initial_guarantee_spread` (0.1 = ±10%) |
| **Booklet Price Tiers** | 75% | Uses booklet price to select a tier from `value_estimation.booklet_tiers` |
| **Title/Entity Inference** | 55% | Multipliers from `title_keywords` and `entity_multipliers` (صيانة, أمن سيبراني, etc.) |
| **Fallback** | 35% | `fallback_estimate` range (e.g. 1–3M SAR) |

### 7.3 Config (scoring.config.json → value_estimation)

- **initial_guarantee_spread**: 0.1 (±10% range).
- **booklet_tiers**: Array of `{ max_sar, min_estimate, max_estimate }` (data-driven; see config comments).
- **title_keywords**, **entity_multipliers**: Optional multipliers for title/entity inference.
- **fallback_estimate**: { min, max } when no other signal available.
- **confidence_levels**: Per-method confidence (initial_guarantee 95, booklet 75, title 55, fallback 35).

### 7.4 Historical calibration

Tiers are refined using actual **award_amount_sar** from historical scrapes:

```bash
pnpm calibrate-values [scraper-output-files...]
```

- Reads scraper-output JSON files (or listed paths) with `award_amount_sar`.
- **lib/evaluation/historical-calibrator.ts**: Computes statistics (min, max, median, IQR, std dev) by booklet tier, title category, and entity type; uses IQR for outlier-resistant ranges.
- **scripts/calibrate-values.ts**: Runs calibration, outputs suggested config updates and writes **data/calibration-result.json**.

**Key files:**
- `lib/evaluation/value-estimator.ts` — Main estimation logic; uses config `value_estimation` and `initial_guarantee_spread`.
- `lib/evaluation/historical-calibrator.ts` — Statistical analysis from historical tenders with award_amount_sar.
- `scripts/calibrate-values.ts` — CLI: `pnpm calibrate-values`
- `data/calibration-result.json` — Calibration output (statistics and suggested tiers).

---

## 8. Summary

- **Primary:** Rule-based evaluation using `config/scoring.config.json` and `lib/evaluation/rules.ts` (five dimensions, weighted score, reasons).
- **Value estimation:** When `estimated_value` is missing, uses initial_guarantee (±10%), booklet_tiers (data-driven, ~6–7.5x), or fallback 1–3M SAR. Config in `value_estimation`; run `pnpm calibrate-values` to regenerate tiers from historical award_amount_sar.
- **Dashboard scope:** Only **active** tenders (award_amount_sar null) appear; historical tenders are used for calibration only (getHistoricalTenders), not shown as actionable.
- **Scraper:** Stops on first empty page (including page 1).
- **Dashboard:** "Run analysis" uses rule-based when config exists; otherwise AI fallback.
- **CLI:** `pnpm evaluate-tenders` → `data/tenders.scored.json`; `pnpm calibrate-values` → `data/calibration-result.json`; optional sync via `POST /api/sync/evaluations`.
- **Output:** Same `evaluations` table for both paths; UI shows score, recommendation, and (when present) summary/breakdown.
- **Oracle:** Not part of the standard process; disabled per product requirement.
