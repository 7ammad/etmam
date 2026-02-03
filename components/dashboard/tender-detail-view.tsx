import NextLink from 'next/link'
import { getServerT } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { PushToCRMButton } from '@/components/dashboard/push-to-crm-button'
import { RunAnalysisButton } from '@/components/dashboard/run-analysis-button'
import { TenderHero } from '@/components/dashboard/tender-hero'
import { ScoreGauge } from '@/components/dashboard/score-gauge'
import { ScoreBreakdownList } from '@/components/dashboard/score-breakdown'
import { EvaluationTabs } from '@/components/dashboard/evaluation-tabs'
import { AiPriceBlock } from '@/components/dashboard/ai-price-block'
import { BookletUploadCard } from '@/components/dashboard/booklet-upload-card'
import { Container, Flex, Box, Text, Card, Link, Badge } from '@radix-ui/themes'
import { ArrowLeft, Sparkles, ArrowRight, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import type { Tables } from '@/types/database'
import type { BookletMetadata } from '@/lib/parsing'

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
          deadline={tender.deadline ?? null}
          daysUntilDeadline={daysUntilDeadline}
          valueFormatted={formatValue(effectiveValue.value, locale)}
          isEstimated={effectiveValue.isEstimated}
          locale={locale}
          labels={{
            entity: tTender('entity'),
            title: tList('tenderTitle'),
            ref: tTender('ref'),
            deadline: tTender('deadline'),
            estimated: tTender('estimated'),
            provided: tTender('provided'),
            closingSoon: tList('deadlineClosingSoon'),
            past: tList('deadlinePast'),
            countdownRemaining: tEval('countdownRemaining'),
          }}
          aiPriceBlock={
            hasEvaluation && ev ? (
              <AiPriceBlock
                tenderEstimate={effectiveValue.value}
                predictedValueSar={ev.predicted_value_sar ?? null}
                bookletPrice={null}
                locale={locale}
                labels={{
                  financials: tEval('financials'),
                  officialBooklet: tEval('officialBookletPrice'),
                  tenderEstimate: tEval('tenderEstimate'),
                  aiModelEstimate: tEval('aiModelEstimate'),
                  tooltip: tEval('predictedByEtmamAiTooltip'),
                }}
              />
            ) : null
          }
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

                  {/* V2 Dual-Track: Infratech / Exotech (design tokens) */}
                  <Box style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
                    <Flex direction="column" gap="3">
                      <Flex justify="between" align="center">
                        <Text size="2" weight="medium" style={{ color: 'var(--text-secondary)' }}>{tEval('infratechFit')}</Text>
                        <Text size="2" weight="bold" style={{ color: 'var(--color-infratech-500)', fontVariantNumeric: 'tabular-nums' }}>{ev.infratech_score ?? 0}%</Text>
                      </Flex>
                      <Box style={{ height: 8, borderRadius: 4, background: 'var(--surface-card)', overflow: 'hidden' }}>
                        <Box className="dual-track-bar-fill" style={{ width: `${ev.infratech_score ?? 0}%`, height: '100%', background: 'var(--color-infratech-500)', borderRadius: 4 }} />
                      </Box>
                      <Flex justify="between" align="center">
                        <Text size="2" weight="medium" style={{ color: 'var(--text-secondary)' }}>{tEval('exotechFit')}</Text>
                        <Text size="2" weight="bold" style={{ color: 'var(--color-exotech-500)', fontVariantNumeric: 'tabular-nums' }}>{ev.exotech_score ?? 0}%</Text>
                      </Flex>
                      <Box style={{ height: 8, borderRadius: 4, background: 'var(--surface-card)', overflow: 'hidden' }}>
                        <Box className="dual-track-bar-fill" style={{ width: `${ev.exotech_score ?? 0}%`, height: '100%', background: 'var(--color-exotech-500)', borderRadius: 4 }} />
                      </Box>
                      {/* Routing decision badge */}
                      {(() => {
                        const routing = ev.routing_decision ?? (ev.infratech_score != null && ev.exotech_score != null
                          ? (ev.infratech_score > ev.exotech_score ? 'INFRATECH' : ev.exotech_score > ev.infratech_score ? 'EXOTECH' : 'JOINT')
                          : null)
                        if (!routing) return null
                        const badgeStyle = routing === 'INFRATECH'
                          ? { background: 'var(--color-infratech-500)', color: 'white' }
                          : routing === 'EXOTECH'
                            ? { background: 'var(--color-exotech-500)', color: 'white' }
                            : routing === 'JOINT'
                              ? { background: 'linear-gradient(90deg, var(--color-infratech-500), var(--color-exotech-500))', color: 'white' }
                              : { background: 'var(--gray-8)', color: 'var(--text-secondary)' }
                        const label = routing === 'INFRATECH' ? tEval('routingInfratech') : routing === 'EXOTECH' ? tEval('routingExotech') : routing === 'JOINT' ? tEval('routingJoint') : tEval('routingNoBid')
                        return (
                          <Flex align="center" gap="2" style={{ marginTop: 'var(--space-2)' }}>
                            <Text size="1" weight="medium" style={{ color: 'var(--text-tertiary)' }}>{tEval('routing')}:</Text>
                            <Badge size="1" style={badgeStyle}>{label}</Badge>
                          </Flex>
                        )
                      })()}
                    </Flex>
                  </Box>

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
                        {tEval('breakdown')}
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

          {/* Right column - Actions panel + Evaluation tabs (WORLD_CLASS_UX_PLAN) */}
          <Flex direction="column" gap="4" className="tender-detail-right">
            {/* Actions: Run Analysis (primary), Create Opportunity (secondary), Push to CRM (tertiary) */}
            <Card size="3" style={{ background: 'var(--surface-card)' }}>
              <Text size="2" weight="bold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)', display: 'block' }}>{t('nextAction')}</Text>
              <Flex direction="column" gap="3">
                <RunAnalysisButton tenderId={tender.id} hasEvaluation={hasEvaluation} />
                {isOpportunityReady && (
                  <Link asChild size="2" color="gray" underline="hover">
                    <NextLink
                      href={opportunitiesHref}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-muted)',
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
            </Card>

            {/* Booklet PDF Upload Card */}
            <BookletUploadCard
              tenderId={tender.id}
              existingMetadata={(tender as unknown as { booklet_metadata: BookletMetadata | null }).booklet_metadata}
            />

            {/* Evaluation details: tabs (Summary, Strengths, Risks, Requirements, Actions) */}
            {hasEvaluation && (
              <Card size="3" style={{ background: 'var(--surface-card)' }}>
                <EvaluationTabs
                  summary={summaryText}
                  strengths={strengthsList}
                  risks={risksList}
                  missingRequirements={missingList}
                  actionItems={actionList}
                  labels={{
                    summary: tEval('summary'),
                    strengths: tEval('strengths'),
                    risks: tEval('risks'),
                    requirements: tEval('missingRequirements'),
                    actions: tEval('actionItems'),
                    noDataAvailable: tEval('noDataAvailable'),
                  }}
                />
              </Card>
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
