/**
 * Etimad Scraper Test Script
 *
 * Runs the scraper in test mode with a small batch size.
 * Outputs results to console and optionally posts to the sync API.
 *
 * Run with: pnpm scrape:test
 *
 * Environment variables:
 *   POST_TO_API - Set to 'true' to POST results to sync endpoint
 *   API_URL - URL of the sync endpoint (default: http://localhost:3000/api/cron/sync)
 *   CRON_SECRET - Auth token for sync endpoint
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
    // Use Telecom/IT filter by default, or custom via env var
    const activityId =
      process.env.ACTIVITY_ID || ETMAM_ACTIVITY_FILTERS.telecomIT.mainActivityId

    console.log('[Test] Starting scraper with batch size: 5')
    console.log(`[Test] Activity filter: ${activityId} (Telecom/IT)`)
    console.log('')

    const result = await scrapePublicTenders({
      batchSize: 5, // Only scrape 5 tenders for testing
      delayMs: 3000, // Longer delay for testing (3 seconds)
      headless: true, // Run headless in test mode
      activityFilter: { mainActivityId: activityId },
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

    // Save to JSON file (optional, controlled by SAVE_TO_FILE env var)
    if (process.env.SAVE_TO_FILE === 'true' || process.env.SAVE_TO_FILE === '1') {
      const outputDir = path.join(process.cwd(), 'scraper-output')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = path.join(outputDir, `scraped-tenders-${timestamp}.json`)
      
      const output = {
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
