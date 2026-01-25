import { createServiceClient } from '@/lib/supabase/server'
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/types/database'

export type Tender = Tables<'tenders'>
export type TenderInsert = TablesInsert<'tenders'>
export type TenderUpdate = TablesUpdate<'tenders'>

// Diagnostic function to test database connectivity
async function testDatabaseConnection(supabase: ReturnType<typeof createServiceClient>) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b22f8891-a0d3-4eaa-a284-fd7127c7ef55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/queries/tender.ts:testDatabaseConnection',message:'Testing raw RPC call',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4-H5'})}).catch(()=>{});
  // #endregion
  
  // Try a simple count query using RPC
  const { count, error: countError } = await supabase
    .from('tenders')
    .select('*', { count: 'exact', head: true })
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b22f8891-a0d3-4eaa-a284-fd7127c7ef55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/queries/tender.ts:testDatabaseConnection:result',message:'Count query result',data:{count,hasError:!!countError,errorCode:countError?.code,errorMessage:countError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4-H5'})}).catch(()=>{});
  // #endregion
  
  return { count, error: countError }
}

export type TenderWithEvaluation = Tender & {
  evaluation: Tables<'evaluations'> | null
}

// Get all tenders for current user
export async function getTenders(): Promise<TenderWithEvaluation[]> {
  const supabase = createServiceClient()
  
  console.log('🔍 getTenders: Using service client to bypass RLS')
  
  // Run diagnostic test first
  const diagResult = await testDatabaseConnection(supabase)
  console.log('📊 Diagnostic test result:', diagResult)
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b22f8891-a0d3-4eaa-a284-fd7127c7ef55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/queries/tender.ts:getTenders:before',message:'About to query tenders table',data:{clientType:typeof supabase,hasFrom:typeof supabase.from,diagCount:diagResult.count,diagError:diagResult.error?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H4'})}).catch(()=>{});
  // #endregion
  
  const { data, error } = await supabase
    .from('tenders')
    .select(`
      *,
      evaluations (*)
    `)
    .order('created_at', { ascending: false })

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b22f8891-a0d3-4eaa-a284-fd7127c7ef55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/queries/tender.ts:getTenders:after',message:'Query completed',data:{hasData:!!data,dataLength:data?.length,hasError:!!error,errorCode:error?.code,errorMessage:error?.message,errorHint:error?.hint},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H5'})}).catch(()=>{});
  // #endregion

  if (error) {
    console.error('Error fetching tenders:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    throw new Error('Failed to fetch tenders')
  }

  console.log('✅ Successfully fetched tenders:', data?.length || 0)

  // Type assertion needed due to Supabase complex return types
  return (data as any[]).map((tender) => ({
    ...tender,
    evaluation: Array.isArray(tender.evaluations) 
      ? tender.evaluations[0] || null 
      : tender.evaluations || null,
  }))
}

// Get single tender by ID
export async function getTenderById(id: string): Promise<TenderWithEvaluation | null> {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('tenders')
    .select(`
      *,
      evaluations (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching tender:', error)
    throw new Error('Failed to fetch tender')
  }

  // Type assertion needed due to Supabase complex return types
  const tender = data as any
  return {
    ...tender,
    evaluation: Array.isArray(tender.evaluations) 
      ? tender.evaluations[0] || null 
      : tender.evaluations || null,
  }
}

// Create tender
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
  const supabase = createServiceClient()
  
  // TODO: When auth is implemented, get user from session
  // For now, use a dummy user_id for development
  const dummyUserId = '00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabase
    .from('tenders')
    .insert({
      ...tender,
      user_id: dummyUserId,
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
  const supabase = createServiceClient()
  
  // TODO: When auth is implemented, get user from session
  // For now, use a dummy user_id for development
  const dummyUserId = '00000000-0000-0000-0000-000000000000'

  const tendersWithUser = tenders.map((t) => ({
    ...t,
    user_id: dummyUserId,
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

// Update tender
export async function updateTender(id: string, update: Record<string, unknown>): Promise<Tender> {
  const supabase = createServiceClient()
  
  // Cast to any to bypass Supabase strict typing until DB types are generated
  const { data, error } = await (supabase
    .from('tenders') as any)
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating tender:', error)
    throw new Error('Failed to update tender')
  }

  return data as Tender
}

// Delete tender
export async function deleteTender(id: string): Promise<void> {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from('tenders')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting tender:', error)
    throw new Error('Failed to delete tender')
  }
}

// Get tender stats
export async function getTenderStats(): Promise<{
  totalTenders: number
  qualified: number
  conditional: number
  excluded: number
  totalValue: number
  pendingEvaluation: number
  pushedToCRM: number
}> {
  const supabase = createServiceClient()
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b22f8891-a0d3-4eaa-a284-fd7127c7ef55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/queries/tender.ts:getTenderStats:before',message:'About to query tender stats',data:{clientType:typeof supabase},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H4'})}).catch(()=>{});
  // #endregion
  
  // Get all tenders with evaluations
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b22f8891-a0d3-4eaa-a284-fd7127c7ef55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/queries/tender.ts:getTenderStats:after',message:'Stats query completed',data:{hasData:!!data,dataLength:data?.length,hasError:!!error,errorCode:error?.code,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H5'})}).catch(()=>{});
  // #endregion

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
    // Sum estimated values
    if (tender.estimated_value) {
      stats.totalValue += Number(tender.estimated_value)
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
