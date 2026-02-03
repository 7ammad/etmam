/**
 * Booklet PDF Parser
 *
 * Parses Saudi Government Tender RFP booklets (Kurrasa) and extracts
 * structured data using AI-powered extraction.
 */

import { generateObject, APICallError, NoObjectGeneratedError } from 'ai'
import { getAIModel, isAIConfigured } from '@/lib/ai/client'
import {
  bookletExtractionResponseSchema,
  type BookletMetadata,
  type BookletExtractionResponse,
  BOOKLET_EXTRACTION_SYSTEM_PROMPT,
  createBookletExtractionPrompt,
} from './booklet-schema'

/**
 * Parse result from booklet PDF extraction
 */
export type BookletParseResult =
  | { success: true; data: BookletMetadata }
  | { success: false; error: string }

/**
 * Extract text content from a PDF buffer using pdf-parse v1 (simple function API)
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // pdf-parse v1 has a simple default export function
  const pdfParse = (await import('pdf-parse')).default
  const result = await pdfParse(buffer)
  return result.text
}

/**
 * Call AI model to extract structured data from PDF text
 */
async function extractWithAI(
  pdfText: string,
  maxRetries: number = 3
): Promise<BookletExtractionResponse> {
  const model = getAIModel()
  let lastError: unknown = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await generateObject({
        model,
        schema: bookletExtractionResponseSchema,
        prompt: createBookletExtractionPrompt(pdfText),
        system: BOOKLET_EXTRACTION_SYSTEM_PROMPT,
        temperature: 0.2, // Low temperature for consistent extraction
        maxRetries: 0, // We handle retries manually
      })
      return result.object
    } catch (error: unknown) {
      lastError = error

      // Handle specific AI SDK errors
      if (error instanceof APICallError) {
        const statusCode = error.statusCode

        // Rate limit (429) - exponential backoff
        if (statusCode === 429) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          console.warn(
            `[BookletParser] Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          )
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        // Server errors (5xx) - retry with backoff
        if (statusCode && statusCode >= 500) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          console.warn(
            `[BookletParser] Server error ${statusCode}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          )
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        // Auth errors (401) - don't retry
        if (statusCode === 401) {
          throw new Error(`AI API authentication failed: ${error.message}`)
        }

        // Other 4xx errors - don't retry
        throw new Error(
          `AI API call failed: ${error.message}${statusCode ? ` (status: ${statusCode})` : ''}`
        )
      }

      // Handle schema validation failures
      if (error instanceof NoObjectGeneratedError) {
        console.error('[BookletParser] Model failed to generate valid object matching schema')
        throw new Error(
          `AI failed to generate valid extraction output: ${error.message}`
        )
      }

      // Network/timeout errors - retry with backoff
      if (
        error instanceof Error &&
        (error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('ETIMEDOUT'))
      ) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
        console.warn(
          `[BookletParser] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Unknown error - don't retry
      throw error
    }
  }

  // All retries exhausted
  const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error'
  throw new Error(`Failed to extract booklet data after ${maxRetries} attempts: ${errorMessage}`)
}

/**
 * Parse a booklet PDF and extract structured metadata
 *
 * @param buffer - PDF file as a Buffer
 * @returns Extracted booklet metadata or error
 */
export async function parseBookletPDF(buffer: Buffer): Promise<BookletParseResult> {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return {
        success: false,
        error: 'AI provider is not configured. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY.',
      }
    }

    // Extract text from PDF
    console.log('[BookletParser] Extracting text from PDF...')
    const pdfText = await extractTextFromPDF(buffer)

    if (!pdfText || pdfText.trim().length < 100) {
      return {
        success: false,
        error: 'PDF appears to be empty or contains very little text. It may be a scanned document.',
      }
    }

    console.log(`[BookletParser] Extracted ${pdfText.length} characters from PDF`)

    // Extract structured data using AI
    console.log('[BookletParser] Running AI extraction...')
    const extraction = await extractWithAI(pdfText)

    // Build final metadata
    const metadata: BookletMetadata = {
      boq_items: extraction.boq_items,
      evaluation_weights: extraction.evaluation_weights,
      local_content_target: extraction.local_content_target,
      extraction_confidence: extraction.confidence,
      extracted_at: new Date().toISOString(),
      source_text_length: pdfText.length,
      extraction_notes: extraction.notes,
    }

    console.log('[BookletParser] Extraction complete:', {
      boq_items_count: metadata.boq_items?.length ?? 0,
      has_weights: !!metadata.evaluation_weights,
      local_content: metadata.local_content_target,
      confidence: metadata.extraction_confidence,
    })

    return { success: true, data: metadata }
  } catch (error) {
    console.error('[BookletParser] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse booklet PDF',
    }
  }
}

/**
 * Validate that a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  const type = file.type.toLowerCase()
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()

  return type === 'application/pdf' || extension === '.pdf'
}
