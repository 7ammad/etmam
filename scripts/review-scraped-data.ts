/**
 * Review saved scraped data against logic (filter: IT-only).
 * Does not run the scraper; only loads JSON from scraper-output and runs detectNonItTenders.
 *
 * Run: pnpm review:scraped
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { detectNonItTenders } from '../lib/scraper/utils'

const SCRAPER_OUTPUT_DIR = join(process.cwd(), 'scraper-output')

interface ScrapedFile {
  metadata?: { totalScraped?: number; config?: { batchSize?: number } }
  tenders: Array<{ reference_no: string; title: string; entity?: string }>
}

function main(): void {
  console.log('Reviewing saved scraped data against logic (IT-only filter)...\n')

  const files = readdirSync(SCRAPER_OUTPUT_DIR, { withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith('.json') && f.name.startsWith('scraped-tenders-'))
    .map((f) => f.name)
    .sort()
    .reverse()

  if (files.length === 0) {
    console.log('No scraped-tenders-*.json files found in scraper-output/')
    process.exit(0)
    return
  }

  const results: Array<{
    file: string
    totalTenders: number
    violations: number
    violationRefs: string[]
    passed: boolean
  }> = []

  for (const file of files) {
    const path = join(SCRAPER_OUTPUT_DIR, file)
    let data: ScrapedFile
    try {
      data = JSON.parse(readFileSync(path, 'utf-8'))
    } catch {
      results.push({ file, totalTenders: 0, violations: 0, violationRefs: [], passed: true })
      continue
    }
    const tenders = data.tenders || []
    const violations = detectNonItTenders(tenders)
    results.push({
      file,
      totalTenders: tenders.length,
      violations: violations.length,
      violationRefs: violations.map((v) => `${v.reference_no}: ${v.title.slice(0, 50)}...`),
      passed: violations.length === 0,
    })
  }

  // Print to console
  console.log('--- Logic review (IT-only filter) ---')
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗'
    console.log(`${icon} ${r.file}`)
    console.log(`   Tenders: ${r.totalTenders}, Non-IT violations: ${r.violations}`)
    if (r.violationRefs.length > 0) {
      r.violationRefs.slice(0, 5).forEach((v) => console.log(`   - ${v}`))
      if (r.violationRefs.length > 5) console.log(`   ... and ${r.violationRefs.length - 5} more`)
    }
    console.log('')
  }

  const totalTenders = results.reduce((s, r) => s + r.totalTenders, 0)
  const totalViolations = results.reduce((s, r) => s + r.violations, 0)
  const filesPassed = results.filter((r) => r.passed).length

  console.log('--- Summary ---')
  console.log(`Files: ${files.length} (${filesPassed} passed, ${files.length - filesPassed} with violations)`)
  console.log(`Total tenders: ${totalTenders}, Total non-IT violations: ${totalViolations}`)
  console.log('')

  // Save report
  const report = {
    reviewedAt: new Date().toISOString(),
    filesReviewed: files.length,
    filesPassed,
    totalTenders,
    totalViolations,
    results,
  }
  const reportPath = join(SCRAPER_OUTPUT_DIR, `logic-review-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`Report saved: ${reportPath}`)

  process.exit(totalViolations > 0 ? 1 : 0)
}

main()
