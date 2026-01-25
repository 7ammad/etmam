import { generateText } from 'ai'
import { getAIModel, getModelName, isAIConfigured } from './client'
import { buildEvaluationPrompt, EVALUATOR_SYSTEM_PROMPT } from './prompts'
import { aiEvaluationResponseSchema, type AIEvaluationResponse } from '@/types/evaluation'
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

    return {
      success: true,
      data: {
        ...validated.data,
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
