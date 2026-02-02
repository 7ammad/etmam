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
import { getMVPRecommendationFromScore, type MVPRecommendation } from '@/types/evaluation'
import {
  estimateValue,
  estimateValueV2,
  needsValueEstimation,
  type ValueEstimate,
  type ValueEstimateV2,
  type ScoringConfigWithEstimation,
} from './value-estimator'
import {
  classifyTender,
  calculateCompanyFit,
  type TenderClassification,
} from './classifier'

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
  /** V2 weights for 6-dimension scoring */
  weights_v2?: {
    service_fit: number    // Does tender match company capabilities?
    budget_fit: number     // Is value in target range?
    timeline_fit: number   // Enough prep time?
    complexity_fit: number // Right complexity for team?
    strategic_fit: number  // Entity relationship + geography
    risk_score: number     // Missing fields, short timeline
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
  /** Score breakdown (0-100 for each dimension) */
  breakdown: {
    budget_fit: number
    technical_fit: number
    timeline_fit: number
    strategic_fit: number
    risk_score: number
  }
  /** Predicted budget min (from value estimation, null if original value exists) */
  predicted_budget_min: number | null
  /** Predicted budget max (from value estimation, null if original value exists) */
  predicted_budget_max: number | null
  /** Method used for value estimation */
  budget_estimation_method: ValueEstimate['method'] | null
  /** Confidence level of estimation (0-100) */
  budget_estimation_confidence: number | null
}

/** V2 Scored tender with 6-dimension breakdown */
export interface ScoredTenderV2 extends Omit<ScoredTender, 'breakdown' | 'budget_estimation_method'> {
  /** V2 Score breakdown (0-100 for each dimension) */
  breakdown: {
    service_fit: number    // Company capability match
    budget_fit: number     // Value in target range
    timeline_fit: number   // Prep time adequacy
    complexity_fit: number // Complexity match for team
    strategic_fit: number  // Entity + geography fit
    risk_score: number     // Risk assessment
  }
  /** Tender classification details */
  classification: TenderClassification
  /** Method used for value estimation (V2 methods) */
  budget_estimation_method: ValueEstimateV2['method'] | null
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
  weights_v2: {
    service_fit: 0.25,    // Does tender match company capabilities?
    budget_fit: 0.20,     // Is value in target range?
    timeline_fit: 0.20,   // Enough prep time?
    complexity_fit: 0.15, // Right complexity for team?
    strategic_fit: 0.10,  // Entity relationship + geography
    risk_score: 0.10,     // Missing fields, short timeline
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
    // Score breakdown mapped to standard schema
    breakdown: {
      budget_fit: Math.round(budgetScore),
      technical_fit: Math.round(scopeScore), // scope clarity = technical requirements clarity
      timeline_fit: Math.round(timelineScore),
      strategic_fit: Math.round(costScore), // cost of entry = strategic barrier
      risk_score: Math.round(riskScore),
    },
    // Value estimation results (null if original value exists)
    predicted_budget_min: valueEstimate?.min ?? null,
    predicted_budget_max: valueEstimate?.max ?? null,
    budget_estimation_method: valueEstimate?.method ?? null,
    budget_estimation_confidence: valueEstimate?.confidence ?? null,
  }
}

// ============================================================================
// V2 SCORING: 6-DIMENSION WITH SERVICE FIT + HISTORICAL CALIBRATION
// ============================================================================

const DEFAULT_WEIGHTS_V2 = {
  service_fit: 0.25,    // Does tender match company capabilities?
  budget_fit: 0.20,     // Is value in target range?
  timeline_fit: 0.20,   // Enough prep time?
  complexity_fit: 0.15, // Right complexity for team?
  strategic_fit: 0.10,  // Entity relationship + geography
  risk_score: 0.10,     // Missing fields, short timeline
}

/**
 * V2 Scoring: 6-dimension scoring with service fit + historical calibration
 *
 * Dimensions:
 * 1. SERVICE_FIT (25%) - Does tender match company capabilities?
 * 2. BUDGET_FIT (20%) - Is estimated value in your target range?
 * 3. TIMELINE_FIT (20%) - Enough prep time?
 * 4. COMPLEXITY_FIT (15%) - Right complexity for your team?
 * 5. STRATEGIC_FIT (10%) - Entity relationship + geography
 * 6. RISK_SCORE (10%) - Missing fields, short timeline
 */
export function scoreTenderV2(
  tender: ScrapedTender,
  config: ScoringConfigWithEstimation = DEFAULT_CONFIG
): ScoredTenderV2 {
  const w = config.weights_v2 ?? DEFAULT_WEIGHTS_V2

  // Validate weights sum to ~1.0
  const weightsSum = w.service_fit + w.budget_fit + w.timeline_fit +
                     w.complexity_fit + w.strategic_fit + w.risk_score
  if (Math.abs(weightsSum - 1.0) > 0.01) {
    throw new Error(`V2 weights must sum to 1.0 (got ${weightsSum.toFixed(3)})`)
  }

  const reasons: string[] = []
  const r = config.rules

  // Get tender classification and V2 value estimate
  const classification = classifyTender(tender)
  const valueEstimate = needsValueEstimation(tender)
    ? estimateValueV2(tender, config)
    : null
  const effectiveValue = valueEstimate?.midpoint ?? tender.estimated_value ?? 0

  // -------------------------------------------------------------------------
  // 1. SERVICE FIT (0-100): Does tender match company capabilities?
  // -------------------------------------------------------------------------
  const companyFit = calculateCompanyFit(tender.title, tender.description)
  const serviceFitScore = companyFit.score

  if (companyFit.category === 'core') {
    reasons.push(`Core service match: ${classification.serviceTypeLabel}`)
  } else if (companyFit.category === 'adjacent') {
    reasons.push(`Adjacent service: ${classification.serviceTypeLabel}`)
  } else if (companyFit.category === 'avoid') {
    reasons.push(`Outside expertise: ${classification.serviceTypeLabel}`)
  }

  // -------------------------------------------------------------------------
  // 2. BUDGET FIT (0-100): Is value in target range?
  // -------------------------------------------------------------------------
  let budgetScore = 0
  if (effectiveValue > 0) {
    // Base score for having a value
    budgetScore = 50

    // Apply confidence penalty for estimated values
    if (valueEstimate) {
      budgetScore = Math.round(budgetScore * (valueEstimate.confidence / 100))
    }

    // Check if value is in preferred range
    if (effectiveValue >= r.budget_fit.min_value_sar &&
        effectiveValue <= r.budget_fit.max_value_sar) {
      let rangeBonus = 50
      if (valueEstimate) {
        rangeBonus = Math.round(rangeBonus * (valueEstimate.confidence / 100))
      }
      budgetScore += rangeBonus

      const formatted = effectiveValue >= 1000000
        ? `${(effectiveValue / 1000000).toFixed(1)}M SAR`
        : `${Math.round(effectiveValue / 1000)}K SAR`

      if (valueEstimate) {
        reasons.push(`Est. value ~${formatted} (${valueEstimate.method}, ${valueEstimate.confidence}% conf)`)
      } else {
        reasons.push(`Value ${formatted} in range`)
      }
    } else {
      reasons.push(`Value out of target range`)
    }
  } else {
    reasons.push('No value estimate available')
  }
  budgetScore = Math.min(100, Math.max(0, budgetScore))

  // -------------------------------------------------------------------------
  // 3. TIMELINE FIT (0-100): Enough prep time?
  // -------------------------------------------------------------------------
  let timelineScore = 0
  const days = daysUntilDeadline(tender.deadline)
  if (days !== null) {
    if (days < 0) {
      timelineScore = 0
      reasons.push('Deadline passed')
    } else if (days < 7) {
      timelineScore = 20
      reasons.push(`Only ${days} days - very tight`)
    } else if (days < 14) {
      timelineScore = 50
      reasons.push(`${days} days - tight timeline`)
    } else if (days < 30) {
      timelineScore = 75
      reasons.push(`${days} days - adequate time`)
    } else {
      timelineScore = 100
      reasons.push(`${days} days - good prep time`)
    }
  } else {
    timelineScore = 30 // Unknown deadline is risky
    reasons.push('Deadline unknown')
  }

  // -------------------------------------------------------------------------
  // 4. COMPLEXITY FIT (0-100): Right complexity for team?
  // -------------------------------------------------------------------------
  // Assuming team can handle medium-high complexity best
  let complexityScore = 50
  const complexityLevel = classification.complexity
  const complexityValue = classification.complexityScore

  if (complexityLevel === 'low') {
    complexityScore = 70 // Easy but maybe not interesting
  } else if (complexityLevel === 'medium') {
    complexityScore = 100 // Sweet spot
  } else if (complexityLevel === 'high') {
    complexityScore = 80 // Challenging but doable
  } else if (complexityLevel === 'very_high') {
    complexityScore = 50 // May be too complex
    reasons.push('High complexity project')
  }

  // -------------------------------------------------------------------------
  // 5. STRATEGIC FIT (0-100): Entity relationship + geography
  // -------------------------------------------------------------------------
  let strategicScore = 50 // Base neutral score

  // Entity category adjustments
  const entityCategory = classification.entityCategory
  if (entityCategory === 'authority' || entityCategory === 'royal_authority') {
    strategicScore = 80 // High-value relationships
    reasons.push(`Strategic entity: ${classification.entityCategoryLabel}`)
  } else if (entityCategory === 'ministry') {
    strategicScore = 70 // Good steady clients
  } else if (entityCategory === 'municipality') {
    strategicScore = 60 // Regional presence
  } else if (entityCategory === 'healthcare' || entityCategory === 'education') {
    strategicScore = 55 // Sector expertise building
  }

  // -------------------------------------------------------------------------
  // 6. RISK SCORE (0-100): Missing fields, short timeline, red flags
  // -------------------------------------------------------------------------
  let riskScore = 100

  // Missing critical fields
  if (!tender.deadline || tender.deadline.trim() === '') {
    riskScore -= 40
    reasons.push('Missing deadline (high risk)')
  }
  if (!tender.entity || tender.entity.trim() === '') {
    riskScore -= 20
    reasons.push('Missing entity')
  }
  if (!tender.reference_no || tender.reference_no.trim() === '') {
    riskScore -= 30
    reasons.push('Missing reference number')
  }

  // Value estimation uncertainty
  if (valueEstimate && valueEstimate.confidence < 60) {
    riskScore -= 15
    reasons.push('Low confidence in value estimate')
  }

  // Very short timeline is risky
  if (days !== null && days < 7 && days >= 0) {
    riskScore -= 20
  }

  riskScore = Math.max(0, riskScore)

  // -------------------------------------------------------------------------
  // WEIGHTED TOTAL
  // -------------------------------------------------------------------------
  const total =
    serviceFitScore * w.service_fit +
    budgetScore * w.budget_fit +
    timelineScore * w.timeline_fit +
    complexityScore * w.complexity_fit +
    strategicScore * w.strategic_fit +
    riskScore * w.risk_score

  const score = Math.round(Math.max(0, Math.min(100, total)))
  const recommendation = recommendationFromScore(score, config.thresholds)

  return {
    reference_no: tender.reference_no,
    title: tender.title,
    score,
    recommendation,
    reasons,
    breakdown: {
      service_fit: Math.round(serviceFitScore),
      budget_fit: Math.round(budgetScore),
      timeline_fit: Math.round(timelineScore),
      complexity_fit: Math.round(complexityScore),
      strategic_fit: Math.round(strategicScore),
      risk_score: Math.round(riskScore),
    },
    classification,
    predicted_budget_min: valueEstimate?.min ?? null,
    predicted_budget_max: valueEstimate?.max ?? null,
    budget_estimation_method: valueEstimate?.method ?? null,
    budget_estimation_confidence: valueEstimate?.confidence ?? null,
  }
}

// ============================================================================
// MVP: SINGLE DETERMINISTIC PIPELINE — 5 FACTORS, FIXED WEIGHTS
// ============================================================================

/** MVP weights: Value Fit 40, Scope Fit 25, Time Fit 15, Clarity 10, Risk 10 */
const MVP_WEIGHTS = {
  value_fit: 0.4,
  scope_fit: 0.25,
  time_fit: 0.15,
  clarity: 0.1,
  risk_score: 0.1,
} as const

/** MVP score result: score, recommendation (INVEST/REVIEW/SKIP), top_reasons (3), breakdown */
export interface ScoredTenderMVP {
  score: number
  recommendation: MVPRecommendation
  top_reasons: [string, string, string]
  breakdown: {
    value_fit: number
    scope_fit: number
    time_fit: number
    clarity: number
    risk_score: number
  }
}

const MVP_VALUE_MIN_SAR = 10_000
const MVP_VALUE_MAX_SAR = 50_000_000

/**
 * MVP scoring: one deterministic path, 5 factors, fixed weights.
 * Recommendation: INVEST (>=70), REVIEW (40–69), SKIP (<40). Persist and display exactly.
 */
export function scoreTenderMVP(
  tender: ScrapedTender,
  effectiveEvSar: number
): ScoredTenderMVP {
  const days = daysUntilDeadline(tender.deadline)

  // 1. Value Fit (0–100): has EV, in range
  let valueFit = 0
  if (effectiveEvSar > 0) {
    valueFit = 50
    if (effectiveEvSar >= MVP_VALUE_MIN_SAR && effectiveEvSar <= MVP_VALUE_MAX_SAR) {
      valueFit += 50
    }
  }
  valueFit = Math.min(100, valueFit)

  // 2. Scope Fit (0–100): company fit from title/description
  const companyFit = calculateCompanyFit(tender.title, tender.description)
  const scopeFit = Math.min(100, Math.max(0, companyFit.score))

  // 3. Time Fit (0–100): days until deadline
  let timeFit = 0
  if (days !== null) {
    if (days < 0) timeFit = 0
    else if (days < 7) timeFit = 25
    else if (days < 14) timeFit = 50
    else if (days < 30) timeFit = 75
    else timeFit = 100
  } else {
    timeFit = 30
  }

  // 4. Clarity (0–100): title + description present
  const hasTitle = Boolean(tender.title?.trim())
  const hasDesc = Boolean(tender.description?.trim())
  const clarity = (hasTitle ? 50 : 0) + (hasDesc ? 50 : 0)

  // 5. Risk (0–100): missing fields, short timeline
  let riskScore = 100
  if (!tender.deadline?.trim()) riskScore -= 40
  if (!tender.entity?.trim()) riskScore -= 20
  if (!tender.reference_no?.trim()) riskScore -= 30
  if (days !== null && days >= 0 && days < 7) riskScore -= 20
  riskScore = Math.max(0, riskScore)

  const total =
    valueFit * MVP_WEIGHTS.value_fit +
    scopeFit * MVP_WEIGHTS.scope_fit +
    timeFit * MVP_WEIGHTS.time_fit +
    clarity * MVP_WEIGHTS.clarity +
    riskScore * MVP_WEIGHTS.risk_score
  const score = Math.round(Math.max(0, Math.min(100, total)))
  const recommendation = getMVPRecommendationFromScore(score)

  const reasonsAll: string[] = []
  if (valueFit >= 70) reasonsAll.push('Value in target range')
  else if (effectiveEvSar > 0) reasonsAll.push('Value outside preferred range')
  if (scopeFit >= 70) reasonsAll.push('Scope matches capabilities')
  else if (scopeFit < 50) reasonsAll.push('Scope may not match')
  if (timeFit >= 70) reasonsAll.push('Adequate timeline')
  else if (days !== null && days >= 0) reasonsAll.push(`Only ${days} days until deadline`)
  if (clarity >= 80) reasonsAll.push('Clear title and description')
  if (riskScore < 70) reasonsAll.push('Missing data or tight deadline')
  const top_reasons: [string, string, string] = [
    reasonsAll[0] ?? 'Evaluated against MVP factors',
    reasonsAll[1] ?? (score >= 70 ? 'Meets threshold for INVEST' : score >= 40 ? 'Meets threshold for REVIEW' : 'Below threshold'),
    reasonsAll[2] ?? `Score ${score}/100`,
  ]

  return {
    score,
    recommendation,
    top_reasons,
    breakdown: {
      value_fit: Math.round(valueFit),
      scope_fit: Math.round(scopeFit),
      time_fit: Math.round(timeFit),
      clarity: Math.round(clarity),
      risk_score: Math.round(riskScore),
    },
  }
}
