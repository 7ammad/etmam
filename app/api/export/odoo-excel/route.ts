/**
 * GET /api/export/odoo-excel
 *
 * Reads data/tenders.scored.json, builds Odoo Leads Excel workbook,
 * writes to output/Odoo_Leads_Import.xlsx and output/.last-export.json,
 * then streams the file as a download.
 */

import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import {
  loadScoredFileAndScrapedMap,
  buildOdooWorkbook,
} from '@/lib/export/odoo-excel'

const DATA_DIR = path.join(process.cwd(), 'data')
const SCORED_INPUT_PATH = path.join(DATA_DIR, 'tenders.scored.json')
const OUTPUT_DIR = path.join(process.cwd(), 'output')
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'Odoo_Leads_Import.xlsx')
const LAST_EXPORT_PATH = path.join(OUTPUT_DIR, '.last-export.json')
const FILENAME = 'Odoo_Leads_Import.xlsx'

export async function GET() {
  try {
    const { scoredData, scrapedByRef } = loadScoredFileAndScrapedMap(
      SCORED_INPUT_PATH,
      process.cwd()
    )
    const { buffer, rowCount } = buildOdooWorkbook(scoredData, scrapedByRef)

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }
    fs.writeFileSync(OUTPUT_PATH, buffer)

    const meta = {
      timestamp: new Date().toISOString(),
      path: 'output/Odoo_Leads_Import.xlsx',
      rowCount,
    }
    fs.writeFileSync(
      LAST_EXPORT_PATH,
      JSON.stringify(meta, null, 2),
      'utf-8'
    )

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${FILENAME}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed'
    console.error('[Export Odoo Excel]', message, err)
    return NextResponse.json(
      { error: 'Export failed', message },
      { status: 500 }
    )
  }
}
