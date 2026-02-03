# Facelift Execution Setup (Part 0)

**Purpose:** Environment and process ready for the dashboard/tender facelift. No app code changes in this part.

---

## MCPs to Enable

Enable in **Cursor Settings → Features → MCP** (or your MCP config):

| MCP | Purpose |
|-----|--------|
| **cursor-browser-extension** | Inspect and test dashboard in a real browser (layout, RTL, interactions). |
| **user-playwright** | Browser automation (snapshots, screenshots, form fill) for regression/visual checks. |
| **user-context7** | Pull up-to-date React/Next.js/Radix docs when implementing components. |
| **Supabase** (project `mcp.json` or user-level) | Use if dashboard reads/writes Supabase; optional for UI-only work. |

---

## Skills to Reference at Start of Facelift Sessions

- **@frontend-design** — Distinctive UI; avoid generic AI aesthetics.
- **@dashboard-design** — KPIs, filters, tables, hierarchy; align with DASHBOARD_SPEC.
- **@docs/FACELIFT_PLAN.md** — Full facelift spec.
- **@.cursor/rules/rtl-arabic-ui.md** — RTL and Arabic; mandatory for this app.
- **@verification-before-completion** — No "done" without running verification and confirming output.

---

## Verification Gate

**Before claiming any part "done":**

1. Run: `pnpm exec playwright test tests/e2e/dashboard.spec.ts` (or `pnpm test` for full suite).
2. Confirm output: note pass/fail and any failures.
3. Do not claim completion without fresh verification evidence.

---

## Single Source of Truth

- **docs/FACELIFT_PLAN.md** — Full spec (with code); implementation reference.
- **docs/dashboard/DASHBOARD_SPEC.md** — Dashboard behavior and field contract.
- **docs/DASHBOARD_UI_SPEC.md** — UI spec when present.

Align all facelift work with these docs.

---

## Baseline (Part 0)

Run once at start to establish baseline:

- `pnpm type-check` — TypeScript.
- `pnpm exec playwright test tests/e2e/dashboard.spec.ts` — Dashboard E2E.

Record results below when Part 0 is executed.

| Command | Result (pass/fail) | Notes |
|---------|--------------------|-------|
| pnpm type-check | pass | |
| playwright test tests/e2e/dashboard.spec.ts | fail | 8 tests; all timeout on page.goto (localhost:3000). Run with dev server up for real E2E. |
