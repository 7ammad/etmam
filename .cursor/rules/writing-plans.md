# Writing Plans Skill
# Source: https://skills.sh/obra/superpowers/writing-plans

## Purpose
Create detailed, executable implementation plans that break down complex features into small, testable tasks with exact file paths and complete code specifications.

## Planning Workflow

### Step 1: Understand Requirements
- Read the Blueprint phase requirements
- Identify dependencies on other phases
- List all files that need creation/modification

### Step 2: Break Down into Tasks
Each task should:
- Be completable in 1-2 hours
- Have clear success criteria
- Reference exact file paths
- Include complete code (not placeholders)

### Step 3: Structure the Plan
```markdown
# Implementation Plan: [Feature Name]

## Overview
Brief description of what this plan achieves.

## Dependencies
- Task X from Phase Y must complete first
- File Z must exist before starting

## Tasks

### Task 1: [Specific Component/Feature]
**Files:**
- Create: `components/ui/tender-card.tsx`
- Modify: `app/[locale]/dashboard/page.tsx:45-67`
- Test: `__tests__/components/ui/tender-card.test.tsx`

**Implementation:**
```typescript
// Complete code here, not "add validation"
export function TenderCard({ tender }: { tender: Tender }) {
  // Full implementation
}
```

**Verification:**
- [ ] Component renders in RTL layout
- [ ] Dark mode styles apply correctly
- [ ] TypeScript compiles without errors
- [ ] Unit tests pass (5/5)
- [ ] Accessibility audit passes

**Dependencies:** None (or Task 2.3)

---

### Task 2: [Next Task]
...
```

## Key Principles

### 1. Exact File Paths
- ✅ `Create: components/ui/tender-card.tsx`
- ❌ `Create: a card component`

### 2. Complete Code
- ✅ Full function with types, error handling
- ❌ `Add validation` or `Implement feature`

### 3. Test-Driven
- Write test first (failing)
- Implement to pass test
- Refactor if needed

### 4. Reference Skills
- Use `@planning-with-files` for task breakdown
- Use `@nextjs-best-practices` for App Router patterns
- Use `@supabase-postgres-best-practices` for DB operations
- Use `@rtl-arabic-ui` for UI components

### 5. DRY, YAGNI, TDD
- **DRY:** Don't Repeat Yourself
- **YAGNI:** You Aren't Gonna Need It (avoid over-engineering)
- **TDD:** Test-Driven Development

## Integration with TodoWrite
After creating the plan:
1. Create TodoWrite items for each task
2. Mark first task as `in_progress`
3. Execute tasks sequentially
4. Mark complete when verification passes

## Execution Handoff
After saving plan to `etmam-docs/plans/[feature-name].md`:

**Option 1: Subagent-Driven (this session)**
- Use `@subagent-driven-development` skill
- Dispatch fresh subagent per task
- Review between tasks

**Option 2: Parallel Session**
- Guide user to open new Cursor session
- Use `@executing-plans` skill in new session
- Batch execution with checkpoints

## Example: Phase 1 Plan

```markdown
# Phase 1: Foundation & Arabic First Setup

## Overview
Create working Next.js 16 shell with perfect RTL/LTR and Dark Mode support.

## Tasks

### Task 1.1: Initialize Next.js 16 Project
**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`

**Implementation:**
[Complete package.json with exact dependencies]

**Verification:**
- [ ] `npm install` succeeds
- [ ] `npm run dev` starts on port 3000

### Task 1.2: Configure Tailwind CSS v4 with RTL
**Files:**
- Create: `tailwind.config.ts`
- Create: `app/globals.css`

**Implementation:**
[Complete Tailwind config with RTL support]

**Verification:**
- [ ] RTL classes work (`ms-4`, `me-2`)
- [ ] Dark mode classes apply
```
