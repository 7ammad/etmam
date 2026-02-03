# Dashboard Tab — Implementation Plan (Figma-Aligned)

**Reference:** `docs/dashboard/figma designs.png`  
**Scope:** Dashboard tab only. All items below are **required**; nothing optional. Chart is **ignored**.

**Workflow:** Execution follows the **universal** Implementation Protocol v2.0 (`.cursor/rules/implementation-protocol.mdc`). That workflow is unchanged and applies to all projects. This document is only the **scope and task list** for the dashboard work — not a change to the protocol.

---

## Requirements (mandatory)

| # | Requirement | Detail |
|---|-------------|--------|
| 1 | Content structure | Remove Command center + Export to Odoo Excel cards from main content when tenders list is shown. Rely on header actions only. Empty state keeps clear Upload CTA. |
| 2 | Header labels | Use **“Export to CRM”** (not “Export to Odoo Excel”) in header. |
| 3 | Header button states | **Idle = normal** (default/neutral style). **Selected/active = green.** Run Analysis, Export to CRM, Upload Tenders: idle = normal; no permanent green. |
| 4 | User profile | **Image (avatar)** with **dropdown**: Account settings, Theme selector (Dark/Light), Logout. **No standalone logout icon** in header. |
| 5 | Sidebar | Sidebar background **#153331** (dark blue-green). Active nav **#3ADF97** (vibrant green). Dark Mode + label at bottom. |
| 6 | Filters | Single horizontal bar; **no card wrapper**. Search, All Recommendations, All Deadlines, Sort. Match Figma set (e.g. no Status filter if Figma omits it, or keep if needed). |
| 7 | KPI cards | Add **trend arrow** (up/down) next to delta when non-zero. 7 cards; layout 4+3 on desktop. Polished 2D icons. |
| 8 | Tender table | **Keep table as is** (columns, content). Add **pages navigator (pagination) at bottom right corner of the table** only. |
| 9 | Layout / whitespace | **No unused whitespace.** Only the size of dashboard containers; no empty useless spaces. Tighten gaps and container sizing. |
| 10 | Chart | **Ignored** — no chart changes. |

---

## Task breakdown (execute per Implementation Protocol v2.0)

### Phase 1: Content structure and header

**Subtasks**

1. **1.1 Remove tools strip from dashboard content (when tenders list shown)**  
   - Research: Confirm where `ScrapeActionsCard` and `ExportOdooCard` are rendered in `app/[locale]/dashboard/page.tsx`.  
   - Implementation: Do not render the tools strip section when `tenders.length > 0`. Keep hero (title + subtitle). Empty state: keep hero + empty message + Upload CTA (no Command center / Export cards, or one compact Upload only).  
   - QA: Type-check, lint; E2E dashboard still loads; header actions (Run Analysis, Export, Upload) still work.  
   - Acceptance: Main content shows only hero → KPI → filters → table when tenders exist. No Command center or Export card in main area.

2. **1.2 Header: “Export to CRM” and button states (idle = normal, selected = green)**  
   - Research: i18n key for “Export to CRM”; header button variants (Radix).  
   - Implementation: Add/use i18n “Export to CRM” in header. Run Analysis, Export to CRM, Upload Tenders: **idle** = default/soft (e.g. `variant="soft"` and neutral color). **Selected/active** = green (e.g. when on dashboard and “Run Analysis” is the current context, or when a modal is open — define selection rule and apply green only then).  
   - QA: Labels and styles match spec; no permanent green on idle.  
   - Acceptance: Header shows “Export to CRM”; all three buttons idle = normal; green only when selected/active.

3. **1.3 User profile: avatar image + dropdown (Account settings, Theme, Logout)**  
   - Research: Current `LogoutButton` and header right section; profile/session API for avatar (e.g. Supabase `user.user_metadata.avatar_url` or initials).  
   - Implementation: Replace standalone logout with **user avatar** (image or initials). Avatar opens a **dropdown** with: **Account settings** (link to settings), **Theme selector** (Dark / Light), **Logout**. Remove standalone logout icon/button from header.  
   - QA: Dropdown opens/closes; theme toggle and logout work; accessible (keyboard, aria).  
   - Acceptance: No standalone logout icon; profile = avatar + dropdown with Account settings, Theme (Dark/Light), Logout.

**Phase 1 gate:** All subtasks done; type-check and E2E pass; acceptance criteria met.

---

### Phase 2: Sidebar and filters

**Subtasks**

4. **2.1 Sidebar colors**  
   - Implementation: Sidebar background **#153331**. Active nav item background **#3ADF97**.  
   - QA: Visual check; contrast acceptable.  
   - Acceptance: Sidebar and active state use specified hex values.

5. **2.2 Filters: single bar, no card**  
   - Implementation: Remove Card wrapper from filters in `tenders-list-client.tsx`. Filters in a single horizontal bar (same controls: search, recommendation, deadline, sort). Remove or keep Status filter per Figma (if Figma omits it, remove).  
   - QA: Filters still work; URL sync unchanged; layout compact.  
   - Acceptance: No card around filters; single horizontal bar; no unused space.

**Phase 2 gate:** Sidebar and filters match spec; no regressions.

---

### Phase 3: KPI and table

**Subtasks**

6. **3.1 KPI: trend arrow and layout**  
   - Implementation: Add up/down arrow (or icon) next to trend text when delta is non-zero. KPI grid: 4 cards first row, 3 cards second row on desktop.  
   - QA: Trend arrow shows for non-zero delta; grid 4+3 on desktop.  
   - Acceptance: Trend arrow present when delta present; 4+3 layout on desktop.

7. **3.2 Table: pagination at bottom right of table**  
   - Implementation: **Keep table as is** (columns, content). Move or add **pagination (pages navigator) at the bottom right corner of the table** — i.e. pagination controls directly under the table, right-aligned (or in a table footer, right-aligned). Remove any duplicate pagination or ensure single pagination block, bottom right of table.  
   - QA: Pagination works; page state and URL in sync; position bottom right of table.  
   - Acceptance: Table unchanged; one pagination control at bottom right of table.

**Phase 3 gate:** KPI and table acceptance criteria met.

---

### Phase 4: Layout and whitespace

**Subtasks**

8. **4.1 No unused whitespace**  
   - Implementation: Review dashboard page and tenders-list-client: reduce redundant gaps, remove empty divs/spacing, size containers to content (e.g. `gap`, `padding`, `max-width`). Ensure hero, KPI grid, filters bar, table, and pagination use only needed space.  
   - QA: No large empty areas; layout compact and aligned with container sizes.  
   - Acceptance: No useless empty spaces; only dashboard container sizes used.

**Phase 4 gate:** Layout tight; no unused whitespace.

---

### Phase 5: QA and delivery

9. **5.1 Integration and regression**  
   - Run full type-check, lint, E2E (dashboard + critical flows).  
   - Fix any regressions.  
   - Update implementation report in `docs/reports/implementations/` with final scope (dashboard tab, no chart; user profile; button states; pagination; whitespace).

10. **5.2 Gate check**  
    - PASS/FAIL/CONDITIONAL against acceptance criteria.  
    - Document in implementation report.

---

## Acceptance criteria (summary)

- [x] Tools strip (Command center + Export card) removed from main content when tenders list is shown.
- [x] Header: “Export to CRM”; Run Analysis / Export / Upload idle = normal, selected = green.
- [x] User profile: avatar (image) + dropdown (Account settings, Theme Dark/Light, Logout); no standalone logout icon.
- [x] Sidebar: #153331 background; #3ADF97 active.
- [x] Filters: single horizontal bar, no card wrapper.
- [x] KPI: trend arrow when delta non-zero; 4+3 grid on desktop.
- [x] Table: unchanged; pagination at bottom right of table.
- [x] No unused whitespace; containers sized to content.
- [x] Chart: ignored (no chart work).

---

## Out of scope

- Chart changes (ignored).
- Table column or content changes (keep as is; only add pagination position).
- Optional or “nice-to-have” items; everything listed above is required.
