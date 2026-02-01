import { z } from 'zod'

// CRM Provider types
export const crmProviderSchema = z.enum([
  'webhook',
  'hubspot',
  'salesforce',
  'zoho',
  'odoo',
])

export type CRMProvider = z.infer<typeof crmProviderSchema>

// Push status
export const pushStatusSchema = z.enum(['pending', 'success', 'failed'])
export type PushStatus = z.infer<typeof pushStatusSchema>

// Provider-specific config schemas
export const webhookConfigSchema = z.object({
  webhook_url: z.string().url('Invalid webhook URL'),
  method: z.enum(['POST', 'PUT']).default('POST'),
  headers: z.record(z.string()).optional(),
  auth_token: z.string().optional(),
})

export type WebhookConfig = z.infer<typeof webhookConfigSchema>

export const hubspotConfigSchema = z.object({
  api_key: z.string().min(1, 'API key is required'),
  pipeline_id: z.string().optional(),
  stage_id: z.string().optional(),
})

export type HubSpotConfig = z.infer<typeof hubspotConfigSchema>

export const salesforceConfigSchema = z.object({
  instance_url: z.string().url(),
  access_token: z.string(),
  refresh_token: z.string().optional(),
})

export type SalesforceConfig = z.infer<typeof salesforceConfigSchema>

export const odooConfigSchema = z.object({
  base_url: z.string().url('Invalid Odoo base URL'),
  db: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const odooEnvConfigSchema = z.object({
  use_env: z.literal(true),
})

export type OdooConfig = z.infer<typeof odooConfigSchema>
export type OdooEnvConfig = z.infer<typeof odooEnvConfigSchema>

// Union of all config types (Odoo: full config or use_env for server-only env)
export const crmConfigDataSchema = z.union([
  webhookConfigSchema,
  hubspotConfigSchema,
  salesforceConfigSchema,
  odooConfigSchema,
  odooEnvConfigSchema,
])

export type CRMConfigData = z.infer<typeof crmConfigDataSchema>

// Full CRM config schema
export const crmConfigSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  provider: crmProviderSchema,
  name: z.string().min(1, 'Name is required'),
  config: z.record(z.unknown()), // Will be validated based on provider
  is_active: z.boolean().default(true),
  last_tested_at: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
})

export type CRMConfig = z.infer<typeof crmConfigSchema>

// Create CRM config input
export const createCRMConfigSchema = crmConfigSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
})

export type CreateCRMConfigInput = z.infer<typeof createCRMConfigSchema>

// CRM Push schema
export const crmPushSchema = z.object({
  id: z.string().uuid().optional(),
  tender_id: z.string().uuid(),
  crm_config_id: z.string().uuid(),
  external_id: z.string().nullable().optional(),
  status: pushStatusSchema.default('pending'),
  error_message: z.string().nullable().optional(),
  response_data: z.record(z.unknown()).nullable().optional(),
  created_at: z.coerce.date().optional(),
})

export type CRMPush = z.infer<typeof crmPushSchema>

// Opportunity data to send to CRM
export const opportunityDataSchema = z.object({
  tender_id: z.string().uuid(),
  entity: z.string(),
  title: z.string(),
  reference_no: z.string(),
  deadline: z.coerce.date(),
  estimated_value: z.number().nullable(),
  score: z.number().nullable().optional(),
  recommendation: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
})

export type OpportunityData = z.infer<typeof opportunityDataSchema>

// CRM Provider interface
export interface CRMProviderInterface {
  id: CRMProvider
  name: string
  nameAr: string
  connect(credentials: CRMConfigData): Promise<{ success: boolean; error?: string }>
  createOpportunity(
    config: CRMConfigData,
    data: OpportunityData
  ): Promise<{ success: boolean; externalId?: string; error?: string }>
  testConnection(config: CRMConfigData): Promise<{ success: boolean; error?: string }>
}

// Provider metadata
export const CRM_PROVIDERS: Record<CRMProvider, { name: string; nameAr: string; description: string }> = {
  webhook: {
    name: 'Webhook',
    nameAr: 'رابط ويب',
    description: 'Universal webhook integration',
  },
  hubspot: {
    name: 'HubSpot',
    nameAr: 'هاب سبوت',
    description: 'HubSpot CRM integration',
  },
  salesforce: {
    name: 'Salesforce',
    nameAr: 'سيلز فورس',
    description: 'Salesforce CRM integration',
  },
  zoho: {
    name: 'Zoho',
    nameAr: 'زوهو',
    description: 'Zoho CRM integration',
  },
  odoo: {
    name: 'Odoo',
    nameAr: 'أودو',
    description: 'Odoo ERP integration',
  },
}
