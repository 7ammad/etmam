// Database types - will be generated from Supabase schema
// For now, define base structure manually

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tenders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          entity: string
          title: string
          reference_no: string
          deadline: string
          estimated_value: number | null
          description: string | null
          source: string | null
          status: 'pending' | 'evaluating' | 'evaluated' | 'approved' | 'pushed' | 'rejected'
          raw_data: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          entity: string
          title: string
          reference_no: string
          deadline: string
          estimated_value?: number | null
          description?: string | null
          source?: string | null
          status?: 'pending' | 'evaluating' | 'evaluated' | 'approved' | 'pushed' | 'rejected'
          raw_data?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          entity?: string
          title?: string
          reference_no?: string
          deadline?: string
          estimated_value?: number | null
          description?: string | null
          source?: string | null
          status?: 'pending' | 'evaluating' | 'evaluated' | 'approved' | 'pushed' | 'rejected'
          raw_data?: Json | null
        }
      }
      evaluations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tender_id: string
          score: number
          recommendation: 'qualified' | 'conditional' | 'excluded'
          summary: string
          strengths: string[]
          risks: string[]
          missing_requirements: string[]
          action_items: string[]
          breakdown: Json
          model_used: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tender_id: string
          score: number
          recommendation: 'qualified' | 'conditional' | 'excluded'
          summary: string
          strengths?: string[]
          risks?: string[]
          missing_requirements?: string[]
          action_items?: string[]
          breakdown?: Json
          model_used?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tender_id?: string
          score?: number
          recommendation?: 'qualified' | 'conditional' | 'excluded'
          summary?: string
          strengths?: string[]
          risks?: string[]
          missing_requirements?: string[]
          action_items?: string[]
          breakdown?: Json
          model_used?: string
        }
      }
      crm_configs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          provider: 'webhook' | 'hubspot' | 'salesforce' | 'zoho' | 'odoo'
          name: string
          config: Json
          is_active: boolean
          last_tested_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          provider: 'webhook' | 'hubspot' | 'salesforce' | 'zoho' | 'odoo'
          name: string
          config: Json
          is_active?: boolean
          last_tested_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          provider?: 'webhook' | 'hubspot' | 'salesforce' | 'zoho' | 'odoo'
          name?: string
          config?: Json
          is_active?: boolean
          last_tested_at?: string | null
        }
      }
      crm_pushes: {
        Row: {
          id: string
          created_at: string
          tender_id: string
          crm_config_id: string
          external_id: string | null
          status: 'pending' | 'success' | 'failed'
          error_message: string | null
          response_data: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          tender_id: string
          crm_config_id: string
          external_id?: string | null
          status?: 'pending' | 'success' | 'failed'
          error_message?: string | null
          response_data?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          tender_id?: string
          crm_config_id?: string
          external_id?: string | null
          status?: 'pending' | 'success' | 'failed'
          error_message?: string | null
          response_data?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tender_status: 'pending' | 'evaluating' | 'evaluated' | 'approved' | 'pushed' | 'rejected'
      recommendation_type: 'qualified' | 'conditional' | 'excluded'
      crm_provider: 'webhook' | 'hubspot' | 'salesforce' | 'zoho' | 'odoo'
      push_status: 'pending' | 'success' | 'failed'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
