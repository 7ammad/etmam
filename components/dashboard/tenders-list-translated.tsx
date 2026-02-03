import type { TenderWithEvaluation } from '@/lib/queries/tender'
import { getCachedTranslations, getCachedSummaries, TARGET_LANG_EN } from '@/lib/translation-cache'
import { isAIConfigured } from '@/lib/ai/client'
import { TendersListClient } from './tenders-list-client'

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').normalize('NFC')
}

type Props = {
  tenders: TenderWithEvaluation[]
  locale: string
}

/**
 * Async Server Component: reads only from phrase_translations cache. No translation or summarization on refresh.
 * Translations/summaries are filled by the feeder: POST /api/cron/feed-translations (run separately after sync or on schedule).
 */
export async function TendersListTranslated({ tenders, locale }: Props) {
  const entities = [...new Set(tenders.map((t) => t.entity).filter(Boolean))] as string[]
  const titles = [...new Set(tenders.map((t) => t.title).filter(Boolean))] as string[]

  if (isAIConfigured() && (entities.length > 0 || titles.length > 0)) {
    const [entitySummaryMap, titleSummaryMap] = await Promise.all([
      getCachedSummaries(entities, TARGET_LANG_EN, 'entity_summary'),
      getCachedSummaries(titles, TARGET_LANG_EN, 'title_summary'),
    ])
    const entityWithNorm: Record<string, string> = { ...entitySummaryMap }
    for (const [k, v] of Object.entries(entitySummaryMap)) {
      if (v) entityWithNorm[normalizeKey(k)] = v
    }
    const titleWithNorm: Record<string, string> = { ...titleSummaryMap }
    for (const [k, v] of Object.entries(titleSummaryMap)) {
      if (v) titleWithNorm[normalizeKey(k)] = v
    }
    return (
      <TendersListClient
        tenders={tenders}
        locale={locale}
        translationMap={null}
        entitySummaryMap={entityWithNorm}
        titleSummaryMap={titleWithNorm}
      />
    )
  }

  const phrases = [...new Set([...entities, ...titles])]
  if (phrases.length === 0) {
    return <TendersListClient tenders={tenders} locale={locale} translationMap={null} />
  }

  const translationMap = await getCachedTranslations(phrases, TARGET_LANG_EN)
  const withNormalized: Record<string, string> = { ...translationMap }
  for (const [key, value] of Object.entries(translationMap)) {
    if (value) withNormalized[normalizeKey(key)] = value
  }

  return <TendersListClient tenders={tenders} locale={locale} translationMap={withNormalized} />
}
