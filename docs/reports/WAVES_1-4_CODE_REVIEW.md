# Deep Code Review — Waves 1–4 Implementation vs Acceptance Criteria

**Date:** 2026-02-03  
**Scope:** Waves 1–4 (Foundation, Tenders Page, Tender Detail, Opportunities)  
**Reference:** `docs/dashboard/ACCEPTANCE_CRITERIA.md`, `docs/dashboard/WORLD_CLASS_UX_PLAN.md`

---

## 1. Context & Scope Validation

### Wave 1: Foundation
| AC | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AC-1.1 | Sidebar: 3 items (Tenders, Opportunities, Settings); "Dashboard" removed; active state by route; Analytics disabled | **PASS** | `components/layout/app-sidebar.tsx`: 3 nav items, `tNav('tenders')` etc., `aria-current`, Analytics as `<span>` with `aria-disabled="true"` |
| AC-1.2 | Page title "Tenders"; subtitle dynamic counts; counts update with filters | **PASS** | `tenders-list-client.tsx`: `tTenders('title')`, `tTenders('subtitle', { count, qualified, pending })` from `kpiStats` (filtered) |

### Wave 2: Tenders Page
| AC | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AC-1.3 | TenderIngestionStrip; 48px; Get Active, Get Historic, Upload; status right; spinner/disabled; "X new tenders found" 5s | **PASS** | `tender-ingestion-strip.tsx`: strip layout, sync-latest shows count + 5s dismiss; scrape path no count (API limitation, documented) |
| AC-1.4 | Bulk bar when 1+ selected; "X selected" + Evaluate All + Create Opportunities + ✕; batch progress; ✕ clears | **PASS** | Implemented with `selectedIds`, `handleEvaluateAll`, `handleCreateOpportunities`, `clearSelection` |
| AC-1.5 | 3px left accent bar; inline View/Evaluate on hover; 150ms fade | **PASS** | `accentBarStyle` by recommendation; `.row-actions` + CSS 150ms; `prefers-reduced-motion` override present |
| AC-1.6 | Empty: icon + "No tenders yet" + guidance + [Get Active Tenders] [Upload File]; buttons trigger actions | **PASS** | `tenders.empty.*` i18n; `handleEmptyGetActive`, `UploadTenderTrigger` |

### Wave 3: Tender Detail (V2 Engine)
| AC | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AC-2.1 | 2-column panel; Actions: Run Analysis, Create Opportunity, Push to CRM; single column mobile | **PASS** | `tender-detail-grid` CSS; `@media (max-width: 900px)` single column |
| AC-2.1 V2 | Three gauges: Total, Infratech Fit, Exotech Fit; routing badge INFRATECH/EXOTECH/JOINT/NO_BID | **PASS** | `tender-detail-view.tsx`: ScoreGauge + dual-track bars + badge; tokens `--color-infratech-500`, `--color-exotech-500` |
| AC-2.2 | Button states: no eval → Run Analysis only; evaluated → Create Opportunity highlighted; pushed → badge, Push disabled | **PASS** | `RunAnalysisButton`, `isOpportunityReady`, `PushToCRMButton` with `currentStatus` |
| AC-2.3 | Tabs: Summary, Strengths, Risks, Requirements, Actions; default Summary; "No data available" | **PASS** | `evaluation-tabs.tsx`: `EvaluationTabId`, default `'summary'`, `labels.noDataAvailable` |
| AC-2.4 | 6 dimensions; tooltip; color green/amber/red; weight; Risk inverted | **PASS** | `page.tsx` v2BreakdownKeys; `score-breakdown.tsx` tooltip, tokens, risk_score bar = (100 − value)% |
| AC-2.5 | Hero red overlay ≤7 days; countdown "X days Y hours"; past = "Deadline passed" | **PASS** | `tender-hero.tsx`: urgency tokens, `countdownRemaining`, `labels.past` |
| AC-2.6 | "← Back to Tenders"; navigates to /dashboard | **PARTIAL** | Link goes to `/${locale}/dashboard`; **filters not preserved** (AC: "preserving filters (if possible)") |
| AC-2.7 | AI Price: predicted_value_sar; "AI Model Estimate" + sparkle; hierarchy Booklet → Tender → AI; >20% variance; tooltip | **PASS** | `ai-price-block.tsx`: labels, `showVariance`, `labels.tooltip`; Financials i18n |

### Wave 4: Opportunities
| AC | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AC-3.1 | Route, title "Opportunities", subtitle "{ready} ready to push • {pushed} already pushed" | **PASS** | `app/[locale]/dashboard/opportunities/page.tsx`; `tOppPage('title'|'subtitle')` |
| AC-3.2 | 3 KPI cards; same animated transitions as Tenders | **PASS** | `OpportunitiesKpiRow` with `useKpiCardVariants`, `useMotionConfig` |
| AC-3.3 | Status column: Ready (gray), Pushed (green + checkmark), Failed (red + retry) | **PASS** | Badges + `PushToCRMButton` with `pushStatus` (Retry when failed) |
| AC-3.4 | Bulk bar; "Push All to CRM"; modal "Push X opportunities to Odoo?"; progress; result + view details | **PASS** | Dialog with `pushConfirmTitleWithCount`, progress, `pushResultSummary` + View details button |
| AC-3.5 | Row actions: Ready/Pushed/Failed with Push or ✓ Pushed (disabled) + View Tender | **PASS** | `PushToCRMButton` + NextLink to detail |
| AC-3.6 | Download Excel; tooltip; Odoo_Leads_Import.xlsx | **PASS** | `download="Odoo_Leads_Import.xlsx"`, `tOppPage('downloadExcelTooltip')` |
| AC-3.7 | Empty: icon + "No opportunities yet" + guidance + [Go to Tenders] | **PASS** | `tOpp('empty'|'emptyHint'|'goToTenders')` |

---

## 2. Security

| Severity | Location | Finding | Recommendation |
|----------|----------|---------|----------------|
| **High** | `lib/queries/tender.ts` (lines 11, 20) | Outbound `fetch` to `http://127.0.0.1:7242/ingest/...` with DB/count/error data (diagnostic/agent log). Runs on every `testDatabaseConnection`; exposes internal state. | Remove or gate behind `process.env.NODE_ENV === 'development'` and an explicit feature flag. Do not ship to production. |
| Low | `actions/evaluation.ts` | `tenderId` from client passed to `getTenderById`; Supabase `.eq('id', id)` is parameterized. | No change; ensure RLS on `tenders`/`evaluations` restricts by tenant/user where applicable. |
| Low | `tender-ingestion-strip.tsx` | POST `/api/scrape`, POST `/api/scrape/sync-latest` — no CSRF beyond SameSite cookies. | Acceptable if API is protected (e.g. auth); document that scrape/sync are privileged. |

---

## 3. Performance

| Severity | Location | Finding | Recommendation |
|----------|----------|---------|----------------|
| Low | `tenders-list-client.tsx` | URL sync uses `queueMicrotask` for setState; can cause one frame of stale UI on back/forward. | Acceptable; alternative would be deriving state from `searchParams` (larger refactor). |
| Low | `tender-hero.tsx` | Countdown updates every 60s via `setInterval`; only when deadline ≤7 days. | Good; no change. |
| Low | `opportunities-list-client.tsx` | `selectedPushable` recomputed each render (filter of `selectedTenders`). | Acceptable; list size is bounded. |

---

## 4. Type Safety

| Severity | Location | Finding | Recommendation |
|----------|----------|---------|----------------|
| **Medium** | `lib/queries/tender.ts` line 58 | `(data as any[])` in `getTenders()` return mapping. | Replace with proper type: e.g. `(data as (Tender & { evaluations: Tables<'evaluations'>[] \| null })[])` or a typed select helper. |
| Low | `tender-ingestion-strip.tsx` line 84 | `(body?.error as string)` — error may be non-string. | Use `typeof body?.error === 'string' ? body.error : undefined` or a typed API contract. |
| Low | `app/[locale]/dashboard/[tenderId]/page.tsx` | `getBreakdownValueAny` uses `raw[key]`, `raw.technical_fit` with type assertions. | Already clamped 0–100; consider a small type guard for breakdown shape. |

---

## 5. Code Quality & Logic

| Severity | Location | Finding | Recommendation |
|----------|----------|---------|----------------|
| **Medium** | `components/layout/app-sidebar.tsx` | Hardcoded colors: `#153331`, `rgba(255,255,255,0.12)`, `#ffffff`, `rgba(255,255,255,0.5)`. | CC-1: Move to design tokens (e.g. `--sidebar-bg`, `--sidebar-active-bg`, `--sidebar-text`) in `styles/tokens.css` and use in sidebar. |
| **Medium** | `components/dashboard/tender-detail-view.tsx` line 261 | Fallback `'Score Breakdown'` when `tEval('breakdown')` is falsy — hardcoded English (CC-8). | Use `tEval('breakdown')` only and ensure `evaluation.breakdown` key exists in en/ar; or add a dedicated key e.g. `breakdownLabel` and use it. |
| Low | AC-2.6 | Back link targets `/${locale}/dashboard` with no query; filters are not preserved. | Document as known limitation; optional enhancement: persist filter state in sessionStorage and reapply on /dashboard, or add optional query params. |
| Low | `tenders-list-client.tsx` | `setSearch` callback depends on `recommendationFilter`, `deadlineFilter`, `sortKey`; debounced URL update. | Logic correct; ensure `setSearch` is not called with stale closure (current deps are correct). |

---

## 6. Cross-Cutting (CC) Compliance

| CC | Requirement | Status | Notes |
|----|-------------|--------|-------|
| CC-1 | Design tokens; no hardcoded colors | **Mostly pass** | Sidebar (see above); Wave 2/3/4 components use `var(--color-*|--surface-*|--text-*)`. |
| CC-2 | RTL | **PASS** | `dir={locale === 'ar' ? 'rtl' : 'ltr'}` on tables; `marginInlineStart`/`marginInlineEnd`; `.flip-rtl`; RTL CSS for evaluation card. |
| CC-3 | Accessibility | **PASS** | ARIA labels on filters, buttons, sections; `aria-current` on nav; `aria-label` on bulk bar, table, KPI; focus from Radix. |
| CC-4 | Responsive; tables card on mobile | **Partial** | Grid and filters wrap; `dashboard-table-scroll`; **no dedicated card layout for table rows on mobile** (AC: "Tables become card views on mobile"). |
| CC-5 | Loading states | **PASS** | Skeletons (TendersListSkeleton, TenderDetailSkeleton); disabled during scrape/bulk evaluate/bulk push; spinners. |
| CC-6 | Error handling | **PASS** | ErrorState; strip error + Close; push error in PushToCRMButton; bulk push result summary. |
| CC-7 | prefers-reduced-motion | **PASS** | Row actions transition override; breakdown-bar-fill and dual-track-bar-fill overrides; KPI uses `useMotionConfig`. |
| CC-8 | i18n | **Mostly pass** | One fallback "Score Breakdown" in tender-detail-view; all other strings from messages. |

---

## 7. Severity Summary

| Severity | Count | Items |
|----------|-------|--------|
| **Critical** | 0 | — |
| **High** | 1 | Diagnostic fetch in `lib/queries/tender.ts` (remove or dev-only). |
| **Medium** | 3 | Sidebar hardcoded colors (CC-1); "Score Breakdown" fallback (CC-8); `(data as any[])` in getTenders. |
| **Low** | 5 | Back link filter preservation; optional type/error tightening; CC-4 mobile card view. |

---

## 8. Executive Summary

- **Waves 1–4** are **largely aligned** with the acceptance criteria: sidebar, tenders page (ingestion strip, bulk bar, accent bars, empty state), tender detail (dual-track, AI price, 6 dimensions, tabs, deadline urgency, back link), and opportunities (3 KPI, status column, bulk push, Excel export, empty state) are implemented and match the spec.
- **Security:** One **high** finding: remove or strictly gate the diagnostic `fetch` in `lib/queries/tender.ts` so it never runs in production.
- **Type safety:** Replace `(data as any[])` in `getTenders()` with a proper type; minor tightening elsewhere.
- **Design/RTL/i18n:** Sidebar should use design tokens; one hardcoded English fallback in tender detail; RTL and accessibility are in good shape.
- **Gaps vs AC:** (1) Back to Tenders does not preserve filters (AC-2.6 “if possible”). (2) CC-4: tables do not switch to card view on mobile—only scroll/shrink.

---

## 9. Verification Checklist

- [ ] **Type-check:** `pnpm type-check` — pass (after fixing `any` in getTenders if desired).
- [ ] **Lint:** `pnpm lint` — 0 errors (pre-existing warnings in other files).
- [ ] **Manual EN:** Visit `/en/dashboard`, `/en/dashboard/[id]`, `/en/dashboard/opportunities`; verify titles, bulk actions, modals, Excel download.
- [ ] **Manual AR:** Switch to `/ar/...`; verify RTL layout and all strings in Arabic.
- [ ] **Mobile:** Resize to &lt;768px; verify layout and scroll; confirm card view for tables is missing (document or implement).
- [ ] **Security:** Remove or gate `lib/queries/tender.ts` diagnostic fetch before production.
- [ ] **Tokens:** Add sidebar tokens and replace hardcoded colors in `app-sidebar.tsx`.
- [ ] **i18n:** Replace `'Score Breakdown'` fallback with translation key in `tender-detail-view.tsx`.

---

*Review conducted against `docs/dashboard/ACCEPTANCE_CRITERIA.md` and project standards (Next.js, Supabase, TypeScript, RTL/Arabic).*
