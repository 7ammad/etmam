# Code Review Prompt: Phase 0 & Phase 1 Implementation

**Use this prompt with Claude Code to review the scraper and database foundation implementation.**

---

## Prompt for Claude Code

```
Review the Phase 0 and Phase 1 implementation of the Etmam Prediction Engine using the code-review-excellence skill.

## Context
- Project: Etmam Prediction Engine (Next.js 16, Supabase, Playwright)
- Plan: etmam-docs/MVP 2.0/Etmam Prediction Engine- Phased Implementation Plan.md
- Phase 0: Automated Data Gathering (The Deep Scraper) - COMPLETE
- Phase 1: Foundation (Database & Schema) - Task 1.1 COMPLETE, Task 1.2 needs verification

## Review Scope

### Phase 0: Scraper Implementation
**Files to Review:**
- lib/scraper/etimad-browser.ts (main scraper logic)
- lib/scraper/config.ts (selectors, URLs, filters)
- lib/scraper/utils.ts (parsing, retry logic)
- lib/scraper/errors.ts (error handling)
- lib/scraper/index.ts (exports)
- types/scraper.ts (ScrapedTender schema, SyncPayload, SyncResponse)
- app/api/cron/sync/route.ts (API endpoint - recently hardened with validation)
- scripts/test-scraper.ts (test script)
- scripts/run-scraper.ts (production script)
- scripts/scraper-utils.ts (shared utilities)

**Requirements from Plan:**
- Extract Booklet Price ("قيمة وثائق المنافسة")
- Extract Initial Guarantee ("الضمان الابتدائي") - CRITICAL for Budget Algo
- Extract Duration ("مدة العقد")
- Extract Full Description
- Rate limiting (2s delay between visits)
- Batch size: 50 tenders
- CRON_SECRET authentication
- Upsert to Supabase tenders table

### Phase 1: Database & Schema
**Files to Review:**
- supabase/migrations/00004_add_oracle_schema.sql (Oracle schema migration)
- types/tender.ts (verify updated with new columns)
- lib/ai/schemas.ts (verify OracleOutputSchema exists)

**Requirements from Plan:**
- tenders table: booklet_price_sar (int), initial_guarantee_sar (decimal), project_duration (text)
- evaluations table: oracle_metadata (jsonb), predicted_budget_min/max (bigint), routing_decision (enum)
- routing_decision enum: INFRATECH, EXOTECH, JOINT, NO_BID

## Review Methodology

**Use the code-review-excellence skill and follow its 4-phase process:**

1. **Phase 0: Pre-Review Setup**
   - Identify all files in scope
   - Understand project context (Next.js 16, Supabase, Playwright)
   - Review plan document for requirements

2. **Phase 1: Context Gathering**
   - Understand business requirements (automate Etimad scraping → Oracle predictions)
   - Review architecture (scraper → API → database)
   - Check dependencies and tech stack

3. **Phase 2: High-Level Review**
   - Architecture & design patterns
   - Security (authentication, validation, error handling)
   - Performance (batch operations, rate limiting)
   - Maintainability (code organization, error handling)

4. **Phase 3: Line-by-Line Review**
   - Logic correctness
   - Type safety
   - Error handling
   - Edge cases
   - Best practices compliance

## Review Criteria

**Check against:**
- ✅ Plan requirements (Phase 0 & Phase 1 tasks)
- ✅ Next.js 16 best practices (App Router, API routes)
- ✅ Supabase/Postgres best practices (batch operations, RLS)
- ✅ TypeScript strict mode compliance
- ✅ Security (input validation, authentication, error messages)
- ✅ Performance (batch upserts, rate limiting)
- ✅ Error handling (comprehensive error types, retry logic)

## Specific Focus Areas

1. **Scraper Robustness:**
   - Does it handle blocking detection?
   - Are retries implemented correctly?
   - Is rate limiting sufficient?
   - Are all required fields extracted?

2. **API Security:**
   - Is CRON_SECRET verification correct?
   - Is input validation comprehensive (Zod)?
   - Are error messages secure (no data leakage)?
   - Is request size limiting implemented?

3. **Database Schema:**
   - Are all Phase 1 columns added correctly?
   - Are indexes created for performance?
   - Are constraints appropriate?
   - Is the enum type correct?

4. **Type System:**
   - Are types updated to match new schema?
   - Is OracleOutputSchema defined correctly?
   - Are Zod schemas comprehensive?

## Output Format

Generate a comprehensive review document following the code-review-excellence skill format:
- Executive summary
- Issues found (categorized by severity)
- Recommendations
- Positive feedback
- Verification checklist

Save the review to: etmam-docs/MVP 2.0/reviews/CODE_REVIEW_PHASE_0_1_RESULTS.md
```

---

## How to Use

1. Copy the prompt above (everything between the triple backticks)
2. Paste it into Claude Code
3. Ensure the `code-review-excellence` skill is available
4. Run the review
5. The review will be saved to `etmam-docs/MVP 2.0/reviews/CODE_REVIEW_PHASE_0_1_RESULTS.md`

---

## Expected Review Areas

- **Phase 0 Completeness:** All scraper tasks implemented correctly
- **Phase 1 Completeness:** Migration exists, types need verification
- **Code Quality:** TypeScript, error handling, security
- **Best Practices:** Next.js 16, Supabase, Playwright patterns
- **Plan Compliance:** Requirements met from the implementation plan
