'use server'

import { revalidatePath } from 'next/cache'
import { generateOracleOutput } from '@/lib/ai/client'
import { buildOraclePrompt, SYSTEM_PROMPT_ORACLE } from '@/lib/ai/prompts'
import { validateOracleOutput, createOracleMetadata, getModelName, isAIConfigured } from '@/lib/ai'
import { getTenderById } from '@/lib/queries/tender'
import { getEvaluationByTenderId, upsertEvaluation } from '@/lib/queries/evaluation'
import type { ActionResponse } from '@/actions/evaluation'
import type { OracleOutput } from '@/lib/ai/schemas'
import type { Json } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

/**
 * Run Oracle evaluation for a tender
 * 
 * This function performs a 3-stage Chain-of-Thought AI analysis:
 * 1. Scope Analysis
 * 2. Multi-Stage Reasoning
 * 3. Budget Prediction & Routing
 * 
 * Results are cached in the evaluations table to avoid duplicate API calls.
 */
export async function runOracleEvaluation(
  tenderId: string
): Promise<ActionResponse<OracleOutput>> {
  const startTime = Date.now()
  
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return {
        success: false,
        error: 'AI provider not configured. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY.',
      }
    }

    // 1. Fetch tender
    const tenderWithEvaluation = await getTenderById(tenderId)
    if (!tenderWithEvaluation) {
      return { success: false, error: 'Tender not found' }
    }

    const tender = tenderWithEvaluation

    // 2. Check cache - if evaluation exists with oracle_metadata, return cached result
    const existingEvaluation = await getEvaluationByTenderId(tenderId)
    if (existingEvaluation?.oracle_metadata) {
      // Parse cached Oracle output
      const cachedOutput = existingEvaluation.oracle_metadata as unknown as OracleOutput
      const validation = validateOracleOutput(cachedOutput)
      
      if (validation.success) {
        console.log(`[Oracle] Using cached evaluation for tender ${tenderId}`)
        return {
          success: true,
          data: validation.data,
        }
      } else {
        console.warn(`[Oracle] Cached evaluation invalid, regenerating for tender ${tenderId}`)
        // Continue to regenerate if cached data is invalid
      }
    }

    // 3. Call AI SDK
    console.log(`[Oracle] Generating evaluation for tender ${tenderId}`)
    const prompt = buildOraclePrompt(tender)
    
    let oracleOutput: OracleOutput
    try {
      oracleOutput = await generateOracleOutput(prompt, SYSTEM_PROMPT_ORACLE)
    } catch (error) {
      console.error('[Oracle] AI SDK error:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          return {
            success: false,
            error: 'AI API rate limit exceeded. Please try again later.',
          }
        }
        if (error.message.includes('network') || error.message.includes('timeout')) {
          return {
            success: false,
            error: 'AI API network error. Please check your connection and try again.',
          }
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI evaluation failed',
      }
    }

    // 4. Process output - validate and create metadata
    const validation = validateOracleOutput(oracleOutput)
    if (!validation.success) {
      console.error('[Oracle] Validation failed:', validation.errors)
      return {
        success: false,
        error: `Invalid Oracle output: ${validation.errors.map(e => e.message).join(', ')}`,
      }
    }

    const validatedOutput = validation.data
    const modelUsed = getModelName()
    const oracleMetadata = createOracleMetadata(validatedOutput, modelUsed)

    // 5. Upsert to database
    // Check if evaluation already exists (for old evaluation system)
    const evaluationExists = existingEvaluation !== null

    if (evaluationExists) {
      // Update existing evaluation with Oracle fields
      await upsertEvaluation({
        tender_id: tenderId,
        score: existingEvaluation.score, // Keep existing score
        recommendation: existingEvaluation.recommendation, // Keep existing recommendation
        summary: existingEvaluation.summary, // Keep existing summary
        strengths: existingEvaluation.strengths,
        risks: existingEvaluation.risks,
        missing_requirements: existingEvaluation.missing_requirements,
        action_items: existingEvaluation.action_items,
        breakdown: existingEvaluation.breakdown,
        model_used: modelUsed,
        // Oracle fields
        oracle_metadata: oracleMetadata as unknown as Json,
        predicted_budget_min: validatedOutput.predicted_budget_min,
        predicted_budget_max: validatedOutput.predicted_budget_max,
        routing_decision: validatedOutput.routing_decision,
      })
    } else {
      // Create new evaluation with Oracle fields only
      // Note: Oracle evaluation doesn't require score/recommendation, but database schema requires them
      // We'll use placeholder values
      await upsertEvaluation({
        tender_id: tenderId,
        score: 0, // Placeholder - Oracle doesn't use score
        recommendation: 'conditional', // Placeholder - Oracle uses routing_decision instead
        summary: `Oracle evaluation: ${validatedOutput.routing_decision}`,
        strengths: [],
        risks: [],
        missing_requirements: [],
        action_items: [],
        breakdown: {} as Json,
        model_used: modelUsed,
        // Oracle fields
        oracle_metadata: oracleMetadata as unknown as Json,
        predicted_budget_min: validatedOutput.predicted_budget_min,
        predicted_budget_max: validatedOutput.predicted_budget_max,
        routing_decision: validatedOutput.routing_decision,
      })
    }

    // 6. Revalidate Next.js paths
    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath(`/[locale]/dashboard/tenders/${tenderId}`, 'page')

    const duration = Date.now() - startTime
    console.log(`[Oracle] Successfully evaluated tender ${tenderId} in ${duration}ms - routing: ${validatedOutput.routing_decision}, budget: ${validatedOutput.predicted_budget_min?.toLocaleString()}-${validatedOutput.predicted_budget_max?.toLocaleString()} SAR`)

    return {
      success: true,
      data: validatedOutput,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Oracle] Unexpected error after ${duration}ms:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run Oracle evaluation',
    }
  }
}
