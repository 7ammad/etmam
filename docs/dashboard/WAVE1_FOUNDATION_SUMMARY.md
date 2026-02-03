# Wave 1: Foundation — Implementation Summary

**Date:** 2026-02-03  
**Reference:** SESSION_STARTER_AND_QC.md, WORLD_CLASS_UX_PLAN.md, ACCEPTANCE_CRITERIA.md

---

## Completed Items

### 1. Sidebar navigation cleanup
- **Done:** Removed duplicate "Dashboard" label; sidebar shows exactly **3 main nav items**: Tenders, Opportunities, Settings.
- **Done:** "Tenders" links to `/dashboard` (and is active on `/dashboard` and `/dashboard/[tenderId]`).
- **Done:** "Opportunities" → `/dashboard/opportunities`, "Settings" → `/settings`.
- **Done:** Active state uses `pathname === dashboardHref` or `pathname.startsWith(dashboardHref + '/')` excluding opportunities.
- **Done:** Analytics placeholder added as disabled/coming soon with "(v2)" and `navigation.analytics` / `navigation.analyticsComingSoon` i18n keys.
- **Done:** `aria-current="page"` and `aria-disabled="true"` for accessibility.

### 2. Page titles / subtitles with dynamic counts
- **Tenders page:** Visible title "Tenders" and subtitle `{count} tenders • {qualified} qualified • {pending} pending` in `TendersListClient`; counts come from `kpiStats` (filtered list), so they update when filters change.
- **Opportunities page:** Visible title "Opportunities" and subtitle `{ready} ready to push • {pushed} already pushed` in `OpportunitiesListClient`; ready = not pushed, pushed = status === 'pushed'. Same header shown for empty state (0 ready, 0 pushed).
- **Dashboard:** `dashboard.pageTitle` in en/ar set to "Tenders" / "المنافسات" for consistency with visible title.

### 3. i18n keys setup
- **Done:** New namespaces/keys added in `messages/en.json` and `messages/ar.json`:
  - `navigation.analytics`, `navigation.analyticsComingSoon`
  - `tenders.title`, `tenders.subtitle`, `tenders.ingestion.*`, `tenders.bulk.*`
  - `opportunitiesPage.title`, `opportunitiesPage.subtitle`, `opportunitiesPage.pushAll`, `opportunitiesPage.status.*`
  - `settingsNav.*` (profile, crm, appearance, export, about)
  - `settingsCrm.*` (notConnected, connected, testConnection, testSuccess, testFailed)
- **Note:** Plan used `opportunities.subtitle`; existing `opportunities` has title/empty/etc. So `opportunitiesPage` was used for page-level title/subtitle to avoid overwriting.

---

## Acceptance criteria (Wave 1)

| Criterion | Status |
|-----------|--------|
| AC-1.1: Sidebar shows exactly 3 main items (Tenders, Opportunities, Settings) | ✅ |
| AC-1.1: "Dashboard" label removed | ✅ |
| AC-1.1: Active state correct by route | ✅ |
| AC-1.1: Analytics placeholder disabled/coming soon | ✅ |
| AC-1.2: Page title "Tenders" (not "Dashboard") | ✅ |
| AC-1.2: Subtitle with dynamic count, qualified, pending | ✅ |
| AC-1.2: Counts update when filters change | ✅ |
| i18n keys for tenders, opportunities, settings (Wave 1 scope) | ✅ |

---

## Flags (not 100% or pre-existing)

1. **Lint:** `pnpm lint` fails with **1 pre-existing error** in `tenders-list-client.tsx` (line 232): `react-hooks/set-state-in-effect` — setState called synchronously inside a `useEffect` (URL sync). Not introduced by Wave 1; should be fixed in a separate change.
2. **Plan vs keys:** WORLD_CLASS_UX_PLAN lists `opportunities.title` / `opportunities.subtitle`; implementation uses `opportunitiesPage.*` so existing `opportunities` keys (empty, goToTenders, etc.) are unchanged. Functionally equivalent; only key path differs.
3. **Quality gates:** `pnpm type-check` passes. Visual check in browser (EN/AR) and mobile viewport test were not run in this session; recommend manual check before QC sign-off.

---

## Files changed

- `components/layout/app-sidebar.tsx` — 3 nav items, Analytics placeholder, active logic
- `components/dashboard/tenders-list-client.tsx` — Page title + subtitle block (tenders)
- `components/dashboard/opportunities-list-client.tsx` — Page title + subtitle (with/without data)
- `app/[locale]/dashboard/page.tsx` — Comment only (visible title in client)
- `messages/en.json` — New keys (navigation, tenders, opportunitiesPage, settingsNav, settingsCrm); dashboard.pageTitle → "Tenders"
- `messages/ar.json` — Same keys in Arabic; dashboard.pageTitle → "المنافسات"

---

## Next steps (Wave 2)

- TenderIngestionStrip component  
- Bulk actions bar (wire checkboxes)  
- Table row accent bars  
- Empty state enhancement  
