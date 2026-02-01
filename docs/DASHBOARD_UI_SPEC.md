# Dashboard UI Spec — Phase 7A

**Scope:** Dashboard information architecture and UX wiring. Minimal design system decisions for the dashboard area.

**Phase 7.1 deliverables:** Full spec, data sources, and routes/components are in `docs/dashboard/`: `DASHBOARD_SPEC.md`, `DATA_SOURCES.md`, `ROUTES_AND_COMPONENTS.md`. This file is the shorter design reference used for the initial Phase 7A implementation; it aligns with Phase 7.1 states (loading, empty, error, partial data).

---

## 1. Overview

- **Route:** `/[locale]/dashboard` is the main dashboard page (tenders list).
- **Data source:** Supabase via `lib/queries/tender.ts` — `getTenders()` returns `TenderWithEvaluation[]`.
- **Design alignment:** Same tokens and typography as landing (`styles/tokens.css`, `app/globals.css`). Radix UI (Box, Flex, Container, Card, Text, Button, Badge) for consistency.

---

## 2. Data states

| State | When | UI |
|-------|------|-----|
| **Loading** | Page/route loading (Suspense) | Skeleton: header placeholder + list of 5 card placeholders with pulse animation. Use `app/[locale]/dashboard/loading.tsx`. |
| **Empty** | `tenders.length === 0` | Centered block: icon (e.g. FileSearch), title from `dashboard.uploadFirstTitle`, description from `dashboard.uploadFirstDescription`. No table/list. |
| **Populated** | `tenders.length > 0` | Page title (e.g. `dashboard.recentTenders`), then list of tender cards (or table rows). Each row: entity, title, reference_no, deadline, estimated_value, status; if evaluation exists: score, recommendation. Link to `/[locale]/dashboard/[tenderId]`. |

---

## 3. Scoring thresholds (reference)

From `config/scoring.config.json` — used for labels/badges only (no logic in UI):

- **qualified:** score ≥ 70
- **conditional:** 40 ≤ score < 70
- **excluded:** score < 40

Status colors (from `styles/tokens.css`): `--color-qualified`, `--color-conditional`, `--color-excluded`, `--color-pending`, `--color-evaluating`.

---

## 4. Navigation

- **Dashboard layout** includes a header consistent with landing:
  - Logo (Crown + app name) linking to `/[locale]/dashboard`
  - Nav links: Dashboard (current), Settings (`/[locale]/settings`)
  - Theme toggle, locale switcher (optional), Logout
- Same Container size and Flex patterns as `landing-header.tsx`; background and border follow tokens (`--surface-*`, `--border-default`).

---

## 5. RTL and locale parity

- All layout and alignment work for both `ar` (RTL) and `en` (LTR).
- Use logical CSS where applicable (`margin-inline-start`, `text-align: start`).
- next-intl for all copy; keys under `dashboard.*`, `common.*`, `tendersList.*` as needed.
- Fonts: `--font-arabic` for Arabic, `--font-latin` for English (already set in globals by `[lang="en"]`).

---

## 6. Tender row fields (list view)

| Field | Source | Note |
|-------|--------|------|
| Entity | `tender.entity` | |
| Title | `tender.title` | |
| Reference | `tender.reference_no` | |
| Deadline | `tender.deadline` | Format per locale (date-fns or Intl). |
| Estimated value | `tender.estimated_value` | Format as currency (e.g. SAR). |
| Status | `tender.status` | Badge with status color. |
| Score | `tender.evaluation?.score` | Only if evaluation exists; show as number 0–100. |
| Recommendation | `tender.evaluation?.recommendation` | qualified / conditional / excluded — use threshold colors. |

---

## 7. File reference

- **Types:** `types/database.ts` — `tenders` Row, `evaluations` Row.
- **Queries:** `lib/queries/tender.ts` — `getTenders()`, `TenderWithEvaluation`.
- **Config:** `config/scoring.config.json` — thresholds and weights (for labels only).
