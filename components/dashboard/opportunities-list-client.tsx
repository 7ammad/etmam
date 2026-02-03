'use client'

import NextLink from 'next/link'
import { useTranslations } from '@/components/providers/i18n-provider'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import { Flex, Box, Text, Badge, Table, Button } from '@radix-ui/themes'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { getEffectiveValueDisplay } from '@/lib/display-ev'
import { PushToCRMButton } from './push-to-crm-button'

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

function getScoreColor(score: number | null | undefined): string {
  if (score == null) return 'var(--surface-muted)'
  if (score >= 70) return 'var(--color-qualified-text)'
  if (score >= 40) return 'var(--color-conditional-text)'
  return 'var(--color-excluded-text)'
}

type RecDisplay = 'INVEST' | 'REVIEW' | 'SKIP' | 'not_evaluated'
function normalizeRec(rec: string | null | undefined): RecDisplay {
  if (rec === 'INVEST' || rec === 'REVIEW' || rec === 'SKIP' || rec === 'not_evaluated') return rec
  if (rec === 'qualified') return 'INVEST'
  if (rec === 'conditional') return 'REVIEW'
  if (rec === 'excluded') return 'SKIP'
  return 'not_evaluated'
}

interface OpportunitiesListClientProps {
  tenders: TenderWithEvaluation[]
  locale: string
}

/**
 * Opportunities list: table with title, entity, deadline, value, score, recommendation, push status; View tender + Push to CRM per row.
 */
export function OpportunitiesListClient({ tenders, locale }: OpportunitiesListClientProps) {
  const t = useTranslations('dashboard')
  const tOpp = useTranslations('opportunities')
  const tEval = useTranslations('evaluation')
  const tTender = useTranslations('tender')

  if (tenders.length === 0) {
    return (
      <section
        className="opportunities-section"
        aria-label={tOpp('title')}
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <Flex
          align="center"
          gap="2"
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <Text size="3" weight="bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {tOpp('title')}
          </Text>
        </Flex>
        <Flex
          direction="column"
          align="center"
          gap="4"
          style={{ padding: 'var(--space-8)', textAlign: 'center' }}
        >
          <Text size="3" style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
            {tOpp('empty')} {tOpp('emptyHint')}
          </Text>
          <Button size="2" variant="soft" color="gray" asChild>
            <NextLink href={`/${locale}/dashboard`}>{tOpp('goToTenders')}</NextLink>
          </Button>
        </Flex>
      </section>
    )
  }

  return (
    <section
      className="opportunities-section"
      aria-label={tOpp('title')}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      <Flex
        align="center"
        gap="2"
        style={{
          padding: 'var(--space-2) var(--space-3)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <Text size="3" weight="bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {tOpp('title')}
        </Text>
      </Flex>
      <Box className="dashboard-table-scroll" style={{ background: 'transparent' }}>
        <Table.Root variant="surface" size="2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell scope="col" className="dashboard-th-title">
                {t('tableTenderName')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell scope="col" className="dashboard-th-entity">
                {t('entity')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell scope="col" className="dashboard-th-deadline">
                {t('deadline')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell scope="col" className="dashboard-table-numeric dashboard-th-value">
                {t('tableEstValue')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell scope="col" className="dashboard-table-numeric dashboard-th-score">
                {t('score')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell scope="col" className="dashboard-th-rec">
                {t('status')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell scope="col">
                {tOpp('pushStatusColumn')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell scope="col" style={{ width: 180 }}>
                {tOpp('actionsColumn')}
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {tenders.map((tender) => {
              const detailHref = `/${locale}/dashboard/${tender.id}`
              const effectiveValue = getEffectiveValueDisplay(
                tender.estimated_value,
                tender.evaluation?.predicted_budget_min,
                tender.evaluation?.predicted_budget_max
              )
              const recNorm = normalizeRec(tender.evaluation?.recommendation)
              const isPushed = tender.status === 'pushed'
              const titleDisplay = (tender.title ?? '').trim() || '—'
              const entityDisplay = (tender.entity ?? '').trim() || '—'

              return (
                <Table.Row key={tender.id}>
                  <Table.Cell className="dashboard-td-title">
                    <NextLink href={detailHref} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <Text size="2" weight="medium" style={{ color: 'var(--text-primary)', display: 'block' }}>
                        {titleDisplay.length > 60 ? titleDisplay.slice(0, 60) + '…' : titleDisplay}
                      </Text>
                    </NextLink>
                  </Table.Cell>
                  <Table.Cell className="dashboard-td-entity">
                    <Text size="2" style={{ color: 'var(--gray-11)', display: 'block' }}>
                      {entityDisplay.length > 40 ? entityDisplay.slice(0, 40) + '…' : entityDisplay}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className="dashboard-td-deadline">
                    <Text size="2" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDeadline(tender.deadline, locale)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className="dashboard-table-numeric dashboard-td-value">
                    <Text
                      size="2"
                      style={{
                        color: effectiveValue.isEstimated ? 'var(--amber-11)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {effectiveValue.value != null
                        ? (effectiveValue.isEstimated ? '~' : '') + formatValue(effectiveValue.value, locale)
                        : '—'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className="dashboard-table-numeric dashboard-td-score">
                    {tender.evaluation != null ? (
                      <Text
                        size="2"
                        className="score-value"
                        style={{ color: getScoreColor(tender.evaluation?.score ?? null) }}
                      >
                        {Math.round(Math.min(100, Math.max(0, Number(tender.evaluation.score))))}%
                      </Text>
                    ) : (
                      <Text size="2" style={{ color: 'var(--text-tertiary)' }}>—</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell className="dashboard-td-rec">
                    <Badge
                      size="1"
                      style={{
                        fontSize: '0.6875rem',
                        backgroundColor:
                          recNorm === 'INVEST'
                            ? 'var(--color-qualified-bg)'
                            : recNorm === 'REVIEW'
                              ? 'var(--color-conditional-bg)'
                              : recNorm === 'SKIP'
                                ? 'var(--color-excluded-bg)'
                                : 'var(--gray-a3)',
                        color:
                          recNorm === 'INVEST'
                            ? 'var(--color-qualified-text)'
                            : recNorm === 'REVIEW'
                              ? 'var(--color-conditional-text)'
                              : recNorm === 'SKIP'
                                ? 'var(--color-excluded-text)'
                                : 'var(--gray-11)',
                      }}
                    >
                      {tEval(
                        recNorm === 'INVEST' ? 'invest' : recNorm === 'REVIEW' ? 'review' : recNorm === 'SKIP' ? 'skip' : 'notEvaluated'
                      )}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2" style={{ color: isPushed ? 'var(--green-11)' : 'var(--text-tertiary)' }}>
                      {isPushed ? tOpp('pushStatusPushed') : tOpp('pushStatusDraft')}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2" align="center" wrap="wrap">
                      <Button size="1" variant="ghost" color="gray" asChild>
                        <NextLink href={detailHref}>{tTender('viewDetails')}</NextLink>
                      </Button>
                      <PushToCRMButton
                        tenderId={tender.id}
                        tenderTitle={titleDisplay}
                        hasEvaluation={tender.evaluation != null}
                        currentStatus={tender.status}
                      />
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    </section>
  )
}
