import { generateText } from 'ai'
import { getAIModel, getModelName, isAIConfigured } from './client'
import {
  buildEvaluationPrompt,
  EVALUATOR_SYSTEM_PROMPT,
  BREAKDOWN_WEIGHTS,
  type BuildEvaluationPromptOptions,
} from './prompts'
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

const MAX_ARABIC_RETRIES = 2

/** Check if text is predominantly Arabic (e.g. at least ~30% Arabic Unicode chars). */
function isArabicText(text: string): boolean {
  if (!text || text.length === 0) return true
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length
  return arabicChars / text.length >= 0.3
}

/** Validate that all user-facing evaluation text fields are Arabic. */
function validateArabicOutput(data: AIEvaluationResponse): boolean {
  const texts: string[] = [
    data.summary,
    ...(data.strengths || []),
    ...(data.risks || []),
    ...(data.missing_requirements || []),
    ...(data.action_items || []),
  ].filter(Boolean) as string[]
  return texts.every((t) => isArabicText(t))
}

/** Options for evaluateTender: pass canonical EV so AI never invents or modifies it */
export interface EvaluateTenderOptions {
  effectiveValueSar?: number | null
}

// Evaluate a single tender using AI
export async function evaluateTender(
  tender: Tender,
  options?: EvaluateTenderOptions
): Promise<EvaluateResult> {
  // Check if AI is configured
  if (!isAIConfigured()) {
    return {
      success: false,
      error: 'AI provider not configured. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY.',
    }
  }

  const promptOptions: BuildEvaluationPromptOptions | undefined =
    options?.effectiveValueSar != null
      ? { effectiveValueSar: options.effectiveValueSar }
      : undefined
  const model = getAIModel()
  const prompt = buildEvaluationPrompt(tender, promptOptions)
  let lastError: string | null = null

  for (let attempt = 0; attempt <= MAX_ARABIC_RETRIES; attempt++) {
    try {
      const { text } = await generateText({
        model,
        system: EVALUATOR_SYSTEM_PROMPT,
        prompt,
        temperature: attempt === 0 ? 0.3 : 0.2,
        maxTokens: 1500,
      })

      // Parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        lastError = 'AI response is not valid JSON'
        continue
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate against schema
      const validated = aiEvaluationResponseSchema.safeParse(parsed)
      if (!validated.success) {
        lastError = `Invalid AI response: ${validated.error.errors.map((e) => e.message).join(', ')}`
        continue
      }

      // Require Arabic for user-facing text
      if (!validateArabicOutput(validated.data)) {
        lastError = 'AI response contained non-Arabic text; retrying.'
        if (attempt < MAX_ARABIC_RETRIES) continue
        return {
          success: false,
          error: 'Evaluation output was not in Arabic after retries. Please try again.',
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
        lastError = 'Failed to parse AI response as JSON'
      } else {
        lastError = error instanceof Error ? error.message : 'AI evaluation failed'
      }
      if (attempt === MAX_ARABIC_RETRIES) {
        return {
          success: false,
          error: lastError ?? 'AI evaluation failed',
        }
      }
    }
  }

  return {
    success: false,
    error: lastError ?? 'AI evaluation failed',
  }
}
