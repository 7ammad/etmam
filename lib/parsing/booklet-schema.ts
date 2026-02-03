/**
 * Booklet PDF Parser Schemas
 *
 * Zod schemas for AI-extracted data from Saudi Government Tender RFP booklets (Kurrasa).
 * Extracts BoQ items, evaluation weights, and local content targets.
 */

import { z } from 'zod'

/**
 * Bill of Quantities (BoQ) Item
 * Represents a single line item from the tender's BoQ table
 */
export const boqItemSchema = z.object({
  name: z.string().describe('Item description in Arabic or English'),
  quantity: z.number().nullable().describe('Quantity required (null if not specified)'),
  unit: z.string().nullable().describe('Unit of measure (e.g., متر, وحدة, طن)'),
  item_number: z.string().nullable().optional().describe('Item/line number if present'),
})

export type BoqItem = z.infer<typeof boqItemSchema>

/**
 * Evaluation Weights
 * Scoring criteria weights from the RFP (معايير تقييم العروض)
 */
export const evaluationWeightsSchema = z.object({
  financial_weight: z.number().min(0).max(100).describe('Financial/price weight percentage'),
  technical_weight: z.number().min(0).max(100).describe('Technical evaluation weight percentage'),
  other_weights: z
    .array(
      z.object({
        name: z.string(),
        weight: z.number().min(0).max(100),
      })
    )
    .nullable()
    .optional()
    .describe('Any other evaluation criteria weights'),
})

export type EvaluationWeights = z.infer<typeof evaluationWeightsSchema>

/**
 * Booklet Metadata Schema
 * Complete extracted data from an RFP PDF booklet
 */
export const bookletMetadataSchema = z.object({
  // Bill of Quantities
  boq_items: z
    .array(boqItemSchema)
    .nullable()
    .describe('Bill of Quantities items extracted from tables'),

  // Evaluation Weights
  evaluation_weights: evaluationWeightsSchema
    .nullable()
    .describe('Evaluation criteria weights (financial vs technical)'),

  // Local Content Target
  local_content_target: z
    .number()
    .min(0)
    .max(100)
    .nullable()
    .describe('Required local content percentage (المحتوى المحلي)'),

  // Extraction metadata
  extraction_confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall confidence in the extraction (0-100)'),

  extracted_at: z.string().describe('ISO timestamp of extraction'),

  // Source text length for reference
  source_text_length: z.number().optional().describe('Length of extracted PDF text'),

  // Any warnings or notes from extraction
  extraction_notes: z.string().nullable().optional().describe('Notes or warnings from AI extraction'),
})

export type BookletMetadata = z.infer<typeof bookletMetadataSchema>

/**
 * AI Extraction Response Schema
 * What the AI model returns (before adding metadata)
 */
export const bookletExtractionResponseSchema = z.object({
  boq_items: z.array(boqItemSchema).nullable(),
  evaluation_weights: evaluationWeightsSchema.nullable(),
  local_content_target: z.number().min(0).max(100).nullable(),
  confidence: z.number().min(0).max(100),
  notes: z.string().nullable(),
})

export type BookletExtractionResponse = z.infer<typeof bookletExtractionResponseSchema>

/**
 * Helper function to validate booklet metadata
 */
export function validateBookletMetadata(data: unknown): {
  success: true
  data: BookletMetadata
} | {
  success: false
  error: string
  errors: z.ZodError['errors']
} {
  const result = bookletMetadataSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    error: 'Invalid booklet metadata',
    errors: result.error.errors,
  }
}

/**
 * System prompt for AI extraction
 * Optimized for Saudi Government tender RFPs
 */
export const BOOKLET_EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing Saudi Government Tender RFP documents (Kurrasa / كراسة الشروط).

Your task is to extract structured data from the provided text. Focus on:

1. **Bill of Quantities (BoQ)** - جدول الكميات
   - Look for tables with columns like: البند, الوصف, الكمية, الوحدة, رقم البند
   - Extract item descriptions, quantities, and units
   - Include item numbers if present

2. **Evaluation Weights** - معايير تقييم العروض
   - Look for: الوزن النسبي, النسبة المئوية, معايير التقييم
   - Common patterns: "السعر 70% / الفني 30%" or "المالي / التقني"
   - Total should add up to 100%

3. **Local Content Target** - المحتوى المحلي
   - Look for: نسبة المحتوى المحلي, الحد الأدنى للمحتوى المحلي
   - Usually expressed as a percentage (e.g., 40%, 60%)

Important:
- Return null for any field you cannot find with high confidence
- Prefer Arabic field names when extracting from Arabic documents
- Be conservative - it's better to return null than to guess incorrectly`

/**
 * User prompt template for AI extraction
 */
export function createBookletExtractionPrompt(pdfText: string): string {
  return `Analyze this Saudi Government Tender RFP document and extract the required information.

Return a JSON object with:
- boq_items: Array of {name, quantity, unit, item_number} or null if not found
- evaluation_weights: {financial_weight, technical_weight, other_weights} or null if not found
- local_content_target: Number (percentage) or null if not found
- confidence: Your confidence level (0-100) in the overall extraction
- notes: Any important observations or warnings

Document text:
---
${pdfText.slice(0, 50000)}
---

${pdfText.length > 50000 ? `[Text truncated - original length: ${pdfText.length} characters]` : ''}`
}
