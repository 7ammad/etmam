/**
 * Tender detail page — Phase 7C.
 *
 * Missing fields handled: Summary text only renders when present and non-empty.
 * Optional evaluation blocks (strengths, risks, missing_requirements, action_items)
 * only render when the array exists and has length; list items are stringified
 * with a fallback so nothing shows "undefined".
 */
import { notFound } from 'next/navigation'
import NextLink from 'next/link'
import { getTenderById } from '@/lib/queries/tender'
import { getServerT } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { ErrorState } from '@/components/dashboard/error-state'
import { PushToCRMButton } from '@/components/dashboard/push-to-crm-button'
import { RunAnalysisButton } from '@/components/dashboard/run-analysis-button'
import { Container, Flex, Text, Card, Badge, Link } from '@radix-ui/themes'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

type Props = {
  params: Promise<{ locale: string; tenderId: string }>
}

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

function formatValue(value: number | null): string {
  if (value == null) return '—'
  return (
    new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' SAR'
  )
}

/** Get effective estimated value with estimation indicator */
function getEffectiveValue(
  originalValue: number | null,
  predictedMin: number | null | undefined,
  predictedMax: number | null | undefined
): { value: number | null; isEstimated: boolean } {
  if (originalValue != null) {
    return { value: originalValue, isEstimated: false }
  }
  if (predictedMin != null && predictedMax != null) {
    const midpoint = Math.round((predictedMin + predictedMax) / 2)
    return { value: midpoint, isEstimated: true }
  }
  return { value: null, isEstimated: false }
}

/** Score 0–100 as integer per DASHBOARD_SPEC / DATA_SOURCES */
function formatScore(score: number | null | undefined): string {
  if (score == null) return '—'
  const n = Number(score)
  if (Number.isNaN(n)) return '—'
  return String(Math.round(Math.min(100, Math.max(0, n))))
}

export default async function TenderDetailPage({ params }: Props) {
  const { locale, tenderId } = await params
  const t = getServerT(locale as Locale, 'dashboard')
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

  // Get effective estimated value (use predicted budget if original is missing)
  const effectiveValue = getEffectiveValue(
    tender.estimated_value ?? null,
    ev?.predicted_budget_min,
    ev?.predicted_budget_max
  )

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Header block per DASHBOARD_SPEC — no undefined leak */}
        <Card size="2" style={{ background: 'var(--surface-card)' }}>
          <Flex direction="column" gap="2">
            <Text size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
              {tender.title ?? '—'}
            </Text>
            <Text size="2" style={{ color: 'var(--gray-11)' }}>
              {tender.entity ?? '—'}
            </Text>
            <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
              {tender.reference_no ?? '—'}
            </Text>
            <Flex gap="4" wrap="wrap" align="center">
              <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                {formatDeadline(tender.deadline ?? null, locale)}
              </Text>
              {effectiveValue.isEstimated ? (
                <Text size="2" style={{ color: 'var(--amber-11)' }}>
                  {formatValue(effectiveValue.value)}
                  <Text size="1" style={{ color: 'var(--amber-9)', marginInlineStart: 4 }}>
                    (محسوبة)
                  </Text>
                </Text>
              ) : (
                <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                  {formatValue(effectiveValue.value)}
                </Text>
              )}
            </Flex>
          </Flex>
        </Card>

        {/* Evaluation: Run analysis button when no evaluation */}
        <Card size="2" style={{ background: 'var(--surface-card)' }}>
          <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', marginBottom: 8, display: 'block' }}>
            {tEval('title')}
          </Text>
          <Flex gap="4" align="center" wrap="wrap" style={{ marginBottom: 12 }}>
            <RunAnalysisButton tenderId={tender.id} hasEvaluation={hasEvaluation} />
          </Flex>

          {/* Score Card: prominent score + recommendation + breakdown */}
          {hasEvaluation && (
            <Card size="2" style={{ background: 'var(--gray-a2)', borderInlineStart: '4px solid var(--color-primary-500)', marginBottom: 12 }}>
              <Flex gap="6" wrap="wrap" align="start">
                <Flex direction="column" align="center" gap="1" style={{ minWidth: 80 }}>
                  <Text size="1" style={{ color: 'var(--text-tertiary)' }}>{tEval('score')}</Text>
                  <Text size="8" weight="bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatScore(ev?.score)}
                  </Text>
                </Flex>
                <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 200 }}>
                  <Badge
                    size="2"
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: ev!.recommendation === 'qualified'
                        ? 'var(--color-qualified-bg)'
                        : ev!.recommendation === 'conditional'
                          ? 'var(--color-conditional-bg)'
                          : 'var(--color-excluded-bg)',
                      color: ev!.recommendation === 'qualified'
                        ? 'var(--color-qualified-text)'
                        : ev!.recommendation === 'conditional'
                          ? 'var(--color-conditional-text)'
                          : 'var(--color-excluded-text)',
                    }}
                  >
                    {ev!.recommendation === 'qualified'
                      ? tEval('qualified')
                      : ev!.recommendation === 'conditional'
                        ? tEval('conditional')
                        : tEval('excluded')}
                  </Badge>
                  {ev!.breakdown && typeof ev.breakdown === 'object' && !Array.isArray(ev.breakdown) && (
                    <Flex gap="4" wrap="wrap" style={{ marginTop: 8 }}>
                      {'budget_fit' in ev.breakdown && (
                        <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                          {tEval('budgetFit')}: {String((ev.breakdown as Record<string, unknown>).budget_fit ?? '—')}
                        </Text>
                      )}
                      {'technical_fit' in ev.breakdown && (
                        <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                          {tEval('technicalFit')}: {String((ev.breakdown as Record<string, unknown>).technical_fit ?? '—')}
                        </Text>
                      )}
                      {'timeline_fit' in ev.breakdown && (
                        <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                          {tEval('timelineFit')}: {String((ev.breakdown as Record<string, unknown>).timeline_fit ?? '—')}
                        </Text>
                      )}
                      {'strategic_fit' in ev.breakdown && (
                        <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                          {tEval('strategicFit')}: {String((ev.breakdown as Record<string, unknown>).strategic_fit ?? '—')}
                        </Text>
                      )}
                      {'risk_score' in ev.breakdown && (
                        <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                          {tEval('riskScore')}: {String((ev.breakdown as Record<string, unknown>).risk_score ?? '—')}
                        </Text>
                      )}
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </Card>
          )}

          {hasEvaluation && ev.summary != null && String(ev.summary).trim() !== '' && (
            <Text size="2" style={{ color: 'var(--text-secondary)' }}>
              {ev.summary}
            </Text>
          )}
        </Card>

        {/* Detail lists: only when evaluation exists (partial data = hide when not evaluated) */}
        {hasEvaluation && (
          <>
            {ev!.strengths && Array.isArray(ev.strengths) && ev.strengths.length > 0 && (
              <Card size="2" style={{ background: 'var(--surface-card)' }}>
                <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', marginBottom: 8, display: 'block' }}>
                  {tEval('strengths')}
                </Text>
                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                    {ev.strengths.map((s, i) => (
                      <li key={i}>
                        <Text size="2" style={{ color: 'var(--text-secondary)' }}>{String(s ?? '')}</Text>
                      </li>
                    ))}
                  </ul>
              </Card>
            )}
            {ev!.risks && Array.isArray(ev.risks) && ev.risks.length > 0 && (
              <Card size="2" style={{ background: 'var(--surface-card)' }}>
                <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', marginBottom: 8, display: 'block' }}>
                  {tEval('risks')}
                </Text>
                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                    {ev.risks.map((r, i) => (
                      <li key={i}>
                        <Text size="2" style={{ color: 'var(--text-secondary)' }}>{String(r ?? '')}</Text>
                      </li>
                    ))}
                  </ul>
              </Card>
            )}
            {ev!.missing_requirements && Array.isArray(ev.missing_requirements) && ev.missing_requirements.length > 0 && (
              <Card size="2" style={{ background: 'var(--surface-card)' }}>
                <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', marginBottom: 8, display: 'block' }}>
                  {tEval('missingRequirements')}
                </Text>
                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                    {ev.missing_requirements.map((m, i) => (
                      <li key={i}>
                        <Text size="2" style={{ color: 'var(--text-secondary)' }}>{String(m ?? '')}</Text>
                      </li>
                    ))}
                  </ul>
              </Card>
            )}
            {ev!.action_items && Array.isArray(ev.action_items) && ev.action_items.length > 0 && (
              <Card size="2" style={{ background: 'var(--surface-card)' }}>
                <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', marginBottom: 8, display: 'block' }}>
                  {tEval('actionItems')}
                </Text>
                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                    {ev.action_items.map((a, i) => (
                      <li key={i}>
                        <Text size="2" style={{ color: 'var(--text-secondary)' }}>{String(a ?? '')}</Text>
                      </li>
                    ))}
                  </ul>
              </Card>
            )}
          </>
        )}

        {/* CRM Push Button */}
        <Card size="2" style={{ background: 'var(--surface-card)' }}>
          <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', marginBottom: 8, display: 'block' }}>
            {getServerT(locale as Locale, 'crm')('title')}
          </Text>
          <PushToCRMButton
            tenderId={tender.id}
            tenderTitle={tender.title ?? ''}
            hasEvaluation={hasEvaluation}
            currentStatus={tender.status ?? 'pending'}
          />
        </Card>

        {/* Phase 7C: Callout for what to do next */}
        <Card size="2" style={{ background: 'var(--surface-card)', borderInlineStart: '4px solid var(--color-primary-500)' }}>
          <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', marginBottom: 8, display: 'block' }}>
            {t('nextStepsTitle')}
          </Text>
          <Flex direction="column" gap="2">
            <Link asChild size="2" color="iris" underline="hover">
              <NextLink href={`/${locale}/dashboard`}>
                <Flex align="center" gap="2">
                  <ArrowLeft size={16} className="flip-rtl" />
                  {t('backToList')}
                </Flex>
              </NextLink>
            </Link>
            <Text size="2" style={{ color: 'var(--text-secondary)' }}>
              {hasEvaluation ? t('exportToOdooHint') : t('runEvaluationHint')}
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Container>
  )
}
