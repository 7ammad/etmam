/**
 * POST /api/scrape/sync-latest — sync tenders from the latest scraper-output/run-*.json to the DB.
 * Matches run-active-* and run-historical-* (latest by mtime). Runs on the server (same process as sync API).
 */

import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const SCRAPER_OUTPUT_DIR = path.join(process.cwd(), 'scraper-output')

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

export async function POST() {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const filePath = getLatestRunFile()
  if (!filePath) {
    return NextResponse.json(
      { error: 'No scraper-output/run-*.json found. Run a scrape first.' },
      { status: 404 }
    )
  }

  let body: { tenders: unknown[]; metadata?: unknown }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    body = JSON.parse(raw) as { tenders: unknown[]; metadata?: unknown }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to read ${filePath}: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 }
    )
  }

  if (!body.tenders || !Array.isArray(body.tenders) || body.tenders.length === 0) {
    return NextResponse.json(
      { error: 'File has no tenders array or it is empty' },
      { status: 400 }
    )
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:3000')
  const syncUrl = `${origin.replace(/\/$/, '')}/api/cron/sync`

  try {
    const res = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ tenders: body.tenders, metadata: body.metadata }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string }).message ?? data?.error ?? res.statusText, details: data },
        { status: res.status }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Sync request failed: ${message}. Is the dev server running on ${syncUrl}?` },
      { status: 502 }
    )
  }
}
