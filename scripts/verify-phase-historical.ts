/**
 * Historical Scraper Verification Script
 *
 * Verifies implementation of the historical (awarded) tender scraper:
 * - Phase 1: Config and filter for awarded status
 * - Phase 2: Schema and extraction for award data
 * - Phase 3: DB storage and sync API
 *
 * Run: pnpm run verify:historical
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { scrapedTenderSchema } from '../types/scraper'

type VerificationResult = {
  task: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string[]
}

const results: VerificationResult[] = []

function verifyFileContent(
  filePath: string,
  requiredPatterns: RegExp[],
  taskName: string
): VerificationResult {
  if (!existsSync(filePath)) {
    return {
      task: taskName,
      status: 'fail',
      message: `File not found: ${filePath}`,
    }
  }
  const content = readFileSync(filePath, 'utf-8')
  const missing = requiredPatterns.filter((p) => !p.test(content))
  if (missing.length > 0) {
    return {
      task: taskName,
      status: 'fail',
      message: `Missing required patterns in ${filePath}`,
      details: missing.map((p) => p.toString()),
    }
  }
  return { task: taskName, status: 'pass', message: `All required patterns found in ${filePath}` }
}

/** Phase 1: Config and filter for awarded */
function verifyPhase1(): void {
  const configPath = join(process.cwd(), 'lib/scraper/config.ts')
  results.push(
    verifyFileContent(
      configPath,
      [/TENDER_STATUS_FILTERS/, /awarded:\s*['"]6['"]/],
      'Phase 1.1: config.ts has TENDER_STATUS_FILTERS.awarded = 6'
    )
  )
  const browserPath = join(process.cwd(), 'lib/scraper/etimad-browser.ts')
  results.push(
    verifyFileContent(
      browserPath,
      [/config\.mode\s*===?\s*['"]historical['"]/, /TENDER_STATUS_FILTERS\.awarded/],
      'Phase 1.2: etimad-browser uses mode for historical filter'
    )
  )
  const runPath = join(process.cwd(), 'scripts/run-scraper.ts')
  results.push(
    verifyFileContent(
      runPath,
      [/--historical|SCRAPER_MODE|scraperMode|mode:\s*scraperMode/],
      'Phase 1.3: run-scraper has historical flag/mode'
    )
  )
}

/** Phase 2: Schema and extraction */
function verifyPhase2(): void {
  const typesPath = join(process.cwd(), 'types/scraper.ts')
  results.push(
    verifyFileContent(
      typesPath,
      [/award_amount_sar/, /award_date/, /winning_bidder/],
      'Phase 2.1: types/scraper has award fields'
    )
  )
  const configPath = join(process.cwd(), 'lib/scraper/config.ts')
  results.push(
    verifyFileContent(
      configPath,
      [/winningBidder|awardAmount|awardDate/],
      'Phase 2.3: config has award Arabic labels'
    )
  )
  const browserPath = join(process.cwd(), 'lib/scraper/etimad-browser.ts')
  results.push(
    verifyFileContent(
      browserPath,
      [/award_results/, /award_amount_sar|award_date|winning_bidder/],
      'Phase 2.4: etimad-browser extracts award fields from award_results tab'
    )
  )
  const schemaPath = join(process.cwd(), 'docs/etimad-scraped-fields-schema.json')
  results.push(
    verifyFileContent(
      schemaPath,
      [/award_amount_sar|award_date|winning_bidder/],
      'Phase 2.5: JSON schema documents award fields'
    )
  )
}

/** Phase 3: DB storage and sync */
function verifyPhase3(): void {
  const migrationPath = join(process.cwd(), 'supabase/migrations/00005_add_award_columns.sql')
  if (!existsSync(migrationPath)) {
    results.push({
      task: 'Phase 3.1: Migration 00005',
      status: 'fail',
      message: 'Migration file not found: 00005_add_award_columns.sql',
    })
  } else {
    const content = readFileSync(migrationPath, 'utf-8')
    const hasAll =
      /award_amount_sar/.test(content) &&
      /award_date/.test(content) &&
      /winning_bidder/.test(content)
    results.push({
      task: 'Phase 3.1: Migration 00005',
      status: hasAll ? 'pass' : 'fail',
      message: hasAll
        ? 'Migration adds award_amount_sar, award_date, winning_bidder'
        : 'Migration missing one or more award columns',
    })
  }
  const dbTypesPath = join(process.cwd(), 'types/database.ts')
  results.push(
    verifyFileContent(
      dbTypesPath,
      [/award_amount_sar/, /award_date/, /winning_bidder/],
      'Phase 3.2: types/database has award columns'
    )
  )
  const syncPath = join(process.cwd(), 'app/api/cron/sync/route.ts')
  results.push(
    verifyFileContent(
      syncPath,
      [/tender\.award_amount_sar/, /tender\.award_date/, /tender\.winning_bidder/],
      'Phase 3.3: tenderToDbFormat maps award fields'
    )
  )
}

/** Unit-style: ScrapedTender with award fields validates */
function verifyAwardFieldsSchema(): VerificationResult {
  const tenderWithAward = {
    reference_no: '260139010329',
    title: 'Test Tender',
    entity: 'Test Entity',
    deadline: '2026-02-10T00:00:00.000Z',
    source: 'etimad' as const,
    scraped_at: new Date().toISOString(),
    tab_sections: { basic_info: { 'رقم المنافسة': '260139010329' } },
    award_amount_sar: 500_000,
    award_date: '2025-06-15T00:00:00.000Z',
    winning_bidder: 'شركة مثال',
  }
  const parsed = scrapedTenderSchema.safeParse(tenderWithAward)
  if (!parsed.success) {
    return {
      task: 'Schema: ScrapedTender with award fields',
      status: 'fail',
      message: 'scrapedTenderSchema should accept award fields',
      details: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    }
  }
  if (parsed.data.award_amount_sar !== 500_000 || parsed.data.winning_bidder !== 'شركة مثال') {
    return {
      task: 'Schema: ScrapedTender with award fields',
      status: 'fail',
      message: 'Parsed tender should preserve award fields',
    }
  }
  return {
    task: 'Schema: ScrapedTender with award fields',
    status: 'pass',
    message: 'scrapedTenderSchema accepts and preserves award fields',
  }
}

/** TypeScript type check */
function runTypeCheck(): VerificationResult {
  try {
    execSync('pnpm type-check', { encoding: 'utf-8', cwd: process.cwd(), stdio: 'pipe' })
    return { task: 'TypeScript type-check', status: 'pass', message: 'TypeScript compilation successful' }
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    const out = (e.stdout ?? e.stderr ?? e.message ?? '').toString()
    return {
      task: 'TypeScript type-check',
      status: 'fail',
      message: 'TypeScript compilation failed',
      details: out.split('\n').slice(0, 15),
    }
  }
}

async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('HISTORICAL SCRAPER VERIFICATION')
  console.log('='.repeat(60))
  console.log('')

  verifyPhase1()
  verifyPhase2()
  verifyPhase3()
  console.log('Verifying ScrapedTender schema with award fields...')
  results.push(verifyAwardFieldsSchema())
  console.log('Running TypeScript type-check...')
  results.push(runTypeCheck())

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length

  console.log('')
  console.log('='.repeat(60))
  console.log('RESULTS')
  console.log('='.repeat(60))
  results.forEach((r) => {
    const icon = r.status === 'pass' ? 'PASS' : 'FAIL'
    console.log(`  [${icon}] ${r.task}: ${r.message}`)
    if (r.details?.length) r.details.forEach((d) => console.log(`      ${d}`))
  })
  console.log('')
  console.log(`Passed: ${passed}  Failed: ${failed}`)
  console.log('')

  if (failed > 0) {
    process.exit(1)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
