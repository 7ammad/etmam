import { generateText } from 'ai'
import { getAIModel, getModelName, isAIConfigured } from './client'
import { buildEvaluationPrompt, EVALUATOR_SYSTEM_PROMPT, BREAKDOWN_WEIGHTS } from './prompts'
import { aiEvaluationResponseSchema, getRecommendationFromScore, type AIEvaluationResponse } from '@/types/evaluation'
import type { Tables } from '@/types/database'

type Tender = Tables<'tenders'>

export interface EvaluationResult {
  success: true
  data: AIEvaluationResponse & { model_used: string }
}

export interface EvaluationError {
  success: false
  error: string
}

export type EvaluateResult = EvaluationResult | EvaluationError

// Evaluate a single tender using AI
export async function evaluateTender(tender: Tender): Promise<EvaluateResult> {
  // Check if AI is configured
  if (!isAIConfigured()) {
    return {
      success: false,
      error: 'AI provider not configured. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY.',
    }
  }

  try {
    const model = getAIModel()
    const prompt = buildEvaluationPrompt(tender)

    const { text } = await generateText({
      model,
      system: EVALUATOR_SYSTEM_PROMPT,
      prompt,
      temperature: 0.3, // Lower temperature for more consistent evaluations
      maxTokens: 1500,
    })

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        success: false,
        error: 'AI response is not valid JSON',
      }
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate against schema
    const validated = aiEvaluationResponseSchema.safeParse(parsed)
    if (!validated.success) {
      console.error('Validation errors:', validated.error.errors)
      return {
        success: false,
        error: `Invalid AI response: ${validated.error.errors.map(e => e.message).join(', ')}`,
      }
    }

    // Enforce score = weighted average of breakdown (logic must be consistent)
    const b = validated.data.breakdown
    const weightedScore =
      b.budget_fit * BREAKDOWN_WEIGHTS.budget_fit +
      b.technical_fit * BREAKDOWN_WEIGHTS.technical_fit +
      b.timeline_fit * BREAKDOWN_WEIGHTS.timeline_fit +
      b.strategic_fit * BREAKDOWN_WEIGHTS.strategic_fit +
      b.risk_score * BREAKDOWN_WEIGHTS.risk_score
    const computedScore = Math.round(Math.max(0, Math.min(100, weightedScore)))
    const score = computedScore
    const recommendation = getRecommendationFromScore(score)

    return {
      success: true,
      data: {
        ...validated.data,
        score,
        recommendation,
        model_used: getModelName(),
      },
    }
  } catch (error) {
    console.error('AI evaluation error:', error)

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'Failed to parse AI response as JSON',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI evaluation failed',
    }
  }
}
