/**
 * Odoo Excel export — shared logic for script and API.
 * Builds Odoo_Leads_Import.xlsx buffer from scored tenders and optional scraped map.
 * Columns per handover checklist: Name, Customer, Expected Revenue, Closing Date,
 * Description, Score, Recommendation, Tender Number, Source.
 *
 * Loader (loadScoredFileAndScrapedMap) is Node-only (uses fs/path).
 */

import * as fs from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'
import type { ScoredTender } from '@/lib/evaluation'
import { scrapedTenderSchema, type ScrapedTender } from '@/types/scraper'

const SHEET_NAME = 'Leads'

export interface ScoredFile {
  generated_at?: string
  source_file?: string
  config_used?: string
  tenders: ScoredTender[]
}

/** Raw scraped file shape (from scraper-output JSON). */
interface ScraperOutputFile {
  tenders?: unknown[]
  metadata?: unknown
}

function normalizeToScrapedTender(item: unknown): ScrapedTender | null {
  if (item == null || typeof item !== 'object') return null
  const obj = item as Record<string, unknown>
  if (!obj.tab_sections || typeof obj.tab_sections !== 'object') {
    obj.tab_sections = { basic_info: {} }
  }
  const parsed = scrapedTenderSchema.safeParse(obj)
  return parsed.success ? parsed.data : null
}

function resolveScrapedPath(sourceFile: string, cwd: string): string | null {
  const candidates = [
    path.join(cwd, 'scraper-output', sourceFile),
    path.join(cwd, 'data', sourceFile),
    path.join(cwd, sourceFile),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

export interface LoadScoredResult {
  scoredData: ScoredFile
  scrapedByRef: Map<string, ScrapedTender>
}

/**
 * Load scored JSON from disk and optionally join scraped tenders by source_file.
 * Node-only (uses fs). Throws if scored file missing or invalid.
 */
export function loadScoredFileAndScrapedMap(
  scoredPath: string,
  cwd: string = process.cwd()
): LoadScoredResult {
  if (!fs.existsSync(scoredPath)) {
    throw new Error(`Scored file not found: ${scoredPath}`)
  }
  const raw = fs.readFileSync(scoredPath, 'utf-8')
  const scoredData = JSON.parse(raw) as ScoredFile
  const tenders = scoredData.tenders ?? []
  if (!Array.isArray(tenders) || tenders.length === 0) {
    throw new Error('No tenders in scored file.')
  }
  let scrapedByRef = new Map<string, ScrapedTender>()
  const sourceFile = scoredData.source_file
  if (sourceFile) {
    const scrapedPath = resolveScrapedPath(sourceFile, cwd)
    if (scrapedPath) {
      try {
        const scrapedRaw = fs.readFileSync(scrapedPath, 'utf-8')
        const scrapedData = JSON.parse(scrapedRaw) as ScraperOutputFile
        const tendersRaw = scrapedData.tenders ?? []
        for (const item of tendersRaw) {
          const t = normalizeToScrapedTender(item)
          if (t) scrapedByRef.set(t.reference_no, t)
        }
      } catch {
        // Use scored data only; some columns may be empty
      }
    }
  }
  return { scoredData, scrapedByRef }
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  qualified: 'Pursue',
  conditional: 'Monitor',
  excluded: 'Ignore',
}

const RECOMMENDATION_ORDER: Record<string, number> = {
  Pursue: 0,
  Monitor: 1,
  Ignore: 2,
}

function formatDescription(
  reference_no: string,
  score: number,
  recommendation: string,
  reasons: string[]
): string {
  const lines = [
    `Tender Number: ${reference_no}`,
    `Score: ${score} | Recommendation: ${recommendation}`,
    ...reasons.map((r) => `- ${r}`),
  ]
  return lines.join('\n')
}

function normalizeRecommendation(rec: string): string {
  return RECOMMENDATION_LABELS[rec] ?? rec
}

export interface BuildOdooWorkbookResult {
  buffer: Buffer
  rowCount: number
}

/**
 * Build Odoo Leads Excel workbook buffer. Throws on duplicate Tender Numbers.
 */
export function buildOdooWorkbook(
  scoredData: ScoredFile,
  scrapedByRef: Map<string, ScrapedTender>
): BuildOdooWorkbookResult {
  const scoredTenders = scoredData.tenders ?? []
  if (!Array.isArray(scoredTenders) || scoredTenders.length === 0) {
    throw new Error('No tenders in scored file.')
  }

  const recLabel = (rec: string) => normalizeRecommendation(rec)
  const rows: Array<{
    Name: string
    Customer: string
    'Expected Revenue': number | ''
    'Closing Date': string
    Description: string
    Score: number
    Recommendation: string
    'Tender Number': string
    Source: string
    _sortRec: number
    _sortScore: number
  }> = []

  const seenRefs = new Set<string>()
  const duplicates: string[] = []

  for (const s of scoredTenders) {
    if (seenRefs.has(s.reference_no)) duplicates.push(s.reference_no)
    seenRefs.add(s.reference_no)

    const scraped = scrapedByRef.get(s.reference_no)
    const recommendation = recLabel(s.recommendation)
    const reasons = s.reasons?.length ? s.reasons : ['No specific reasons recorded']
    rows.push({
      Name: scraped?.title ?? s.title ?? '',
      Customer: scraped?.entity ?? '',
      'Expected Revenue': scraped?.estimated_value ?? '',
      'Closing Date': scraped?.deadline ?? '',
      Description: formatDescription(s.reference_no, s.score, recommendation, reasons),
      Score: s.score,
      Recommendation: recommendation,
      'Tender Number': s.reference_no,
      Source: scraped?.source ?? 'etimad',
      _sortRec: RECOMMENDATION_ORDER[recommendation] ?? 2,
      _sortScore: s.score,
    })
  }

  if (duplicates.length > 0) {
    throw new Error(`Duplicate Tender Numbers detected: ${duplicates.join(', ')}`)
  }

  rows.sort((a, b) => {
    if (a._sortRec !== b._sortRec) return a._sortRec - b._sortRec
    if (b._sortScore !== a._sortScore) return b._sortScore - a._sortScore
    return (a['Tender Number'] ?? '').localeCompare(b['Tender Number'] ?? '')
  })

  const exportRows = rows.map(({ _sortRec, _sortScore, ...r }) => r)
  const headers = [
    'Name',
    'Customer',
    'Expected Revenue',
    'Closing Date',
    'Description',
    'Score',
    'Recommendation',
    'Tender Number',
    'Source',
  ]
  const aoa: (string | number)[][] = [headers]
  for (const r of exportRows) {
    aoa.push([
      r.Name,
      r.Customer,
      r['Expected Revenue'],
      r['Closing Date'],
      r.Description,
      r.Score,
      r.Recommendation,
      r['Tender Number'],
      r.Source,
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME)
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return { buffer, rowCount: exportRows.length }
}
