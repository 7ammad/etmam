/**
 * Etimad Scraper Production Runner
 *
 * Runs the scraper with production settings and POSTs results to the sync API.
 * Designed to be called from GitHub Actions or other CI/CD systems.
 *
 * Run with: pnpm scrape:run
 *
 * Required environment variables (or set in .env.local):
 *   API_URL - URL of the sync endpoint
 *   CRON_SECRET - Auth token for sync endpoint
 *
 * Optional environment variables:
 *   BATCH_SIZE - Number of tenders to scrape (default: 50)
 *   DELAY_MS - Delay between requests in ms (default: 2000)
 *   ACTIVITY_ID - Main activity filter ID (default: '9' for Telecom/IT)
 *   SUB_ACTIVITY_ID - Sub-activity filter ID (default: none)
 */

import * as fs from 'fs'
import * as path from 'path'
import { scrapePublicTenders } from '../lib/scraper'

// Load .env.local so API_URL and CRON_SECRET are available when run via pnpm
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
loadEnvFile(path.join(process.cwd(), '.env.local'))
import type { SyncResponse, ActivityFilter } from '../types/scraper'
import {
  displaySyncResults,
  displayRunComplete,
} from './scraper-utils'

const SCRAPER_OUTPUT_DIR = path.join(process.cwd(), 'scraper-output')

async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('ETIMAD SCRAPER - PRODUCTION RUN')
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log('='.repeat(60))
  console.log('')

  // Validate required environment variables
  const apiUrl = process.env.API_URL
  const cronSecret = process.env.CRON_SECRET

  if (!apiUrl) {
    console.error('[Error] API_URL environment variable is required')
    process.exit(1)
  }

  if (!cronSecret) {
    console.error('[Error] CRON_SECRET environment variable is required')
    process.exit(1)
  }

  // Parse optional configuration
  // Default batch size: 120 (matches DEFAULT_CONFIG; allows ~5 pages at 24/page)
  // Can be overridden via BATCH_SIZE env var
  const batchSize = parseInt(process.env.BATCH_SIZE || '120', 10)
  const delayMs = parseInt(process.env.DELAY_MS || '2000', 10)
  const hasHistoricalFlag = process.argv.includes('--historical')
  const scraperMode = (process.env.SCRAPER_MODE || (hasHistoricalFlag ? 'historical' : 'active')) as 'active' | 'historical'

  // Activity filter - defaults to Telecom/IT (ID: 9) for Etmam's target sector
  const activityId = process.env.ACTIVITY_ID || '9'
  const subActivityId = process.env.SUB_ACTIVITY_ID

  const activityFilter: ActivityFilter | undefined = activityId
    ? { mainActivityId: activityId, subActivityId }
    : undefined

  console.log(`Configuration:`)
  console.log(`  API URL: ${apiUrl}`)
  console.log(`  Batch Size: ${batchSize}`)
  console.log(`  Delay: ${delayMs}ms`)
  console.log(`  Mode: ${scraperMode} (${scraperMode === 'historical' ? 'awarded tenders' : 'active/open for bids'})`)
  console.log(
    `  Activity Filter: ${activityId}${subActivityId ? '/' + subActivityId : ''} (Telecom/IT)`
  )
  console.log('')

  const startTime = Date.now()

  try {
    // Run scraper (historical: 24 items/page, scrape all pages; active: 6 items/page, batch limit)
    console.log('[Scraper] Starting...')
    const result = await scrapePublicTenders({
      batchSize,
      delayMs,
      headless: true,
      activityFilter,
      mode: scraperMode,
      listPageSize: 24,
    })

    const scrapeTime = Date.now() - startTime

    console.log('')
    console.log('--- Scrape Results ---')
    console.log(`  Scraped: ${result.metadata.totalScraped} tenders`)
    console.log(`  Errors: ${result.metadata.totalErrors}`)
    console.log(`  Duration: ${scrapeTime}ms`)
    console.log('')

    // Write to scraper-output so evaluate-tenders can run (e.g. in CI pipeline)
    if (result.tenders.length > 0) {
      if (!fs.existsSync(SCRAPER_OUTPUT_DIR)) {
        fs.mkdirSync(SCRAPER_OUTPUT_DIR, { recursive: true })
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const runFile = path.join(
        SCRAPER_OUTPUT_DIR,
        `run-${scraperMode}-${timestamp}.json`
      )
      const payload = {
        mode: scraperMode,
        tenders: result.tenders,
        metadata: result.metadata,
      }
      try {
        fs.writeFileSync(runFile, JSON.stringify(payload, null, 2), 'utf-8')
      } catch (writeErr) {
        const msg = writeErr instanceof Error ? writeErr.message : String(writeErr)
        console.error(`[Output] Failed to write ${runFile}: ${msg}`)
        throw writeErr
      }
      console.log(`[Output] Wrote ${result.tenders.length} tenders to ${runFile}`)
      console.log('')
    }

    // POST to sync API
    console.log(`[API] POSTing to ${apiUrl}...`)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({
        tenders: result.tenders,
        metadata: result.metadata,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API returned ${response.status}: ${errorText}`)
    }

    const syncResult: SyncResponse = await response.json()

    displaySyncResults(syncResult, response.status)

    // Summary
    displayRunComplete(startTime)

    // Exit with success only if both scrape and sync succeeded
    if (result.success && syncResult.success) {
      console.log('')
      console.log('Status: SUCCESS')
      process.exit(0)
    } else {
      console.log('')
      console.log('Status: PARTIAL SUCCESS (some errors occurred)')
      process.exit(0) // Still exit 0 if we got some data
    }
  } catch (err) {
    console.error('')
    console.error('='.repeat(60))
    console.error('RUN FAILED')
    console.error('='.repeat(60))
    console.error(err)
    process.exit(1)
  }
}

main()
