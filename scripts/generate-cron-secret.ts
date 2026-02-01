/**
 * Generates a secure CRON_SECRET and prints GitHub Actions secret values.
 * Run: pnpm generate:cron-secret
 *
 * Copy the generated CRON_SECRET into:
 *   - .env.local (as CRON_SECRET=...)
 *   - GitHub repo → Settings → Secrets and variables → Actions (as CRON_SECRET)
 *
 * SCRAPER_API_URL and APP_BASE_URL depend on your deployed app; replace YOUR_APP with your real host.
 */

import { randomBytes } from 'crypto'

const secret = randomBytes(32).toString('hex')

console.log('')
console.log('--- Generated CRON_SECRET (add to .env.local and GitHub Secrets) ---')
console.log('')
console.log(secret)
console.log('')
console.log('--- GitHub Actions: add these secrets (Settings → Secrets and variables → Actions) ---')
console.log('')
console.log('CRON_SECRET')
console.log(secret)
console.log('')
console.log('SCRAPER_API_URL   (replace YOUR_APP with your deployed host, e.g. etmam-xxx.vercel.app)')
console.log('https://YOUR_APP/api/cron/sync')
console.log('')
console.log('APP_BASE_URL   (same host, no path)')
console.log('https://YOUR_APP')
console.log('')
console.log('--- .env.local ---')
console.log('CRON_SECRET=' + secret)
console.log('')
