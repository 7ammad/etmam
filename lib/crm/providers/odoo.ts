/**
 * Odoo CRM provider — JSON-RPC API.
 * Uses common.authenticate for login and object.execute_kw for crm.lead create.
 * Config: base_url, db, username, password (from server env in MVP).
 */

import type { CRMProviderInterface, CRMConfigData, OpportunityData, CRMProvider } from '@/types/crm'

const JSONRPC_VERSION = '2.0'
const JSONRPC_METHOD = 'call'

type OdooConfigShape = {
  base_url: string
  db: string
  username: string
  password: string
}

function isOdooConfig(c: CRMConfigData): c is CRMConfigData & OdooConfigShape {
  const r = c as Record<string, unknown>
  return (
    typeof c === 'object' &&
    c != null &&
    typeof r.base_url === 'string' &&
    typeof r.db === 'string' &&
    typeof r.username === 'string' &&
    typeof r.password === 'string'
  )
}

function getJsonRpcUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '')
  return `${base}/jsonrpc`
}

async function odooJsonRpc<T>(
  baseUrl: string,
  service: string,
  method: string,
  args: unknown[]
): Promise<T> {
  const url = getJsonRpcUrl(baseUrl)
  const body = {
    jsonrpc: JSONRPC_VERSION,
    method: JSONRPC_METHOD,
    params: { service, method, args },
    id: Math.floor(Math.random() * 1_000_000_000),
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Odoo HTTP ${res.status}: ${res.statusText}`)
  }
  const data = (await res.json()) as { result?: T; error?: { data?: { message?: string }; message?: string } }
  if (data.error) {
    const msg =
      data.error.data?.message ?? data.error.message ?? JSON.stringify(data.error)
    throw new Error(`Odoo RPC error: ${msg}`)
  }
  return data.result as T
}

/** Authenticate and return uid (integer). */
async function odooAuthenticate(config: OdooConfigShape): Promise<number> {
  const uid = await odooJsonRpc<number | false>(
    config.base_url,
    'common',
    'authenticate',
    [config.db, config.username, config.password]
  )
  if (uid === false || typeof uid !== 'number') {
    throw new Error('Odoo authentication failed: invalid credentials')
  }
  return uid
}

/** Map OpportunityData to crm.lead fields (name, partner_name, expected_revenue, description, date_deadline). Exported for dry-run preview. */
export function opportunityToLeadFields(data: OpportunityData): Record<string, unknown> {
  const name = [data.title, data.reference_no].filter(Boolean).join(' — ') || 'Tender'
  const deadlineDate =
    data.deadline instanceof Date ? data.deadline : new Date(data.deadline)
  const dateDeadline =
    Number.isNaN(deadlineDate.getTime())
      ? new Date().toISOString().slice(0, 10)
      : deadlineDate.toISOString().slice(0, 10)
  const lead: Record<string, unknown> = {
    name,
    partner_name: data.entity || undefined,
    expected_revenue: data.estimated_value ?? 0,
    description: [
      data.summary,
      data.recommendation ? `Recommendation: ${data.recommendation}` : '',
      data.score != null ? `Score: ${data.score}` : '',
    ]
      .filter(Boolean)
      .join('\n') || undefined,
    date_deadline: dateDeadline,
  }
  return lead
}

export class OdooCRMProvider implements CRMProviderInterface {
  id: CRMProvider = 'odoo'
  name = 'Odoo'
  nameAr = 'أودو'

  async connect(config: CRMConfigData) {
    if (!isOdooConfig(config)) {
      return { success: false, error: 'Invalid config for Odoo provider' }
    }
    return { success: true }
  }

  async testConnection(config: CRMConfigData) {
    if (!isOdooConfig(config)) {
      return { success: false, error: 'Invalid config' }
    }
    try {
      await odooAuthenticate(config)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }
    }
  }

  async createOpportunity(config: CRMConfigData, data: OpportunityData) {
    if (!isOdooConfig(config)) {
      return { success: false, error: 'Invalid config' }
    }
    try {
      const uid = await odooAuthenticate(config)
      const leadFields = opportunityToLeadFields(data)
      // execute_kw(db, uid, password, model, method, args, kwargs)
      const leadId = await odooJsonRpc<number>(
        config.base_url,
        'object',
        'execute_kw',
        [config.db, uid, config.password, 'crm.lead', 'create', [leadFields], {}]
      )
      return {
        success: true,
        externalId: String(leadId),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create lead',
      }
    }
  }
}
