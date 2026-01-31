# Oracle Evaluation System - Deep Dive Analysis

**Date:** 2026-01-27  
**Status:** ✅ **IMPLEMENTED** - Phase 2 Complete

---

## 🎯 Overview

The **Oracle** is a 3-Stage Chain-of-Thought AI reasoning pipeline that performs "Blind Evaluation" to predict tender scope, budget, and routing decisions. It's separate from the basic evaluation system and provides advanced insights.

---

## 🏗️ Architecture

### Two Evaluation Systems

1. **Basic Evaluation** (`evaluateTender`)
   - File: `lib/ai/evaluator.ts`
   - Purpose: Simple qualification scoring (0-100)
   - Output: Score, recommendation (qualified/conditional/excluded), summary, strengths, risks
   - Uses: `generateText` (unstructured JSON parsing)

2. **Oracle Evaluation** (`runOracleEvaluation`)
   - File: `app/actions/oracle.ts`
   - Purpose: Advanced prediction with 3-stage reasoning
   - Output: Inferred scope, reasoning chain, budget prediction, routing decision
   - Uses: `generateObject` (structured outputs with Zod schema)

---

## 🔄 Oracle Pipeline: 3-Stage Chain-of-Thought

### Stage 1: REQUIREMENT HALLUCINATION (Scope Analysis)

**Purpose:** Infer technical requirements from Title and Entity only

**Logic:**
- Analyzes tender title and entity name
- Infers 5 most likely technical requirements
- Categorizes each requirement (e.g., "Network Infrastructure", "Software Development")
- Assigns confidence scores (0-100) per scope item

**Example:**
```
Input: "Supply and Installation of Smart Monitoring Cameras", Entity: "Riyadh Municipality"
Output: [
  { category: "Infrastructure", description: "CCTV camera installation", confidence: 85 },
  { category: "Hardware Procurement", description: "Smart monitoring equipment", confidence: 80 }
]
```

**Output Schema:**
```typescript
inferred_scope: Array<{
  category: string
  description: string
  confidence: number (0-100)
}>
```

---

### Stage 2: BUDGET TRIANGULATION (Budget Estimation)

**Purpose:** Estimate Total Contract Value (TCV) using multiple heuristics

**Calculation Methods (Priority Order):**

1. **Initial Guarantee Method (PRIORITY)**
   ```
   If Initial Guarantee = X% and Guarantee Amount = Y SAR
   Then Estimated Budget = Y / (X/100)
   ```
   - Example: Guarantee = 50,000 SAR at 5% → Budget = 50,000 / 0.05 = 1,000,000 SAR

2. **Booklet Price Heuristics**
   - Booklet Price < 500 SAR → Likely < 2M SAR (Simple Supply/Service)
   - Booklet Price 500-2000 SAR → Likely 2M - 10M SAR (Standard Project)
   - Booklet Price > 2000 SAR → Likely > 10M SAR (Major Initiative)

3. **Entity Multiplier**
   - If Entity is "Ministry" or "Authority" → Apply 1.5x multiplier

4. **Fallback**
   - Use `estimated_value` if provided
   - Otherwise infer from scope analysis and similar projects

**Output Schema:**
```typescript
predicted_budget_min: number (positive integer, SAR)
predicted_budget_max: number (positive integer, SAR)
budget_calculation_method: 'INITIAL_GUARANTEE' | 'ESTIMATED_VALUE' | 'INFERRED' | 'HYBRID'
budget_confidence: number (0-100)
calculation_notes?: string
```

---

### Stage 3: FIT SCORING (Routing Decision)

**Purpose:** Route tender to appropriate division or mark as NO_BID

**Routing Logic:**

1. **INFRATECH Routing**
   - Infrastructure, networking, hardware, physical systems
   - Cybersecurity, OT/ICS Security
   - NCA compliance requirements
   - CCTV, O&M of technical systems

2. **EXOTECH Routing**
   - Software, applications, digital solutions
   - AI, Computer Vision, Robotics
   - Smart Cities, IoT
   - Platform Development

3. **JOINT Routing**
   - Requires both infrastructure AND software expertise
   - Example: "AI-Powered Security Monitoring"

4. **NO_BID**
   - Not suitable for bidding
   - Low confidence
   - Misalignment with capabilities
   - High risk

**P_win (Probability of Win):** 0-100%
- Must match "Core Capabilities" (e.g., NCA License) to score >70%

**Output Schema:**
```typescript
routing_decision: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID'
routing_reasoning: string
overall_confidence: number (0-100)
```

---

## 📊 Complete Oracle Output Schema

```typescript
interface OracleOutput {
  // Stage 1: Scope Analysis
  inferred_scope: Array<{
    category: string
    description: string
    confidence: number (0-100)
  }>

  // Stage 2: Reasoning Chain
  reasoning_chain: Array<{
    stage: number (1, 2, or 3)
    reasoning: string
    conclusions: string[]
  }> // Exactly 3 stages

  // Stage 2: Budget Prediction
  predicted_budget_min: number (positive integer, SAR)
  predicted_budget_max: number (positive integer, SAR)
  budget_calculation_method: 'INITIAL_GUARANTEE' | 'ESTIMATED_VALUE' | 'INFERRED' | 'HYBRID'
  budget_confidence: number (0-100)

  // Stage 3: Routing Decision
  routing_decision: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID'
  routing_reasoning: string

  // Overall Metrics
  overall_confidence: number (0-100)
  calculation_notes?: string
}
```

---

## 🔌 Integration Points

### 1. AI Client (`lib/ai/client.ts`)

**Function:** `generateOracleOutput(prompt, systemPrompt, maxRetries)`

**Implementation:**
- Uses Vercel AI SDK's `generateObject` for structured outputs
- Schema: `oracleOutputSchema` (Zod validation)
- Temperature: 0.3 (for consistency)
- Retry logic: Exponential backoff for rate limits (429), server errors (5xx), network errors
- Error handling: Specific handling for `APICallError` and `NoObjectGeneratedError`

**Key Features:**
- ✅ Structured outputs (no JSON parsing needed)
- ✅ Automatic schema validation
- ✅ Retry with exponential backoff
- ✅ Proper error categorization

---

### 2. Prompts (`lib/ai/prompts.ts`)

**System Prompt:** `SYSTEM_PROMPT_ORACLE`
- Defines the 3-stage logic chain
- Provides context about INFRATECH vs EXOTECH divisions
- Includes few-shot examples
- Uses English (not Arabic) for structured outputs

**User Prompt:** `buildOraclePrompt(tender)`
- Includes all tender data (title, entity, reference_no, deadline, estimated_value)
- **Critical:** Includes scraper fields:
  - `booklet_price_sar` (for budget heuristics)
  - `initial_guarantee_sar` (for budget calculation)
  - `project_duration` (for context)
- Provides calculation hints if initial guarantee percentage can be inferred
- Includes few-shot examples from Architect Design

---

### 3. Server Action (`app/actions/oracle.ts`)

**Function:** `runOracleEvaluation(tenderId)`

**Flow:**
1. ✅ Check AI configuration
2. ✅ Fetch tender (including scraper fields)
3. ✅ **Cache Check:** If `oracle_metadata` exists, validate and return cached result
4. ✅ Build prompt with `buildOraclePrompt(tender)`
5. ✅ Call `generateOracleOutput(prompt, SYSTEM_PROMPT_ORACLE)`
6. ✅ Validate output with `validateOracleOutput()`
7. ✅ Create metadata with `createOracleMetadata()`
8. ✅ Upsert to database (updates existing evaluation or creates new one)
9. ✅ Revalidate Next.js paths

**Key Features:**
- ✅ Caching (avoids duplicate API calls)
- ✅ Graceful error handling (rate limits, network errors)
- ✅ Works with existing evaluations (adds Oracle fields)
- ✅ Can create standalone Oracle evaluation (with placeholder score/recommendation)

---

### 4. Database Storage

**Table:** `evaluations`

**Oracle Fields:**
- `oracle_metadata` (JSONB) - Full Oracle output + metadata
- `predicted_budget_min` (BIGINT) - Minimum predicted budget in SAR
- `predicted_budget_max` (BIGINT) - Maximum predicted budget in SAR
- `routing_decision` (ENUM) - INFRATECH, EXOTECH, JOINT, NO_BID

**Indexes:**
- `idx_evaluations_routing_decision` - For routing queries
- `idx_evaluations_budget_range` - For budget range queries
- `idx_evaluations_oracle_metadata_gin` - GIN index for JSONB queries

**Metadata Structure:**
```typescript
interface OracleMetadata extends OracleOutput {
  evaluated_at: string (ISO timestamp)
  model_used: string (e.g., "deepseek-chat")
  oracle_version?: string
}
```

---

## 🎨 UI Components

### Oracle Components (Built from Scratch)

1. **`components/oracle/routing-badge.tsx`**
   - Displays routing decision with color coding
   - Supports sizes: sm, md, lg
   - RTL-aware icon flipping

2. **`components/oracle/budget-range.tsx`**
   - Displays predicted budget range
   - Shows calculation method badge
   - Confidence indicator (warning if <70%)

3. **`components/oracle/confidence-meter.tsx`**
   - Visual gauge (0-100%)
   - Color coding: High (green), Medium (yellow), Low (red)

4. **`components/oracle/inferred-scope-list.tsx`**
   - Lists inferred scope items
   - Shows confidence per item
   - Expandable/collapsible

5. **`components/oracle/reasoning-chain.tsx`**
   - Displays 3-stage reasoning chain
   - Shows conclusions per stage

6. **`components/oracle/official-data-panel.tsx`**
   - Displays official tender data (entity, reference, deadline, value, etc.)

7. **`components/oracle/oracle-insights-panel.tsx`**
   - Main panel showing all Oracle insights
   - Combines: scope list, reasoning chain, confidence meter, budget, routing

---

## 🔄 Current Integration Status

### ✅ What's Working

1. **Oracle Infrastructure**
   - ✅ Schema defined (`lib/ai/schemas.ts`)
   - ✅ Client implementation (`lib/ai/client.ts`)
   - ✅ Prompts with 3-stage logic (`lib/ai/prompts.ts`)
   - ✅ Server action (`app/actions/oracle.ts`)
   - ✅ Database schema (`supabase/migrations/00004_add_oracle_schema.sql`)
   - ✅ TypeScript types (`types/database.ts`, `types/evaluation.ts`)

2. **UI Components**
   - ✅ All Oracle components built
   - ✅ Detail page displays Oracle insights (`app/[locale]/dashboard/[tenderId]/page.tsx`)

3. **Data Flow**
   - ✅ Oracle can be called independently
   - ✅ Oracle metadata stored in database
   - ✅ Oracle outputs displayed in UI

### ⚠️ What's Missing

1. **Oracle Trigger**
   - ❌ No UI button to trigger Oracle evaluation
   - ❌ Oracle not automatically called during regular evaluation
   - ❌ No integration between `runEvaluationAction` and `runOracleEvaluation`

2. **Evaluation Flow**
   - Current: `runEvaluationAction` → Basic evaluation only
   - Missing: Option to run Oracle evaluation
   - Missing: Combined evaluation (basic + Oracle)

---

## 🔍 Technical Details

### AI Provider Support

**Supported Providers:**
- DeepSeek (default): `deepseek-chat` model
- OpenAI: `gpt-4o-mini` model

**Configuration:**
- Environment: `AI_PROVIDER` (deepseek | openai)
- API Keys: `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`

### Error Handling

**Retry Logic:**
- Rate limits (429): Exponential backoff, max 10s delay
- Server errors (5xx): Exponential backoff, max 10s delay
- Network errors: Exponential backoff, max 10s delay
- Max retries: 3 attempts

**Error Types:**
- `APICallError`: API-level errors (rate limits, auth, server errors)
- `NoObjectGeneratedError`: Schema validation failures (don't retry)
- Network errors: Timeout, connection reset

### Caching Strategy

**Cache Key:** `evaluations.oracle_metadata` (JSONB column)

**Cache Check:**
1. Fetch existing evaluation
2. If `oracle_metadata` exists, validate with Zod
3. If valid, return cached result
4. If invalid, regenerate

**Cache Invalidation:**
- Manual: Call `runOracleEvaluation` again (will regenerate)
- Automatic: None (cache persists until manual regeneration)

---

## 📈 Performance Considerations

### API Costs

**Oracle Evaluation:**
- Uses `generateObject` (structured outputs)
- Typically requires more tokens than basic evaluation
- Temperature: 0.3 (lower = more consistent, but potentially more tokens)

**Optimization:**
- ✅ Caching prevents duplicate API calls
- ✅ Retry logic prevents wasted calls on transient errors
- ⚠️ No batch processing (evaluates one tender at a time)

### Database Performance

**Indexes:**
- ✅ GIN index on `oracle_metadata` for JSONB queries
- ✅ Index on `routing_decision` for filtering
- ✅ Index on budget range for queries

**Query Patterns:**
- Filter by routing decision: Fast (indexed)
- Filter by budget range: Fast (indexed)
- Query Oracle metadata fields: Fast (GIN index)

---

## 🧪 Testing & Verification

### How to Test Oracle

1. **Manual Trigger (if UI button exists):**
   ```typescript
   import { runOracleEvaluation } from '@/app/actions/oracle'
   const result = await runOracleEvaluation(tenderId)
   ```

2. **Check Database:**
   ```sql
   SELECT 
     oracle_metadata,
     predicted_budget_min,
     predicted_budget_max,
     routing_decision
   FROM evaluations
   WHERE tender_id = '...'
   ```

3. **Verify Output:**
   - Check `oracle_metadata` contains all required fields
   - Verify `reasoning_chain` has exactly 3 stages
   - Verify `inferred_scope` has items with confidence scores
   - Verify `routing_decision` is one of: INFRATECH, EXOTECH, JOINT, NO_BID

---

## 🚀 Next Steps / Improvements

### Immediate

1. **Add Oracle Trigger Button**
   - Create UI button to call `runOracleEvaluation`
   - Show loading state during Oracle evaluation
   - Display Oracle results after completion

2. **Integrate with Basic Evaluation**
   - Option 1: Run Oracle automatically after basic evaluation
   - Option 2: Add checkbox "Run Oracle Analysis" in evaluation UI
   - Option 3: Separate "Oracle" button alongside "Evaluate" button

### Future Enhancements

1. **Batch Oracle Processing**
   - Process multiple tenders in parallel
   - Rate limit handling across batch

2. **Oracle Confidence Calibration**
   - Track actual vs predicted outcomes
   - Improve confidence scoring over time

3. **Oracle Versioning**
   - Track `oracle_version` in metadata
   - Support multiple Oracle prompt versions
   - A/B testing different prompt strategies

4. **Oracle Analytics**
   - Track routing decision accuracy
   - Monitor budget prediction accuracy
   - Analyze confidence score distribution

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `lib/ai/schemas.ts` | Oracle output Zod schemas |
| `lib/ai/client.ts` | `generateOracleOutput()` function |
| `lib/ai/prompts.ts` | Oracle system prompt and prompt builder |
| `app/actions/oracle.ts` | Server action to run Oracle evaluation |
| `supabase/migrations/00004_add_oracle_schema.sql` | Database schema for Oracle fields |
| `components/oracle/*.tsx` | UI components for displaying Oracle insights |

---

## 🎯 Summary

The Oracle system is **fully implemented** at the infrastructure level:
- ✅ Complete 3-stage reasoning pipeline
- ✅ Structured output generation with Zod validation
- ✅ Database schema and storage
- ✅ UI components for display
- ✅ Error handling and retry logic
- ✅ Caching mechanism

**Missing:** UI trigger to actually call the Oracle evaluation. The system is ready but needs a way for users to invoke it.
