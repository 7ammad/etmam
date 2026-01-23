# Etmaam Quick Start Guide
# Pre-Building Documentation & Cursor Setup

## Overview
This guide helps you start building Etmaam using the Stack-Agnostic AI Development Workflow with Cursor AI.

## Prerequisites

1. **Cursor IDE** installed
2. **Node.js 18+** installed
3. **Supabase account** (free tier works)
4. **Git** initialized in project

## Step 1: Review Documentation

Read these files in order:
1. `Etmam-blueprint.md` - Project requirements and goals
2. `The _Stack-Agnostic_ AI Development Workflow (Veri.md` - Development methodology
3. `IMPLEMENTATION_PLAN.md` - Detailed task breakdown
4. `SCHEMA.md` - Database structure

## Step 2: Understand the Skills

Skills are installed in `.cursor/rules/`:
- **planning-with-files.md** - Task breakdown
- **nextjs-best-practices.md** - Next.js patterns
- **supabase-postgres-best-practices.md** - Database security
- **rtl-arabic-ui.md** - RTL/Arabic UI
- **writing-plans.md** - Plan creation

Read `.cursor/rules/README.md` for details.

## Step 3: Start Building

### Option A: Use Cursor Chat with Skills

1. Open Cursor Chat (`Ctrl+L` or `Cmd+L`)
2. Reference skills using `@` syntax:
   ```
   @planning-with-files Break down Phase 1 into tasks
   ```
3. Follow the generated plan

### Option B: Follow the Implementation Plan

1. Open `IMPLEMENTATION_PLAN.md`
2. Start with **Task 1.1: Initialize Next.js 16 Project**
3. Complete tasks sequentially
4. Mark verification checkboxes as you go

## Step 4: Key Commands

### Initialize Project
```bash
npm install
npm run dev
```

### Generate Supabase Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### Run Tests
```bash
npm test
```

## Step 5: Verification Checklist

Before moving to next phase, verify:
- [ ] TypeScript compiles (`npm run build`)
- [ ] RTL layout works (`/ar` route)
- [ ] Dark mode works (theme toggle)
- [ ] All tests pass
- [ ] No console errors

## Common Issues

### RTL Not Working
- Check `dir="rtl"` in root layout
- Verify Tailwind logical properties (`ms-`, `me-`)
- Test both `/ar` and `/en` routes

### Supabase Connection Failed
- Check `.env.local` has correct keys
- Verify RLS policies are enabled
- Check network tab for CORS errors

### TypeScript Errors
- Run `npm run build` to see all errors
- Check `tsconfig.json` strict mode settings
- Verify Supabase types are generated

## Next Steps

1. Complete **Phase 1** (Foundation)
2. Move to **Phase 2** (Data Engine)
3. Continue through all phases

## Getting Help

- Reference `.cursorrules` for project context
- Use skills in `.cursor/rules/` for specific patterns
- Check `IMPLEMENTATION_PLAN.md` for task details

---

**Remember:** Follow the Stack-Agnostic workflow - Schema First, RTL Native, Server Components by Default!
