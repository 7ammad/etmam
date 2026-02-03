# Acceptance Criteria — Dashboard UX Overhaul

**Protocol Phase:** Research & Planning
**Reference:** WORLD_CLASS_UX_PLAN.md

---

## Page 1: Dashboard (Tenders List)

### AC-1.1: Sidebar Navigation Cleanup
- [ ] Sidebar shows exactly 3 main items: Tenders, Opportunities, Settings
- [ ] "Dashboard" label removed (consolidated with "Tenders")
- [ ] Active state correctly highlights based on current route
- [ ] Analytics placeholder shown as disabled/coming soon

### AC-1.2: Page Title & Subtitle
- [ ] Page shows title "Tenders" (not "Dashboard")
- [ ] Subtitle shows dynamic counts: "{count} tenders • {qualified} qualified • {pending} pending"
- [ ] Counts update when filters change

### AC-1.3: Tender Ingestion Strip
- [ ] New `TenderIngestionStrip` component replaces `TenderDataBlock`
- [ ] Single-row layout, 48px height, subtle background
- [ ] Contains: Get Active, Get Historic, Upload buttons (left-aligned)
- [ ] Status indicator on right: Idle / Scraping / Complete / Error
- [ ] Scraping state shows spinner and disables buttons
- [ ] Success shows "X new tenders found" for 5 seconds then auto-dismisses

### AC-1.4: Bulk Actions Bar
- [ ] When 1+ checkboxes selected, contextual bar appears below filters
- [ ] Bar shows: "X tenders selected" + action buttons + clear (✕)
- [ ] Actions: [Evaluate All] [Create Opportunities]
- [ ] "Evaluate All" triggers batch evaluation (async with progress)
- [ ] "Create Opportunities" navigates to Opportunities page
- [ ] Clear (✕) deselects all checkboxes

### AC-1.5: Table Row Enhancements
- [ ] Each row has 3px left accent bar matching recommendation color
- [ ] Inline quick action icons appear on row hover (View, Evaluate)
- [ ] Icons fade in 150ms, positioned in Actions column

### AC-1.6: Empty State
- [ ] Shows centered icon + "No tenders yet" heading
- [ ] Guidance text explains how to get started
- [ ] Primary buttons: [Get Active Tenders] [Upload File]
- [ ] Clicking buttons triggers respective actions

---

## Page 2: Tender Detail Page

### AC-2.1: Decision Panel Layout
- [ ] Score gauge and Actions grouped in 2-column panel (desktop)
- [ ] Actions panel contains: Run Analysis, Create Opportunity, Push to CRM
- [ ] Buttons have clear visual hierarchy (primary/secondary/tertiary)
- [ ] Single column on mobile (score above actions)

**V2 Engine: Dual-Track Visualization (Crucial)**
- [ ] Decision Panel displays THREE gauges/progress bars:
  - **Total Score** (center/primary) — existing circular gauge
  - **Infratech Fit** (Cyber/Infra/OT) — Blue/Teal color scheme
  - **Exotech Fit** (AI/Data/Robotics) — Purple/Indigo color scheme
- [ ] Dual-track bars show relative fit percentages (0-100)
- [ ] Visual indicator shows which entity leads (higher score highlighted)
- [ ] Routing decision badge below: "INFRATECH" / "EXOTECH" / "JOINT" / "NO_BID"
- [ ] Rationale: User must instantly know which entity should lead the bid

### AC-2.2: Action Button States
- [ ] If no evaluation: only "Run Analysis" is enabled
- [ ] If evaluated (INVEST/REVIEW): "Create Opportunity" highlighted
- [ ] If opportunity created: "Push to CRM" highlighted
- [ ] Already-pushed tenders show "Pushed" badge, Push disabled

### AC-2.3: Evaluation Tabs
- [ ] Stacked evaluation cards replaced with horizontal tabs
- [ ] Tabs: Summary, Strengths, Risks, Requirements, Actions
- [ ] Default tab: Summary
- [ ] Tab content area has consistent padding
- [ ] Empty tab states show "No data available"

### AC-2.4: Score Breakdown Enhancements (V2 Engine Dimensions)
- [ ] Score Breakdown displays exactly **6 dimensions** from V2 Engine:
  1. **Service Fit** — How well tender matches our service offerings
  2. **Budget Fit** — Alignment with our pricing model
  3. **Timeline Fit** — Feasibility of delivery schedule
  4. **Complexity Fit** — Match with our technical capabilities
  5. **Strategic Fit** — Alignment with business strategy
  6. **Risk Score** — Overall risk assessment (inverted: lower = better)
- [ ] Each dimension bar has tooltip on hover
- [ ] Tooltip shows: "{dimension}: {score}/100 — {description}"
- [ ] Color coding: green (≥70), amber (40-69), red (<40)
- [ ] Weight indicator shows contribution to total score
- [ ] Dimension order matches V2 Engine output order

### AC-2.5: Deadline Urgency
- [ ] If deadline ≤7 days: hero has red gradient overlay
- [ ] Countdown timer shown: "X days Y hours remaining"
- [ ] If deadline passed: hero muted, "Deadline passed" warning badge

### AC-2.6: Back Navigation
- [ ] "← Back to Tenders" link at top of page
- [ ] Clicking navigates to /dashboard preserving filters (if possible)

### AC-2.7: AI Price Intelligence (V2 Engine)
- [ ] Hero section displays **AI Predicted Value** (`predicted_value_sar`) prominently
- [ ] Labeled clearly as "AI Model Estimate" (distinct from official values)
- [ ] Display hierarchy in Financials:
  1. **Booklet Price** (if available) — labeled "Official Booklet Price"
  2. **Estimated Value** (from tender) — labeled "Tender Estimate"
  3. **AI Predicted Value** — labeled "AI Model Estimate" with sparkle/AI icon
- [ ] If AI prediction differs significantly from official (>20%), show variance indicator
- [ ] Tooltip explains: "Predicted by Etmam AI based on historical tender data"

---

## Page 3: Opportunities Page

### AC-3.1: Page Structure
- [ ] Route `/dashboard/opportunities` is accessible
- [ ] Page title: "Opportunities"
- [ ] Subtitle: "{ready} ready to push • {pushed} already pushed"

### AC-3.2: KPI Row (3 Cards)
- [ ] Only 3 KPI cards (not 7 like Tenders)
- [ ] Cards: Total Opportunities, Ready to Push, Already Pushed
- [ ] Cards use same animated value transitions as Tenders

### AC-3.3: Status Column
- [ ] Table has "Status" column
- [ ] "Ready" = gray badge
- [ ] "Pushed" = green badge with checkmark
- [ ] "Failed" = red badge with retry action

### AC-3.4: Bulk Push
- [ ] When rows selected, bulk actions bar appears
- [ ] "Push All to CRM" button triggers confirmation modal
- [ ] Modal shows: "Push X opportunities to Odoo?"
- [ ] Progress indicator during push: "Pushing 2/5..."
- [ ] Result summary: "X pushed, Y failed (view details)"

### AC-3.5: Row Actions
- [ ] Ready: [Push to CRM] [View Tender]
- [ ] Pushed: [✓ Pushed (disabled)] [View Tender]
- [ ] Failed: [Retry] [View Tender]
- [ ] "View Tender" links to `/dashboard/[tenderId]`

### AC-3.6: Manual Export
- [ ] "Download Excel" button in header or as bulk action
- [ ] Tooltip: "Download opportunities as Excel for manual import"
- [ ] Clicking downloads Odoo_Leads_Import.xlsx

### AC-3.7: Empty State
- [ ] Centered icon + "No opportunities yet" heading
- [ ] Guidance: "Opportunities appear when tenders get INVEST/REVIEW"
- [ ] Primary button: [Go to Tenders]

---

## Page 4: Settings Page

### AC-4.1: Settings Navigation
- [ ] Settings has sidebar (desktop) or tabs (mobile) navigation
- [ ] Sections: Profile, CRM Integration, Appearance, Data Export, About
- [ ] Clicking nav item loads respective section
- [ ] Active section highlighted in nav

### AC-4.2: Profile Section
- [ ] Name field: editable text input
- [ ] Email field: read-only (from auth)
- [ ] Role field: read-only
- [ ] Save button persists changes

### AC-4.3: CRM Integration Section
- [ ] Status indicator: "Connected" (green) or "Not Connected" (gray)
- [ ] Fields: Odoo URL, Database, Username, API Key
- [ ] API Key field masked with show/hide toggle
- [ ] [Test Connection] button tests credentials
- [ ] Success: green checkmark, "Connected to {database}"
- [ ] Failure: red X, "Connection failed: {error}"
- [ ] Info box explains manual export option

### AC-4.4: Appearance Section
- [ ] Theme toggle: Light / Dark / System
- [ ] Language selector: English / Arabic
- [ ] Reduce motion checkbox
- [ ] [Save Preferences] persists settings

### AC-4.5: Data Export Section
- [ ] Three export buttons: Tenders (CSV), Opportunities (Excel), Evaluations (JSON)
- [ ] Clicking triggers download
- [ ] "Last export" timestamp shown

### AC-4.6: About Section
- [ ] Shows version number
- [ ] Shows "Built by InfraTech & ExoTech"
- [ ] Links: View Documentation, Contact Support

---

## Cross-Cutting Requirements

### CC-1: Design Tokens
- [ ] All new components use design tokens (no hardcoded colors)
- [ ] Colors from `--color-*`, `--surface-*`, `--text-*`
- [ ] Shadows from `--shadow-*`
- [ ] Radii from `--radius-*`

### CC-2: RTL Support
- [ ] All new components work in Arabic (RTL) locale
- [ ] Layout mirrors correctly
- [ ] Text alignment uses logical properties (start/end)

### CC-3: Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible
- [ ] ARIA labels on buttons/icons
- [ ] Color contrast meets WCAG AA

### CC-4: Responsive Design
- [ ] All layouts work on mobile (< 768px)
- [ ] Tables become card views on mobile
- [ ] Sidebar collapses to hamburger menu

### CC-5: Loading States
- [ ] All async operations show loading indicators
- [ ] Skeleton loaders for data fetching
- [ ] Disabled states during operations

### CC-6: Error Handling
- [ ] All errors show user-friendly messages
- [ ] Retry actions available where applicable
- [ ] No silent failures

### CC-7: Animations
- [ ] Respect `prefers-reduced-motion`
- [ ] Use defined durations (fast: 150ms, normal: 200ms)
- [ ] Purposeful motion only

### CC-8: i18n
- [ ] All new strings have translations in en.json and ar.json
- [ ] No hardcoded text in components

---

## Verification Commands

After implementation, run:

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Unit tests
pnpm test:unit

# E2E tests (start dev server first)
pnpm dev
# In another terminal:
pnpm test:e2e

# Manual checks
# 1. Visit /en/dashboard - verify Tenders page
# 2. Visit /en/dashboard/opportunities - verify Opportunities page
# 3. Visit /en/settings - verify Settings page
# 4. Switch to Arabic (/ar/*) - verify RTL
# 5. Test on mobile viewport
```

---

*These acceptance criteria serve as the gate for Phase 2 (Implementation) approval.*
