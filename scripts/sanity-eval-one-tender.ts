#!/usr/bin/env npx tsx
/**
 * Sanity check: run EV pipeline on one known awarded tender from run-historical JSON.
 * Prints: title, EV (SAR), matched count, nearest 3 examples with award amounts.
 *
 * Usage: pnpm exec tsx scripts/sanity-eval-one-tender.ts [path-to-run-historical.json]
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { toSar } from '../lib/currency'
import { getEffectiveEstimatedValueSar } from '../lib/evaluation'
import { estimateEvFromTitleSimilarity } from '../lib/evaluation/title-similarity-ev'
import type { Tables } from '../types/database'

const DEFAULT_PATH = path.join(
  process.cwd(),
  'scraper-output',
  'run-historical-2026-02-01T12-22-15-075Z.json'
)

interface ScrapedTenderFromFile {
  reference_no?: string
  title?: string
  entity?: string
  deadline?: string
  estimated_value?: number | null
  award_amount_sar?: number | null
  booklet_price?: number | null
}

/** Build a minimal tender row for EV pipeline. award_amount_sar in SAR (normalized from halala in file). */
function minimalTenderRow(one: ScrapedTenderFromFile): Tables<'tenders'> {
  const awardSar =
    one.award_amount_sar != null ? toSar(one.award_amount_sar, 'award_amount_sar') : null
  return {
    id: 'sanity-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'sanity',
    reference_no: one.reference_no ?? '',
    title: one.title ?? '',
    entity: one.entity ?? '',
    deadline: one.deadline ?? '',
    estimated_value: null,
    description: null,
    source: 'etimad',
    status: 'pending',
    booklet_price_sar: null,
    initial_guarantee_sar: null,
    award_amount_sar: awardSar,
    award_date: null,
    winning_bidder: null,
    raw_data: null,
  } as Tables<'tenders'>
}

async function main(): Promise<void> {
  const filePath = process.argv[2] ?? DEFAULT_PATH
  let raw: string
  try {
    raw = await fs.readFile(filePath, 'utf-8')
  } catch {
    console.error('File not found:', filePath)
    process.exit(1)
  }

  const data = JSON.parse(raw) as { tenders?: ScrapedTenderFromFile[] }
  const tenders = Array.isArray(data.tenders) ? data.tenders : []
  const awarded = tenders.filter(
    (t) => t.award_amount_sar != null && t.award_amount_sar > 0 && (t.title?.trim() ?? '')
  )
  if (awarded.length === 0) {
    console.error('No awarded tenders with title and award_amount_sar in', filePath)
    process.exit(1)
  }

  const one = awarded[0]
  const tenderRow = minimalTenderRow(one)
  const effectiveEv = getEffectiveEstimatedValueSar(tenderRow)
  const similarityResult = estimateEvFromTitleSimilarity(one.title ?? '')

  const expectedSar = one.award_amount_sar != null ? toSar(one.award_amount_sar, 'award_amount_sar') : null

  console.log('--- Sanity: one awarded tender EV ---\n')
  console.log('Title:', one.title ?? '—')
  console.log('Reference:', one.reference_no ?? '—')
  console.log('Expected award (SAR, from normalized file):', expectedSar ?? '—')
  console.log('')
  console.log('Pipeline EV (getEffectiveEstimatedValueSar):', effectiveEv.evSar, 'SAR')
  console.log('  source:', effectiveEv.source)
  console.log('  method:', effectiveEv.method ?? '—')
  console.log('  confidence:', effectiveEv.confidence ?? '—')
  console.log('  matched_examples_count:', effectiveEv.matched_examples_count ?? '—')
  console.log('')

  if (similarityResult?.matched_examples?.length) {
    console.log('Nearest 3 examples (title similarity):')
    similarityResult.matched_examples.slice(0, 3).forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.title?.slice(0, 60) ?? '—'}… | award_amount_sar: ${ex.award_amount_sar} SAR`)
    })
  } else {
    console.log('Nearest 3 examples: (none from title similarity)')
  }

  if (expectedSar != null && effectiveEv.evSar > 0) {
    const diff = Math.abs(effectiveEv.evSar - expectedSar)
    const ok = diff < 1 || (expectedSar > 0 && diff / expectedSar < 0.01)
    console.log('')
    console.log(ok ? 'OK: EV matches expected award (within 1 SAR or 1%).' : 'Check: EV differs from expected award.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
