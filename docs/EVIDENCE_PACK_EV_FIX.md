# Evidence Pack: EV Fix (100x Currency + Canonical EV Pipeline)

## 1) Git status, diff --stat, and full diff (EV-related)

### 1.1 git status (EV-relevant lines)

```
On branch ASUS-Version
Changes not staged for commit:
	modified:   actions/evaluation.ts
	modified:   app/api/cron/sync/route.ts
	modified:   components/dashboard/tenders-list-client.tsx
	modified:   lib/ai/evaluator.ts
	modified:   lib/ai/prompts.ts
	modified:   lib/evaluation/index.ts
	modified:   lib/evaluation/rules.ts
	modified:   lib/evaluation/value-estimator.ts
	modified:   messages/ar.json
	modified:   messages/en.json
	modified:   scripts/calibrate-values.ts

Untracked files:
	lib/currency.ts
	lib/evaluation/effective-value.ts
	lib/evaluation/classifier.ts
	scripts/verify-currency-normalization.ts
	docs/EV_FIX_100X_CURRENCY.md
	docs/EV_FIX_CODE_REVIEW.md
	docs/EV_FIX_PR_STEPS.md
```

### 1.2 git diff --stat (EV-related subset)

```
 actions/evaluation.ts                        | 113 +++++++--
 app/api/cron/sync/route.ts                   |  15 +-
 components/dashboard/tenders-list-client.tsx | 337 ++++++++++++++++----------
 lib/ai/evaluator.ts                          | 168 ++++++++-----
 lib/ai/prompts.ts                            |  57 +++--
 lib/evaluation/index.ts                     |   7 +-
 scripts/calibrate-values.ts                  |   4 +-
 messages/ar.json                             |  15 +-
 messages/en.json                             |  15 +-
 (plus lib/evaluation/rules.ts, value-estimator.ts; new: lib/currency.ts, lib/evaluation/effective-value.ts, classifier.ts, scripts/verify-currency-normalization.ts)
```

### 1.3 Full git diff (EV-related files)

Full diff for EV-related **modified** files is written to:

**`docs/EVIDENCE_PACK_FULL_DIFF.txt`**

Generated with:

```powershell
git diff -- actions/evaluation.ts app/api/cron/sync/route.ts lib/ai/evaluator.ts lib/ai/prompts.ts lib/evaluation/index.ts scripts/calibrate-values.ts
```

Additional modified files (run separately): `components/dashboard/tenders-list-client.tsx`, `messages/ar.json`, `messages/en.json`.

New files (no diff): `lib/currency.ts`, `lib/evaluation/effective-value.ts`, `lib/evaluation/classifier.ts`, `scripts/verify-currency-normalization.ts`, `docs/EV_FIX_100X_CURRENCY.md`.

---

## 2) Raw command outputs

### 2.1 pnpm type-check

```
> etmaam-crm@0.1.0 type-check C:\Dev\Builds\etmam-app
> tsc --noEmit
```

Exit code: 0.

### 2.2 pnpm verify:phase-1

```
> etmaam-crm@0.1.0 verify:phase-1 C:\Dev\Builds\etmam-app
> tsx scripts/verify-phase-1.ts

============================================================
PHASE 1 VERIFICATION: Foundation (Database & Schema)
============================================================

🔍 Verifying Task 1.1: Database Migration...
🔍 Verifying Task 1.2.1: types/tender.ts...
🔍 Verifying Task 1.2.2: lib/ai/schemas.ts...
🔍 Verifying Task 1.2.3: types/database.ts...
🔍 Running TypeScript type check...

============================================================
VERIFICATION RESULTS
============================================================

✅ Task 1.1: Database Migration
   Migration file exists with all required columns, enum, and indexes

✅ Task 1.2.1: types/tender.ts - Scraper Fields
   All required patterns found in C:\Dev\Builds\etmam-app\types\tender.ts

✅ Task 1.2.2: lib/ai/schemas.ts - OracleOutputSchema
   All required patterns found in C:\Dev\Builds\etmam-app\lib\ai\schemas.ts

✅ Task 1.2.3: types/database.ts - Generated Types
   All required patterns found in C:\Dev\Builds\etmam-app\types\database.ts

✅ TypeScript Type Check
   TypeScript compilation successful

============================================================
SUMMARY
============================================================
✅ Passed: 5
❌ Failed: 0
⚠️  Warnings: 0

🎉 Phase 1 Verification: ALL CHECKS PASSED
✅ Phase 1 is COMPLETE and ready for Phase 2
```

Exit code: 0.

### 2.3 pnpm verify:phase-2

```
> etmaam-crm@0.1.0 verify:phase-2 C:\Dev\Builds\etmam-app
> tsx scripts/verify-phase-2.ts

============================================================
PHASE 2 VERIFICATION: The "Oracle" Pipeline (Backend)
============================================================

🔍 Verifying Task 2.1: AI Configuration...
  Checking Task 2.1: AI Configuration...
🔍 Verifying Task 2.2: The Oracle Prompt...
  Checking Task 2.2: The Oracle Prompt...
🔍 Verifying Task 2.3: Oracle Action...
  Checking Task 2.3: Oracle Action...
🔍 Verifying Task 2.4: Schema Alignment...
  Checking schema alignment...
🔍 Verifying Database Migration...
  Checking database migration...
🔍 Running TypeScript type check...
  Running TypeScript type check...

============================================================
VERIFICATION RESULTS
============================================================

✅ Task 2.1: AI Configuration: 4/4 checks passed
   Task 2.1.1: AI SDK installed: ^4.0.0
   Task 2.1.2: OpenAI SDK installed: ^1.0.0
   Task 2.1.3: AI Client Implementation: All required patterns found in lib/ai/client.ts
   Task 2.1.4: Retry logic with exponential backoff found

✅ Task 2.2: The Oracle Prompt: 7/7 checks passed
   Task 2.2.1: Prompt File Exists: All required patterns found in lib/ai/prompts.ts
   Task 2.2.2: REQUIREMENT HALLUCINATION: REQUIREMENT HALLUCINATION stage found in prompt
   Task 2.2.2: BUDGET TRIANGULATION: BUDGET TRIANGULATION stage found in prompt
   Task 2.2.2: FIT SCORING: FIT SCORING stage found in prompt
   Task 2.2.3: Initial Guarantee calculation logic found
   Task 2.2.4: Routing decision logic found (4/4 routing options)
   Task 2.2.5: Few-shot examples found in prompt

✅ Task 2.3: Oracle Action: 7/7 checks passed
   Task 2.3.1: Oracle Action File: All required patterns found in app/actions/oracle.ts
   Task 2.3.2: Authentication check found
   Task 2.3.3: Cache check logic found
   Task 2.3.4: Error handling found
   Task 2.3.5: Database upsert logic found (4/4 fields)
   Task 2.3.6: Structured logging found
   Task 2.3.7: Database Query Support: All required patterns found in lib/queries/evaluation.ts

✅ Task 2.4: Schema Alignment: 2/2 checks passed
   Task 2.4.1: Oracle Schema: All required patterns found in lib/ai/schemas.ts
   Task 2.4.2: Oracle schema exported from index.ts

✅ Database Migration: Migration includes all Oracle fields and GIN index

✅ TypeScript Type Check: TypeScript compilation successful
   Evidence: pnpm type-check exited with code 0...

============================================================
SUMMARY
============================================================
✅ Passed: 6
⚠️  Warnings: 0
❌ Failed: 0

🎉 Phase 2 Verification: ALL CHECKS PASSED
✅ Phase 2 is COMPLETE and ready for Phase 3
```

Exit code: 0.

### 2.4 Added verification script: verify-currency-normalization

```
Currency normalization verification (halala -> SAR)

  260139004531 (scraper-output/run-historical-2026-02-01T12-22-15-075Z.json)
    award: raw 6054750 -> SAR 60547.5 (expected ~60547.5) ✓
    booklet: raw 20000 -> SAR 200 (expected ~200) ✓

  251239009324 (scraper-output/run-historical-2026-02-01T12-22-15-075Z.json)
    award: raw 9993898 -> SAR 99938.98 (expected ~99938.98) ✓
    booklet: raw 20000 -> SAR 200 (expected ~200) ✓

  251239006899 (scraper-output/run-historical-2026-02-01T12-22-15-075Z.json)
    award: raw 8960800 -> SAR 89608 (expected ~89608) ✓
    booklet: raw 20000 -> SAR 200 (expected ~200) ✓

normalizeTenderMoneyFields smoke test
  normalized tender award_amount_sar=60547.5, booklet_price=200 ✓

All normalization checks passed.
```

Exit code: 0.

---

## 3) Where EV is computed and proof it runs before BOTH branches

- **File:** `actions/evaluation.ts`
- **Function:** `runEvaluationAction(tenderId: string)`
- **Callsite:** EV is computed once by `getEffectiveEstimatedValueSar(tender, existingEval, config)` at lines 85–90, **before** the `if (config)` that chooses the branch.

**Code (excerpt):**

```ts
// lines 84–90
const config = loadScoringConfig()
const existingEval = await getEvaluationByTenderId(tenderId)
const effectiveEv = getEffectiveEstimatedValueSar(
  tender,
  existingEval,
  config ?? undefined
)

if (config) {
  // DETERMINISTIC RULES BRANCH: uses scraped + scoreTenderV2; predicted_budget from scored
  const scraped = tenderRowToScraped(tender)
  const scored = scoreTenderV2(scraped, config)
  // ... upsertEvaluation(..., predicted_budget_min: scored.predicted_budget_min, ...)
} else {
  // AI FALLBACK BRANCH: uses effectiveEv.evSar in prompt and effectiveEv.predictedMin/Max in upsert
  const result = await evaluateTender(tender, { effectiveValueSar: effectiveEv.evSar })
  // ... upsertEvaluation(..., predicted_budget_min: effectiveEv.predictedMin, predicted_budget_max: effectiveEv.predictedMax)
}
```

**Proof:**

| Branch                 | EV used for display / prompt / DB | Source of EV |
|------------------------|-----------------------------------|--------------|
| Deterministic (config) | `scored` has value from tender + value estimate; list/detail use `estimated_value` and `predicted_budget_min/max` from DB (both in SAR). | `getEffectiveEstimatedValueSar` runs first; rule branch uses `tenderRowToScraped(tender)` (DB already SAR) and stores `scored.predicted_budget_*`. |
| AI fallback            | `effectiveValueSar: effectiveEv.evSar` in prompt; `predicted_budget_min/max: effectiveEv.predictedMin/Max` in upsert. | Same `effectiveEv` from single `getEffectiveEstimatedValueSar` call above. |

**Definition of EV (canonical SAR):**

- **File:** `lib/evaluation/effective-value.ts`
- **Function:** `getEffectiveEstimatedValueSar(tender, evaluation, config?)`
- Returns: `{ evSar, source, predictedMin, predictedMax, ... }`; all monetary values are SAR (from DB or from estimator midpoint).

---

## 4) Provenance-based normalization (no magnitude heuristic)

- **File:** `lib/currency.ts`
- **Logic:**
  - **award_amount_sar**, **booklet_price**: Treated as **halala** (known scraped integer money fields). `normalizeToSar` divides by 100; `toSar(..., 'award_amount_sar' | 'booklet_price')` returns value/100.
  - **estimated_value**: Treated as **SAR** (Etimad decimal string or pass-through; no integer magnitude heuristic). `normalizeToSar(..., 'estimated_value')` returns value unchanged; no division.
- **normalizeTenderMoneyFields:** Only normalizes `booklet_price` and `award_amount_sar` to SAR; `estimated_value` is left as-is (SAR pass-through).

No magnitude heuristic remains; conversion is by field provenance only.

---

## 5) Manual sanity check: one awarded tender

**Source file:** `scraper-output/run-historical-2026-02-01T12-22-15-075Z.json`  
**Tender:** `reference_no: "260139004531"`

**award_results "قيمة الترسية" (SAR):**

```json
"award_results": {
  "إسم المورد": "شركة ابتكارات حادة لتقنية المعلومات شخص واحد قابضة",
  "قيمة العرض المالي": "60547.50",
  "قيمة الترسية": "60547.50"
}
```

→ قيمة الترسية in SAR = **60547.50** SAR.

**Stored integer in same JSON (raw scraped):**

```json
"award_amount_sar": 6054750,
"booklet_price": 20000
```

→ 6054750 / 100 = **60547.5** SAR (matches "60547.50").

**After sync (DB):**

- `award_amount_sar` is stored as **60547.5** (SAR) via `toSar(6054750, 'award_amount_sar')` in `app/api/cron/sync/route.ts` → `tenderToDbFormat`.
- `booklet_price_sar` is stored as **200** (SAR) via `toSar(20000, 'booklet_price')`.

**UI:**

- List and detail use `getEffectiveValue(tender.estimated_value, tender.evaluation?.predicted_budget_min, tender.evaluation?.predicted_budget_max)`. All of these are in SAR (estimated_value from DB after sync is SAR or null; predicted_* from our pipeline are SAR).
- For this tender, `estimated_value` is null; if there is an evaluation, the displayed value is the midpoint of predicted_budget in SAR; otherwise "—". Any displayed money is SAR; award amount 60547.5 SAR is stored correctly and can be shown from DB where the UI reads award/value fields.

**Sanity result:** قيمة الترسية = 60547.50 SAR; raw integer 6054750 → normalized 60547.5 SAR in DB; UI displays values in SAR (no 100× error).
