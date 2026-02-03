/**
 * POST /api/scrape/stop — stop an in-progress scrape by killing the child process.
 * Uses platform-specific kill: taskkill on Windows, SIGTERM on Unix.
 */

import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'
import { execSync } from 'child_process'

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

/**
 * Kill a process by PID, handling platform differences.
 * On Windows: uses taskkill /PID /T /F to force kill process tree
 * On Unix: uses SIGTERM then SIGKILL if needed
 */
function killProcess(pid: number): boolean {
  const isWindows = process.platform === 'win32'

  try {
    if (isWindows) {
      // On Windows, use taskkill with /T (tree) and /F (force) flags
      // This kills the process and all child processes (important for npx/tsx spawned processes)
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' })
      console.log(`[Stop] Killed process tree with taskkill: PID ${pid}`)
      return true
    } else {
      // On Unix, send SIGTERM first (graceful)
      process.kill(pid, 'SIGTERM')
      console.log(`[Stop] Sent SIGTERM to PID ${pid}`)

      // Give it a moment, then send SIGKILL if still running
      setTimeout(() => {
        try {
          // Check if process still exists
          process.kill(pid, 0)
          // Still running, send SIGKILL
          process.kill(pid, 'SIGKILL')
          console.log(`[Stop] Sent SIGKILL to PID ${pid}`)
        } catch {
          // Process already terminated
        }
      }, 1000)

      return true
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code
    // ESRCH = No such process (already exited)
    // EPERM = Permission denied (shouldn't happen for our own child process)
    if (code === 'ESRCH') {
      console.log(`[Stop] Process ${pid} already exited`)
      return true // Process already gone, that's fine
    }
    if (code === 'EPERM') {
      console.error(`[Stop] Permission denied to kill PID ${pid}`)
      return false
    }
    console.error('[Stop] Kill error:', err)
    return false
  }
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
  let killed = false
  if (pid != null && typeof pid === 'number') {
    killed = killProcess(pid)
  }

  // Always update progress file to stopped state
  try {
    fs.writeFileSync(
      progressPath,
      JSON.stringify({
        status: 'failed',
        error: 'Stopped by user',
        stoppedAt: Date.now(),
        killedPid: killed ? pid : undefined,
      }),
      'utf-8'
    )
  } catch {
    // ignore
  }

  return NextResponse.json(
    { status: 'failed', message: 'Stopped by user', killed },
    { status: 200 }
  )
}
