---

## Phase 7.1 Deliverables

Create these three files exactly:

* `docs/dashboard/DASHBOARD_SPEC.md`
* `docs/dashboard/DATA_SOURCES.md`
* `docs/dashboard/ROUTES_AND_COMPONENTS.md`

Below are ready-to-paste contents.

---

```md
# DASHBOARD_SPEC.md

Status
- Phase: 7.1
- Scope: Spec only, no implementation

Goal
- Deliver the missing MVP requirement: a simple screen showing tenders and evaluation results, behind auth, with a Stripe-standard UI polish. The MVP request explicitly requires a screen or an auto-generated report. :contentReference[oaicite:2]{index=2}

Non-negotiables
- Auth-protected dashboard routes only.
- English UI copy only.
- No placeholders in final Phase 7 implementation.
- Every displayed field must map to a confirmed data source or be labeled Unknown.

Source-of-truth requirements
- MVP requirements are defined in the Arabic request. :contentReference[oaicite:3]{index=3}
- Minimum security requirement is “protect login data” and restrict access. :contentReference[oaicite:4]{index=4}
- Existing pipeline outputs: `data/tenders.scored.json` and `output/Odoo_Leads_Import.xlsx`. :contentReference[oaicite:5]{index=5}
- Dashboard routes are protected via server-side guard in layout. :contentReference[oaicite:6]{index=6}

Information architecture
- Primary screen
  - Dashboard page: `/[locale]/dashboard`
    - Must show tenders and evaluation results in one screen.
- Secondary screen
  - Tender detail page: `/[locale]/dashboard/[tenderId]`
    - Must show full evaluation detail and underlying tender data.

Design system targets
- Visual language
  - Neutral background, clear hierarchy, generous spacing, thin borders.
  - Typography: strong page title, subdued supporting text.
  - Components: cards, tables, badges, subtle separators, skeleton loaders.
- Interaction model
  - Fast scanning: KPIs, filters, sortable table.
  - Click-through: row click opens tender detail.
  - Clear states: loading, empty, error, partial data.

Page spec: Dashboard `/[locale]/dashboard`

Layout
- Top header row
  - Left: Page title "Dashboard"
  - Right: Session user menu area (already exists elsewhere in app, do not invent new auth UI)
- Content stack
  - Section A: KPI cards row
  - Section B: Filters row
  - Section C: Tenders table

Section A: KPI cards row
- KPI 1: Total Tenders
- KPI 2: Qualified
- KPI 3: Conditional
- KPI 4: Excluded
- KPI 5: Total estimated value
- KPI 6: Pending evaluation
- KPI 7: Pushed to CRM

Data requirements
- These KPIs must be computed from Supabase tenders and joined evaluation recommendations where present.

Section B: Filters row
- Search input
  - Searches across: title, entity, reference number
- Recommendation filter
  - All, Qualified, Conditional, Excluded, Not Evaluated
- Deadline status filter
  - All, Closing soon, Open, Past deadline
- Sort control
  - Default: created_at desc
  - Optional: deadline asc, score desc

Section C: Tenders table
- Columns, left to right
  - Entity
  - Title
  - Tender number
  - Deadline
  - Estimated value
  - Score
  - Recommendation
  - Status
- Row interaction
  - Click row navigates to `/[locale]/dashboard/[tenderId]`
- Formatting rules
  - Deadline: show date, and a small deadline chip
    - Closing soon if deadline within 7 days
    - Past deadline if deadline < today
  - Estimated value: currency SAR with compact formatting
  - Score: integer 0–100, display as a small bar or ring with text
  - Recommendation: badge
    - qualified, conditional, excluded
    - if missing evaluation: show "Not Evaluated"

Required states for Dashboard page
- Loading
  - Skeleton KPI cards and skeleton table rows
- Empty state
  - Message: "No tenders found."
  - Guidance: "Add tender data using the existing pipeline, then refresh."
  - Do not invent an upload feature in Phase 7 unless it is explicitly implemented later.
- Error state
  - Message: "Failed to load tenders."
  - Action: "Retry"
- Partial data state
  - If evaluation is missing for a tender: show Score = "—" and Recommendation = "Not Evaluated"

Acceptance criteria: Dashboard page
- Logged-out users cannot view `/[locale]/dashboard`. :contentReference[oaicite:7]{index=7}
- Logged-in users see a single screen that lists tenders and evaluation results. :contentReference[oaicite:8]{index=8}
- Table renders with the required columns and supports search and recommendation filtering.
- No secrets appear in the client bundle or UI logs.

Page spec: Tender detail `/[locale]/dashboard/[tenderId]`

Layout
- Header block
  - Title
  - Entity
  - Tender number
  - Deadline and deadline status chip
  - Estimated value
- Evaluation block
  - Score 0–100
  - Recommendation badge
  - Summary text
- Details blocks
  - Strengths list
  - Risks list
  - Missing requirements list
  - Action items list
- Raw tender data block
  - Collapsible JSON viewer for `raw_data` where available

Required states for Tender detail
- Loading skeleton
- Not found
  - Message: "Tender not found."
- Error state
- Partial data
  - If evaluation missing: show "Not Evaluated" and hide evaluation detail lists

Acceptance criteria: Tender detail
- User can open a tender from the dashboard table.
- Page renders even if some optional fields are null.
- Raw data is viewable without breaking layout.

Phase 7 traceability to Arabic MVP request
- "Screen showing tenders and evaluation results" is satisfied by Dashboard page list and Tender detail. :contentReference[oaicite:9]{index=9}
- "Minimum security and protection of login data" is satisfied by existing route guards and server-side session enforcement. :contentReference[oaicite:10]{index=10} :contentReference[oaicite:11]{index=11}
- "Editable evaluation logic" remains the config-driven scoring pipeline already implemented. :contentReference[oaicite:12]{index=12}

Verification plan for Phase 7.2 and beyond
- Gate commands
  - pnpm type-check
  - pnpm verify:phase-1
  - pnpm verify:phase-2
- Minimum manual checks
  - Login, then open `/[locale]/dashboard`
  - Confirm table shows tenders and evaluation fields
  - Open a tender detail page
  - Logged-out access redirects to login
```

---

```md
# DATA_SOURCES.md

Status
- Phase: 7.1
- Scope: Spec only, no implementation

Goal
- Define deterministic, testable data sources for every dashboard field.
- Avoid invention: anything not proven by code or documented artifacts is labeled Unknown.

Confirmed existing artifacts and requirements
- MVP requirement calls for tender ingestion and evaluation, then CRM creation, plus a simple screen. :contentReference[oaicite:13]{index=13}
- Pipeline outputs exist:
  - `data/tenders.scored.json` :contentReference[oaicite:14]{index=14}
  - `output/Odoo_Leads_Import.xlsx` :contentReference[oaicite:15]{index=15}
- Auth and protected dashboard routes exist server-side. :contentReference[oaicite:16]{index=16}

Primary data source for Phase 7 UI
- Supabase database tables
  - `tenders`
  - `evaluations`

Data access strategy
- Server-side querying only for dashboard pages.
- Dashboard routes are already protected by `requireAuth()` in the dashboard layout. :contentReference[oaicite:17]{index=17}

Data contracts

Tender row fields used by UI
- Required for UI
  - id
  - entity
  - title
  - reference_no
  - deadline
  - estimated_value
  - status
  - created_at
  - raw_data
- Optional for UI
  - description
  - source
  - booklet_price_sar
  - initial_guarantee_sar
  - project_duration
  - award_amount_sar
  - award_date
  - winning_bidder

Evaluation row fields used by UI
- Required for UI
  - tender_id
  - score
  - recommendation
  - summary
  - model_used
  - breakdown
- Optional for UI
  - strengths
  - risks
  - missing_requirements
  - action_items
  - routing_decision
  - predicted_budget_min
  - predicted_budget_max
  - oracle_metadata

Mapping: Arabic MVP CRM fields to UI and sources
The Arabic request lists the core CRM fields. :contentReference[oaicite:18]{index=18}

- Entity
  - UI field: Entity
  - Source: tenders.entity
- Tender title
  - UI field: Title
  - Source: tenders.title
- Tender number
  - UI field: Tender number
  - Source: tenders.reference_no
- Deadline
  - UI field: Deadline
  - Source: tenders.deadline
- Estimated value
  - UI field: Estimated value
  - Source: tenders.estimated_value
- Evaluation score
  - UI field: Score
  - Source: evaluations.score
  - Fallback: None in UI, display "—" if evaluation missing
- Recommendation
  - UI field: Recommendation
  - Source: evaluations.recommendation
  - Fallback: "Not Evaluated" if evaluation missing

Mapping: rule-based scoring output to evaluation storage
- Rule-based scoring config exists and sets thresholds and weights. :contentReference[oaicite:19]{index=19}
- Rule-based scoring output includes score 0–100, recommendation, and short reasons. The demo script requires showing these in `data/tenders.scored.json`. :contentReference[oaicite:20]{index=20}

Unknowns that must be verified in Phase 7.2 before coding any importer
- Whether `data/tenders.scored.json` is already synced into Supabase `evaluations`.
- Whether "reasons" exist as a first-class field in `evaluations` or only inside `breakdown` or `summary`.

Dashboard computed fields
- Deadline status
  - Derived from tenders.deadline
- Pending evaluation
  - Derived from tenders.status and evaluation presence
- Total estimated value
  - Sum of tenders.estimated_value across fetched set

Security and data isolation notes
- Dashboard routes are protected, but data isolation between users depends on how queries are filtered or RLS is configured.
- Phase 7.2 must verify that dashboard queries do not leak other users’ tenders in multi-user scenarios.

Acceptance criteria for data sources
- Every field in the UI maps to a defined source above.
- Missing optional fields do not break rendering.
- If evaluation is missing, UI explicitly shows partial state rather than failing.
- No secrets appear client-side. :contentReference[oaicite:21]{index=21}
```

---

```md
# ROUTES_AND_COMPONENTS.md

Status
- Phase: 7.1
- Scope: Spec only, no implementation

Goal
- Define the exact route surfaces and component architecture to implement Phase 7 without redesign guesswork.

Confirmed route protection and auth behavior
- Dashboard is protected server-side in `app/[locale]/dashboard/layout.tsx` via `requireAuth()`. :contentReference[oaicite:22]{index=22}
- Protected route pattern covers `/[locale]/dashboard/*`. :contentReference[oaicite:23]{index=23}

Routes in Phase 7 scope

1) Dashboard overview and list
- Route
  - `/[locale]/dashboard`
- Responsibility
  - Render KPI row, filters, and tenders table in a single screen that satisfies the MVP requirement. :contentReference[oaicite:24]{index=24}
- Data dependencies
  - Fetch tenders and joined evaluations server-side.

2) Tender detail
- Route
  - `/[locale]/dashboard/[tenderId]`
- Responsibility
  - Decision cockpit: full evaluation detail and tender metadata.
- Data dependencies
  - Fetch a single tender with joined evaluation server-side.

Out of scope for Phase 7.1
- Any new ingestion UI for Excel or CSV.
  - The Arabic request allows starting from Excel or CSV, but Phase 7.1 does not assume an upload feature exists. :contentReference[oaicite:25]{index=25}
- Odoo API push
  - Deferred until credentials exist, Excel remains the MVP path. :contentReference[oaicite:26]{index=26}

Component architecture

Create these components in Phase 7.2
- `components/dashboard/DashboardKpiRow.tsx`
  - Props: stats object with totals, qualified, conditional, excluded, totalValue, pendingEvaluation, pushedToCRM
- `components/dashboard/StatCard.tsx`
  - Props: label, value, sublabel optional
- `components/dashboard/TenderFilters.tsx`
  - Props: current filter state, callbacks
  - Controls: search, recommendation filter, deadline status, sort
- `components/dashboard/TendersTable.tsx`
  - Props: array of tenders with evaluation data
  - Columns as defined in DASHBOARD_SPEC.md
- `components/dashboard/RecommendationBadge.tsx`
  - Props: recommendation or "not_evaluated"
- `components/dashboard/ScoreViz.tsx`
  - Props: score number or null
- `components/dashboard/DeadlineChip.tsx`
  - Props: deadline string
- `components/dashboard/EmptyState.tsx`
- `components/dashboard/ErrorState.tsx`
- `components/dashboard/Skeletons.tsx`

Tender detail components
- `components/dashboard/TenderHeader.tsx`
- `components/dashboard/EvaluationPanel.tsx`
- `components/dashboard/EvaluationLists.tsx`
- `components/dashboard/RawDataViewer.tsx`

Data access modules

Confirmed by Phase 6 review report
- `lib/queries/tender.ts` exists and uses service client server-side. :contentReference[oaicite:27]{index=27}
- `lib/queries/evaluation.ts` exists. :contentReference[oaicite:28]{index=28}

Phase 7.2 must use only server-side data fetching
- Dashboard page and tender detail page must be server components or use server actions for data fetching.
- Client components are allowed for filters and table interactions, but must receive data as props and never access service role keys.

Acceptance criteria for routes and components
- `/[locale]/dashboard/*` remains protected by server-side guard. :contentReference[oaicite:29]{index=29}
- Components cover all required page sections and states defined in DASHBOARD_SPEC.md.
- No component imports server-only Supabase service client into client bundles. :contentReference[oaicite:30]{index=30}

Verification plan for Phase 7.2+
- Commands
  - pnpm type-check
  - pnpm verify:phase-1
  - pnpm verify:phase-2
- Manual smoke checks
  - Logged-out user cannot access `/[locale]/dashboard`
  - Logged-in user sees table with tenders and evaluation fields
  - Tender detail loads for a valid tender id
  - Empty and error states render without crashes
```

---

## Phase 7.2+ Verification Plan Only

No implementation in this session. When you start Phase 7.2, the first verification step should be:

* Confirm dashboard route protection is still enforced by `requireAuth()` in dashboard layout. 
* Confirm the dashboard uses server-side data access and that no secrets reach the client bundle. 
* Run gates after each small task:

  * `pnpm type-check`
  * `pnpm verify:phase-1`
  * `pnpm verify:phase-2` 

[1]: https://chatgpt.com/c/696e9233-4c34-8329-9f0a-52e9a6648285 "App Review and Plan"
[2]: https://chatgpt.com/c/697e0b6c-5648-8395-90de-61f8d9bbef46 "MVP Requirements Definition"
[3]: https://chatgpt.com/c/692b13d5-49c0-8333-b7dd-b0ce5380a3c1 "Event manager tab shell"
[4]: https://chatgpt.com/c/692a2b1f-c6b8-8329-8c37-61b90f110c84 "Persona dashboard redesign"
[5]: https://chatgpt.com/c/679f9d73-055c-8009-9086-9243156b56a6 "SkillSurge.com Project Inquiry"
[6]: https://chatgpt.com/c/69300469-eea8-832c-a526-2cffddbbb794 "Landing page comparison"
[7]: https://chatgpt.com/c/693460dc-eaf4-832c-be75-6238516a1ccd "Restore Arabic system prompt"
[8]: https://chatgpt.com/c/68964e51-8904-832c-a2ff-ddfaa660fb68 "Resume chat session"
[9]: https://chatgpt.com/c/6931b8ab-bfe0-8325-8070-5e912ab46aeb "Branch · Pict- HeavyAI"
[10]: https://chatgpt.com/c/66ebd003-c244-8009-99c2-f10c86a004a7 "GPS Data Plan Advice"
[11]: https://chatgpt.com/c/6958729c-3254-8329-b6a8-529446b39ac0 "Brand Strategy for MTM"
[12]: https://chatgpt.com/c/695e09a7-a954-832a-af8e-6a345dc96d67 "Building Practice Enhancements"
[13]: https://chatgpt.com/c/69298cb1-fd50-832e-bb05-96c6784d4e79 "Review and validate report"
