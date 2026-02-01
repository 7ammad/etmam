/**
 * GET /api/export/last
 *
 * Returns metadata for the last Odoo Excel export (timestamp, path, rowCount).
 * Reads output/.last-export.json. Returns 404 if no export has been run yet.
 */

import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const OUTPUT_DIR = path.join(process.cwd(), 'output')
const LAST_EXPORT_PATH = path.join(OUTPUT_DIR, '.last-export.json')

export interface LastExportMeta {
  timestamp: string
  path: string
  rowCount: number
}

export async function GET() {
  if (!fs.existsSync(LAST_EXPORT_PATH)) {
    return NextResponse.json(
      { error: 'Not found', message: 'No export has been run yet' },
      { status: 404 }
    )
  }
  try {
    const raw = fs.readFileSync(LAST_EXPORT_PATH, 'utf-8')
    const meta = JSON.parse(raw) as LastExportMeta
    return NextResponse.json(meta)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read last export'
    console.error('[Export Last]', message, err)
    return NextResponse.json(
      { error: 'Failed to read last export', message },
      { status: 500 }
    )
  }
}
