/**
 * Cron Sync API Endpoint
 *
 * Receives scraped tender data and upserts into Supabase.
 * Designed to be called by the scraper script (via GitHub Actions or manual execution).
 *
 * POST /api/cron/sync
 *   - Requires Authorization: Bearer <CRON_SECRET>
 *   - Body: { tenders: ScrapedTender[], metadata: ScrapeMetadata }
 *   - Returns: { success: boolean, upserted: number, errors: string[] }
 *
 * GET /api/cron/sync
 *   - Returns usage instructions (for debugging)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { toSar } from '@/lib/currency'
import { runFeedDashboardTranslations } from '@/lib/feed-dashboard-translations'
import { recalculateCalibration } from '@/lib/evaluation/calibration-service'
import { scrapedTenderSchema } from '@/types/scraper'
import type { SyncPayload, SyncResponse, ScrapedTender } from '@/types/scraper'
import type { Database, Json } from '@/types/database'

type TenderInsert = Database['public']['Tables']['tenders']['Insert']

/**
 * API Configuration Constants
 */
const MAX_REQUEST_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_TENDERS = 1000 // Maximum tenders per request

/**
 * System user ID for scraped tenders
 * This user owns all tenders imported via the scraper
 * 
 * Fail fast if missing to prevent data integrity issues
 */
const SYSTEM_USER_ID_ENV = process.env.SYSTEM_USER_ID
if (!SYSTEM_USER_ID_ENV) {
  throw new Error(
    'SYSTEM_USER_ID environment variable is required. Set it in .env.local'
  )
}
// TypeScript: After the check above, we know it's a string
const SYSTEM_USER_ID: string = SYSTEM_USER_ID_ENV

/**
 * Verify the CRON_SECRET authorization header
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[Sync API] CRON_SECRET not configured in environment')
    return false
  }

  // Support both "Bearer <token>" and raw token formats
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader

  return token === cronSecret
}

/**
 * Convert a ScrapedTender to the database format.
 * All scraped information (including every tab and award fields) is stored in raw_data under this tender.
 */
function tenderToDbFormat(tender: ScrapedTender): TenderInsert {
  // Normalize money fields from halala to SAR at ingest (100x bug fix)
  const estimated_value =
    tender.estimated_value != null ? toSar(tender.estimated_value, 'estimated_value') : null
  const booklet_price_sar =
    tender.booklet_price != null ? toSar(tender.booklet_price, 'booklet_price') : null
  const award_amount_sar =
    tender.award_amount_sar != null ? toSar(tender.award_amount_sar, 'award_amount_sar') : null

  return {
    user_id: SYSTEM_USER_ID,
    reference_no: tender.reference_no,
    title: tender.title,
    entity: tender.entity,
    deadline: tender.deadline,
    estimated_value,
    description: tender.description ?? null,
    source: 'etimad',
    status: 'pending',
    booklet_price_sar,
    initial_guarantee_sar: tender.initial_guarantee ?? null,
    project_duration: tender.contract_duration ?? null,
    award_amount_sar,
    award_date: tender.award_date ?? null,
    winning_bidder: tender.winning_bidder ?? null,
    raw_data: {
      ...tender,
      tab_sections: tender.tab_sections,
    } as Json,
  }
}

/**
 * POST handler - receive and store scraped tenders
 */
export async function POST(request: NextRequest) {
  console.log('[Sync API] Received POST request')

  // Security: Verify authorization (CRON_SECRET is sufficient for cron endpoint)
  if (!verifyCronSecret(request)) {
    console.warn('[Sync API] Unauthorized request')
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Valid CRON_SECRET required' },
      { status: 401 }
    )
  }

  // Security: Check request size limit (10MB max)
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
    return NextResponse.json(
      { error: 'Payload Too Large', message: 'Request body exceeds 10MB limit' },
      { status: 413 }
    )
  }

  try {
    // Parse request body
    const body: SyncPayload = await request.json()

    console.log(`[Sync API] Received body.tenders length: ${body?.tenders?.length ?? 'missing'}`)

    // Validate payload structure
    if (!body.tenders || !Array.isArray(body.tenders)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'tenders array is required' },
        { status: 400 }
      )
    }

    if (body.tenders.length === 0) {
      return NextResponse.json({
        success: true,
        upserted: 0,
        errors: [],
        message: 'No tenders to sync',
      })
    }

    // Security: Validate array length limit
    if (body.tenders.length > MAX_TENDERS) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: `Maximum ${MAX_TENDERS} tenders per request. Received ${body.tenders.length}`,
        },
        { status: 400 }
      )
    }

    // Security: Validate all tenders with Zod schema (runtime validation)
    // Using z.array() for batch validation (more efficient than loop)
    const tendersArraySchema = z.array(scrapedTenderSchema)
    const validationResult = tendersArraySchema.safeParse(body.tenders)

    if (!validationResult.success) {
      console.error('[Sync API] Validation errors:', validationResult.error.errors)
      
      // Format errors for client (limit to first 10)
      const formattedErrors = validationResult.error.errors
        .slice(0, 10)
        .map((err) => {
          const index = err.path[0] as number
          const tender = body.tenders[index]
          const field = err.path.slice(1).join('.') || 'root'
          return `Tender ${index + 1} (${tender?.reference_no || 'unknown'}): ${field} - ${err.message}`
        })

      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Tender validation failed',
          errors: formattedErrors,
        },
        { status: 400 }
      )
    }

    // Use validated data (Zod has already validated and typed it)
    const validatedTenders = validationResult.data

    console.log(`[Sync API] Processing ${validatedTenders.length} tenders`)

    // Create Supabase service client (bypasses RLS)
    const supabase = createServiceClient()

    // Convert all tenders to DB format (React Best Practice 1.4: batch operations)
    // Using validatedTenders ensures type safety after Zod validation
    const dbTenders = validatedTenders.map((tender) => tenderToDbFormat(tender))

    // Batch upsert all tenders at once (Postgres Best Practice 6.1: Batch INSERT)
    // This is 10-50x faster than sequential upserts
    const { data, error } = await supabase
      .from('tenders')
      .upsert(dbTenders as TenderInsert[], {
        onConflict: 'user_id,reference_no',
        ignoreDuplicates: false,
      })

    const results: SyncResponse = {
      success: true,
      upserted: 0,
      errors: [],
    }

    if (error) {
      // Log full error details for debugging (server-side only)
      console.error(`[Sync API] Batch upsert error:`, error.message)
      console.error(`[Sync API] Error code:`, error.code)
      console.error(`[Sync API] Failed tenders count:`, validatedTenders.length)
      console.error(`[Sync API] Failed tender references:`, validatedTenders.map((t) => t.reference_no))

      // Return actual error so dashboard/child can show it (needed to fix sync)
      results.errors.push(error.message || `Database error: Failed to upsert tenders`)
      results.success = false
      results.upserted = 0
    } else {
      // Success: all tenders upserted atomically
      results.upserted = validatedTenders.length

      // Automated feeder: fill phrase_translations so dashboard reads from cache (no translation on refresh)
      const feed = await runFeedDashboardTranslations()
      if (!feed.ok) {
        console.warn('[Sync API] Feed translations failed (non-fatal):', feed.error)
      } else {
        console.log(
          `[Sync API] Feed translations: ${feed.entitySummarized} entities, ${feed.titleSummarized} titles, ${feed.translated} translated`
        )
      }
      Object.assign(results, { feed })

      // Auto-calibration: recalculate V2 engine calibration from historic tenders (zero-touch)
      try {
        const calibration = await recalculateCalibration()
        if (calibration) {
          console.log(
            `[Auto-Calibration] Updated engine stats based on ${calibration.sample_size} historic records.`
          )
        }
      } catch (calErr) {
        console.warn('[Sync API] Auto-calibration failed (non-fatal):', calErr)
      }
    }

    console.log(
      `[Sync API] Complete: ${results.upserted} upserted, ${results.errors.length} errors`
    )

    // Include metadata in response if provided
    if (body.metadata) {
      return NextResponse.json({
        ...results,
        metadata: body.metadata,
      })
    }

    return NextResponse.json(results)
  } catch (err) {
    console.error('[Sync API] Fatal error:', err)
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
  // Verify auth even for GET (optional, for security)
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    endpoint: '/api/cron/sync',
    method: 'POST',
    description: 'Sync scraped tenders to database',
    authorization: 'Bearer <CRON_SECRET>',
    requestBody: {
      tenders: [
        {
          reference_no: 'string (required)',
          title: 'string (required)',
          entity: 'string (required)',
          deadline: 'string (required, ISO date)',
          estimated_value: 'number (optional)',
          booklet_price: 'number (optional)',
          initial_guarantee: 'number (optional)',
          contract_duration: 'string (optional)',
          description: 'string (optional)',
          tender_url: 'string (optional)',
          source: "'etimad' (required)",
          scraped_at: 'string (required, ISO timestamp)',
        },
      ],
      metadata: {
        startedAt: 'string (ISO timestamp)',
        completedAt: 'string (ISO timestamp)',
        totalScraped: 'number',
        totalErrors: 'number',
      },
    },
    response: {
      success: 'boolean',
      upserted: 'number',
      errors: 'string[]',
    },
  })
}
