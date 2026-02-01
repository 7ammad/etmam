# Import complete – next steps

The project was cloned and installed per `docs/HANDOFF_ANOTHER_LAPTOP.md`.

## Done

- Cloned from `https://github.com/7ammad/etmam.git`
- Branch: `ASUS-Version`
- `pnpm install` (564 packages)
- `pnpm type-check` – passed
- `.env.local` created from `.env.example` (you must fill in secrets)

## You must do

1. **Edit `.env.local`** with real values (do not commit):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API)
   - `AI_PROVIDER` (`deepseek` or `openai`) and the matching API key
   - `CRON_SECRET` (e.g. `openssl rand -hex 32`)
   - Optional: `SYSTEM_USER_ID`, `API_URL` for scraper/sync

2. **Run the app**
   ```powershell
   pnpm dev
   ```
   If you hit execution policy: `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process` then `pnpm dev`.

3. **Optional:** Playwright for scraper/E2E: `pnpm exec playwright install chromium`

Full details: `docs/HANDOFF_ANOTHER_LAPTOP.md` (in repo root).
