import { z } from 'zod'

// Recommendation type
export const recommendationSchema = z.enum(['qualified', 'conditional', 'excluded'])
export type Recommendation = z.infer<typeof recommendationSchema>

// Score breakdown schema
export const scoreBreakdownSchema = z.object({
  budget_fit: z.number().min(0).max(100),
  technical_fit: z.number().min(0).max(100),
  timeline_fit: z.number().min(0).max(100),
  strategic_fit: z.number().min(0).max(100),
  risk_score: z.number().min(0).max(100),
})

export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>

// Routing decision enum (matches database enum)
export const routingDecisionSchema = z.enum([
  'INFRATECH',
  'EXOTECH',
  'JOINT',
  'NO_BID',
])

export type RoutingDecision = z.infer<typeof routingDecisionSchema>

// Full evaluation schema
export const evaluationSchema = z.object({
  id: z.string().uuid().optional(),
  tender_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  recommendation: recommendationSchema,
  summary: z.string().min(1, 'Summary is required'),
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  missing_requirements: z.array(z.string()).default([]),
  action_items: z.array(z.string()).default([]),
  breakdown: scoreBreakdownSchema,
  model_used: z.string().default('deepseek-chat'),
  // Oracle fields (from Phase 1)
  oracle_metadata: z.record(z.unknown()).nullable().optional(),
  predicted_budget_min: z.number().int().positive().nullable().optional(),
  predicted_budget_max: z.number().int().positive().nullable().optional(),
  routing_decision: routingDecisionSchema.nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
})

export type Evaluation = z.infer<typeof evaluationSchema>

// AI response schema (what we expect from the AI)
export const aiEvaluationResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  recommendation: recommendationSchema,
  summary: z.string().describe('Arabic summary of the evaluation'),
  strengths: z.array(z.string()).describe('List of strengths in Arabic'),
  risks: z.array(z.string()).describe('List of risks in Arabic'),
  missing_requirements: z.array(z.string()).describe('Missing requirements in Arabic'),
  action_items: z.array(z.string()).describe('Recommended actions in Arabic'),
  breakdown: scoreBreakdownSchema,
})

export type AIEvaluationResponse = z.infer<typeof aiEvaluationResponseSchema>

// Create evaluation input (for server action)
export const createEvaluationSchema = evaluationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>

// Evaluation display data
export interface EvaluationDisplay {
  score: number
  recommendation: Recommendation
  recommendationLabel: string // Localized label
  summary: string
  strengths: string[]
  risks: string[]
  missingRequirements: string[]
  actionItems: string[]
  breakdown: ScoreBreakdown
  modelUsed: string
  // Oracle fields
  oracleMetadata?: Record<string, unknown> | null
  predictedBudgetMin?: number | null
  predictedBudgetMax?: number | null
  routingDecision?: RoutingDecision | null
  createdAt: Date
}

// Recommendation thresholds
export const SCORE_THRESHOLDS = {
  qualified: 70,    // >= 70 = qualified
  conditional: 40,  // 40-69 = conditional
  excluded: 0,      // < 40 = excluded
} as const

// Get recommendation from score
export function getRecommendationFromScore(score: number): Recommendation {
  if (score >= SCORE_THRESHOLDS.qualified) return 'qualified'
  if (score >= SCORE_THRESHOLDS.conditional) return 'conditional'
  return 'excluded'
}

// Recommendation colors for UI
export const RECOMMENDATION_COLORS = {
  qualified: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  conditional: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  excluded: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
} as const
