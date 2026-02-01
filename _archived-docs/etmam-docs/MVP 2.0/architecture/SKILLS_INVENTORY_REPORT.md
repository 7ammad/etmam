# Skills Inventory & Recommendations Report

**Date:** 2026-01-27  
**Project:** Etmaam CRM - Phase 1 Review  
**Status:** Skills Analysis Complete

---

## 📦 Currently Installed Skills (Local)

### 1. ✅ `supabase-postgres-best-practices`
**Location:** `.cursor/skills/supabase-postgres-best-practices/`  
**Status:** ✅ ACTIVE - Already using for migration review  
**Use Cases:**
- Database schema design
- Migration review
- Query optimization
- Index strategy
- RLS policies

**Rules Available:**
- `schema-data-types.md` - Data type selection ✅ (Used for review)
- `query-partial-indexes.md` - Partial index patterns ✅ (Used for review)
- `advanced-jsonb-indexing.md` - JSONB indexing ✅ (Identified missing GIN index)
- `schema-foreign-key-indexes.md` - FK indexing
- `security-rls-basics.md` - RLS setup
- 20+ more rules

---

### 2. ✅ `vercel-react-best-practices`
**Location:** `.cursor/skills/vercel-react-best-practices/`  
**Status:** ✅ Available for TypeScript/React code  
**Use Cases:**
- TypeScript type definitions
- React component patterns
- Next.js App Router patterns
- Server Actions
- Bundle optimization

**Relevant for Phase 1:**
- Type system updates (TypeScript)
- Schema validation (Zod)

---

### 3. ✅ `frontend-design`
**Location:** `.cursor/skills/frontend-design/`  
**Status:** Available (not needed for Phase 1)  
**Use Cases:** UI/UX design (Phase 3)

---

### 4. ✅ `web-design-guidelines`
**Location:** `.cursor/skills/web-design-guidelines/`  
**Status:** Available (not needed for Phase 1)  
**Use Cases:** UI accessibility review (Phase 3)

---

### 5. ✅ `webapp-testing`
**Location:** `.cursor/skills/webapp-testing/`  
**Status:** Available  
**Use Cases:**
- Test migration locally
- Verify database changes
- E2E testing (later phases)

---

### 6. ✅ `skills-sh`
**Location:** `.cursor/skills/skills-sh/`  
**Status:** Helper for discovering more skills  
**Use Cases:** Find and install additional skills

---

## 🌐 Globally Available Skills (From Agent Skills List)

### Database & Schema Skills (Highly Relevant)

#### `wshobson/agents/postgresql-table-design`
**Status:** Not installed  
**Relevance:** ⭐⭐⭐⭐⭐  
**Use For:**
- Table design patterns
- Column type selection
- Migration strategies

**Install:**
```bash
npx skills add wshobson/agents/postgresql-table-design
```

---

#### `wshobson/agents/sql-optimization-patterns`
**Status:** Not installed  
**Relevance:** ⭐⭐⭐⭐  
**Use For:**
- Query optimization
- Index strategies
- Performance tuning

---

### Code Review Skills (Highly Relevant)

#### `obra/superpowers/requesting-code-review`
**Status:** Not installed  
**Relevance:** ⭐⭐⭐⭐⭐  
**Use For:**
- Systematic code review
- Migration review checklist
- Type safety verification

**Install:**
```bash
npx skills add obra/superpowers/requesting-code-review
```

---

#### `obra/superpowers/receiving-code-review`
**Status:** Not installed  
**Relevance:** ⭐⭐⭐⭐  
**Use For:**
- Processing review feedback
- Fixing issues systematically

---

#### `wshobson/agents/code-review-excellence`
**Status:** Not installed  
**Relevance:** ⭐⭐⭐⭐  
**Use For:**
- Comprehensive code review
- Best practices enforcement

---

### TypeScript & Type Safety Skills

#### `wshobson/agents/typescript-best-practices`
**Status:** Not installed (if exists)  
**Relevance:** ⭐⭐⭐⭐  
**Use For:**
- Type definition review
- Schema validation
- Type safety patterns

---

### Debugging & Verification Skills

#### `obra/superpowers/systematic-debugging`
**Status:** Not installed  
**Relevance:** ⭐⭐⭐⭐  
**Use For:**
- Debugging migration issues
- Verifying type changes
- Testing database schema

**Install:**
```bash
npx skills add obra/superpowers/systematic-debugging
```

---

## 🎯 Recommended Skills for Phase 1 Review

### Priority 1: Install Now

1. **`obra/superpowers/requesting-code-review`**
   - Systematic review of migration file
   - Checklist for type updates
   - Verification steps

2. **`wshobson/agents/postgresql-table-design`**
   - Validate data type choices
   - Migration patterns
   - Schema design best practices

### Priority 2: Consider Installing

3. **`obra/superpowers/systematic-debugging`**
   - Test migration locally
   - Verify changes step-by-step

4. **`wshobson/agents/code-review-excellence`**
   - Comprehensive review process
   - Best practices enforcement

---

## 📋 Skills Usage Plan for Phase 1

### Step 1: Migration Review ✅ (Current)
**Using:** `supabase-postgres-best-practices`
- ✅ Reviewed data types
- ✅ Checked index patterns
- ✅ Identified JSONB indexing need
- ✅ Verified idempotency

**Next:** Install `obra/superpowers/requesting-code-review` for systematic review

---

### Step 2: Type System Review (Next)
**Will Use:**
- `vercel-react-best-practices` - TypeScript patterns
- `obra/superpowers/requesting-code-review` - Review checklist

**Tasks:**
- Verify type definitions match migration
- Check Zod schema alignment
- Validate exports

---

### Step 3: Verification (After Fixes)
**Will Use:**
- `webapp-testing` - Test migration locally
- `obra/superpowers/systematic-debugging` - Step-by-step verification

---

## 🚀 Installation Commands

```bash
# Priority 1: Code review
npx skills add obra/superpowers/requesting-code-review

# Priority 1: Database design
npx skills add wshobson/agents/postgresql-table-design

# Priority 2: Debugging
npx skills add obra/superpowers/systematic-debugging

# Optional: Code review excellence
npx skills add wshobson/agents/code-review-excellence
```

---

## 📊 Skills Coverage Analysis

| Category | Installed | Recommended | Coverage |
|----------|-----------|-------------|----------|
| Database/Postgres | ✅ 1 | +2 | 75% |
| Code Review | ❌ 0 | +2 | 0% → 100% |
| TypeScript | ✅ 1 | +0 | 50% |
| Testing | ✅ 1 | +0 | 50% |
| Debugging | ❌ 0 | +1 | 0% → 50% |

---

## 🎯 Action Items

1. **Install Priority 1 Skills:**
   ```bash
   npx skills add obra/superpowers/requesting-code-review
   npx skills add wshobson/agents/postgresql-table-design
   ```

2. **Use Code Review Skill:**
   - Apply systematic review to migration file
   - Create review checklist
   - Document findings

3. **Continue with Type Review:**
   - Use installed skills for TypeScript review
   - Verify type alignment

---

## 📚 Resources

- **Skills.sh Website:** https://skills.sh/
- **Trending Skills:** https://skills.sh/trending
- **Local Skills:** `.cursor/skills/`
- **Global Skills:** Available via agent_skills (hundreds available)

---

## 💡 Key Insights

1. **We have good database skills** - `supabase-postgres-best-practices` is comprehensive
2. **Missing code review skills** - Would help with systematic review
3. **TypeScript skills available** - `vercel-react-best-practices` covers it
4. **Testing skills ready** - `webapp-testing` can verify migrations

**Recommendation:** Install code review and database design skills to enhance Phase 1 review quality.

---

**Next Steps:**
1. Install recommended skills
2. Apply code review skill to migration
3. Continue systematic review of TypeScript types
