/**
 * Shared utilities for scraper scripts
 *
 * Common functions for formatting and displaying scraper results.
 */

import type { ScrapeResult, SyncResponse } from '@/types/scraper'

/**
 * Format and display scrape results summary
 */
export function formatScrapeResults(result: ScrapeResult, startTime: number): void {
  const duration = Date.now() - startTime

  console.log('')
  console.log('='.repeat(60))
  console.log('RESULTS')
  console.log('='.repeat(60))
  console.log('')
  console.log(`Total scraped: ${result.metadata.totalScraped}`)
  console.log(`Total errors: ${result.metadata.totalErrors}`)
  console.log(`Duration: ${duration}ms`)
  console.log(`Success: ${result.success}`)
  console.log('')
}

/**
 * Display sample tender details
 */
export function displaySampleTender(tender: ScrapeResult['tenders'][0]): void {
  console.log('--- Sample Tender ---')
  console.log(`  Reference: ${tender.reference_no}`)
  console.log(`  Title: ${tender.title}`)
  console.log(`  Entity: ${tender.entity}`)
  console.log(`  Deadline: ${tender.deadline}`)
  console.log(`  Estimated Value: ${tender.estimated_value ?? 'N/A'}`)
  console.log(`  Booklet Price: ${tender.booklet_price ?? 'N/A'} SAR`)
  console.log(`  Initial Guarantee: ${tender.initial_guarantee ?? 'N/A'}%`)
  console.log(`  Duration: ${tender.contract_duration ?? 'N/A'}`)
  console.log(`  URL: ${tender.tender_url}`)
  console.log('')
}

/**
 * Display all tenders summary
 */
export function displayAllTenders(tenders: ScrapeResult['tenders']): void {
  if (tenders.length === 0) return

  console.log('--- All Tenders ---')
  tenders.forEach((tender, i) => {
    console.log(`  ${i + 1}. [${tender.reference_no}] ${tender.title.slice(0, 50)}...`)
  })
  console.log('')
}

/**
 * Display scrape errors
 */
export function displayErrors(errors: ScrapeResult['errors']): void {
  if (errors.length === 0) return

  console.log('--- Errors ---')
  errors.forEach((error, i) => {
    console.log(`  ${i + 1}. [${error.code}] ${error.message}`)
    if (error.url) console.log(`     URL: ${error.url}`)
  })
  console.log('')
}

/**
 * Display sync API results
 */
export function displaySyncResults(syncResult: SyncResponse, statusCode: number): void {
  console.log('')
  console.log('--- Sync Results ---')
  console.log(`  Status: ${statusCode}`)
  console.log(`  Success: ${syncResult.success}`)
  console.log(`  Upserted: ${syncResult.upserted}`)

  if (syncResult.errors && syncResult.errors.length > 0) {
    console.log(`  Sync Errors:`)
    syncResult.errors.forEach((err) => {
      console.log(`    - ${err}`)
    })
  }
}

/**
 * Display run completion summary
 */
export function displayRunComplete(startTime: number): void {
  const totalTime = Date.now() - startTime
  console.log('')
  console.log('='.repeat(60))
  console.log('RUN COMPLETE')
  console.log(`Completed at: ${new Date().toISOString()}`)
  console.log(`Total duration: ${totalTime}ms`)
  console.log('='.repeat(60))
}
