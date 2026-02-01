# Etmam App — Project Report

**Generated:** 2026-01-31  
**Scope:** Current codebase, agents, skills, MCP. No legacy plans or old docs used.  
**Note:** No project `.md`/`.json` files (outside node_modules) were modified in the last 2 days; this report is based on live inspection of the repo and tooling.  
**Phase progress:** §6 is updated after each phase completion (see implementation plan in `_archived-docs/implementation.md`).

---

## 1. Project overview

- **Name:** etmaam-crm (`package.json`)
- **Stack:** Next.js 16, React 19, TypeScript, Supabase, Tailwind 4, next-intl, Vercel AI SDK
- **Package manager:** pnpm 9.15.0

---

## 2. Available tools (agents, skills, MCP)

### 2.1 Cursor agents (subagents)

| Agent | Model | Purpose |
|-------|------|--------|
| **code-reviewer** | inherit | PR/code reviews: security, performance, type safety, Next.js/Supabase/TypeScript and RTL/Arabic patterns. |
| **subagent-advisor** | fast | Recommends when to use subagents vs skills; suggests 2–5 focused agents (e.g. verifier, code-reviewer). |
| **verifier** | fast | Validates “done” work: runs `verify-phase-*`, type-check, checks migrations and implementations. |

### 2.2 Cursor skills (in-repo)

- **code-review-excellence** — PR review practices and feedback.
- **frontend-design** — UI/design quality.
- **skills-sh** — Browse/install skills from skills.sh.
- **supabase-postgres-best-practices** — Postgres/Supabase (indexes, RLS, pooling, batch inserts, etc.).
- **systematic-debugging** — Condition-based waiting, root-cause tracing, defense-in-depth, test pressure.
- **vercel-react-best-practices** — React/Next.js performance.
- **verification-before-completion** — Run verification before claiming completion.
- **web-design-guidelines** — UI/UX and accessibility.
- **webapp-testing** — Playwright-based testing.

### 2.3 Cursor rules (`.cursor/rules/`)

- nextjs-best-practices, planning-with-files, rtl-arabic-ui, supabase-postgres-best-practices, writing-plans, README.

### 2.4 MCP

- **Project `mcp.json`:** Supabase MCP only (`https://mcp.supabase.com/mcp`).
- **User MCPs (mcps folder):** cursor-browser-extension (navigate, click, snapshot, screenshot, forms), user-context7 (query-docs, resolve-library-id), user-github (issues, PRs, repos, etc.), user-markitdown, user-playwright (browser automation), user-tavily (search/crawl/research).

---

## 3. Codebase structure (current)

### 3.1 App (Next.js App Router)

- **Routes:** `app/[locale]/` — dashboard (list page + `[tenderId]` with `push-success`), login, forgot-password, settings (incl. settings/crm), root `page.tsx`.
- **Server:** `app/actions/oracle.ts` (server actions), `app/api/cron/sync/route.ts` (cron sync).
- **Global:** `app/globals.css`, `app/layout.tsx`, `app/page.tsx`.

### 3.2 Lib (core logic)

- **ai/** — client, evaluator, index, prompts, schemas (AI/evaluation).
- **auth/** — guard.
- **crm/** — factory, providers (hubspot, webhook).
- **parser/** — column-mapper, csv/excel parsers, index.
- **queries/** — evaluation, tender.
- **scraper/** — config, errors, etimad-browser, index, utils.
- **supabase/** — client, server.
- **Root:** `lib/i18n.ts`, `lib/utils.ts`.

### 3.3 Types

- `crm.ts`, `database.ts`, `evaluation.ts`, `index.ts`, `scraper.ts`, `tender.ts`.

### 3.4 Components

- **Landing:** brief, cta, faq, features, footer, hero, how-it-works, landing-header.
- **Shared:** home-content, locale-html-attributes, providers (i18n, theme), ui (theme-toggle).

### 3.5 Scripts

- **Dev:** `start-dev.ps1`, `clean-next-lock.ps1`.
- **Scraper:** `etimad-recon.ts`, `test-scraper.ts`, `run-scraper.ts`, `scraper-utils.ts`, `review-scraped-data.ts`.
- **Verification:** `verify-phase-1.ts`, `verify-phase-2.ts`, `verify-phase-historical.ts`, `verify-scraper-active.ts`, `verify-database-schema.ts`, `verify-scraped-pages.ts`.
- **Other:** `create-system-user.ts`/`.sql`, `test-api-integration.ts`.

### 3.6 Data / config

- **i18n:** `i18n/` (config, request, routing), `messages/ar.json`, `en.json`, `i18n.ts`.
- **Supabase:** `supabase/migrations/` (00001–00005: initial, API perms, scraper, oracle, award columns).
- **Docs/schema:** `docs/DATA_PIPELINE_REPORT.md`, `docs/etimad-scraped-fields-schema.json`.

---

## 4. NPM scripts (from package.json)

| Script | Command |
|--------|--------|
| dev | PowerShell start-dev (predev cleans lock) |
| dev:force | next dev -p 3000 |
| build / start / lint | next build / start / lint |
| type-check | tsc --noEmit |
| test / test:ui | playwright test |
| scrape:recon / scrape:test / scrape:smoke / scrape:run | tsx scripts (etimad-recon, test-scraper, run-scraper) |
| test:api | tsx scripts/test-api-integration.ts |
| verify:phase-1 / verify:phase-2 / verify:historical | tsx verify-phase-*.ts |
| verify:scraper-active | tsx verify-scraper-active.ts |
| review:scraped | tsx review-scraped-data.ts |

---

## 5. Dependencies (summary)

- **Runtime:** next 16, react 19, @supabase/ssr & supabase-js, next-intl, ai + @ai-sdk/openai, @radix-ui/themes, @tremor/react, papaparse, xlsx, zod, date-fns, react-dropzone, etc.
- **Dev:** playwright, tailwind 4, tsx, supabase CLI, eslint, TypeScript 5.7.

---

## 6. Phase progress (updated after each phase)

| Phase | Goal | Status | Completed | Report / notes |
|-------|------|--------|-----------|----------------|
| **6** | Auth integration and hardening — minimum security, protected dashboard, no credential leaks | **Done** | 2026-01-31 | `docs/PHASE_6_AUTH_REVIEW_REPORT.md` — Supabase Auth, `requireAuth()` + proxy, gates passed. |
| **7** | Dashboard UX/UI v1 wired to Supabase — “simple screen” with tenders and evaluation results | Not started | — | Depends on Phase 6 (done). |
| **8** | Persist evaluation results into Supabase for UI and CRM | Not started | — | DB cols: score, recommendation, reasons, evaluated_at. |
| **9** | CRM creation path — Export Odoo Excel in UI; optional Odoo API push | Not started | — | Excel export; Odoo push when credentials available. |
| **10** | Finalization and package readiness — docs, UI smoke test, reviewer-proof | Not started | — | RUNBOOK, DEMO_SCRIPT, HANDOVER_CHECKLIST, Playwright flow. |

**How to update:** After completing a phase, set its Status to **Done**, set **Completed** to the date, and set **Report / notes** to the phase report path and one-line summary.

---

## 7. How to use this report with your tools

- **Verification:** Use the **verifier** agent and run `pnpm verify:phase-1`, `verify:phase-2`, `verify:scraper-active`, etc., before claiming completion.
- **Reviews:** Use **code-reviewer** for PRs and security/performance/type-safety checks; optionally **code-review-excellence** skill.
- **Subagents:** Use **subagent-advisor** when deciding new agents or splitting work (e.g. scraper vs dashboard vs CRM).
- **DB/Postgres:** Use **supabase-postgres-best-practices** for queries, RLS, indexes, batching.
- **React/Next:** Use **vercel-react-best-practices** for components and data fetching.
- **Debugging:** Use **systematic-debugging** and **verification-before-completion** before signing off.
- **Browser/UI:** Use **cursor-browser-extension** or **user-playwright** MCPs for live UI checks; **webapp-testing** for Playwright flows.
- **Docs/libraries:** Use **user-context7** (query-docs) for up-to-date library docs.

---

## 8. Doc date note

No project markdown or JSON files (excluding `node_modules`, `.next`, lockfile) were last modified within the last 2 days. This report therefore does not cite “today/yesterday” docs and is derived only from the current repo layout, `package.json`, `.cursor` agents/skills/rules, and MCP configuration.

---

## 9. Verification (report vs codebase)

- **Agents:** `.cursor/agents/` — code-reviewer.md, subagent-advisor.md, verifier.md (names and models confirmed).
- **Skills:** `.cursor/skills/` — all 9 skill dirs listed in §2.2 present.
- **Rules:** `.cursor/rules/` — all 6 rule files listed in §2.3 present.
- **MCP:** `.cursor/mcp.json` — Supabase only; user mcps from mcps folder as stated.
- **App:** `app/[locale]/`, `app/actions/`, `app/api/` — routes, oracle, cron/sync verified.
- **Lib:** All subdirs + `lib/i18n.ts`, `lib/utils.ts` verified.
- **Types, components, scripts:** Listed files/dirs exist.
- **package.json:** Scripts and dependencies match §4 and §5.
- **Migrations:** `supabase/migrations/` 00001–00005 present.
- **Type-check:** `pnpm type-check` run — exit code 0 (2025-01-31).
