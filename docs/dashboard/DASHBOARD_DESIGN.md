# Dashboard Design — Precision Operator

**Aligned with:** frontend-design skill, web-design-guidelines, DASHBOARD_SPEC.

---

## 1. Aesthetic direction

- **Name:** Precision Operator  
- **Tone:** Refined, clear hierarchy, operator-style (Stripe-style polish). Not generic “AI dashboard” — use the existing design system (tokens.css: Emerald primary, Slate neutrals, semantic status colors).
- **Differentiation:** One cohesive system: typography (Cairo / Noto Kufi Arabic), surfaces (--surface-page, --surface-card), shadows (--shadow-card), and primary (emerald) used consistently. No mixing Radix iris/gray where the system defines primary/surfaces.

---

## 2. Design system usage (must)

| Element | Use | Avoid |
|--------|-----|--------|
| **Primary / brand** | `--color-primary-*`, `--text-link` | Radix `--iris-*`, `--accent-*` for brand |
| **Surfaces** | `--surface-page`, `--surface-card`, `--surface-raised` | Raw `--gray-a2`, `#f5f5f5` |
| **Text** | `--text-primary`, `--text-secondary`, `--text-tertiary` | Radix `--gray-11` / `--gray-12` unless mapped in tokens |
| **Borders** | `--border-default`, `--radius-card` | Ad‑hoc gray borders |
| **Shadows** | `--shadow-card`, `--shadow-sm` | Inconsistent shadows |
| **Status** | `--color-qualified-*`, `--color-conditional-*`, `--color-excluded-*` | Hardcoded hex for status |
| **Typography** | `--font-latin` / `--font-arabic`, `--text-*` scale | Generic system fonts |

---

## 3. Layout (per DASHBOARD_SPEC)

- **Top:** Header row — left: page title **“Dashboard”**; right: existing session/user menu (DashboardHeader).
- **Content stack:**
  1. **Section A — KPI cards row:** Total tenders, Qualified, Conditional, Excluded, Not evaluated, Due 7d, Due 30d. Use StatCards with optional icon + semantic accent (e.g. qualified = primary green, excluded = error tint).
  2. **Section B — Filters row:** Search, Recommendation filter, Status filter, Sort. Clear grouping, adequate spacing.
  3. **Section C — Tenders table:** Contained in a single card-style block (e.g. `--surface-card`, `--shadow-card`, `--radius-card`). Columns per spec; row = link to detail; subtle row hover (e.g. `--transition-colors`, light background change).
- **Export:** Compact strip or card above Section A, using design tokens (not raw gray-a2).

---

## 4. Motion and polish

- **Loading:** Skeleton KPI row (multiple stat-shaped placeholders) + skeleton table rows (e.g. 5–8 rows with pulse). Use `--surface-muted` or token-aligned skeleton color + existing `animate-pulse`.
- **Content reveal:** Optional staggered fade/slide for Section A → B → C (e.g. `animation-delay` with `fadeInUp` from animations.css). One coordinated reveal is enough.
- **Table:** Row hover transition (`transition: background-color`, ~150ms). No heavy animation.

---

## 5. Accessibility and UX

- Per web-design-guidelines: semantic structure, focus states, ARIA where needed (e.g. search, filters).
- Empty/error states per DASHBOARD_SPEC: clear copy, single primary action (e.g. Retry, Clear filters).
- Table: each row has a proper link to `/[locale]/dashboard/[tenderId]`; clickable area and focus visible.

---

## 6. What we fix from current implementation

1. **Header:** Replace iris gradient with primary (emerald) so brand matches tokens.
2. **Page structure:** Add explicit “Dashboard” title; order content as Section A (KPIs) → Section B (filters) → Section C (table); Export in a token-styled strip/card.
3. **StatCards:** Add semantic accent (and optional icon) per KPI type using `--stat-icon-*` / `--color-*`.
4. **Table container:** Wrap table in a card block using `--surface-card`, `--shadow-card`, `--radius-card`; add row hover.
5. **Loading:** Skeleton KPI row + skeleton table rows instead of generic card list.
6. **Tokens everywhere:** Replace Radix gray/iris/accent with design tokens in dashboard header, export card, and list client.

---

*This doc is the single reference for dashboard UI so the result is one coherent, spec-compliant, and skill-aligned design.*
