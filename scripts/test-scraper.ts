/**
 * Etimad Scraper Test Script
 *
 * Runs the scraper in test mode with a small batch size.
 * No API required: just scrapes and prints/saves to scraper-output.
 * Optionally POST to sync API when POST_TO_API=true.
 *
 * Run with: pnpm scrape:test
 * Historical (awarded) tenders: pnpm scrape:test -- --historical
 * Quick smoke (6 tenders, no file save): pnpm scrape:smoke  or  pnpm scrape:test -- --smoke
 *
 * Environment variables:
 *   BATCH_SIZE - Number of tenders (default: 5, overridden to 6 when --smoke)
 *   SAVE_TO_FILE - Set to 'true' to save JSON to scraper-output/ (filename: scraped-tenders-{active|historical}-{timestamp}.json)
 *   POST_TO_API - Set to 'true' to also POST results to sync endpoint (then API_URL, CRON_SECRET needed)
 *   API_URL, CRON_SECRET - Only if POST_TO_API=true
 *   ACTIVITY_ID - Main activity filter ID (default: '9' for Telecom/IT)
 */

import { scrapePublicTenders } from '../lib/scraper'
import { ETMAM_ACTIVITY_FILTERS } from '../lib/scraper/config'
import * as fs from 'fs'
import * as path from 'path'
import {
  formatScrapeResults,
  displaySampleTender,
  displayAllTenders,
  displayErrors,
} from './scraper-utils'

async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('ETIMAD SCRAPER - TEST MODE')
  console.log('='.repeat(60))
  console.log('')

  const startTime = Date.now()

  try {
    const hasHistoricalFlag = process.argv.includes('--historical')
    const smokeMode = process.argv.includes('--smoke')
    const mode = (process.env.SCRAPER_MODE || (hasHistoricalFlag ? 'historical' : 'active')) as 'active' | 'historical'

    const activityId =
      process.env.ACTIVITY_ID || ETMAM_ACTIVITY_FILTERS.telecomIT.mainActivityId
    const batchSize = smokeMode ? 6 : parseInt(process.env.BATCH_SIZE || '5', 10)

    if (smokeMode) console.log('[Test] Smoke run: first 6 tenders only, no file save')
    console.log(`[Test] Starting scraper with batch size: ${batchSize}`)
    console.log(`[Test] Mode: ${mode} (${mode === 'historical' ? 'awarded tenders' : 'active/open for bids'})`)
    console.log(`[Test] Activity filter: ${activityId} (Telecom/IT)`)
    console.log('')

    const result = await scrapePublicTenders({
      batchSize,
      delayMs: 3000,
      headless: true,
      activityFilter: { mainActivityId: activityId },
      mode,
      listPageSize: 24,
    })

    // Print results summary
    formatScrapeResults(result, startTime)

    // Print sample tender
    if (result.tenders.length > 0) {
      displaySampleTender(result.tenders[0])
    }

    // Print all tenders summary
    displayAllTenders(result.tenders)

    // Print errors
    displayErrors(result.errors)

    // Save to JSON file (optional: SAVE_TO_FILE=true or when BATCH_SIZE >= 10; smoke saves only if SAVE_TO_FILE set)
    const saveToFile =
      (smokeMode &&
        (process.env.SAVE_TO_FILE === 'true' || process.env.SAVE_TO_FILE === '1')) ||
      (!smokeMode &&
        (process.env.SAVE_TO_FILE === 'true' ||
          process.env.SAVE_TO_FILE === '1' ||
          batchSize >= 10))
    if (saveToFile) {
      const outputDir = path.join(process.cwd(), 'scraper-output')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = path.join(outputDir, `scraped-tenders-${mode}-${timestamp}.json`)

      const output = {
        mode,
        metadata: result.metadata,
        tenders: result.tenders,
        errors: result.errors,
        scrapedAt: new Date().toISOString(),
      }

      fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf-8')
      console.log(`[Test] Results saved to: ${filename}`)
      console.log('')
    }

    // Optionally POST to API
    if (process.env.POST_TO_API === 'true') {
      const apiUrl = process.env.API_URL || 'http://localhost:3000/api/cron/sync'
      const cronSecret = process.env.CRON_SECRET

      if (!cronSecret) {
        console.warn('[Test] CRON_SECRET not set, skipping API POST')
      } else {
        console.log(`[Test] POSTing results to ${apiUrl}...`)

        try {
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

          const responseData = await response.json()
          console.log('')
          console.log('--- API Response ---')
          console.log(`  Status: ${response.status}`)
          console.log(`  Success: ${responseData.success}`)
          console.log(`  Upserted: ${responseData.upserted}`)
          if (responseData.errors?.length > 0) {
            console.log(`  Errors: ${responseData.errors.join(', ')}`)
          }
        } catch (err) {
          console.error('[Test] API POST failed:', err)
        }
      }
    }

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1)
  } catch (err) {
    console.error('[Test] Fatal error:', err)
    process.exit(1)
  }
}

main()
