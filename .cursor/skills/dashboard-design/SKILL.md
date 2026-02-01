---
name: dashboard-design
description: Applies industry best practices for dashboard design logic, code structure, and UX/UI. Use when designing dashboards, implementing dashboard screens or components, reviewing dashboard UX or layout, or when the user mentions dashboard design, data visualization, KPI screens, or decision-support interfaces.
---

# Dashboard Design

Apply this skill when designing, implementing, or reviewing dashboard interfaces. It covers information architecture, layout, data display, interaction patterns, and code structure aligned with industry best practices.

## When to Use

- Designing a new dashboard or dashboard section
- Implementing dashboard pages, tables, filters, or KPI blocks
- Reviewing dashboard UX, layout, or code
- User asks for "dashboard best practices", "dashboard UX", or "dashboard UI"

---

## Design Logic & Information Architecture

1. **Define the primary task**: One main job per screen (e.g. "review tenders", "monitor KPIs"). Secondary tasks live in drill-down or side panels.
2. **Progressive disclosure**: Show summary first (KPIs, counts, key metrics); detail on demand (rows, filters, detail page).
3. **Hierarchy**: Most important information top-left or top-center; supporting controls (filters, sort) nearby; secondary content below or in tabs.
4. **Scannability**: Users should get the gist in seconds. Use clear labels, consistent alignment, and visual grouping (cards, sections, subtle borders).

---

## Layout & Visual Hierarchy

- **Background**: Neutral (e.g. light gray or off-white). Avoid busy patterns that compete with data.
- **Spacing**: Generous padding and consistent gaps between sections. Avoid cramped tables.
- **Components**: Cards for KPIs or grouped metrics; tables for lists; badges for status; subtle separators between regions.
- **Typography**: Clear hierarchy (e.g. one strong page title, section headings, then body). Prefer readable sans-serif for data.
- **Density**: Prefer "default" density for tables; offer compact/comfortable if the user needs more rows on screen.

---

## Data Display

- **KPIs**: Few (3–7) per view. Number + short label; use trend or delta when relevant (e.g. vs last period).
- **Tables**: Sortable columns for key dimensions; sticky header on scroll; row hover for scan; click-through to detail.
- **Numbers**: Right-align in tables; use consistent precision and units; format large numbers (1.2M, 1,234).
- **Status**: Use semantic colors and labels (e.g. qualified / conditional / excluded). Pair color with text for accessibility.
- **Empty and partial data**: Show "No data" or "Unknown" explicitly; never leave cells blank without a defined meaning.

---

## Interaction & States

- **Loading**: Skeleton loaders or spinners for main content; avoid layout shift.
- **Empty**: Clear message and optional primary action (e.g. "No tenders yet" + "Run sync").
- **Error**: Inline or banner with short message and retry or support link.
- **Filters**: Keep active filters visible (chips or inline) and easy to clear. Persist or reflect in URL when appropriate.
- **Actions**: Primary action (e.g. "Open tender") obvious; destructive actions (delete, exclude) with confirmation.

---

## Code Structure

- **Data flow**: Fetch at layout or page level; pass down or use server components. Avoid client fetch for initial list unless required (e.g. real-time).
- **State**: URL for filters/sort when shareable or back-button matters; local state for transient UI (modals, expanded rows).
- **Components**: Reuse table, card, badge, and filter components; keep dashboard-specific logic in page or feature components.
- **Loading/error**: Co-locate loading and error UI with the same boundary that fetches the data (e.g. Suspense + error boundary).
- **No placeholders in production**: Every visible field must map to a real data source or be explicitly labeled (e.g. "Unknown", "N/A").

---

## Accessibility & Safety

- **Tables**: Proper `<table>`, `<th>`, scope, and headers so screen readers can navigate.
- **Focus**: Visible focus ring; logical tab order (filters → table → actions).
- **Color**: Do not rely on color alone for status or meaning; use text or icons as well.
- **Sensitive data**: No secrets in client bundle, UI logs, or network responses; mask or omit as per security requirements.

---

## Checklist Before Shipping

- [ ] One clear primary task per screen; drill-down for detail
- [ ] KPIs and table columns match product/spec (no unmapped placeholders)
- [ ] Loading, empty, and error states implemented
- [ ] Filters/sort usable and visible; URL or state consistent
- [ ] Tables accessible (semantic HTML, headers, focus)
- [ ] No secret or sensitive data exposed in UI or network

---

## Project Context

For this repo, dashboard behavior and field contract are defined in `docs/dashboard/DASHBOARD_SPEC.md`. Align layout, fields, and states with that spec when implementing or changing dashboard UI.

For detailed patterns (density, charts, responsive behavior), see [reference.md](reference.md) when needed.
