# What’s Still Missing (Setup Checklist)

**Local DB first:** Use `supabase start`, copy local API URL and keys from `supabase status` into `.env.local`, run `supabase db reset`. The app and scraper sync use the local DB only. Remote syncing can be figured out later. See RUNBOOK.md.

Quick list of what’s **done** vs **optional / after deploy**.

---

## Done (you have these)

| Item | Where |
|------|--------|
| Supabase | URL, anon key, service role in `.env.local` |
| Local schema | With **local** Supabase, run `supabase db reset` so all migrations (including 00010) are applied. No remote link/push needed. |
| CRON_SECRET | In `.env.local` (generated via `pnpm generate:cron-secret`) |
| API_URL (local) | In `.env.local` for `pnpm scrape:run` / `pnpm pipeline:full` |
| NEXT_PUBLIC_APP_URL | In `.env.local` (localhost for dev) |
| AI (DeepSeek) | `AI_PROVIDER`, `DEEPSEEK_API_KEY` in `.env.local` |
| Scoring config | `config/scoring.config.json` exists |
| Evaluation sync API | `POST /api/sync/evaluations` + `pnpm sync:evaluations` |
| Pipeline in CI | Workflows run: scrape → evaluate → sync evaluations |

---

## Missing / Optional

### 1. GitHub Actions secrets (only after you deploy)

Set these in **GitHub → repo → Settings → Secrets and variables → Actions** once you have a deployed app URL:

| Secret | Value | When |
|--------|--------|------|
| **SCRAPER_API_URL** | `https://YOUR_DEPLOYED_APP/api/cron/sync` | After first deploy |
| **APP_BASE_URL** | `https://YOUR_DEPLOYED_APP` | After first deploy |
| **CRON_SECRET** | Same as in `.env.local` | Copy from `.env.local` |

Until these are set, scheduled/workflow scraper runs will fail at the sync step. Manual local runs are fine with `.env.local`.

### 2. Deployment (Vercel / other)

- No deployment is required for local dev.
- For **automated scraper + evaluation sync** in CI, you need a deployed app so `SCRAPER_API_URL` and `APP_BASE_URL` point to it.
- Add the same env vars on the host (e.g. Vercel) as in `.env.local` (at least Supabase, `CRON_SECRET`).

### 3. Odoo (optional)

- CRM **push to Odoo** is implemented but off by default.
- To enable: set `ODOO_BASE_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD`, `ODOO_PUSH_ENABLED=true` in `.env.local`.
- If you only use Excel export, Odoo env is not required.

### 4. Scraper schedule (optional)

- **scraper.yml** – schedule is commented out; enable when deployment + secrets are ready.
- **scraper-historical.yml** – runs daily at 02:00 UTC; will work once `SCRAPER_API_URL` and `APP_BASE_URL` are set in GitHub.

---

## One-line summary

**For local use:** Nothing required beyond what’s in `.env.local` (Supabase, CRON_SECRET, API_URL, AI keys).  

**For full CI pipeline:** Deploy the app, then add **SCRAPER_API_URL**, **APP_BASE_URL**, and **CRON_SECRET** in GitHub Actions secrets.
