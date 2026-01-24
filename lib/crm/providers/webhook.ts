import type { CRMProviderInterface, CRMConfigData, OpportunityData, CRMProvider } from '@/types/crm'

export class WebhookCRMProvider implements CRMProviderInterface {
  id: CRMProvider = 'webhook'
  name = 'Webhook (Universal)'
  nameAr = 'رابط ويب (عام)'
  
  private config?: CRMConfigData & { webhook_url: string }
  
  async connect(config: CRMConfigData) {
    // Type guard
    if (!('webhook_url' in config)) {
      return { success: false, error: 'Invalid config for Webhook provider' }
    }
    
    this.config = config as CRMConfigData & { webhook_url: string }
    return { success: true }
  }
  
  async testConnection(config: CRMConfigData) {
    if (!('webhook_url' in config)) {
      return { success: false, error: 'Invalid config' }
    }
    
    try {
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {}),
          ...(config.auth_token ? { 'Authorization': `Bearer ${config.auth_token}` } : {}),
        },
        body: JSON.stringify({ 
          event: 'test_connection',
          timestamp: new Date().toISOString(),
          source: 'etmaam_crm'
        }),
      })
      
      if (response.ok) {
        return { success: true }
      } else {
        return { 
          success: false, 
          error: `HTTP Error: ${response.status} ${response.statusText}` 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      }
    }
  }
  
  async createOpportunity(config: CRMConfigData, data: OpportunityData) {
    if (!('webhook_url' in config)) {
      return { success: false, error: 'Invalid config' }
    }
    
    try {
      const payload = {
        event: 'create_opportunity',
        opportunity: {
          name: `${data.title} - ${data.reference_no}`,
          company: data.entity,
          amount: data.estimated_value,
          currency: 'SAR',
          close_date: data.deadline.toISOString(),
          stage: 'Qualification',
          custom_fields: {
            tender_number: data.reference_no,
            ai_score: data.score,
            recommendation: data.recommendation,
            ai_summary: data.summary,
          },
        },
        metadata: {
          source: 'etmaam',
          created_at: new Date().toISOString(),
        },
      }
      
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {}),
          ...(config.auth_token ? { 'Authorization': `Bearer ${config.auth_token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        return { success: false, error: `Failed to create opportunity: ${errorText}` }
      }
      
      const result = await response.json().catch(() => ({}))
      
      return {
        success: true,
        externalId: result.id || result.opportunity_id || `webhook-${Date.now()}`,
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send webhook' 
      }
    }
  }
}
