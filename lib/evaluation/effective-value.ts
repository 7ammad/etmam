/**
 * Single canonical Estimated Value (EV) pipeline in SAR — MVP deterministic only.
 *
 * Priority (implement exactly):
 * 1) award_amount_sar > 0 → EV = award_amount_sar (SAR)
 * 2) estimated_value > 0 → EV = estimated_value (SAR)
 * 3) EV estimated from historical awarded tenders by title similarity
 * 4) Fallback constant
 *
 * Range rules:
 * - Provided (award or etimad): predicted_budget_min = predicted_budget_max = evSar.
 * - Estimated (title similarity or fallback): use p25/p75 when available; clamp
 *   max <= 1.5*mid, min >= 0.5*mid; if sample < 8 tighten to 0.8*mid..1.2*mid.
 */

import type { Tables } from '@/types/database'
import { estimateEvFromTitleSimilarity } from './title-similarity-ev'

export type EffectiveValueSource = 'etimad' | 'award' | 'title_similarity' | 'fallback'

export interface EffectiveEstimatedValueResult {
  evSar: number
  source: EffectiveValueSource
  predictedMin: number | null
  predictedMax: number | null
  method?: string
  confidence?: number
  matched_examples_count?: number
}

const FALLBACK_MIDPOINT_SAR = 1_500_000
const FALLBACK_CONFIDENCE = 35

/** Clamp min/max around mid: max <= 1.5*mid, min >= 0.5*mid; always return min <= max */
function clampSpread(mid: number, min: number, max: number): { min: number; max: number } {
  const capMax = Math.round(Math.min(max, 1.5 * mid))
  const capMin = Math.round(Math.max(min, 0.5 * mid))
  const lo = Math.min(capMin, capMax)
  const hi = Math.max(capMin, capMax)
  return { min: lo, max: hi }
}

/** Small sample: tighten to 0.8*mid..1.2*mid */
function tightenSpread(mid: number): { min: number; max: number } {
  return {
    min: Math.round(0.8 * mid),
    max: Math.round(1.2 * mid),
  }
}

/**
 * Get the single canonical estimated value in SAR for a tender.
 * Deterministic: same tender always yields same EV.
 */
export function getEffectiveEstimatedValueSar(
  tender: Tables<'tenders'>
): EffectiveEstimatedValueResult {
  // 1) award_amount_sar > 0 → EV = award_amount_sar (SAR)
  if (tender.award_amount_sar != null && tender.award_amount_sar > 0) {
    const evSar = tender.award_amount_sar
    return {
      evSar,
      source: 'award',
      predictedMin: evSar,
      predictedMax: evSar,
    }
  }

  // 2) estimated_value > 0 → EV = estimated_value (SAR)
  if (tender.estimated_value != null && tender.estimated_value > 0) {
    const evSar = tender.estimated_value
    return {
      evSar,
      source: 'etimad',
      predictedMin: evSar,
      predictedMax: evSar,
    }
  }

  // 3) Title similarity from historical awarded tenders
  const similarity = estimateEvFromTitleSimilarity(tender.title ?? '')
  if (similarity) {
    const mid = similarity.evSar
    const smallSample = (similarity.matched_examples_count ?? 0) < 8
    let min: number
    let max: number
    if (smallSample) {
      const t = tightenSpread(mid)
      min = t.min
      max = t.max
    } else if (similarity.p25Sar != null && similarity.p75Sar != null && similarity.p25Sar > 0) {
      const { min: capMin, max: capMax } = clampSpread(mid, similarity.p25Sar, similarity.p75Sar)
      min = capMin
      max = capMax
    } else {
      const spread = mid * 0.3 / 2
      const { min: capMin, max: capMax } = clampSpread(mid, Math.max(0, mid - spread), mid + spread)
      min = capMin
      max = capMax
    }
    return {
      evSar: mid,
      source: 'title_similarity',
      predictedMin: min,
      predictedMax: max,
      method: similarity.method,
      confidence: similarity.confidence,
      matched_examples_count: similarity.matched_examples_count,
    }
  }

  // 4) Fallback constant — use tightened spread (no sample)
  const mid = FALLBACK_MIDPOINT_SAR
  const { min, max } = tightenSpread(mid)
  return {
    evSar: mid,
    source: 'fallback',
    predictedMin: min,
    predictedMax: max,
    method: 'fallback',
    confidence: FALLBACK_CONFIDENCE,
  }
}
