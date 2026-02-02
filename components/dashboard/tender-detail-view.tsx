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
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, ListChecks, Sparkles, ArrowRight } from 'lucide-react'
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

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Back link */}
        <Link asChild size="2" color="gray" underline="hover">
          <NextLink href={`/${locale}/dashboard`}>
            <Flex align="center" gap="2">
              <ArrowLeft size={16} className="flip-rtl" />
              {t('backToList')}
            </Flex>
          </NextLink>
        </Link>

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
                  {hasEvaluation ? t('exportToOdooHint') : t('runEvaluationHint')}
                </Text>
              </Flex>
            </Card>
          </Flex>
        </Box>
      </Flex>
    </Container>
  )
}
