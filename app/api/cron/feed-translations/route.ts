/**
 * Cron feeder: populates phrase_translations for the dashboard table.
 * Also run automatically after POST /api/cron/sync (same pipeline).
 *
 * POST /api/cron/feed-translations
 *   - Requires Authorization: Bearer <CRON_SECRET>
 *   - Fetches tenders, fills cache (AI summaries or LibreTranslate). Cache-miss only.
 *
 * GET /api/cron/feed-translations
 *   - Same auth; returns usage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runFeedDashboardTranslations } from '@/lib/feed-dashboard-translations'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  return typeof process.env.CRON_SECRET === 'string' && token === process.env.CRON_SECRET
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runFeedDashboardTranslations()
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: result.error },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    tenders: result.tenders,
    entitySummarized: result.entitySummarized,
    titleSummarized: result.titleSummarized,
    translated: result.translated,
  })
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    endpoint: '/api/cron/feed-translations',
    method: 'POST',
    description: 'Feeds phrase_translations cache. Also runs automatically after POST /api/cron/sync.',
    authorization: 'Bearer <CRON_SECRET>',
  })
}
