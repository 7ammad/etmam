'use server'

import { revalidatePath } from 'next/cache'
import { getTenderById, updateTender } from '@/lib/queries/tender'
import { parseBookletPDF, isPDFFile, type BookletMetadata } from '@/lib/parsing'
import { runEvaluationAction } from './evaluation'
import type { Json } from '@/types/database'

// Types for action responses
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Upload and parse a booklet PDF for a tender
 *
 * Workflow:
 * 1. Validate tender exists
 * 2. Extract file from FormData
 * 3. Parse PDF and extract structured data
 * 4. Update tender.booklet_metadata
 * 5. Optionally trigger re-evaluation
 */
export async function uploadBookletAction(
  tenderId: string,
  formData: FormData,
  options?: { triggerReEvaluation?: boolean }
): Promise<ActionResponse<{ metadata: BookletMetadata; reEvaluated: boolean }>> {
  try {
    // 1. Validate tender exists
    const tender = await getTenderById(tenderId)
    if (!tender) {
      return { success: false, error: 'Tender not found' }
    }

    // 2. Extract file from FormData
    const file = formData.get('file') as File | null
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    if (!isPDFFile(file)) {
      return { success: false, error: 'Only PDF files are supported' }
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds 10MB limit' }
    }

    // 3. Parse PDF
    console.log(`[BookletUpload] Parsing PDF for tender ${tenderId}...`)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const parseResult = await parseBookletPDF(buffer)

    if (!parseResult.success) {
      return { success: false, error: parseResult.error }
    }

    const metadata = parseResult.data

    // 4. Update tender with booklet metadata
    console.log(`[BookletUpload] Saving metadata for tender ${tenderId}...`)
    await updateTender(tenderId, {
      booklet_metadata: metadata as unknown as Json,
    })

    // 5. Optionally trigger re-evaluation
    let reEvaluated = false
    if (options?.triggerReEvaluation !== false) {
      console.log(`[BookletUpload] Triggering re-evaluation for tender ${tenderId}...`)
      const evalResult = await runEvaluationAction(tenderId)
      reEvaluated = evalResult.success
      if (!evalResult.success) {
        console.warn(`[BookletUpload] Re-evaluation failed: ${evalResult.error}`)
      }
    }

    // Revalidate cache
    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath(`/[locale]/dashboard/${tenderId}`, 'page')

    console.log(`[BookletUpload] Complete for tender ${tenderId}:`, {
      boq_items_count: metadata.boq_items?.length ?? 0,
      has_weights: !!metadata.evaluation_weights,
      local_content: metadata.local_content_target,
      confidence: metadata.extraction_confidence,
      reEvaluated,
    })

    return {
      success: true,
      data: { metadata, reEvaluated },
    }
  } catch (error) {
    console.error('[BookletUpload] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload booklet',
    }
  }
}

/**
 * Clear booklet metadata from a tender
 */
export async function clearBookletMetadataAction(
  tenderId: string
): Promise<ActionResponse> {
  try {
    const tender = await getTenderById(tenderId)
    if (!tender) {
      return { success: false, error: 'Tender not found' }
    }

    await updateTender(tenderId, { booklet_metadata: null })

    revalidatePath('/[locale]/dashboard', 'page')
    revalidatePath(`/[locale]/dashboard/${tenderId}`, 'page')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('[BookletUpload] Clear error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear booklet metadata',
    }
  }
}
