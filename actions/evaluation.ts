'use server'

import { revalidatePath } from 'next/cache'
import { evaluateTender } from '@/lib/ai'
import { getTenderById, updateTender } from '@/lib/queries/tender'
import { upsertEvaluation, getPendingTenders } from '@/lib/queries/evaluation'
import { loadScoringConfig, scoreTender, tenderRowToScraped } from '@/lib/evaluation'
import type { Json } from '@/types/database'

// Types for action responses
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Run evaluation for a single tender.
 * Primary: config-driven rule-based engine (config/scoring.config.json) — simple, adjustable, no hallucination.
 * Fallback: AI evaluator when config is not available.
 * Oracle (runOracleEvaluation) is not used; per requirement: "نموذج بسيط قابل للتعديل".
 */
export async function runEvaluationAction(
  tenderId: string
): Promise<ActionResponse<{ score: number; recommendation: string }>> {
  try {
    const tender = await getTenderById(tenderId)
    if (!tender) {
      return { success: false, error: 'Tender not found' }
    }

    await updateTender(tenderId, { status: 'evaluating' })

    const config = loadScoringConfig()
    if (config) {
      // Rule-based: deterministic, config-driven, no AI
      // Includes value estimation when estimated_value is missing
      const scraped = tenderRowToScraped(tender)
      const scored = scoreTender(scraped, config)

      // Build oracle_metadata with estimation details if value was estimated
      const oracleMetadata: Record<string, unknown> | null = scored.budget_estimation_method
        ? {
            budget_estimation_method: scored.budget_estimation_method,
            budget_estimation_confidence: scored.budget_estimation_confidence,
          }
        : null

      await upsertEvaluation({
        tender_id: tenderId,
        score: scored.score,
        recommendation: scored.recommendation,
        summary: scored.reasons.length ? scored.reasons.join('. ') : 'Rule-based evaluation.',
        strengths: null,
        risks: scored.reasons.length ? scored.reasons : null,
        missing_requirements: null,
        action_items: null,
        breakdown: {} as Json,
        model_used: 'rule-based',
        // Value estimation results
        predicted_budget_min: scored.predicted_budget_min,
        predicted_budget_max: scored.predicted_budget_max,
        oracle_metadata: oracleMetadata as Json,
      })
      await updateTender(tenderId, { status: 'evaluated' })
      revalidatePath('/[locale]/dashboard', 'page')
      revalidatePath(`/[locale]/dashboard/${tenderId}`, 'page')
      return {
        success: true,
        data: { score: scored.score, recommendation: scored.recommendation },
      }
    }

    // Fallback: AI evaluation when config not available
    const result = await evaluateTender(tender)
    if (!result.success) {
      await updateTender(tenderId, { status: 'pending' })
      return { success: false, error: result.error }
    }

    await upsertEvaluation({
      tender_id: tenderId,
      score: result.data.score,
      recommendation: result.data.recommendation,
      summary: result.data.summary,
      strengths: result.data.strengths,
      risks: result.data.risks,
      missing_requirements: result.data.missing_requirements,
      action_items: result.data.action_items,
      breakdown: result.data.breakdown as unknown as Json,
      model_used: result.data.model_used,
    })

    await updateTender(tenderId, { status: 'evaluated' })
    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath(`/[locale]/dashboard/${tenderId}`, 'page')

    return {
      success: true,
      data: {
        score: result.data.score,
        recommendation: result.data.recommendation,
      },
    }
  } catch (error) {
    console.error('Evaluation action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run evaluation',
    }
  }
}

// Evaluate all pending tenders
export async function evaluateAllPendingAction(): Promise<
  ActionResponse<{ evaluated: number; failed: number; errors: string[] }>
> {
  try {
    const pendingTenders = await getPendingTenders()

    if (pendingTenders.length === 0) {
      return {
        success: true,
        data: { evaluated: 0, failed: 0, errors: [] },
      }
    }

    let evaluated = 0
    let failed = 0
    const errors: string[] = []

    for (const tender of pendingTenders) {
      const result = await runEvaluationAction(tender.id)

      if (result.success) {
        evaluated++
      } else {
        failed++
        errors.push(`${tender.reference_no}: ${result.error}`)
      }
    }

    // Revalidate dashboard
    revalidatePath('/[locale]/dashboard', 'page')

    return {
      success: true,
      data: { evaluated, failed, errors },
    }
  } catch (error) {
    console.error('Batch evaluation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate tenders',
    }
  }
}

// Re-run evaluation for a tender (force re-evaluate)
export async function rerunEvaluationAction(
  tenderId: string
): Promise<ActionResponse<{ score: number; recommendation: string }>> {
  try {
    // Reset status to pending first
    await updateTender(tenderId, { status: 'pending' })

    // Run evaluation
    return await runEvaluationAction(tenderId)
  } catch (error) {
    console.error('Re-evaluation action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to re-run evaluation',
    }
  }
}
