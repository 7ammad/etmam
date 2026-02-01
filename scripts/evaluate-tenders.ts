/**
 * Step 3A: Load latest scraper output, run rule-based scoring, write data/tenders.scored.json.
 *
 * Usage: pnpm evaluate-tenders [path-to-scraper-output.json]
 *   If no path given, uses the most recent file in scraper-output/*.json.
 */

import * as fs from 'fs'
import * as path from 'path'
import { scoreTender, type ScoredTender } from '@/lib/evaluation'
import { scrapedTenderSchema, type ScrapedTender } from '@/types/scraper'

const SCRAPER_OUTPUT_DIR = path.join(process.cwd(), 'scraper-output')
const DATA_DIR = path.join(process.cwd(), 'data')
const SCORED_OUTPUT_PATH = path.join(DATA_DIR, 'tenders.scored.json')
const CONFIG_PATH = path.join(process.cwd(), 'config', 'scoring.config.json') // for loadConfig()

interface ScraperOutputFile {
  tenders?: unknown[]
  metadata?: unknown
}

function findLatestScraperOutput(dir: string): string | null {
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
  if (files.length === 0) return null
  const withStats = files.map((f) => ({
    name: f,
    mtime: fs.statSync(path.join(dir, f)).mtime.getTime(),
  }))
  withStats.sort((a, b) => b.mtime - a.mtime)
  return path.join(dir, withStats[0].name)
}

function loadConfig(): import('@/lib/evaluation').ScoringConfig | null {
  if (!fs.existsSync(CONFIG_PATH)) return null
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as import('@/lib/evaluation').ScoringConfig
  } catch (err) {
    console.error('Failed to parse config file:', CONFIG_PATH, err instanceof Error ? err.message : err)
    return null
  }
}

function normalizeToScrapedTender(item: unknown): ScrapedTender | null {
  if (item == null || typeof item !== 'object') return null
  const obj = item as Record<string, unknown>
  // ScrapedTender requires tab_sections with at least one key; older scraper output may omit it.
  if (!obj.tab_sections || typeof obj.tab_sections !== 'object') {
    obj.tab_sections = { basic_info: {} }
  }
  const parsed = scrapedTenderSchema.safeParse(obj)
  return parsed.success ? parsed.data : null
}

function main(): void {
  const inputPath = process.argv[2] ?? findLatestScraperOutput(SCRAPER_OUTPUT_DIR)
  if (!inputPath || !fs.existsSync(inputPath)) {
    console.error('No scraper output found. Run from project root and ensure scraper-output/*.json exists, or pass a path.')
    process.exit(1)
  }

  let data: ScraperOutputFile
  try {
    const raw = fs.readFileSync(inputPath, 'utf-8')
    data = JSON.parse(raw) as ScraperOutputFile
  } catch (err) {
    console.error('Failed to parse scraper output:', inputPath, err instanceof Error ? err.message : err)
    process.exit(1)
  }
  const tendersRaw = data.tenders ?? []
  if (!Array.isArray(tendersRaw) || tendersRaw.length === 0) {
    console.error('No tenders array in', inputPath)
    process.exit(1)
  }

  const config = loadConfig()
  const tenders: ScrapedTender[] = []
  for (const item of tendersRaw) {
    const t = normalizeToScrapedTender(item)
    if (t) tenders.push(t)
    else console.warn('Skipped invalid tender:', typeof item === 'object' && item && 'reference_no' in item ? (item as { reference_no: unknown }).reference_no : 'unknown')
  }

  const scored: ScoredTender[] = tenders.map((t) => scoreTender(t, config ?? undefined))
  const output = {
    generated_at: new Date().toISOString(),
    source_file: path.basename(inputPath),
    config_used: config ? 'config/scoring.config.json' : 'default',
    tenders: scored,
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(SCORED_OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log('Wrote', scored.length, 'scored tenders to', SCORED_OUTPUT_PATH)
}

main()
