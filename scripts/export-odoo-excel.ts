/**
 * Step 3B: Odoo Excel export.
 *
 * Loads data/tenders.scored.json, joins to scraped tenders by reference_no (from source_file),
 * produces output/Odoo_Leads_Import.xlsx with stable columns and deterministic ordering.
 *
 * Usage: pnpm export:odoo-excel [path-to-tenders.scored.json]
 *   If no path given, uses data/tenders.scored.json.
 */

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

function main(): void {
  const scoredPath = process.argv[2] ?? SCORED_INPUT_PATH
  const { scoredData, scrapedByRef } = loadScoredFileAndScrapedMap(
    scoredPath,
    process.cwd()
  )
  const { buffer, rowCount } = buildOdooWorkbook(scoredData, scrapedByRef)
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  fs.writeFileSync(OUTPUT_PATH, buffer)
  console.log('Wrote', rowCount, 'rows to', OUTPUT_PATH)
}

main()
