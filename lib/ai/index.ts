// AI module exports
export { getAIModel, getAIProvider, getModelName, isAIConfigured, generateOracleOutput } from './client'
export { buildEvaluationPrompt, EVALUATOR_SYSTEM_PROMPT, buildOraclePrompt, SYSTEM_PROMPT_ORACLE } from './prompts'
export { evaluateTender, type EvaluateResult, type EvaluationResult, type EvaluationError } from './evaluator'

// Oracle schemas (Phase 1)
export {
  oracleOutputSchema,
  oracleMetadataSchema,
  routingDecisionSchema,
  inferredScopeItemSchema,
  budgetCalculationMethodSchema,
  reasoningStageSchema,
  validateOracleOutput,
  createOracleMetadata,
  type OracleOutput,
  type OracleMetadata,
  type RoutingDecision,
  type InferredScopeItem,
  type BudgetCalculationMethod,
  type ReasoningStage,
} from './schemas'
