/**
 * Manual scrape from dashboard: POST to start, GET for status.
 * POST /api/scrape — start scraper (spawns child process)
 * GET /api/scrape — return progress { status: 'idle'|'running'|'completed'|'failed', ... }
 */

import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'

const PROGRESS_FILE =
  process.env.SCRAPE_PROGRESS_FILE ?? path.join(process.cwd(), '.scrape-progress.json')

// Prefer writable /tmp on Vercel/serverless
function getProgressPath(): string {
  if (process.env.SCRAPE_PROGRESS_FILE) return process.env.SCRAPE_PROGRESS_FILE
  try {
    const tmp = tmpdir()
    if (tmp && fs.existsSync(tmp)) {
      return path.join(tmp, 'etmam-scrape-progress.json')
    }
  } catch {
    // fallback to cwd
  }
  return path.join(process.cwd(), '.scrape-progress.json')
}

export async function GET() {
  const progressPath = getProgressPath()
  try {
    const raw = fs.readFileSync(progressPath, 'utf-8')
    const data = JSON.parse(raw) as Record<string, unknown>
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: 'idle' })
  }
}

export async function POST(request: NextRequest) {
  const progressPath = getProgressPath()
  try {
    const raw = fs.readFileSync(progressPath, 'utf-8')
    const data = JSON.parse(raw) as { status?: string }
    if (data.status === 'running') {
      return NextResponse.json({ status: 'running', message: 'Scrape already in progress' }, { status: 409 })
    }
  } catch {
    // no file or invalid — ok to start
  }

  // Child runs on same machine; use 127.0.0.1 so loopback reaches this server (avoids localhost resolution issues)
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:3000')
  const apiUrl = `${origin.replace(/\/$/, '')}/api/cron/sync`
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    )
  }

  let scrapeMode = 'active'
  try {
    const body = await request.json().catch(() => ({}))
    if (body && typeof body === 'object' && body.historical === true) {
      scrapeMode = 'historical'
    }
  } catch {
    // no body or invalid — use active
  }

  const scriptPath = path.join(process.cwd(), 'scripts', 'run-scraper-for-api.ts')
  const child = spawn('npx', ['tsx', scriptPath], {
    env: {
      ...process.env,
      API_URL: apiUrl,
      CRON_SECRET: cronSecret,
      SCRAPE_PROGRESS_FILE: progressPath,
      SCRAPE_MODE: scrapeMode,
    },
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
    ...(process.platform === 'win32' && { shell: true }),
  })

  try {
    fs.writeFileSync(
      progressPath,
      JSON.stringify({
        status: 'running',
        startedAt: Date.now(),
        message: 'Starting…',
        pid: child.pid,
      }),
      'utf-8'
    )
  } catch {
    return NextResponse.json(
      { error: 'Could not write progress file' },
      { status: 500 }
    )
  }

  child.unref()

  return NextResponse.json({ status: 'running', message: 'Scrape started' }, { status: 202 })
}
