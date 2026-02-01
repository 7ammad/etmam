/**
 * Value Estimator Module
 *
 * Estimates missing `estimated_value` from available tender signals:
 * 1. Initial Guarantee (highest confidence) - divide by 5% to get total
 * 2. Booklet Price Heuristics (medium confidence) - tier-based estimation
 * 3. Title Keyword Analysis (lower confidence) - category-based multipliers
 * 4. Entity Type Multiplier (adjustment) - government entity size factor
 *
 * Config-driven via `config/scoring.config.json` → `value_estimation` section.
 */

import type { ScrapedTender } from '@/types/scraper'
import type { ScoringConfig } from './rules'

/** Value estimation result */
export interface ValueEstimate {
  min: number
  max: number
  midpoint: number
  method: 'initial_guarantee' | 'booklet_price' | 'title_inference' | 'fallback'
  confidence: number // 0-100
  reasoning: string
  reasoning_ar: string // Arabic reasoning for UI
}

/** Value estimation config section shape */
export interface ValueEstimationConfig {
  enabled: boolean
  initial_guarantee_pct: number
  /** Range spread for initial guarantee method (e.g., 0.1 = ±10%) */
  initial_guarantee_spread?: number
  booklet_tiers: Array<{
    max_sar: number
    min_estimate: number
    max_estimate: number
  }>
  title_keywords: Array<{
    pattern: string
    multiplier: number
    label: string
  }>
  entity_multipliers: Array<{
    pattern: string
    multiplier: number
    label: string
  }>
  fallback_estimate: {
    min: number
    max: number
  }
  confidence_levels: {
    initial_guarantee: number
    booklet_price: number
    title_inference: number
    fallback: number
  }
  /** Optional: path to historical calibration data for tighter estimates */
  historical_calibration_path?: string
}

/** Extended ScoringConfig with value_estimation */
export interface ScoringConfigWithEstimation extends ScoringConfig {
  value_estimation?: ValueEstimationConfig
}

/**
 * Default value estimation config (used if not in scoring.config.json)
 *
 * TIGHTENED RANGES based on historical analysis:
 * - Initial guarantee: ±10% instead of ±20% (high confidence method)
 * - Booklet tiers: max ~3x range instead of 20x (based on IT/Telecom historical data)
 * - Fallback: ~3x range instead of 10x
 */
const DEFAULT_VALUE_ESTIMATION: ValueEstimationConfig = {
  enabled: true,
  initial_guarantee_pct: 5,
  initial_guarantee_spread: 0.1, // ±10% range (tighter than previous ±20%)
  booklet_tiers: [
    // Tier 1: Low booklet price (≤500 SAR) - typically smaller projects
    { max_sar: 500, min_estimate: 200000, max_estimate: 800000 },
    // Tier 2: Medium booklet price (501-5000 SAR) - mid-size IT projects
    { max_sar: 5000, min_estimate: 1000000, max_estimate: 5000000 },
    // Tier 3: High booklet price (5001-50000 SAR) - large IT/telecom projects
    { max_sar: 50000, min_estimate: 5000000, max_estimate: 20000000 },
    // Tier 4: Very high booklet price (>50000 SAR) - major government contracts
    { max_sar: 999999, min_estimate: 20000000, max_estimate: 100000000 },
  ],
  title_keywords: [
    { pattern: 'صيانة|تشغيل|نظافة|تنظيف', multiplier: 0.6, label: 'maintenance' },
    { pattern: 'تطوير|برمجة|منصة|نظام|تطبيق', multiplier: 1.0, label: 'software' },
    { pattern: 'أمن سيبراني|حماية|اختراق|أمن معلومات', multiplier: 1.5, label: 'security' },
    { pattern: 'بناء|إنشاء|تأهيل|ترميم', multiplier: 1.2, label: 'construction' },
    { pattern: 'توريد|شراء|تجهيز', multiplier: 0.8, label: 'procurement' },
    { pattern: 'استشارات|دراسة|تقييم', multiplier: 0.7, label: 'consulting' },
    { pattern: 'تدريب|تأهيل|ورش', multiplier: 0.5, label: 'training' },
    { pattern: 'تجديد|اشتراك|رخص', multiplier: 0.8, label: 'renewal' },
  ],
  entity_multipliers: [
    { pattern: 'وزارة|الديوان', multiplier: 1.3, label: 'ministry' },
    { pattern: 'هيئة ملكية|هيئة', multiplier: 1.2, label: 'authority' },
    { pattern: 'أمانة', multiplier: 1.1, label: 'municipality' },
    { pattern: 'جامعة|كلية|تعليم', multiplier: 0.8, label: 'education' },
    { pattern: 'مستشفى|صحة|طبي', multiplier: 1.0, label: 'healthcare' },
  ],
  fallback_estimate: { min: 1000000, max: 3000000 }, // Tighter: 3x range
  confidence_levels: {
    initial_guarantee: 95, // Higher confidence with tighter range
    booklet_price: 75,
    title_inference: 55,
    fallback: 35,
  },
}

/**
 * Format SAR amount in Arabic
 */
function formatSARAr(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} مليون ر.س`
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)} ألف ر.س`
  }
  return `${amount} ر.س`
}

/**
 * Estimate tender value from available signals
 *
 * @param tender - The tender data (ScrapedTender shape)
 * @param config - Scoring config with optional value_estimation section
 * @returns ValueEstimate with min/max/midpoint and reasoning
 */
export function estimateValue(
  tender: ScrapedTender,
  config?: ScoringConfigWithEstimation
): ValueEstimate {
  const veConfig = config?.value_estimation ?? DEFAULT_VALUE_ESTIMATION

  // If estimation is disabled, return zero estimate
  if (!veConfig.enabled) {
    return {
      min: 0,
      max: 0,
      midpoint: 0,
      method: 'fallback',
      confidence: 0,
      reasoning: 'Value estimation disabled',
      reasoning_ar: 'تقدير القيمة معطل',
    }
  }

  // 1. Try Initial Guarantee Method (highest confidence)
  if (tender.initial_guarantee != null && tender.initial_guarantee > 0) {
    // initial_guarantee is X% of total, so total = guarantee / (X/100)
    const pct = veConfig.initial_guarantee_pct / 100
    const estimated = tender.initial_guarantee / pct
    // Use configurable spread (default ±10% for tighter estimates)
    const spread = veConfig.initial_guarantee_spread ?? 0.1
    const min = Math.round(estimated * (1 - spread))
    const max = Math.round(estimated * (1 + spread))
    const midpoint = Math.round(estimated)
    const spreadPct = Math.round(spread * 100)

    return {
      min,
      max,
      midpoint,
      method: 'initial_guarantee',
      confidence: veConfig.confidence_levels.initial_guarantee,
      reasoning: `Based on initial guarantee of ${tender.initial_guarantee.toLocaleString()} SAR (assumed ${veConfig.initial_guarantee_pct}% of total, ±${spreadPct}% range)`,
      reasoning_ar: `بناءً على الضمان الابتدائي ${tender.initial_guarantee.toLocaleString()} ر.س (${veConfig.initial_guarantee_pct}% من القيمة، نطاق ±${spreadPct}%)`,
    }
  }

  // 2. Try Booklet Price Heuristics (medium confidence)
  if (tender.booklet_price != null && tender.booklet_price > 0) {
    // Find the matching tier
    const tier = veConfig.booklet_tiers.find((t) => tender.booklet_price! <= t.max_sar)
    if (tier) {
      // Apply entity multiplier if matched
      const entityMultiplier = getEntityMultiplier(tender.entity, veConfig)
      // Apply title keyword multiplier if matched
      const titleMultiplier = getTitleMultiplier(tender.title, veConfig)
      const combinedMultiplier = entityMultiplier * titleMultiplier

      const min = Math.round(tier.min_estimate * combinedMultiplier)
      const max = Math.round(tier.max_estimate * combinedMultiplier)
      const midpoint = Math.round((min + max) / 2)

      return {
        min,
        max,
        midpoint,
        method: 'booklet_price',
        confidence: veConfig.confidence_levels.booklet_price,
        reasoning: `Based on booklet price of ${tender.booklet_price.toLocaleString()} SAR (tier: ${tier.min_estimate.toLocaleString()}-${tier.max_estimate.toLocaleString()} SAR, multiplier: ${combinedMultiplier.toFixed(2)}x)`,
        reasoning_ar: `بناءً على سعر الكراسة ${tender.booklet_price.toLocaleString()} ر.س (النطاق: ${formatSARAr(tier.min_estimate)} - ${formatSARAr(tier.max_estimate)})`,
      }
    }
  }

  // 3. Try Title Keyword Analysis (lower confidence)
  const titleMultiplier = getTitleMultiplier(tender.title, veConfig)
  const entityMultiplier = getEntityMultiplier(tender.entity, veConfig)

  if (titleMultiplier !== 1.0 || entityMultiplier !== 1.0) {
    // We have some signal from title or entity
    const baseMin = veConfig.fallback_estimate.min
    const baseMax = veConfig.fallback_estimate.max
    const combinedMultiplier = titleMultiplier * entityMultiplier

    const min = Math.round(baseMin * combinedMultiplier)
    const max = Math.round(baseMax * combinedMultiplier)
    const midpoint = Math.round((min + max) / 2)

    return {
      min,
      max,
      midpoint,
      method: 'title_inference',
      confidence: veConfig.confidence_levels.title_inference,
      reasoning: `Based on title/entity analysis (title multiplier: ${titleMultiplier}x, entity multiplier: ${entityMultiplier}x)`,
      reasoning_ar: `بناءً على تحليل العنوان والجهة (معامل ${combinedMultiplier.toFixed(1)}×)`,
    }
  }

  // 4. Fallback estimate
  const min = veConfig.fallback_estimate.min
  const max = veConfig.fallback_estimate.max
  const midpoint = Math.round((min + max) / 2)

  return {
    min,
    max,
    midpoint,
    method: 'fallback',
    confidence: veConfig.confidence_levels.fallback,
    reasoning: `Default estimate (no specific signals available)`,
    reasoning_ar: `تقدير افتراضي (لا تتوفر معلومات كافية)`,
  }
}

/**
 * Get title keyword multiplier
 */
function getTitleMultiplier(title: string, config: ValueEstimationConfig): number {
  for (const keyword of config.title_keywords) {
    const regex = new RegExp(keyword.pattern, 'i')
    if (regex.test(title)) {
      return keyword.multiplier
    }
  }
  return 1.0 // No match, neutral multiplier
}

/**
 * Get entity type multiplier
 */
function getEntityMultiplier(entity: string, config: ValueEstimationConfig): number {
  for (const entityRule of config.entity_multipliers) {
    const regex = new RegExp(entityRule.pattern, 'i')
    if (regex.test(entity)) {
      return entityRule.multiplier
    }
  }
  return 1.0 // No match, neutral multiplier
}

/**
 * Check if a tender needs value estimation
 */
export function needsValueEstimation(tender: ScrapedTender): boolean {
  return tender.estimated_value == null || tender.estimated_value <= 0
}
