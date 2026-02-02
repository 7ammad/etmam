import { translateArabicToEnglishBatch } from '@/lib/ai/translate'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import { TendersListClient } from './tenders-list-client'

type Props = {
  tenders: TenderWithEvaluation[]
  locale: string
}

/**
 * Async Server Component: fetches translation then renders the list in English.
 * Used inside Suspense so the page shell streams immediately and this streams in when ready.
 */
export async function TendersListTranslated({ tenders, locale }: Props) {
  const phrases = [...new Set(tenders.flatMap((t) => [t.entity, t.title].filter(Boolean)) as string[])]
  const translationMap = phrases.length > 0 ? await translateArabicToEnglishBatch(phrases) : null
  return <TendersListClient tenders={tenders} locale={locale} translationMap={translationMap} />
}
