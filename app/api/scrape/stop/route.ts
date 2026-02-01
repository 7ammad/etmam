/**
 * POST /api/scrape/stop — stop an in-progress scrape by killing the child process.
 * Reads PID from progress file and sends SIGTERM.
 */

import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'

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

export async function POST() {
  const progressPath = getProgressPath()
  let data: { status?: string; pid?: number } = {}
  try {
    const raw = fs.readFileSync(progressPath, 'utf-8')
    data = JSON.parse(raw) as { status?: string; pid?: number }
  } catch {
    return NextResponse.json({ status: 'idle', message: 'No scrape in progress' }, { status: 200 })
  }

  if (data.status !== 'running') {
    return NextResponse.json({ status: data.status ?? 'idle', message: 'No scrape in progress' }, { status: 200 })
  }

  const pid = data.pid
  if (pid != null && typeof pid === 'number') {
    try {
      process.kill(pid, 'SIGTERM')
    } catch (err) {
      // Process may already have exited
      const code = (err as NodeJS.ErrnoException)?.code
      if (code !== 'ESRCH' && code !== 'EPERM') {
        console.error('Scrape stop kill error:', err)
      }
    }
  }

  try {
    fs.writeFileSync(
      progressPath,
      JSON.stringify({
        status: 'failed',
        error: 'Stopped by user',
        stoppedAt: Date.now(),
      }),
      'utf-8'
    )
  } catch {
    // ignore
  }

  return NextResponse.json({ status: 'failed', message: 'Stopped by user' }, { status: 200 })
}
