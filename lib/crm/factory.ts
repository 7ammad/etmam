import type { CRMProviderInterface, CRMProvider } from '@/types/crm'
import { WebhookCRMProvider } from './providers/webhook'
import { HubSpotCRMProvider } from './providers/hubspot'
import { OdooCRMProvider } from './providers/odoo'

const providers = new Map<CRMProvider, CRMProviderInterface>()

// Initialize providers
providers.set('webhook', new WebhookCRMProvider())
providers.set('hubspot', new HubSpotCRMProvider())
providers.set('odoo', new OdooCRMProvider())

// Factory function
export function getCRMProvider(id: CRMProvider): CRMProviderInterface | undefined {
  return providers.get(id)
}

// List available providers
export function listCRMProviders() {
  return Array.from(providers.values()).map(p => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
  }))
}
