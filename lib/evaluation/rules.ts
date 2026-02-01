/**
 * Rule-based tender scoring (Step 3A).
 * Pure function: reads config, scores 0–100, recommendation, short reasons.
 * Deterministic; no AI. Used by scripts/evaluate-tenders.ts.
 *
 * Value Estimation: When estimated_value is missing, uses initial_guarantee,
 * booklet_price, title keywords, and entity type to estimate the value.
 */

import type { ScrapedTender } from '@/types/scraper'
import type { Recommendation } from '@/types/evaluation'
import {
  estimateValue,
  needsValueEstimation,
  type ValueEstimate,
  type ScoringConfigWithEstimation,
} from './value-estimator'

/** Editable config shape (matches config/scoring.config.json). */
export interface ScoringConfig {
  version?: string
  thresholds: { qualified: number; conditional: number }
  weights: {
    budget_fit: number
    timeline_fit: number
    cost_of_entry: number
    scope_clarity: number
    risk_penalty: number
  }
  rules: {
    budget_fit: {
      has_value_score: number
      in_range_bonus: number
      min_value_sar: number
      max_value_sar: number
    }
    timeline_fit: {
      days_per_point: number
      max_days_cap: number
      min_score_if_past: number
    }
    cost_of_entry: {
      booklet_free_score: number
      booklet_max_penalty_sar: number
      guarantee_none_score: number
      guarantee_max_penalty_pct: number
    }
    scope_clarity: {
      title_weight: number
      description_weight: number
    }
    risk_penalty: {
      no_deadline_penalty: number
      no_entity_penalty: number
      no_reference_penalty: number
    }
  }
}

/** One scored tender for data/tenders.scored.json. */
export interface ScoredTender {
  reference_no: string
  title: string
  score: number
  recommendation: Recommendation
  reasons: string[]
  /** Predicted budget min (from value estimation, null if original value exists) */
  predicted_budget_min: number | null
  /** Predicted budget max (from value estimation, null if original value exists) */
  predicted_budget_max: number | null
  /** Method used for value estimation */
  budget_estimation_method: ValueEstimate['method'] | null
  /** Confidence level of estimation (0-100) */
  budget_estimation_confidence: number | null
}

function recommendationFromScore(
  score: number,
  thresholds: { qualified: number; conditional: number }
): Recommendation {
  if (score >= thresholds.qualified) return 'qualified'
  if (score >= thresholds.conditional) return 'conditional'
  return 'excluded'
}

const DEFAULT_CONFIG: ScoringConfig = {
  thresholds: { qualified: 70, conditional: 40 },
  weights: {
    budget_fit: 0.25,
    timeline_fit: 0.25,
    cost_of_entry: 0.2,
    scope_clarity: 0.15,
    risk_penalty: 0.15,
  },
  rules: {
    budget_fit: {
      has_value_score: 50,
      in_range_bonus: 50,
      min_value_sar: 10000,
      max_value_sar: 50000000,
    },
    timeline_fit: {
      days_per_point: 2,
      max_days_cap: 60,
      min_score_if_past: 0,
    },
    cost_of_entry: {
      booklet_free_score: 100,
      booklet_max_penalty_sar: 100000,
      guarantee_none_score: 100,
      guarantee_max_penalty_pct: 10,
    },
    scope_clarity: {
      title_weight: 0.4,
      description_weight: 0.6,
    },
    risk_penalty: {
      no_deadline_penalty: 100,
      no_entity_penalty: 30,
      no_reference_penalty: 50,
    },
  },
}

function daysUntilDeadline(deadline: string): number | null {
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

/**
 * Pure scoring function: one tender + config → score 0–100, recommendation, reasons.
 * When estimated_value is missing, uses value estimation from available signals.
 */
export function scoreTender(
  tender: ScrapedTender,
  config: ScoringConfigWithEstimation = DEFAULT_CONFIG
): ScoredTender {
  // Validate config weights sum to ~1.0
  const w = config.weights
  const weightsSum = w.budget_fit + w.timeline_fit + w.cost_of_entry + w.scope_clarity + w.risk_penalty
  if (Math.abs(weightsSum - 1.0) > 0.01) {
    throw new Error(`Scoring weights must sum to 1.0 (got ${weightsSum.toFixed(3)}). Check config.`)
  }

  // Validate threshold ordering
  const t = config.thresholds
  if (t.conditional > t.qualified) {
    throw new Error(`thresholds.conditional (${t.conditional}) must be <= qualified (${t.qualified})`)
  }

  const reasons: string[] = []
  const r = config.rules

  // Risk penalty (starts at 100, subtract for missing critical fields)
  let riskScore = 100
  if (!tender.deadline || tender.deadline.trim() === '') {
    riskScore -= r.risk_penalty.no_deadline_penalty
    reasons.push('Missing deadline')
  }
  if (!tender.entity || tender.entity.trim() === '') {
    riskScore -= r.risk_penalty.no_entity_penalty
    reasons.push('Missing entity')
  }
  if (!tender.reference_no || tender.reference_no.trim() === '') {
    riskScore -= r.risk_penalty.no_reference_penalty
    reasons.push('Missing reference_no')
  }
  riskScore = Math.max(0, riskScore)

  // Budget fit (0–100) - with value estimation for missing values
  let budgetScore = 0
  let valueEstimate: ValueEstimate | null = null
  let effectiveValue = tender.estimated_value

  // If no estimated_value, try to estimate from available signals
  if (needsValueEstimation(tender)) {
    valueEstimate = estimateValue(tender, config)
    effectiveValue = valueEstimate.midpoint
  }

  if (effectiveValue != null && effectiveValue > 0) {
    // Apply base score for having a value
    budgetScore = r.budget_fit.has_value_score

    // Apply confidence penalty for estimated values (reduce score proportionally)
    if (valueEstimate) {
      budgetScore = Math.round(budgetScore * (valueEstimate.confidence / 100))
    }

    // Check if value is in preferred range
    if (
      effectiveValue >= r.budget_fit.min_value_sar &&
      effectiveValue <= r.budget_fit.max_value_sar
    ) {
      let rangeBonus = r.budget_fit.in_range_bonus
      // Also apply confidence to range bonus for estimated values
      if (valueEstimate) {
        rangeBonus = Math.round(rangeBonus * (valueEstimate.confidence / 100))
      }
      budgetScore += rangeBonus

      if (valueEstimate) {
        const formatted = effectiveValue >= 1000000
          ? `${(effectiveValue / 1000000).toFixed(1)}M SAR`
          : `${Math.round(effectiveValue / 1000)}K SAR`
        reasons.push(`Estimated value ~${formatted} (${valueEstimate.method}, ${valueEstimate.confidence}% confidence)`)
      } else {
        reasons.push('Estimated value in range')
      }
    } else {
      if (valueEstimate) {
        reasons.push(`Estimated value out of range (${valueEstimate.method})`)
      } else {
        reasons.push('Estimated value out of preferred range')
      }
    }
  } else {
    reasons.push('No estimated value (estimation failed)')
  }
  budgetScore = Math.min(100, budgetScore)

  // Timeline fit (0–100): days until deadline
  let timelineScore = 0
  const days = daysUntilDeadline(tender.deadline)
  if (days !== null) {
    if (days < 0) {
      timelineScore = r.timeline_fit.min_score_if_past
      reasons.push('Deadline passed')
    } else {
      const capped = Math.min(days, r.timeline_fit.max_days_cap)
      timelineScore = Math.min(100, capped * r.timeline_fit.days_per_point)
      reasons.push(`${days} days until deadline`)
    }
  } else {
    reasons.push('Invalid or missing deadline')
  }

  // Cost of entry (0–100): booklet + guarantee
  let costScore = 100
  const booklet = tender.booklet_price ?? 0
  const guarantee = tender.initial_guarantee ?? 0
  if (booklet > 0) {
    const penalty = Math.min(100, (booklet / r.cost_of_entry.booklet_max_penalty_sar) * 100)
    costScore -= penalty
  }
  if (guarantee > 0) {
    // guarantee is a percentage (e.g., 10 = 10%); max penalty at guarantee_max_penalty_pct
    const penalty = Math.min(100, (guarantee / r.cost_of_entry.guarantee_max_penalty_pct) * 100)
    costScore -= penalty
  }
  if (booklet === 0 && guarantee === 0) reasons.push('Low cost of entry')
  costScore = Math.max(0, Math.min(100, costScore))

  // Scope clarity (0–100): title + description
  const hasTitle = Boolean(tender.title?.trim())
  const hasDesc = Boolean(tender.description?.trim())
  const scopeScore = Math.min(
    100,
    (hasTitle ? r.scope_clarity.title_weight * 100 : 0) +
    (hasDesc ? r.scope_clarity.description_weight * 100 : 0)
  )
  if (hasTitle && hasDesc) reasons.push('Title and description present')

  // Weighted total 0–100
  const total =
    budgetScore * w.budget_fit +
    timelineScore * w.timeline_fit +
    costScore * w.cost_of_entry +
    scopeScore * w.scope_clarity +
    riskScore * w.risk_penalty
  const score = Math.round(Math.max(0, Math.min(100, total)))
  const recommendation = recommendationFromScore(score, config.thresholds)

  return {
    reference_no: tender.reference_no,
    title: tender.title,
    score,
    recommendation,
    reasons,
    // Value estimation results (null if original value exists)
    predicted_budget_min: valueEstimate?.min ?? null,
    predicted_budget_max: valueEstimate?.max ?? null,
    budget_estimation_method: valueEstimate?.method ?? null,
    budget_estimation_confidence: valueEstimate?.confidence ?? null,
  }
}
