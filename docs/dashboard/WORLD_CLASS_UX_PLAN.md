# World-Class UX Plan — Etmam Dashboard

**Status:** Planning Phase (No Build Yet)
**Objective:** Transform the current dashboard into a world-class, production-ready UI
**Philosophy:** Keep the aesthetic foundation (Precision Operator), enhance functionality

---

## Executive Summary

The current dashboard has **strong aesthetic bones** — clean token system, responsive layout, smooth animations, proper RTL/localization. What's missing is **functional polish** and **flow clarity**. This plan addresses:

1. **Dashboard Tab** (Tenders List) — Already good, needs minor refinements
2. **Tender Detail Page** — Needs clearer decision cockpit UX
3. **Opportunities Page** — Needs to exist as a proper workflow destination
4. **Settings Page** — Needs structure and professional polish

**Core Flow (MVP):**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  GET DATA    │────▶│   ANALYSE    │────▶│   QUALIFY    │────▶│  PUSH CRM    │
│  (Scrape/    │     │  (Evaluate   │     │  (Create     │     │  (Export to  │
│   Upload)    │     │   tender)    │     │   Oppty)     │     │   Odoo)      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
     ↓                    ↓                    ↓                    ↓
  Dashboard           Tender Detail      Opportunities        Opportunities
  (Ingestion)         (Evaluation)       (Qualified list)     (Push action)
```

---

## Page 1: Dashboard (Tenders List)

### Current State Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| KPI Row | ✅ Excellent | 7 cards, animated, filter-reactive |
| Filters | ✅ Good | Search, Recommendation, Deadline, Status, Sort |
| Table | ✅ Good | Sortable, paginated, checkbox select |
| Ingestion | ⚠️ Needs work | TenderDataBlock mixed with table |
| Empty State | ⚠️ Basic | Could guide user better |
| Bulk Actions | ❌ Missing | Checkboxes exist but unused |

### Proposed Changes

#### 1.1 Layout Reorganization
Keep current structure but **separate concerns**:

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Header (sticky)                                  │
│  [Run Analysis] [Export Odoo] [Upload]    [EN|AR] [User ▼] │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Page Title: "Tenders" (not "Dashboard")                    │
│  Subtitle: "X tenders • Y qualified • Z pending evaluation" │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  KPI Row (7 cards) — unchanged                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Tender Ingestion Strip (slim, collapsible)                 │
│  [Get Active ▼] [Get Historic ▼] [Upload] [Status: Idle]   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Filters + Bulk Actions Bar                                 │
│  [Search...] [Recommendation ▼] [Deadline ▼] [Sort ▼]      │
│  When selected: [■ 3 selected] [Evaluate All] [Export]     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Tenders Table                                              │
│  ☐ Entity | Title | Ref | Deadline | Value | Score | Rec   │
│  ─────────────────────────────────────────────────────────  │
│  ... rows ...                                               │
│  ─────────────────────────────────────────────────────────  │
│  ◀ Prev | Showing 1-10 of 45 | Next ▶                       │
└─────────────────────────────────────────────────────────────┘
```

#### 1.2 Tender Ingestion Strip (New Component)
Replace current `TenderDataBlock` with a slim, professional strip:

**Design:**
- Single row, 48px height
- Background: `--surface-muted` (subtle differentiation)
- Border-radius: `--radius-card`
- Left: Action buttons (Get Active, Get Historic, Upload)
- Right: Status indicator (Idle / Scraping... / X new tenders found)

**States:**
- **Idle:** Buttons enabled, status shows "Ready to fetch"
- **Scraping:** Buttons disabled, spinner, "Fetching active tenders..."
- **Complete:** Success message "12 new tenders found" (auto-dismiss 5s)
- **Error:** Red text, retry button

**Why:** Current block is too prominent and mixes concerns. Strip keeps functionality but reduces visual weight.

#### 1.3 Bulk Actions (Enable Existing Checkboxes)
The checkboxes exist but do nothing. Add:

**When 1+ rows selected, show contextual bar:**
```
┌─────────────────────────────────────────────────────────────┐
│  ■ 3 tenders selected    [Evaluate All] [Create Opptys] ✕  │
└─────────────────────────────────────────────────────────────┘
```

**Actions:**
- **Evaluate All:** Run evaluation on selected tenders (async, show progress)
- **Create Opportunities:** Mark selected as opportunity-ready (navigate to Opportunities)
- **✕:** Clear selection

#### 1.4 Table Row Enhancements
Current rows are functional. Add:

- **Left accent bar:** 3px colored bar on row start matching recommendation:
  - INVEST: Emerald
  - REVIEW: Amber
  - SKIP: Gray
  - No eval: Dashed gray

- **Row hover:** Current is good, keep it

- **Inline quick actions (on hover):**
  ```
  ... | Score | Rec | [👁 View] [▶ Evaluate] |
  ```
  Icons only, appear on row hover, fade in 150ms

#### 1.5 Empty State Enhancement
Current: "No tenders found"

**Proposed:**
```
┌─────────────────────────────────────────────────────────────┐
│                      📋                                     │
│           No tenders yet                                    │
│                                                             │
│  Get started by fetching tenders from Etimad or uploading   │
│  a tender file.                                             │
│                                                             │
│  [Get Active Tenders]  [Upload File]                        │
└─────────────────────────────────────────────────────────────┘
```

- Icon: Use existing tender icon or simple clipboard
- Copy: Action-oriented, not apologetic
- Buttons: Primary actions only

---

## Page 2: Tender Detail Page

### Current State Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Hero Section | ✅ Good | Title, meta, deadline badge |
| Score Gauge | ✅ Excellent | Animated circular progress |
| Score Breakdown | ✅ Good | 5 dimensions with bars |
| Evaluation Cards | ⚠️ Dense | Strengths/Risks/etc lists |
| Action Buttons | ⚠️ Scattered | Run Analysis, Push CRM in different places |
| Flow to Opportunity | ❌ Unclear | "Create Opportunity" link exists but weak |

### Proposed Layout: Decision Cockpit

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Tenders                                          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  HERO                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Entity Logo]  Ministry of Transport                │   │
│  │                                                      │   │
│  │ Road Maintenance Contract for Northern Region       │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ #12345678 • Deadline: Feb 15, 2025 [CLOSING SOON]  │   │
│  │ Estimated Value: SAR 2,500,000                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  DECISION PANEL (2-column on desktop)                       │
│  ┌──────────────────────┐  ┌──────────────────────────────┐│
│  │  SCORE               │  │  ACTIONS                     ││
│  │  ┌────────────┐      │  │                              ││
│  │  │     78     │      │  │  ┌────────────────────────┐ ││
│  │  │   ────     │      │  │  │  ▶ Run Analysis        │ ││
│  │  │   INVEST   │      │  │  └────────────────────────┘ ││
│  │  └────────────┘      │  │  ┌────────────────────────┐ ││
│  │                      │  │  │  ✚ Create Opportunity  │ ││
│  │  Budget Fit    ████░ │  │  └────────────────────────┘ ││
│  │  Technical     ███░░ │  │  ┌────────────────────────┐ ││
│  │  Timeline      ████░ │  │  │  ↗ Push to CRM         │ ││
│  │  Strategic     ██░░░ │  │  └────────────────────────┘ ││
│  │  Risk Score    ████░ │  │                              ││
│  └──────────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  EVALUATION DETAILS (tabbed or accordion)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Summary] [Strengths] [Risks] [Requirements] [Actions]│  │
│  │ ─────────────────────────────────────────────────────│  │
│  │ This tender represents a strong opportunity for...   │  │
│  │ ...                                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  RAW DATA (collapsible)                                     │
│  ▶ View Original Tender Data                                │
└─────────────────────────────────────────────────────────────┘
```

### Key Changes

#### 2.1 Unified Action Panel
Group all actions in one clear panel:

| Action | Visibility | Style |
|--------|-----------|-------|
| Run Analysis | Always (changes to "Re-run" after eval) | Primary button |
| Create Opportunity | After evaluation, if INVEST/REVIEW | Secondary button |
| Push to CRM | After opportunity created | Tertiary or disabled |

**Flow guidance:**
- If no evaluation: "Run Analysis" is the only enabled action
- If evaluated but not opportunity: "Create Opportunity" highlighted
- If opportunity exists: "Push to CRM" highlighted, others dimmed

#### 2.1.1 V2 Engine: Dual-Track Visualization (Crucial)
The Decision Panel must show THREE score visualizations:

```
┌─────────────────────────────────────────────────────────────┐
│  SCORE PANEL                                                │
│  ┌────────────────────────────────────────────────────────┐│
│  │         ┌────────────┐                                 ││
│  │         │    78      │  ← Total Score (primary gauge)  ││
│  │         │   INVEST   │                                 ││
│  │         └────────────┘                                 ││
│  │                                                        ││
│  │  Infratech Fit (Cyber/Infra/OT)                       ││
│  │  ████████████████░░░░  82%  ← Blue/Teal               ││
│  │                                                        ││
│  │  Exotech Fit (AI/Data/Robotics)                       ││
│  │  ██████████░░░░░░░░░░  58%  ← Purple/Indigo           ││
│  │                                                        ││
│  │  Routing: [INFRATECH] ← Badge showing lead entity     ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Color Tokens:**
- Infratech: `--color-infratech-500: #06b6d4` (Cyan/Teal)
- Exotech: `--color-exotech-500: #8b5cf6` (Purple/Indigo)
- Joint: Gradient of both
- No-Bid: `--color-gray-500`

**Routing Decision Badge:**
- INFRATECH → Cyan badge
- EXOTECH → Purple badge
- JOINT → Gradient badge
- NO_BID → Gray badge

#### 2.6 Tabbed Evaluation Details
Replace current stacked cards with tabs:

**Tabs:**
1. **Summary** — AI-generated summary (default tab)
2. **Strengths** — Bulleted list with icons
3. **Risks** — Bulleted list with warning icons
4. **Requirements** — What's missing/needed
5. **Actions** — Recommended next steps

**Why:** Reduces vertical scroll, lets user focus on one aspect at a time.

#### 2.3 Score Breakdown Enhancement (V2 Engine: 6 Dimensions)
Replace current 5-dimension breakdown with V2 Engine's **6 dimensions**:

```
┌─────────────────────────────────────────────────────────────┐
│  SCORE BREAKDOWN                                            │
│  ───────────────────────────────────────────────────────── │
│  🎯 Service Fit      ████████████░░░░  75%  (20% weight)   │
│  💰 Budget Fit       ██████████████░░  85%  (20% weight)   │
│  ⏱️ Timeline Fit     ██████████░░░░░░  62%  (15% weight)   │
│  🔧 Complexity Fit   ████████████████  92%  (15% weight)   │
│  📈 Strategic Fit    ██████████████░░  82%  (15% weight)   │
│  ⚠️ Risk Score       ████░░░░░░░░░░░░  28%  (15% weight)   │
│                                         ↑ Lower = better   │
└─────────────────────────────────────────────────────────────┘
```

**Dimension Mapping:**
| Dimension | Icon | Description |
|-----------|------|-------------|
| Service Fit | 🎯 | How well tender matches our service offerings |
| Budget Fit | 💰 | Alignment with our pricing model |
| Timeline Fit | ⏱️ | Feasibility of delivery schedule |
| Complexity Fit | 🔧 | Match with our technical capabilities |
| Strategic Fit | 📈 | Alignment with business strategy |
| Risk Score | ⚠️ | Overall risk (inverted: lower bar = lower risk = good) |

**Enhancements:**
- **Tooltips:** Hover shows "Budget Fit: 85/100 — Strong alignment with our pricing model"
- **Color coding:** Green (≥70), Amber (40-69), Red (<40)
- **Weight indicator:** Small text showing contribution (e.g., "20% weight")
- **Risk Score inverted:** Show as "Risk: Low/Medium/High" label, bar fills inversely

#### 2.4 AI Price Intelligence (V2 Engine)
Display AI-predicted value prominently in Hero section:

```
┌─────────────────────────────────────────────────────────────┐
│  FINANCIALS                                                 │
│  ───────────────────────────────────────────────────────── │
│  📄 Official Booklet Price     SAR 2,800,000               │
│  📊 Tender Estimate            SAR 2,500,000               │
│  ✨ AI Model Estimate          SAR 2,650,000  [?]          │
│                                 ↑ Sparkle icon = AI        │
│                                                             │
│  Variance: +6% from estimate  ← Show if >20% difference    │
└─────────────────────────────────────────────────────────────┘
```

**Display Rules:**
- `predicted_value_sar` shown as "AI Model Estimate" with sparkle/AI icon (✨)
- Tooltip: "Predicted by Etmam AI based on historical tender data"
- If variance from official >20%, show warning indicator
- Order: Booklet Price → Tender Estimate → AI Estimate

#### 2.5 Deadline Urgency Visual
Current: Badge saying "Closing Soon"

**Enhanced:**
- If deadline ≤7 days: Red gradient overlay on hero (already exists)
- Add: Countdown timer "5 days 3 hours remaining"
- If past deadline: Muted hero, "Deadline passed" warning

---

## Page 3: Opportunities Page

### Current State Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Route | ✅ Exists | `/dashboard/opportunities` |
| Data Query | ✅ Works | `getOpportunityReadyTenders()` |
| Table | ⚠️ Basic | Minimal columns, no bulk actions |
| CRM Push | ⚠️ Per-row only | No bulk push |
| Empty State | ⚠️ Basic | Just text |

### Proposed Layout: Opportunity Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Header (same as Tenders)                         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Page Title: "Opportunities"                                │
│  Subtitle: "X ready to push • Y already pushed"            │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  KPI Row (3 cards — simpler than Tenders)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Total Opptys │ │ Ready to Push│ │ Already Pushed│        │
│  │     24       │ │      18      │ │      6        │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Filters + Bulk Actions                                     │
│  [Search...] [Status: All ▼] [Recommendation ▼]            │
│  When selected: [■ 5 selected] [Push All to CRM] ✕         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Opportunities Table                                        │
│  ☐ Title | Entity | Value | Score | Rec | Status | Actions │
│  ─────────────────────────────────────────────────────────  │
│  ☐ Road Maint... | MoT | 2.5M | 78 | INVEST | Ready | [Push]│
│  ☐ IT Systems... | MoE | 1.2M | 65 | REVIEW | Ready | [Push]│
│  ☐ Building... | MoH | 3.1M | 82 | INVEST | Pushed | [✓]   │
│  ─────────────────────────────────────────────────────────  │
│  ◀ Prev | Showing 1-10 of 24 | Next ▶                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

#### 3.1 Simplified KPI Row
Only 3 cards (not 7 like Tenders):
1. **Total Opportunities** — Count of opportunity-ready tenders
2. **Ready to Push** — Not yet pushed to CRM
3. **Already Pushed** — Successfully pushed

#### 3.2 Status Column
New column showing push status:
- **Ready** — Gray badge, not yet pushed
- **Pushed** — Green badge with checkmark, timestamp on hover
- **Failed** — Red badge, retry button

#### 3.3 Bulk Push to CRM
When rows selected:
```
┌─────────────────────────────────────────────────────────────┐
│  ■ 5 opportunities selected  [Push All to CRM] [Export] ✕  │
└─────────────────────────────────────────────────────────────┘
```

**Push All behavior:**
1. Show confirmation modal: "Push 5 opportunities to Odoo?"
2. Progress indicator: "Pushing 2/5..."
3. Result: "4 pushed successfully, 1 failed (view details)"

#### 3.4 Row Actions
| Status | Actions |
|--------|---------|
| Ready | [Push to CRM] [View Tender] |
| Pushed | [✓ Pushed] (disabled) [View Tender] |
| Failed | [Retry] [View Tender] |

#### 3.5 Empty State
```
┌─────────────────────────────────────────────────────────────┐
│                      🎯                                     │
│         No opportunities yet                                │
│                                                             │
│  Opportunities appear here when you evaluate tenders and    │
│  they receive an INVEST or REVIEW recommendation.           │
│                                                             │
│  [Go to Tenders]                                            │
└─────────────────────────────────────────────────────────────┘
```

#### 3.6 Manual Export Option
Since Odoo access isn't available yet, add:

**Export button** in header or as bulk action:
- [Download Excel] — Same as current Odoo Excel export
- Tooltip: "Download opportunities as Excel for manual import"

---

## Page 4: Settings Page

### Current State Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Layout | ⚠️ Basic | Two forms side by side |
| Profile Form | ⚠️ Minimal | Just user info |
| Odoo Form | ⚠️ Incomplete | Credentials but no connection test |
| Navigation | ❌ Missing | No sub-navigation |
| Appearance | ❌ Missing | No theme/display settings |

### Proposed Layout: Settings Hub

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard Header (same)                                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Page Title: "Settings"                                     │
└─────────────────────────────────────────────────────────────┘
┌───────────────────┬─────────────────────────────────────────┐
│  Settings Nav     │  Content Area                           │
│  ─────────────    │  ─────────────────────────────────────  │
│  • Profile        │  ┌─────────────────────────────────┐   │
│  • CRM            │  │ Profile Settings                │   │
│  • Appearance     │  │ ───────────────────────────────│   │
│  • Notifications  │  │ Name: [_______________]        │   │
│  • Data Export    │  │ Email: user@example.com (ro)   │   │
│  • About          │  │ Role: Admin                    │   │
│                   │  │                                 │   │
│                   │  │ [Save Changes]                  │   │
│                   │  └─────────────────────────────────┘   │
└───────────────────┴─────────────────────────────────────────┘
```

### Settings Sections

#### 4.1 Profile
- **Name:** Editable text input
- **Email:** Read-only (from auth)
- **Role:** Read-only (Admin/User)
- **Avatar:** Optional, upload or initials

#### 4.2 CRM Integration
```
┌─────────────────────────────────────────────────────────────┐
│  CRM Integration                                            │
│  ───────────────────────────────────────────────────────── │
│  Status: ● Not Connected                                    │
│                                                             │
│  Odoo URL:      [https://your-odoo.com____________]        │
│  Database:      [your_database__________________]          │
│  Username:      [admin@company.com______________]          │
│  API Key:       [••••••••••••••••________________]          │
│                                                             │
│  [Test Connection]  [Save]                                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  ℹ️ Don't have Odoo credentials yet? You can export        │
│  opportunities as Excel and import them manually.          │
│  [Learn more about manual import]                          │
└─────────────────────────────────────────────────────────────┘
```

**Connection Test:**
- Button triggers test API call
- Success: Green checkmark, "Connected to [database]"
- Failure: Red X, "Connection failed: [error message]"

#### 4.3 Appearance (New)
```
┌─────────────────────────────────────────────────────────────┐
│  Appearance                                                 │
│  ───────────────────────────────────────────────────────── │
│  Theme:         (●) Light  ( ) Dark  ( ) System            │
│                                                             │
│  Language:      [English ▼]                                 │
│                                                             │
│  Reduce Motion: [ ] Enable reduced motion animations        │
│                                                             │
│  [Save Preferences]                                         │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4 Notifications (Future)
Placeholder for email/in-app notification preferences.

#### 4.5 Data Export
```
┌─────────────────────────────────────────────────────────────┐
│  Data Export                                                │
│  ───────────────────────────────────────────────────────── │
│  Export your tender and opportunity data.                   │
│                                                             │
│  [Download All Tenders (CSV)]                               │
│  [Download All Opportunities (Excel)]                       │
│  [Download Evaluation History (JSON)]                       │
│                                                             │
│  Last export: Never                                         │
└─────────────────────────────────────────────────────────────┘
```

#### 4.6 About
```
┌─────────────────────────────────────────────────────────────┐
│  About Etmam                                                │
│  ───────────────────────────────────────────────────────── │
│  Version: 1.0.0                                             │
│  Built by: InfraTech & ExoTech                              │
│                                                             │
│  [View Documentation]                                       │
│  [Contact Support]                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Navigation Flow (Sidebar)

### Current Sidebar
```
Dashboard    → /dashboard
Tenders      → /dashboard (same as Dashboard?)
Opportunities → /dashboard/opportunities
Settings     → /settings
```

### Proposed Sidebar
```
┌─────────────────────────────────────────────────────────────┐
│  [E] Etmam                                                  │
│  ───────────────────────────────────────────────────────── │
│  📋 Tenders           → /dashboard                         │
│  🎯 Opportunities     → /dashboard/opportunities           │
│  ⚙️ Settings          → /settings                          │
│  ───────────────────────────────────────────────────────── │
│  📊 Analytics (v2)    → disabled/coming soon               │
└─────────────────────────────────────────────────────────────┘
```

**Changes:**
1. Remove duplicate "Dashboard" label — rename to "Tenders"
2. Keep 3 main nav items: Tenders, Opportunities, Settings
3. Add future placeholder for Analytics (grayed out)

### Active State Logic
```javascript
const isActive = (path) => {
  if (path === '/dashboard') {
    return pathname === '/dashboard' && !pathname.includes('/opportunities');
  }
  return pathname.startsWith(path);
};
```

---

## Animation & Motion Guidelines

### Principles (Keep Existing)
1. **Purposeful motion** — Animations guide attention, not distract
2. **Respect preferences** — Honor `prefers-reduced-motion`
3. **Consistent timing** — Use defined durations (fast: 150ms, normal: 200ms)

### Page Transitions
- **Route change:** Fade content (200ms), keep sidebar/header stable
- **Tab change:** Slide content in direction of tab (left/right)
- **Modal open:** Fade overlay + scale content (0.95→1, 200ms)

### Micro-interactions (Keep/Add)
| Element | Animation |
|---------|-----------|
| KPI value change | Count up with spring (existing) |
| Table row hover | Background fade (existing) |
| Button click | Scale 0.98→1 (50ms) |
| Checkbox select | Checkmark draw animation |
| Status change | Badge pulse once |
| Toast/notification | Slide in from right |

---

## Responsive Behavior

### Breakpoints (Keep Existing)
- **Desktop:** ≥1024px — Full sidebar, 2-column layouts
- **Tablet:** 768-1023px — Collapsible sidebar, single column detail
- **Mobile:** <768px — Hidden sidebar (hamburger), stacked layouts

### Mobile-Specific Adjustments

#### Tenders List (Mobile)
- KPI row: 2-column grid (3 rows)
- Filters: Stack vertically, full-width
- Table: Card view instead of table rows

```
┌─────────────────────────────────────────────────────────────┐
│  [Tender Card]                                              │
│  Ministry of Transport                                      │
│  Road Maintenance Contract for Northern Region              │
│  ─────────────────────────────────────────────────────────  │
│  Ref: #12345678  •  Due: Feb 15  •  SAR 2.5M               │
│  Score: 78  •  INVEST                                       │
│  ─────────────────────────────────────────────────────────  │
│  [View] [Evaluate]                                          │
└─────────────────────────────────────────────────────────────┘
```

#### Tender Detail (Mobile)
- Hero: Stack meta items vertically
- Score + Actions: Single column
- Evaluation tabs: Horizontal scroll tabs

#### Settings (Mobile)
- Nav: Horizontal scrollable tabs instead of sidebar

---

## Technical Implementation Notes

### Data Layer (No Changes Needed)
- `getTenders()` — Works as-is
- `getTenderById()` — Works as-is
- `getOpportunityReadyTenders()` — Works as-is
- `pushToCRM()` — Works as-is

### New/Modified Components

| Component | Action | Priority |
|-----------|--------|----------|
| `TenderIngestionStrip` | New (replace TenderDataBlock) | P1 |
| `BulkActionsBar` | New | P1 |
| `TenderDetailDecisionPanel` | Refactor | P1 |
| `EvaluationTabs` | New (replace stacked cards) | P2 |
| `OpportunitiesKpiRow` | New (3 cards) | P1 |
| `SettingsSidebar` | New | P2 |
| `ConnectionTestButton` | New | P2 |
| `MobileTableCards` | New | P3 |

### i18n Keys to Add
```json
{
  "tenders": {
    "title": "Tenders",
    "subtitle": "{count} tenders • {qualified} qualified",
    "ingestion": {
      "ready": "Ready to fetch",
      "fetching": "Fetching tenders...",
      "found": "{count} new tenders found"
    },
    "bulk": {
      "selected": "{count} tenders selected",
      "evaluateAll": "Evaluate All",
      "createOpptys": "Create Opportunities"
    }
  },
  "opportunities": {
    "title": "Opportunities",
    "subtitle": "{ready} ready to push • {pushed} already pushed",
    "pushAll": "Push All to CRM",
    "status": {
      "ready": "Ready",
      "pushed": "Pushed",
      "failed": "Failed"
    }
  },
  "settings": {
    "nav": {
      "profile": "Profile",
      "crm": "CRM Integration",
      "appearance": "Appearance",
      "export": "Data Export",
      "about": "About"
    },
    "crm": {
      "notConnected": "Not Connected",
      "connected": "Connected",
      "testConnection": "Test Connection",
      "testSuccess": "Connected to {database}",
      "testFailed": "Connection failed: {error}"
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Current Sprint Focus)
1. ✅ Sidebar navigation cleanup (remove duplicate)
2. ✅ Tenders page title/subtitle
3. ✅ Tender Ingestion Strip (replace TenderDataBlock)
4. ✅ Bulk actions bar (wire up checkboxes)

### Phase 2: Tender Detail Enhancement
1. Decision Panel layout (score + actions unified)
2. Evaluation tabs (replace stacked cards)
3. Score breakdown tooltips
4. Deadline countdown

### Phase 3: Opportunities Polish
1. Opportunities KPI row (3 cards)
2. Status column with badges
3. Bulk push functionality
4. Manual export fallback

### Phase 4: Settings Overhaul
1. Settings sidebar navigation
2. CRM connection test
3. Appearance settings
4. Data export page

### Phase 5: Mobile Optimization
1. Mobile table cards
2. Touch-friendly actions
3. Responsive settings tabs

---

## Design Tokens Reference (No Changes)

The current token system is excellent. Key tokens to use:

```css
/* Surfaces */
--surface-page: #fafbff;
--surface-card: #ffffff;
--surface-muted: #f8fafc;

/* Primary */
--color-primary-500: #10b981; /* Emerald */

/* Status */
--color-qualified-500: #059669;
--color-conditional-500: #d97706;
--color-excluded-500: #dc2626;

/* Shadows */
--shadow-card: 0 2px 8px rgba(0,0,0,0.04);

/* Radius */
--radius-card: 14px;
--radius-md: 8px;
```

---

## Quality Checklist

Before each phase completion:

- [ ] All new components use design tokens (no hardcoded colors)
- [ ] RTL tested (switch to Arabic, verify layout)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Loading states have skeletons
- [ ] Error states have clear messaging
- [ ] Empty states guide user to action
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Mobile layout doesn't break
- [ ] i18n keys added for all new strings

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to first evaluation | ~30s (manual) | <15s (guided) |
| Clicks to push opportunity | 5+ | 2-3 |
| Mobile usability score | Unknown | 90+ |
| User confusion (support tickets) | Unknown | <5/month |

---

*This plan maintains your current aesthetic excellence while adding the functional polish needed for a world-class product. No "AI slop" — just clean, purposeful design following your established Precision Operator direction.*
