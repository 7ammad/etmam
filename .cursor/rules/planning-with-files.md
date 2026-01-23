# Planning With Files Skill
# Source: https://skills.sh/othmanadi/planning-with-files

## Purpose
Break down complex tasks into small, actionable steps with file-level precision. This skill ensures every task references exact file paths and includes complete implementation details.

## When to Use
- Before starting any feature implementation
- When breaking down Phase 1-5 tasks from the Blueprint
- When creating implementation plans for subagents

## Planning Template

### Task Structure
```markdown
### Task N: [Component/Feature Name]

**Files:**
- Create: `exact/path/to/file.tsx`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

**Step 1: [Specific Action]**
- Exact code changes needed
- Expected output/behavior
- Dependencies on other tasks

**Step 2: [Next Specific Action]**
...

**Verification:**
- [ ] Test passes
- [ ] TypeScript compiles
- [ ] RTL layout verified
- [ ] Dark mode tested
```

## Key Principles

### 1. Exact File Paths Always
- Never say "add validation" - say "add Zod schema validation in `lib/validations/tender.ts`"
- Never say "create component" - say "create `components/ui/tender-card.tsx`"

### 2. Complete Code in Plan
- Include full function signatures
- Show exact imports needed
- Provide example usage

### 3. Reference Dependencies
- List which tasks must complete first
- Reference specific file/function names
- Include task IDs for traceability

### 4. Verification Steps
- Always include test requirements
- Specify RTL/LTR testing
- Include dark mode checks
- Verify TypeScript types

## Example: Breaking Down "Phase 1: Foundation"

```markdown
### Task 1.1: Initialize Next.js 16 Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`

**Step 1: Create package.json**
```json
{
  "name": "etmaam",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "next": "16.1.4",
    "react": "^18.3.1"
  }
}
```

**Verification:**
- [ ] `npm install` succeeds
- [ ] `npm run dev` starts server
```

## Integration with TodoWrite
- Create one TodoWrite item per task
- Mark as `in_progress` when starting
- Mark as `completed` when verification passes
- Reference task ID in commit messages

## Execution Handoff
After saving the plan, offer execution choice:
1. **Subagent-Driven (this session)** - Dispatch fresh subagent per task
2. **Parallel Session (separate)** - Open new session with executing-plans skill
