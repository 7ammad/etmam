# Session Starter & QC Framework

## Part 1: Cursor Agent Session Starter

Copy this prompt to start implementation with Cursor agents:

---

### SESSION STARTER PROMPT

```markdown
# Dashboard UX Implementation — World-Class UI

## Context
I'm implementing a world-class dashboard UI for the Etmam tender management system. The planning phase is complete with full specs.

## Reference Documents (READ THESE FIRST)
1. `docs/dashboard/WORLD_CLASS_UX_PLAN.md` — Full design spec
2. `docs/dashboard/ACCEPTANCE_CRITERIA.md` — Testable requirements
3. `docs/dashboard/RESOURCES_AND_SKILLS.md` — Skills and patterns to use

## Implementation Protocol
Follow `WORKFLOW.md` (Implementation Protocol v2.0):
- Research & Planning → Implementation → Quality Assurance → Delivery
- Use skills from `.cursor/skills/` and `.agents/skills/`
- Run tests after each component
- Validate against acceptance criteria

## Current Task
Implement [WAVE X] from the plan. Start with:

### Wave 1: Foundation
- [ ] Sidebar navigation cleanup (remove duplicate, 3 items only)
- [ ] Page titles/subtitles with dynamic counts
- [ ] i18n keys setup

### Wave 2: Tenders Page
- [ ] TenderIngestionStrip component
- [ ] Bulk actions bar (wire checkboxes)
- [ ] Table row accent bars
- [ ] Empty state enhancement

### Wave 3: Tender Detail (V2 Engine)
- [ ] Decision Panel with Dual-Track visualization (Infratech/Exotech fit)
- [ ] AI Price Intelligence display
- [ ] 6-dimension Score Breakdown (V2 Engine)
- [ ] Evaluation tabs (replace stacked cards)

### Wave 4: Opportunities
- [ ] 3-card KPI row
- [ ] Status column (Ready/Pushed/Failed)
- [ ] Bulk push functionality
- [ ] Manual Excel export

### Wave 5: Settings
- [ ] Settings sidebar navigation
- [ ] CRM connection test
- [ ] Appearance settings
- [ ] Data export section

## Key V2 Engine Requirements
1. **Dual-Track Visualization**: Show Infratech Fit (Cyan) and Exotech Fit (Purple) alongside Total Score
2. **AI Price Intelligence**: Display `predicted_value_sar` as "AI Model Estimate" with sparkle icon
3. **6 Dimensions**: Service Fit, Budget Fit, Timeline Fit, Complexity Fit, Strategic Fit, Risk Score

## Design Tokens (Use These, No Hardcoded Colors)
- Primary: `--color-primary-500` (Emerald)
- Infratech: `--color-infratech-500` (#06b6d4 Cyan)
- Exotech: `--color-exotech-500` (#8b5cf6 Purple)
- Surfaces: `--surface-card`, `--surface-page`, `--surface-muted`
- Shadows: `--shadow-card`, `--shadow-sm`
- Radius: `--radius-card`, `--radius-md`

## Skills to Activate
- react-dev, react-patterns, react-components
- nextjs-app-router-patterns, next-best-practices
- tailwind-css-patterns, shadcn-ui
- motion (Framer Motion)
- accessibility-compliance
- verification-before-completion

## Quality Gates
After each wave:
1. `pnpm type-check` — must pass
2. `pnpm lint` — must pass
3. Visual check in browser (EN and AR)
4. Mobile viewport test

## DO NOT
- Use hardcoded colors (use tokens)
- Skip RTL testing
- Break existing functionality
- Add features not in the plan

Start with Wave [X]. Implement one component at a time, validate, then proceed.
```

---

## Part 2: Claude Opus QC Manager Role

When you start a new session with me (Opus) for QC/validation, use this prompt:

---

### QC MANAGER SESSION STARTER

```markdown
# QC Manager Session — Dashboard UX Implementation

## Your Role
You are the Quality Control Manager and Validator for the Etmam Dashboard UX implementation. Your job is to:

1. **Review code changes** against acceptance criteria
2. **Validate design token usage** (no hardcoded colors)
3. **Check accessibility compliance** (ARIA, keyboard nav, contrast)
4. **Verify RTL support** (Arabic locale)
5. **Confirm V2 Engine integration** (dual-track, 6 dimensions, AI pricing)
6. **Gate approval** for each wave before proceeding
7. **Identify the official docs / implementation way** and **bridge the gap** (point to spec, AC, or patterns; do not implement)

## QC Agent Scope — Do Not
- **Never implement** a new wave or task. You only review.
- **Never run** implementation work (no new components, no new features).
- You **only**: review completed work, flag issues, identify where official docs say it should be done, and bridge the gap (e.g. "AC-1.4 says X; code does Y at line Z").
- "Next Steps" = what the **developer** should do (fix list, or that another agent implements the next wave). You do not implement.

## Reference Documents
- `docs/dashboard/WORLD_CLASS_UX_PLAN.md`
- `docs/dashboard/ACCEPTANCE_CRITERIA.md`
- `docs/dashboard/RESOURCES_AND_SKILLS.md`

## QC Checklist Per Wave

### Wave Validation Template
For each completed wave, verify:

**Code Quality**
- [ ] TypeScript types correct (no `any`)
- [ ] Design tokens used (grep for hardcoded hex/rgb)
- [ ] Component follows existing patterns
- [ ] No console.log/debug code left

**Functionality**
- [ ] Acceptance criteria items checked
- [ ] Edge cases handled (empty, error, loading)
- [ ] Actions trigger correct behavior

**Design**
- [ ] Matches spec in WORLD_CLASS_UX_PLAN.md
- [ ] Animations respect prefers-reduced-motion
- [ ] Responsive on mobile viewport

**Accessibility**
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Focus states visible
- [ ] Color contrast AA compliant

**i18n**
- [ ] All strings in messages/*.json
- [ ] RTL layout correct in Arabic
- [ ] No hardcoded text

**V2 Engine (Wave 3)**
- [ ] Dual-track shows Infratech + Exotech fit
- [ ] 6 dimensions displayed correctly
- [ ] AI Price Intelligence with sparkle icon
- [ ] Routing badge matches evaluation

## Gate Decision
After review, issue one of:
- **PASS** — Wave approved, proceed to next
- **FAIL** — List issues, must fix before proceeding
- **CONDITIONAL** — Minor issues, can proceed but must address

## Skills to Use
- verification-before-completion
- code-review-excellence
- accessibility-compliance
- systematic-debugging (if issues found)

## Output Format
For each review, provide:
1. **Wave**: [X]
2. **Files Reviewed**: [list]
3. **Checklist Results**: [pass/fail per item]
4. **Issues Found**: [list with file:line references]
5. **Gate Decision**: [PASS/FAIL/CONDITIONAL]
6. **Next Steps**: [what the **developer** (or implementation agent) should do — fix list, or proceed to next wave; QC does not implement]
```

---

## Part 3: Implementation Handoff Checklist

Before switching to Cursor agents, confirm:

- [x] WORLD_CLASS_UX_PLAN.md updated with V2 Engine requirements
- [x] ACCEPTANCE_CRITERIA.md updated with V2 Engine requirements
- [x] Dual-track visualization spec (Infratech/Exotech)
- [x] AI Price Intelligence spec
- [x] 6-dimension Score Breakdown spec
- [x] Session starter prompt ready
- [x] QC Manager role defined

### Part 3 Verification Report

| Item | Location | Status |
|------|----------|--------|
| WORLD_CLASS_UX_PLAN.md V2 | `docs/dashboard/WORLD_CLASS_UX_PLAN.md` — §2.1.1 Dual-Track, §2.4 AI Price, §2.3 6-dimension Breakdown | ✅ Verified |
| ACCEPTANCE_CRITERIA.md V2 | `docs/dashboard/ACCEPTANCE_CRITERIA.md` — AC-2.1 (Dual-Track), AC-2.4 (6 dimensions), AC-2.7 (AI Price) | ✅ Verified |
| Dual-track spec | WORLD_CLASS_UX_PLAN.md §2.1.1 — Infratech/Exotech fit bars, routing badge (INFRATECH/EXOTECH/JOINT/NO_BID) | ✅ Verified |
| AI Price Intelligence spec | WORLD_CLASS_UX_PLAN.md §2.4 — predicted_value_sar as "AI Model Estimate", sparkle icon, variance | ✅ Verified |
| 6-dimension Score Breakdown spec | WORLD_CLASS_UX_PLAN.md §2.3 — Service/Budget/Timeline/Complexity/Strategic/Risk with icons, tooltips, weights | ✅ Verified |
| Session starter prompt | Part 1 above — Waves 1–5 task list, V2 requirements, design tokens, quality gates | ✅ Ready |
| QC Manager role | Part 2 above — QC checklist, gate decision (PASS/FAIL/CONDITIONAL), next steps (developer) | ✅ Defined |

**Handoff status:** All Part 3 items verified. Ready to use Part 1 (Session Starter) for implementation and Part 2 (QC Manager) for wave reviews.

---

## Part 4: Wave-by-Wave QC Schedule

| Wave | Implemented By | Reviewed By | Gate |
|------|----------------|-------------|------|
| 1: Foundation | Cursor Agent | Opus QC | [x] PASS ✅ |
| 2: Tenders Page | Cursor Agent | Opus QC | [x] PASS ✅ |
| 3: Tender Detail (V2) | Cursor Agent | Opus QC | [x] PASS ✅ |
| 4: Opportunities | Cursor Agent | Opus QC | [x] PASS ✅ |
| 5: Settings | Cursor Agent | Opus QC | [x] PASS ✅ |
| 6: Polish | Cursor Agent | Opus QC | [x] PASS ✅ |

### QC Review Summary (2026-02-03)

**Verification Results:**
- `pnpm type-check` — PASSED (no errors)
- `pnpm lint` — PASSED (0 errors, 4 warnings unrelated to dashboard)

**Key V2 Engine Features Verified:**
- Dual-Track Visualization (Infratech/Exotech fit bars with routing badge)
- 6-dimension Score Breakdown with tooltips and weights
- AI Price Intelligence with sparkle icon and variance indicator
- All design tokens used correctly (no hardcoded colors in dashboard)

**Wave 6 Polish Audit (2026-02-03):**

| Cross-Cutting Requirement | Status |
|--------------------------|--------|
| CC-1: Design Tokens | PASS |
| CC-2: RTL Support | PASS |
| CC-3: Accessibility | PASS |
| CC-4: Responsive Design | PASS |
| CC-5: Loading States | PASS |
| CC-6: Error Handling | PASS |
| CC-7: Animations | PASS |
| CC-8: i18n | PASS |

See [WAVE6_POLISH_AUDIT.md](WAVE6_POLISH_AUDIT.md) for full audit details.

**All waves complete and meet acceptance criteria. Dashboard ready for production.**

---

## Part 5: Quick Reference — V2 Engine Data Points

From `types/evaluation.ts` and `lib/evaluation/`:

```typescript
// Dual-Track Scores
infratech_fit: number;  // 0-100, Cyber/Infra/OT alignment
exotech_fit: number;    // 0-100, AI/Data/Robotics alignment

// Routing Decision
routing_decision: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID';

// AI Price Intelligence
predicted_value_sar: number;      // AI model estimate
predicted_budget_min: number;     // Range low
predicted_budget_max: number;     // Range high

// 6 Dimensions
breakdown: {
  service_fit: number;    // 0-100
  budget_fit: number;     // 0-100
  timeline_fit: number;   // 0-100
  complexity_fit: number; // 0-100
  strategic_fit: number;  // 0-100
  risk_score: number;     // 0-100 (lower = better)
}
```

---

*This document serves as the handoff package for implementation and QC.*
