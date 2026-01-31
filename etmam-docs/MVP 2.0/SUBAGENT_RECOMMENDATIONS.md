# Subagent Recommendations for Etmaam Project

**Based on:** Cursor Subagents Best Practices + Project Analysis  
**Date:** 2026-01-27  
**Status:** Recommendations Ready

---

## 📚 Best Practices Summary (from Cursor Docs)

### ✅ When to Use Subagents

1. **Context Isolation** - Long research/exploration tasks that generate large intermediate output
2. **Parallel Execution** - Multiple independent workstreams that can run simultaneously
3. **Specialized Expertise** - Complex workflows requiring deep domain knowledge
4. **Independent Verification** - Skeptical validation of completed work
5. **Noisy Intermediate Output** - Tasks with verbose logs/output that should be isolated

### ❌ When NOT to Use Subagents

- Simple, single-purpose tasks → Use **skills** instead
- Quick, repeatable actions → Use **skills** instead
- Tasks that complete in one shot → Use **skills** instead

### 🎯 Best Practices

- **Start with 2-3 focused subagents** - Don't create dozens
- **Single responsibility** - Each subagent does one thing well
- **Invest in descriptions** - Specific, trigger-friendly descriptions enable automatic delegation
- **Keep prompts concise** - Long prompts don't make subagents smarter
- **Use `model: fast`** for verification/analysis tasks
- **Use `model: inherit`** for complex implementation tasks

---

## 🎯 Recommended Subagents for Etmaam

Based on your project structure, here are the **3 most valuable subagents** to create:

### 1. **verifier** (High Priority)

**Purpose:** Phase verification, test execution, implementation validation

**Why it's needed:**
- You have phase-based verification workflows (`verify-phase-1.ts`, `verify-phase-2.ts`)
- Multiple verification checkpoints across phases
- Need independent validation that claimed work actually works

**Configuration:**
```yaml
name: verifier
description: Validates completed work. Use after tasks are marked done to confirm implementations are functional. Use proactively for phase verification.
model: fast
is_background: false
```

**Use Cases:**
- Verify Phase 1, Phase 2, Phase 3 completion
- Run verification scripts and report results
- Test that implementations match requirements
- Validate database migrations
- Check TypeScript compilation

**Example Invocation:**
```
/verifier verify Phase 2 is complete
/verifier run verify-phase-2.ts and report results
```

---

### 2. **code-reviewer** (High Priority)

**Purpose:** PR reviews, code quality audits, best practices enforcement

**Why it's needed:**
- You have code review processes (`CODE_REVIEW_PROMPT_PHASE_0_1.md`)
- Multiple skills for code review (code-review-excellence, systematic-debugging)
- Need comprehensive analysis across security, performance, maintainability

**Configuration:**
```yaml
name: code-reviewer
description: Comprehensive code review specialist. Use proactively for PR reviews, code quality audits, and best practices enforcement. Reviews Next.js, Supabase, TypeScript code.
model: inherit
```

**Use Cases:**
- Review scraper implementation
- Audit database migrations
- Review API routes for security
- Check RTL/Arabic UI compliance
- Validate TypeScript patterns

**Example Invocation:**
```
/code-reviewer review the scraper implementation
/code-reviewer audit Phase 1 database changes
```

---

### 3. **scraper-validator** (Medium Priority)

**Purpose:** Scraper output validation, Etimad data quality checks

**Why it's needed:**
- Scraper workflows generate intermediate output
- Need to validate scraped data quality
- Multiple scraper scripts (`test-scraper.ts`, `run-scraper.ts`)

**Configuration:**
```yaml
name: scraper-validator
description: Validates scraper output and Etimad data quality. Use when testing scrapers or verifying scraped tender data completeness.
model: fast
is_background: false
```

**Use Cases:**
- Validate scraped tender fields (booklet_price, initial_guarantee, duration)
- Check data quality before database upsert
- Verify scraper retry logic works
- Test rate limiting compliance

**Example Invocation:**
```
/scraper-validator validate the last scraper run output
/scraper-validator check if all required fields were extracted
```

---

## 🔄 Optional Subagents (Consider Later)

### 4. **test-runner** (Optional - if test suite grows)

**Purpose:** Automated test execution, failure analysis

**When to add:** When you have 20+ tests or complex test suites

**Configuration:**
```yaml
name: test-runner
description: Test automation expert. Use proactively to run tests and fix failures. Handles Jest, Playwright, and E2E tests.
model: fast
```

---

### 5. **migration-validator** (Optional - if migrations become complex)

**Purpose:** Database migration verification, schema validation

**When to add:** When you have 10+ migrations or complex schema changes

**Configuration:**
```yaml
name: migration-validator
description: Validates database migrations and schema changes. Use when creating or reviewing Supabase migrations.
model: fast
```

---

## 🚫 Anti-Patterns to Avoid

### ❌ Don't Create These

1. **Generic "helper" subagent** - Too vague, Agent won't know when to use it
2. **"general-coder" subagent** - Use skills for quick coding tasks
3. **"documentation-generator" subagent** - Single-purpose, use a skill instead
4. **More than 5 subagents total** - Start with 2-3, add only when needed

---

## 📋 Implementation Plan

### Phase 1: Create Core Subagents (Week 1)

1. ✅ **subagent-advisor** - Already created (helps identify subagents)
2. **verifier** - Create next (highest value)
3. **code-reviewer** - Create after verifier

### Phase 2: Add Specialized Subagents (Week 2-3)

4. **scraper-validator** - Add when scraper testing becomes frequent

### Phase 3: Evaluate Need for Optional (Month 2+)

5. **test-runner** - Only if test suite grows significantly
6. **migration-validator** - Only if migrations become complex

---

## 🎯 How to Use the Subagent Advisor

The `subagent-advisor` subagent can analyze your project and recommend subagents:

```
/subagent-advisor analyze the project and recommend subagents
/subagent-advisor review existing subagents for optimization
/subagent-advisor identify delegation opportunities
```

---

## 📖 References

- **Cursor Subagents Docs:** https://cursor.com/docs/context/subagents
- **Best Practices:** Focused subagents, specific descriptions, start with 2-3
- **Project Structure:** Phase-based workflows, verification scripts, code review processes

---

## ✅ Next Steps

1. **Create verifier subagent** - Highest priority
2. **Create code-reviewer subagent** - High priority  
3. **Test subagent delegation** - Verify Agent uses them automatically
4. **Refine descriptions** - Optimize for automatic triggering

---

**Last Updated:** 2026-01-27  
**Status:** Ready for implementation
