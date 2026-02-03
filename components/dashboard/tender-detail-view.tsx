import NextLink from 'next/link'
import { getServerT } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { PushToCRMButton } from '@/components/dashboard/push-to-crm-button'
import { RunAnalysisButton } from '@/components/dashboard/run-analysis-button'
import { TenderHero } from '@/components/dashboard/tender-hero'
import { ScoreGauge } from '@/components/dashboard/score-gauge'
import { ScoreBreakdownList } from '@/components/dashboard/score-breakdown'
import { EvaluationListCard } from '@/components/dashboard/evaluation-list-card'
import { Container, Flex, Box, Text, Card, Link } from '@radix-ui/themes'
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, ListChecks, Sparkles, ArrowRight, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import type { Tables } from '@/types/database'

const localeMap = { ar, en: enUS } as const

function formatDeadline(deadline: string | null, locale: string) {
  if (!deadline) return '—'
  try {
    const d = new Date(deadline)
    const loc = locale === 'ar' ? localeMap.ar : localeMap.en
    return format(d, 'PP', { locale: loc })
  } catch {
    return deadline
  }
}

function formatValue(value: number | null, locale: string): string {
  if (value == null) return '—'
  const numberLocale = locale === 'ar' ? 'ar-SA' : 'en'
  return (
    new Intl.NumberFormat(numberLocale, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' SAR'
  )
}

export type TenderDetailViewProps = {
  locale: string
  tender: TenderWithEvaluation
  entityDisplay: string
  titleDisplay: string
  ev: Tables<'evaluations'> | null
  hasEvaluation: boolean
  effectiveValue: { value: number | null; isEstimated: boolean }
  daysUntilDeadline: number | null
  breakdownItems: Array<{ key: string; label: string; value: number }>
  /** When locale is Arabic, evaluation text (rule-based) may be translated from English */
  summaryDisplay?: string | null
  risksDisplay?: string[] | null
  strengthsDisplay?: string[] | null
  missingRequirementsDisplay?: string[] | null
  actionItemsDisplay?: string[] | null
}

export function TenderDetailView({
  locale,
  tender,
  entityDisplay,
  titleDisplay,
  ev,
  hasEvaluation,
  effectiveValue,
  daysUntilDeadline,
  breakdownItems,
  summaryDisplay,
  risksDisplay,
  strengthsDisplay,
  missingRequirementsDisplay,
  actionItemsDisplay,
}: TenderDetailViewProps) {
  const summaryText = summaryDisplay ?? ev?.summary ?? null
  const risksList = risksDisplay ?? ev?.risks ?? null
  const strengthsList = strengthsDisplay ?? ev?.strengths ?? null
  const missingList = missingRequirementsDisplay ?? ev?.missing_requirements ?? null
  const actionList = actionItemsDisplay ?? ev?.action_items ?? null
  const t = getServerT(locale as Locale, 'dashboard')
  const tEval = getServerT(locale as Locale, 'evaluation')
  const tTender = getServerT(locale as Locale, 'tender')
  const tList = getServerT(locale as Locale, 'tendersList')
  const tCrm = getServerT(locale as Locale, 'crm')

  const isOpportunityReady =
    hasEvaluation &&
    ev?.recommendation != null &&
    ['INVEST', 'REVIEW', 'qualified'].includes(ev.recommendation)
  const opportunitiesHref = `/${locale}/dashboard/opportunities`

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Breadcrumb and back navigation */}
        <nav aria-label="Breadcrumb">
          <Flex align="center" gap="2" wrap="wrap">
            <Link asChild size="2" color="gray" underline="hover">
              <NextLink href={`/${locale}/dashboard`}>
                <Flex align="center" gap="2">
                  <ArrowLeft size={16} className="flip-rtl" />
                  {t('backToList')}
                </Flex>
              </NextLink>
            </Link>
            <Text size="1" style={{ color: 'var(--text-tertiary)' }}>/</Text>
            <Text size="2" style={{ color: 'var(--text-secondary)', maxWidth: '40ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {titleDisplay}
            </Text>
          </Flex>
        </nav>

        {/* Hero section */}
        <TenderHero
          title={titleDisplay}
          entity={entityDisplay}
          referenceNo={tender.reference_no ?? '—'}
          deadlineFormatted={formatDeadline(tender.deadline ?? null, locale)}
          daysUntilDeadline={daysUntilDeadline}
          valueFormatted={formatValue(effectiveValue.value, locale)}
          isEstimated={effectiveValue.isEstimated}
          locale={locale}
          actions={
            <Flex direction="column" gap="3" align="end">
              <RunAnalysisButton tenderId={tender.id} hasEvaluation={hasEvaluation} />
              {isOpportunityReady && (
                <Link asChild size="2" color="gray" underline="hover">
                  <NextLink
                    href={opportunitiesHref}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-2)',
                      background: 'var(--gray-a2)',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    <Briefcase size={16} />
                    {tCrm('createOpportunity')}
                  </NextLink>
                </Link>
              )}
              <PushToCRMButton
                tenderId={tender.id}
                tenderTitle={tender.title ?? ''}
                hasEvaluation={hasEvaluation}
                currentStatus={tender.status ?? 'pending'}
              />
            </Flex>
          }
          labels={{
            entity: tTender('entity'),
            title: tList('tenderTitle'),
            ref: tTender('ref'),
            deadline: tTender('deadline'),
            estimated: tTender('estimated'),
            provided: tTender('provided'),
            closingSoon: tList('deadlineClosingSoon'),
            past: tList('deadlinePast'),
          }}
        />

        {/* Main content grid */}
        <Box className="tender-detail-grid">
          {/* Left column - Evaluation score */}
          <Flex direction="column" gap="4" className="tender-detail-left">
            <Card size="3" className="tender-detail-evaluation-card">
              {/* Section header */}
              <Flex align="center" gap="2" style={{ marginBottom: 'var(--space-4)' }}>
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'var(--color-primary-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--color-primary-600)' }} />
                </Box>
                <Text size="3" weight="bold" style={{ color: 'var(--text-primary)' }}>
                  {tEval('title')}
                </Text>
              </Flex>

              {hasEvaluation && ev && (
                <>
                  {/* Score gauge - centered */}
                  <Flex justify="center" style={{ marginBottom: 'var(--space-4)' }}>
                    <ScoreGauge
                      score={ev.score ?? 0}
                      recommendation={
                        ev.recommendation === 'qualified' ? 'INVEST'
                          : ev.recommendation === 'conditional' ? 'REVIEW'
                          : ev.recommendation === 'excluded' ? 'SKIP'
                          : (ev.recommendation as 'INVEST' | 'REVIEW' | 'SKIP')
                      }
                      recommendationLabel={
                        ev.recommendation === 'qualified' ? tEval('invest')
                          : ev.recommendation === 'conditional' ? tEval('review')
                          : ev.recommendation === 'excluded' ? tEval('skip')
                          : ev.recommendation === 'INVEST' ? tEval('invest')
                          : ev.recommendation === 'REVIEW' ? tEval('review')
                          : ev.recommendation === 'SKIP' ? tEval('skip')
                          : tEval('excluded')
                      }
                      size={140}
                    />
                  </Flex>

                  {/* Strategic Analysis & Dual-Track Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 border rounded-lg bg-muted/20">
                    {/* Infratech Score (Cyber/Infra) */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Infratech Fit (Cyber/Infra)</span>
                        <span>{ev.infratech_score ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${ev.infratech_score ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Exotech Score (AI/Data) */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Exotech Fit (AI/Data)</span>
                        <span>{ev.exotech_score ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600"
                          style={{ width: `${ev.exotech_score ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Prediction */}
                    <div className="md:col-span-2 flex items-center justify-between pt-2 border-t mt-2">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Predicted Value (AI Model):</span>
                        <span className="text-xs text-muted-foreground/70">Method: {ev.value_method ?? 'N/A'}</span>
                      </div>
                      <span className="text-lg font-bold font-mono">
                        {ev.predicted_value_sar
                          ? new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(ev.predicted_value_sar)
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  {breakdownItems.length > 0 && (
                    <Box style={{ marginTop: 'var(--space-2)' }}>
                      <Text
                        size="1"
                        weight="medium"
                        style={{
                          color: 'var(--text-tertiary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 'var(--space-3)',
                          display: 'block',
                        }}
                      >
                        {tEval('breakdown') || 'Score Breakdown'}
                      </Text>
                      <ScoreBreakdownList items={breakdownItems} />
                    </Box>
                  )}
                </>
              )}

              {!hasEvaluation && (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  gap="3"
                  style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}
                >
                  <Box
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'var(--surface-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={28} style={{ color: 'var(--text-tertiary)' }} />
                  </Box>
                  <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                    {t('runEvaluationHint')}
                  </Text>
                </Flex>
              )}
            </Card>
          </Flex>

          {/* Right column - Summary and details */}
          <Flex direction="column" gap="4" className="tender-detail-right">
            {/* Summary card */}
            {hasEvaluation && summaryText != null && String(summaryText).trim() !== '' && (
              <Card size="3" className="summary-card">
                <Flex direction="column" gap="3">
                  <Text size="2" weight="bold" style={{ color: 'var(--text-primary)' }}>
                    {tEval('summary')}
                  </Text>
                  <Text size="2" className="summary-card-text">
                    {summaryText}
                  </Text>
                </Flex>
              </Card>
            )}

            {/* Evaluation list cards */}
            {hasEvaluation && (
              <>
                {strengthsList && Array.isArray(strengthsList) && strengthsList.length > 0 && (
                  <EvaluationListCard
                    title={tEval('strengths')}
                    items={strengthsList.map(String)}
                    icon={CheckCircle}
                    variant="success"
                  />
                )}
                {risksList && Array.isArray(risksList) && risksList.length > 0 && (
                  <EvaluationListCard
                    title={tEval('risks')}
                    items={risksList.map(String)}
                    icon={AlertTriangle}
                    variant="warning"
                  />
                )}
                {missingList && Array.isArray(missingList) && missingList.length > 0 && (
                  <EvaluationListCard
                    title={tEval('missingRequirements')}
                    items={missingList.map(String)}
                    icon={XCircle}
                    variant="danger"
                  />
                )}
                {actionList && Array.isArray(actionList) && actionList.length > 0 && (
                  <EvaluationListCard
                    title={tEval('actionItems')}
                    items={actionList.map(String)}
                    icon={ListChecks}
                    variant="info"
                  />
                )}
              </>
            )}

            {/* Next steps card */}
            <Card size="2" className="next-steps-card">
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <ArrowRight size={16} style={{ color: 'var(--color-primary-500)' }} className="flip-rtl" />
                  <Text size="2" weight="bold" style={{ color: 'var(--text-primary)' }}>
                    {t('nextStepsTitle')}
                  </Text>
                </Flex>
                <Text size="2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {hasEvaluation
                    ? (isOpportunityReady
                        ? t('nextStepsOpportunityHint')
                        : t('exportToOdooHint'))
                    : t('runEvaluationHint')}
                </Text>
                {isOpportunityReady && (
                  <Link asChild size="2" style={{ marginTop: 'var(--space-2)' }}>
                    <NextLink
                      href={opportunitiesHref}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--color-primary-600)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      <Briefcase size={14} />
                      {t('goToOpportunities')}
                    </NextLink>
                  </Link>
                )}
              </Flex>
            </Card>
          </Flex>
        </Box>
      </Flex>
    </Container>
  )
}
