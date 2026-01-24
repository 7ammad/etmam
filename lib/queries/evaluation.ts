import { createServiceClient } from '@/lib/supabase/server'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type Evaluation = Tables<'evaluations'>
export type EvaluationInsert = TablesInsert<'evaluations'>
export type EvaluationUpdate = TablesUpdate<'evaluations'>

// Get evaluation by tender ID
export async function getEvaluationByTenderId(tenderId: string): Promise<Evaluation | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('tender_id', tenderId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching evaluation:', error)
    throw new Error('Failed to fetch evaluation')
  }

  return data as Evaluation
}

// Create or update evaluation for a tender
export async function upsertEvaluation(evaluation: EvaluationInsert): Promise<Evaluation> {
  const supabase = createServiceClient()

  // Check if evaluation exists
  const existing = await getEvaluationByTenderId(evaluation.tender_id)

  if (existing) {
    // Update existing evaluation
    const updateData: EvaluationUpdate = {
      score: evaluation.score,
      recommendation: evaluation.recommendation,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      risks: evaluation.risks,
      missing_requirements: evaluation.missing_requirements,
      action_items: evaluation.action_items,
      breakdown: evaluation.breakdown,
      model_used: evaluation.model_used,
    }
    const updateQuery = supabase
      .from('evaluations') as any
    const { data, error } = await updateQuery
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating evaluation:', error)
      throw new Error('Failed to update evaluation')
    }

    return data as Evaluation
  } else {
    // Create new evaluation
    const { data, error } = await supabase
      .from('evaluations')
      .insert(evaluation as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating evaluation:', error)
      throw new Error('Failed to create evaluation')
    }

    return data as Evaluation
  }
}

// Delete evaluation
export async function deleteEvaluation(id: string): Promise<void> {
  const supabase = createServiceClient()

  const { error } = await supabase.from('evaluations').delete().eq('id', id)

  if (error) {
    console.error('Error deleting evaluation:', error)
    throw new Error('Failed to delete evaluation')
  }
}

// Get pending tenders (no evaluation yet)
export async function getPendingTenders(): Promise<Tables<'tenders'>[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending tenders:', error)
    throw new Error('Failed to fetch pending tenders')
  }

  return (data || []) as Tables<'tenders'>[]
}
