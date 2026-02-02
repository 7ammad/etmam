import { translateArabicToEnglishBatch, translateEnglishToArabicBatch } from '@/lib/ai/translate'
import { getDisplayText } from '@/lib/translate-display'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import type { Tables } from '@/types/database'
import { TenderDetailView } from './tender-detail-view'

export type TenderDetailContentProps = {
  tender: TenderWithEvaluation
  locale: string
  ev: Tables<'evaluations'> | null
  hasEvaluation: boolean
  effectiveValue: { value: number | null; isEstimated: boolean }
  daysUntilDeadline: number | null
  breakdownItems: Array<{ key: string; label: string; value: number }>
}

/**
 * Async Server Component: translates content by locale then renders the detail view.
 * - English: translate entity/title (Arabic → English). Summary/risks etc. shown as stored.
 * - Arabic: entity/title shown as-is; translate summary/risks/strengths/missing_requirements/action_items (English → Arabic).
 * Used inside Suspense so the page streams a skeleton first, then this when translation is ready.
 */
export async function TenderDetailContent({
  tender,
  locale,
  ev,
  hasEvaluation,
  effectiveValue,
  daysUntilDeadline,
  breakdownItems,
}: TenderDetailContentProps) {
  let entityDisplay: string
  let titleDisplay: string
  let summaryDisplay: string | null | undefined
  let risksDisplay: string[] | null | undefined
  let strengthsDisplay: string[] | null | undefined
  let missingRequirementsDisplay: string[] | null | undefined
  let actionItemsDisplay: string[] | null | undefined

  if (locale === 'en') {
    const phrases = [tender.entity, tender.title].filter(Boolean) as string[]
    const translationMap = phrases.length > 0 ? await translateArabicToEnglishBatch(phrases) : null
    entityDisplay = getDisplayText(tender.entity, locale, translationMap) || '—'
    titleDisplay = getDisplayText(tender.title, locale, translationMap) || '—'
  } else {
    entityDisplay = tender.entity ?? '—'
    titleDisplay = tender.title ?? '—'
    if (hasEvaluation && ev) {
      const evaluationPhrases: string[] = []
      if (ev.summary != null && String(ev.summary).trim() !== '') evaluationPhrases.push(String(ev.summary).trim())
      if (ev.risks?.length) evaluationPhrases.push(...ev.risks.map(String).filter(Boolean))
      if (ev.strengths?.length) evaluationPhrases.push(...ev.strengths.map(String).filter(Boolean))
      if (ev.missing_requirements?.length) evaluationPhrases.push(...ev.missing_requirements.map(String).filter(Boolean))
      if (ev.action_items?.length) evaluationPhrases.push(...ev.action_items.map(String).filter(Boolean))
      const evalMap = evaluationPhrases.length > 0 ? await translateEnglishToArabicBatch(evaluationPhrases) : null
      const map = (s: string) => (evalMap ? evalMap[s] ?? s : s)
      summaryDisplay = ev.summary != null ? map(String(ev.summary).trim()) : null
      risksDisplay = ev.risks?.length ? ev.risks.map((r) => map(String(r))) : null
      strengthsDisplay = ev.strengths?.length ? ev.strengths.map((s) => map(String(s))) : null
      missingRequirementsDisplay = ev.missing_requirements?.length ? ev.missing_requirements.map((m) => map(String(m))) : null
      actionItemsDisplay = ev.action_items?.length ? ev.action_items.map((a) => map(String(a))) : null
    }
  }

  return (
    <TenderDetailView
      locale={locale}
      tender={tender}
      entityDisplay={entityDisplay}
      titleDisplay={titleDisplay}
      ev={ev}
      hasEvaluation={hasEvaluation}
      effectiveValue={effectiveValue}
      daysUntilDeadline={daysUntilDeadline}
      breakdownItems={breakdownItems}
      summaryDisplay={summaryDisplay}
      risksDisplay={risksDisplay}
      strengthsDisplay={strengthsDisplay}
      missingRequirementsDisplay={missingRequirementsDisplay}
      actionItemsDisplay={actionItemsDisplay}
    />
  )
}
