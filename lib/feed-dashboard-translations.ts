/**
 * Feeds phrase_translations cache for the dashboard table.
 *
 * Best practice for daily-updated content (per translation pipeline guidance):
 * - Write-through cache: check DB cache first, translate/summarize only on miss, then save.
 * - Incremental: only uncached phrases hit AI/LibreTranslate; cache grows over time.
 * - Automated: run this after every sync so the dashboard always reads from a pre-filled cache.
 *
 * Used by: POST /api/cron/feed-translations and automatically by POST /api/cron/sync after upsert.
 */

import { getTenders } from '@/lib/queries/tender'
import {
  getCachedTranslations,
  saveTranslations,
  TARGET_LANG_EN,
} from '@/lib/translation-cache'
import { translateBatchWithLibre } from '@/lib/libre-translate'
import { summarizeEntitiesBatch, summarizeTitlesBatch } from '@/lib/ai/summarize'
import { isAIConfigured } from '@/lib/ai/client'

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').normalize('NFC')
}

export type FeedDashboardTranslationsResult = {
  ok: boolean
  tenders: number
  entitySummarized: number
  titleSummarized: number
  translated: number
  error?: string
}

/**
 * Fetches current tenders, fills phrase_translations for entities and titles (cache-miss only).
 * Dashboard reads only from cache; this is the single place that writes translations/summaries.
 */
export async function runFeedDashboardTranslations(): Promise<FeedDashboardTranslationsResult> {
  try {
    const tenders = await getTenders()
    const entities = [...new Set(tenders.map((t) => t.entity).filter(Boolean))] as string[]
    const titles = [...new Set(tenders.map((t) => t.title).filter(Boolean))] as string[]
    const allPhrases = [...new Set([...entities, ...titles])]

    let entitySummarized = 0
    let titleSummarized = 0
    let translated = 0

    if (isAIConfigured() && (entities.length > 0 || titles.length > 0)) {
      const [entityMap, titleMap] = await Promise.all([
        summarizeEntitiesBatch(entities),
        summarizeTitlesBatch(titles),
      ])
      entitySummarized = Object.keys(entityMap).length
      titleSummarized = Object.keys(titleMap).length
    } else if (allPhrases.length > 0) {
      const cached = await getCachedTranslations(allPhrases, TARGET_LANG_EN)
      const stillToTranslate = allPhrases.filter((p) => {
        const n = normalizeKey(p)
        return cached[p] === undefined && cached[n] === undefined
      })
      if (stillToTranslate.length > 0) {
        const libreMap = await translateBatchWithLibre(stillToTranslate, 'ar', 'en')
        const toSave: Record<string, string> = {}
        for (const [k, v] of Object.entries(libreMap)) {
          if (v.trim() !== (k ?? '').trim()) toSave[k] = v
        }
        if (Object.keys(toSave).length > 0) {
          await saveTranslations(toSave, TARGET_LANG_EN)
          translated = Object.keys(toSave).length
        }
      }
    }

    return {
      ok: true,
      tenders: tenders.length,
      entitySummarized,
      titleSummarized,
      translated,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[feed-dashboard-translations]', err)
    return {
      ok: false,
      tenders: 0,
      entitySummarized: 0,
      titleSummarized: 0,
      translated: 0,
      error: message,
    }
  }
}
