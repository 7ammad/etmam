/**
 * Regenerate service_type_calibration from historic tenders in the DB.
 * Writes data/calibration-result.json with service_type_calibration so the V2
 * value estimator uses DB-sourced historic data (under the hood).
 *
 * Usage: pnpm calibrate:from-db
 *
 * Requires:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - Historic tenders in DB (rows with award_amount_sar set). Load them with pnpm load:historic.
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { tenderRowToScraped } from '../lib/evaluation/db-adapter'
import { classifyTender } from '../lib/evaluation/classifier'
import type { ServiceType } from '../lib/evaluation/classifier'
import type { HistoricalCalibration } from '../lib/evaluation/classifier'

function loadEnvFile(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return
    const content = fs.readFileSync(filePath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex <= 0) continue
      const key = trimmed.slice(0, eqIndex)
      let value = trimmed.slice(eqIndex + 1)
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // ignore
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function computeStats(values: number[]): { count: number; median: number; p25: number; p75: number; min: number; max: number } {
  if (values.length === 0) {
    return { count: 0, median: 0, p25: 0, p75: 0, min: 0, max: 0 }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const p = (pct: number) => sorted[Math.min(Math.floor((pct / 100) * n), n - 1)]
  return {
    count: n,
    median: p(50),
    p25: p(25),
    p75: p(75),
    min: sorted[0],
    max: sorted[n - 1],
  }
}

async function main(): Promise<void> {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (e.g. in .env.local).')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data: rows, error } = await supabase
    .from('tenders')
    .select('*')
    .not('award_amount_sar', 'is', null)
    .gt('award_amount_sar', 0)

  if (error) {
    console.error('Failed to fetch historical tenders:', error.message)
    process.exit(1)
  }

  const tenders = (rows ?? []) as Database['public']['Tables']['tenders']['Row'][]
  if (tenders.length === 0) {
    console.warn('No historic tenders (award_amount_sar set) in DB. Load them first with: pnpm load:historic')
    process.exit(1)
  }

  // Map to ScrapedTender and classify
  const byServiceType = new Map<ServiceType, number[]>()
  for (const row of tenders) {
    const scraped = { ...tenderRowToScraped(row), award_amount_sar: row.award_amount_sar ?? null }
    if (scraped.award_amount_sar == null || scraped.award_amount_sar <= 0) continue
    const classification = classifyTender(scraped)
    const list = byServiceType.get(classification.serviceType) ?? []
    list.push(scraped.award_amount_sar)
    byServiceType.set(classification.serviceType, list)
  }

  const service_type_calibration: HistoricalCalibration[] = []
  for (const [serviceType, values] of byServiceType.entries()) {
    const s = computeStats(values)
    service_type_calibration.push({
      serviceType,
      count: s.count,
      median: s.median,
      p25: s.p25,
      p75: s.p75,
      min: s.min,
      max: s.max,
    })
  }

  // Sort by count descending so "other" and small buckets can be last
  service_type_calibration.sort((a, b) => b.count - a.count)

  const output = {
    generated_at: new Date().toISOString(),
    sample_size: tenders.length,
    source: 'calibrate-from-db',
    service_type_calibration,
  }

  const outDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const outPath = path.join(outDir, 'calibration-result.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`Wrote ${service_type_calibration.length} service-type buckets (${tenders.length} tenders) to ${outPath}`)
  console.log('V2 value estimator will use this file for historical calibration.')
}

main()
