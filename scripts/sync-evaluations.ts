/**
 * Sync evaluations from data/tenders.scored.json to the database via API.
 *
 * Usage: pnpm sync:evaluations [path-to-scored.json]
 *   If no path given, uses data/tenders.scored.json.
 *
 * Requires:
 *   - CRON_SECRET environment variable (set in .env.local or shell)
 *   - API server running (npm run dev or deployed)
 *   - NEXT_PUBLIC_APP_URL environment variable (optional, defaults to http://localhost:3000)
 */

import * as fs from 'fs'
import * as path from 'path'

// Simple .env.local loader (avoids external dependency)
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
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      // Only set if not already defined
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // Silently ignore errors
  }
}

// Load .env.local for CRON_SECRET
loadEnvFile(path.join(process.cwd(), '.env.local'))

const DATA_DIR = path.join(process.cwd(), 'data')
const DEFAULT_SCORED_PATH = path.join(DATA_DIR, 'tenders.scored.json')
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET

interface ScoredOutput {
  generated_at?: string
  source_file?: string
  config_used?: string
  tenders: Array<{
    reference_no: string
    title?: string
    score: number
    recommendation: 'qualified' | 'conditional' | 'excluded'
    reasons?: string[]
    summary?: string
    strengths?: string[]
    risks?: string[]
    missing_requirements?: string[]
    action_items?: string[]
    breakdown?: Record<string, number>
  }>
}

interface SyncResponse {
  success: boolean
  upserted: number
  skipped: number
  errors: string[]
  metadata?: {
    source_file?: string
    generated_at?: string
    processed_at?: string
  }
}

async function main(): Promise<void> {
  // Validate CRON_SECRET
  if (!CRON_SECRET) {
    console.error('Error: CRON_SECRET environment variable is required.')
    console.error('Set it in .env.local or as an environment variable.')
    process.exit(1)
  }

  // Determine input path
  const inputPath = process.argv[2] ?? DEFAULT_SCORED_PATH
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`)
    console.error('Run "pnpm evaluate-tenders" first to generate scored tenders.')
    process.exit(1)
  }

  // Read scored tenders
  let data: ScoredOutput
  try {
    const raw = fs.readFileSync(inputPath, 'utf-8')
    data = JSON.parse(raw) as ScoredOutput
  } catch (err) {
    console.error('Error: Failed to parse scored tenders file:', inputPath)
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  if (!data.tenders || !Array.isArray(data.tenders) || data.tenders.length === 0) {
    console.error('Error: No tenders found in', inputPath)
    process.exit(1)
  }

  console.log(`Syncing ${data.tenders.length} evaluations to ${API_BASE}/api/sync/evaluations...`)

  // Prepare payload
  const payload = {
    evaluations: data.tenders,
    source_file: data.source_file ?? path.basename(inputPath),
    generated_at: data.generated_at ?? new Date().toISOString(),
  }

  // Call API
  try {
    const response = await fetch(`${API_BASE}/api/sync/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`Error: API returned ${response.status} ${response.statusText}`)
      console.error(errorBody)
      process.exit(1)
    }

    const result = (await response.json()) as SyncResponse

    console.log('\n--- Sync Results ---')
    console.log(`Success: ${result.success}`)
    console.log(`Upserted: ${result.upserted}`)
    console.log(`Skipped: ${result.skipped}`)

    if (result.errors.length > 0) {
      console.log(`\nErrors (${result.errors.length}):`)
      result.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`)
      })
    }

    if (result.metadata) {
      console.log('\nMetadata:')
      console.log(`  Source: ${result.metadata.source_file}`)
      console.log(`  Generated: ${result.metadata.generated_at}`)
      console.log(`  Processed: ${result.metadata.processed_at}`)
    }

    if (!result.success) {
      process.exit(1)
    }

    console.log('\nSync completed successfully!')
  } catch (err) {
    console.error('Error: Failed to call sync API')
    console.error(err instanceof Error ? err.message : err)
    console.error('\nMake sure the API server is running (npm run dev).')
    process.exit(1)
  }
}

main()
