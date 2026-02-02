/**
 * Currency normalization for Etimad tender data.
 *
 * KNOWN BUG (validated): Money integers in scraped JSON are in halala
 * (1 SAR = 100 halala). Example: award_amount_sar === 6054750 while
 * "قيمة الترسية" in tab_sections is "60547.50"; booklet_price === 20000
 * while "قيمة وثائق المنافسة" is "200.00". Using these integers as SAR
 * causes a 100x EV error.
 *
 * This module provides a single conversion at the boundary so the rest
 * of the app always works in SAR.
 */

/** Provenance: scraped integer money fields from Etimad JSON are halala; computed EV and decimal strings are SAR. */
export type MoneySource = 'award_amount_sar' | 'booklet_price' | 'estimated_value'

export type NormalizedSarResult = {
  /** Value in SAR (float) */
  sar: number
  /** Detected unit of the input */
  unit: 'sar' | 'halala' | 'unknown'
}

const HALALA_PER_SAR = 100

/**
 * Normalize a money value into SAR by provenance (no magnitude heuristic).
 *
 * - award_amount_sar, booklet_price: Known scraped integer money fields from
 *   Etimad JSON are halala (integer === 100 * decimal SAR string). Always /100.
 * - estimated_value: From scraper may be decimal string (SAR) or integer;
 *   we do not guess by magnitude. Treat as SAR (pass-through). If the scraper
 *   ever provides an explicit unit flag, use it here.
 *
 * @param value - Raw number
 * @param source - Field name (provenance) for conversion rule
 * @returns SAR amount and detected unit; sar is 0 when value is null/NaN/negative
 */
export function normalizeToSar(
  value: number | null | undefined,
  source: MoneySource
): NormalizedSarResult {
  if (value == null || typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return { sar: 0, unit: 'unknown' }
  }

  switch (source) {
    case 'award_amount_sar':
    case 'booklet_price':
      // Provenance: scraped integer money fields from Etimad are halala
      return {
        sar: value / HALALA_PER_SAR,
        unit: 'halala',
      }
    case 'estimated_value':
      // Provenance: estimated_value from scraper is decimal string (SAR) or we pass through; no magnitude heuristic
      return { sar: value, unit: 'sar' }
    default:
      return { sar: value, unit: 'unknown' }
  }
}

/**
 * Normalize and return only the SAR number (for call sites that don't need the unit).
 */
export function toSar(value: number | null | undefined, source: MoneySource): number {
  return normalizeToSar(value, source).sar
}

/** Shape with money fields we normalize when loading from scraper JSON */
export interface TenderMoneyFields {
  estimated_value?: number | null
  booklet_price?: number | null
  award_amount_sar?: number | null
}

/**
 * Normalize money fields on a tender (for use when loading from scraper JSON files).
 * Returns a new object with estimated_value, booklet_price, award_amount_sar in SAR.
 * Use when reading run-*.json or similar so calibration and estimators see SAR.
 */
export function normalizeTenderMoneyFields<T extends TenderMoneyFields>(tender: T): T {
  return {
    ...tender,
    // estimated_value: pass-through (SAR); no halala conversion by magnitude
    estimated_value: tender.estimated_value ?? null,
    booklet_price:
      tender.booklet_price != null ? toSar(tender.booklet_price, 'booklet_price') : null,
    award_amount_sar:
      tender.award_amount_sar != null ? toSar(tender.award_amount_sar, 'award_amount_sar') : null,
  }
}
