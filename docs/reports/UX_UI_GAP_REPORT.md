# UX/UI Gap Report — Dashboard & Frontend Audit

**Date:** 2026-02-02  
**Scope:** Visibility of new backend data (dual-track, predicted value, routing), feedback states, layout/responsiveness, actionability.

---

## 1. Visibility of New Data — UI Gaps

| Backend field | Displayed? | Where (if any) | Gap? |
|---------------|------------|----------------|------|
| **infratech_score** | ❌ No | — | **UI GAP** |
| **exotech_score** | ❌ No | — | **UI GAP** |
| **predicted_value_sar** | ❌ No | Value display uses `predicted_budget_min/max` only (via `getEffectiveValueDisplay`). `predicted_value_sar` (single SAR from booklet/value estimator) is never shown. | **UI GAP** |
| **value_method** | ❌ No | — | **UI GAP** |
| **routing_decision** | ❌ No | Stored in DB and used in actions; not shown in list or detail. | **UI GAP** |
| **work_type** | ❌ No | — | **UI GAP** |

**What is shown today**

- **List:** `score`, `recommendation` (INVEST/REVIEW/SKIP badge), effective value from `predicted_budget_min/max` or `estimated_value`.
- **Detail:** `ScoreGauge` (overall score + recommendation), `ScoreBreakdownList` built from `ev.breakdown` (budget_fit, technical_fit, timeline_fit, strategic_fit, risk_score). No infratech/exotech or routing/work_type/value_method.

**Conclusion:** Dual-track scores (`infratech_score`, `exotech_score`), single predicted value (`predicted_value_sar`), value method label (`value_method`), routing decision (`routing_decision`), and work type (`work_type`) are **not visible** anywhere. These are **UI gaps** relative to the new backend.

---

## 2. Feedback States (Loading / Empty)

| Item | Status | Location |
|------|--------|----------|
| **loading.tsx** | ✅ Present | `app/[locale]/dashboard/loading.tsx` — skeleton (KPI cards, filters, table). |
| **Empty state** | ✅ Present | `app/[locale]/dashboard/page.tsx`: when `tenders.length === 0`, shows icon, `noTendersFound`, `emptyGuidance`, and `UploadTenderForm`. |
| **Detail loading** | ✅ Present | `app/[locale]/dashboard/[tenderId]/loading.tsx` exists (sibling to detail page). |
| **List empty (filtered)** | ✅ Present | `tenders-list-client.tsx`: "noMatchingTenders" + Clear filters when `pageItems.length === 0` and filters active. |

No gap for loading/empty feedback.

---

## 3. Responsiveness & Layout

| Item | Status | Details |
|------|--------|--------|
| **Sidebar / navigation** | ✅ Present | `AuthenticatedShell` uses `AppSidebar` (Dashboard, Tenders, Settings). Fixed width 240px; dark teal. |
| **Main layout** | ✅ | Header + main content; `main` has `overflowX: 'auto'` and padding. |
| **Tables / grids** | ⚠️ Scroll, not break | List uses Radix `Table` inside `Box className="dashboard-table-scroll"`. `app/globals.css`: `.dashboard-table-scroll { overflow: auto; }` with min-widths on columns — **horizontal scroll** on narrow viewports. No card/stack layout for mobile; table does not “break” into cards. |
| **RTL** | ✅ | Layout and table support RTL (e.g. `dir={locale === 'ar' ? 'rtl' : 'ltr'}`; RTL rules in globals.css). |

**Conclusion:** Layout and sidebar are in place. Tables are responsive in the sense that they scroll horizontally on small screens; there is no mobile-specific card layout for the list.

---

## 4. Actionability

| Item | Status | Location |
|------|--------|----------|
| **Push to CRM** | ✅ Visible | `PushToCRMButton` in **tender detail** only (`tender-detail-view.tsx` hero actions). Not on list rows. |
| **Run Analysis** | ✅ Visible | `RunAnalysisButton` on detail; header has "Run analysis" link to dashboard. |
| **Recommendation indicator** | ✅ Visible | **List:** `Badge` per row (INVEST = green, REVIEW = amber, SKIP = red, notEvaluated = gray). **Detail:** `ScoreGauge` with recommendation label (invest/review/skip). |
| **Export to CRM (list)** | ✅ | Header tools: "Export to CRM" (Odoo Excel) and Upload; list has no per-row Push to CRM. |

**Conclusion:** "Push to CRM" and recommendation (Recommended vs Excluded) are present and visible; Push to CRM is detail-only, not on list rows.

---

## 5. Files to Update to Show New Data

To surface the new backend fields, update (or add) as follows.

| Priority | File | Change |
|----------|------|--------|
| **1** | `app/[locale]/dashboard/[tenderId]/page.tsx` | Pass `ev?.infratech_score`, `ev?.exotech_score`, `ev?.predicted_value_sar`, `ev?.value_method`, `ev?.routing_decision`, `ev?.work_type` into `TenderDetailContent` (or extend the content props). |
| **2** | `components/dashboard/tender-detail-content.tsx` | Accept and forward dual-track and value-method/routing/work_type props to `TenderDetailView`. |
| **3** | `components/dashboard/tender-detail-view.tsx` | **Display:** (a) Infratech / Exotech scores (e.g. two small gauges or rows in the evaluation card, or extend `ScoreBreakdownList`). (b) `predicted_value_sar` when present (e.g. "Predicted value: X SAR" with `value_method` label). (c) `routing_decision` (e.g. badge: INFRATECH / EXOTECH / JOINT / NO_BID). (d) `work_type` (e.g. text or badge: Commodity | General IT | Core Infra | Emerging Tech). |
| **4** | `components/dashboard/score-breakdown.tsx` (or new component) | Option A: Add optional rows for Infratech score and Exotech score. Option B: New "Dual-track" block in detail that shows `infratech_score` and `exotech_score` with labels. |
| **5** | `lib/display-ev.ts` (optional) | If product wants to prefer `predicted_value_sar` over min/max when present, extend `getEffectiveValueDisplay` to accept `predicted_value_sar` and use it when set; then list and detail will show it via existing value UI. |
| **6** | `components/dashboard/tenders-list-client.tsx` (optional) | Add optional column or badge for `routing_decision` (e.g. INFRATECH/EXOTECH) and/or show `predicted_value_sar` in value column when available (requires display-ev change). |

**Suggested order:** Implement detail view (1–4) so Infratech/Exotech, predicted value, value method, routing, and work type are visible on the tender detail page; then consider list column (6) and display-ev (5) if needed.

---

## 6. Summary

| Aspect | Status | Notes |
|--------|--------|--------|
| **New data visibility** | ❌ Gaps | infratech_score, exotech_score, predicted_value_sar, value_method, routing_decision, work_type not shown. |
| **Loading / empty** | ✅ | loading.tsx and empty states in place. |
| **Layout / sidebar** | ✅ | Sidebar + header + main; responsive padding. |
| **Tables** | ⚠️ | Horizontal scroll on small screens; no mobile card layout. |
| **Push to CRM / recommendation** | ✅ | Push to CRM on detail; INVEST/REVIEW/SKIP visible in list and detail. |

**Exact files to update to show new data:**  
`app/[locale]/dashboard/[tenderId]/page.tsx` → `components/dashboard/tender-detail-content.tsx` → `components/dashboard/tender-detail-view.tsx` (+ optional `score-breakdown.tsx` or new dual-track block). Optionally: `lib/display-ev.ts`, `components/dashboard/tenders-list-client.tsx`.
