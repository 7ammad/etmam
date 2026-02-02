/**
 * Title-based Estimated Value from historical awarded tenders.
 * Uses token similarity (BM25-like) over historical JSON; EV = median(award_amount_sar) of top K matches.
 * Currency: historical award_amount_sar in JSON is halala → we normalize to SAR when loading.
 */

import * as fs from 'fs'
import * as path from 'path'
import { toSar } from '@/lib/currency'

const TOP_K = 25
const DEFAULT_HISTORICAL_PATH = path.join(
  process.cwd(),
  'scraper-output',
  'run-historical-2026-02-01T12-22-15-075Z.json'
)

export interface HistoricalTenderEntry {
  title: string
  /** award_amount in SAR (normalized from halala in file) */
  award_amount_sar: number
  reference_no?: string
}

export interface TitleSimilarityEVResult {
  evSar: number
  confidence: number
  matched_examples_count: number
  method: 'title_similarity'
  /** P25/P75 of matched amounts for range (when available) */
  p25Sar?: number
  p75Sar?: number
  /** Top matches for debug/sanity (title + award_amount_sar) */
  matched_examples?: Array<{ title: string; award_amount_sar: number; reference_no?: string }>
}

/** Normalize text for tokenization: strip extra spaces, lowercase ASCII, keep Arabic */
function normalizeForTokens(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  )
}

/** Tokenize: split on non-word (Unicode letters/numbers), filter length >= 2 */
function tokenize(text: string): string[] {
  const normalized = normalizeForTokens(text)
  const tokens = normalized.split(/[\s\p{P}\p{S}]+/u).filter((t) => t.length >= 2)
  return [...new Set(tokens)]
}

/** BM25-like score: sum over query terms of (tf in doc) * idf. Simple variant. */
function bm25Score(queryTokens: string[], docTokens: string[], idf: Map<string, number>): number {
  let score = 0
  for (const qt of queryTokens) {
    const tf = docTokens.filter((t) => t === qt).length
    if (tf === 0) continue
    const idfVal = idf.get(qt) ?? 1
    score += tf * idfVal
  }
  return score
}

let cachedIndex: {
  entries: HistoricalTenderEntry[]
  tokenToDocs: Map<string, Set<number>>
  docTokens: string[][]
  idf: Map<string, number>
} | null = null

function getHistoricalPath(): string {
  const envPath = process.env.HISTORICAL_TENDERS_JSON
  if (envPath && fs.existsSync(envPath)) return envPath
  if (fs.existsSync(DEFAULT_HISTORICAL_PATH)) return DEFAULT_HISTORICAL_PATH
  return DEFAULT_HISTORICAL_PATH
}

/**
 * Load historical tenders from JSON. Normalize award_amount_sar from halala to SAR.
 */
function loadHistoricalTenders(filePath: string): HistoricalTenderEntry[] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw) as { tenders?: unknown[]; mode?: string }
  const tenders = Array.isArray(data.tenders) ? data.tenders : []
  const entries: HistoricalTenderEntry[] = []

  for (const t of tenders) {
    const row = t as {
      title?: string
      award_amount_sar?: number | null
      reference_no?: string
    }
    const title = typeof row.title === 'string' ? row.title : ''
    const rawAward = row.award_amount_sar
    if (!title || rawAward == null || rawAward <= 0) continue
    const awardSar = toSar(rawAward, 'award_amount_sar')
    if (awardSar <= 0) continue
    entries.push({
      title,
      award_amount_sar: awardSar,
      reference_no: row.reference_no,
    })
  }

  return entries
}

/**
 * Build in-memory index: doc tokens, token→doc set, idf.
 */
function buildIndex(entries: HistoricalTenderEntry[]): void {
  const docTokens = entries.map((e) => tokenize(e.title))
  const tokenToDocs = new Map<string, Set<number>>()
  docTokens.forEach((tokens, docId) => {
    tokens.forEach((t) => {
      let set = tokenToDocs.get(t)
      if (!set) {
        set = new Set()
        tokenToDocs.set(t, set)
      }
      set.add(docId)
    })
  })
  const N = entries.length
  const idf = new Map<string, number>()
  tokenToDocs.forEach((docSet, term) => {
    const df = docSet.size
    idf.set(term, Math.log((N - df + 0.5) / (df + 0.5) + 1))
  })
  cachedIndex = { entries, tokenToDocs, docTokens, idf }
}

/**
 * Estimate EV from title similarity against historical awarded tenders.
 * Returns median(award_amount_sar) of top K matches; confidence from match count and spread.
 */
export function estimateEvFromTitleSimilarity(
  queryTitle: string,
  options?: { historicalPath?: string; topK?: number }
): TitleSimilarityEVResult | null {
  const historicalPath = options?.historicalPath ?? getHistoricalPath()
  if (!fs.existsSync(historicalPath)) return null

  const entries = loadHistoricalTenders(historicalPath)
  if (entries.length === 0) return null

  if (!cachedIndex || cachedIndex.entries.length !== entries.length) {
    buildIndex(entries)
  }
  const index = cachedIndex!
  const k = Math.min(options?.topK ?? TOP_K, index.entries.length)
  const queryTokens = tokenize(queryTitle)
  if (queryTokens.length === 0) return null

  const scores: { docId: number; score: number }[] = []
  index.docTokens.forEach((docTokens, docId) => {
    const score = bm25Score(queryTokens, docTokens, index.idf)
    if (score > 0) scores.push({ docId, score })
  })

  scores.sort((a, b) => b.score - a.score)
  const topDocIds = scores.slice(0, k).map((s) => s.docId)
  const amounts = topDocIds
    .map((id) => index.entries[id].award_amount_sar)
    .filter((a) => a > 0)

  if (amounts.length === 0) return null

  amounts.sort((a, b) => a - b)
  const median =
    amounts.length % 2 === 1
      ? amounts[Math.floor(amounts.length / 2)]
      : (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2

  const p25 = amounts[Math.floor(amounts.length * 0.25)] ?? median
  const p75 = amounts[Math.floor(amounts.length * 0.75)] ?? median
  const spread = p25 > 0 ? p75 / p25 : 0
  const confidenceFromSpread = spread <= 2 ? 85 : spread <= 4 ? 70 : 55
  const confidenceFromCount =
    amounts.length >= 10 ? 90 : amounts.length >= 5 ? 75 : amounts.length >= 1 ? 60 : 50
  const confidence = Math.round((confidenceFromCount + confidenceFromSpread) / 2)

  const matched_examples = topDocIds.slice(0, 3).map((id) => ({
    title: index.entries[id].title,
    award_amount_sar: index.entries[id].award_amount_sar,
    reference_no: index.entries[id].reference_no,
  }))

  return {
    evSar: Math.round(median),
    confidence: Math.min(100, Math.max(0, confidence)),
    matched_examples_count: amounts.length,
    method: 'title_similarity',
    p25Sar: Math.round(p25),
    p75Sar: Math.round(p75),
    matched_examples,
  }
}

/**
 * Clear cached index (e.g. for tests or when historical file changes).
 */
export function clearTitleSimilarityCache(): void {
  cachedIndex = null
}
