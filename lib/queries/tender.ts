import { createClient } from '@/lib/supabase/server'
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/types/database'

export type Tender = Tables<'tenders'>
export type TenderInsert = TablesInsert<'tenders'>
export type TenderUpdate = TablesUpdate<'tenders'>

// Diagnostic function to test database connectivity (uses RLS-scoped client)
async function testDatabaseConnection(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { count, error: countError } = await supabase
    .from('tenders')
    .select('*', { count: 'exact', head: true })

  return { count, error: countError }
}

export type TenderWithEvaluation = Tender & {
  evaluation: Tables<'evaluations'> | null
}

/** Push status for opportunity list: ready (not pushed), pushed (success), failed (last attempt failed). */
export type OpportunityPushStatus = 'ready' | 'pushed' | 'failed'

export type TenderWithEvaluationAndPushStatus = TenderWithEvaluation & {
  pushStatus: OpportunityPushStatus
}

/**
 * Get active tenders for dashboard (excludes historical/awarded tenders).
 *
 * Historical tenders (with award_amount_sar populated) are used for calibration only,
 * not displayed as actionable items in the dashboard.
 */
export async function getTenders(): Promise<TenderWithEvaluation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tenders')
    .select(`
      *,
      evaluations (*)
    `)
    .is('award_amount_sar', null) // Exclude historical/awarded tenders
    .is('deleted_at', null) // Exclude soft-deleted tenders
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tenders:', error)
    throw new Error('Failed to fetch tenders')
  }

  type Row = Tender & { evaluations: Tables<'evaluations'>[] | null }
  const rows = (data ?? []) as Row[]
  return rows.map((tender) => ({
    ...tender,
    evaluation: Array.isArray(tender.evaluations)
      ? tender.evaluations[0] ?? null
      : tender.evaluations ?? null,
  }))
}

/** Recommendation values that qualify a tender as "opportunity-ready" for the Opportunities list. */
const OPPORTUNITY_READY_RECOMMENDATIONS = ['INVEST', 'REVIEW', 'qualified'] as const

/**
 * Get tenders that are opportunity-ready: have an evaluation with recommendation INVEST, REVIEW, or qualified.
 * Used for the Opportunities list page. Push status is derived from tender.status === 'pushed'.
 */
export async function getOpportunityReadyTenders(): Promise<TenderWithEvaluation[]> {
  const all = await getTenders()
  return all.filter((t) => {
    const rec = t.evaluation?.recommendation
    return rec != null && OPPORTUNITY_READY_RECOMMENDATIONS.includes(rec as (typeof OPPORTUNITY_READY_RECOMMENDATIONS)[number])
  })
}

/**
 * Get opportunity-ready tenders with push status for the Opportunities page.
 * pushStatus: 'pushed' when tender.status === 'pushed'; 'failed' when latest crm_push is failed; else 'ready'.
 */
export async function getOpportunityReadyTendersWithPushStatus(): Promise<TenderWithEvaluationAndPushStatus[]> {
  const tenders = await getOpportunityReadyTenders()
  if (tenders.length === 0) return []

  const supabase = await createClient()
  const ids = tenders.map((t) => t.id)
  const { data: pushes, error } = await supabase
    .from('crm_pushes')
    .select('tender_id, status, created_at')
    .in('tender_id', ids)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching crm_pushes for opportunities:', error)
    return tenders.map((t) => ({
      ...t,
      pushStatus: (t.status === 'pushed' ? 'pushed' : 'ready') as OpportunityPushStatus,
    }))
  }

  const latestByTender = new Map<string, { status: 'pending' | 'success' | 'failed' }>()
  for (const p of pushes ?? []) {
    const tid = (p as { tender_id: string }).tender_id
    if (!latestByTender.has(tid)) {
      latestByTender.set(tid, { status: (p as { status: 'pending' | 'success' | 'failed' }).status })
    }
  }

  return tenders.map((t) => {
    if (t.status === 'pushed') {
      return { ...t, pushStatus: 'pushed' as OpportunityPushStatus }
    }
    const latest = latestByTender.get(t.id)
    if (latest?.status === 'failed') {
      return { ...t, pushStatus: 'failed' as OpportunityPushStatus }
    }
    return { ...t, pushStatus: 'ready' as OpportunityPushStatus }
  })
}

/**
 * Get historical tenders (awarded, with award_amount_sar).
 * Used for value estimation calibration only.
 */
export async function getHistoricalTenders(): Promise<TenderWithEvaluation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tenders')
    .select(`
      *,
      evaluations (*)
    `)
    .not('award_amount_sar', 'is', null) // Only historical/awarded tenders
    .is('deleted_at', null) // Exclude soft-deleted tenders
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching historical tenders:', error)
    throw new Error('Failed to fetch historical tenders')
  }

  return (data as any[]).map((tender) => ({
    ...tender,
    evaluation: Array.isArray(tender.evaluations)
      ? tender.evaluations[0] || null
      : tender.evaluations || null,
  }))
}

// Get single tender by ID (any logged-in user can view).
export async function getTenderById(id: string): Promise<TenderWithEvaluation | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tenders')
    .select(`
      *,
      evaluations (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching tender:', error)
    throw new Error('Failed to fetch tender')
  }

  const tender = data as any
  return {
    ...tender,
    evaluation: Array.isArray(tender.evaluations)
      ? tender.evaluations[0] || null
      : tender.evaluations || null,
  }
}

// Create tender (user-scoped; RLS applies)
export async function createTender(tender: {
  entity: string
  title: string
  reference_no: string
  deadline: string
  estimated_value?: number | null
  description?: string | null
  source?: string | null
  status?: 'pending' | 'evaluating' | 'evaluated' | 'approved' | 'pushed' | 'rejected'
  raw_data?: Json | null
}): Promise<Tender> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('tenders')
    .insert({
      ...tender,
      user_id: user.id,
    } as any)
    .select()
    .single()

  if (error) {
    console.error('Error creating tender:', error)
    throw new Error('Failed to create tender')
  }

  return data as Tender
}

// Create multiple tenders (bulk import)
export async function createTenders(
  tenders: {
    entity: string
    title: string
    reference_no: string
    deadline: string
    estimated_value?: number | null
    description?: string | null
    source?: string | null
    raw_data?: Json | null
  }[]
): Promise<{ created: number; errors: string[] }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const tendersWithUser = tenders.map((t) => ({
    ...t,
    user_id: user.id,
  }))

  const { data, error } = await supabase
    .from('tenders')
    .insert(tendersWithUser as any)
    .select()

  if (error) {
    console.error('Error creating tenders:', error)
    // Try to provide more specific error info
    if (error.code === '23505') {
      return { created: 0, errors: ['Duplicate reference numbers found'] }
    }
    return { created: 0, errors: [error.message] }
  }

  return { created: data?.length || 0, errors: [] }
}

// Update tender (RLS restricts to own tenders)
export async function updateTender(id: string, update: Record<string, unknown>): Promise<Tender> {
  const supabase = await createClient()
  
  // Cast to any to bypass Supabase strict typing until DB types are generated
  const { data, error } = await (supabase
    .from('tenders') as any)
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating tender:', error)
    if (error.code === 'PGRST116') {
      throw new Error(
        'Update affected 0 rows. If this tender was created by the scraper (system user), ensure migration 00015_tenders_update_own_or_system.sql is applied so authenticated users can update system tenders.'
      )
    }
    throw new Error('Failed to update tender')
  }

  return data as Tender
}

// Delete tender (RLS restricts to own tenders)
export async function deleteTender(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tenders')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting tender:', error)
    throw new Error('Failed to delete tender')
  }
}

// Delete all tenders (and related evaluations, crm_pushes) for a fresh start. RLS restricts to own tenders.
export async function clearAllTenders(): Promise<{ deletedTenders: number }> {
  const supabase = await createClient()

  const { data: tenderRows } = await supabase.from('tenders').select('id')
  const ids = ((tenderRows ?? []) as { id: string }[]).map((r) => r.id)
  if (ids.length === 0) {
    return { deletedTenders: 0 }
  }

  await supabase.from('crm_pushes').delete().in('tender_id', ids)
  await supabase.from('evaluations').delete().in('tender_id', ids)
  const { data: deleted, error } = await supabase.from('tenders').delete().in('id', ids).select('id')

  if (error) {
    console.error('Error clearing tenders:', error)
    throw new Error('Failed to clear tenders')
  }

  return { deletedTenders: deleted?.length ?? 0 }
}

/**
 * Get tender stats for dashboard (excludes historical/awarded tenders).
 */
export async function getTenderStats(): Promise<{
  totalTenders: number
  qualified: number
  conditional: number
  excluded: number
  totalValue: number
  pendingEvaluation: number
  pushedToCRM: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tenders')
    .select(`
      id,
      status,
      estimated_value,
      evaluations (
        recommendation
      )
    `)
    .is('award_amount_sar', null) // Exclude historical/awarded tenders
    .is('deleted_at', null) // Exclude soft-deleted tenders

  if (error) {
    console.error('Error fetching tender stats:', error)
    throw new Error('Failed to fetch tender stats')
  }

  const stats = {
    totalTenders: data?.length || 0,
    qualified: 0,
    conditional: 0,
    excluded: 0,
    totalValue: 0,
    pendingEvaluation: 0,
    pushedToCRM: 0,
  }

  for (const tender of (data || []) as any[]) {
    // Sum estimated values (column may not exist in all database versions)
    // Try to get it, but don't fail if it doesn't exist
    try {
      const estimatedValue = (tender as any).estimated_value
      if (estimatedValue != null && !isNaN(Number(estimatedValue))) {
        stats.totalValue += Number(estimatedValue)
      }
    } catch {
      // Column doesn't exist, skip it
    }

    // Count by status
    if (tender.status === 'pending') {
      stats.pendingEvaluation++
    } else if (tender.status === 'pushed') {
      stats.pushedToCRM++
    }

    // Count by evaluation recommendation
    const evaluation = Array.isArray(tender.evaluations) 
      ? tender.evaluations[0] 
      : tender.evaluations
      
    if (evaluation) {
      switch (evaluation.recommendation) {
        case 'qualified':
          stats.qualified++
          break
        case 'conditional':
          stats.conditional++
          break
        case 'excluded':
          stats.excluded++
          break
      }
    }
  }

  return stats
}

// Get tenders filtered by routing decision
export async function getTendersByRouting(
  routingDecision?: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID'
): Promise<TenderWithEvaluation[]> {
  const supabase = await createClient()

  let query = supabase
    .from('tenders')
    .select(`
      *,
      evaluations (
        *,
        routing_decision,
        predicted_budget_min,
        predicted_budget_max,
        oracle_metadata
      )
    `)
    .order('created_at', { ascending: false })

  // Filter by routing decision if provided
  if (routingDecision) {
    query = query.eq('evaluations.routing_decision', routingDecision)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tenders by routing:', error)
    throw new Error('Failed to fetch tenders by routing')
  }

  // Type assertion needed due to Supabase complex return types
  const tenders = (data as any[]).map((tender) => ({
    ...tender,
    evaluation: Array.isArray(tender.evaluations)
      ? tender.evaluations[0] || null
      : tender.evaluations || null,
  }))

  // If routing decision filter was provided, also filter in memory
  // (Supabase nested filtering may not work perfectly)
  if (routingDecision) {
    return tenders.filter((tender) => {
      const evaluation = tender.evaluation
      if (!evaluation) return false
      const routing = evaluation.routing_decision
      return routing === routingDecision
    })
  }

  return tenders
}
