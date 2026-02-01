/**
 * Evaluation Sync API Endpoint
 *
 * Receives scored tender evaluations and upserts them into Supabase.
 * Designed to be called by the evaluation script or GitHub Actions.
 *
 * POST /api/sync/evaluations
 *   - Requires Authorization: Bearer <CRON_SECRET>
 *   - Body: { evaluations: ScoredTender[], source_file?: string, generated_at?: string }
 *   - Returns: { success: boolean, upserted: number, skipped: number, errors: string[] }
 *
 * GET /api/sync/evaluations
 *   - Returns usage instructions (for debugging)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { recommendationSchema } from '@/types/evaluation'
import type { Database, Json } from '@/types/database'

type EvaluationInsert = Database['public']['Tables']['evaluations']['Insert']

/**
 * API Configuration Constants
 */
const MAX_REQUEST_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_EVALUATIONS = 500 // Maximum evaluations per request

/**
 * Zod schema for incoming scored tenders
 */
const scoredTenderSchema = z.object({
  reference_no: z.string().min(1),
  title: z.string().optional(),
  score: z.number().int().min(0).max(100),
  recommendation: recommendationSchema,
  reasons: z.array(z.string()).optional().default([]),
  summary: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  missing_requirements: z.array(z.string()).optional(),
  action_items: z.array(z.string()).optional(),
  breakdown: z.record(z.number()).optional(),
})

type ScoredTenderInput = z.infer<typeof scoredTenderSchema>

const syncPayloadSchema = z.object({
  evaluations: z.array(scoredTenderSchema),
  source_file: z.string().optional(),
  generated_at: z.string().optional(),
})

interface SyncResponse {
  success: boolean
  upserted: number
  skipped: number
  errors: string[]
}

/**
 * Verify the CRON_SECRET authorization header
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[Evaluation Sync API] CRON_SECRET not configured in environment')
    return false
  }

  // Support both "Bearer <token>" and raw token formats
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader

  return token === cronSecret
}

/**
 * POST handler - receive and store evaluations
 */
export async function POST(request: NextRequest) {
  console.log('[Evaluation Sync API] Received POST request')

  // Security: Verify authorization
  if (!verifyCronSecret(request)) {
    console.warn('[Evaluation Sync API] Unauthorized request')
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid CRON_SECRET required' },
      { status: 401 }
    )
  }

  // Security: Check request size limit
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
    return NextResponse.json(
      { error: 'Payload Too Large', message: 'Request body exceeds 5MB limit' },
      { status: 413 }
    )
  }

  try {
    // Parse request body
    const body = await request.json()

    // Validate payload structure
    const validationResult = syncPayloadSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('[Evaluation Sync API] Validation errors:', validationResult.error.errors)
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Payload validation failed',
          errors: validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).slice(0, 10),
        },
        { status: 400 }
      )
    }

    const { evaluations, source_file, generated_at } = validationResult.data

    if (evaluations.length === 0) {
      return NextResponse.json({
        success: true,
        upserted: 0,
        skipped: 0,
        errors: [],
        message: 'No evaluations to sync',
      })
    }

    // Security: Validate array length limit
    if (evaluations.length > MAX_EVALUATIONS) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: `Maximum ${MAX_EVALUATIONS} evaluations per request. Received ${evaluations.length}`,
        },
        { status: 400 }
      )
    }

    console.log(`[Evaluation Sync API] Processing ${evaluations.length} evaluations`)

    // Create Supabase service client (bypasses RLS)
    const supabase = createServiceClient()

    const results: SyncResponse = {
      success: true,
      upserted: 0,
      skipped: 0,
      errors: [],
    }

    // Process each evaluation
    for (const eval_ of evaluations) {
      // Lookup tender_id by reference_no
      const { data: tender, error: tenderError } = await supabase
        .from('tenders')
        .select('id')
        .eq('reference_no', eval_.reference_no)
        .maybeSingle()

      if (tenderError) {
        console.error(`[Evaluation Sync API] Error looking up tender ${eval_.reference_no}:`, tenderError.message)
        results.errors.push(`Tender ${eval_.reference_no}: Database lookup error`)
        continue
      }

      if (!tender) {
        console.warn(`[Evaluation Sync API] Tender not found: ${eval_.reference_no}`)
        results.skipped++
        results.errors.push(`Tender ${eval_.reference_no}: Not found in database`)
        continue
      }

      // Prepare evaluation record
      const evalRecord: EvaluationInsert = {
        tender_id: tender.id,
        score: eval_.score,
        recommendation: eval_.recommendation,
        summary: eval_.summary || eval_.reasons?.join('. ') || '',
        strengths: eval_.strengths ?? null,
        risks: eval_.risks ?? null,
        missing_requirements: eval_.missing_requirements ?? null,
        action_items: eval_.action_items ?? null,
        breakdown: (eval_.breakdown ?? {
          budget_fit: 0,
          technical_fit: 0,
          timeline_fit: 0,
          strategic_fit: 0,
          risk_score: 0,
        }) as Json,
        model_used: 'rule-based-v1',
      }

      // Upsert evaluation (update if tender_id exists, insert otherwise)
      const { error: upsertError } = await supabase
        .from('evaluations')
        .upsert(evalRecord, {
          onConflict: 'tender_id',
          ignoreDuplicates: false,
        })

      if (upsertError) {
        console.error(`[Evaluation Sync API] Upsert error for ${eval_.reference_no}:`, upsertError.message)
        results.errors.push(`Tender ${eval_.reference_no}: ${upsertError.message}`)
        continue
      }

      // Update tender status to 'evaluated'
      await supabase
        .from('tenders')
        .update({ status: 'evaluated' })
        .eq('id', tender.id)

      results.upserted++
    }

    results.success = results.errors.length === 0

    console.log(
      `[Evaluation Sync API] Complete: ${results.upserted} upserted, ${results.skipped} skipped, ${results.errors.length} errors`
    )

    return NextResponse.json({
      ...results,
      metadata: {
        source_file,
        generated_at,
        processed_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[Evaluation Sync API] Fatal error:', err)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler - return usage instructions
 */
export async function GET(request: NextRequest) {
  // Verify auth even for GET
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    endpoint: '/api/sync/evaluations',
    method: 'POST',
    description: 'Sync scored tender evaluations to database',
    authorization: 'Bearer <CRON_SECRET>',
    requestBody: {
      evaluations: [
        {
          reference_no: 'string (required)',
          title: 'string (optional)',
          score: 'number 0-100 (required)',
          recommendation: "'qualified' | 'conditional' | 'excluded' (required)",
          reasons: 'string[] (optional)',
          summary: 'string (optional)',
          strengths: 'string[] (optional)',
          risks: 'string[] (optional)',
          missing_requirements: 'string[] (optional)',
          action_items: 'string[] (optional)',
          breakdown: 'Record<string, number> (optional)',
        },
      ],
      source_file: 'string (optional)',
      generated_at: 'string (optional, ISO timestamp)',
    },
    response: {
      success: 'boolean',
      upserted: 'number',
      skipped: 'number',
      errors: 'string[]',
    },
  })
}
