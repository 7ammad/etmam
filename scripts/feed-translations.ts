/**
 * Calls the feed-translations API to populate phrase_translations for the dashboard table.
 * Run after sync or on a schedule. Dashboard only reads from cache—no translation on refresh.
 *
 * Usage: pnpm feed:translations
 * Requires: CRON_SECRET, NEXT_PUBLIC_APP_URL (optional, default http://localhost:3000)
 * App must be running (e.g. pnpm dev) or use deployed URL.
 */

import * as fs from 'fs'
import * as path from 'path'

function loadEnvFile(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return
    const content = fs.readFileSync(filePath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex <= 0) continue
      const key = trimmed.slice(0, eqIndex)
      let value = trimmed.slice(eqIndex + 1)
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // ignore
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET

async function main(): Promise<void> {
  if (!CRON_SECRET) {
    console.error('Error: CRON_SECRET is required. Set it in .env.local')
    process.exit(1)
  }

  const url = `${API_BASE.replace(/\/$/, '')}/api/cron/feed-translations`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CRON_SECRET}`,
      'Content-Type': 'application/json',
    },
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('feed-translations failed:', res.status, body)
    process.exit(1)
  }

  console.log('feed-translations ok:', body)
}

main()
