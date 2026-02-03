/**
 * Tender detail page — Phase 7C.
 *
 * English: translation streams via Suspense so the page shell is not blocked.
 * Arabic: renders immediately with original text.
 */
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTenderById } from '@/lib/queries/tender'
import { getServerT } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { ErrorState } from '@/components/dashboard/error-state'
import { TenderDetailContent } from '@/components/dashboard/tender-detail-content'
import { TenderDetailSkeleton } from '@/components/dashboard/tender-detail-skeleton'
import { TenderDetailViewTracker } from '@/components/dashboard/tender-detail-view-tracker'
import { Container } from '@radix-ui/themes'
import { getEffectiveValueDisplay } from '@/lib/display-ev'

type Props = {
  params: Promise<{ locale: string; tenderId: string }>
}

/** Days from today (negative = past) for hero deadline badge */
function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null
  const d = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.ceil((d.getTime() - today.getTime()) / msPerDay)
}

export default async function TenderDetailPage({ params }: Props) {
  const { locale, tenderId } = await params
  const tEval = getServerT(locale as Locale, 'evaluation')

  let tender: Awaited<ReturnType<typeof getTenderById>>
  try {
    tender = await getTenderById(tenderId)
  } catch {
    return (
      <Container size="4" py="8">
        <ErrorState />
      </Container>
    )
  }

  if (!tender) {
    notFound()
  }

  const ev = tender.evaluation
  const hasEvaluation = ev != null

  // When evaluation exists use predicted_budget_min/max only; else fallback to tender.estimated_value
  const effectiveValue = getEffectiveValueDisplay(
    tender.estimated_value ?? null,
    ev?.predicted_budget_min,
    ev?.predicted_budget_max
  )

  const daysUntilDeadline = getDaysUntilDeadline(tender.deadline ?? null)
  // Normalize breakdown: DB may return snake_case or camelCase, or JSON string; support both so scores display
  let rawBreakdown: Record<string, unknown> | null = null
  if (ev?.breakdown != null) {
    if (typeof ev.breakdown === 'string') {
      try {
        const parsed = JSON.parse(ev.breakdown) as Record<string, unknown>
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) rawBreakdown = parsed
      } catch {
        // ignore
      }
    } else if (typeof ev.breakdown === 'object' && !Array.isArray(ev.breakdown)) {
      rawBreakdown = ev.breakdown as Record<string, unknown>
    }
  }
  // V2 Engine: 6 dimensions (service_fit, budget_fit, timeline_fit, complexity_fit, strategic_fit, risk_score)
  const v2BreakdownKeys = ['service_fit', 'budget_fit', 'timeline_fit', 'complexity_fit', 'strategic_fit', 'risk_score'] as const
  const v2KeyToLabel: Record<string, string> = {
    service_fit: tEval('serviceFit'),
    budget_fit: tEval('budgetFit'),
    timeline_fit: tEval('timelineFit'),
    complexity_fit: tEval('complexityFit'),
    strategic_fit: tEval('strategicFit'),
    risk_score: tEval('riskScore'),
  }
  // Legacy 5-dim: technical_fit -> complexity_fit for display
  const getBreakdownValueAny = (raw: Record<string, unknown>, key: string): number => {
    const v = raw[key]
    if (typeof v === 'number' && !Number.isNaN(v)) return Math.round(Math.max(0, Math.min(100, v)))
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    const w = raw[camel]
    if (typeof w === 'number' && !Number.isNaN(w)) return Math.round(Math.max(0, Math.min(100, w)))
    if (key === 'complexity_fit' && typeof raw.technical_fit === 'number') return Math.round(Math.max(0, Math.min(100, raw.technical_fit as number)))
    if (key === 'service_fit' && typeof raw.technical_fit === 'number') return Math.round(Math.max(0, Math.min(100, raw.technical_fit as number)))
    return 0
  }
  const breakdownItems = rawBreakdown
    ? v2BreakdownKeys.map((key) => ({
        key,
        label: v2KeyToLabel[key] ?? key,
        value: getBreakdownValueAny(rawBreakdown!, key),
      }))
    : []

  return (
    <Suspense fallback={<TenderDetailSkeleton />}>
      <TenderDetailViewTracker tenderId={tenderId} locale={locale} />
      <TenderDetailContent
        tender={tender}
        locale={locale}
        ev={ev}
        hasEvaluation={hasEvaluation}
        effectiveValue={effectiveValue}
        daysUntilDeadline={daysUntilDeadline}
        breakdownItems={breakdownItems}
      />
    </Suspense>
  )
}
