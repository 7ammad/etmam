#!/usr/bin/env npx tsx
/**
 * Calibrate Value Estimation from Historical Data
 *
 * Analyzes historical tender award data to compute statistics and suggest
 * tighter value estimation tiers based on actual IT/Telecom tender awards.
 *
 * Usage:
 *   pnpm calibrate-values [scraper-output-files...]
 *
 * If no files specified, uses all JSON files in scraper-output/ directory.
 *
 * MVP Requirement: "نموذج بسيط قابل للتعديل" - data-driven model refinement.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { normalizeTenderMoneyFields } from '../lib/currency'
import {
  calibrateFromHistorical,
  getEstimationRange,
  type CalibrationResult,
} from '../lib/evaluation/historical-calibrator'
import type { ScrapedTender } from '../types/scraper'

const OUTPUT_DIR = 'data'
const OUTPUT_FILE = 'calibration-result.json'
const SCRAPER_OUTPUT_DIR = 'scraper-output'

async function loadTendersFromFile(filePath: string): Promise<ScrapedTender[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(content)
    const tenders = data.tenders || data
    if (Array.isArray(tenders)) {
      return tenders
    }
    return []
  } catch (error) {
    console.warn(`⚠️  Failed to load ${filePath}:`, error instanceof Error ? error.message : error)
    return []
  }
}

async function findScraperOutputFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(SCRAPER_OUTPUT_DIR)
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join(SCRAPER_OUTPUT_DIR, f))
  } catch {
    return []
  }
}

function formatSAR(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M SAR`
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}K SAR`
  }
  return `${amount} SAR`
}

function printCalibrationReport(result: CalibrationResult): void {
  console.log('\n' + '='.repeat(70))
  console.log('📊 HISTORICAL DATA CALIBRATION REPORT')
  console.log('='.repeat(70))
  console.log(`Generated: ${result.generated_at}`)
  console.log(`Sample size: ${result.sample_size} tenders with valid award amounts`)

  console.log('\n📈 OVERALL STATISTICS')
  console.log('-'.repeat(50))
  const o = result.overall
  console.log(`  Count:    ${o.count}`)
  console.log(`  Min:      ${formatSAR(o.min)}`)
  console.log(`  Max:      ${formatSAR(o.max)}`)
  console.log(`  Mean:     ${formatSAR(o.mean)}`)
  console.log(`  Median:   ${formatSAR(o.median)}`)
  console.log(`  Std Dev:  ${formatSAR(o.stdDev)}`)
  console.log(`  P25:      ${formatSAR(o.p25)}`)
  console.log(`  P75:      ${formatSAR(o.p75)}`)

  console.log('\n📦 BOOKLET PRICE TIERS')
  console.log('-'.repeat(50))
  for (const tier of result.booklet_tiers) {
    const s = tier.stats
    if (s.count > 0) {
      const range = getEstimationRange(s)
      const maxLabel = tier.max_booklet_sar === 999999 ? '∞' : tier.max_booklet_sar.toString()
      console.log(
        `  Booklet ${tier.min_booklet_sar}-${maxLabel} SAR (n=${s.count}):`
      )
      console.log(`    Actual range:     ${formatSAR(s.min)} - ${formatSAR(s.max)}`)
      console.log(`    IQR (P25-P75):    ${formatSAR(s.p25)} - ${formatSAR(s.p75)}`)
      console.log(`    Suggested range:  ${formatSAR(range.min)} - ${formatSAR(range.max)}`)
      const ratio = range.max / range.min
      console.log(`    Range ratio:      ${ratio.toFixed(1)}x`)
    }
  }

  console.log('\n🏷️  TITLE CATEGORY STATISTICS')
  console.log('-'.repeat(50))
  for (const cat of result.title_categories) {
    const s = cat.stats
    if (s.count > 2) {
      const range = getEstimationRange(s)
      console.log(`  ${cat.label} (n=${s.count}):`)
      console.log(`    Median: ${formatSAR(s.median)}, Range: ${formatSAR(range.min)} - ${formatSAR(range.max)}`)
    }
  }

  console.log('\n🏛️  ENTITY CATEGORY STATISTICS')
  console.log('-'.repeat(50))
  for (const cat of result.entity_categories) {
    const s = cat.stats
    if (s.count > 2) {
      const range = getEstimationRange(s)
      console.log(`  ${cat.label} (n=${s.count}):`)
      console.log(`    Median: ${formatSAR(s.median)}, Range: ${formatSAR(range.min)} - ${formatSAR(range.max)}`)
    }
  }

  // Generate suggested config
  console.log('\n💡 SUGGESTED CONFIG UPDATES')
  console.log('-'.repeat(50))
  console.log('Add to config/scoring.config.json → value_estimation.booklet_tiers:')
  console.log()
  console.log('"booklet_tiers": [')
  for (const tier of result.booklet_tiers) {
    const s = tier.stats
    if (s.count > 0) {
      const range = getEstimationRange(s)
      const maxLabel = tier.max_booklet_sar === 999999 ? 999999 : tier.max_booklet_sar
      console.log(
        `  { "max_sar": ${maxLabel}, "min_estimate": ${range.min}, "max_estimate": ${range.max} },`
      )
    }
  }
  console.log(']')
}

async function main(): Promise<void> {
  console.log('🔧 Value Estimation Calibrator')
  console.log('Analyzing historical tender award data...\n')

  // Get input files
  let inputFiles = process.argv.slice(2)
  if (inputFiles.length === 0) {
    inputFiles = await findScraperOutputFiles()
    if (inputFiles.length === 0) {
      console.error('❌ No scraper output files found in', SCRAPER_OUTPUT_DIR)
      console.error('   Run the historical scraper first: pnpm scrape:run -- --historical')
      process.exit(1)
    }
    console.log(`Found ${inputFiles.length} files in ${SCRAPER_OUTPUT_DIR}/`)
  }

  // Load all tenders
  const allTenders: ScrapedTender[] = []
  for (const file of inputFiles) {
    const raw = await loadTendersFromFile(file)
    const tenders = raw.map((t) => normalizeTenderMoneyFields(t) as ScrapedTender)
    console.log(`  📄 ${file}: ${tenders.length} tenders`)
    allTenders.push(...tenders)
  }

  // Filter to tenders with award amounts
  const withAwards = allTenders.filter(
    (t) => t.award_amount_sar != null && t.award_amount_sar > 0
  )
  console.log(`\nTotal tenders loaded: ${allTenders.length}`)
  console.log(`Tenders with award amounts: ${withAwards.length}`)

  if (withAwards.length < 10) {
    console.warn('⚠️  Too few tenders with award data for reliable calibration.')
    console.warn('   Run the historical scraper to collect more data.')
  }

  // Run calibration
  const calibration = calibrateFromHistorical(allTenders)

  // Print report
  printCalibrationReport(calibration)

  // Save result
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE)
  await fs.writeFile(outputPath, JSON.stringify(calibration, null, 2), 'utf-8')
  console.log(`\n✅ Calibration data saved to: ${outputPath}`)
}

main().catch((error) => {
  console.error('❌ Calibration failed:', error)
  process.exit(1)
})
