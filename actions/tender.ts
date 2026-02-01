'use server'

import { revalidatePath } from 'next/cache'
import { createTenderSchema, updateTenderSchema } from '@/types/tender'
import {
  getTenders,
  getTenderById,
  createTender,
  createTenders,
  updateTender,
  deleteTender,
  clearAllTenders,
  getTenderStats,
} from '@/lib/queries/tender'
import { parseFile } from '@/lib/parser'
import type { Json } from '@/types/database'

// Types for action responses
export type ActionResponse<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

// Get all tenders
export async function getTendersAction() {
  try {
    const tenders = await getTenders()
    return { success: true as const, data: tenders }
  } catch (error) {
    return { 
      success: false as const, 
      error: error instanceof Error ? error.message : 'Failed to fetch tenders' 
    }
  }
}

// Get single tender
export async function getTenderAction(id: string) {
  try {
    const tender = await getTenderById(id)
    if (!tender) {
      return { success: false as const, error: 'Tender not found' }
    }
    return { success: true as const, data: tender }
  } catch (error) {
    return { 
      success: false as const, 
      error: error instanceof Error ? error.message : 'Failed to fetch tender' 
    }
  }
}

// Create tender
export async function createTenderAction(formData: FormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const rawData = {
      entity: formData.get('entity'),
      title: formData.get('title'),
      reference_no: formData.get('reference_no'),
      deadline: formData.get('deadline'),
      estimated_value: formData.get('estimated_value') 
        ? Number(formData.get('estimated_value')) 
        : null,
      description: formData.get('description') || null,
      source: formData.get('source') || 'manual',
    }

    const parsed = createTenderSchema.safeParse(rawData)
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.errors.map(e => e.message).join(', ') 
      }
    }

    const tender = await createTender({
      entity: parsed.data.entity,
      title: parsed.data.title,
      reference_no: parsed.data.reference_no,
      deadline: parsed.data.deadline.toISOString(),
      estimated_value: parsed.data.estimated_value,
      description: parsed.data.description,
      source: parsed.data.source,
    })

    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath('/[locale]/tenders', 'page')
    
    return { success: true, data: { id: tender.id } }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create tender' 
    }
  }
}

// Update tender
export async function updateTenderAction(
  id: string, 
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const rawData = {
      id,
      entity: formData.get('entity') || undefined,
      title: formData.get('title') || undefined,
      reference_no: formData.get('reference_no') || undefined,
      deadline: formData.get('deadline') || undefined,
      estimated_value: formData.get('estimated_value') 
        ? Number(formData.get('estimated_value')) 
        : undefined,
      description: formData.get('description') || undefined,
      status: formData.get('status') || undefined,
    }

    const parsed = updateTenderSchema.safeParse(rawData)
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.errors.map(e => e.message).join(', ') 
      }
    }

    const { id: tenderId, deadline, raw_data, ...updateData } = parsed.data
    await updateTender(tenderId, {
      ...updateData,
      deadline: deadline?.toISOString(),
    } as Record<string, unknown>)

    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath('/[locale]/tenders', 'page')
    revalidatePath(`/[locale]/tenders/${id}`, 'page')
    
    return { success: true, data: { id: tenderId } }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update tender' 
    }
  }
}

// Delete tender
export async function deleteTenderAction(id: string): Promise<ActionResponse> {
  try {
    await deleteTender(id)

    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath('/[locale]/tenders', 'page')
    
    return { success: true, data: undefined }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete tender' 
    }
  }
}

// Import tenders from file
export async function importTendersAction(
  formData: FormData
): Promise<ActionResponse<{ created: number; errors: string[] }>> {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Parse the file
    const parseResult = await parseFile(file)
    
    if (parseResult.validRows === 0) {
      return { 
        success: false, 
        error: `No valid rows found. Errors: ${parseResult.errors.map(e => `Row ${e.row}: ${e.message}`).join('; ')}` 
      }
    }

    // Prepare tender data
    const tendersToCreate = parseResult.data.map((row) => ({
      entity: row.entity,
      title: row.title,
      reference_no: row.reference_no,
      deadline: row.deadline instanceof Date 
        ? row.deadline.toISOString() 
        : new Date(row.deadline).toISOString(),
      estimated_value: row.estimated_value ?? null,
      description: row.description ?? null,
      source: 'import',
      raw_data: row.raw_data as Json,
    }))

    // Insert into database
    const result = await createTenders(tendersToCreate)

    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath('/[locale]/tenders', 'page')

    // Combine parsing errors with database errors
    const allErrors = [
      ...parseResult.errors.map(e => `Row ${e.row}: ${e.message}`),
      ...result.errors,
    ]

    return { 
      success: true, 
      data: { 
        created: result.created, 
        errors: allErrors 
      } 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to import tenders' 
    }
  }
}

// Clear all tenders (and evaluations, crm_pushes) for a fresh start
export async function clearAllTendersAction(): Promise<ActionResponse<{ deletedTenders: number }>> {
  try {
    const { deletedTenders } = await clearAllTenders()
    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath('/[locale]/tenders', 'page')
    return { success: true, data: { deletedTenders } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear tenders',
    }
  }
}

// Get stats
export async function getStatsAction() {
  try {
    const stats = await getTenderStats()
    return { success: true as const, data: stats }
  } catch (error) {
    return { 
      success: false as const, 
      error: error instanceof Error ? error.message : 'Failed to fetch stats' 
    }
  }
}

// Update tender status
export async function updateTenderStatusAction(
  id: string,
  status: 'pending' | 'evaluating' | 'evaluated' | 'approved' | 'pushed' | 'rejected'
): Promise<ActionResponse<{ id: string }>> {
  try {
    await updateTender(id, { status })

    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath('/[locale]/tenders', 'page')
    revalidatePath(`/[locale]/tenders/${id}`, 'page')
    
    return { success: true, data: { id } }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update tender status' 
    }
  }
}
