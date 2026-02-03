/**
 * Load historic scraped tenders from scraper-output/run-*.json into the database.
 *
 * Usage:
 *   pnpm load:historic
 *     → syncs the latest run-*.json (by mtime) in scraper-output/
 *   pnpm load:historic scraper-output/run-2026-01-31T23-48-56-987Z.json
 *     → syncs the given file
 *   pnpm load:historic --all
 *     → merges all run-*.json (dedup by reference_no, latest wins) and syncs once
 *
 * Requires:
 *   - CRON_SECRET in .env.local (or env)
 *   - Dev server running (or NEXT_PUBLIC_APP_URL / VERCEL_URL set)
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

const SCRAPER_OUTPUT_DIR = path.join(process.cwd(), 'scraper-output')
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://127.0.0.1:3000'
const CRON_SECRET = process.env.CRON_SECRET

function getLatestRunFile(): string | null {
  if (!fs.existsSync(SCRAPER_OUTPUT_DIR)) return null
  const files = fs.readdirSync(SCRAPER_OUTPUT_DIR).filter((f) => f.startsWith('run-') && f.endsWith('.json'))
  if (files.length === 0) return null
  const withStats = files.map((f) => ({
    name: f,
    mtime: fs.statSync(path.join(SCRAPER_OUTPUT_DIR, f)).mtime.getTime(),
  }))
  withStats.sort((a, b) => b.mtime - a.mtime)
  return path.join(SCRAPER_OUTPUT_DIR, withStats[0].name)
}

function getAllRunFiles(): string[] {
  if (!fs.existsSync(SCRAPER_OUTPUT_DIR)) return []
  const files = fs.readdirSync(SCRAPER_OUTPUT_DIR).filter((f) => f.startsWith('run-') && f.endsWith('.json'))
  const withStats = files.map((f) => ({
    path: path.join(SCRAPER_OUTPUT_DIR, f),
    mtime: fs.statSync(path.join(SCRAPER_OUTPUT_DIR, f)).mtime.getTime(),
  }))
  withStats.sort((a, b) => a.mtime - b.mtime)
  return withStats.map((x) => x.path)
}

async function main(): Promise<void> {
  if (!CRON_SECRET) {
    console.error('CRON_SECRET is not set. Add it to .env.local or set in the environment.')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const useAll = args.includes('--all')
  const pathArg = args.filter((a) => a !== '--all')[0]

  let filePath: string | null
  let tenders: unknown[]
  let metadata: unknown

  if (useAll) {
    const files = getAllRunFiles()
    if (files.length === 0) {
      console.error('No scraper-output/run-*.json files found.')
      process.exit(1)
    }
    const byRef = new Map<string, unknown>()
    for (const f of files) {
      const raw = fs.readFileSync(f, 'utf-8')
      const body = JSON.parse(raw) as { tenders?: unknown[]; metadata?: unknown }
      if (body.tenders && Array.isArray(body.tenders)) {
        for (const t of body.tenders) {
          const ref = (t as { reference_no?: string }).reference_no
          if (ref) byRef.set(ref, t)
        }
      }
    }
    tenders = Array.from(byRef.values())
    metadata = { source: 'load-historic-to-db', files: files.length }
    console.log(`Merged ${tenders.length} unique tenders from ${files.length} run-*.json files.`)
  } else {
    if (pathArg) {
      filePath = path.isAbsolute(pathArg) ? pathArg : path.join(process.cwd(), pathArg)
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`)
        process.exit(1)
      }
    } else {
      filePath = getLatestRunFile()
      if (!filePath) {
        console.error('No scraper-output/run-*.json found. Run a scrape first or pass a file path.')
        process.exit(1)
      }
      console.log(`Using latest file: ${path.basename(filePath)}`)
    }
    const raw = fs.readFileSync(filePath!, 'utf-8')
    const body = JSON.parse(raw) as { tenders?: unknown[]; metadata?: unknown }
    if (!body.tenders || !Array.isArray(body.tenders) || body.tenders.length === 0) {
      console.error('File has no tenders array or it is empty.')
      process.exit(1)
    }
    tenders = body.tenders
    metadata = body.metadata
  }

  const syncUrl = `${API_BASE.replace(/\/$/, '')}/api/cron/sync`
  console.log(`POSTing ${tenders.length} tenders to ${syncUrl} ...`)

  const res = await fetch(syncUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CRON_SECRET}`,
    },
    body: JSON.stringify({ tenders, metadata }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Sync failed:', (data as { message?: string }).message ?? data?.error ?? res.statusText)
    if ((data as { errors?: string[] }).errors?.length) {
      (data as { errors: string[] }).errors.forEach((e: string) => console.error('  ', e))
    }
    process.exit(1)
  }

  console.log('Done.', (data as { upserted?: number }).upserted ?? 0, 'tenders upserted.')
}

main()
