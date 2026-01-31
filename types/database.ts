export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
          booklet_price_sar: number | null
          initial_guarantee_sar: number | null
          project_duration: string | null
          award_amount_sar: number | null
          award_date: string | null
          winning_bidder: string | null
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
          booklet_price_sar?: number | null
          initial_guarantee_sar?: number | null
          project_duration?: string | null
          award_amount_sar?: number | null
          award_date?: string | null
          winning_bidder?: string | null
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
          booklet_price_sar?: number | null
          initial_guarantee_sar?: number | null
          project_duration?: string | null
          award_amount_sar?: number | null
          award_date?: string | null
          winning_bidder?: string | null
        }
        Relationships: []
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
          strengths: string[] | null
          risks: string[] | null
          missing_requirements: string[] | null
          action_items: string[] | null
          breakdown: Json
          model_used: string
          oracle_metadata: Json | null
          predicted_budget_min: number | null
          predicted_budget_max: number | null
          routing_decision: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID' | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tender_id: string
          score: number
          recommendation: 'qualified' | 'conditional' | 'excluded'
          summary: string
          strengths?: string[] | null
          risks?: string[] | null
          missing_requirements?: string[] | null
          action_items?: string[] | null
          breakdown?: Json
          model_used?: string
          oracle_metadata?: Json | null
          predicted_budget_min?: number | null
          predicted_budget_max?: number | null
          routing_decision?: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID' | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tender_id?: string
          score?: number
          recommendation?: 'qualified' | 'conditional' | 'excluded'
          summary?: string
          strengths?: string[] | null
          risks?: string[] | null
          missing_requirements?: string[] | null
          action_items?: string[] | null
          breakdown?: Json
          model_used?: string
          oracle_metadata?: Json | null
          predicted_budget_min?: number | null
          predicted_budget_max?: number | null
          routing_decision?: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID' | null
        }
        Relationships: [
          {
            foreignKeyName: 'evaluations_tender_id_fkey'
            columns: ['tender_id']
            isOneToOne: false
            referencedRelation: 'tenders'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'crm_pushes_tender_id_fkey'
            columns: ['tender_id']
            isOneToOne: false
            referencedRelation: 'tenders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'crm_pushes_crm_config_id_fkey'
            columns: ['crm_config_id']
            isOneToOne: false
            referencedRelation: 'crm_configs'
            referencedColumns: ['id']
          }
        ]
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
      routing_decision: 'INFRATECH' | 'EXOTECH' | 'JOINT' | 'NO_BID'
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
