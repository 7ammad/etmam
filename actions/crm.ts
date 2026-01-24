'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCRMProvider } from '@/lib/crm/factory'
import { 
  crmConfigDataSchema, 
  type CRMConfigData, 
  type OpportunityData,
  type CRMProvider 
} from '@/types/crm'

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

// Save CRM Connection Configuration
export async function saveCRMConnection(
  provider: CRMProvider,
  config: CRMConfigData,
  name: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const validatedConfig = crmConfigDataSchema.parse(config)
    const supabase = await createClient()
    
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const providerInstance = getCRMProvider(provider)
    if (!providerInstance) {
      return { success: false, error: 'Unsupported provider' }
    }
    
    // Upsert connection
    const { data, error } = await supabase
      .from('crm_configs')
      .upsert({
        user_id: user.user.id,
        provider: provider,
        name: name,
        config: validatedConfig as any,
        is_active: true,
      } as any, {
        onConflict: 'user_id,provider,name',
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/[locale]/settings/crm', 'page')
    return { success: true, data: { id: (data as any).id } }
  } catch (error) {
    console.error('Save CRM error:', error)
    return { success: false, error: 'Failed to save configuration' }
  }
}

// Test CRM Connection
export async function testCRMConnection(
  provider: CRMProvider,
  config: CRMConfigData
): Promise<ActionResult<{ message: string }>> {
  try {
    const providerInstance = getCRMProvider(provider)
    if (!providerInstance) {
      return { success: false, error: 'Unsupported provider' }
    }
    
    const result = await providerInstance.testConnection(config)
    
    if (result.success) {
      return { success: true, data: { message: 'Connection successful' } }
    } else {
      return { success: false, error: result.error || 'Connection failed' }
    }
  } catch (error) {
    return { success: false, error: 'Unexpected error during test' }
  }
}

// Push Tender to CRM
export async function pushToCRM(
  tenderId: string
): Promise<ActionResult<{ crmUrl?: string }>> {
  const supabase = await createClient()
  
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // 1. Get active CRM connection
  // For MVP, we just take the first active one. In reality, user might choose.
  const { data: configs, error: configError } = await supabase
    .from('crm_configs')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('is_active', true)
    .limit(1)
  
  if (configError || !configs || configs.length === 0) {
    return { success: false, error: 'No active CRM connection found. Please configure one in settings.' }
  }
  
  const connection = configs[0] as any
  
  // 2. Get tender with evaluation
  const { data: tender, error: tenderError } = await supabase
    .from('tenders')
    .select(`
      *,
      evaluations (*)
    `)
    .eq('id', tenderId)
    .single()
  
  if (tenderError || !tender) {
    return { success: false, error: 'Tender not found' }
  }
  
  // Handle array or single object return from Supabase
  const tenderData = tender as any
  const evaluation = Array.isArray(tenderData.evaluations) 
    ? tenderData.evaluations[0] 
    : tenderData.evaluations
  
  // 3. Prepare opportunity data
  const opportunityData: OpportunityData = {
    tender_id: tenderData.id,
    entity: tenderData.entity,
    title: tenderData.title,
    reference_no: tenderData.reference_no,
    deadline: new Date(tenderData.deadline),
    estimated_value: tenderData.estimated_value ? Number(tenderData.estimated_value) : null,
    score: evaluation?.score || 0,
    recommendation: evaluation?.recommendation || 'pending',
    summary: evaluation?.summary || '',
  }
  
  // 4. Get provider and push
  const provider = getCRMProvider(connection.provider as CRMProvider)
  if (!provider) {
    return { success: false, error: 'Provider not supported' }
  }
  
  const result = await provider.createOpportunity(connection.config as CRMConfigData, opportunityData)
  
  if (!result.success) {
    // Log failure
    await supabase.from('crm_pushes').insert({
      tender_id: tenderId,
      crm_config_id: connection.id,
      status: 'failed' as const,
      error_message: result.error,
    } as any)
    return { success: false, error: result.error || 'Failed to create opportunity' }
  }
  
  // 5. Save success record
  await supabase.from('crm_pushes').insert({
    tender_id: tenderId,
    crm_config_id: connection.id,
    external_id: result.externalId,
    status: 'success' as const,
    response_data: result as any,
  } as any)
  
  // 6. Update tender status
  const updateQuery = supabase.from('tenders') as any
  await updateQuery
    .update({ status: 'pushed' })
    .eq('id', tenderId)
  
  revalidatePath('/[locale]/dashboard', 'page')
  revalidatePath(`/[locale]/tenders/${tenderId}`, 'page')
  
  return { success: true, data: { crmUrl: undefined } } // URL support depends on provider return
}
