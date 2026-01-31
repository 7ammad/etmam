# Phase 1 Implementation Workflow: Foundation (Database & Schema)

**Automated Skills-Based Verification Workflow**

---

## Quick Start (Automated)

**Run once, no babysitting required:**

```bash
pnpm verify:phase-1
```

This script automatically:
- ✅ Verifies Task 1.1 (Database Migration)
- ✅ Verifies Task 1.2.1 (types/tender.ts)
- ✅ Verifies Task 1.2.2 (lib/ai/schemas.ts)
- ✅ Verifies Task 1.2.3 (types/database.ts)
- ✅ Runs TypeScript type check
- ✅ Generates comprehensive report

**Exit Codes:**
- `0` = All checks passed (Phase 1 COMPLETE)
- `1` = Some checks failed (fix issues before proceeding)

---

## Overview

**Phase 1 Goal:** Upgrade schema to support "Oracle" insights and Scraper data.

**Status:**
- ✅ Task 1.1: Database Migration - COMPLETE
- ✅ Task 1.2: Type System Upgrade - COMPLETE (verified by script)

---

## Skills to Use

1. **`supabase-postgres-best-practices`** - For database schema review and optimization
2. **`code-review-excellence`** - For code review of types and schemas
3. **`verification-before-completion`** - For evidence-based verification
4. **`systematic-debugging`** - If issues are found

---

## Task 1.1: Database Migration ✅

**Status:** COMPLETE (migration exists: `00004_add_oracle_schema.sql`)

### Verification Checklist

**Use `supabase-postgres-best-practices` skill to verify:**

- [ ] Migration is idempotent (uses `IF NOT EXISTS`)
- [ ] Indexes are created for performance
- [ ] Constraints are appropriate (budget min <= max)
- [ ] Enum type matches requirements (INFRATECH, EXOTECH, JOINT, NO_BID)
- [ ] Comments are added for documentation

**Verification Command:**
```bash
# Check migration syntax
pnpm exec supabase migration list

# Verify migration can be applied (dry-run)
pnpm exec supabase db diff --schema public
```

**Expected Result:**
- Migration file exists and is syntactically correct
- All columns match plan requirements
- Indexes and constraints are in place

---

## Task 1.2: Type System Upgrade ⚠️

**Status:** NEEDS VERIFICATION

### Subtask 1.2.1: Verify `types/tender.ts` Update

**Files to Check:**
- `types/tender.ts`

**Requirements:**
- [ ] `booklet_price_sar` field exists (int, nullable, optional)
- [ ] `initial_guarantee_sar` field exists (decimal/number, nullable, optional)
- [ ] `project_duration` field exists (string, nullable, optional)
- [ ] Types match database schema exactly

**Verification Steps:**

1. **Read `types/tender.ts`**
2. **Compare with migration schema:**
   ```sql
   -- From 00004_add_oracle_schema.sql
   booklet_price_sar INTEGER
   initial_guarantee_sar NUMERIC(15, 2)
   project_duration TEXT
   ```
3. **Check Zod schema matches:**
   ```typescript
   booklet_price_sar: z.number().int().positive().nullable().optional()
   initial_guarantee_sar: z.number().positive().nullable().optional()
   project_duration: z.string().nullable().optional()
   ```

**If Missing/Incorrect:**
- Update `tenderSchema` in `types/tender.ts`
- Ensure TypeScript types match
- Run `pnpm type-check` to verify

---

### Subtask 1.2.2: Verify `lib/ai/schemas.ts` OracleOutputSchema

**Files to Check:**
- `lib/ai/schemas.ts`

**Requirements from Plan:**
- [ ] `OracleOutputSchema` exists using Zod
- [ ] Matches Architect Design structure
- [ ] Includes all required fields:
  - `inferred_scope` (array of scope items)
  - `reasoning_chain` (3-stage reasoning)
  - `predicted_budget_min` (bigint)
  - `predicted_budget_max` (bigint)
  - `routing_decision` (enum: INFRATECH, EXOTECH, JOINT, NO_BID)
  - `budget_calculation_method` (enum)
  - `overall_confidence` (0-100)

**Verification Steps:**

1. **Read `lib/ai/schemas.ts`**
2. **Compare with Architect Design:**
   - Reference: `etmam-docs/MVP 2.0/Architect-Level Design_ Etmam Prediction Engine (_.md`
   - Check 3-Stage Reasoning Pipeline structure
3. **Verify schema matches database:**
   ```sql
   -- From 00004_add_oracle_schema.sql
   oracle_metadata JSONB
   predicted_budget_min BIGINT
   predicted_budget_max BIGINT
   routing_decision routing_decision
   ```
4. **Check helper functions exist:**
   - `validateOracleOutput()` - for runtime validation
   - `createOracleMetadata()` - for creating metadata with timestamps

**If Missing/Incorrect:**
- Update or create `OracleOutputSchema` in `lib/ai/schemas.ts`
- Ensure it matches the Architect Design
- Add helper functions for validation and metadata creation
- Run `pnpm type-check` to verify

---

### Subtask 1.2.3: Verify Database Types Match

**Files to Check:**
- `types/database.ts` (generated from Supabase)

**Requirements:**
- [ ] `tenders` table type includes new columns
- [ ] `evaluations` table type includes new columns
- [ ] `routing_decision` enum type exists

**Verification Steps:**

1. **Check if types are auto-generated:**
   ```bash
   # If using Supabase CLI type generation
   pnpm exec supabase gen types typescript --local > types/database.ts
   ```

2. **Or manually verify `types/database.ts`:**
   - Check `Database['public']['Tables']['tenders']['Insert']` includes:
     - `booklet_price_sar?: number | null`
     - `initial_guarantee_sar?: number | null`
     - `project_duration?: string | null`
   - Check `Database['public']['Tables']['evaluations']['Insert']` includes:
     - `oracle_metadata?: Json | null`
     - `predicted_budget_min?: number | null`
     - `predicted_budget_max?: number | null`
     - `routing_decision?: Database['public']['Enums']['routing_decision'] | null`

**If Missing:**
- Regenerate types from Supabase (if using CLI)
- Or manually update `types/database.ts` to match migration

---

## Implementation Workflow

### Step 1: Pre-Implementation Review

**Use `code-review-excellence` skill:**

1. Read the plan: `etmam-docs/MVP 2.0/Etmam Prediction Engine- Phased Implementation Plan.md`
2. Review current state:
   - Check `supabase/migrations/00004_add_oracle_schema.sql`
   - Check `types/tender.ts`
   - Check `lib/ai/schemas.ts`
   - Check `types/database.ts`
3. Identify gaps between requirements and current state

**Current Status Check:**
- ✅ Migration exists and includes all required columns
- ✅ `types/tender.ts` includes scraper fields (lines 28-30)
- ✅ `types/database.ts` includes all new columns (verified via grep)
- ✅ `lib/ai/schemas.ts` has complete OracleOutputSchema

### Step 2: Verification & Gap Analysis

**Use `supabase-postgres-best-practices` + `verification-before-completion` skills:**

**Task 1.2.1: Verify types/tender.ts**
1. Read `types/tender.ts`
2. Verify scraper fields match migration:
   - `booklet_price_sar: z.number().int().positive().nullable().optional()` ✅
   - `initial_guarantee_sar: z.number().positive().nullable().optional()` ✅
   - `project_duration: z.string().nullable().optional()` ✅
3. Run: `pnpm type-check`

**Task 1.2.2: Verify lib/ai/schemas.ts**
1. Read `lib/ai/schemas.ts`
2. Verify OracleOutputSchema structure:
   - `inferred_scope` array ✅
   - `reasoning_chain` (3 stages) ✅
   - `predicted_budget_min/max` ✅
   - `routing_decision` enum ✅
   - `budget_calculation_method` ✅
3. Verify helper functions exist:
   - `validateOracleOutput()` ✅
   - `createOracleMetadata()` ✅

**Task 1.2.3: Verify types/database.ts**
1. Check `types/database.ts` includes:
   - `tenders` table: scraper fields ✅ (verified via grep)
   - `evaluations` table: oracle fields ✅ (verified via grep)
   - `routing_decision` enum ✅ (verified via grep)

### Step 3: Final Verification

**Use `verification-before-completion` skill:**

**Run verification commands:**
```bash
# 1. TypeScript compilation
pnpm type-check

# 2. Verify migration syntax (if Supabase CLI available)
pnpm exec supabase migration list

# 3. Check for any TypeScript errors in related files
pnpm exec tsc --noEmit --pretty
```

**Verification Checklist:**
- [ ] `pnpm type-check` passes
- [ ] All Zod schemas validate correctly
- [ ] Database types match migration (verified)
- [ ] No TypeScript errors
- [ ] All requirements from plan are met

**If all checks pass:** Phase 1 is COMPLETE ✅

---

## Expected Files After Completion

### Database
- ✅ `supabase/migrations/00004_add_oracle_schema.sql` (COMPLETE)

### TypeScript Types
- ⚠️ `types/tender.ts` - Verify scraper fields exist
- ⚠️ `types/database.ts` - Verify generated types include new columns
- ✅ `lib/ai/schemas.ts` - Verify OracleOutputSchema exists

---

## Verification Checklist (Final)

**Before marking Phase 1 complete:**

- [ ] Migration applied successfully (or verified syntax)
- [ ] `types/tender.ts` includes all scraper fields
- [ ] `lib/ai/schemas.ts` has complete OracleOutputSchema
- [ ] `types/database.ts` includes new columns (or regeneration command ready)
- [ ] `pnpm type-check` passes
- [ ] All Zod schemas validate correctly
- [ ] Helper functions exist for Oracle metadata

---

## Next Steps After Phase 1

Once Phase 1 is verified complete:
- Proceed to **Phase 2: The "Oracle" Pipeline (Backend)**
- Task 2.1: AI Configuration
- Task 2.2: The Oracle Prompt
- Task 2.3: Oracle Action

---

## Automated Verification Script

**Location:** `scripts/verify-phase-1.ts`

**Usage:**
```bash
# Run automated verification
pnpm verify:phase-1

# Or directly
pnpm exec tsx scripts/verify-phase-1.ts
```

**What it does:**
1. Checks migration file exists and has all required elements
2. Verifies `types/tender.ts` has scraper fields
3. Verifies `lib/ai/schemas.ts` has OracleOutputSchema
4. Verifies `types/database.ts` has all new columns
5. Runs `pnpm type-check` to ensure TypeScript compiles
6. Generates a comprehensive report with pass/fail status

**Output:**
- ✅ Green checkmarks for passed checks
- ❌ Red X for failed checks
- ⚠️ Yellow warnings for issues
- Summary with total passed/failed counts
- Exit code 0 if all pass, 1 if any fail

---

## Skills Reference

- **`supabase-postgres-best-practices`**: `.cursor/skills/supabase-postgres-best-practices/AGENTS.md`
- **`code-review-excellence`**: `.agents/skills/code-review-excellence/SKILL.md`
- **`verification-before-completion`**: `.agents/skills/verification-before-completion/SKILL.md`
- **`systematic-debugging`**: `.agents/skills/systematic-debugging/SKILL.md`
