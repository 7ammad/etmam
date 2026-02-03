# Implementation Plan: Etimad → Evaluate → Opportunities → CRM

**Status:** Pre-build formal plan  
**Scope:** Full flow from tender data ingestion to push to CRM, with Tenders and Opportunities as first-class areas.  
**Verification:** Plan is grounded in the current codebase only (no legacy design docs).

---

## 1. Target workflow (source: product idea doc)

| Step | Arabic | English | UX home |
|------|--------|---------|--------|
| 1 | جلب بيانات المنافسات | Get tender data from Etimad (or Excel/CSV) | **Tenders** – data ingestion |
| 2 | تقييم كل منافسة | Evaluate each tender (score, reasons) | **Tenders** – list + single tender (enhanced) |
| 3 | إنشاء فرصة أو سجل في الـ CRM | Create opportunity, then push to CRM | **Opportunities** – list only |
| 4 | شاشة لعرض المنافسات ونتائج التقييم | Screen for tenders + evaluation | **Tenders** list + **Tender** detail |

Flow: **Get data → Evaluate (Tenders) → Create opportunities (from qualified) → Push to CRM (from Opportunities).**

---

## 2. Chain-of-verification: codebase facts

### 2.1 Data model (verified)

| Concept | Codebase | Location |
|---------|----------|----------|
| Tenders | `tenders` table: id, entity, title, reference_no, deadline, estimated_value, status, … | `types/database.ts` (tenders) |
| Tender status | `pending \| evaluating \| evaluated \| approved \| pushed \| rejected` | `types/database.ts` |
| Evaluations | `evaluations` table: tender_id, score, recommendation, summary, breakdown, … | `types/database.ts` (evaluations) |
| Recommendation | `qualified \| conditional \| excluded \| INVEST \| REVIEW \| SKIP` | `types/database.ts` |
| CRM push record | `crm_pushes`: tender_id, crm_config_id, external_id, status (pending/success/failed) | `types/database.ts` (crm_pushes) |
| Opportunity payload | `OpportunityData`: tender_id, entity, title, reference_no, deadline, estimated_value, score, recommendation, summary | `types/crm.ts` (opportunityDataSchema) |

**Verification:** There is **no** `opportunities` table. “Opportunity” is today built on the fly from tender + evaluation in `actions/crm.ts` (`pushToCRMDryRun`, `pushToCRM`). For MVP we treat “opportunity” as **a qualified tender with evaluation** (option A: view only). Push state is already on `tenders.status = 'pushed'` and `crm_pushes`.

### 2.2 Routes (verified)

| Current route | Purpose | File |
|---------------|---------|------|
| `/[locale]/dashboard` | Tender list (or empty state) | `app/[locale]/dashboard/page.tsx` |
| `/[locale]/dashboard/[tenderId]` | Single tender detail | `app/[locale]/dashboard/[tenderId]/page.tsx` |
| `/[locale]/dashboard/[tenderId]/push-success` | Post-push success | `app/[locale]/dashboard/[tenderId]/push-success/page.tsx` |
| `/[locale]/settings`, `/[locale]/settings/crm` | Settings / CRM config | existing |

**Gap:** No route for Opportunities list. Plan: add `/[locale]/dashboard/opportunities` (list only; no `/[locale]/dashboard/opportunities/[id]`). In App Router, a static segment `opportunities` takes precedence over the dynamic `[tenderId]`, so `/dashboard/opportunities` will resolve to the Opportunities page, not tender detail.

### 2.3 Server actions and API (verified)

| Action / API | Purpose | Location |
|--------------|---------|----------|
| `getTenders()` | All (non-historical) tenders with evaluation | `lib/queries/tender.ts` |
| `getTenderById(id)` | Single tender with evaluation | `lib/queries/tender.ts` |
| `pushToCRM(tenderId)` | Build OpportunityData, create in CRM, write crm_pushes, set tender status | `actions/crm.ts` |
| `pushToCRMDryRun(tenderId)` | Return payload without pushing | `actions/crm.ts` |

**Gap:** No dedicated “list opportunity-ready tenders” query. Plan: add a query (or filter) for tenders that have evaluation and recommendation in `('INVEST','REVIEW','qualified')` and optionally status not yet `pushed`, so the Opportunities page can show “opportunities” = filtered tenders.

### 2.4 UI components (verified)

| Component | Role | Location |
|-----------|------|----------|
| `TendersListClient` | List + KPIs + filters + table; currently embeds Command Center / Data Management block | `components/dashboard/tenders-list-client.tsx` |
| `TenderDetailContent` | Single tender view (hero, score, recommendation, Push to CRM) | `components/dashboard/tender-detail-content.tsx` |
| `PushToCRMButton` | Trigger push from tender detail | `components/dashboard/push-to-crm-button.tsx` |
| `DashboardHeader` | Header with Run Analysis, Export to CRM, Upload | `components/dashboard/dashboard-header.tsx` |
| `AppSidebar` | Nav: Dashboard, Tenders (same href as dashboard), Settings | `components/layout/app-sidebar.tsx` |

**Verification:** Sidebar currently has two links both pointing to `dashboardHref` (Dashboard and Tenders). Opportunities link and route do not exist.

---

## 3. Refined product decisions (user + advisor)

- **Tenders:** Dedicated **Tenders** area: list page (all tenders) + **single tender sub-page** (current detail, **enhanced**).
- **Opportunities:** **Opportunities** page = **list only** (no single opportunity sub-page). “View tender” from a row links to tender detail.
- **Data model (MVP):** Option A – no new `opportunities` table. Opportunity = qualified tender + evaluation; list = filtered view of tenders; push uses existing `pushToCRM` and `crm_pushes`.

---

## 4. Detailed specification

### 4.1 Routes and navigation

| Route | Auth | Responsibility |
|-------|------|----------------|
| `/[locale]/dashboard` | Required | **Tenders list:** KPIs, filters, table, data ingestion (get active/historic, upload). No “Opportunities” actions here. |
| `/[locale]/dashboard/[tenderId]` | Required | **Single tender (enhanced):** Full decision cockpit – header, evaluation, score, recommendation, “Create opportunity” CTA (optional), “Push to CRM”. |
| `/[locale]/dashboard/opportunities` | Required | **Opportunities list only:** Rows = opportunity-ready tenders; columns: title, entity, deadline, value, score, recommendation, push status; actions: Push to CRM, View tender. No `/opportunities/[id]`. |

**Sidebar (updated):**

- **Dashboard** → `/[locale]/dashboard` (tenders list).  
- **Tenders** → `/[locale]/dashboard` (same; or rename to “Tenders” and keep one link).  
- **Opportunities** → `/[locale]/dashboard/opportunities` (new).  
- **Settings** → `/[locale]/settings`.

Active state: Dashboard when path === `/[locale]/dashboard` and not `/[locale]/dashboard/opportunities`; Tenders when path starts with `/[locale]/dashboard/` and is not opportunities; Opportunities when path === `/[locale]/dashboard/opportunities`.

### 4.2 Tenders list page (`/[locale]/dashboard`)

- **Data:** `getTenders()` (existing). Excludes historical by `award_amount_sar` (already in `getTenders()`).
- **Layout:**  
  - Optional **Tender data** block: Get Active Tender, Get Historic Tender, Upload Tenders only (no Opportunities controls).  
  - KPI row (existing).  
  - Filters + table (existing).  
- **Row actions:** Open tender detail; optionally “Create opportunity” (navigate to Opportunities with pre-select or mark as opportunity-ready).  
- **Empty state:** Existing empty state + tools strip; no change to auth.

**Verification:** `app/[locale]/dashboard/page.tsx` currently uses `getTenders()`, empty state with `ScrapeActionsCard`, `ExportOdooCard`, `UploadTenderTrigger`; when tenders exist it renders `TendersListClient`. Plan: remove or replace any “Data Management” / “Command Center” block with a slim “Tender data” strip (ingestion only). Do not add opportunity creation UI to this page beyond an optional CTA that links to Opportunities.

### 4.3 Single tender page (`/[locale]/dashboard/[tenderId]`) – enhanced

- **Data:** `getTenderById(tenderId)` (existing).
- **Content:** Existing `TenderDetailContent` plus:
  - Clearer hierarchy and actions (Run Analysis, Create opportunity, Push to CRM).
  - “Create opportunity” = mark as opportunity-ready and/or navigate to Opportunities (or open a short confirmation that adds it to the Opportunities list view).
  - Push to CRM remains; after push, status and `crm_pushes` already updated by `pushToCRM`.
- **Enhancement:** Improve UX of score/recommendation/breakdown and CTAs; no new route.

**Verification:** `app/[locale]/dashboard/[tenderId]/page.tsx` uses `getTenderById`, passes props to `TenderDetailContent`. `PushToCRMButton` is used in tender detail. No code change to data layer for “enhanced” – only UI and optional “Create opportunity” action.

### 4.4 Opportunities list page (`/[locale]/dashboard/opportunities`) – new

- **Data:** Need a way to list “opportunity-ready” tenders. Two options (verified against DB):
  - **Option 1:** Reuse `getTenders()` and filter client-side: `evaluation != null` and `evaluation.recommendation` in `('INVEST','REVIEW','qualified')`. Optionally filter out `status === 'pushed'` for “draft” view.
  - **Option 2:** New server function `getOpportunityReadyTenders()` that runs the same query with `.in('evaluations.recommendation', ['INVEST','REVIEW','qualified'])` or equivalent (Supabase filter on joined evaluations). Prefer Option 2 for clarity and one place to define “opportunity-ready”.
- **Columns:** Tender title, entity, deadline, estimated value, score, recommendation (badge), push status (draft / pushed), actions: “Push to CRM”, “View tender” (link to `/[locale]/dashboard/[tenderId]`).
- **Filters (optional):** Status (not pushed / pushed), recommendation (INVEST / REVIEW).
- **Actions:**  
  - **Push to CRM:** Call existing `pushToCRM(tenderId)` (single or bulk).  
  - **View tender:** Navigate to `/[locale]/dashboard/[tenderId]`.
- **Empty state:** “No opportunities yet. Evaluate tenders and mark qualified ones, then they appear here.” Link to `/[locale]/dashboard`.
- **No** `/opportunities/[id]` page; no opportunity detail component beyond row content.

**Verification:** `pushToCRM(tenderId)` exists and updates tender status and `crm_pushes`. Push status for a tender can be derived from `tenders.status === 'pushed'` or from presence of a successful `crm_pushes` row for that tender.

### 4.5 Data layer additions (verified)

- **Query:** `getOpportunityReadyTenders()` in `lib/queries/tender.ts` (or a new file `lib/queries/opportunity.ts`). Returns tenders that have at least one evaluation with recommendation in `['INVEST','REVIEW','qualified']`. Join `tenders` + `evaluations`; optionally join or subquery `crm_pushes` to show “already pushed” per tender. Signature: same shape as `TenderWithEvaluation[]` or a slim DTO with tender + evaluation + push status.
- **No new table.** “Create opportunity” in UI = no DB write for MVP (opportunity = qualified tender in the list). If later we want “draft” vs “ready to push”, we can add a flag or table then.

### 4.6 Components to add or change

| Component | Action | Purpose |
|-----------|--------|---------|
| `app/[locale]/dashboard/opportunities/page.tsx` | Add | Server page: fetch opportunity-ready tenders, render Opportunities list client. |
| `OpportunitiesListClient` (or similar) | Add | Client component: table, filters, Push to CRM, View tender. |
| `AppSidebar` | Modify | Add “Opportunities” link to `/[locale]/dashboard/opportunities`; fix active state for dashboard vs tenders vs opportunities. |
| `TendersListClient` | Modify | Remove or replace Data Management / Command Center with “Tender data” only (ingestion). |
| `TenderDetailContent` / `tender-detail-view` | Modify | Enhance layout and CTAs; add “Create opportunity” (navigate or soft-add to opportunities). |
| Dashboard page | Modify | When tenders exist, stop rendering any “Command Center” that mixes opportunity actions; keep only tender ingestion tools in a slim block or in header. |

### 4.7 i18n

- **Namespace:** e.g. `opportunities` or extend `dashboard` / `navigation`.
- **Keys (examples):** `opportunitiesTitle`, `opportunitiesEmpty`, `opportunitiesEmptyHint`, `createOpportunity`, `viewTender`, `pushToCRM`, `pushStatusDraft`, `pushStatusPushed`, `tenderData` (for the ingestion block label). Add to `messages/en.json` and `messages/ar.json`.
- **Navigation:** Ensure `navigation.opportunities` exists for sidebar.

### 4.8 Edge cases and acceptance

- **Opportunities list empty:** Show empty state with link to Dashboard; no errors.
- **Tender has no evaluation:** Does not appear in opportunity-ready list (filter by evaluation + recommendation).
- **Tender already pushed:** Show “Pushed” in Opportunities list; Push to CRM disabled or show “Already pushed”.
- **RTL:** Same layout patterns as existing dashboard (dir from locale).
- **Auth:** All new routes under `/[locale]/dashboard/*`; existing `requireAuth()` in `app/[locale]/dashboard/layout.tsx` covers Opportunities.

---

## 5. Implementation phases (ordered)

### Phase 1: Data and route for Opportunities

- Add `getOpportunityReadyTenders()` (or equivalent) in `lib/queries/tender.ts` (or `lib/queries/opportunity.ts`). Return tenders with evaluation and recommendation in (INVEST, REVIEW, qualified); include push status (from `tenders.status` or `crm_pushes`).
- Add `app/[locale]/dashboard/opportunities/page.tsx`: call the new query, render a simple list (or placeholder) with correct layout/auth.
- **Acceptance:** Visiting `/[locale]/dashboard/opportunities` shows a page with opportunity-ready tenders (or empty state).

### Phase 2: Opportunities list UI

- Add `OpportunitiesListClient`: table (title, entity, deadline, value, score, recommendation, push status), “View tender” link, “Push to CRM” button per row. Optional: bulk push.
- Add empty state with copy and link to dashboard.
- Wire “Push to CRM” to existing `pushToCRM(tenderId)` (server action).
- **Acceptance:** User can see opportunity-ready tenders, open tender detail, and push from the list.

### Phase 3: Navigation and sidebar

- Update `AppSidebar`: add “Opportunities” link to `/[locale]/dashboard/opportunities`; set active state for Dashboard vs Tenders vs Opportunities so only one is active.
- **Acceptance:** Sidebar shows Opportunities; clicking it goes to Opportunities list; active state correct.

### Phase 4: Tenders page cleanup and “Tender data” block

- In `TendersListClient` (or dashboard page), remove or replace the current Data Management / Command Center section with a slim “Tender data” block: only Get Active Tender, Get Historic Tender, Upload Tenders. No Opportunities actions on this page.
- **Acceptance:** Tenders list has no mixed opportunity controls; ingestion actions remain.

### Phase 5: Tender detail enhancement

- In `TenderDetailContent` (or related components), improve hierarchy and CTAs: Run Analysis, “Create opportunity” (navigate to Opportunities or scroll to hint), Push to CRM. Improve presentation of score, recommendation, breakdown.
- **Acceptance:** Tender detail is clearer and guides user to create opportunity and push.

### Phase 6: i18n and polish

- Add all new keys (opportunities, tender data block, any new buttons). RTL and a11y for new components.
- **Acceptance:** EN/AR and a11y consistent with rest of app.

---

## 6. Summary checklist

- [ ] **Workflow:** Get data (Etimad) → Evaluate (Tenders) → Create opportunities (from qualified) → Push to CRM (from Opportunities).
- [ ] **Routes:** `/[locale]/dashboard` (tenders list), `/[locale]/dashboard/[tenderId]` (enhanced tender detail), `/[locale]/dashboard/opportunities` (list only).
- [ ] **Data:** No new table; `getOpportunityReadyTenders()` for Opportunities list; push via existing `pushToCRM` and `crm_pushes`.
- [ ] **Nav:** Sidebar includes Opportunities; active states correct.
- [ ] **Tenders page:** Tender data (ingestion) only; no Opportunities section.
- [ ] **Opportunities page:** List only; Push to CRM + View tender; empty state.
- [ ] **Tender detail:** Enhanced UX; optional “Create opportunity” CTA.
- [ ] **i18n:** New keys for opportunities and tender data block.

This plan is self-contained and verified against the current codebase. Implement in the order above for minimal rework and clear rollback points.
