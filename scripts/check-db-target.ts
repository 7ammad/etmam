/**
 * Prints which DB the app uses (local vs remote) from .env.local. No secrets printed.
 */
import * as fs from 'fs'
import * as path from 'path'

function loadEnv(filePath: string): void {
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
    /* ignore */
  }
}

loadEnv(path.join(process.cwd(), '.env.local'))
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const isLocal = /127\.0\.0\.1|localhost/i.test(url)
console.log('App DB target:', isLocal ? 'LOCAL' : 'REMOTE')
console.log('URL is localhost/127.0.0.1:', isLocal)
