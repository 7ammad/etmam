'use server'

import { revalidatePath } from 'next/cache'
import { getTenderById, updateTender } from '@/lib/queries/tender'
import {
  upsertEvaluation,
  getPendingTenders,
} from '@/lib/queries/evaluation'
import {
  tenderRowToScraped,
  scoreTenderV2,
  loadScoringConfig,
} from '@/lib/evaluation'
import type { ScoringConfigWithEstimation } from '@/lib/evaluation/value-estimator'
import type { Json } from '@/types/database'
import { pushTenderToOdoo } from '@/lib/crm/push-odoo'
import { isOdooPushEnabledFromEnv } from '@/lib/crm/odoo-env'
import { createServiceClient } from '@/lib/supabase/server'
import { refreshCalibrationCache } from '@/lib/evaluation/calibration-service'

// Types for action responses
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Run evaluation for a single tender — V2 deterministic pipeline.
 * 1) Work type (Commodity vs Professional Services) and dual score (Infratech/Exotech).
 * 2) Value estimate (booklet/config), Direct Purchase Bonus (≤100k), 6-dimension scoring.
 * 3) Persist evaluation with infratech_score, exotech_score, work_type, value_method.
 */
export async function runEvaluationAction(
  tenderId: string
): Promise<ActionResponse<{ score: number; recommendation: string }>> {
  try {
    const tender = await getTenderById(tenderId)
    if (!tender) {
      return { success: false, error: 'Tender not found' }
    }

    await refreshCalibrationCache()

    await updateTender(tenderId, { status: 'evaluating' })

    const scraped = tenderRowToScraped(tender)
    const config = loadScoringConfig() as ScoringConfigWithEstimation | null
    const scored = scoreTenderV2(scraped, config ?? undefined)

    const summary = scored.reasons.slice(0, 3).join(' · ')
    const midpoint =
      scored.predicted_budget_min != null && scored.predicted_budget_max != null
        ? Math.round((scored.predicted_budget_min + scored.predicted_budget_max) / 2)
        : null

    const oracleMetadata: Record<string, unknown> = {
      estimated_value_sar: midpoint,
      ev_method: scored.budget_estimation_method ?? null,
      ev_confidence: scored.budget_estimation_confidence ?? null,
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
      breakdown: scored.breakdown as unknown as Json,
      model_used: 'v2-deterministic',
      predicted_budget_min: scored.predicted_budget_min,
      predicted_budget_max: scored.predicted_budget_max,
      oracle_metadata: oracleMetadata as Json,
      predicted_value_sar: midpoint,
      value_method: scored.budget_estimation_method ?? null,
      infratech_score: scored.infratech_score,
      exotech_score: scored.exotech_score,
      work_type: scored.work_type,
    })
    await updateTender(tenderId, { status: 'evaluated' })

    // Check if IT has enabled the CRM connection
    if (isOdooPushEnabledFromEnv()) {
      try {
        console.log('[Action] Auto-pushing to Odoo CRM...')

        // 1. Capture the result
        const result = await pushTenderToOdoo(tenderId)

        // 2. CHECK SUCCESS before updating status
        if (result.success) {
          const supabase = await createServiceClient()
          await supabase
            .from('tenders')
            .update({ status: 'pushed' })
            .eq('id', tenderId)

          console.log('[Action] Auto-push successful, status updated to PUSHED.')
        } else {
          // Log the failure reason so IT can debug, but don't crash the evaluation
          console.warn('[Action] Odoo rejected the push:', result.error)
        }
      } catch (error) {
        console.warn('[Action] Odoo auto-push crashed (Check API Credentials):', error)
        // We do NOT throw here, so the evaluation itself remains valid.
      }
    } else {
      console.log('[Action] CRM Push disabled. Set Odoo credentials in .env.local to activate.')
    }

    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath(`/[locale]/dashboard/${tenderId}`, 'page')

    return {
      success: true,
      data: {
        score: scored.score,
        recommendation: scored.recommendation,
      },
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
