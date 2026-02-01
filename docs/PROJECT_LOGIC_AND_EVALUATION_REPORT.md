# Project Logic and Technical Report — Evaluation System

**Date:** 2026-02-01  
**Purpose:** Document the current evaluation system, its logic, and the design/specs it was built on.

---

## 1. Executive Summary

The Etmam app has **three evaluation paths**:

| Path | Trigger | Logic | Output | Where used |
|------|---------|--------|--------|------------|
| **Rule-based (primary)** | "Run analysis" when `config/scoring.config.json` exists | Deterministic: `lib/evaluation/rules.ts` + config (budget_fit, timeline_fit, cost_of_entry, scope_clarity, risk_penalty) | score 0–100, recommendation, reasons → summary | Dashboard tender detail + list; stored in `evaluations`; model_used = `rule-based` |
| **AI Evaluator (fallback)** | "Run analysis" when config missing | AI (LLM) 5-dimension breakdown → weighted average → score → recommendation | score 0–100, recommendation, breakdown, summary, strengths, risks, action_items | Same UI; used only when config not loaded |
| **Rule-based (CLI)** | `pnpm evaluate-tenders [file]` | Same rules + config | score, recommendation, reasons | Script writes `data/tenders.scored.json`; sync via `POST /api/sync/evaluations` |
| **Oracle (3-stage)** | `runOracleEvaluation(tenderId)` | 3-stage: Requirement Hallucination → Budget Triangulation → Fit Scoring | routing_decision, predicted_budget_*, oracle_metadata | **DISABLED** per requirement "نموذج بسيط قابل للتعديل"; do not use in UI |

The **primary evaluation experience** is **Rule-based** (config-driven, no hallucination). AI is fallback when config is unavailable.

---

## 2. Current Evaluation System (What Exists Today)

### 2.1 AI Evaluator (Dashboard “Run analysis”)

**Location:** `lib/ai/evaluator.ts`, `lib/ai/prompts.ts`, `actions/evaluation.ts`

**Flow:**
1. User clicks “Run analysis” on tender detail, or “Evaluate selected” / “Evaluate all pending” on the list.
2. Server action loads tender, sets status to `evaluating`, calls `evaluateTender(tender)` from `lib/ai`.
3. `evaluateTender`:
   - Builds Arabic prompt with tender fields (title, entity, reference_no, estimated_value, deadline, description).
   - Sends to LLM (DeepSeek or OpenAI via Vercel AI SDK `generateText`) with system prompt that enforces: compute **breakdown first** (five integers 0–100), then **score = average of breakdown**, then **recommendation from score** (qualified ≥70, conditional 40–69, excluded &lt;40).
   - Parses JSON from response, validates with `aiEvaluationResponseSchema` (Zod).
   - **Overrides** score and recommendation: recomputes score as weighted average of `breakdown` (weights 0.2 each) and recommendation via `getRecommendationFromScore(score)` so stored values always match the breakdown.
4. Action saves to `evaluations` (upsert) and sets tender status to `evaluated`; revalidates dashboard/detail.

**Breakdown dimensions (AI):**
- `budget_fit` — financial fit (0–100)
- `technical_fit` — technical alignment (0–100)
- `timeline_fit` — deadline reasonableness (0–100)
- `strategic_fit` — entity/sector importance (0–100)
- `risk_score` — lower risk = higher score (0–100)

**Weights:** 0.2 each (simple average). Defined in `lib/ai/prompts.ts` as `BREAKDOWN_WEIGHTS`.

**Recommendation rules (same in code and prompt):**
- **qualified:** score ≥ 70  
- **conditional:** 40 ≤ score &lt; 70  
- **excluded:** score &lt; 40  

**Schema:** `types/evaluation.ts` — `aiEvaluationResponseSchema`, `scoreBreakdownSchema`, `getRecommendationFromScore`, `SCORE_THRESHOLDS`.

**UI:** Tender detail shows a **Score Card** (large score, recommendation badge, breakdown row). List shows score and recommendation per row. Run / Re-run and bulk actions call the same AI evaluator.

---

### 2.2 Rule-based evaluator (CLI pipeline)

**Location:** `lib/evaluation/rules.ts`, `scripts/evaluate-tenders.ts`, `config/scoring.config.json`

**Flow:**
1. `pnpm evaluate-tenders [path]` (or no path → latest `scraper-output/*.json`).
2. Loads scraped tenders, optionally loads `config/scoring.config.json` (same shape as `ScoringConfig` in rules).
3. For each tender, calls `scoreTender(tender, config)` — **pure function**, no AI.
4. Writes `data/tenders.scored.json` with `reference_no`, `title`, `score`, `recommendation`, `reasons`.

**Dimensions (rule-based, different from AI):**
- **budget_fit** — has estimated_value + in range [min_value_sar, max_value_sar]; weights from config (e.g. 0.25).
- **timeline_fit** — days until deadline; rules: days_per_point, max_days_cap, min_score_if_past (e.g. 0 if past).
- **cost_of_entry** — booklet_price and initial_guarantee; penalties from config.
- **scope_clarity** — has title + description; title_weight, description_weight.
- **risk_penalty** — starts at 100; subtract for missing deadline, entity, reference_no.

**Config:** `config/scoring.config.json` — thresholds (qualified 70, conditional 40), weights (sum 1.0), and rule parameters (ranges, penalties, caps).  
**Recommendation:** Same thresholds: qualified ≥70, conditional ≥40, excluded &lt;40.

**Sync to DB:** `scripts/sync-evaluations.ts` POSTs `data/tenders.scored.json` (or given file) to `POST /api/sync/evaluations`. API looks up `tender_id` by `reference_no`, upserts into `evaluations` (score, recommendation, summary, strengths, risks, etc. when provided). So rule-based scores can be written into the same `evaluations` table the dashboard reads.

**Design reference:** Step 3A in project docs; verified in `docs/EVALUATION_VERIFICATION_REPORT.md` (logic correct; data quality issues noted for scraper deadline/value).

---

### 2.3 Oracle (3-stage Chain-of-Thought)

**Location:** `lib/ai/prompts.ts` (`SYSTEM_PROMPT_ORACLE`, `buildOraclePrompt`), `lib/ai/schemas.ts`, `app/actions/oracle.ts`

**Flow:**
1. Invoked by server action `runOracleEvaluation(tenderId)` (not currently the default “Run analysis” button).
2. 3-stage prompt:  
   - **Stage 1 — Requirement Hallucination:** Infer technical requirements from title/entity.  
   - **Stage 2 — Budget Triangulation:** Estimate budget (initial guarantee, booklet price heuristics, entity multiplier).  
   - **Stage 3 — Fit Scoring:** Route to INFRATECH, EXOTECH, JOINT, or NO_BID; P_win 0–100%.
3. Output: `routing_decision`, `predicted_budget_min/max`, `oracle_metadata`, etc. Stored in `evaluations` (oracle_metadata, routing_decision, predicted_budget_*).

**Design reference:** Comments in `lib/ai/prompts.ts` cite “Etmam Prediction Engine- Phased Implementation Plan” (Architect design); English prompts, Chain-of-Thought pattern.

---

## 3. What the Current System Was Built On

### 3.1 Product / MVP requirements

- **docs/dashboard/DATA_SOURCES.md**  
  - Evaluate each tender with an **editable model**: score 0–100 with short reasons.  
  - CRM record includes entity, title, tender number, deadline, estimated value, **score**, **recommendation**.  
  - Simple screen with tenders and evaluation results.

- **docs/dashboard/DATA_SOURCES.md (EvaluationUI)**  
  - When present: score (0–100), recommendation (qualified | conditional | excluded).  
  - Optional: reasons, summary, strengths, risks, missingRequirements, actionItems, **breakdown**.

- **docs/DASHBOARD_UI_SPEC.md**  
  - Scoring thresholds for **labels/badges only** (no logic in UI): qualified ≥70, conditional 40–69, excluded &lt;40.  
  - List/detail: show score and recommendation when evaluation exists.

So: **score 0–100**, **recommendation (qualified/conditional/excluded)**, and optional **breakdown** and narrative fields are all from these specs.

### 3.2 Data contract and pipeline

- **docs/DATA_CONTRACT.md**  
  - Defines scraper → sync API → DB; no evaluation contract there.  
  - Evaluations live in `evaluations` table; sync API for evaluations is separate (`POST /api/sync/evaluations`).

- **docs/implementation.md**  
  - Phase 2: Evaluation Sync API — POST scored tenders, upsert by tender_id (lookup by reference_no in sync script).  
  - Confirms evaluations are stored in DB and consumed by dashboard.

### 3.3 Rule-based engine (Step 3A)

- **docs/EVALUATION_VERIFICATION_REPORT.md**  
  - Describes **rule-based** engine: `lib/evaluation/rules.ts`, `config/scoring.config.json`, weights sum 1.0, thresholds 70/40.  
  - Dimensions: budget_fit, timeline_fit, cost_of_entry, scope_clarity, risk_penalty.  
  - Verification: logic correct; issues called out are scraper data (deadline, estimated_value) and guarantee penalty interpretation.

So the **rule-based** evaluator was built to match this config and verification report; it is **deterministic**, no AI.

### 3.4 AI evaluator (dashboard)

- The **AI** evaluator was added so users could “Run analysis” from the UI without running CLI scripts.  
- **Design choices** (implemented in code and prompts):  
  - Reuse same **recommendation thresholds** (70 / 40) and **score 0–100** as in specs and rule-based engine.  
  - Use a **breakdown** of five dimensions (aligned with “breakdown” in DATA_SOURCES and types): budget_fit, technical_fit, timeline_fit, strategic_fit, risk_score.  
  - **Enforce consistency:** prompt asks for breakdown first, then score = average, then recommendation from score; **code** then overwrites score and recommendation from the returned breakdown so the stored result is always consistent with the stated logic.  
- **Prompt language:** Arabic for tender context and narrative outputs (summary, strengths, risks, etc.); structured output (JSON) and rules described in Arabic in the prompt.  
- No separate “Architect” doc was used for this AI path; the Oracle 3-stage design in prompts cites the Architect plan.

### 3.5 Oracle (3-stage)

- **lib/ai/prompts.ts** comments: based on “Etmam Prediction Engine- Phased Implementation Plan” (Architect).  
- Implements 3 stages: Requirement Hallucination, Budget Triangulation, Fit Scoring; output includes routing_decision and budget range.  
- This path is **separate** from the main dashboard “Run analysis” flow; it can be invoked via `runOracleEvaluation` and writes into the same `evaluations` row (oracle fields).

---

## 4. Technical Summary

| Aspect | AI Evaluator (Dashboard) | Rule-based (CLI) | Oracle |
|--------|---------------------------|------------------|--------|
| **Input** | Tender row from DB | Scraped tender (JSON) | Tender row from DB |
| **Logic** | LLM + enforced breakdown → score → recommendation | Config-driven weighted sum (pure function) | 3-stage LLM (scope → budget → routing) |
| **Score** | 0–100 (from breakdown average) | 0–100 (from weights) | N/A (routing + budget range) |
| **Recommendation** | qualified / conditional / excluded | Same | N/A (INFRATECH/EXOTECH/JOINT/NO_BID) |
| **Breakdown** | budget_fit, technical_fit, timeline_fit, strategic_fit, risk_score (0.2 each) | budget_fit, timeline_fit, cost_of_entry, scope_clarity, risk_penalty (config weights) | In oracle_metadata |
| **Config** | Hardcoded in prompts (BREAKDOWN_WEIGHTS, thresholds in prompt + types/evaluation.ts) | config/scoring.config.json | In prompts |
| **Output storage** | evaluations (score, recommendation, summary, strengths, risks, action_items, breakdown, model_used) | data/tenders.scored.json → optional sync → evaluations | evaluations (oracle_metadata, routing_decision, predicted_budget_*) |
| **Trigger** | Dashboard: Run analysis, Evaluate selected, Evaluate all pending | CLI: pnpm evaluate-tenders | Server action runOracleEvaluation (not default UI) |

---

## 5. Files Reference

| Role | Files |
|------|--------|
| AI evaluation logic | `lib/ai/evaluator.ts`, `lib/ai/prompts.ts` (buildEvaluationPrompt, EVALUATOR_SYSTEM_PROMPT, BREAKDOWN_WEIGHTS) |
| AI client/config | `lib/ai/client.ts` (getAIModel, isAIConfigured) |
| Schemas | `types/evaluation.ts` (aiEvaluationResponseSchema, scoreBreakdownSchema, getRecommendationFromScore, SCORE_THRESHOLDS) |
| Server actions | `actions/evaluation.ts` (runEvaluationAction, evaluateAllPendingAction, rerunEvaluationAction) |
| Rule-based logic | `lib/evaluation/rules.ts`, `lib/evaluation/index.ts` |
| Rule-based config | `config/scoring.config.json` |
| Rule-based CLI | `scripts/evaluate-tenders.ts` |
| Evaluation sync API | `app/api/sync/evaluations/route.ts`, `scripts/sync-evaluations.ts` |
| Oracle | `lib/ai/prompts.ts` (SYSTEM_PROMPT_ORACLE, buildOraclePrompt), `lib/ai/schemas.ts`, `app/actions/oracle.ts` |
| DB layer | `lib/queries/evaluation.ts` (getEvaluationByTenderId, upsertEvaluation, getPendingTenders) |
| UI | `app/[locale]/dashboard/[tenderId]/page.tsx` (Score Card, RunAnalysisButton), `components/dashboard/run-analysis-button.tsx`, `components/dashboard/tenders-list-client.tsx` (Evaluate selected / all pending) |
| Specs/docs | `docs/dashboard/DATA_SOURCES.md`, `docs/DASHBOARD_UI_SPEC.md`, `docs/EVALUATION_VERIFICATION_REPORT.md`, `docs/implementation.md`, `docs/DATA_CONTRACT.md` |

---

## 6. Conclusion

- **Current evaluation system:** The app exposes **one main evaluation path** in the UI — **Rule-based first** (config-driven, `config/scoring.config.json`). When config is present, "Run analysis" uses `lib/evaluation/rules.ts` (deterministic, no AI). When config is missing, it falls back to the **AI Evaluator** (five-dimension breakdown). The **Oracle** 3-stage path is **disabled** per requirement "نموذج بسيط قابل للتعديل" (simple adjustable model); do not wire `runOracleEvaluation` in UI.
- **What it was built on:** MVP/specs (score 0–100, recommendation, optional breakdown), DATA_SOURCES/DASHBOARD_UI_SPEC (thresholds and UI contract), EVALUATION_VERIFICATION_REPORT (rule-based engine and config), and implementation plan (evaluation sync API). Rule-based is the primary path; AI is fallback. A strict config-executor prompt (`buildStrictEvalPrompt`) exists in `lib/ai/prompts.ts` for optional "AI as config executor" use.
