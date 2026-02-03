'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCRMProvider } from '@/lib/crm/factory'
import { getOdooConfigFromEnv, isOdooPushEnabledFromEnv } from '@/lib/crm/odoo-env'
import {
  crmConfigDataSchema,
  type CRMConfigData,
  type OpportunityData,
  type CRMProvider,
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
    revalidatePath('/[locale]/settings', 'page')
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
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, error: 'Unauthorized' }
    }
    const providerInstance = getCRMProvider(provider)
    if (!providerInstance) {
      return { success: false, error: 'Unsupported provider' }
    }
    // Odoo: resolve from env when config is use_env
    let effectiveConfig = config
    if (provider === 'odoo' && (config as Record<string, unknown>)?.use_env === true) {
      const envConfig = getOdooConfigFromEnv()
      if (!envConfig) {
        return { success: false, error: 'Odoo credentials not set in environment (ODOO_*).' }
      }
      effectiveConfig = envConfig
    }
    const result = await providerInstance.testConnection(effectiveConfig)
    if (result.success) {
      return { success: true, data: { message: 'Connection successful' } }
    }
    return { success: false, error: result.error || 'Connection failed' }
  } catch (error) {
    return { success: false, error: 'Unexpected error during test' }
  }
}

// Odoo status from env (for Settings CRM UI)
export async function getOdooStatus(): Promise<
  ActionResult<{ configured: boolean; pushEnabled: boolean; message: string }>
> {
  const envConfig = getOdooConfigFromEnv()
  const pushEnabled = isOdooPushEnabledFromEnv()
  if (!envConfig) {
    return {
      success: true,
      data: {
        configured: false,
        pushEnabled: false,
        message: 'Set ODOO_BASE_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD in environment.',
      },
    }
  }
  return {
    success: true,
    data: {
      configured: true,
      pushEnabled,
      message: pushEnabled ? 'Odoo push enabled (credentials from env).' : 'Odoo configured; set ODOO_PUSH_ENABLED=true to allow push.',
    },
  }
}

// Odoo config for Settings form (from DB; no password)
export async function getOdooConfigForForm(): Promise<
  ActionResult<{ base_url: string; db: string; username: string; hasPassword: boolean } | null>
> {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    return { success: false, error: 'Unauthorized' }
  }
  const { data, error } = await supabase
    .from('crm_configs')
    .select('config')
    .eq('user_id', user.user.id)
    .eq('provider', 'odoo')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  if (error || !data) {
    return { success: true, data: null }
  }
  const config = (data as { config?: Record<string, unknown> }).config
  if (!config || typeof config !== 'object' || config.use_env === true) {
    return { success: true, data: null }
  }
  const base_url = typeof config.base_url === 'string' ? config.base_url : ''
  const db = typeof config.db === 'string' ? config.db : ''
  const username = typeof config.username === 'string' ? config.username : ''
  const hasPassword = typeof config.password === 'string' && config.password.length > 0
  return {
    success: true,
    data: { base_url, db, username, hasPassword },
  }
}

// Dry-run: return payload that would be sent to CRM (no send)
export async function pushToCRMDryRun(
  tenderId: string
): Promise<ActionResult<{ dryRun: true; payload: unknown; opportunityData: OpportunityData; provider: string }>> {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) {
    return { success: false, error: 'Unauthorized' }
  }
  let connection: { id: string; provider: string; name: string; config: unknown } | null = null
  const { data: configs } = await supabase
    .from('crm_configs')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('is_active', true)
    .limit(5)
  if (configs && configs.length > 0) {
    connection = configs[0] as { id: string; provider: string; name: string; config: unknown }
  }
  if (!connection && isOdooPushEnabledFromEnv() && getOdooConfigFromEnv()) {
    const { data: odooRow } = await supabase
      .from('crm_configs')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('provider', 'odoo')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    const odooId = odooRow && typeof (odooRow as { id?: string }).id === 'string' ? (odooRow as { id: string }).id : null
    if (odooId) {
      connection = { id: odooId, provider: 'odoo', name: 'Odoo (env)', config: { use_env: true } }
    }
  }
  if (!connection) {
    return { success: false, error: 'No active CRM connection found.' }
  }
  const { data: tender, error: tenderError } = await supabase
    .from('tenders')
    .select(`*, evaluations (*)`)
    .eq('id', tenderId)
    .single()
  if (tenderError || !tender) {
    return { success: false, error: 'Tender not found' }
  }
  const tenderData = tender as Record<string, unknown>
  const evals = tenderData.evaluations as unknown[] | undefined
  const evaluation = Array.isArray(evals) ? evals[0] : evals
  const evaluationRecord = evaluation as Record<string, unknown> | undefined

  // When evaluation exists use predicted_budget_min/max (canonical); else fallback to tender.estimated_value
  let effectiveEstimatedValue: number | null = null
  if (
    evaluationRecord?.predicted_budget_min != null &&
    evaluationRecord?.predicted_budget_max != null
  ) {
    const pmin = Number(evaluationRecord.predicted_budget_min)
    const pmax = Number(evaluationRecord.predicted_budget_max)
    effectiveEstimatedValue = pmin === pmax ? pmin : Math.round((pmin + pmax) / 2)
  } else if (tenderData.estimated_value != null) {
    effectiveEstimatedValue = Number(tenderData.estimated_value)
  }

  const opportunityData: OpportunityData = {
    tender_id: tenderData.id as string,
    entity: (tenderData.entity as string) ?? '',
    title: (tenderData.title as string) ?? '',
    reference_no: (tenderData.reference_no as string) ?? '',
    deadline: new Date(tenderData.deadline as string),
    estimated_value: effectiveEstimatedValue,
    score: evaluationRecord?.score != null ? Number(evaluationRecord.score) : 0,
    recommendation: (evaluationRecord?.recommendation as string) ?? 'pending',
    summary: (evaluationRecord?.summary as string) ?? '',
  }
  let payload: unknown
  if (connection.provider === 'odoo') {
    const { opportunityToLeadFields } = await import('@/lib/crm/providers/odoo')
    payload = { provider: 'odoo', model: 'crm.lead', fields: opportunityToLeadFields(opportunityData) }
  } else {
    payload = {
      provider: connection.provider,
      opportunity: {
        name: `${opportunityData.title} - ${opportunityData.reference_no}`,
        company: opportunityData.entity,
        amount: opportunityData.estimated_value,
        close_date: opportunityData.deadline,
        summary: opportunityData.summary,
        score: opportunityData.score,
        recommendation: opportunityData.recommendation,
      },
    }
  }
  return {
    success: true,
    data: { dryRun: true, payload, opportunityData, provider: connection.provider },
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
  
  // 1. Get active CRM connection (or Odoo from env when enabled)
  let connection: { id: string; provider: string; name: string; config: unknown } | null = null
  const { data: configs, error: configError } = await supabase
    .from('crm_configs')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('is_active', true)
    .limit(5)

  if (!configError && configs && configs.length > 0) {
    connection = configs[0] as { id: string; provider: string; name: string; config: unknown }
  }
  // MVP: when no DB connection but Odoo env is set and enabled, use virtual connection (need a crm_config row for crm_pushes)
  const odooEnvConfig = getOdooConfigFromEnv()
  if (!connection && isOdooPushEnabledFromEnv() && odooEnvConfig) {
    const { data: odooRow } = await supabase
      .from('crm_configs')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('provider', 'odoo')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    const odooId = odooRow && typeof (odooRow as { id?: string }).id === 'string' ? (odooRow as { id: string }).id : null
    if (odooId) {
      connection = {
        id: odooId,
        provider: 'odoo',
        name: 'Odoo (env)',
        config: { use_env: true },
      }
    }
  }
  if (!connection) {
    return { success: false, error: 'No active CRM connection found. Please configure one in settings.' }
  }
  
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
  // When evaluation exists use predicted_budget_min/max (canonical); else fallback to tender.estimated_value
  let effectiveEstimatedValue: number | null = null
  if (
    evaluation?.predicted_budget_min != null &&
    evaluation?.predicted_budget_max != null
  ) {
    const pmin = Number(evaluation.predicted_budget_min)
    const pmax = Number(evaluation.predicted_budget_max)
    effectiveEstimatedValue = pmin === pmax ? pmin : Math.round((pmin + pmax) / 2)
  } else if (tenderData.estimated_value != null) {
    effectiveEstimatedValue = Number(tenderData.estimated_value)
  }

  const opportunityData: OpportunityData = {
    tender_id: tenderData.id,
    entity: tenderData.entity,
    title: tenderData.title,
    reference_no: tenderData.reference_no,
    deadline: new Date(tenderData.deadline),
    estimated_value: effectiveEstimatedValue,
    score: evaluation?.score || 0,
    recommendation: evaluation?.recommendation || 'pending',
    summary: evaluation?.summary || '',
  }
  
  // 4. Resolve Odoo config: use env only when connection explicitly has use_env; otherwise use stored config
  let effectiveConfig: CRMConfigData = connection.config as CRMConfigData
  if (connection.provider === 'odoo') {
    const stored = connection.config as Record<string, unknown> | null
    if (stored?.use_env === true) {
      const envConfig = getOdooConfigFromEnv()
      if (!envConfig) {
        return { success: false, error: 'Odoo credentials not configured. Set ODOO_BASE_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD in environment.' }
      }
      effectiveConfig = envConfig
    }
  }

  const provider = getCRMProvider(connection.provider as CRMProvider)
  if (!provider) {
    return { success: false, error: 'Provider not supported' }
  }
  
  const result = await provider.createOpportunity(effectiveConfig, opportunityData)
  
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
  
  // 5. Save success record (cast: Supabase client infers never for this table insert in some setups)
  await (supabase.from('crm_pushes') as any).insert({
    tender_id: tenderId,
    crm_config_id: connection.id,
    external_id: result.externalId ?? null,
    status: 'success',
    response_data: { success: result.success, externalId: result.externalId },
  })
  
  // 6. Update tender status (cast: Supabase client infers never for this table update in some setups)
  await (supabase.from('tenders') as any).update({ status: 'pushed' }).eq('id', tenderId)
  
  revalidatePath('/[locale]/dashboard', 'page')
  revalidatePath(`/[locale]/dashboard/${tenderId}`, 'page')
  revalidatePath('/[locale]/dashboard/opportunities', 'page')

  return { success: true, data: { crmUrl: undefined } } // URL support depends on provider return
}
