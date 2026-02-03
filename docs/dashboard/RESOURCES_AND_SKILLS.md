# Resources & Skills — Dashboard UX Implementation

**Protocol Phase:** Research & Planning
**Purpose:** Identify all skills, MCPs, and subagents needed for implementation

---

## Skills to Activate

### Core UI/UX Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `react-dev` | React component patterns | All component development |
| `react-patterns` | React best practices | State management, hooks |
| `react-components` | Component architecture | New component design |
| `nextjs-app-router-patterns` | Next.js App Router patterns | Routing, layouts |
| `next-best-practices` | Next.js optimization | SSR, data fetching |

### Design System Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `tailwind-css-patterns` | Tailwind utilities | Styling components |
| `tailwind-design-system` | Design token usage | Token application |
| `shadcn-ui` | ShadCN component library | Using existing components |
| `responsive-design` | Responsive layouts | Mobile/tablet adaptations |
| `accessibility-compliance` | A11y requirements | ARIA, keyboard nav |

### Animation Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `motion` | Framer Motion patterns | KPI animations, transitions |

### Form & Data Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `react-hook-form-zod` | Form handling | Settings forms |
| `tanstack-table` | Table patterns | Tenders/Opportunities tables |
| `tanstack-query` | Data fetching | Server state management |

### Testing Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `e2e-testing-patterns` | E2E test patterns | Playwright tests |
| `javascript-testing-patterns` | Unit tests | Component tests |
| `vitest` | Test runner | Unit test execution |

### Code Quality Skills
| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `typescript-advanced-types` | TypeScript patterns | Type definitions |
| `code-review-excellence` | Code review | PR review |
| `verification-before-completion` | Final validation | Before marking done |
| `systematic-debugging` | Debugging | If issues arise |

---

## Subagents to Deploy

### During Implementation

| Subagent | Type | When to Use |
|----------|------|-------------|
| `Explore` | Research | Finding existing patterns, similar components |
| `Bash` | Execution | Running builds, tests, type checks |
| `Plan` | Architecture | Complex component design decisions |

### During Quality Assurance

| Subagent | Type | When to Use |
|----------|------|-------------|
| `test-runner` | Validation | Running test suites |
| `verifier` | Review | Independent code validation |
| `security-auditor` | Security | Form handling, data exposure |

---

## MCP Tools Available

### Context7 (Official Docs)
- Fetch React 19 documentation
- Fetch Next.js 15 App Router docs
- Fetch Tailwind v4 documentation
- Fetch Framer Motion patterns

### Web Tools
- `WebSearch` for design pattern research
- `WebFetch` for official documentation

### Code Tools
- `Grep` for pattern searching in codebase
- `Glob` for file discovery
- `Read`/`Edit`/`Write` for code changes

---

## Existing Codebase Patterns to Follow

### Component Structure
```typescript
// Follow existing pattern from components/dashboard/
export interface ComponentProps {
  // Props interface first
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks at top
  const { t } = useTranslations('namespace');

  // State
  const [state, setState] = useState();

  // Derived state
  const computed = useMemo(() => ..., [deps]);

  // Effects
  useEffect(() => ..., [deps]);

  // Handlers
  const handleAction = useCallback(() => ..., [deps]);

  // Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

### Styling Pattern
```typescript
// Use Tailwind + design tokens
// tokens.css variables accessible via var()
<div className="bg-[var(--surface-card)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
```

### Animation Pattern
```typescript
// Framer Motion with motion config
import { motion } from 'framer-motion';
import { useMotionConfig } from '@/lib/motion';

const { reduceMotion, transition } = useMotionConfig();

<motion.div
  initial={reduceMotion ? false : { opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={transition}
>
```

### i18n Pattern
```typescript
// Use next-intl
import { useTranslations } from 'next-intl';

const t = useTranslations('dashboard');
// Then: t('keyName')
// Or with interpolation: t('greeting', { name: 'User' })
```

### Data Fetching Pattern
```typescript
// Server Component (page.tsx)
import { getTenders } from '@/lib/queries/tender';

export default async function Page() {
  const tenders = await getTenders();
  return <ClientComponent tenders={tenders} />;
}
```

---

## Files to Reference

### Core Components (Patterns to Follow)
- [tenders-list-client.tsx](components/dashboard/tenders-list-client.tsx) — Main list component
- [dashboard-kpi-row.tsx](components/dashboard/dashboard-kpi-row.tsx) — KPI cards
- [tender-detail-view.tsx](components/dashboard/tender-detail-view.tsx) — Detail layout
- [app-sidebar.tsx](components/layout/app-sidebar.tsx) — Sidebar navigation

### Design Tokens
- [globals.css](app/globals.css) — All CSS variables
- [tokens.css](styles/tokens.css) — Design token definitions
- [animations.css](styles/animations.css) — Animation keyframes

### Data Layer
- [tender.ts](lib/queries/tender.ts) — Tender queries
- [crm.ts](actions/crm.ts) — CRM actions
- [evaluation.ts](lib/evaluation/index.ts) — Evaluation logic

### i18n
- [en.json](messages/en.json) — English translations
- [ar.json](messages/ar.json) — Arabic translations

---

## Implementation Order

Based on dependencies and complexity:

### Wave 1: Foundation (Independent)
1. Sidebar navigation cleanup
2. Page titles/subtitles
3. i18n keys setup

### Wave 2: Tenders Page
1. TenderIngestionStrip component
2. Bulk actions bar
3. Table row enhancements
4. Empty state enhancement

### Wave 3: Tender Detail
1. Decision Panel layout
2. Action button states
3. Evaluation tabs
4. Score breakdown enhancements

### Wave 4: Opportunities
1. Opportunities KPI row
2. Status column
3. Bulk push functionality
4. Manual export

### Wave 5: Settings
1. Settings navigation
2. Profile section
3. CRM integration section
4. Appearance section
5. Data export section

### Wave 6: Polish
1. Mobile responsive adjustments
2. RTL verification
3. Animation refinements
4. Accessibility audit

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Incremental changes, test after each component |
| Design token inconsistency | Lint for hardcoded colors |
| i18n missing keys | Run translation extraction script |
| Mobile layout issues | Test early on mobile viewport |
| Animation performance | Profile with React DevTools |
| Accessibility gaps | Run axe-core audit |

---

*This document guides resource allocation during implementation.*
