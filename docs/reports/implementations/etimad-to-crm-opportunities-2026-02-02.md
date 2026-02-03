# Implementation Report: Etimad → CRM Opportunities Flow

**Date:** 2026-02-02  
**Plan:** `docs/IMPLEMENTATION_PLAN_ETIMAD_TO_CRM.md`  
**Scope:** Phases 1–6 (data, route, Opportunities list UI, sidebar, Tender data block, tender detail, i18n).

---

## Delivered

### Phase 1: Data and route for Opportunities
- `getOpportunityReadyTenders()` in `lib/queries/tender.ts`: filters tenders by evaluation recommendation (INVEST, REVIEW, qualified).
- `app/[locale]/dashboard/opportunities/page.tsx`: server page that fetches opportunity-ready tenders and renders list or empty state.

### Phase 2: Opportunities list UI
- `OpportunitiesListClient`: table (title, entity, deadline, value, score, recommendation, push status, actions); "View tender" link; `PushToCRMButton` per row; empty state with link to Tenders.
- Opportunities page uses `OpportunitiesListClient`; `pushToCRM` revalidates `/[locale]/dashboard/opportunities`.

### Phase 3: Navigation and sidebar
- `AppSidebar`: added "Opportunities" link to `/[locale]/dashboard/opportunities`; active states for Dashboard (exact), Tenders (tender detail only), Opportunities (exact), Settings.
- `navigation.opportunities` in en/ar.

### Phase 4: Tenders page – Tender data block only
- `TenderDataBlock`: ingestion only (Get Active Tender, Get Historic Tender, Stop, Upload Tenders). No Opportunities actions.
- `TendersListClient` uses `TenderDataBlock` instead of `CommandCenter` on the Tenders list page.

### Phase 5: Tender detail enhancement
- Tender detail hero: "Create opportunity" link when tender is opportunity-ready (INVEST/REVIEW/qualified); links to Opportunities page.
- Next steps card: qualified hint and "Go to Opportunities" link when opportunity-ready; existing export hint otherwise.

### Phase 6: i18n and polish
- `opportunities` namespace: title, empty, emptyHint, goToTenders, pushStatusColumn, pushStatusDraft, pushStatusPushed, actionsColumn (en/ar).
- `dataManagement`: tenderDataLabel, getActiveTender, getHistoricTender (en/ar).
- `dashboard`: nextStepsOpportunityHint, goToOpportunities (en/ar).
- Opportunities list and Tender data block use i18n; RTL respected via existing `dir`/locale patterns.

---

## Acceptance

- **Workflow:** Get data (Tender data block) → Evaluate (Tenders list + detail) → Create opportunities (qualified tenders appear on Opportunities page) → Push to CRM (from Opportunities or tender detail).
- **Routes:** `/[locale]/dashboard` (tenders), `/[locale]/dashboard/[tenderId]` (tender detail), `/[locale]/dashboard/opportunities` (list only).
- **Nav:** Sidebar shows Opportunities; active states correct.
- **Tenders page:** Tender data (ingestion) only; no Opportunities section.
- **Opportunities page:** List only; Push to CRM + View tender; empty state; i18n.
- **Tender detail:** Create opportunity CTA and next-steps hint when qualified; i18n.

---

## Files touched

- `lib/queries/tender.ts` – `getOpportunityReadyTenders()`
- `app/[locale]/dashboard/opportunities/page.tsx` – new
- `components/dashboard/opportunities-list-client.tsx` – new
- `components/dashboard/tender-data-block.tsx` – new
- `components/dashboard/tender-detail-view.tsx` – Create opportunity CTA, next steps
- `components/dashboard/tenders-list-client.tsx` – TenderDataBlock instead of CommandCenter
- `components/dashboard/index.ts` – exports
- `components/layout/app-sidebar.tsx` – Opportunities link, active states
- `actions/crm.ts` – revalidatePath opportunities
- `messages/en.json`, `messages/ar.json` – opportunities, dataManagement, dashboard keys

`CommandCenter` remains in codebase (exported) for potential reuse elsewhere; Tenders list uses `TenderDataBlock` only.

### E2E

- **crm-push.spec.ts:** "push button visible on tender detail when evaluated" was updated to navigate to tender detail via the table row link (not the first dashboard link, which could be Opportunities) and to use `.first()` on `getByTestId('push-to-crm-button')` so the assertion passes when multiple push buttons exist elsewhere (e.g. Opportunities list).
- **TenderDataBlock** uses `testId="upload-tender-button"` so existing E2E that looks for the upload button on the dashboard still finds it.
