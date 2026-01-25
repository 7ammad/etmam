import type { CRMProviderInterface, CRMConfigData, OpportunityData, CRMProvider } from '@/types/crm'

export class HubSpotCRMProvider implements CRMProviderInterface {
  id: CRMProvider = 'hubspot'
  name = 'HubSpot CRM'
  nameAr = 'هاب سبوت'
  
  async connect(config: CRMConfigData) {
    if (!('api_key' in config)) {
      return { success: false, error: 'Invalid config for HubSpot provider' }
    }
    return { success: true }
  }
  
  async testConnection(config: CRMConfigData) {
    if (!('api_key' in config)) {
      return { success: false, error: 'Invalid config' }
    }

    try {
      // Test connection by fetching owner details (lightweight endpoint)
      const response = await fetch('https://api.hubapi.com/crm/v3/owners?limit=1', {
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.json().catch(() => ({}))
        return { 
          success: false, 
          error: error.message || `HTTP Error: ${response.status}` 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      }
    }
  }
  
  async createOpportunity(config: CRMConfigData, data: OpportunityData) {
    if (!('api_key' in config)) {
      return { success: false, error: 'Invalid config' }
    }

    try {
      // 1. Create Deal
      const dealPayload = {
        properties: {
          dealname: `${data.title} - ${data.reference_no}`,
          amount: data.estimated_value?.toString() || '0',
          closedate: data.deadline.toISOString(),
          dealstage: config.stage_id || 'qualifiedtobuy',
          pipeline: config.pipeline_id || 'default',
          // Custom properties (if they exist in HubSpot)
          description: data.summary || '',
        }
      }

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealPayload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return { success: false, error: error.message || `HubSpot Error: ${response.status}` }
      }

      const result = await response.json()
      
      return {
        success: true,
        externalId: result.id,
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create deal' 
      }
    }
  }
}
