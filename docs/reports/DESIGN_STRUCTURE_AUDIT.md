# Design & Structure Audit — Landing Page & Dashboard Command Center

**Date:** 2026-02-02  
**Scope:** Landing page JSX structure, Dashboard layout, Command Center placement, and missing UI components.

---

## 1. Landing Page — Current Structure

**Entry:** `app/[locale]/page.tsx` → renders `<HomeContent locale={locale} />`.

**Component:** `components/home-content.tsx`

### 1.1 Sections (in order)

| Order | Section | Component | Notes |
|-------|---------|-----------|--------|
| 0 | Header (fixed) | `LandingHeader` | Nav: logo, links, theme toggle, locale, CTA |
| 1 | Hero | `HeroSection` | Full-viewport, video BG, CTA buttons |
| 2 | How it works | `HowItWorksSection` | 3 steps (Upload → Brain → Send), id=`how-it-works` |
| 3 | Features | `FeaturesSection` | Feature grid (icons + copy from i18n) |
| 4 | FAQ | `FAQSection` | Accordion, id=`faq` |
| 5 | CTA | `CTASection` | “Start Free Today” + primary CTA |
| 6 | Footer | `Footer` | Brand, links, legal |

**Sitemap (Landing):**  
`[Locale] /` → LandingHeader (fixed) → main → Hero → How It Works → Features → FAQ → CTA → Footer

### 1.2 Hero Section — Code to Preserve

Current Hero is in `components/landing/hero-section.tsx`. Structure:

- **Wrapper:** `<Section size="4">` with full-viewport min-height, video background, dark gradient overlay.
- **Content:** `<Container size="3">` with centered flex column:
  - Badge (Crown + tagline from `t('tagline')`)
  - H1: `t('heroTitle')`
  - H2: `t('subtitle')`
  - Description: `t('heroDescription')`
  - CTAs: “Get started” (→ dashboard), “Learn more” (→ `#how-it-works`)

Full file path: **`components/landing/hero-section.tsx`** (175 lines). Preserve this file; only copy-paste of the full JSX is omitted here for brevity—the implementation is self-contained and i18n-driven.

### 1.3 Placeholder vs “Showcase” Content

- **No literal “Lorem” placeholders:** All sections use i18n keys (`landing.*`) and real copy.
- **No dedicated “Showcase” section:** There is no section explicitly named “Showcase” (e.g. product screenshots, demo strip, social proof).
- **Candidates for Showcase (if adding/restructuring):**
  - **Features** — Could be reframed or supplemented with a “Product Showcase” (screenshots, short demo, or key UI highlights).
  - **How it works** — Could be extended with a small “Showcase” block (e.g. dashboard or list screenshot) between steps or after the third step.
  - **Between Hero and How it works** — Optional new section: “See it in action” / “Showcase” (e.g. one hero image or short video of the dashboard).

**Summary:** No placeholders to remove; add or replace with “Showcase” only if you introduce a new content block or repurpose Features/How it works.

---

## 2. Dashboard — Current Layout

**Entry:** `app/[locale]/dashboard/page.tsx`  
**Layout:** `app/[locale]/dashboard/layout.tsx` → `requireAuth` + `AuthenticatedShell` (sidebar + header + main).

### 2.1 Shell (AuthenticatedShell)

- **Sidebar:** `AppSidebar` (logo “E Etmam”, nav, dark teal).
- **Main column:** `DashboardHeader` (sticky) + `<main>{children}</main>`.
- **Dashboard page (children):** Renders either empty state or tenders list; no KPI/Command Center in the page when list is shown—those live inside `TendersListClient`.

### 2.2 Dashboard Page (`dashboard/page.tsx`) — Flow

1. **DashboardViewTracker** (analytics).
2. **Conditional block:**
   - **If `tenders.length === 0`:**
     - **Tools strip** (`dashboard-tools-strip`): `ScrapeActionsCard` | `ExportOdooCard` | `UploadTenderTrigger`.
     - **Empty state:** Icon (FileSearch), “No tenders found”, guidance text, `UploadTenderForm`.
   - **If tenders exist:**
     - **EN:** `<TendersListTranslated tenders={...} />` (wrapped in Suspense).
     - **AR (or non-EN):** `<TendersListClient tenders={...} />`.

So: **Header (with tools) → [Tools strip only when empty] → Either empty state + upload form OR tenders list (KPI + filters + table).**

### 2.3 List View (inside TendersListClient / TendersListTranslated)

For **TendersListClient** (and similarly the translated list), order is:

1. **Section A:** `DashboardKpiRow` (KPI cards).
2. **Section B:** `filters-section-figma` (search, recommendation, deadline, status, sort, clear).
3. **Section C:** `table-section-figma` (title bar + table + pagination).

**Gap — Command Center:** There is **no** dedicated “Command Center” section. The spec (`docs/dashboard/COMMAND_CENTER_PROMPT.md`) asks for:

- A container **directly under the KPI row** and **above the filters bar**.
- Visible **when tenders exist** (and optionally in empty state).

Currently:

- **When list is shown:** Only Header has actions (Run Analysis link, Export, Upload). There is no block between KPI and filters.
- **When empty:** ScrapeActionsCard, ExportOdooCard, UploadTenderTrigger are shown in `dashboard-tools-strip` only.

So the **Command Center is missing** in the list view.

### 2.4 Action Check — Visible Controls

| Action | Empty state | List view (tenders exist) | Where |
|--------|-------------|---------------------------|--------|
| **Trigger Scraper** (active/historical, stop, sync from file, clear) | ✅ Yes | ❌ No | `ScrapeActionsCard` only in tools strip when empty. |
| **Generate Odoo Report (Excel)** | ✅ Yes | ✅ Yes | Empty: `ExportOdooCard`. List: `HeaderToolsStrip` “Export to CRM” button. |
| **Manual Data Upload** | ✅ Yes | ✅ Yes | Empty: `UploadTenderTrigger` + `UploadTenderForm`. List: `HeaderToolsStrip` → `UploadTenderTrigger`. |

**Summary:** Scraper controls (run active/historical, stop, sync from file, clear) are **not** visible when the user has tenders; only Export and Upload are in the header.

---

## 3. Components — Action Cards & Header Tools

### 3.1 Existing “Action” / Control Components

| Component | Purpose | Used when |
|-----------|---------|-----------|
| `ScrapeActionsCard` | Full scraper: run active/historical, stop, sync from file, clear all, status/progress | Only when `tenders.length === 0` (dashboard-tools-strip) |
| `ExportOdooCard` | Odoo Excel export, last export meta | Only when `tenders.length === 0` |
| `UploadTenderTrigger` | Opens upload flow (modal/drawer) | Empty state + **always** in `HeaderToolsStrip` |
| `HeaderToolsStrip` | Run Analysis (link), Export to CRM (button), Upload | Always in `DashboardHeader` when on dashboard |

No other “Action Card” or “Control Panel” components were found; the above are the only ones.

### 3.2 header-tools-strip.tsx — What’s There

**File:** `components/dashboard/header-tools-strip.tsx`

- **Run Analysis:** Link to `/${locale}/dashboard` (navigates to dashboard; does **not** trigger scraper).
- **Export to CRM:** Button → `GET /api/export/odoo-excel` (or similar), downloads `Odoo_Leads_Import.xlsx`.
- **Upload:** `UploadTenderTrigger` (same as manual upload).

So the header does **not** expose scraper trigger, sync-from-file, or clear; those exist only in `ScrapeActionsCard`, which is hidden when tenders exist.

---

## 4. Current Sitemap (Summary)

**Landing:**  
`/[locale]` → LandingHeader (fixed) → Hero → How It Works → Features → FAQ → CTA → Footer

**Dashboard:**  
`/[locale]/dashboard` (auth required) → Sidebar + (Header | main)  
→ main: [Tools strip **only if empty**] → Empty state **or** List (KPI → Filters → Table).  
No Command Center block in list view.

---

## 5. Missing UI for the Command Center

To “finish” the Dashboard Command Center per spec:

1. **Dedicated Command Center section**
   - **Placement:** In the **list view** only (or list + empty for consistency): directly under `DashboardKpiRow`, above `filters-section-figma`.
   - **Location:** Either:
     - In `app/[locale]/dashboard/page.tsx`: when tenders exist, render a Command Center block above the list (and pass it into the list layout), or
     - Inside `TendersListClient` (and mirrored in `TendersListTranslated`): insert the block between `DashboardKpiRow` and the filters section.

2. **Contents of the Command Center**
   - Reuse or mirror existing components so these are **visible when tenders exist**:
     - **Scraper:** Run (active), Run (historical), Stop, Sync from last file, Clear all (with confirm).  
       → Use `ScrapeActionsCard` or a slim “Command Center” strip that uses the same actions/API.
     - **Odoo report:** Generate Excel.  
       → Same behavior as `ExportOdooCard` / header “Export to CRM”.
     - **Manual upload:** Open upload flow.  
       → Same as `UploadTenderTrigger`.

3. **Optional**
   - Show the same Command Center in the **empty state** (replace or supplement the current `dashboard-tools-strip` with this single section) so one place defines “Command Center” for both states.
   - Keep header actions as shortcuts; Command Center is the main control surface under KPI.

4. **No net-new “action card” components required**
   - `ScrapeActionsCard`, `ExportOdooCard`, and `UploadTenderTrigger` already exist; the gap is **placement and visibility** when the list is shown, not missing components.

---

## 6. Next Steps (Recommendations)

1. **Landing:** Keep current structure and Hero code. Add or repurpose a “Showcase” section only if product/screenshots/demo content is defined.
2. **Dashboard:** Add a single “Command Center” container under KPI and above filters in the list view, rendering `ScrapeActionsCard`, `ExportOdooCard`, and `UploadTenderTrigger` (or a compact strip that wraps them).
3. **Consistency:** Decide whether the empty-state tools strip becomes the same Command Center block (same component/section) for both empty and list views.
