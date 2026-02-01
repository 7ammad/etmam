'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { useTranslations } from '@/components/providers/i18n-provider'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import { runEvaluationAction, evaluateAllPendingAction } from '@/actions/evaluation'
import { Flex, Box, Text, Badge, Table, TextField, Select, Button, Checkbox } from '@radix-ui/themes'
import { BarChart } from '@tremor/react'
import { Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { DashboardKpiRow, type DashboardKpiStats } from './dashboard-kpi-row'

const localeMap = { ar, en: enUS } as const
const PAGE_SIZE = 10
const CLOSING_SOON_DAYS = 7
const DEADLINE_30_DAYS = 30

/** Deadline status for chip per DASHBOARD_SPEC: Closing soon (≤7 days), Past deadline (< today), Open */
function getDeadlineStatus(deadline: string | null): 'closing_soon' | 'past' | 'open' | null {
  if (!deadline) return null
  const d = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  if (d < today) return 'past'
  const msPerDay = 24 * 60 * 60 * 1000
  const daysLeft = Math.ceil((d.getTime() - today.getTime()) / msPerDay)
  if (daysLeft <= CLOSING_SOON_DAYS) return 'closing_soon'
  return 'open'
}

/** Days from today (negative = past). Used for KPI and chart. */
function getDaysFromToday(deadline: string | null): number | null {
  if (!deadline) return null
  const d = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.ceil((d.getTime() - today.getTime()) / msPerDay)
}

type SortKey =
  | 'newest_first'
  | 'oldest_first'
  | 'deadline_soonest'
  | 'deadline_latest'
  | 'score_low_high'
  | 'score_high_low'

type TenderStatus = TenderWithEvaluation['status']
type RecommendationFilter = '' | 'qualified' | 'conditional' | 'excluded' | 'not_evaluated'
/** Per DASHBOARD_SPEC Section B: Deadline status filter */
type DeadlineFilter = '' | 'closing_soon' | 'open' | 'past'

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
  originalValue: number | null | undefined,
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

function parseSortKey(key: SortKey): { by: 'created_at' | 'deadline' | 'score'; dir: 'asc' | 'desc' } {
  switch (key) {
    case 'newest_first':
      return { by: 'created_at', dir: 'desc' }
    case 'oldest_first':
      return { by: 'created_at', dir: 'asc' }
    case 'deadline_soonest':
      return { by: 'deadline', dir: 'asc' }
    case 'deadline_latest':
      return { by: 'deadline', dir: 'desc' }
    case 'score_low_high':
      return { by: 'score', dir: 'asc' }
    case 'score_high_low':
      return { by: 'score', dir: 'desc' }
  }
}

interface TendersListClientProps {
  tenders: TenderWithEvaluation[]
  locale: string
}

export function TendersListClient({ tenders, locale }: TendersListClientProps) {
  const router = useRouter()
  const t = useTranslations('tendersList')
  const tDashboard = useTranslations('dashboard')
  const tStatuses = useTranslations('tender.statuses')
  const tEval = useTranslations('evaluation')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TenderStatus | ''>('')
  const [recommendationFilter, setRecommendationFilter] = useState<RecommendationFilter>('')
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('')
  const [sortKey, setSortKey] = useState<SortKey>('newest_first')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [evaluating, setEvaluating] = useState(false)
  const [evaluateProgress, setEvaluateProgress] = useState<{ current: number; total: number } | null>(null)

  const clearAllFilters = () => {
    setSearch('')
    setStatusFilter('')
    setRecommendationFilter('')
    setDeadlineFilter('')
    setPage(1)
  }
  const hasActiveFilters = Boolean(search.trim() || statusFilter || recommendationFilter || deadlineFilter)

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAllOnPage = () => {
    setSelectedIds(new Set(pageItems.map((t) => t.id)))
  }
  const clearSelection = () => setSelectedIds(new Set())
  const handleEvaluateSelected = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setEvaluating(true)
    setEvaluateProgress({ current: 0, total: ids.length })
    for (let i = 0; i < ids.length; i++) {
      setEvaluateProgress({ current: i + 1, total: ids.length })
      await runEvaluationAction(ids[i])
    }
    setEvaluating(false)
    setEvaluateProgress(null)
    setSelectedIds(new Set())
    router.refresh()
  }
  const handleEvaluateAllPending = async () => {
    setEvaluating(true)
    const result = await evaluateAllPendingAction()
    setEvaluating(false)
    if (result.success) router.refresh()
  }

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = tenders.filter((tender) => {
      if (q && !(tender.entity?.toLowerCase().includes(q) || tender.title?.toLowerCase().includes(q) || tender.reference_no?.toLowerCase().includes(q))) return false
      if (statusFilter && tender.status !== statusFilter) return false
      const rec = tender.evaluation?.recommendation ?? 'not_evaluated'
      if (recommendationFilter && rec !== recommendationFilter) return false
      const dStatus = getDeadlineStatus(tender.deadline)
      if (deadlineFilter && dStatus !== deadlineFilter) return false
      return true
    })

    const { by, dir } = parseSortKey(sortKey)
    list = [...list].sort((a, b) => {
      if (by === 'created_at') {
        const ta = new Date(a.created_at).getTime()
        const tb = new Date(b.created_at).getTime()
        return dir === 'asc' ? ta - tb : tb - ta
      }
      if (by === 'deadline') {
        const ta = a.deadline ? new Date(a.deadline).getTime() : 0
        const tb = b.deadline ? new Date(b.deadline).getTime() : 0
        return dir === 'asc' ? ta - tb : tb - ta
      }
      const sa = a.evaluation?.score ?? -1
      const sb = b.evaluation?.score ?? -1
      return dir === 'asc' ? sa - sb : sb - sa
    })
    return list
  }, [tenders, search, statusFilter, recommendationFilter, deadlineFilter, sortKey])

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = Math.min(from + PAGE_SIZE, filteredAndSorted.length)
  const pageItems = filteredAndSorted.slice(from, to)

  /** Phase 7D: KPI stats from filtered list so widgets match list filters */
  const kpiStats = useMemo((): DashboardKpiStats => {
    let qualified = 0
    let conditional = 0
    let excluded = 0
    let notEvaluated = 0
    let deadlinesNext7 = 0
    let deadlinesNext30 = 0
    for (const tender of filteredAndSorted) {
      const rec = tender.evaluation?.recommendation ?? 'not_evaluated'
      if (rec === 'qualified') qualified++
      else if (rec === 'conditional') conditional++
      else if (rec === 'excluded') excluded++
      else notEvaluated++
      const days = getDaysFromToday(tender.deadline)
      if (days != null && days >= 0 && days <= CLOSING_SOON_DAYS) deadlinesNext7++
      if (days != null && days >= 0 && days <= DEADLINE_30_DAYS) deadlinesNext30++
    }
    return {
      total: filteredAndSorted.length,
      qualified,
      conditional,
      excluded,
      notEvaluated,
      deadlinesNext7,
      deadlinesNext30,
    }
  }, [filteredAndSorted])

  /** Phase 7D: Chart data — tenders by deadline window (mutually exclusive). Labels applied in render. */
  const chartCounts = useMemo(() => {
    let past = 0
    let next7 = 0
    let next8to30 = 0
    let later = 0
    for (const tender of filteredAndSorted) {
      const days = getDaysFromToday(tender.deadline)
      if (days == null) continue
      if (days < 0) past++
      else if (days <= CLOSING_SOON_DAYS) next7++
      else if (days <= DEADLINE_30_DAYS) next8to30++
      else later++
    }
    return { past, next7, next8to30, later }
  }, [filteredAndSorted])

  const statusOptions: { value: '' | TenderStatus; labelKey: string }[] = [
    { value: '', labelKey: 'allStatuses' },
    { value: 'pending', labelKey: 'pending' },
    { value: 'evaluating', labelKey: 'evaluating' },
    { value: 'evaluated', labelKey: 'evaluated' },
    { value: 'approved', labelKey: 'approved' },
    { value: 'pushed', labelKey: 'pushed' },
    { value: 'rejected', labelKey: 'rejected' },
  ]

  const recommendationOptions: { value: RecommendationFilter; labelKey: string }[] = [
    { value: '', labelKey: 'allRecommendations' },
    { value: 'qualified', labelKey: 'qualified' },
    { value: 'conditional', labelKey: 'conditional' },
    { value: 'excluded', labelKey: 'excluded' },
    { value: 'not_evaluated', labelKey: 'notEvaluated' },
  ]

  const deadlineOptions: { value: DeadlineFilter; labelKey: string }[] = [
    { value: '', labelKey: 'deadlineFilterAll' },
    { value: 'closing_soon', labelKey: 'deadlineClosingSoon' },
    { value: 'open', labelKey: 'deadlineOpen' },
    { value: 'past', labelKey: 'deadlinePast' },
  ]

  const sortOptions: { value: SortKey; labelKey: string }[] = [
    { value: 'newest_first', labelKey: 'sortNewestFirst' },
    { value: 'oldest_first', labelKey: 'sortOldestFirst' },
    { value: 'deadline_soonest', labelKey: 'sortDeadlineSoonest' },
    { value: 'deadline_latest', labelKey: 'sortDeadlineLatest' },
    { value: 'score_low_high', labelKey: 'sortScoreLowHigh' },
    { value: 'score_high_low', labelKey: 'sortScoreHighLow' },
  ]

  const chartData = [
    { window: t('chartWindowPast'), count: chartCounts.past },
    { window: t('chartWindowNext7'), count: chartCounts.next7 },
    { window: t('chartWindowNext30'), count: chartCounts.next8to30 },
    { window: t('chartWindowLater'), count: chartCounts.later },
  ]

  return (
    <Flex direction="column" gap="6">
      {/* Section A: KPI row — derived from filtered list per DASHBOARD_DESIGN */}
      <DashboardKpiRow
          stats={kpiStats}
          labels={{
            total: t('kpiTotal'),
            qualified: t('kpiQualified'),
            conditional: t('kpiConditional'),
            excluded: t('kpiExcluded'),
            notEvaluated: t('kpiNotEvaluated'),
            deadlinesNext7: t('kpiDeadlinesNext7'),
            deadlinesNext30: t('kpiDeadlinesNext30'),
          }}
        />

        {/* Section B: Filters row — search, recommendation, deadline, sort per DASHBOARD_SPEC */}
        <Flex direction="column" gap="3">
          <Flex gap="4" wrap="wrap" align="center">
            <TextField.Root
              aria-label={t('searchPlaceholder')}
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              style={{ minWidth: 200, maxWidth: 320 }}
            />
            <Select.Root
              value={recommendationFilter || 'all'}
              onValueChange={(v) => {
                setRecommendationFilter((v === 'all' ? '' : v) as RecommendationFilter)
                setPage(1)
              }}
            >
              <Select.Trigger aria-label={t('recommendation')} placeholder={t('recommendation')} style={{ minWidth: 160 }} />
              <Select.Content>
                {recommendationOptions.map((opt) => (
                  <Select.Item key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.value === '' ? t('allRecommendations') : opt.labelKey === 'notEvaluated' ? tEval('notEvaluated') : tEval(opt.labelKey as 'qualified' | 'conditional' | 'excluded')}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Select.Root
              value={deadlineFilter || 'all'}
              onValueChange={(v) => {
                setDeadlineFilter((v === 'all' ? '' : v) as DeadlineFilter)
                setPage(1)
              }}
            >
              <Select.Trigger aria-label={t('deadline')} placeholder={t('deadline')} style={{ minWidth: 140 }} />
              <Select.Content>
                {deadlineOptions.map((opt) => (
                  <Select.Item key={opt.value || 'all'} value={opt.value || 'all'}>
                    {t(opt.labelKey)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Select.Root
              value={statusFilter || 'all'}
              onValueChange={(v) => {
                setStatusFilter((v === 'all' ? '' : v) as TenderStatus | '')
                setPage(1)
              }}
            >
              <Select.Trigger aria-label={t('status')} placeholder={t('status')} style={{ minWidth: 120 }} />
              <Select.Content>
                {statusOptions.map((opt) => (
                  <Select.Item key={opt.value || 'all'} value={opt.value || 'all'}>
                    {opt.value === '' ? t('allStatuses') : tStatuses(opt.labelKey as TenderStatus)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Flex align="center" gap="2">
              <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                {t('sortBy')}
              </Text>
              <Select.Root value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <Select.Trigger aria-label={t('sortBy')} style={{ minWidth: 180 }} />
                <Select.Content>
                  {sortOptions.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>
            {hasActiveFilters && (
              <Button variant="soft" color="gray" size="2" onClick={clearAllFilters} aria-label={t('clearFilters')}>
                {t('clearFilters')}
              </Button>
            )}
          </Flex>
        </Flex>

        {/* Evaluation actions: select tenders and run analysis */}
        <Flex gap="3" align="center" wrap="wrap">
          <Button
            size="2"
            variant="soft"
            disabled={evaluating || pageItems.length === 0}
            onClick={selectAllOnPage}
            aria-label={t('selectAllOnPage')}
          >
            {t('selectAllOnPage')}
          </Button>
          {selectedIds.size > 0 && (
            <Button size="2" variant="soft" color="gray" onClick={clearSelection} aria-label={t('clearSelection')}>
              {t('clearSelection')} ({selectedIds.size})
            </Button>
          )}
          <Button
            size="2"
            disabled={evaluating || selectedIds.size === 0}
            onClick={handleEvaluateSelected}
            aria-label={tDashboard('evaluateSelected')}
          >
            <Sparkles size={16} style={{ marginInlineEnd: 6 }} />
            {evaluateProgress
              ? tDashboard('evaluatingCount', { current: evaluateProgress.current, total: evaluateProgress.total })
              : tDashboard('evaluateSelected')}
          </Button>
          <Button
            size="2"
            variant="soft"
            disabled={evaluating}
            onClick={handleEvaluateAllPending}
            aria-label={tDashboard('evaluateAll')}
          >
            {evaluating && !evaluateProgress ? tDashboard('evaluating') : tDashboard('evaluateAll')}
          </Button>
        </Flex>

        {/* Section C: Tenders table — sticky header, numeric right-align per DASHBOARD_DESIGN */}
        <Box
          className="dashboard-table-scroll"
          style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-default)',
          }}
        >
          <Table.Root variant="surface" size="2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell scope="col" style={{ width: 44 }}>
                  <Checkbox
                    checked={pageItems.length > 0 && pageItems.every((t) => selectedIds.has(t.id))}
                    onCheckedChange={(checked) => {
                      if (checked) selectAllOnPage()
                      else setSelectedIds(new Set())
                    }}
                    aria-label={t('selectAllOnPage')}
                  />
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">{t('entity')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">{t('tenderTitle')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">{t('tenderNumber')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">{t('deadline')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-table-numeric">{t('estimatedValue')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-table-numeric">{t('score')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">{t('recommendation')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">{t('status')}</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {pageItems.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={9}>
                    <Flex direction="column" align="center" gap="3" style={{ padding: 32 }}>
                      <Text size="2" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                        {t('noMatchingTenders')}
                      </Text>
                      {hasActiveFilters && (
                        <Button variant="soft" color="gray" size="2" onClick={clearAllFilters} aria-label={t('clearFilters')}>
                          {t('clearFilters')}
                        </Button>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : (
              pageItems.map((tender) => {
                const deadlineStatus = getDeadlineStatus(tender.deadline)
                const detailHref = `/${locale}/dashboard/${tender.id}`
                return (
                <Table.Row
                  key={tender.id}
                  className="dashboard-tender-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(detailHref)}
                >
                  <Table.Cell style={{ width: 44 }} onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(tender.id)}
                      onCheckedChange={() => toggleSelection(tender.id)}
                      aria-label={t('selectTender', { ref: tender.reference_no ?? tender.id })}
                    />
                  </Table.Cell>
                  <Table.Cell style={{ minWidth: 0, maxWidth: 160 }}>
                    <Text size="2" style={{ color: 'var(--gray-11)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {tender.entity ?? '—'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell style={{ minWidth: 0, maxWidth: 240 }}>
                    <NextLink href={detailHref} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <Text size="2" weight="medium" style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {tender.title ?? '—'}
                      </Text>
                    </NextLink>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                      {tender.reference_no ?? '—'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="2" align="center" wrap="wrap">
                      <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                        {formatDeadline(tender.deadline, locale)}
                      </Text>
                      {deadlineStatus && (
                        <Badge
                          size="1"
                          variant="soft"
                          color={deadlineStatus === 'past' ? 'red' : deadlineStatus === 'closing_soon' ? 'amber' : 'green'}
                        >
                          {deadlineStatus === 'past' ? t('deadlinePast') : deadlineStatus === 'closing_soon' ? t('deadlineClosingSoon') : t('deadlineOpen')}
                        </Badge>
                      )}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell className="dashboard-table-numeric">
                    {(() => {
                      const effectiveValue = getEffectiveValue(
                        tender.estimated_value,
                        tender.evaluation?.predicted_budget_min,
                        tender.evaluation?.predicted_budget_max
                      )
                      return effectiveValue.isEstimated ? (
                        <Text size="2" style={{ color: 'var(--amber-11)' }}>
                          ~{formatValue(effectiveValue.value)}
                        </Text>
                      ) : (
                        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                          {formatValue(effectiveValue.value)}
                        </Text>
                      )
                    })()}
                  </Table.Cell>
                  <Table.Cell className="dashboard-table-numeric">
                    <Text size="2" weight="medium">
                      {tender.evaluation != null ? String(Math.round(Math.min(100, Math.max(0, Number(tender.evaluation.score))))) : '—'}
                    </Text>
                  </Table.Cell>
                    <Table.Cell>
                      <Badge
                        size="1"
                        style={{
                          backgroundColor: tender.evaluation
                            ? tender.evaluation.recommendation === 'qualified'
                              ? 'var(--color-qualified-bg)'
                              : tender.evaluation.recommendation === 'conditional'
                                ? 'var(--color-conditional-bg)'
                                : 'var(--color-excluded-bg)'
                            : 'var(--gray-a3)',
                          color: tender.evaluation
                            ? tender.evaluation.recommendation === 'qualified'
                              ? 'var(--color-qualified-text)'
                              : tender.evaluation.recommendation === 'conditional'
                                ? 'var(--color-conditional-text)'
                                : 'var(--color-excluded-text)'
                            : 'var(--gray-11)',
                        }}
                      >
                        {tender.evaluation
                          ? tender.evaluation.recommendation === 'qualified'
                            ? tEval('qualified')
                            : tender.evaluation.recommendation === 'conditional'
                              ? tEval('conditional')
                              : tEval('excluded')
                          : tEval('notEvaluated')}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="1" color="gray" variant="soft">
                        {tStatuses(tender.status)}
                      </Badge>
                    </Table.Cell>
                </Table.Row>
                )
              })
              )}
            </Table.Body>
          </Table.Root>
        </Box>

        {/* Chart: progressive disclosure below table per DASHBOARD_DESIGN */}
        <Box style={{ minHeight: 200 }}>
          <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', marginBottom: 8, display: 'block' }}>
            {t('chartTitleDeadlineWindow')}
          </Text>
          <BarChart
            data={chartData}
            index="window"
            categories={['count']}
            colors={['blue']}
            valueFormatter={(v) => String(v)}
            yAxisWidth={32}
          />
        </Box>

        {/* Pagination */}
        <Flex justify="between" align="center" wrap="wrap" gap="4">
          <Text size="2" style={{ color: 'var(--text-secondary)' }}>
            {t('showingXToYOfZ', { from: filteredAndSorted.length === 0 ? 0 : from + 1, to, total: filteredAndSorted.length })}
          </Text>
          <Flex gap="2">
            <Button
              variant="soft"
              color="gray"
              size="2"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={t('prev')}
            >
              {t('prev')}
            </Button>
            <Button
              variant="soft"
              color="gray"
              size="2"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label={t('next')}
            >
              {t('next')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
  )
}
