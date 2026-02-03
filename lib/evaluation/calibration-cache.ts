/**
 * In-memory cache for V2 calibration (service_type_calibration).
 * Populated by calibration-service from system_settings; classifier reads it
 * to avoid hitting DB on every evaluation.
 * Shape matches HistoricalCalibration (no import from classifier to avoid circular deps).
 */

export interface CachedCalibrationEntry {
  serviceType: string
  count: number
  median: number
  p25: number
  p75: number
  min: number
  max: number
}

let calibrationCache: CachedCalibrationEntry[] | null = null

export function getCachedCalibration(): CachedCalibrationEntry[] | null {
  return calibrationCache
}

export function setCachedCalibration(data: CachedCalibrationEntry[] | null): void {
  calibrationCache = data
}
