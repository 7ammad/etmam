'use server'

import { revalidatePath } from 'next/cache'
import { getTenderById, updateTender } from '@/lib/queries/tender'
import {
  upsertEvaluation,
  getPendingTenders,
} from '@/lib/queries/evaluation'
import {
  tenderRowToScraped,
  getEffectiveEstimatedValueSar,
  scoreTenderMVP,
} from '@/lib/evaluation'
import type { Json } from '@/types/database'

// Types for action responses
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Run evaluation for a single tender — ONE deterministic pipeline.
 * 1) Compute EV deterministically (award → etimad → title similarity → fallback).
 * 2) Compute factor scores deterministically (5 factors, fixed weights).
 * 3) Persist evaluation record with estimated_value_sar in oracle_metadata.
 * No AI branch; no config branch. Same tender always yields same EV and score.
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

    const effectiveEv = getEffectiveEstimatedValueSar(tender)
    const scraped = tenderRowToScraped(tender)
    const scored = scoreTenderMVP(scraped, effectiveEv.evSar)

    const summary = scored.top_reasons.join(' · ')
    const dbBreakdown = {
      budget_fit: scored.breakdown.value_fit,
      technical_fit: scored.breakdown.scope_fit,
      timeline_fit: scored.breakdown.time_fit,
      strategic_fit: scored.breakdown.clarity,
      risk_score: scored.breakdown.risk_score,
    }

    const oracleMetadata: Record<string, unknown> = {
      estimated_value_sar: effectiveEv.evSar,
      ev_method: effectiveEv.source,
      ev_confidence: effectiveEv.confidence ?? null,
      matched_examples_count: effectiveEv.matched_examples_count ?? null,
    }

    await upsertEvaluation({
      tender_id: tenderId,
      score: scored.score,
      recommendation: scored.recommendation,
      summary,
      strengths: null,
      risks: null,
      missing_requirements: null,
      action_items: null,
      breakdown: dbBreakdown as unknown as Json,
      model_used: 'mvp-deterministic',
      predicted_budget_min: effectiveEv.predictedMin,
      predicted_budget_max: effectiveEv.predictedMax,
      oracle_metadata: oracleMetadata as Json,
    })
    await updateTender(tenderId, { status: 'evaluated' })
    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath(`/[locale]/dashboard/${tenderId}`, 'page')

    return {
      success: true,
      data: { score: scored.score, recommendation: scored.recommendation },
    }
  } catch (error) {
    console.error('Evaluation action error:', error)
    try {
      await updateTender(tenderId, { status: 'pending' })
    } catch (_) {
      // ignore rollback failure so we still return the evaluation error
    }
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
    await updateTender(tenderId, { status: 'pending' })
    return await runEvaluationAction(tenderId)
  } catch (error) {
    console.error('Re-evaluation action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to re-run evaluation',
    }
  }
}
