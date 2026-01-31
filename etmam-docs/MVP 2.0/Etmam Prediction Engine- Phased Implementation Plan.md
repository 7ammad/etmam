# 🏗️ Etmam Prediction Engine: Master Implementation Plan

**Objective:** Transform the existing Etmam CRM into an AI-Powered Prediction Engine ("The Oracle") using Vercel AI SDK \& DeepSeek.
**Core Strategy:** Automate data gathering via a "Deep Public Scraper" (Phase 0) and use a 3-Stage Reasoning Pipeline (Phase 2) to predict tender outcomes.

***

## 🛡️ CORE PROTOCOL: Coding Agent Anti-Hallucination

*Paste this into the custom instructions or top of every major prompt.*

```text
ROLE
You are a senior software architect and engineer.
Your primary goal is to provide precise, implementable code and architecture advice with zero speculative APIs or libraries.

ANTI‑HALLUCINATION RULES
- Only propose:
  - APIs that exist in Next.js 16 (App Router), Supabase v2 JS Client, and Vercel AI SDK (3.x+).
  - Patterns explicitly described in the user’s code/context.
- If you are not sure a function/class/method exists, you MUST:
  - Say "I am not certain this API exists in this version",
  - Suggest how to check the official docs or run a quick experiment,
  - Avoid fabricating method signatures or options.
- For any external dependency (SDK, npm package, API):
  - State whether you are SURE it exists (common, stable library), or UNCERTAIN.
- Prefer minimal, standard, boring solutions over clever but risky patterns.

TASK
Context: Etmam Prediction Engine (Next.js 16, Supabase, Vercel AI SDK, DeepSeek, Playwright)
User goal: Implement current phase strictly according to the plan.

PROCESS
1) Clarify Assumptions
   - List any assumptions you need (versions, environment, constraints).
2) Concrete Proposal
   - Pick the safest option (least assumptions, most standard).
   - Provide code or pseudo-code grounded in the given stack.

OUTPUT FORMAT
1) Short Answer (what to do)
2) Detailed Steps
3) Code Blocks (clearly marked as examples)
4) Assumptions & Unknowns
5) Verification Step (How to prove it works)
```


***

## 📅 Phase 0: Automated Data Gathering (The Deep Scraper)

**Goal:** Extract rich details (Price, Bond, Duration) from Etimad *without* login credentials.

### Task 0.1: Setup \& Dependencies

- [ ] Install Playwright: `npm install playwright-core chromium`.
- [ ] Create directory structure: `lib/scraper/`.
- [ ] Create `lib/scraper/types.ts` defining `ScrapedTender` interface (must match Tier 1 + Tier 2 public fields).


### Task 0.2: The "Deep" Scraper Module

- [ ] Create `lib/scraper/etimad-browser.ts`.
- [ ] Implement `scrapePublicTenders()` function:

1. **List View:** Navigate to `https://portal.etimad.sa/en-us/tenders/tenderlist`.
2. **Filter:** Select "Active Tenders" (default).
3. **Extraction:** Get list of Tender URLs.
4. **Deep Dive:** Loop through URLs (Batch size: 50).
5. **Detail Extraction:** Visit each URL and extract:
        - `Booklet Price` ("قيمة وثائق المنافسة").
        - `Initial Guarantee` ("الضمان الابتدائي") -> **CRITICAL for Budget Algo**.
        - `Duration` ("مدة العقد").
        - `Full Description`.
6. **Rate Limit:** Implement `await new Promise(r => setTimeout(r, 2000))` between visits.


### Task 0.3: Data Ingestion API

- [ ] Create `app/api/cron/sync/route.ts`.
- [ ] Logic:
    - Verify `CRON_SECRET` header.
    - Run `scrapePublicTenders()`.
    - `upsert` data into Supabase `tenders` table.
    - Return JSON summary.

**Phase 0 Verification:**

1. Run `npx tsx scripts/test-scraper.ts` (create simple test script).
2. Check console logs for "Booklet Price: 500", "Guarantee: 5.00".
3. Verify Supabase `tenders` table is populated.

***

## 📅 Phase 1: Foundation (Database \& Schema)

**Goal:** Upgrade schema to support "Oracle" insights and Scraper data.

### Task 1.1: Database Migration

- [ ] Create SQL migration `supabase/migrations/xxxx_add_oracle_schema.sql`:
    - `tenders`: Add `booklet_price_sar` (int), `initial_guarantee_sar` (decimal), `project_duration` (text).
    - `evaluations`: Add `oracle_metadata` (jsonb), `predicted_budget_min` (bigint), `predicted_budget_max` (bigint).
    - `evaluations`: Add `routing_decision` Enum (`INFRATECH`, `EXOTECH`, `JOINT`, `NO_BID`).


### Task 1.2: Type System Upgrade

- [ ] Update `types/tender.ts` to reflect new DB columns.
- [ ] Create `lib/ai/schemas.ts`: Implement `OracleOutputSchema` using Zod (matching the Architect Design).

**Phase 1 Verification:**

1. Run migration locally/remote.
2. Check Supabase Studio: new columns exist.

***

## 📅 Phase 2: The "Oracle" Pipeline (Backend)

**Goal:** Implement the 3-Stage Chain-of-Thought Logic.

### Task 2.1: AI Configuration

- [ ] Install `npm install ai @ai-sdk/openai`.
- [ ] Configure `lib/ai/provider.ts` for DeepSeek.


### Task 2.2: The Oracle Prompt

- [ ] Create `lib/ai/prompts.ts`.
- [ ] Implement `SYSTEM_PROMPT_ORACLE`.
- [ ] **Logic Update:** Add instruction to use `Initial Guarantee` if present: *"If Initial Guarantee is X%, Estimate Budget = Guarantee / (X/100)."*


### Task 2.3: Oracle Action

- [ ] Create `actions/oracle.ts`.
- [ ] Implement `runOracleEvaluation(tenderId)`.
    - Fetch tender (including new Scraper fields).
    - Check Cache.
    - Call Vercel AI SDK `generateObject`.
    - Upsert to `evaluations`.

**Phase 2 Verification:**

1. Manually trigger evaluation for a scraped tender.
2. Check DB: `oracle_metadata` contains "Inferred Scope" and "Predicted Budget".

***

## 📅 Phase 3: UX/UI Revamp

**Goal:** Visualize the Intelligence.

### Task 3.1: Smart Tender Card

- [ ] Update `components/dashboard/tender-card.tsx`.
- [ ] Add **Routing Badge** (Infratech/Exotech color-coded).
- [ ] Add **Budget Range** display (e.g., "Est. 2M - 5M SAR").


### Task 3.2: Detailed Oracle View

- [ ] Update `app/[locale]/dashboard/tenders/[id]/page.tsx`.
- [ ] **Layout:** 2-Column Grid.
- [ ] **Left:** Official Data (Price, Bond, Deadline).
- [ ] **Right:** Oracle Insights (Inferred Scope List, Reasoning, Confidence Meter).


### Task 3.3: Routing Dashboard

- [ ] Create `app/[locale]/dashboard/routing/page.tsx`.
- [ ] Kanban view: "Infratech Pipeline" vs "Exotech Pipeline".

**Phase 3 Verification:**

1. Visit Dashboard.
2. Verify Tenders show specific Routing Badges.
3. Click Tender -> Verify Oracle Insights are visible.

***

## 📅 Phase 4: Polish \& Integration

**Goal:** Reliability and Confidence Calibration.

### Task 4.1: Confidence Calibration

- [ ] UI Logic: If `Initial Guarantee` was NULL, show "⚠️ Low Confidence Estimate" on Budget.


### Task 4.2: Error Handling

- [ ] Wrap Scraper and AI calls in robust `try/catch`.
- [ ] Add "Retry" button on Dashboard for failed evaluations.

**Final E2E Test:**

1. Trigger Scraper Route (simulated cron).
2. Wait for Oracle Processing.
3. Open Dashboard -> See new tenders with Badges and Budget Estimates.
4. Verify data accuracy against Etimad screenshots.
<span style="display:none">[^1][^10][^11][^2][^3][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Etimad-Pre-Purchase-Guesstimation-Engine.md

[^2]: Infratech-and-Exotech-Comprehensive-Company-Profiles-for-Etmam-AI-Engine.md

[^3]: etimad_impl_guide.md

[^4]: etimad_field_inventory_summary.md

[^5]: Etimad-Public-Tender-Data-Automation-Options.docx

[^6]: IMPLEMENTATION_PLAN_CRM_TOOL.md

[^7]: BUILD_REPORT.md

[^8]: Architect-Level-Design_-Etmam-Prediction-Engine.md

[^9]: image.jpg

[^10]: image.jpg

[^11]: image.jpg

