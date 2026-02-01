# Etmaam CRM — Build Report

**Generated:** 2026-01-29  
**Project:** etmaam-crm v0.1.0  
**Stack:** Next.js 16, React 19, TypeScript 5.7, Tailwind v4, Supabase, next-intl

---

## Summary

- **Status:** Project structure and config are in place; full build was not run from this environment (UNC path limitation in the terminal).
- **Build command:** `pnpm run build` (runs `next build`).
- **To run the build:** Use a local or mapped drive path (e.g. open the repo from `C:\...` or map `\\HOME` to a drive), then run `pnpm run build` in that directory.

---

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `next build` | Production build |
| `dev` | PowerShell script | Dev server (port 3000) |
| `start` | `next start` | Serve production build |
| `lint` | `next lint` | ESLint |
| `type-check` | `tsc --noEmit` | TypeScript check |
| `test` | `playwright test` | E2E tests |

---

## Config

- **next.config.ts:** next-intl plugin, server actions body limit 10mb.
- **tsconfig.json:** Strict, path alias `@/*` → `./*`, Next plugin.
- **packageManager:** pnpm@9.15.0.

---

## App routes (App Router)

- `/` → root + `[locale]` (ar/en)
- `/[locale]/dashboard` — dashboard + `[tenderId]`, push-success
- `/[locale]/login`, `/[locale]/forgot-password`
- `/[locale]/settings`, `/[locale]/settings/crm`
- **API:** `api/cron/sync` (route.ts)

---

## Dependencies

- **Runtime:** next, react, @supabase/ssr, ai, next-intl, next-themes, zod, xlsx, papaparse, lucide-react, etc.
- **Dev:** typescript, eslint, @playwright/test, tailwindcss, tsx.

---

## How to run the build (Windows)

If the workspace is on a UNC path and `pnpm run build` fails:

1. Map the share to a drive (e.g. `net use Z: \\HOME\dev-Old\builds\etmaam`) and run:
   ```powershell
   cd Z:\
   pnpm install
   pnpm run build
   ```
2. Or open the same folder from a local path (e.g. clone or copy to `C:\dev\etmaam`) and run `pnpm run build` there.

---

*Run `pnpm run type-check` and `pnpm run lint` before/after build to confirm types and lint.*
