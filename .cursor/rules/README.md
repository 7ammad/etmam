# Cursor Rules & Skills for Etmaam

This directory contains **Agent Skills** adapted from [skills.sh](https://skills.sh/) to guide the AI in building Etmaam according to best practices.

## Available Skills

### 1. `planning-with-files.md`
**Purpose:** Break down complex tasks into small, actionable steps with exact file paths.

**When to use:**
- Before starting any feature implementation
- When creating detailed implementation plans
- When breaking down Blueprint phases into tasks

**Key principle:** Every task must reference exact file paths, not vague descriptions.

---

### 2. `nextjs-best-practices.md`
**Purpose:** Ensure Next.js 16 App Router best practices.

**When to use:**
- When creating Server Components
- When implementing Server Actions
- When setting up data fetching

**Key principles:**
- Server Components by default
- Server Actions for mutations (not API Routes)
- Direct `await` in Server Components (not `useEffect`)

---

### 3. `supabase-postgres-best-practices.md`
**Purpose:** Secure, performant database operations with RLS.

**When to use:**
- When creating database tables
- When writing queries
- When setting up authentication

**Key principles:**
- RLS enabled on ALL tables (mandatory)
- Use generated TypeScript types
- Index foreign keys and frequently queried columns

---

### 4. `rtl-arabic-ui.md`
**Purpose:** Perfect RTL support for Arabic interface.

**When to use:**
- When creating any UI component
- When styling layouts
- When handling text/numbers/dates

**Key principles:**
- Use logical CSS properties (`ms-`, `me-`, `start-`, `end-`)
- Auto-flip icons based on locale
- Test both `/ar` and `/en` routes

---

### 5. `writing-plans.md`
**Purpose:** Create detailed, executable implementation plans.

**When to use:**
- When planning a new phase
- When breaking down features
- When creating handoff documentation

**Key principles:**
- Complete code in plan (not placeholders)
- Reference exact file paths
- Include verification steps

---

## How to Use These Skills

### In Cursor Chat
Reference skills using `@` syntax:
```
@planning-with-files Break down Phase 2 into tasks
@nextjs-best-practices Create a Server Action for analyzing tenders
@rtl-arabic-ui Build a RTL-aware card component
```

### In Code Comments
Reference skills in code:
```typescript
// @nextjs-best-practices: Server Action pattern
'use server'
export async function analyzeTender(data: TenderData) {
  // Implementation
}
```

### During Planning
Use skills to guide planning:
1. Start with `@writing-plans` to create the plan
2. Use `@planning-with-files` to break down tasks
3. Reference specific skills in each task

---

## Integration with Stack-Agnostic Workflow

These skills align with the **Stack-Agnostic AI Development Workflow**:

- **Phase 0:** Skills installed ✅
- **Phase 1:** Use `@nextjs-best-practices` + `@rtl-arabic-ui`
- **Phase 2:** Use `@supabase-postgres-best-practices`
- **Phase 3:** Use `@nextjs-best-practices` for Server Actions
- **Phase 4:** Use `@rtl-arabic-ui` for A2UI components

---

## Adding New Skills

To add a skill from [skills.sh](https://skills.sh/):

1. Fetch the skill content
2. Adapt it to Etmaam's context (RTL, Arabic, Next.js 16)
3. Save to `.cursor/rules/[skill-name].md`
4. Update this README

---

## References

- Main workflow: `etmam-docs/The _Stack-Agnostic_ AI Development Workflow (Veri.md`
- Blueprint: `etmam-docs/Etmam-blueprint.md`
- Implementation plan: `etmam-docs/IMPLEMENTATION_PLAN.md`
- Schema: `etmam-docs/SCHEMA.md`
