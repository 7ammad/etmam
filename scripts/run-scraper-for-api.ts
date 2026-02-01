/**
 * Scraper runner for dashboard "Run scrape" — runs scraper and writes progress to a file
 * so GET /api/scrape/status can report progress.
 *
 * Env: API_URL, CRON_SECRET, SCRAPE_PROGRESS_FILE (path to write progress JSON)
 */

import * as fs from 'fs'
import * as path from 'path'
import { scrapePublicTenders } from '../lib/scraper'
import type { SyncResponse } from '../types/scraper'

const PROGRESS_FILE =
  process.env.SCRAPE_PROGRESS_FILE ?? path.join(process.cwd(), '.scrape-progress.json')
const SCRAPER_OUTPUT_DIR = path.join(process.cwd(), 'scraper-output')

function writeProgress(obj: Record<string, unknown>): void {
  try {
    fs.writeFileSync(
      PROGRESS_FILE,
      JSON.stringify({ ...obj, updatedAt: Date.now() }, null, 0),
      'utf-8'
    )
  } catch {
    // ignore
  }
}

async function main(): Promise<void> {
  const apiUrl = process.env.API_URL
  const cronSecret = process.env.CRON_SECRET

  if (!apiUrl || !cronSecret) {
    writeProgress({ status: 'failed', error: 'API_URL or CRON_SECRET missing' })
    process.exit(1)
  }

  writeProgress({ status: 'running', startedAt: Date.now(), message: 'Scraping…' })

  const batchSize = parseInt(process.env.BATCH_SIZE ?? '50', 10)
  const delayMs = parseInt(process.env.DELAY_MS ?? '2000', 10)
  const isHistorical = process.env.SCRAPE_MODE === 'historical'

  try {
    const result = await scrapePublicTenders({
      batchSize,
      delayMs,
      headless: true,
      activityFilter: { mainActivityId: '9' },
      listPageSize: 24,
      mode: isHistorical ? 'historical' : 'active',
    })

    writeProgress({
      status: 'running',
      message: 'Syncing to database…',
      tendersScraped: result.metadata.totalScraped,
    })

    // Always save to scraper-output so data isn't lost if sync fails
    let savedTo: string | undefined
    if (result.tenders.length > 0) {
      if (!fs.existsSync(SCRAPER_OUTPUT_DIR)) {
        fs.mkdirSync(SCRAPER_OUTPUT_DIR, { recursive: true })
      }
      savedTo = path.join(
        SCRAPER_OUTPUT_DIR,
        `run-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      )
      fs.writeFileSync(
        savedTo,
        JSON.stringify({ tenders: result.tenders, metadata: result.metadata }, null, 2),
        'utf-8'
      )
    }

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
      const text = await response.text()
      writeProgress({ status: 'failed', error: `Sync ${response.status}: ${text}` })
      process.exit(1)
    }

    const syncResult = (await response.json()) as SyncResponse & { errors?: string[] }
    writeProgress({
      status: 'completed',
      tendersScraped: result.metadata.totalScraped,
      upserted: syncResult.upserted ?? 0,
      syncErrors: syncResult.errors ?? [],
      savedTo: savedTo ?? (result.tenders.length > 0 ? SCRAPER_OUTPUT_DIR : undefined),
      completedAt: Date.now(),
    })
    process.exit(0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    writeProgress({ status: 'failed', error: message, completedAt: Date.now() })
    process.exit(1)
  }
}

main()
