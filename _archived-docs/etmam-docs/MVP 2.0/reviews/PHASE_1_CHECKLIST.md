# Phase 1: Foundation - Checklist

**Status:** ✅ Files Prepared (Ready for Implementation)

## Overview
Phase 1 upgrades the database schema and type system to support Oracle insights and scraper data.

---

## ✅ Task 1.1: Database Migration

**File:** `supabase/migrations/00004_add_oracle_schema.sql`

### What's Added:

#### Tenders Table:
- ✅ `booklet_price_sar` (INTEGER) - Booklet price in SAR
- ✅ `initial_guarantee_sar` (NUMERIC) - Initial guarantee in SAR (CRITICAL for budget algo)
- ✅ `project_duration` (TEXT) - Project/contract duration

#### Evaluations Table:
- ✅ `oracle_metadata` (JSONB) - Full Oracle output with reasoning chain
- ✅ `predicted_budget_min` (BIGINT) - Minimum predicted budget in SAR
- ✅ `predicted_budget_max` (BIGINT) - Maximum predicted budget in SAR
- ✅ `routing_decision` (ENUM) - INFRATECH, EXOTECH, JOINT, NO_BID

#### Database Features:
- ✅ New enum: `routing_decision`
- ✅ Indexes for performance
- ✅ Check constraints (budget min <= max)
- ✅ Column comments for documentation

### Next Steps:
1. Run migration locally: `supabase migration up`
2. Or apply to production via Supabase Dashboard
3. Verify columns exist in Supabase Studio

---

## ✅ Task 1.2: Type System Upgrade

### Files Updated:

#### 1. `types/database.ts`
- ✅ Added scraper fields to `tenders` table types
- ✅ Added Oracle fields to `evaluations` table types
- ✅ Added `routing_decision` to Enums

#### 2. `types/tender.ts`
- ✅ Added `booklet_price_sar`, `initial_guarantee_sar`, `project_duration` to `tenderSchema`

#### 3. `types/evaluation.ts`
- ✅ Added `routingDecisionSchema` enum
- ✅ Added Oracle fields to `evaluationSchema`
- ✅ Updated `EvaluationDisplay` interface

#### 4. `lib/ai/schemas.ts` (NEW)
- ✅ `oracleOutputSchema` - Complete Oracle output structure
- ✅ `oracleMetadataSchema` - What gets stored in DB
- ✅ `routingDecisionSchema` - Routing enum
- ✅ `inferredScopeItemSchema` - Scope items
- ✅ `budgetCalculationMethodSchema` - Budget calculation methods
- ✅ `reasoningStageSchema` - 3-stage reasoning chain
- ✅ Helper functions: `validateOracleOutput()`, `createOracleMetadata()`

#### 5. `lib/ai/index.ts`
- ✅ Exported all Oracle schemas and types

---

## 📋 Verification Steps

### 1. Database Migration
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenders' 
  AND column_name IN ('booklet_price_sar', 'initial_guarantee_sar', 'project_duration');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'evaluations' 
  AND column_name IN ('oracle_metadata', 'predicted_budget_min', 'predicted_budget_max', 'routing_decision');

-- Check enum exists
SELECT typname FROM pg_type WHERE typname = 'routing_decision';
```

### 2. TypeScript Types
```bash
# Run type check
pnpm type-check

# Should pass without errors
```

### 3. Import Test
```typescript
// Test that schemas can be imported
import { oracleOutputSchema, validateOracleOutput } from '@/lib/ai/schemas'
import type { OracleOutput, RoutingDecision } from '@/lib/ai/schemas'
```

---

## 🎯 Ready for Phase 2

Once Phase 1 is verified:
- ✅ Database schema supports Oracle data
- ✅ TypeScript types are updated
- ✅ Oracle schemas are defined and exported

**Next:** Phase 2 - The "Oracle" Pipeline (Backend)
- Task 2.1: AI Configuration
- Task 2.2: The Oracle Prompt
- Task 2.3: Oracle Action

---

## 📝 Notes

- Migration is **idempotent** (uses `IF NOT EXISTS`)
- All new fields are **nullable** (backward compatible)
- Oracle metadata is stored as **JSONB** (flexible structure)
- Budget range uses **BIGINT** (supports large SAR amounts)
- Routing decision uses **ENUM** (type-safe)

---

**Last Updated:** 2026-01-27
**Status:** ✅ Files Created, Ready for Migration
