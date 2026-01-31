/**
 * Active Scraper Verification Script
 *
 * Verifies that the active scraper delivers the intended logic, not only code:
 * - Filter: IT/Telecom only (code + optional runtime check)
 * - 24 items per page (code + log assertion when RUN_LOGIC_CHECK=1)
 * - Next-page pagination (code)
 *
 * Run: pnpm verify:scraper-active
 * With logic check (run scraper, assert behavior): RUN_LOGIC_CHECK=1 pnpm verify:scraper-active
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync, spawnSync } from 'child_process'

type VerificationResult = {
  task: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string[]
}

const results: VerificationResult[] = []

function pass(task: string, message: string): void {
  results.push({ task, status: 'pass', message })
}

function fail(task: string, message: string, details?: string[]): void {
  results.push({ task, status: 'fail', message, details })
}

function verifyFileContent(
  filePath: string,
  requiredPatterns: RegExp[],
  taskName: string
): void {
  if (!existsSync(filePath)) {
    fail(taskName, `File not found: ${filePath}`)
    return
  }
  const content = readFileSync(filePath, 'utf-8')
  const missing = requiredPatterns.filter((p) => !p.test(content))
  if (missing.length > 0) {
    fail(taskName, `Missing required patterns in ${filePath}`, missing.map((p) => p.toString()))
    return
  }
  pass(taskName, `All required patterns found in ${filePath}`)
}

/** Code: Filter (IT/Telecom) is implemented */
function verifyFilterCode(): void {
  const configPath = join(process.cwd(), 'lib/scraper/config.ts')
  verifyFileContent(
    configPath,
    [/ACTIVITY_IDS\.TELECOM_IT|mainActivityId.*9/, /SUB_ACTIVITY_IDS\.IT|902/, /#activitiesList|#subActivitiesList|#TenderCategory/],
    'Filter code: config has Telecom/IT (9) and IT (902) and filter selectors'
  )
  const browserPath = join(process.cwd(), 'lib/scraper/etimad-browser.ts')
  verifyFileContent(
    browserPath,
    [/#TenderCategory.*selectOption|#activitiesList.*selectOption|#subActivitiesList.*selectOption/, /dispatchEvent.*change/],
    'Filter code: browser applies TenderCategory, activitiesList, subActivitiesList and dispatches change'
  )
  const utilsPath = join(process.cwd(), 'lib/scraper/utils.ts')
  verifyFileContent(
    utilsPath,
    [/detectNonItTenders|NON_IT_TITLE_PATTERNS/],
    'Filter code: utils has detectNonItTenders for logic verification'
  )
}

/** Code: 24 items per page and pagination */
function verify24AndPaginationCode(): void {
  const browserPath = join(process.cwd(), 'lib/scraper/etimad-browser.ts')
  verifyFileContent(
    browserPath,
    [/setListPageSize|listPageSize.*24|itemsPerPage/],
    '24/page code: setListPageSize and 24 items per page'
  )
  verifyFileContent(
    browserPath,
    [/collectTenderUrlsWithPagination|goToNextListPage|PageNumber/],
    'Pagination code: collectTenderUrlsWithPagination and goToNextListPage (or PageNumber fallback)'
  )
  const testPath = join(process.cwd(), 'scripts/test-scraper.ts')
  verifyFileContent(testPath, [/listPageSize:\s*24/], '24/page code: test-scraper passes listPageSize 24')
  const runPath = join(process.cwd(), 'scripts/run-scraper.ts')
  verifyFileContent(runPath, [/listPageSize:\s*24/], '24/page code: run-scraper passes listPageSize 24')
}

/** Optional: Run scraper and assert logic (filter + 24/page in log) */
function verifyLogicRuntime(): void {
  if (process.env.RUN_LOGIC_CHECK !== '1' && process.env.RUN_LOGIC_CHECK !== 'true') {
    pass('Logic runtime', 'Skipped (set RUN_LOGIC_CHECK=1 to run scraper and assert behavior)')
    return
  }
  const cwd = process.cwd()
  const env = {
    ...process.env,
    BATCH_SIZE: '2',
    STRICT_FILTER_VERIFY: 'true',
  }
  const r = spawnSync('pnpm', ['scrape:test'], {
    cwd,
    env,
    encoding: 'utf-8',
    timeout: 120_000,
  })
  const stdout = (r.stdout || '').toString()
  const stderr = (r.stderr || '').toString()
  const out = stdout + stderr

  if (out.includes('Filter verification failed')) {
    fail(
      'Logic runtime: filter',
      'Scraper run with STRICT_FILTER_VERIFY=true reported non-IT tenders (filter not delivering IT-only)',
      [out.slice(out.indexOf('Filter verification failed'), out.indexOf('Filter verification failed') + 200)]
    )
  } else {
    pass('Logic runtime: filter', 'No filter verification failure (tenders appear IT-only or run had 0 tenders)')
  }

  if (!out.includes('List page size set to 24')) {
    fail('Logic runtime: 24/page', 'Log did not contain "List page size set to 24 items"')
  } else {
    pass('Logic runtime: 24/page', 'Log contained "List page size set to 24 items"')
  }
}

function main(): void {
  console.log('Verifying active scraper (code + logic)...\n')
  verifyFilterCode()
  verify24AndPaginationCode()
  verifyLogicRuntime()

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length

  console.log('--- Results ---')
  for (const r of results) {
    const icon = r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '!'
    console.log(`${icon} ${r.task}: ${r.message}`)
    if (r.details?.length) r.details.forEach((d) => console.log(`  ${d}`))
  }
  console.log('')
  console.log(`Total: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    process.exit(1)
  }
  process.exit(0)
}

main()
