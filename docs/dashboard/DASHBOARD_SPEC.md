# docs/dashboard/DASHBOARD_SPEC.md

**Status**
- Phase: 7.1
- Scope: Spec only, no implementation

**Goal**
Deliver the missing MVP requirement: a simple screen showing tenders and evaluation results, behind auth, with Stripe-standard UI polish. The MVP request explicitly requires a screen or an auto-generated report.

**Non-negotiables**
- Auth-protected dashboard routes only.
- English-only for Phase 7 dashboard UI copy and specs.
- No placeholder UI in Phase 7 implementation.
- Every displayed field must map to a confirmed data source or be labeled Unknown.
- No secret exposure in client bundle, UI logs, or network responses.

**Source-of-truth requirements**
- MVP requirements are defined in the Arabic request.
- Minimum security requirement includes protecting login data.
- Existing pipeline outputs: `data/tenders.scored.json` and `output/Odoo_Leads_Import.xlsx`.
- Dashboard routes are protected via server-side guard in layout `requireAuth()`.

---

## Information architecture

- Primary screen
  - Dashboard page: `/[locale]/dashboard`
  - Must show tenders and evaluation results in one screen.
- Secondary screen
  - Tender detail page: `/[locale]/dashboard/[tenderId]`
  - Must show evaluation detail and underlying tender data.

---

## Design targets

- Visual language
  - Neutral background, clear hierarchy, generous spacing, thin borders.
  - Components: cards, tables, badges, subtle separators, skeleton loaders.
- Interaction model
  - Fast scanning: KPIs, filters, sortable table.
  - Click-through: open tender detail from list.
  - Clear states: loading, empty, error, partial data.

---

## UI field contract

This is the UI-level contract. DB column names are allowed to differ, but must map 1:1 during implementation.

### Tender fields shown in UI
Required for the MVP CRM path:
- entity
- title
- tender number
- deadline
- estimated value
- evaluation score
- recommendation

UI additional operational fields:
- status
- createdAt
- source
- description
- raw_data viewer on detail page (if available)

Tender labels that already exist in i18n:
- entity, title, referenceNo, deadline, estimatedValue, status, description, source, createdAt

### Evaluation fields shown in UI
- score 0–100 and recommendation
- strengths, risks, summary, missingRequirements, actionItems, breakdown

Recommendation values:
- qualified
- conditional
- excluded
- notEvaluated

---

## Page spec: Dashboard `/[locale]/dashboard`

### Layout
- Top header row
  - Left: Page title "Dashboard"
  - Right: existing session user menu area, do not invent new auth UI
- Content stack
  - Section A: KPI cards row
  - Section B: Filters row
  - Section C: Tenders table

### Section A: KPI cards row
KPI set (full spec):
- Total tenders
- Qualified
- Conditional
- Excluded
- Total estimated value
- Pending evaluation (Not evaluated)
- Pushed to CRM

Phase 7D implemented subset (per docs/implementation.md): Total tenders, Qualified, Conditional, Excluded, Not evaluated, Due in 7 days, Due in 30 days. Total estimated value and Pushed to CRM are planned for a later phase.

Data requirements
- Compute KPIs from tender records and joined evaluation recommendation where present. If evaluation missing for a tender, it counts as Not evaluated. KPIs and chart are derived from the same filtered list as the table so widgets match list filters.

### Section B: Filters row
- Search input
  - Searches across: title, entity, reference number
- Recommendation filter
  - All, Qualified, Conditional, Excluded, Not evaluated
- Deadline status filter
  - All, Closing soon, Open, Past deadline
- Sort control
  - Default: created_at desc
  - Optional: deadline asc, score desc

### Section C: Tenders table
Columns, left to right:
- Entity
- Title
- Tender number
- Deadline
- Estimated value
- Score
- Recommendation
- Status

Row interaction
- Each row must provide a real Link target to `/[locale]/dashboard/[tenderId]` for accessibility and standard navigation.
- Row click may be an enhancement, but Link is the navigation source of truth.

Formatting rules
- Deadline: show date, with a small deadline chip
  - Closing soon if deadline within 7 days
  - Past deadline if deadline < today
- Estimated value: SAR currency with compact formatting
- Score: integer 0–100, display as compact visual plus text
- Recommendation: badge, if missing evaluation show "Not evaluated"

---

## Required states for Dashboard page

- Loading
  - Skeleton KPI cards and skeleton table rows
- Empty state
  - Message: "No tenders found."
  - Guidance: "Add tender data using the existing pipeline, then refresh."
  - Do not invent an upload feature in Phase 7.
- Empty filtered state
  - Message: "No tenders match your filters."
  - Action: "Clear filters"
- Error state
  - Message: "Failed to load tenders."
  - Action: "Retry"
- Partial data state
  - If evaluation missing: Score = "—" and Recommendation = "Not evaluated"

### Acceptance criteria: Dashboard page
- Logged-out users cannot view `/[locale]/dashboard`.
- Logged-in users see a single screen that lists tenders and evaluation results.
- Table renders with required columns and supports search and recommendation filtering.
- No secrets appear in the client bundle or UI logs.

---

## Page spec: Tender detail `/[locale]/dashboard/[tenderId]`

### Layout
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

### Required states for Tender detail
- Loading skeleton
- Not found
  - Message: "Tender not found."
- Error state
- Partial data
  - If evaluation missing: show "Not evaluated" and hide evaluation detail lists

### Missing fields handled
- Optional evaluation blocks only render when arrays exist and have length; list items stringify with fallback to avoid "undefined".

### Acceptance criteria: Tender detail
- User can open a tender from the dashboard table.
- Page renders even if some optional fields are null.
- Raw data is viewable without breaking layout.

---

## Phase 7 traceability to Arabic MVP request
- Screen showing tenders and evaluation results is satisfied by Dashboard list and Tender detail.
- Minimum security and protection of login data is satisfied by existing auth and protected routes.
- Editable evaluation logic remains config-driven scoring.

---

## Verification plan for Phase 7.2 and beyond
- Gate commands
  - pnpm type-check
  - pnpm verify:phase-1
  - pnpm verify:phase-2
- Minimum manual checks
  - Login, then open `/[locale]/dashboard`
  - Confirm table shows tenders and evaluation fields
  - Open a tender detail page
  - Logged-out access redirects to login
