/**
 * V2 engine calibration service.
 * Recalculates service_type_calibration from historic tenders (award_amount_sar)
 * and stores it in system_settings; classifier reads from cache/DB with fallback.
 */

import { createServiceClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/types/database'
import { tenderRowToScraped } from './db-adapter'
import { classifyTender } from './classifier'
import type { ServiceType } from './classifier'
import type { HistoricalCalibration } from './classifier'
import { setCachedCalibration } from './calibration-cache'

const CALIBRATION_KEY = 'calibration_v2'

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

export interface CalibrationPayload {
  service_type_calibration: HistoricalCalibration[]
  generated_at: string
  sample_size: number
  source: string
}

/**
 * Recalculate calibration from historic tenders (award_amount_sar) and upsert into system_settings.
 * Updates in-memory cache so the engine uses the new data immediately.
 */
export async function recalculateCalibration(): Promise<CalibrationPayload | null> {
  const supabase = createServiceClient()

  const { data: rows, error: fetchError } = await supabase
    .from('tenders')
    .select('*')
    .not('award_amount_sar', 'is', null)
    .gt('award_amount_sar', 0)

  if (fetchError) {
    console.error('[Calibration] Failed to fetch historical tenders:', fetchError.message)
    return null
  }

  const tenders = (rows ?? []) as Database['public']['Tables']['tenders']['Row'][]
  if (tenders.length === 0) {
    // No historic data; leave DB/cache as-is (fallback to built-in)
    return null
  }

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
  service_type_calibration.sort((a, b) => b.count - a.count)

  const payload: CalibrationPayload = {
    service_type_calibration,
    generated_at: new Date().toISOString(),
    sample_size: tenders.length,
    source: 'calibration-service',
  }

  const { error: upsertError } = await supabase
    .from('system_settings')
    .upsert(
      { key: CALIBRATION_KEY, value: payload as unknown as Json, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  if (upsertError) {
    console.error('[Calibration] Failed to upsert system_settings:', upsertError.message)
    return null
  }

  setCachedCalibration(service_type_calibration)
  return payload
}

/**
 * Load calibration from DB into in-memory cache.
 * Call at evaluation start so first request (or after restart) uses DB data.
 */
export async function refreshCalibrationCache(): Promise<void> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', CALIBRATION_KEY)
      .single()

    if (error || !data?.value) {
      setCachedCalibration(null)
      return
    }

    const payload = data.value as { service_type_calibration?: unknown[] }
    const arr = payload?.service_type_calibration
    if (!Array.isArray(arr) || arr.length === 0) {
      setCachedCalibration(null)
      return
    }

    const valid = arr.filter(
      (e): e is HistoricalCalibration =>
        e != null &&
        typeof e === 'object' &&
        typeof (e as HistoricalCalibration).serviceType === 'string' &&
        typeof (e as HistoricalCalibration).median === 'number' &&
        typeof (e as HistoricalCalibration).p25 === 'number' &&
        typeof (e as HistoricalCalibration).p75 === 'number'
    )
    setCachedCalibration(valid.length > 0 ? valid : null)
  } catch (err) {
    console.warn('[Calibration] refreshCalibrationCache failed:', err)
    setCachedCalibration(null)
  }
}
