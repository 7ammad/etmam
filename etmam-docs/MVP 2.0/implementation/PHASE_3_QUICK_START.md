# Phase 3 Quick Start: UX/UI Revamp

**Goal:** Complete facelift with production-grade design

**Skills:** frontend-design, web-design-guidelines, interaction-design, design-system-creation, vercel-react-best-practices

---

## 🎨 Design Direction

**Light Mode:** "Ministry Clean"
- White backgrounds
- Slate text
- Emerald green accents

**Dark Mode:** "Midnight Operator"
- Deep charcoal (#0f172a)
- Silver text
- Neon emerald accents

**Typography:** IBM Plex Sans Arabic

**Routing Colors:**
- INFRATECH: Cyan (#06b6d4)
- EXOTECH: Purple (#8b5cf6)
- JOINT: Gradient (cyan → purple)
- NO_BID: Gray (#6b7280)

---

## Implementation Order

1. **Task 3.1:** Smart Tender Card
   - Routing badge
   - Budget range
   - Oracle insights preview

2. **Task 3.2:** Detailed Oracle View
   - 2-column grid
   - Official data (left)
   - Oracle insights (right)

3. **Task 3.3:** Routing Dashboard
   - Kanban board
   - 4 columns (Infratech, Exotech, Joint, No Bid)

---

## Quick Commands

```bash
# Run Phase 3 verification (to be created)
pnpm verify:phase-3

# Type check
pnpm type-check

# Dev server
pnpm dev
```

---

## Key Files to Create/Update

- `components/dashboard/smart-tender-card.tsx` (NEW)
- `components/oracle/oracle-insights-panel.tsx` (NEW)
- `components/oracle/official-data-panel.tsx` (NEW)
- `components/routing/routing-kanban.tsx` (NEW)
- `app/[locale]/dashboard/tenders/[tenderId]/page.tsx` (UPDATE)
- `app/[locale]/dashboard/routing/page.tsx` (NEW)

---

**See:** `PHASE_3_SKILLS_GUIDE.md` for complete details
