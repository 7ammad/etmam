# Phase 2 Skills Guide: The "Oracle" Pipeline (Backend)

**Goal:** Implement the 3-Stage Chain-of-Thought Logic using AI SDK.

---

## Phase 2 Tasks Overview

1. **Task 2.1:** AI Configuration (Install & Configure AI SDK)
2. **Task 2.2:** The Oracle Prompt (Create system prompt with 3-stage reasoning)
3. **Task 2.3:** Oracle Action (Implement evaluation action with caching)

---

## Recommended Skills by Task

### Task 2.1: AI Configuration

**Primary Skills:**
- **`ai-sdk-core`** - Core AI SDK patterns, provider setup, model configuration
  - Path: `C:\Users\Hammad\.claude\skills\ai-sdk-core\skills\ai-sdk-core\SKILL.md`
  - Use for: Setting up Vercel AI SDK, configuring providers (DeepSeek/OpenAI), model selection

- **`senior-backend`** - Backend architecture, API design, service configuration
  - Path: `C:\Users\Hammad\.claude\skills\engineering-team\senior-backend\SKILL.md`
  - Use for: Structuring AI provider module, environment variable management, error handling

**Supporting Skills:**
- **`api-error-handling`** - Standardized error responses, logging
  - Use for: Handling AI API errors, rate limiting, retry logic

**What to Build:**
- ✅ Already exists: `lib/ai/client.ts` (has DeepSeek/OpenAI config)
- ✅ Already installed: AI SDK packages (`ai@^4.0.0`, `@ai-sdk/openai@^1.0.0`)
- ⚠️ Need to add: `generateObject` helper using `oracleOutputSchema`

---

### Task 2.2: The Oracle Prompt

**Primary Skills:**
- **`senior-prompt-engineer`** - LLM optimization, prompt patterns, structured outputs
  - Path: `C:\Users\Hammad\.claude\skills\engineering-team\senior-prompt-engineer\SKILL.md`
  - Use for: Designing 3-stage Chain-of-Thought prompt, optimizing for structured output

- **`ai-sdk-core`** - Structured outputs, schema validation
  - Use for: Ensuring prompt works with `generateObject` and Zod schema

**Supporting Skills:**
- **`zod`** - Schema validation (already used in `lib/ai/schemas.ts`)
  - Use for: Validating Oracle output matches schema

**What to Build:**
- ⚠️ Create: `lib/ai/oracle-prompt.ts` (or extend `lib/ai/prompts.ts`)
- ⚠️ Implement: `SYSTEM_PROMPT_ORACLE` with:
  - Stage 1: Scope Analysis instructions
  - Stage 2: Multi-Stage Reasoning instructions
  - Stage 3: Budget Prediction & Routing instructions
  - Initial Guarantee calculation logic: *"If Initial Guarantee is X%, Estimate Budget = Guarantee / (X/100)"*

---

### Task 2.3: Oracle Action

**Primary Skills:**
- **`ai-sdk-core`** - `generateObject`, streaming, error handling
  - Use for: Calling AI SDK with structured output, handling responses

- **`senior-backend`** - API actions, database operations, caching patterns
  - Use for: Implementing `runOracleEvaluation`, database upsert, cache logic

- **`supabase-postgres-best-practices`** - Database queries, JSONB operations, upsert patterns
  - Path: `c:\dev\builds\etmaam\.cursor\skills\supabase-postgres-best-practices\AGENTS.md`
  - Use for: Efficient database operations, JSONB storage, transaction handling

**Supporting Skills:**
- **`api-error-handling`** - Error responses, logging
  - Use for: Handling evaluation failures, validation errors

- **`logging-best-practices`** - Structured logging, context
  - Use for: Logging Oracle evaluation steps, debugging

- **`verification-before-completion`** - Evidence-based verification
  - Use for: Testing Oracle action before marking complete

**What to Build:**
- ⚠️ Create: `app/actions/oracle.ts` (or `lib/ai/oracle.ts`)
- ⚠️ Implement: `runOracleEvaluation(tenderId: string)`:
  1. Fetch tender (including scraper fields: `booklet_price_sar`, `initial_guarantee_sar`, `project_duration`)
  2. Check cache (query `evaluations` table for existing evaluation)
  3. Call `generateObject` with:
     - Model: `getAIModel()`
     - Schema: `oracleOutputSchema`
     - Prompt: `buildOraclePrompt(tender)`
  4. Upsert to `evaluations` table:
     - `oracle_metadata`: Full Oracle output (JSONB)
     - `predicted_budget_min/max`: Extracted from output
     - `routing_decision`: Extracted from output
  5. Return evaluation result

---

## Skills Workflow for Phase 2

### Step 1: Setup & Configuration (Task 2.1)

**Use `ai-sdk-core` + `senior-backend` skills:**

1. **Verify Dependencies:**
   ```bash
   # ✅ Already installed (verified in package.json):
   # - ai@^4.0.0
   # - @ai-sdk/openai@^1.0.0
   ```

2. **Review `lib/ai/client.ts`:**
   - ✅ Already has DeepSeek/OpenAI provider setup
   - ⚠️ Need to add: `generateObject` helper function
   - ⚠️ Need to verify: Environment variables configured

3. **Create Helper Function:**
   ```typescript
   // lib/ai/client.ts
   import { generateObject } from 'ai'
   import { getAIModel } from './client'
   import { oracleOutputSchema } from './schemas'
   
   export async function generateOracleOutput(prompt: string) {
     const model = getAIModel()
     const result = await generateObject({
       model,
       schema: oracleOutputSchema,
       prompt,
     })
     return result.object
   }
   ```

---

### Step 2: Prompt Engineering (Task 2.2)

**Use `senior-prompt-engineer` + `ai-sdk-core` skills:**

1. **Read Architect Design:**
   - Reference: `etmam-docs/MVP 2.0/Architect-Level Design_ Etmam Prediction Engine (_.md`
   - Understand 3-Stage Reasoning Pipeline structure

2. **Create Oracle Prompt:**
   - Use `senior-prompt-engineer` skill for:
     - Chain-of-Thought prompting patterns
     - Structured output optimization
     - Multi-stage reasoning instructions

3. **Implement Prompt:**
   ```typescript
   // lib/ai/oracle-prompt.ts
   export const SYSTEM_PROMPT_ORACLE = `You are the Oracle, an AI system that evaluates government tenders...
   
   Stage 1: Scope Analysis
   - Analyze the tender description...
   - Identify scope items...
   
   Stage 2: Multi-Stage Reasoning
   - Stage 2.1: Technical Feasibility...
   - Stage 2.2: Budget Estimation...
   - Stage 2.3: Routing Decision...
   
   Stage 3: Budget Prediction
   - If Initial Guarantee is X%, Estimate Budget = Guarantee / (X/100)
   - Use estimated_value if available...
   - Infer from scope if needed...
   `
   
   export function buildOraclePrompt(tender: Tender): string {
     // Build prompt with tender data
   }
   ```

---

### Step 3: Oracle Action Implementation (Task 2.3)

**Use `ai-sdk-core` + `senior-backend` + `supabase-postgres-best-practices` skills:**

1. **Create Action File:**
   ```typescript
   // app/actions/oracle.ts
   import { generateObject } from 'ai'
   import { getAIModel } from '@/lib/ai/client'
   import { oracleOutputSchema, createOracleMetadata } from '@/lib/ai/schemas'
   import { buildOraclePrompt } from '@/lib/ai/oracle-prompt'
   import { createClient } from '@/lib/supabase/server'
   
   export async function runOracleEvaluation(tenderId: string) {
     // 1. Fetch tender
     // 2. Check cache
     // 3. Call generateObject
     // 4. Upsert to evaluations
   }
   ```

2. **Use `supabase-postgres-best-practices` for:**
   - Efficient JSONB upsert
   - Transaction handling
   - Index usage for cache checks

3. **Use `ai-sdk-core` for:**
   - `generateObject` with schema validation
   - Error handling for API failures
   - Retry logic if needed

---

## Verification Checklist

**Use `verification-before-completion` skill:**

- [x] Task 2.1: AI SDK packages installed ✅ (already in package.json)
- [ ] Task 2.1: `lib/ai/client.ts` has `generateObject` helper
- [ ] Task 2.2: `SYSTEM_PROMPT_ORACLE` exists with 3-stage instructions
- [ ] Task 2.2: `buildOraclePrompt()` includes Initial Guarantee calculation
- [ ] Task 2.3: `runOracleEvaluation()` implemented
- [ ] Task 2.3: Cache check works (queries `evaluations` table)
- [ ] Task 2.3: Database upsert works (stores Oracle output)
- [ ] Manual test: Trigger evaluation for a scraped tender
- [ ] Verify DB: `oracle_metadata` contains "Inferred Scope" and "Predicted Budget"

---

## Skills Reference Links

### Primary Skills
- **`ai-sdk-core`**: `C:\Users\Hammad\.claude\skills\ai-sdk-core\skills\ai-sdk-core\SKILL.md`
- **`senior-prompt-engineer`**: `C:\Users\Hammad\.claude\skills\engineering-team\senior-prompt-engineer\SKILL.md`
- **`senior-backend`**: `C:\Users\Hammad\.claude\skills\engineering-team\senior-backend\SKILL.md`
- **`supabase-postgres-best-practices`**: `c:\dev\builds\etmaam\.cursor\skills\supabase-postgres-best-practices\AGENTS.md`

### Supporting Skills
- **`zod`**: `C:\Users\Hammad\.claude\skills\zod\skills\zod\SKILL.md`
- **`api-error-handling`**: `C:\Users\Hammad\.claude\skills\api-error-handling\skills\api-error-handling\SKILL.md`
- **`logging-best-practices`**: `C:\Users\Hammad\.claude\skills\logging-best-practices\skills\logging-best-practices\SKILL.md`
- **`verification-before-completion`**: `C:\Users\Hammad\.claude\skills\verification-before-completion\skills\verification-before-completion\SKILL.md`

---

## Next Steps

1. **Read the skills** listed above to understand best practices
2. **Start with Task 2.1**: Verify AI SDK setup, add `generateObject` helper
3. **Move to Task 2.2**: Create Oracle prompt using prompt engineering skills
4. **Finish with Task 2.3**: Implement Oracle action using backend + database skills
5. **Verify**: Use verification skill to ensure everything works

---

## Notes

- **Current State**: `lib/ai/client.ts` already has provider setup ✅
- **Current State**: `lib/ai/schemas.ts` already has `oracleOutputSchema` ✅
- **Missing**: Oracle prompt implementation
- **Missing**: Oracle action implementation
- **Missing**: `generateObject` helper function
