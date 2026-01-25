# CRM Dashboard Redesign Plan
## Adapting Figma Template to Etmaam

Based on the extracted Figma design: **CRM Dashboard Customers List (Community)**

---

## Design Comparison

### Current Etmaam vs Target Design

| Element | Current Etmaam | Target (Figma Template) |
|---------|---------------|------------------------|
| Sidebar BG | Dark (`surface-raised`) | White/Light |
| Sidebar Width | 256px | ~220px |
| Active Nav | Green fill | Green fill with arrow indicator |
| Stats Cards | Glass cards, 4 columns | Rounded icon containers, 3 columns |
| Stats Icons | Small inline icons | Large circular colored backgrounds |
| Table Style | Glass card container | White card with subtle shadow |
| Status Badges | Rounded pills | Pill badges with colored text |
| Header | Page title only | Greeting + Global search |
| Overall | Glassmorphism | Clean, light, rounded |

---

## Phase 1: Design Tokens Update

### File: `styles/tokens.css`

**Add new CRM-style tokens:**

```css
/* CRM Dashboard Style Tokens */
--surface-sidebar: #ffffff;
--surface-card: #ffffff;
--surface-page: #fafbff;

/* Stat Card Icon Backgrounds */
--stat-icon-primary-bg: rgba(16, 185, 129, 0.12);
--stat-icon-purple-bg: rgba(139, 92, 246, 0.12);
--stat-icon-orange-bg: rgba(249, 115, 22, 0.12);
--stat-icon-blue-bg: rgba(59, 130, 246, 0.12);

/* Larger border radius for CRM style */
--radius-card: 14px;
--radius-stat-icon: 12px;

/* CRM Shadows */
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);
--shadow-sidebar: 2px 0 8px rgba(0, 0, 0, 0.03);
```

---

## Phase 2: Sidebar Redesign

### File: `components/layout/sidebar.tsx`

**Changes:**
1. White background instead of dark
2. Remove border, add subtle shadow
3. Green active state with right arrow indicator
4. Add "Upgrade to Pro" / CTA card
5. User profile at bottom with role

**New Structure:**
```
┌─────────────────────┐
│  🏛️ Etmaam v1.0    │  <- Logo
├─────────────────────┤
│  📊 Dashboard       │
│  📦 Product    →    │
│  █ Tenders     →    │  <- Active (green bg)
│  💰 Income          │
│  📢 Promote         │
│  ❓ Help            │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Upgrade to PRO  │ │  <- CTA Card
│ │ Get Pro Now!    │ │
│ └─────────────────┘ │
├─────────────────────┤
│  👤 User Name       │  <- Profile
│     Role            │
└─────────────────────┘
```

---

## Phase 3: Stats Cards Redesign

### File: `components/ui/data-display/stat-card.tsx`

**New Design (matching Figma):**

```
┌────────────────────────────────────┐
│  ┌────────┐                        │
│  │  👥    │   Total Tenders        │
│  │ (icon) │   5,423                │
│  └────────┘   ↑ 16% this month     │
└────────────────────────────────────┘
```

**Key Changes:**
- Large circular/rounded icon container with colored background
- Icon inside the colored container
- Title above the value (smaller, muted)
- Large bold value
- Trend indicator below value
- White card background with subtle shadow

**Props Update:**
```typescript
interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconBgColor: string  // New: colored background for icon
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  liveIndicator?: ReactNode  // New: for "Active Now" with avatars
}
```

---

## Phase 4: Header Redesign

### File: `components/layout/header.tsx`

**New Structure:**
```
┌─────────────────────────────────────────────────────┐
│  Hello [UserName] 👋                    🔍 Search   │
└─────────────────────────────────────────────────────┘
```

**Changes:**
1. Add personalized greeting with user name
2. Add global search bar on the right
3. Remove redundant elements
4. Cleaner, simpler design

---

## Phase 5: Data Table Redesign

### File: `components/dashboard/tender-table.tsx`

**New Design:**
```
┌──────────────────────────────────────────────────────────────┐
│  All Tenders                              🔍 Search  Sort ▼  │
│  Active Tenders                                              │
├──────────────────────────────────────────────────────────────┤
│  Entity        Title       Reference   Deadline   Status     │
├──────────────────────────────────────────────────────────────┤
│  Ministry...   Tender...   REF-001     Jan 30     [Active]   │
│  Ministry...   Tender...   REF-002     Feb 15     [Pending]  │
│  ...                                                         │
├──────────────────────────────────────────────────────────────┤
│  Showing 1 to 8 of 256 entries          < 1 2 3 4 ... 40 >   │
└──────────────────────────────────────────────────────────────┘
```

**Changes:**
1. Card title with subtitle ("Active Tenders")
2. Inline search and sort controls
3. Cleaner row styling (no borders between rows)
4. Updated pagination style
5. Status badges as colored pills

---

## Phase 6: Color Palette Alignment

### Primary Colors (Keep Etmaam Emerald):
- Primary: `#10b981` (matches template's green)
- Purple accent: `#8b5cf6` (for secondary stats)
- Orange accent: `#f97316` (for warnings/active)
- Blue accent: `#3b82f6` (for info)

### Status Colors:
- Active/Qualified: `#00AC4F` (bright green)
- Inactive/Excluded: `#DF0404` (red)
- Pending: `#64748b` (gray)
- Conditional: `#f59e0b` (amber)

---

## Implementation Order

### Step 1: Update Design Tokens (30 min)
- Add new surface colors for light sidebar
- Add stat icon background colors
- Update shadow definitions

### Step 2: Redesign Sidebar (1-2 hours)
- Change to white background
- Update navigation styling
- Add CTA card component
- Add user profile section

### Step 3: Redesign Stat Cards (1-2 hours)
- Create new StatCard layout
- Large icon with colored background
- Update trend indicators
- 3-column grid layout

### Step 4: Update Header (30 min)
- Add greeting with user name
- Add global search
- Simplify design

### Step 5: Redesign Data Table (1-2 hours)
- Update card styling
- Add inline search/sort
- Update row styling
- New pagination component

### Step 6: Polish & RTL (1 hour)
- Test all components in Arabic
- Fix any RTL issues
- Ensure dark mode works

---

## Files to Modify

1. `styles/tokens.css` - New design tokens
2. `components/layout/sidebar.tsx` - Complete redesign
3. `components/layout/header.tsx` - Add greeting/search
4. `components/ui/data-display/stat-card.tsx` - New layout
5. `components/dashboard/stats-cards.tsx` - Use new cards
6. `components/dashboard/tender-table.tsx` - New table style
7. `app/globals.css` - New utility classes

---

## Visual Reference

The extracted Figma design is available at:
`c:\dev\builds\etmaam\etmam-docs\crm-dashboard-extracted\images\6fce18ee2325764ea86b862da045c353351eca8c.png`

Key design elements:
- Clean white sidebar with green active state
- Rounded stat cards with large colored icons
- Simple data table with status pills
- Personalized greeting header
- Overall light, airy, modern feel
