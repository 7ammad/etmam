#!/usr/bin/env npx tsx
/**
 * Verify currency normalization: award_amount_sar and booklet_price in scraped JSON
 * are in halala (integer = 100 * decimal SAR). Normalization should yield SAR.
 *
 * Usage: pnpm exec tsx scripts/verify-currency-normalization.ts [scraper-output/run-*.json ...]
 *
 * Picks up to 3 awarded tenders where award_results has "قيمة الترسية" decimal string
 * and compares: integer / 100 should equal decimal value in SAR within rounding.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { toSar, normalizeTenderMoneyFields } from '../lib/currency'

const SCRAPER_OUTPUT_DIR = path.join(process.cwd(), 'scraper-output')

interface ScrapedTenderFromFile {
  reference_no?: string
  award_amount_sar?: number | null
  booklet_price?: number | null
  estimated_value?: number | null
  tab_sections?: {
    award_results?: Record<string, string>
    basic_info?: Record<string, string>
  }
}

async function loadTenders(filePath: string): Promise<ScrapedTenderFromFile[]> {
  const content = await fs.readFile(filePath, 'utf-8')
  const data = JSON.parse(content)
  const tenders = data.tenders ?? data
  return Array.isArray(tenders) ? tenders : []
}

function parseDecimalSar(s: string | undefined): number | null {
  if (!s || typeof s !== 'string') return null
  const cleaned = s.replace(/,/g, '').trim()
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? null : n
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const files =
    args.length > 0
      ? args
      : (await fs.readdir(SCRAPER_OUTPUT_DIR))
          .filter((f) => f.startsWith('run-') && f.endsWith('.json'))
          .map((f) => path.join(SCRAPER_OUTPUT_DIR, f))

  if (files.length === 0) {
    console.log('No JSON files found. Pass run-*.json paths or run from repo root.')
    process.exit(0)
  }

  const candidates: Array<{
    ref: string
    awardDecimal: number
    awardInteger: number
    bookletDecimal: number | null
    bookletInteger: number | null
    file: string
  }> = []

  for (const file of files) {
    const tenders = await loadTenders(file)
    for (const t of tenders) {
      const awardDecimalRaw =
        t.tab_sections?.award_results?.['قيمة الترسية'] ??
        t.tab_sections?.award_results?.['قيمة العرض المالي']
      const awardDecimal = parseDecimalSar(awardDecimalRaw)
      const awardInteger = t.award_amount_sar ?? 0
      const bookletDecimalRaw = t.tab_sections?.basic_info?.['قيمة وثائق المنافسة']
      const bookletDecimal = parseDecimalSar(bookletDecimalRaw)
      const bookletInteger = t.booklet_price ?? null

      if (
        awardDecimal != null &&
        awardInteger > 0 &&
        Math.abs(awardInteger / 100 - awardDecimal) < 1
      ) {
        candidates.push({
          ref: t.reference_no ?? '?',
          awardDecimal,
          awardInteger,
          bookletDecimal,
          bookletInteger,
          file,
        })
      }
    }
  }

  const toCheck = candidates.slice(0, 3)
  if (toCheck.length === 0) {
    console.log('No awarded tenders found with integer award_amount_sar ≈ 100 * decimal قيمة الترسية.')
    console.log('Try run-historical-*.json or a run-*.json that contains award_results.')
    process.exit(0)
  }

  console.log('Currency normalization verification (halala -> SAR)\n')
  let ok = true
  for (const c of toCheck) {
    const normalizedAward = toSar(c.awardInteger, 'award_amount_sar')
    const awardOk = Math.abs(normalizedAward - c.awardDecimal) < 1
    const normalizedBooklet =
      c.bookletInteger != null ? toSar(c.bookletInteger, 'booklet_price') : null
    const bookletOk =
      c.bookletDecimal == null ||
      normalizedBooklet == null ||
      Math.abs(normalizedBooklet - c.bookletDecimal) < 1

    if (!awardOk || !bookletOk) ok = false
    console.log(`  ${c.ref} (${c.file})`)
    console.log(
      `    award: raw ${c.awardInteger} -> SAR ${normalizedAward} (expected ~${c.awardDecimal}) ${awardOk ? '✓' : '✗'}`
    )
    if (c.bookletInteger != null && c.bookletDecimal != null) {
      console.log(
        `    booklet: raw ${c.bookletInteger} -> SAR ${normalizedBooklet} (expected ~${c.bookletDecimal}) ${bookletOk ? '✓' : '✗'}`
      )
    }
    console.log('')
  }

  console.log('normalizeTenderMoneyFields smoke test')
  const [first] = toCheck
  const fakeTender: ScrapedTenderFromFile = {
    reference_no: first.ref,
    award_amount_sar: first.awardInteger,
    booklet_price: first.bookletInteger ?? undefined,
    estimated_value: null,
  }
  const normalized = normalizeTenderMoneyFields(fakeTender)
  const sarAward = (normalized as { award_amount_sar?: number }).award_amount_sar
  const sarBooklet = (normalized as { booklet_price?: number }).booklet_price
  const smokeOk =
    sarAward != null &&
    Math.abs(sarAward - first.awardDecimal) < 1 &&
    (first.bookletDecimal == null || (sarBooklet != null && Math.abs(sarBooklet - first.bookletDecimal) < 1))
  console.log(`  normalized tender award_amount_sar=${sarAward}, booklet_price=${sarBooklet} ${smokeOk ? '✓' : '✗'}\n`)

  if (!ok || !smokeOk) {
    console.log('Some checks failed.')
    process.exit(1)
  }
  console.log('All normalization checks passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
