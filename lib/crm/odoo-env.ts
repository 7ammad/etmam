/**
 * Resolve Odoo config from server-only env (MVP).
 * Used when provider=odoo and credentials are not stored in DB.
 */

import type { OdooConfig } from '@/types/crm'

const ENV_ODOO_BASE_URL = 'ODOO_BASE_URL'
const ENV_ODOO_DB = 'ODOO_DB'
const ENV_ODOO_USERNAME = 'ODOO_USERNAME'
const ENV_ODOO_PASSWORD = 'ODOO_PASSWORD'
const ENV_ODOO_PUSH_ENABLED = 'ODOO_PUSH_ENABLED'

export function getOdooConfigFromEnv(): OdooConfig | null {
  const baseUrl = process.env[ENV_ODOO_BASE_URL]
  const db = process.env[ENV_ODOO_DB]
  const username = process.env[ENV_ODOO_USERNAME]
  const password = process.env[ENV_ODOO_PASSWORD]
  if (!baseUrl || !db || !username || !password) {
    return null
  }
  try {
    return {
      base_url: baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`,
      db,
      username,
      password,
    }
  } catch {
    return null
  }
}

export function isOdooPushEnabledFromEnv(): boolean {
  const v = process.env[ENV_ODOO_PUSH_ENABLED]
  return v === 'true' || v === '1'
}
