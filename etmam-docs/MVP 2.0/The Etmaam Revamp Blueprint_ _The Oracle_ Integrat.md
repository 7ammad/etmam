<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# The Etmaam Revamp Blueprint: "The Oracle" Integration

**From Basic CRM to AI-Powered Prediction Engine**

## 🏗️ High-Level Strategy

We are not throwing away the current build. The `BUILD_REPORT.md` confirms a solid Next.js 16 + Supabase foundation. We will perform a **"Brain Transplant"**: keeping the skeleton (Auth, Database, UI Shell) but replacing the basic AI evaluation logic with the new **3-Stage Oracle Architecture**.

The revamp consists of **3 Core Pillars**:

1. **Backend \& Data Layer (The Foundation):** Schema updates to store "Oracle" insights (inferred requirements, budget ranges, routing logic) instead of simple scores.
2. **The Oracle Engine (The Brain):** Implementing the 3-Stage Chain-of-Thought pipeline using Vercel AI SDK + DeepSeek, replacing the current generic evaluation.
3. **Predictive UX (The Interface):** Transforming the dashboard from a "Data List" to a "Decision Command Center" that visualizes uncertainty, budget proxies, and strategic routing.

***

## 📅 The Revamp Roadmap (2-Week Sprint)

### Phase 1: The Brain Transplant (Backend \& AI)

**Goal:** Enable the system to "think" like the Oracle.

#### 1. Database Schema Upgrade

The current `tenders` and `evaluations` tables are too simple. We need to store the rich, structured output of the Oracle.

* **Action:** Create Migration `02_oracle_schema.sql`.
    * `tenders` table: Add `booklet_price` (Integer) - *Critical for Stage 2 Value Estimation*.
    * `evaluations` table: Add `oracle_metadata` (JSONB) to store the full 3-stage reasoning (inferred scope, entity tier, etc.).
    * `evaluations` table: Add `routing_decision` (Enum: `INFRATECH`, `EXOTECH`, `JOINT`, `NO_BID`).
    * `evaluations` table: Add `predicted_budget_min` \& `predicted_budget_max` (BigInt) for range filtering.


#### 2. Implement the 3-Stage Oracle Pipeline

Replace `actions/evaluation.ts` with a sophisticated pipeline.

* **Action:** Create `lib/ai/oracle-pipeline.ts`.
    * **Stage 1 (Reconstruction):** Input `Title` + `Entity` → Output `Inferred Requirements` (List).
    * **Stage 2 (Forensics):** Input `Booklet Price` + `Duration` + `Entity Tier` → Output `Budget Range` + `Complexity`.
    * **Stage 3 (Routing):** Input `Inferred Requirements` vs `Company Profiles` → Output `Best Candidate` + `Fit Probability`.
    * *Tech:* Use Vercel AI SDK `generateObject` with Zod schemas for strict JSON output.


#### 3. The "Smart Cache" Layer

To reduce DeepSeek costs (as per design), we implement a hash-based cache.

* **Action:** Update `actions/evaluation.ts` to check `evaluations` table first.
    * Generate `tender_hash` (Title + Entity + Deadline).
    * If hash exists \& `< 7 days old`, return cached result.
    * Else, run Oracle Pipeline.

***

### Phase 2: The Interface Overhaul (UX/UI)

**Goal:** Visualize "Inferred" data, not just "Scraped" data.

#### 1. The "Smart Tender Card"

Redesign the main list item to show predictions.

* **Old:** Title | Deadline | Status
* **New:**
    * **Badges:** `INFRATECH FIT: 85%` or `EXOTECH FIT: 92%`.
    * **Budget:** Display "SAR 2M - 5M (Est.)" derived from Oracle, visually distinct from "Official Budget" (usually null).
    * **Complexity:** Visual indicator (e.g., "Signal Strength" icon for booklet price proxy).


#### 2. The "Prediction Detail" View

A new layout for the tender details page (`app/[locale]/dashboard/tenders/[id]/page.tsx`).

* **Left Column (Facts):** Official Etimad data (Title, Deadline, Price).
* **Right Column (The Oracle):**
    * **"Hallucinated" Scope:** "Based on the title, this tender likely requires: [List of 5 inferred requirements]".
    * **Routing Logic:** "Why Infratech? Matches 'SCADA' and 'NCA' keywords."
    * **Confidence Meter:** Visual bar showing P(Win) with transparency on uncertainty.


#### 3. Routing Dashboard

A new high-level view for managers.

* **Action:** Create `app/[locale]/dashboard/routing/page.tsx`.
* **Features:** Two columns—"Infratech Queue" and "Exotech Queue"—automatically populated by the Oracle's routing decision.

***

### Phase 3: Integration \& Polish (Ops)

**Goal:** Production readiness.

#### 1. File Parser Upgrade

The current parser (`lib/parser/`) handles basic CSVs. It needs to handle the "Booklet Price" column.

* **Action:** Update `types/tender.ts` and `file-parser.ts` to map columns like "Booklet Price", "Cost of Doc", or "سعر الكراسة".


#### 2. Confidence Calibration

* **Action:** Implement the "Traffic Light" system.
    * If `Booklet Price` is missing → Show "Low Confidence" warning on budget estimate.
    * If `Title` is < 5 words → Show "Vague Scope" warning on inferred requirements.

***

## 🔧 Technical Blueprint (Code-Level Specs)

### 1. The New Database Schema (Supabase)

```sql
-- Migration: 02_add_oracle_fields.sql

ALTER TABLE tenders 
ADD COLUMN IF NOT EXISTS booklet_price_sar INTEGER DEFAULT 0;

ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS oracle_version TEXT DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS predicted_budget_min BIGINT,
ADD COLUMN IF NOT EXISTS predicted_budget_max BIGINT,
ADD COLUMN IF NOT EXISTS routing_decision TEXT CHECK (routing_decision IN ('INFRATECH', 'EXOTECH', 'JOINT', 'NO_BID')),
ADD COLUMN IF NOT EXISTS fit_probability INTEGER,
ADD COLUMN IF NOT EXISTS oracle_metadata JSONB; -- Stores the full reasoning chain

-- Index for fast routing queries
CREATE INDEX idx_evaluations_routing ON evaluations(routing_decision);
```


### 2. The Oracle Zod Schema (Type Safety)

```typescript
// lib/ai/schemas.ts
import { z } from 'zod';

export const OracleOutputSchema = z.object({
  analysis: z.object({
    entity_tier: z.enum(['Tier 1', 'Tier 2', 'Tier 3']),
    inferred_scope: z.array(z.string()), // The "hallucinated" requirements
    hidden_constraints: z.array(z.string()) // e.g., "NCA License Required"
  }),
  value_estimation: z.object({
    predicted_min: z.number(),
    predicted_max: z.number(),
    complexity: z.enum(['Low', 'Medium', 'High']),
    reasoning: z.string()
  }),
  routing: z.object({
    candidate: z.enum(['INFRATECH', 'EXOTECH', 'JOINT', 'NO_BID']),
    probability: z.number().min(0).max(100),
    reason: z.string()
  })
});
```


### 3. The Server Action (The Logic)

```typescript
// actions/evaluate.ts (Pseudo-code)

export async function runOracleEvaluation(tenderId: string) {
  // 1. Fetch Tender
  const tender = await getTender(tenderId);
  
  // 2. Check Cache (Supabase)
  const cached = await getCachedEvaluation(tender.hash);
  if (cached) return cached;

  // 3. Prepare Context
  const context = `
    Title: ${tender.title_ar}
    Entity: ${tender.entity}
    Booklet Price: ${tender.booklet_price_sar} SAR
    Duration: ${tender.duration}
  `;

  // 4. Call DeepSeek (via Vercel AI SDK)
  const { object } = await generateObject({
    model: deepseek('deepseek-chat'),
    schema: OracleOutputSchema,
    system: SYSTEM_PROMPT_ORACLE, // From file:341
    prompt: context
  });

  // 5. Save to DB
  await saveEvaluation(tenderId, object);
}
```


## 🚀 Execution Order

1. **Day 1:** Run SQL Migration + Update Zod Types.
2. **Day 2:** Update CSV Parser to catch `booklet_price`.
3. **Day 3:** Build `oracle-pipeline.ts` with DeepSeek integration.
4. **Day 4:** Test Oracle on 10 dummy tenders (verify "hallucinations" make sense).
5. **Day 5:** Update Frontend (Smart Card + Detail View).
6. **Day 6:** End-to-End Test (Upload CSV → Oracle Process → Dashboard View).

This plan leverages your existing solid build but fundamentally upgrades the "intelligence" layer to match the new Architect-Level design.
<span style="display:none">[^1][^2][^3][^4][^5][^6][^7][^8]</span>

<div align="center">⁂</div>

[^1]: IMPLEMENTATION_PLAN_CRM_TOOL.md

[^2]: BUILD_REPORT.md

[^3]: Architect-Level-Design_-Etmam-Prediction-Engine.md

[^4]: Etimad-Pre-Purchase-Guesstimation-Engine.md

[^5]: Infratech-and-Exotech-Comprehensive-Company-Profiles-for-Etmam-AI-Engine.md

[^6]: etimad_impl_guide.md

[^7]: etimad_field_inventory_summary.md

[^8]: Etimad-Public-Tender-Data-Automation-Options.docx

