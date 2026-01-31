/**
 * Oracle AI Schemas
 *
 * Zod schemas for the Oracle (3-Stage Reasoning Pipeline) output.
 * These schemas define the structure of AI-generated predictions and routing decisions.
 */

import { z } from 'zod'

/**
 * Routing decision enum
 * Matches the database enum: routing_decision
 */
export const routingDecisionSchema = z.enum([
  'INFRATECH',  // Route to Infratech pipeline
  'EXOTECH',    // Route to Exotech pipeline
  'JOINT',      // Route to joint venture pipeline
  'NO_BID',     // Do not bid
])

export type RoutingDecision = z.infer<typeof routingDecisionSchema>

/**
 * Inferred scope item
 * Individual scope element identified by the Oracle
 */
export const inferredScopeItemSchema = z.object({
  category: z.string().describe('Scope category (e.g., "Network Infrastructure", "Software Development")'),
  description: z.string().describe('Detailed description of the scope item'),
  confidence: z.number().min(0).max(100).describe('Confidence score (0-100) for this scope inference'),
})

export type InferredScopeItem = z.infer<typeof inferredScopeItemSchema>

/**
 * Budget calculation method
 * Indicates how the budget was calculated
 */
export const budgetCalculationMethodSchema = z.enum([
  'INITIAL_GUARANTEE',  // Calculated from initial guarantee percentage
  'ESTIMATED_VALUE',    // Used estimated_value from tender
  'INFERRED',           // Inferred from scope analysis
  'HYBRID',             // Combined multiple methods
])

export type BudgetCalculationMethod = z.infer<typeof budgetCalculationMethodSchema>

/**
 * Oracle reasoning stage
 * One of the 3 stages in the Chain-of-Thought pipeline
 */
export const reasoningStageSchema = z.object({
  stage: z.number().int().min(1).max(3).describe('Stage number (1, 2, or 3)'),
  reasoning: z.string().describe('Reasoning text for this stage'),
  conclusions: z.array(z.string()).describe('Key conclusions from this stage'),
})

export type ReasoningStage = z.infer<typeof reasoningStageSchema>

/**
 * Oracle Output Schema
 *
 * This is the complete output from the Oracle (3-Stage Reasoning Pipeline).
 * It includes:
 * - Inferred scope list
 * - 3-stage reasoning chain
 * - Predicted budget range
 * - Routing decision
 * - Confidence scores
 *
 * This schema matches the structure expected by the Architect Design.
 */
export const oracleOutputSchema = z.object({
  // Inferred scope (from Stage 1: Scope Analysis)
  inferred_scope: z.array(inferredScopeItemSchema).describe(
    'List of inferred scope items identified from tender description'
  ),

  // 3-Stage Reasoning Chain (from Stage 2: Multi-Stage Reasoning)
  reasoning_chain: z.array(reasoningStageSchema).length(3).describe(
    'Three-stage reasoning chain showing the Oracle\'s thought process'
  ),

  // Predicted Budget Range (from Stage 3: Budget Prediction)
  predicted_budget_min: z.number().int().positive().describe(
    'Minimum predicted budget in SAR'
  ),
  predicted_budget_max: z.number().int().positive().describe(
    'Maximum predicted budget in SAR'
  ),
  budget_calculation_method: budgetCalculationMethodSchema.describe(
    'Method used to calculate the budget (INITIAL_GUARANTEE, ESTIMATED_VALUE, INFERRED, HYBRID)'
  ),
  budget_confidence: z.number().min(0).max(100).describe(
    'Confidence score (0-100) for the budget prediction'
  ),

  // Routing Decision (from Stage 3: Routing Logic)
  routing_decision: routingDecisionSchema.describe(
    'Routing decision: INFRATECH, EXOTECH, JOINT, or NO_BID'
  ),
  routing_reasoning: z.string().describe(
    'Explanation for the routing decision'
  ),

  // Overall confidence
  overall_confidence: z.number().min(0).max(100).describe(
    'Overall confidence score (0-100) for the entire evaluation'
  ),

  // Additional metadata
  calculation_notes: z.string().optional().describe(
    'Additional notes about the calculation (e.g., "Used initial guarantee of 5%")'
  ),
})

export type OracleOutput = z.infer<typeof oracleOutputSchema>

/**
 * Oracle Metadata Schema
 *
 * This is what gets stored in the evaluations.oracle_metadata JSONB column.
 * It's the full OracleOutput plus any additional metadata.
 */
export const oracleMetadataSchema = oracleOutputSchema.extend({
  // Timestamp when Oracle evaluation was performed
  evaluated_at: z.string().datetime().describe('ISO timestamp of evaluation'),

  // Model used for this evaluation
  model_used: z.string().describe('AI model used (e.g., "deepseek-chat")'),

  // Version of the Oracle prompt/system
  oracle_version: z.string().optional().describe('Version of Oracle prompt/system used'),
})

export type OracleMetadata = z.infer<typeof oracleMetadataSchema>

/**
 * Helper function to validate Oracle output
 */
export function validateOracleOutput(data: unknown): {
  success: true
  data: OracleOutput
} | {
  success: false
  error: string
  errors: z.ZodError['errors']
} {
  const result = oracleOutputSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    error: 'Invalid Oracle output',
    errors: result.error.errors,
  }
}

/**
 * Helper function to create Oracle metadata from output
 */
export function createOracleMetadata(
  output: OracleOutput,
  modelUsed: string,
  oracleVersion?: string
): OracleMetadata {
  return {
    ...output,
    evaluated_at: new Date().toISOString(),
    model_used: modelUsed,
    oracle_version: oracleVersion,
  }
}
