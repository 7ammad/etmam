# Skills.sh – Curated 10x Stack for Etmam

**Stack:** Next.js, Supabase, TypeScript, Playwright, Radix/Tremor, AI SDK.

**Installed to:** `.agents/skills/` (symlinked for Cursor, Claude Code, GitHub Copilot, OpenCode). Your existing `.cursor/skills/` entries remain; the CLI adds/overwrites Cursor links in `.agents/skills/`.

---

## What we installed (batch run)

| Repo | Skills added |
|------|----------------|
| **vercel-labs/next-skills** | next-best-practices, next-cache-components, next-upgrade |
| **obra/superpowers** | writing-plans, executing-plans, test-driven-development, requesting-code-review, receiving-code-review, finishing-a-development-branch, using-git-worktrees, systematic-debugging, verification-before-completion, brainstorming, dispatching-parallel-agents, subagent-driven-development, using-superpowers, writing-skills |
| **wshobson/agents** | nextjs-app-router-patterns, typescript-advanced-types, api-design-principles, e2e-testing-patterns, error-handling-patterns, tailwind-design-system, code-review-excellence, responsive-design, kpi-dashboard-design, + many more (Postgres, Node, Python, etc.) |
| **softaworks/agent-toolkit** | crafting-effective-readmes, qa-test-planner, dependency-updater, mermaid-diagrams, session-handoff, c4-architecture, commit-work, openapi-to-typescript, react-dev, react-useeffect, + 32 more |
| **vercel-labs/agent-skills** | vercel-composition-patterns, vercel-react-best-practices, web-design-guidelines, vercel-react-native-skills |

Use **full-repo install** when a subpath fails: `npx skills add <owner/repo> --yes`.

---

Below: **curated list** by tier for reference and future installs.

---

## Tier 1 – Highest impact (install first)

| Skill | Repo | Why |
|-------|------|-----|
| **next-best-practices** | vercel-labs/next-skills | Next-specific patterns; complements Vercel React. |
| **nextjs-app-router-patterns** | wshobson/agents | App Router, RSC, server components. |
| **writing-plans** | obra/superpowers | Structured plans before coding. |
| **executing-plans** | obra/superpowers | Execute and track plan steps. |
| **test-driven-development** | obra/superpowers | TDD workflow with agents. |
| **requesting-code-review** | obra/superpowers | Ask for reviews the right way. |
| **receiving-code-review** | obra/superpowers | Apply feedback effectively. |

**Install Tier 1 (PowerShell):**
```powershell
npx skills add vercel-labs/next-skills/next-best-practices
npx skills add wshobson/agents/nextjs-app-router-patterns
npx skills add obra/superpowers/writing-plans
npx skills add obra/superpowers/executing-plans
npx skills add obra/superpowers/test-driven-development
npx skills add obra/superpowers/requesting-code-review
npx skills add obra/superpowers/receiving-code-review
```

---

## Tier 2 – Code quality & patterns

| Skill | Repo | Why |
|-------|------|-----|
| **typescript-advanced-types** | wshobson/agents | Stronger TS usage. |
| **api-design-principles** | wshobson/agents | API routes and contracts. |
| **e2e-testing-patterns** | wshobson/agents | Playwright and E2E strategy. |
| **error-handling-patterns** | wshobson/agents | Consistent error handling. |
| **vercel-composition-patterns** | vercel-labs/agent-skills | Composable React/Next patterns. |

**Install Tier 2:**
```powershell
npx skills add wshobson/agents/typescript-advanced-types
npx skills add wshobson/agents/api-design-principles
npx skills add wshobson/agents/e2e-testing-patterns
npx skills add wshobson/agents/error-handling-patterns
npx skills add vercel-labs/agent-skills/vercel-composition-patterns
```

---

## Tier 3 – Workflow & tooling

| Skill | Repo | Why |
|-------|------|-----|
| **crafting-effective-readmes** | softaworks/agent-toolkit | Better READMEs and docs. |
| **qa-test-planner** | softaworks/agent-toolkit | Test planning and coverage. |
| **dependency-updater** | softaworks/agent-toolkit | Safer dependency updates. |
| **mermaid-diagrams** | softaworks/agent-toolkit | Architecture and flow diagrams. |
| **session-handoff** | softaworks/agent-toolkit | Handoff notes between sessions. |
| **using-git-worktrees** | obra/superpowers | Parallel branches without stashing. |
| **finishing-a-development-branch** | obra/superpowers | Clean branch wrap-up. |

**Install Tier 3:**
```powershell
npx skills add softaworks/agent-toolkit/crafting-effective-readmes
npx skills add softaworks/agent-toolkit/qa-test-planner
npx skills add softaworks/agent-toolkit/dependency-updater
npx skills add softaworks/agent-toolkit/mermaid-diagrams
npx skills add softaworks/agent-toolkit/session-handoff
npx skills add obra/superpowers/using-git-worktrees
npx skills add obra/superpowers/finishing-a-development-branch
```

---

## Tier 4 – UI & design system (optional)

| Skill | Repo | Why |
|-------|------|-----|
| **tailwind-design-system** | wshobson/agents | Design tokens and Tailwind structure. |
| **next-cache-components** | vercel-labs/next-skills | Caching and static/dynamic boundaries. |
| **shadcn-ui** | giuseppe-trisciuoglio/developer-kit | If you adopt shadcn later. |

**Install Tier 4:**
```powershell
npx skills add wshobson/agents/tailwind-design-system
npx skills add vercel-labs/next-skills/next-cache-components
# npx skills add giuseppe-trisciuoglio/developer-kit/shadcn-ui
```

---

## One-shot install (all Tier 1 + 2 + 3)

Run from repo root (PowerShell). Each line is one skill; run as-is or copy-paste in blocks.

```powershell
# Tier 1
npx skills add vercel-labs/next-skills/next-best-practices
npx skills add wshobson/agents/nextjs-app-router-patterns
npx skills add obra/superpowers/writing-plans
npx skills add obra/superpowers/executing-plans
npx skills add obra/superpowers/test-driven-development
npx skills add obra/superpowers/requesting-code-review
npx skills add obra/superpowers/receiving-code-review

# Tier 2
npx skills add wshobson/agents/typescript-advanced-types
npx skills add wshobson/agents/api-design-principles
npx skills add wshobson/agents/e2e-testing-patterns
npx skills add wshobson/agents/error-handling-patterns
npx skills add vercel-labs/agent-skills/vercel-composition-patterns

# Tier 3
npx skills add softaworks/agent-toolkit/crafting-effective-readmes
npx skills add softaworks/agent-toolkit/qa-test-planner
npx skills add softaworks/agent-toolkit/dependency-updater
npx skills add softaworks/agent-toolkit/mermaid-diagrams
npx skills add softaworks/agent-toolkit/session-handoff
npx skills add obra/superpowers/using-git-worktrees
npx skills add obra/superpowers/finishing-a-development-branch
```

---

## Quick reference

- **Browse:** https://skills.sh/  
- **Trending:** https://skills.sh/trending  
- **Install any skill:** `npx skills add <owner/repo>/<skill-name>`  
- **Use in Cursor:** Mention in chat (e.g. `@next-best-practices`) or in comments.
