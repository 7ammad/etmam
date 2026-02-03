# Dashboard Tab: Figma vs Current — Required Changes

Comparison of **current dashboard** to **Figma design** (`docs/dashboard/figma designs.png`). **All items below are required (high priority).** Chart is **ignored**. Implementation plan: `docs/dashboard/IMPLEMENTATION_PLAN.md`.

---

## 1. Content structure (required)

| Figma | Current | Change |
|-------|---------|--------|
| Main content: **Dashboard title → subtitle → KPI cards → filters → table**. No “Command center” or “Export to Odoo Excel” cards in main area. | Dashboard page shows **hero → tools strip (ScrapeActionsCard + ExportOdooCard + UploadTenderTrigger)** then KPI/table/chart. | **Remove tools strip** (Command center + Export to Odoo Excel cards) from main content when tenders list is shown. Rely on header buttons only. Empty state: keep hero + empty message + Upload CTA. |

---

## 2. Header (required)

| Figma | Current | Change |
|-------|---------|--------|
| “Export to **CRM**”. | “Export to Odoo Excel” in header. | Use **“Export to CRM”** in header (i18n). |
| **Idle = normal**; **selected/active = green**. No permanent green. | Run Analysis = green solid; Export/Upload = soft/gray. | **Idle state = normal** (default/neutral style). **Selected/active = green.** Run Analysis, Export to CRM, Upload Tenders: idle = normal; green only when selected/active. |
| User: **avatar (image) + dropdown** with account settings, theme selector (Dark/Light), logout. **No standalone logout icon.** | LogoutButton (icon + “Logout” text). | **User profile:** image (avatar) with **dropdown**: Account settings, Theme selector (Dark/Light), Logout. **Remove standalone logout icon.** |

---

## 3. Sidebar (required)

| Figma | Current | Change |
|-------|---------|--------|
| Sidebar background **dark blue‑green** (#153331). Active nav **vibrant green** (#3ADF97). | Sidebar #0f172a; active #10b981. | Sidebar background **#153331**. Active nav **#3ADF97**. Dark Mode + label at bottom. |

---

## 4. KPI cards (required)

| Figma | Current | Change |
|-------|---------|--------|
| Trend: “+12%” with **directional arrow** and “vs last month”; green/red. | Trend text only. | Add **up/down arrow** (or icon) next to trend when delta non‑zero. |
| Two rows: **4 cards + 3 cards** on desktop. | Grid auto-fill. | **4+3 layout** on desktop. Polished 2D icons. |

---

## 5. Filters (required)

| Figma | Current | Change |
|-------|---------|--------|
| **Single horizontal bar** (no heavy card). Search, All Recommendations, All Deadlines, Sort by: Score. | Filters inside a **Card**. | **Remove card wrapper**; filters in a **single horizontal bar**. Match Figma set (Search, Recommendation, Deadline, Sort). |

---

## 6. Tender table (required)

| Figma | Current | Change |
|-------|---------|--------|
| Table with **pagination at bottom right** of table. | Table as is; pagination below table (left/right split with “Showing X–Y of Z”). | **Keep table as is** (columns, content). Add **pages navigator (pagination) at bottom right corner of the table** only. |

---

## 7. Layout and whitespace (required)

| Figma | Current | Change |
|-------|---------|--------|
| No unused whitespace; only container sizes. | May have extra gaps or empty space. | **No unused whitespace.** Only the size of dashboard containers; no empty useless spaces. Tighten gaps and container sizing. |

---

## 8. Chart (ignored)

Chart changes are **out of scope**. No chart work.

---

## Summary checklist (all required)

- [ ] Remove Command center + Export to Odoo Excel cards from main content when tenders list is shown.
- [ ] Header: “Export to CRM”; Run Analysis / Export / Upload **idle = normal**, **selected = green**.
- [ ] User profile: **avatar (image) + dropdown** (Account settings, Theme Dark/Light, Logout); **no standalone logout icon**.
- [ ] Sidebar: #153331 background; #3ADF97 active.
- [ ] Filters: single horizontal bar, **no card wrapper**.
- [ ] KPI: **trend arrow** when delta non-zero; **4+3 grid** on desktop.
- [ ] Table: **keep as is**; **pagination at bottom right of table**.
- [ ] **No unused whitespace**; containers sized to content.
- [ ] Chart: **ignored**.
