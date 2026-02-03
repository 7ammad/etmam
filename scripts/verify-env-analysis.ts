/**
 * Verify env vars required for tender analysis (createServiceClient).
 * Loads .env.local like other scripts; exits 0 if OK, 1 if missing.
 * Does not print secret values.
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
    /* ignore */
  }
}

const envPath = path.join(process.cwd(), '.env.local')
loadEnvFile(envPath)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL (required for analysis). Set it in .env.local')
  process.exit(1)
}
if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY (required for analysis). Set it in .env.local')
  process.exit(1)
}
console.log('Env check OK: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
