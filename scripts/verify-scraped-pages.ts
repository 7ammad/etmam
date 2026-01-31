/**
 * Verify scraped tender data by visiting each URL and re-extracting key fields.
 * Compares re-extracted data with the saved JSON and writes a report.
 *
 * Usage: tsx scripts/verify-scraped-pages.ts [path-to-scraped-tenders.json]
 * Default: uses most recent scraped-tenders-*.json in scraper-output/
 */

import * as fs from 'fs'
import * as path from 'path'
import { chromium } from '@playwright/test'
import { EtimadScraper } from '../lib/scraper'
import type { ScrapedTender } from '../types/scraper'

interface VerificationResult {
  url: string
  reference_no: string
  stored: Partial<ScrapedTender>
  reExtracted: Partial<ScrapedTender>
  matches: { field: string; match: boolean; stored: unknown; reExtracted: unknown }[]
  allMatch: boolean
  error?: string
}

function normalize(s: string | null | undefined): string {
  if (s == null) return ''
  return String(s)
    .trim()
    .replace(/\s+/g, ' ')
}

function sameString(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalize(a) === normalize(b)
}

function sameNumber(a: number | null | undefined, b: number | null | undefined): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return a === b
}

function compareTender(
  stored: Partial<ScrapedTender>,
  reExtracted: Partial<ScrapedTender>
): { field: string; match: boolean; stored: unknown; reExtracted: unknown }[] {
  const fields: { key: keyof ScrapedTender; cmp: (a: unknown, b: unknown) => boolean }[] = [
    { key: 'reference_no', cmp: (a, b) => sameString(a as string, b as string) },
    { key: 'title', cmp: (a, b) => sameString(a as string, b as string) },
    { key: 'entity', cmp: (a, b) => sameString(a as string, b as string) },
    { key: 'contract_duration', cmp: (a, b) => sameString(a as string, b as string) },
    { key: 'booklet_price', cmp: (a, b) => sameNumber(a as number, b as number) },
  ]
  return fields.map(({ key, cmp }) => {
    const s = (stored as Record<string, unknown>)[key as string]
    const r = (reExtracted as Record<string, unknown>)[key as string]
    const match = cmp(s, r)
    return { field: key as string, match, stored: s, reExtracted: r }
  })
}

function getLatestScrapedFile(dir: string): string | null {
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('scraped-tenders-') && f.endsWith('.json'))
  if (files.length === 0) return null
  const withPath = files.map((f) => path.join(dir, f))
  const latest = withPath.sort((a, b) => {
    const at = fs.statSync(a).mtime.getTime()
    const bt = fs.statSync(b).mtime.getTime()
    return bt - at
  })[0]
  return latest
}

async function main(): Promise<void> {
  const outputDir = path.join(process.cwd(), 'scraper-output')
  const inputPath =
    process.argv[2] || getLatestScrapedFile(outputDir)

  if (!inputPath || !fs.existsSync(inputPath)) {
    console.error('No scraped JSON found. Run: BATCH_SIZE=50 pnpm scrape:test')
    process.exit(1)
  }

  const raw = fs.readFileSync(inputPath, 'utf-8')
  const data: { tenders: ScrapedTender[]; metadata?: unknown } = JSON.parse(raw)
  const tenders = data.tenders || []

  if (tenders.length === 0) {
    console.error('No tenders in JSON.')
    process.exit(1)
  }

  console.log('='.repeat(60))
  console.log('VERIFY SCRAPED PAGES')
  console.log('='.repeat(60))
  console.log(`Input: ${inputPath}`)
  console.log(`Tenders to verify: ${tenders.length}`)
  console.log('')

  const scraper = new EtimadScraper({ headless: true, delayMs: 1500 })
  // No init() needed: we only use extractTenderDataFromPage with our own page.

  const results: VerificationResult[] = []
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ locale: 'ar-SA' })

  for (let i = 0; i < tenders.length; i++) {
    const tender = tenders[i]
    const url = tender.tender_url || ''
    console.log(`[${i + 1}/${tenders.length}] ${tender.reference_no} ${url.slice(0, 50)}...`)

    const page = await context.newPage()
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      const reExtracted = await scraper.extractTenderDataFromPage(page, url)
      const matches = compareTender(tender, reExtracted)
      const allMatch = matches.every((m) => m.match)
      results.push({
        url,
        reference_no: tender.reference_no,
        stored: {
          reference_no: tender.reference_no,
          title: tender.title,
          entity: tender.entity,
          contract_duration: tender.contract_duration,
          booklet_price: tender.booklet_price,
        },
        reExtracted: {
          reference_no: reExtracted.reference_no,
          title: reExtracted.title,
          entity: reExtracted.entity,
          contract_duration: reExtracted.contract_duration,
          booklet_price: reExtracted.booklet_price,
        },
        matches,
        allMatch,
      })
      console.log(`  ${allMatch ? 'OK' : 'MISMATCH'} ${matches.filter((m) => m.match).length}/${matches.length} fields`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  ERROR: ${msg}`)
      results.push({
        url,
        reference_no: tender.reference_no,
        stored: tender,
        reExtracted: {},
        matches: [],
        allMatch: false,
        error: msg,
      })
    } finally {
      await page.close()
    }
  }

  await context.close()
  await browser.close()

  const allMatchCount = results.filter((r) => r.allMatch).length
  const errorCount = results.filter((r) => r.error).length
  const mismatchCount = results.length - allMatchCount - errorCount

  const report = {
    inputFile: inputPath,
    verifiedAt: new Date().toISOString(),
    totalTenders: tenders.length,
    summary: {
      allMatch: allMatchCount,
      mismatch: mismatchCount,
      error: errorCount,
    },
    results,
  }

  const reportPath = path.join(
    outputDir,
    `verification-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  )
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')

  console.log('')
  console.log('='.repeat(60))
  console.log('VERIFICATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Match:    ${allMatchCount}/${tenders.length}`)
  console.log(`  Mismatch: ${mismatchCount}`)
  console.log(`  Error:    ${errorCount}`)
  console.log(`Report:    ${reportPath}`)
  console.log('='.repeat(60))

  process.exit(errorCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
