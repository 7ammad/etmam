import { z } from 'zod'

// Status enum
export const tenderStatusSchema = z.enum([
  'pending',
  'evaluating',
  'evaluated',
  'approved',
  'pushed',
  'rejected',
])

export type TenderStatus = z.infer<typeof tenderStatusSchema>

// Base tender schema for validation
export const tenderSchema = z.object({
  id: z.string().uuid().optional(),
  entity: z.string().min(1, 'Entity is required'),
  title: z.string().min(1, 'Title is required'),
  reference_no: z.string().min(1, 'Reference number is required'),
  deadline: z.coerce.date(),
  estimated_value: z.number().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  status: tenderStatusSchema.default('pending'),
  raw_data: z.record(z.unknown()).nullable().optional(),
  // Scraper fields (from Phase 0 - Deep Scraper)
  booklet_price_sar: z.number().int().positive().nullable().optional(),
  initial_guarantee_sar: z.number().positive().nullable().optional(),
  project_duration: z.string().nullable().optional(),
})

export type Tender = z.infer<typeof tenderSchema>

// Create tender schema (for form submission)
export const createTenderSchema = tenderSchema.omit({ id: true, status: true })
export type CreateTenderInput = z.infer<typeof createTenderSchema>

// Update tender schema
export const updateTenderSchema = tenderSchema.partial().required({ id: true })
export type UpdateTenderInput = z.infer<typeof updateTenderSchema>

// Tender with evaluation (for display)
export const tenderWithEvaluationSchema = tenderSchema.extend({
  evaluation: z
    .object({
      id: z.string().uuid(),
      score: z.number(),
      recommendation: z.enum(['qualified', 'conditional', 'excluded']),
      summary: z.string(),
    })
    .nullable()
    .optional(),
})

export type TenderWithEvaluation = z.infer<typeof tenderWithEvaluationSchema>

// Import mapping for Arabic columns
export const arabicColumnMapping = {
  'الجهة': 'entity',
  'جهة': 'entity',
  'عنوان المنافسة': 'title',
  'العنوان': 'title',
  'رقم المنافسة': 'reference_no',
  'الرقم': 'reference_no',
  'الموعد النهائي': 'deadline',
  'موعد التقديم': 'deadline',
  'القيمة التقديرية': 'estimated_value',
  'القيمة': 'estimated_value',
  'الوصف': 'description',
  'المصدر': 'source',
  // English fallbacks
  'Entity': 'entity',
  'Title': 'title',
  'Reference No': 'reference_no',
  'Deadline': 'deadline',
  'Estimated Value': 'estimated_value',
  'Description': 'description',
  'Source': 'source',
} as const

// Import row schema (flexible for various column names)
export const importRowSchema = z.object({
  entity: z.string().optional(),
  title: z.string().optional(),
  reference_no: z.string().optional(),
  deadline: z.string().optional(),
  estimated_value: z.union([z.string(), z.number()]).optional(),
  description: z.string().optional(),
  source: z.string().optional(),
}).passthrough() // Allow additional fields

export type ImportRow = z.infer<typeof importRowSchema>
