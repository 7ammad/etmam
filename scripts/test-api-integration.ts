/**
 * API Integration Test Script
 *
 * Tests the scraper-to-API-to-database flow end-to-end.
 * 
 * Prerequisites:
 * - Dev server running: pnpm dev
 * - CRON_SECRET set in .env.local
 * - SYSTEM_USER_ID set in .env.local (optional, has fallback)
 * - Supabase migrations applied
 *
 * Run with: pnpm test:api
 */

import { scrapePublicTenders } from '../lib/scraper'
import { ETMAM_ACTIVITY_FILTERS } from '../lib/scraper/config'
import type { SyncResponse } from '../types/scraper'

async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('API INTEGRATION TEST')
  console.log('='.repeat(60))
  console.log('')

  // Validate environment
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/cron/sync'
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[ERROR] CRON_SECRET environment variable is required')
    console.error('Set it in .env.local or pass as: CRON_SECRET=xxx pnpm test:api')
    process.exit(1)
  }

  console.log(`[Config] API URL: ${apiUrl}`)
  console.log(`[Config] CRON_SECRET: ${cronSecret.substring(0, 8)}...`)
  console.log('')

  const startTime = Date.now()

  try {
    // Step 1: Scrape a small batch (2 tenders for testing)
    console.log('[Step 1] Scraping tenders...')
    const result = await scrapePublicTenders({
      batchSize: 2,
      delayMs: 3000,
      headless: true,
      activityFilter: {
        mainActivityId: ETMAM_ACTIVITY_FILTERS.telecomIT.mainActivityId,
      },
    })

    console.log(`[Step 1] ✅ Scraped ${result.tenders.length} tenders`)
    console.log(`[Step 1] Errors: ${result.errors.length}`)
    console.log('')

    if (result.tenders.length === 0) {
      console.error('[ERROR] No tenders scraped. Cannot test API integration.')
      process.exit(1)
    }

    // Step 2: POST to API
    console.log(`[Step 2] POSTing to ${apiUrl}...`)
    let response: Response
    try {
      response = await fetch(apiUrl, {
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
    } catch (err) {
      console.error(`[Step 2] ❌ Failed to connect to API: ${err instanceof Error ? err.message : String(err)}`)
      console.error(`[Step 2] Make sure dev server is running: pnpm dev`)
      process.exit(1)
    }

    const responseText = await response.text()
    let syncResult: SyncResponse

    try {
      syncResult = JSON.parse(responseText)
    } catch {
      console.error(`[Step 2] ❌ Invalid JSON response: ${responseText}`)
      process.exit(1)
    }

    console.log(`[Step 2] Status: ${response.status}`)
    console.log(`[Step 2] Success: ${syncResult.success}`)
    console.log(`[Step 2] Upserted: ${syncResult.upserted}`)
    console.log('')

    // Step 3: Verify results
    if (!response.ok) {
      console.error(`[Step 3] ❌ API returned ${response.status}`)
      if (syncResult.errors) {
        console.error(`[Step 3] Errors: ${syncResult.errors.join(', ')}`)
      }
      process.exit(1)
    }

    if (!syncResult.success) {
      console.error(`[Step 3] ❌ API reported failure`)
      if (syncResult.errors) {
        console.error(`[Step 3] Errors: ${syncResult.errors.join(', ')}`)
      }
      process.exit(1)
    }

    if (syncResult.upserted === 0) {
      console.warn(`[Step 3] ⚠️  No tenders upserted (may be duplicates)`)
    } else {
      console.log(`[Step 3] ✅ ${syncResult.upserted} tender(s) upserted successfully`)
    }

    // Step 4: Verify in database (optional - requires Supabase client)
    console.log('')
    console.log('[Step 4] Database verification (manual check recommended)')
    console.log('  Check Supabase dashboard or run:')
    console.log('  SELECT * FROM tenders WHERE source = \'etimad\' ORDER BY created_at DESC LIMIT 5;')
    console.log('')

    // Summary
    const duration = Date.now() - startTime
    console.log('='.repeat(60))
    console.log('TEST COMPLETE')
    console.log('='.repeat(60))
    console.log(`Duration: ${duration}ms`)
    console.log(`Status: ${syncResult.success ? '✅ PASS' : '❌ FAIL'}`)
    console.log('='.repeat(60))

    process.exit(syncResult.success ? 0 : 1)
  } catch (err) {
    console.error('')
    console.error('='.repeat(60))
    console.error('TEST FAILED')
    console.error('='.repeat(60))
    console.error(err)
    process.exit(1)
  }
}

main()
