/**
 * Single shared helper for EV display used by both list and detail.
 * When evaluation exists: use predicted_budget_min/max only.
 * If min == max: value and "Provided"; else midpoint and "Estimated".
 * When no evaluation: fallback to originalValue for display.
 */

export interface EffectiveValueDisplay {
  value: number | null
  isEstimated: boolean
}

/**
 * Compute display value and badge from evaluation's predicted_budget_min/max or fallback.
 * Do not use tender.estimated_value when evaluation exists — use predicted min/max only.
 */
export function getEffectiveValueDisplay(
  originalValue: number | null | undefined,
  predictedMin: number | null | undefined,
  predictedMax: number | null | undefined
): EffectiveValueDisplay {
  if (predictedMin != null && predictedMax != null) {
    const value = predictedMin === predictedMax ? predictedMin : Math.round((predictedMin + predictedMax) / 2)
    return { value, isEstimated: predictedMin !== predictedMax }
  }
  if (originalValue != null && originalValue > 0) {
    return { value: originalValue, isEstimated: false }
  }
  return { value: null, isEstimated: false }
}
