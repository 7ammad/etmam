# Phase 2 Quick Start: Oracle Pipeline

**One-command skills-based implementation guide**

---

## Skills Summary

### Task 2.1: AI Configuration
- **Primary:** `ai-sdk-core`, `senior-backend`
- **Status:** ✅ Packages installed, ⚠️ Need `generateObject` helper

### Task 2.2: Oracle Prompt
- **Primary:** `senior-prompt-engineer`, `ai-sdk-core`
- **Status:** ⚠️ Need to create `SYSTEM_PROMPT_ORACLE`

### Task 2.3: Oracle Action
- **Primary:** `ai-sdk-core`, `senior-backend`, `supabase-postgres-best-practices`
- **Status:** ⚠️ Need to create `runOracleEvaluation()`

---

## Quick Implementation Order

1. **Read Skills:**
   - `ai-sdk-core` → Understand `generateObject` patterns
   - `senior-prompt-engineer` → Design 3-stage prompt
   - `senior-backend` → Structure action properly
   - `supabase-postgres-best-practices` → Database operations

2. **Task 2.1:** Add `generateObject` helper to `lib/ai/client.ts`

3. **Task 2.2:** Create `lib/ai/oracle-prompt.ts` with `SYSTEM_PROMPT_ORACLE`

4. **Task 2.3:** Create `app/actions/oracle.ts` with `runOracleEvaluation()`

5. **Verify:** Test with a scraped tender, check database

---

## Full Skills Guide

See: `etmam-docs/MVP 2.0/implementation/PHASE_2_SKILLS_GUIDE.md`
