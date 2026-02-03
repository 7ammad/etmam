/**
 * Push a tender to Odoo using env credentials.
 * Used after evaluation (runEvaluationAction) when ODOO_PUSH_ENABLED=true.
 * Maps evaluation fields: predicted_value_sar → expected_revenue,
 * description = "Infratech Score: X | Exotech Score: Y | Recommendation: Z".
 */

import { getTenderById } from '@/lib/queries/tender'
import { getOdooConfigFromEnv } from '@/lib/crm/odoo-env'
import { getCRMProvider } from '@/lib/crm/factory'
import type { OpportunityData } from '@/types/crm'

export type PushTenderToOdooResult =
  | { success: true; externalId?: string }
  | { success: false; error: string }

/**
 * Build opportunity data from tender + evaluation for Odoo lead.
 * Uses predicted_value_sar for expected_revenue; description includes Infratech/Exotech/Recommendation.
 */
function buildOpportunityData(tender: Awaited<ReturnType<typeof getTenderById>>): OpportunityData | null {
  if (!tender) return null
  const ev = tender.evaluation as Record<string, unknown> | null | undefined
  const infratech = ev?.infratech_score != null ? Number(ev.infratech_score) : null
  const exotech = ev?.exotech_score != null ? Number(ev.exotech_score) : null
  const recommendation = (ev?.recommendation as string) ?? null

  let expectedRevenue: number | null = null
  if (ev?.predicted_value_sar != null) {
    expectedRevenue = Number(ev.predicted_value_sar)
  } else if (ev?.predicted_budget_min != null && ev?.predicted_budget_max != null) {
    const pmin = Number(ev.predicted_budget_min)
    const pmax = Number(ev.predicted_budget_max)
    expectedRevenue = pmin === pmax ? pmin : Math.round((pmin + pmax) / 2)
  } else if (tender.estimated_value != null) {
    expectedRevenue = tender.estimated_value
  }

  const descriptionParts: string[] = [
    `Infratech Score: ${infratech ?? '—'} | Exotech Score: ${exotech ?? '—'} | Recommendation: ${recommendation ?? '—'}`,
  ]
  if (ev?.summary != null && String(ev.summary).trim() !== '') {
    descriptionParts.unshift(String(ev.summary).trim())
  }
  const summary = descriptionParts.join('\n')

  return {
    tender_id: tender.id,
    entity: tender.entity ?? '',
    title: tender.title ?? '',
    reference_no: tender.reference_no ?? '',
    deadline: new Date(tender.deadline ?? Date.now()),
    estimated_value: expectedRevenue,
    score: ev?.score != null ? Number(ev.score) : null,
    recommendation: recommendation ?? undefined,
    summary: summary || undefined,
  }
}

/**
 * Push tender to Odoo using env config (ODOO_BASE_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD).
 * Call only when ODOO_PUSH_ENABLED is true.
 */
export async function pushTenderToOdoo(tenderId: string): Promise<PushTenderToOdooResult> {
  const config = getOdooConfigFromEnv()
  if (!config) {
    return { success: false, error: 'Odoo not configured (ODOO_BASE_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD)' }
  }

  const tender = await getTenderById(tenderId)
  const opportunityData = buildOpportunityData(tender)
  if (!opportunityData) {
    return { success: false, error: 'Tender not found' }
  }

  const provider = getCRMProvider('odoo')
  if (!provider) {
    return { success: false, error: 'Odoo provider not available' }
  }

  const result = await provider.createOpportunity(config, opportunityData)
  if (result.success) {
    return { success: true, externalId: result.externalId }
  }
  return { success: false, error: result.error ?? 'Failed to create Odoo lead' }
}
