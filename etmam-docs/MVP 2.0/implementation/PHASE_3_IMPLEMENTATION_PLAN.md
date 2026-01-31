# Phase 3 Implementation Plan: UX/UI Revamp

**Goal:** Complete facelift of the entire UX/UI with production-grade design

**Status:** 📋 Ready for implementation

---

## 🎨 Design Vision

### Aesthetic Direction

**Light Mode: "Ministry Clean"**
- Clean, professional government contractor aesthetic
- White backgrounds with subtle textures
- Slate text (#475569, #64748b)
- Emerald green accents (#22c55e) - Saudi flag inspired
- Generous white space
- Refined, minimal but not sterile

**Dark Mode: "Midnight Operator"**
- Deep charcoal backgrounds (#0f172a, #1e293b)
- Silver text (#cbd5e1, #e2e8f0)
- Neon emerald accents (#10b981, #34d399)
- High contrast for readability
- Professional, modern tech aesthetic

**Typography:**
- Primary: IBM Plex Sans Arabic (already configured)
- Display: Consider adding a distinctive Arabic-compatible display font
- Avoid: Inter, Roboto, Arial, system fonts

**Routing Color System:**
- **INFRATECH:** Cyan (#06b6d4, #0891b2) - Infrastructure/cybersecurity
- **EXOTECH:** Purple (#8b5cf6, #7c3aed) - AI/software/innovation
- **JOINT:** Gradient (cyan → purple) - Combined capabilities
- **NO_BID:** Gray (#6b7280, #4b5563) - Not suitable

---

## 📋 Task Breakdown

### Task 3.1: Smart Tender Card ⭐⭐⭐

**File:** `components/dashboard/smart-tender-card.tsx` (NEW)

**Skills Required:**
- `frontend-design` - Bold aesthetic, distinctive typography
- `interaction-design` - Microinteractions, loading states
- `vercel-react-best-practices` - Performance optimization
- `mobile-first-design` - Responsive card layout

**Features to Implement:**

1. **Routing Badge Component** (`components/oracle/routing-badge.tsx`)
   ```typescript
   interface RoutingBadgeProps {
     routingDecision: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID'
     size?: 'sm' | 'md' | 'lg'
   }
   ```
   - Color-coded per routing decision
   - Icon + text combination
   - Hover effect with elevation change
   - RTL-aware icon flipping

2. **Budget Range Component** (`components/oracle/budget-range.tsx`)
   ```typescript
   interface BudgetRangeProps {
     min: number
     max: number
     calculationMethod: 'INITIAL_GUARANTEE' | 'ESTIMATED_VALUE' | 'INFERRED' | 'HYBRID'
     confidence?: number
   }
   ```
   - Format: "Est. 2M - 5M SAR" or "2,000,000 - 5,000,000 SAR"
   - Show calculation method badge
   - Confidence indicator (warning if <70%)
   - Large, prominent display

3. **Oracle Insights Preview** (within card)
   - Inferred scope count: "5 scope items identified"
   - Confidence meter: Visual gauge (0-100%)
   - Quick preview of top 2-3 scope items

4. **Card Enhancements:**
   - Hover: Subtle elevation change (shadow-lg)
   - Loading: Skeleton loader while Oracle evaluation runs
   - Animation: Staggered reveal on list load
   - RTL: Logical properties, auto-flipping icons

**Implementation Steps:**

1. Read `frontend-design` skill for aesthetic direction
2. Create routing badge component with color system
3. Create budget range component with formatting
4. Enhance existing tender card or create new smart card
5. Add Oracle insights preview section
6. Implement hover effects and animations
7. Test RTL support
8. Optimize with React.memo and CSS animations

---

### Task 3.2: Detailed Oracle View ⭐⭐⭐

**File:** `app/[locale]/dashboard/tenders/[tenderId]/page.tsx` (UPDATE)

**Skills Required:**
- `frontend-design` - 2-column layout, visual hierarchy
- `responsive-web-design` - Grid layout, breakpoints
- `design-system-creation` - Consistent spacing, typography
- `interaction-design` - Expandable sections, loading states

**Layout Structure:**

```
┌─────────────────────────────────────────────────────┐
│  Tender Detail: [Title]                             │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│  OFFICIAL DATA       │  ORACLE INSIGHTS             │
│  (Left Column)       │  (Right Column)              │
│                      │                              │
│  • Entity            │  • Inferred Scope List       │
│  • Reference No      │    (Expandable)              │
│  • Deadline          │  • Reasoning Chain            │
│  • Estimated Value   │    (3 stages)                 │
│  • Booklet Price     │  • Confidence Meter           │
│  • Initial Guarantee │  • Budget Prediction          │
│  • Project Duration  │  • Routing Decision          │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
```

**Components to Create:**

1. **OfficialDataPanel** (`components/oracle/official-data-panel.tsx`)
   - Clean, factual data display
   - Typography hierarchy
   - Consistent spacing
   - RTL-aware layout

2. **OracleInsightsPanel** (`components/oracle/oracle-insights-panel.tsx`)
   - **Inferred Scope List:**
     - Expandable/collapsible sections
     - Each item: Category, Description, Confidence score
     - Visual confidence indicator per item
   - **Reasoning Chain:**
     - Display 3 stages with icons
     - Show calculation method
     - Display calculation notes
   - **Confidence Meter:**
     - Visual gauge (circular or linear)
     - Color coding: High (green), Medium (yellow), Low (red)
   - **Budget Prediction:**
     - Large, prominent display
     - Calculation method badge
     - Warning if low confidence
   - **Routing Decision:**
     - Large routing badge
     - Primary reasoning text

**Implementation Steps:**

1. Read `frontend-design` and `responsive-web-design` skills
2. Create 2-column grid layout (CSS Grid)
3. Build OfficialDataPanel component
4. Build OracleInsightsPanel with all sections
5. Implement expandable sections (use React state)
6. Add loading states for data fetching
7. Test responsive breakpoints (mobile: stack, desktop: side-by-side)
8. Verify RTL support (columns swap in RTL)

---

### Task 3.3: Routing Dashboard ⭐⭐

**File:** `app/[locale]/dashboard/routing/page.tsx` (NEW)

**Skills Required:**
- `frontend-design` - Kanban board design
- `kpi-dashboard-design` - Dashboard layout, metrics
- `vercel-react-best-practices` - Virtualization, performance
- `interaction-design` - Card interactions, empty states

**Kanban Structure:**

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ INFRATECH    │ EXOTECH      │ JOINT        │ NO BID       │
│ Pipeline     │ Pipeline     │ Ventures     │              │
│ (Cyan)       │ (Purple)     │ (Gradient)   │ (Gray)       │
│              │              │              │              │
│ [Card]       │ [Card]       │ [Card]       │ [Card]       │
│ [Card]       │ [Card]       │              │              │
│ [Card]       │              │              │              │
│              │              │              │              │
│ Count: 12    │ Count: 8     │ Count: 2     │ Count: 3     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Components to Create:**

1. **RoutingKanban** (`components/routing/routing-kanban.tsx`)
   - 4-column grid layout
   - Color-coded column headers
   - Filtered tender cards per column
   - Empty states per column

2. **RoutingColumn** (`components/routing/routing-column.tsx`)
   - Column header with count
   - Card list
   - Empty state component
   - Loading state

3. **Query Function** (`lib/queries/tender.ts`)
   - `getTendersByRouting()` - Filter tenders by routing_decision
   - Efficient database query with indexes

**Implementation Steps:**

1. Read `frontend-design` and `kpi-dashboard-design` skills
2. Create database query function for routing filtering
3. Build RoutingKanban component (4 columns)
4. Build RoutingColumn component (reusable)
5. Reuse SmartTenderCard in columns
6. Implement empty states per column
7. Add performance optimizations (content-visibility, memoization)
8. Test responsive layout (mobile: stack columns)

---

## 🎨 Design System Implementation

### Design Tokens

Create/update `app/globals.css`:

```css
:root {
  /* Routing Colors */
  --color-infratech: #06b6d4;
  --color-infratech-dark: #0891b2;
  --color-exotech: #8b5cf6;
  --color-exotech-dark: #7c3aed;
  --color-joint: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
  --color-no-bid: #6b7280;
  
  /* Typography */
  --font-display: 'IBM Plex Sans Arabic', system-ui, sans-serif;
  --font-body: 'IBM Plex Sans Arabic', system-ui, sans-serif;
  
  /* Spacing (4px base) */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  
  /* Transitions */
  --transition-colors: color 150ms ease-out, background-color 150ms ease-out;
  --transition-transform: transform 200ms ease-out;
  --transition-all: all 200ms ease-out;
}

[data-theme="dark"] {
  --color-infratech: #22d3ee;
  --color-exotech: #a78bfa;
  /* ... dark theme overrides */
}
```

---

## 📦 New Components to Create

### Oracle Components

1. `components/oracle/routing-badge.tsx` - Color-coded routing badge
2. `components/oracle/budget-range.tsx` - Budget range display with confidence
3. `components/oracle/confidence-meter.tsx` - Visual confidence gauge
4. `components/oracle/inferred-scope-list.tsx` - Expandable scope list
5. `components/oracle/reasoning-chain.tsx` - 3-stage reasoning display
6. `components/oracle/oracle-insights-panel.tsx` - Main insights panel
7. `components/oracle/official-data-panel.tsx` - Official data panel

### Routing Components

8. `components/routing/routing-kanban.tsx` - Main kanban board
9. `components/routing/routing-column.tsx` - Reusable column component

### Dashboard Components

10. `components/dashboard/smart-tender-card.tsx` - Enhanced tender card

---

## 🔧 Database Queries Needed

**File:** `lib/queries/tender.ts` (UPDATE)

```typescript
// Get tenders filtered by routing decision
export async function getTendersByRouting(
  routingDecision?: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID'
): Promise<TenderWithEvaluation[]> {
  // Implementation with efficient filtering
}
```

---

## ✅ Verification Checklist

**Use `verification-before-completion` skill:**

- [ ] All components follow `frontend-design` aesthetic
- [ ] RTL support verified (`dir="rtl"` works)
- [ ] Responsive design tested (320px, 768px, 1024px, 1920px)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance optimized (bundle size, rendering)
- [ ] TypeScript compilation passes
- [ ] Visual design matches "Ministry Clean" / "Midnight Operator"
- [ ] All Oracle insights display correctly
- [ ] Routing badges color-coded correctly
- [ ] Budget ranges formatted correctly
- [ ] Loading/error/empty states implemented
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Touch targets ≥48x48px on mobile

---

## 🚀 Implementation Order

1. **Design System Setup** (30 min)
   - Create design tokens in `globals.css`
   - Define routing color system
   - Set up typography scale

2. **Task 3.1: Smart Tender Card** (2-3 hours)
   - Create routing badge component
   - Create budget range component
   - Enhance/create smart tender card
   - Add Oracle insights preview

3. **Task 3.2: Detailed Oracle View** (3-4 hours)
   - Create 2-column layout
   - Build OfficialDataPanel
   - Build OracleInsightsPanel
   - Implement all Oracle insight sections

4. **Task 3.3: Routing Dashboard** (2-3 hours)
   - Create database query function
   - Build RoutingKanban component
   - Build RoutingColumn component
   - Implement empty states

5. **Testing & Polish** (1-2 hours)
   - RTL testing
   - Responsive testing
   - Accessibility audit
   - Performance optimization

**Total Estimated Time:** 8-12 hours

---

## 📚 Skills Reference

### Must-Read Before Starting

1. **`frontend-design`** - Aesthetic direction, typography, colors, motion
2. **`vercel-react-best-practices`** - Performance optimization rules
3. **`interaction-design`** - Loading/error/empty states, animations
4. **`responsive-web-design`** - Grid layouts, breakpoints

### Reference During Implementation

5. **`design-system-creation`** - Design tokens, component structure
6. **`mobile-first-design`** - Responsive patterns
7. **`kpi-dashboard-design`** - Dashboard layout principles
8. **`web-design-guidelines`** - Accessibility, best practices

---

## 🎯 Success Criteria

**Phase 3 is complete when:**

✅ All 3 tasks implemented
✅ Design follows "Ministry Clean" / "Midnight Operator" aesthetic
✅ RTL support verified
✅ Responsive on all breakpoints
✅ Accessibility audit passes
✅ Performance targets met
✅ TypeScript compilation passes
✅ Visual design is distinctive and memorable (not generic AI aesthetics)

---

**Last Updated:** 2026-01-27
**Status:** 📋 Ready for implementation
