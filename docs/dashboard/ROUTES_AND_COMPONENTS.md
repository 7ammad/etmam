# docs/dashboard/ROUTES_AND_COMPONENTS.md

**Status**
- Phase: 7.1
- Scope: Spec only, no implementation

**Goal**
Lock routes, page responsibilities, and component boundaries for Phase 7.2–7.5 implementation.

---

## Confirmed route protection boundary

Protected by auth guard:
- `/[locale]/dashboard/*`
- `/[locale]/settings/*`

This means every dashboard route listed below must rely on the existing server-side `requireAuth()` guard and must not introduce alternate auth patterns.

---

## Routes

| Route | Auth | Type | Responsibility | Acceptance |
|------|------|------|----------------|-----------|
| `/[locale]/dashboard` | Required | Server page + client table | Single screen listing tenders and evaluation results, with KPIs and filters. | Logged-out blocked; logged-in sees list; partial evaluation supported. |
| `/[locale]/dashboard/[tenderId]` | Required | Server page | Decision cockpit showing tender header, score, recommendation, and details; raw data viewer. | Loads even with missing optional fields; evaluation optional. |
| `/[locale]/settings` | Required | Existing | Not in Phase 7 scope; must remain functional. | No regression of access protection. |

Note
- This spec does not add new routes for import or uploads. The MVP request allows starting from Excel or CSV, but Phase 7 scope is explicitly the "simple screen" dashboard.

---

## Component architecture

### Component placement
- New dashboard UI components must live under:
  - `components/dashboard/`

Page files:
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/dashboard/[tenderId]/page.tsx`

This keeps the routing layer thin and the UI reusable.

---

## Components for `/[locale]/dashboard`

### 1) `DashboardHeader`
Purpose:
- Render page title and a slot for existing user/session menu.

Props:
- title: string

Acceptance:
- No new auth UI invented.

### 2) `KpiGrid`
Purpose:
- Render KPI cards row.

Inputs:
- totalTenders: number
- qualifiedCount: number
- conditionalCount: number
- excludedCount: number
- pendingEvalCount: number
- pushedCount: number
- totalEstimatedValueSar: number

Acceptance:
- KPI set matches spec.

### 3) `TendersFiltersBar`
Purpose:
- Search, recommendation filter, deadline status filter, sort.

Inputs:
- searchQuery: string
- recommendationFilter: enum including all and notEvaluated
- deadlineStatusFilter: all | closing_soon | open | past
- sortKey: created_at_desc | deadline_asc | score_desc

Acceptance:
- Search covers title, entity, reference number.

### 4) `TendersTable`
Purpose:
- Table columns and row navigation to detail page.

Inputs:
- rows: Array of `{ tender: TenderUI, evaluation?: EvaluationUI }`
- pagination: page, pageSize, total
- onPageChange: handler
- locale: string

Requirements:
- Column set matches spec.
- Row provides a real Link to detail route for accessibility.
- Partial evaluation supported: Score "—", Recommendation "Not evaluated".

Subcomponents:
- `DeadlineChip`
- `RecommendationBadge`
- `ScoreMeter`
- `EmptyState`
- `ErrorState`
- `SkeletonTable`

---

## Components for `/[locale]/dashboard/[tenderId]`

### 1) `TenderDetailHeader`
Purpose:
- Render title, entity, tender number, deadline with chip, estimated value.

Inputs:
- tender: TenderUI
- deadlineStatus: derived

### 2) `EvaluationSummaryCard`
Purpose:
- Render score, recommendation, summary.

Inputs:
- evaluation?: EvaluationUI

Behavior:
- If evaluation missing: show Not evaluated and do not render lists.

### 3) `EvaluationDetails`
Purpose:
- Render strengths, risks, missing requirements, action items.

Inputs:
- evaluation?: EvaluationUI

Behavior:
- Only render lists when arrays exist and have length.

### 4) `RawTenderDataViewer`
Purpose:
- Collapsible JSON viewer for raw_data.

Inputs:
- rawData: unknown

Acceptance:
- Raw data view must not break layout.

---

## Data fetching boundaries

Rules:
- Pages may fetch data server-side behind auth and pass into client components.
- Client components must not require secrets or service-role keys.

Evidence for auth boundary:
- Protected routes exist via `requireAuth()` in layout, and app requires Supabase env for login/dashboard.

---

## Acceptance and verification plan for Phase 7.2–7.5

Default gates before any "Done":
- pnpm type-check
- pnpm verify:phase-1
- pnpm verify:phase-2

Manual checks:
- Logged-out access to `/[locale]/dashboard` redirects to login.
- Logged-in sees dashboard list, filters work, and detail route loads.
