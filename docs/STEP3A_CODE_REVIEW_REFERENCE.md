# Step 3A Code Review — Reference (Do Not Repeat)

**Purpose:** Keep this review for future implementation. Do not repeat the same mistakes.

**Context:** Step 3A = Evaluation engine + Excel export with quality gates (rule-based scoring, `data/tenders.scored.json`). Review was done by Claude Code; fixes were applied by Claude. This file is reference only.

---

## Lessons for Future Implementation

1. **Scraper data quality is upstream of evaluation.**  
   If the scraper sends wrong or missing data (e.g. `deadline` = `scraped_at`, `estimated_value` = null, missing `tab_sections`), scoring will be wrong no matter how good the rules are. **Verify scraper output shape and semantics before building evaluation on top.**

2. **Do not assume scraper output matches schema.**  
   Defensive normalization (e.g. default `tab_sections`) in the evaluation script is a workaround. Prefer fixing the scraper to emit schema-compliant data and documenting the contract (see `docs/DATA_CONTRACT.md`).

3. **Clarify config semantics and formulas.**  
   Names like `guarantee_max_penalty_pct` must match the formula. If the formula is `(guarantee / X) * 10`, don’t name X “max_penalty_pct” unless it really is a percentage. Add short comments in code and config so future changes don’t reintroduce bugs.

4. **Validate evaluation inputs at boundaries.**  
   When evaluation reads from `scraper-output/*.json`, ensure we know what “deadline” and “estimated_value” mean (actual tender deadline vs scraped_at; actual value vs null). Add a quick validation or review step so bad data is caught before scoring.

5. **Keep the review checklist in mind for similar features.**  
   Type-check, weights sum to 1.0, scores clamped 0–100, deterministic logic, null handling, **and** that upstream data (scraper) is correct before claiming “evaluation works.”

---

## Full Code Review: Step 3A Evaluation Engine

### Executive Summary

**Overall Assessment:** ⚠️ Needs Changes

The evaluation logic implementation is technically correct and well-structured, but there are critical data quality issues in the scraper output that make the scoring ineffective. Additionally, there's one potential bug in the guarantee penalty calculation.

**Key Findings:**

- ✅ Evaluation logic is deterministic and type-safe
- ✅ Weights sum correctly to 1.0
- ✅ Score normalization works (0-100 range)
- ❌ **Critical:** Scraper provides wrong deadline data (uses `scraped_at` timestamp)
- ❌ **Critical:** Scraper doesn't extract `estimated_value`
- ⚠️ **Potential Bug:** Guarantee penalty formula may be incorrect

---

### Issues by Severity

#### Critical (Must Fix - Scraper Data Quality)

**Issue 1: Incorrect Deadline Timestamps**

- **File:** Scraper output (not evaluation code)
- **Problem:** All deadlines are set to the scraping timestamp, not the actual tender deadline
- **Evidence:** `"deadline": "2026-01-27T11:56:58.804Z"` and `"scraped_at": "2026-01-27T11:56:58.804Z"` (same timestamp)
- **Impact:** All tenders incorrectly scored as "Deadline passed" with timeline_fit = 0
- **Fix Required:** Update scraper to extract actual deadline from tender page

**Issue 2: Missing Estimated Value**

- **File:** Scraper output
- **Problem:** All `estimated_value` fields are null
- **Impact:** All tenders get budget_fit = 0 (25% of total weight lost)
- **Fix Required:** Update scraper to extract `estimated_value` from tender details

#### High (Should Fix - Logic Bug)

**Issue 3: Guarantee Penalty Formula Unclear**

- **File:** `lib/evaluation/rules.ts` (around guarantee penalty)
- **Problem:** The formula `(guarantee / 10) * 10` simplifies to `guarantee`, which doesn't match config description
- **Current code (conceptually):** `const penalty = Math.min(100, (guarantee / r.cost_of_entry.guarantee_max_penalty_pct) * 10)` with `guarantee_max_penalty_pct: 10` → effectively penalty = guarantee
- **Expected behavior:** Config says `guarantee_max_penalty_pct: 10` which suggests "10% of tender value", but the formula treats it as an absolute divisor
- **Impact:** If guarantee is 1000 SAR, penalty can cap at 100 (entire cost score wiped out)
- **Recommendation:** Clarify whether penalty should be percentage-based on `estimated_value` or keep current behavior and rename config field (e.g. to `guarantee_divisor`). Add a brief comment in code and config.

#### Medium (Consider Fixing - Edge Cases)

**Issue 4: Timeline Calculation Could Be More Robust**

- **File:** `lib/evaluation/rules.ts`
- **Current:** Assumes deadline is ISO string
- **Enhancement:** Add validation or parsing for other date formats if scraper ever sends them
- **Priority:** Low while scraper only sends ISO dates

**Issue 5: Missing tab_sections Field**

- **File:** `scripts/evaluate-tenders.ts`
- **Current:** Script adds default `{ basic_info: {} }` when `tab_sections` is missing
- **Note:** Defensive measure; indicates scraper output doesn't match schema
- **Recommendation:** Update scraper to include `tab_sections` in output; then consider removing this workaround and validating against full schema

---

### Positive Feedback ✅

- **Pure function design:** `scoreTender()` is deterministic, no side effects; easy to test and reason about
- **Type safety:** Proper TypeScript interfaces; Zod validation in script; null handling for optional fields
- **Editable configuration:** Clean separation of config from logic; JSON config for tuning without code changes
- **Clear reasoning:** `reasons` array gives transparency and helps debugging and trust
- **Defensive programming:** Score clamping 0–100; null checks; default config fallback

---

### Verification Checklist (for similar work)

- [ ] TypeScript type check passed (`pnpm type-check`)
- [ ] Weights sum to 1.0
- [ ] Scores clamped 0–100 (Math.max/min)
- [ ] Deterministic scoring (pure function, no randomness)
- [ ] Null handling correct for optional fields
- [ ] **Scraper (or upstream) provides accurate data** — deadlines, estimated_value, tab_sections as per contract
- [ ] Config names and formulas aligned (no misleading names)
- [ ] Output format correct (valid JSON with metadata)

---

*Saved for reference. Do not repeat: wrong deadline/estimated_value from scraper, unclear guarantee formula semantics, assuming scraper output matches schema without verification.*
