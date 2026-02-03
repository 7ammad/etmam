# Dashboard — Remaining Implementation Checklist

**Source:** Screenshot review (light + dark modes) and codebase. Use this list so nothing is missed.

---

## 1. KPI cards

| # | Task | Status | Notes |
|---|------|--------|--------|
| 1.1 | **Trend data and directional arrows** | ❌ Missing | KPI row shows "—" because `trends` is never passed from `TendersListClient`. Arrows (↑/↓) exist in code but only show when `delta != null && delta !== 0`. Need to pass `trends` (e.g. computed or placeholder) and ensure arrows show for non-zero deltas. |
| 1.2 | **KPI card styling in dark mode** | ⚠️ Verify | In dark mode cards use `--surface-card` (#1e293b). Screenshots show cards blending with background. Ensure borders (`--border-default`) are visible and contrast (card vs ground) is clear. |
| 1.3 | **Figma typography** | ⚠️ Verify | Label: `text-xs font-bold text-slate-600`. Value: `text-3xl font-bold text-slate-900`. Trend: `text-xs`. Confirm tokens (e.g. `--color-neutral-600` / `--color-neutral-900`) and font sizes match in both themes. |

---

## 2. Header

| # | Task | Status | Notes |
|---|------|--------|--------|
| 2.1 | **Idle = neutral for all three actions** | ❌ Bug | One screenshot showed "Upload File" in green by default. All three (Run Analysis, Export to CRM, Upload File) must be neutral when idle. |
| 2.2 | **Green = selected only** | ❌ Missing | Implement logic: green only when that action is "active" (e.g. Upload when upload dialog is open; Run Analysis when on a "run analysis" context if any). When Upload dialog opens, set Upload button to green; on close, back to neutral. |
| 2.3 | **User profile: chevron** | ⚠️ Verify | Figma: "user avatar + chevron". Dropdown exists (Account settings, Theme, Logout). Add chevron-down icon next to avatar if missing. |
| 2.4 | **Header in dark mode** | ⚠️ Verify | Header bar is hardcoded `backgroundColor: '#ffffff'`. In dark mode it should use a theme-aware surface (e.g. `var(--surface-card)` or dedicated header token) so it doesn’t stay white. |

---

## 3. Light containers (each section)

| # | Task | Status | Notes |
|---|------|--------|--------|
| 3.1 | **KPI section** | ⚠️ Verify | KPI cards use `--surface-card`; in dark mode they should still read as distinct "containers" with visible border. No wrapper needed if each card is the container; ensure gap and spacing match Figma. |
| 3.2 | **Filters bar** | ✅ Done | Wrapped in section with `var(--surface-card)`, border, rounded, padding. |
| 3.3 | **Table section** | ✅ Done | One section: title bar + table + pagination, same container. |
| 3.4 | **Dark mode contrast** | ❌ Fix | Screenshots: filters/table "blend in" on dark background. Ensure in `.dark`: section borders and card background have enough contrast against `--surface-ground`. |

---

## 4. Main content area background

| # | Task | Status | Notes |
|---|------|--------|--------|
| 4.1 | **Light mode** | ✅ | `--surface-page` / page background is light (e.g. `#fafbff`). |
| 4.2 | **Dark mode** | ✅ | `.dark` sets `--surface-ground: #0f172a`, `--surface-page: #0f172a`. Dashboard page uses `dashboard-page` class (gradient with surface-page/surface-ground). Verify dashboard main area uses theme tokens so it’s not forced to a light bg in dark mode. |

---

## 5. Sidebar

| # | Task | Status | Notes |
|---|------|--------|--------|
| 5.1 | **Colors** | ✅ | #153331 bg, #3ADF97 active. |
| 5.2 | **Bottom: Dark Mode** | ⚠️ Verify | Figma: "Dark Mode" with top border. Code has `ThemeToggle` + "Dark Mode" label and `borderBlockStart`. One screenshot described "circular icon with N" at bottom — confirm that’s the theme toggle (moon/sun) and not a missing or wrong element. |

---

## 6. Table and pagination

| # | Task | Status | Notes |
|---|------|--------|--------|
| 6.1 | **Pagination at bottom right** | ✅ | Pagination is inside table section, right-aligned. |
| 6.2 | **Table structure** | ✅ | Columns/content unchanged. |

---

## 7. Layout and whitespace

| # | Task | Status | Notes |
|---|------|--------|--------|
| 7.1 | **Tight gaps** | ✅ | Page and list use `gap="3"`. |
| 7.2 | **No unused whitespace** | ⚠️ Verify | After fixing KPI trend and header states, do a final pass: no large empty areas; containers define rhythm. |

---

## 8. Implementation order (recommended)

1. **Header**
   - 2.1 + 2.2: Ensure all three buttons idle = neutral; green only when selected (e.g. Upload when dialog open). Fix header background in dark mode (2.4).
   - 2.3: Add chevron next to avatar if missing.

2. **KPI**
   - 1.1: Pass `trends` from `TendersListClient` to `DashboardKpiRow` (compute or placeholder). Ensure arrows show for non-zero deltas.
   - 1.2 + 3.4: Dark mode: borders and contrast for KPI cards and other sections.
   - 1.3: Match Figma typography if any mismatch.

3. **Dark mode**
   - 3.4 + 4.2: Contrast and tokens for main area and all "light" containers.

4. **Verify**
   - 5.2: Sidebar bottom (Dark Mode + top border).
   - 7.2: Final whitespace/layout pass.

---

## Quick reference: what was asked vs what’s done

| Asked | Done? |
|-------|--------|
| Green and Run Analysis not permanent — idle = normal | Partially (Upload sometimes green by default; logic not implemented) |
| Selected/active = green only for the active action | ❌ Not implemented |
| Tender table unchanged + pagination bottom right | ✅ |
| No unused whitespace | ✅ Gaps tightened |
| Each section in a light container | ✅ Filters + table; KPI = cards; dark contrast needs check |
| KPI: Figma card design (white, rounded-xl, p-4, hover shadow) | ✅ In CSS; dark mode contrast to verify |
| KPI: keep icons, no left accent | ✅ |
| KPI: trend arrow when delta non-zero | Code ready; **trends not passed** → always "—" |
| User profile: avatar + dropdown (Account, Theme, Logout) | ✅ Dropdown present; chevron to confirm |
| Sidebar #153331, active #3ADF97 | ✅ |
| Filters: single bar | ✅ (in light container) |
