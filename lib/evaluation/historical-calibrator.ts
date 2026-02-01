/**
 * Historical Data Calibrator
 *
 * Analyzes historical tender awards to build statistical models for value estimation.
 * Uses actual award_amount_sar correlated with booklet_price and title keywords
 * to produce tighter, data-driven estimation ranges.
 *
 * MVP Requirement: "نموذج بسيط قابل للتعديل" - simple adjustable model with historical data support.
 */

import type { ScrapedTender } from '@/types/scraper'

/** Statistical bucket for a category */
export interface CalibrationBucket {
  count: number
  min: number
  max: number
  mean: number
  median: number
  stdDev: number
  p25: number // 25th percentile
  p75: number // 75th percentile
}

/** Calibration results from historical analysis */
export interface CalibrationResult {
  generated_at: string
  sample_size: number
  booklet_tiers: Array<{
    min_booklet_sar: number
    max_booklet_sar: number
    stats: CalibrationBucket
  }>
  title_categories: Array<{
    label: string
    pattern: string
    stats: CalibrationBucket
  }>
  entity_categories: Array<{
    label: string
    pattern: string
    stats: CalibrationBucket
  }>
  overall: CalibrationBucket
}

/**
 * Compute statistics for a list of values
 */
function computeStats(values: number[]): CalibrationBucket {
  if (values.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, median: 0, stdDev: 0, p25: 0, p75: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / n

  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)

  const percentile = (p: number) => {
    const idx = Math.floor((p / 100) * (n - 1))
    return sorted[idx]
  }

  return {
    count: n,
    min: sorted[0],
    max: sorted[n - 1],
    mean: Math.round(mean),
    median: sorted[Math.floor(n / 2)],
    stdDev: Math.round(stdDev),
    p25: percentile(25),
    p75: percentile(75),
  }
}

/** Booklet price tier boundaries (in SAR) */
const BOOKLET_TIER_BOUNDARIES = [
  { min: 0, max: 500, label: 'low' },
  { min: 501, max: 5000, label: 'medium' },
  { min: 5001, max: 50000, label: 'high' },
  { min: 50001, max: Infinity, label: 'very_high' },
]

/** Title keyword patterns for categorization */
const TITLE_PATTERNS = [
  { pattern: 'صيانة|تشغيل|نظافة|تنظيف', label: 'maintenance' },
  { pattern: 'تطوير|برمجة|منصة|نظام|تطبيق', label: 'software' },
  { pattern: 'أمن سيبراني|حماية|اختراق|أمن معلومات', label: 'security' },
  { pattern: 'بناء|إنشاء|تأهيل|ترميم', label: 'construction' },
  { pattern: 'توريد|شراء|تجهيز', label: 'procurement' },
  { pattern: 'استشارات|دراسة|تقييم', label: 'consulting' },
  { pattern: 'تدريب|تأهيل|ورش', label: 'training' },
]

/** Entity patterns for categorization */
const ENTITY_PATTERNS = [
  { pattern: 'وزارة|الديوان', label: 'ministry' },
  { pattern: 'هيئة', label: 'authority' },
  { pattern: 'أمانة', label: 'municipality' },
  { pattern: 'جامعة|كلية|تعليم', label: 'education' },
  { pattern: 'مستشفى|صحة|طبي', label: 'healthcare' },
]

/**
 * Calibrate value estimation using historical tender data
 *
 * @param tenders - Array of historical tenders with award_amount_sar
 * @returns Calibration result with statistical buckets
 */
export function calibrateFromHistorical(tenders: ScrapedTender[]): CalibrationResult {
  // Filter to tenders with valid award amounts
  const validTenders = tenders.filter(
    (t) => t.award_amount_sar != null && t.award_amount_sar > 0
  )

  // Overall statistics
  const allAwards = validTenders.map((t) => t.award_amount_sar!)
  const overall = computeStats(allAwards)

  // Booklet tier statistics
  const bookletTiers = BOOKLET_TIER_BOUNDARIES.map((tier) => {
    const inTier = validTenders.filter((t) => {
      const bp = t.booklet_price ?? 0
      return bp >= tier.min && bp <= tier.max
    })
    const awards = inTier.map((t) => t.award_amount_sar!)
    return {
      min_booklet_sar: tier.min,
      max_booklet_sar: tier.max === Infinity ? 999999 : tier.max,
      stats: computeStats(awards),
    }
  })

  // Title category statistics
  const titleCategories = TITLE_PATTERNS.map(({ pattern, label }) => {
    const regex = new RegExp(pattern, 'i')
    const matching = validTenders.filter((t) => regex.test(t.title))
    const awards = matching.map((t) => t.award_amount_sar!)
    return {
      label,
      pattern,
      stats: computeStats(awards),
    }
  })

  // Entity category statistics
  const entityCategories = ENTITY_PATTERNS.map(({ pattern, label }) => {
    const regex = new RegExp(pattern, 'i')
    const matching = validTenders.filter((t) => regex.test(t.entity))
    const awards = matching.map((t) => t.award_amount_sar!)
    return {
      label,
      pattern,
      stats: computeStats(awards),
    }
  })

  return {
    generated_at: new Date().toISOString(),
    sample_size: validTenders.length,
    booklet_tiers: bookletTiers,
    title_categories: titleCategories,
    entity_categories: entityCategories,
    overall,
  }
}

/**
 * Generate tighter estimation range from calibration stats
 *
 * Uses interquartile range (p25-p75) for tighter estimates
 * instead of min-max which can have extreme outliers.
 *
 * @param stats - Calibration bucket statistics
 * @param spreadFactor - How much to expand beyond IQR (default 0.5 = ±50% of IQR)
 * @returns { min, max } estimation range
 */
export function getEstimationRange(
  stats: CalibrationBucket,
  spreadFactor = 0.5
): { min: number; max: number } {
  if (stats.count === 0) {
    return { min: 0, max: 0 }
  }

  // Use IQR (interquartile range) for robust estimation
  const iqr = stats.p75 - stats.p25
  const spread = iqr * spreadFactor

  // Range is p25 - spread to p75 + spread, clamped to min/max observed
  const min = Math.max(stats.min, Math.round(stats.p25 - spread))
  const max = Math.min(stats.max, Math.round(stats.p75 + spread))

  return { min, max }
}

/**
 * Generate estimation range with confidence multiplier
 *
 * Tighter ranges = higher confidence
 * Wider ranges = lower confidence (more uncertainty)
 *
 * @param stats - Calibration bucket statistics
 * @param confidence - 0-100, higher = tighter range
 * @returns { min, max } estimation range
 */
export function getConfidenceBasedRange(
  stats: CalibrationBucket,
  confidence: number
): { min: number; max: number } {
  if (stats.count === 0) {
    return { min: 0, max: 0 }
  }

  // Higher confidence = smaller spread factor
  // confidence 90 → spread 0.2 (±20% of IQR)
  // confidence 70 → spread 0.5 (±50% of IQR)
  // confidence 50 → spread 0.8 (±80% of IQR)
  // confidence 30 → spread 1.2 (±120% of IQR)
  const spreadFactor = 1.4 - confidence / 100

  return getEstimationRange(stats, spreadFactor)
}

/**
 * Load and parse historical data from JSON files
 */
export async function loadHistoricalData(filePaths: string[]): Promise<ScrapedTender[]> {
  const fs = await import('fs/promises')
  const allTenders: ScrapedTender[] = []

  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(content)
      const tenders = data.tenders || data
      if (Array.isArray(tenders)) {
        allTenders.push(...tenders)
      }
    } catch (error) {
      console.warn(`Failed to load historical data from ${filePath}:`, error)
    }
  }

  return allTenders
}

/**
 * Save calibration result to JSON file
 */
export async function saveCalibration(
  calibration: CalibrationResult,
  outputPath: string
): Promise<void> {
  const fs = await import('fs/promises')
  await fs.writeFile(outputPath, JSON.stringify(calibration, null, 2), 'utf-8')
}
