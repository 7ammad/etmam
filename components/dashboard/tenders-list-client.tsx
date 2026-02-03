'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import NextLink from 'next/link'
import { useTranslations } from '@/components/providers/i18n-provider'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import { Flex, Box, Text, Badge, Table, TextField, Select, Button, Checkbox, Card } from '@radix-ui/themes'
import { Search, X, Eye, Play, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { DashboardKpiRow, type DashboardKpiStats } from './dashboard-kpi-row'
import { TenderIngestionStrip } from './tender-ingestion-strip'
import { UploadTenderTrigger } from './upload-tender-trigger'
import { getDisplayEntity, getDisplayTitle, getDisplayText } from '@/lib/translate-display'
import { getEffectiveValueDisplay } from '@/lib/display-ev'
import { trackFilterChange } from '@/lib/analytics'
import { runEvaluationAction } from '@/actions/evaluation'

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
type RecommendationFilter = '' | 'INVEST' | 'REVIEW' | 'SKIP' | 'not_evaluated'
/** Normalize stored recommendation to display/filter value: INVEST / REVIEW / SKIP (legacy qualified/conditional/excluded mapped). */
function normalizeRecommendation(rec: string | null | undefined): RecommendationFilter {
  if (rec === 'INVEST' || rec === 'REVIEW' || rec === 'SKIP' || rec === 'not_evaluated') return rec
  if (rec === 'qualified') return 'INVEST'
  if (rec === 'conditional') return 'REVIEW'
  if (rec === 'excluded') return 'SKIP'
  return 'not_evaluated'
}
/** Per DASHBOARD_SPEC Section B: Deadline status filter */
type DeadlineFilter = '' | 'closing_soon' | 'open' | 'past'

/** URL searchParam keys for filter/sort state (shareable, reload-safe). */
const PARAM_Q = 'q'
const PARAM_REC = 'rec'
const PARAM_DEADLINE = 'deadline'
const PARAM_SORT = 'sort'
const PARAM_PAGE = 'page'

const VALID_REC: RecommendationFilter[] = ['', 'INVEST', 'REVIEW', 'SKIP', 'not_evaluated']
const VALID_DEADLINE: DeadlineFilter[] = ['', 'closing_soon', 'open', 'past']
const VALID_SORT: SortKey[] = ['newest_first', 'oldest_first', 'deadline_soonest', 'deadline_latest', 'score_low_high', 'score_high_low']

type UrlState = {
  search: string
  recommendationFilter: RecommendationFilter
  deadlineFilter: DeadlineFilter
  sortKey: SortKey
  page: number
}

function parseStateFromSearchParams(sp: URLSearchParams | { get: (key: string) => string | null }): UrlState {
  const q = sp.get(PARAM_Q) ?? ''
  const rec = sp.get(PARAM_REC) ?? ''
  const deadline = sp.get(PARAM_DEADLINE) ?? ''
  const sort = sp.get(PARAM_SORT) ?? 'newest_first'
  const pageStr = sp.get(PARAM_PAGE) ?? '1'
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  return {
    search: typeof q === 'string' ? q : '',
    recommendationFilter: VALID_REC.includes(rec as RecommendationFilter) ? (rec as RecommendationFilter) : '',
    deadlineFilter: VALID_DEADLINE.includes(deadline as DeadlineFilter) ? (deadline as DeadlineFilter) : '',
    sortKey: VALID_SORT.includes(sort as SortKey) ? (sort as SortKey) : 'newest_first',
    page,
  }
}

function buildSearchParams(state: UrlState): URLSearchParams {
  const params = new URLSearchParams()
  if (state.search.trim()) params.set(PARAM_Q, state.search.trim())
  if (state.recommendationFilter) params.set(PARAM_REC, state.recommendationFilter)
  if (state.deadlineFilter) params.set(PARAM_DEADLINE, state.deadlineFilter)
  if (state.sortKey !== 'newest_first') params.set(PARAM_SORT, state.sortKey)
  if (state.page > 1) params.set(PARAM_PAGE, String(state.page))
  return params
}

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

/** Enforce max words for title summary display (5-word rule). */
function maxWords(text: string, limit: number): string {
  const t = text.trim()
  if (!t) return t
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length <= limit) return t
  return words.slice(0, limit).join(' ')
}

/** Score color for progress indicator: qualified green, conditional amber, excluded red */
function getScoreColor(score: number | null | undefined): string {
  if (score == null) return 'var(--surface-muted)'
  if (score >= 70) return 'var(--color-qualified-text)'
  if (score >= 40) return 'var(--color-conditional-text)'
  return 'var(--color-excluded-text)'
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
  /** When locale is 'en', server may provide translation or summary maps. */
  translationMap?: Record<string, string> | null
  /** AI-summarized entity names (e.g. "Ministry of Health"). Used for entity column when present. */
  entitySummaryMap?: Record<string, string> | null
  /** AI-summarized titles (e.g. "Subscription renewal"). Used for title column when present. */
  titleSummaryMap?: Record<string, string> | null
}

const SEARCH_DEBOUNCE_MS = 400
/** AC-2.6: save filters when navigating to detail so Back to Tenders can restore */
const DASHBOARD_FILTERS_KEY = 'dashboard-filters'

export function TendersListClient({
  tenders,
  locale,
  translationMap = null,
  entitySummaryMap = null,
  titleSummaryMap = null,
}: TendersListClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('tendersList')
  const tDashboard = useTranslations('dashboard')
  const tStatuses = useTranslations('tender.statuses')
  const tTender = useTranslations('tender')
  const tEval = useTranslations('evaluation')

  const [search, setSearchState] = useState(() => parseStateFromSearchParams(searchParams).search)
  const [statusFilter, setStatusFilter] = useState<TenderStatus | ''>('')
  const [recommendationFilter, setRecommendationFilter] = useState<RecommendationFilter>(
    () => parseStateFromSearchParams(searchParams).recommendationFilter
  )
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>(
    () => parseStateFromSearchParams(searchParams).deadlineFilter
  )
  const [sortKey, setSortKey] = useState<SortKey>(() => parseStateFromSearchParams(searchParams).sortKey)
  const [page, setPageState] = useState(() => parseStateFromSearchParams(searchParams).page)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkEvaluating, setBulkEvaluating] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null)
  const [rowEvaluatingId, setRowEvaluatingId] = useState<string | null>(null)

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateUrl = useCallback(
    (state: UrlState) => {
      const params = buildSearchParams(state)
      const query = params.toString()
      const url = query ? `${pathname}?${query}` : pathname
      router.replace(url, { scroll: false })
    },
    [pathname, router]
  )

  /** AC-2.6: restore filters when returning from tender detail (Back to Tenders) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = sessionStorage.getItem(DASHBOARD_FILTERS_KEY)
    if (!saved) return
    try {
      const state = JSON.parse(saved) as UrlState
      const params = buildSearchParams(state)
      const query = params.toString()
      const url = query ? `${pathname}?${query}` : pathname
      router.replace(url, { scroll: false })
      sessionStorage.removeItem(DASHBOARD_FILTERS_KEY)
    } catch {
      sessionStorage.removeItem(DASHBOARD_FILTERS_KEY)
    }
  }, [pathname, router])

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }
    const next = parseStateFromSearchParams(searchParams)
    // Defer sync so setState is not synchronous in effect (satisfies react-hooks/set-state-in-effect)
    queueMicrotask(() => {
      setSearchState(next.search)
      setRecommendationFilter(next.recommendationFilter)
      setDeadlineFilter(next.deadlineFilter)
      setSortKey(next.sortKey)
      setPageState(next.page)
    })
  }, [searchParams])

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value)
      setPageState(1)
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = setTimeout(() => {
        searchDebounceRef.current = null
        updateUrl({
          search: value,
          recommendationFilter,
          deadlineFilter,
          sortKey,
          page: 1,
        })
        trackFilterChange({ filter_type: 'search', value: value.trim() || '(empty)' })
      }, SEARCH_DEBOUNCE_MS)
    },
    [recommendationFilter, deadlineFilter, sortKey, updateUrl]
  )

  const setPage = useCallback(
    (value: number | ((prev: number) => number)) => {
      setPageState((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        updateUrl({ search, recommendationFilter, deadlineFilter, sortKey, page: next })
        return next
      })
    },
    [search, recommendationFilter, deadlineFilter, sortKey, updateUrl]
  )

  const setRecommendationFilterAndUrl = useCallback(
    (v: RecommendationFilter) => {
      setRecommendationFilter(v)
      setPageState(1)
      updateUrl({ search, recommendationFilter: v, deadlineFilter, sortKey, page: 1 })
      trackFilterChange({ filter_type: 'recommendation', value: v || 'all' })
    },
    [search, deadlineFilter, sortKey, updateUrl]
  )

  const setDeadlineFilterAndUrl = useCallback(
    (v: DeadlineFilter) => {
      setDeadlineFilter(v)
      setPageState(1)
      updateUrl({ search, recommendationFilter, deadlineFilter: v, sortKey, page: 1 })
      trackFilterChange({ filter_type: 'deadline', value: v || 'all' })
    },
    [search, recommendationFilter, sortKey, updateUrl]
  )

  const setSortKeyAndUrl = useCallback(
    (v: SortKey) => {
      setSortKey(v)
      updateUrl({ search, recommendationFilter, deadlineFilter, sortKey: v, page })
      trackFilterChange({ filter_type: 'sort', value: v })
    },
    [search, recommendationFilter, deadlineFilter, page, updateUrl]
  )

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [])

  const clearAllFilters = () => {
    setSearchState('')
    setStatusFilter('')
    setRecommendationFilter('')
    setDeadlineFilter('')
    setPageState(1)
    updateUrl({
      search: '',
      recommendationFilter: '',
      deadlineFilter: '',
      sortKey: 'newest_first',
      page: 1,
    })
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

  const handleEvaluateAll = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkEvaluating(true)
    setBulkProgress({ current: 0, total: ids.length })
    for (let i = 0; i < ids.length; i++) {
      await runEvaluationAction(ids[i])
      setBulkProgress({ current: i + 1, total: ids.length })
    }
    setBulkEvaluating(false)
    setBulkProgress(null)
    setSelectedIds(new Set())
    router.refresh()
  }, [selectedIds, router])

  const handleCreateOpportunities = useCallback(() => {
    router.push(`/${locale}/dashboard/opportunities`)
  }, [locale, router])

  const handleRowEvaluate = useCallback(
    async (e: React.MouseEvent, tenderId: string) => {
      e.stopPropagation()
      setRowEvaluatingId(tenderId)
      await runEvaluationAction(tenderId)
      setRowEvaluatingId(null)
      router.refresh()
    },
    [router]
  )

  const handleEmptyGetActive = useCallback(async () => {
    try {
      await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      router.refresh()
    } catch {
      // no-op
    }
  }, [router])

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = tenders.filter((tender) => {
      if (q && !(tender.entity?.toLowerCase().includes(q) || tender.title?.toLowerCase().includes(q) || tender.reference_no?.toLowerCase().includes(q))) return false
      if (statusFilter && tender.status !== statusFilter) return false
      const rec = normalizeRecommendation(tender.evaluation?.recommendation ?? 'not_evaluated')
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
      const rec = normalizeRecommendation(tender.evaluation?.recommendation ?? 'not_evaluated')
      if (rec === 'INVEST') qualified++
      else if (rec === 'REVIEW') conditional++
      else if (rec === 'SKIP') excluded++
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
    { value: 'INVEST', labelKey: 'invest' },
    { value: 'REVIEW', labelKey: 'review' },
    { value: 'SKIP', labelKey: 'skip' },
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

  const tTenders = useTranslations('tenders')

  return (
    <Flex direction="column" gap="3">
      {/* Page title and subtitle (dynamic counts per WORLD_CLASS_UX_PLAN) */}
      <header style={{ marginBottom: 'var(--space-1)' }}>
        <h1 className="dashboard-page-title" style={{ fontSize: 'var(--font-size-5)', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          {tTenders('title')}
        </h1>
        <p className="dashboard-page-subtitle" style={{ fontSize: 'var(--font-size-2)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0', lineHeight: 1.4 }}>
          {tTenders('subtitle', {
            count: kpiStats.total,
            qualified: kpiStats.qualified,
            pending: kpiStats.notEvaluated,
          })}
        </p>
      </header>
      {/* Section A: KPI row — derived from filtered list per DASHBOARD_DESIGN */}
        <DashboardKpiRow
          stats={kpiStats}
          locale={locale}
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

        {/* Tender ingestion strip per WORLD_CLASS_UX_PLAN (replaces TenderDataBlock). */}
        <TenderIngestionStrip locale={locale} />

        {/* Section B: Filters — single horizontal bar in light container (Figma) */}
        <section
          className="filters-section-figma"
          aria-label={t('filtersLabel')}
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-card)',
            padding: 'var(--space-2) var(--space-3)',
            marginBottom: 'var(--space-3)',
          }}
        >
        <Flex gap="3" wrap="wrap" align="center" className="filters-bar">
          <TextField.Root
            size="2"
            className="search-input"
            aria-label={t('searchPlaceholder')}
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 180, maxWidth: 320 }}
          >
            <TextField.Slot>
              <Search size={16} className="filter-icon" />
            </TextField.Slot>
          </TextField.Root>
          <Select.Root
            value={recommendationFilter || 'all'}
            onValueChange={(v) => setRecommendationFilterAndUrl((v === 'all' ? '' : v) as RecommendationFilter)}
          >
            <Select.Trigger aria-label={t('recommendation')} placeholder={t('recommendation')} style={{ minWidth: 140 }} />
            <Select.Content>
              {recommendationOptions.map((opt) => (
                <Select.Item key={opt.value || 'all'} value={opt.value || 'all'}>
                  {opt.value === '' ? t('allRecommendations') : opt.labelKey === 'notEvaluated' ? tEval('notEvaluated') : tEval(opt.labelKey as 'invest' | 'review' | 'skip')}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Select.Root
            value={deadlineFilter || 'all'}
            onValueChange={(v) => setDeadlineFilterAndUrl((v === 'all' ? '' : v) as DeadlineFilter)}
          >
            <Select.Trigger aria-label={t('deadline')} placeholder={t('deadline')} style={{ minWidth: 120 }} />
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
            <Select.Trigger aria-label={t('status')} placeholder={t('status')} style={{ minWidth: 100 }} />
            <Select.Content>
              {statusOptions.map((opt) => (
                <Select.Item key={opt.value || 'all'} value={opt.value || 'all'}>
                  {opt.value === '' ? t('allStatuses') : tStatuses(opt.labelKey as TenderStatus)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Select.Root value={sortKey} onValueChange={(v) => setSortKeyAndUrl(v as SortKey)}>
            <Select.Trigger aria-label={t('sortBy')} style={{ minWidth: 160 }} />
            <Select.Content>
              {sortOptions.map((opt) => (
                <Select.Item key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          {hasActiveFilters && (
            <Button variant="ghost" size="2" onClick={clearAllFilters} aria-label={t('clearFilters')}>
              <X size={14} style={{ marginInlineEnd: 4 }} />
              {t('clearFilters')}
            </Button>
          )}
        </Flex>
        </section>

        {/* Bulk actions bar: when 1+ selected, show [X selected] [Evaluate All] [Create Opportunities] ✕ */}
        {selectedIds.size > 0 && (
          <section
            aria-label={tTenders('bulk.selected', { count: selectedIds.size })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--surface-muted)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-3)',
              flexWrap: 'wrap',
            }}
          >
            <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
              {tTenders('bulk.selected', { count: selectedIds.size })}
            </Text>
            <Flex align="center" gap="2">
              <Button
                size="2"
                variant="solid"
                color="green"
                onClick={handleEvaluateAll}
                disabled={bulkEvaluating}
                aria-label={tTenders('bulk.evaluateAll')}
              >
                {bulkEvaluating && bulkProgress
                  ? tDashboard('evaluatingCount', { current: bulkProgress.current, total: bulkProgress.total })
                  : tTenders('bulk.evaluateAll')}
              </Button>
              <Button
                size="2"
                variant="soft"
                color="gray"
                onClick={handleCreateOpportunities}
                disabled={bulkEvaluating}
                aria-label={tTenders('bulk.createOpptys')}
              >
                {tTenders('bulk.createOpptys')}
              </Button>
              <Button
                size="2"
                variant="ghost"
                color="gray"
                onClick={clearSelection}
                aria-label={t('clearSelection')}
              >
                <X size={16} />
              </Button>
            </Flex>
          </section>
        )}

        {/* Section C: Tender Opportunities — thin container: title bar (with select-all) + table + pagination */}
        <section
          className="table-section-figma"
          aria-label={t('tableTitle')}
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
            <Checkbox
              checked={pageItems.length > 0 && pageItems.every((t) => selectedIds.has(t.id))}
              onCheckedChange={(checked) => {
                if (checked) selectAllOnPage()
                else clearSelection()
              }}
              aria-label={t('selectAllOnPage')}
            />
            <Text size="3" weight="bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {t('tableTitle')}
            </Text>
          </Flex>
          {/* CC-4: Desktop table */}
          <Box className="dashboard-table-scroll tenders-table-desktop" style={{ background: 'transparent' }}>
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
                <Table.ColumnHeaderCell scope="col" className="dashboard-th-title">{t('tableTenderName')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-th-entity">{t('entity')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-th-deadline">{t('deadline')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-table-numeric dashboard-th-value">{t('tableEstValue')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-table-numeric dashboard-th-score">{t('score')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-th-rec">{t('status')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" style={{ width: 100 }}>{tTender('actions')}</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {              pageItems.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8}>
                    <Flex direction="column" align="center" gap="4" style={{ padding: 40 }}>
                      {tenders.length === 0 ? (
                        <>
                          <Flex align="center" justify="center" style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>
                            <FileText size={48} strokeWidth={1.5} aria-hidden />
                          </Flex>
                          <Text size="4" weight="bold" style={{ color: 'var(--text-primary)', textAlign: 'center' }}>
                            {tTenders('empty.title')}
                          </Text>
                          <Text size="2" style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 400 }}>
                            {tTenders('empty.guidance')}
                          </Text>
                          <Flex gap="3" wrap="wrap" justify="center">
                            <Button
                              size="2"
                              variant="solid"
                              color="green"
                              onClick={handleEmptyGetActive}
                              aria-label={tTenders('empty.getActive')}
                            >
                              {tTenders('empty.getActive')}
                            </Button>
                            <UploadTenderTrigger locale={locale} testId="upload-tender-empty" />
                          </Flex>
                        </>
                      ) : (
                        <>
                          <Text size="2" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                            {t('noMatchingTenders')}
                          </Text>
                          {hasActiveFilters && (
                            <Button variant="soft" color="gray" size="2" onClick={clearAllFilters} aria-label={t('clearFilters')}>
                              {t('clearFilters')}
                            </Button>
                          )}
                        </>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : (
              pageItems.map((tender) => {
                const detailHref = `/${locale}/dashboard/${tender.id}`
                const recNorm = normalizeRecommendation(tender.evaluation?.recommendation ?? 'not_evaluated')
                const accentBarStyle: React.CSSProperties =
                  recNorm === 'INVEST'
                    ? { borderInlineStart: '3px solid var(--color-primary-500)', cursor: 'pointer' }
                    : recNorm === 'REVIEW'
                      ? { borderInlineStart: '3px solid var(--color-conditional-text)', cursor: 'pointer' }
                      : recNorm === 'SKIP'
                        ? { borderInlineStart: '3px solid var(--color-excluded-text)', cursor: 'pointer' }
                        : { borderInlineStart: '3px dashed var(--gray-8)', cursor: 'pointer' }
                return (
                <Table.Row
                  key={tender.id}
                  className="dashboard-tender-row tender-row"
                  style={accentBarStyle}
                  onClick={() => {
                    sessionStorage.setItem(
                      DASHBOARD_FILTERS_KEY,
                      JSON.stringify({ search, recommendationFilter, deadlineFilter, sortKey, page })
                    )
                    router.push(detailHref)
                  }}
                >
                  <Table.Cell style={{ width: 44 }} onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(tender.id)}
                      onCheckedChange={() => toggleSelection(tender.id)}
                      aria-label={t('selectTender', { ref: tender.reference_no ?? tender.id })}
                    />
                  </Table.Cell>
                  <Table.Cell className="dashboard-td-title">
                    <NextLink href={detailHref} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <Text size="2" weight="medium" style={{ color: 'var(--text-primary)', display: 'block' }}>
                        {maxWords(getDisplayTitle(tender.title, tender.title_en, locale, titleSummaryMap ?? translationMap) || '—', 5)}
                      </Text>
                    </NextLink>
                  </Table.Cell>
                  <Table.Cell className="dashboard-td-entity">
                    <Text size="2" style={{ color: 'var(--gray-11)', display: 'block' }}>
                      {getDisplayEntity(tender.entity, tender.entity_en, locale, entitySummaryMap ?? translationMap) || '—'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className="dashboard-td-deadline">
                    <Text size="2" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDeadline(tender.deadline, locale)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className="dashboard-table-numeric dashboard-td-value">
                    {(() => {
                      const effectiveValue = getEffectiveValueDisplay(
                        tender.estimated_value,
                        tender.evaluation?.predicted_budget_min,
                        tender.evaluation?.predicted_budget_max
                      )
                      return (
                        <Text size="2" style={{ color: effectiveValue.isEstimated ? 'var(--amber-11)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {effectiveValue.value != null
                            ? (effectiveValue.isEstimated ? '~' : '') + formatValue(effectiveValue.value, locale)
                            : '—'}
                        </Text>
                      )
                    })()}
                  </Table.Cell>
                  <Table.Cell className="dashboard-table-numeric score-cell dashboard-td-score">
                    {tender.evaluation != null ? (
                      <Text size="2" className="score-value" style={{ color: getScoreColor(tender.evaluation?.score ?? null) }}>
                        {Math.round(Math.min(100, Math.max(0, Number(tender.evaluation.score))))}%
                      </Text>
                    ) : (
                      <Text size="2" style={{ color: 'var(--text-tertiary)' }}>—</Text>
                    )}
                  </Table.Cell>
                    <Table.Cell className="dashboard-td-rec">
                      {(() => {
                        const recNorm = normalizeRecommendation(tender.evaluation?.recommendation)
                        const isInvest = recNorm === 'INVEST'
                        const isReview = recNorm === 'REVIEW'
                        const isSkip = recNorm === 'SKIP'
                        return (
                          <Badge
                            size="1"
                            style={{
                              fontSize: '0.6875rem',
                              backgroundColor: tender.evaluation
                                ? isInvest ? 'var(--color-qualified-bg)' : isReview ? 'var(--color-conditional-bg)' : isSkip ? 'var(--color-excluded-bg)' : 'var(--gray-a3)'
                                : 'var(--gray-a3)',
                              color: tender.evaluation
                                ? isInvest ? 'var(--color-qualified-text)' : isReview ? 'var(--color-conditional-text)' : isSkip ? 'var(--color-excluded-text)' : 'var(--gray-11)'
                                : 'var(--gray-11)',
                            }}
                          >
                            {tender.evaluation ? tEval(recNorm === 'INVEST' ? 'invest' : recNorm === 'REVIEW' ? 'review' : recNorm === 'SKIP' ? 'skip' : 'notEvaluated') : tEval('notEvaluated')}
                          </Badge>
                        )
                      })()}
                    </Table.Cell>
                    <Table.Cell onClick={(e) => e.stopPropagation()} style={{ width: 100 }}>
                      <Flex gap="2" align="center" className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <Button
                          size="1"
                          variant="ghost"
                          color="gray"
                          asChild
                          aria-label={tTender('viewDetails')}
                        >
                          <NextLink href={detailHref}>
                            <Eye size={14} />
                          </NextLink>
                        </Button>
                        <Button
                          size="1"
                          variant="ghost"
                          color="gray"
                          onClick={(e) => handleRowEvaluate(e, tender.id)}
                          disabled={rowEvaluatingId === tender.id}
                          aria-label={tDashboard('runAnalysis')}
                        >
                          <Play size={14} />
                        </Button>
                      </Flex>
                    </Table.Cell>
                </Table.Row>
                )
              })
              )}
            </Table.Body>
          </Table.Root>
          </Box>
          {/* CC-4: Mobile card view (< 768px) */}
          <Box className="tenders-table-mobile" style={{ padding: 'var(--space-3)' }} aria-label="Tenders list (mobile cards)">
            {pageItems.map((tender) => {
              const detailHref = `/${locale}/dashboard/${tender.id}`
              const recNorm = normalizeRecommendation(tender.evaluation?.recommendation ?? 'not_evaluated')
              const effectiveValue = getEffectiveValueDisplay(
                tender.estimated_value,
                tender.evaluation?.predicted_budget_min,
                tender.evaluation?.predicted_budget_max
              )
              return (
                <Card
                  key={tender.id}
                  size="2"
                  className="dashboard-tender-card-mobile"
                  style={{
                    marginBottom: 'var(--space-3)',
                    borderInlineStart: `3px solid ${
                      recNorm === 'INVEST' ? 'var(--color-primary-500)' : recNorm === 'REVIEW' ? 'var(--color-conditional-text)' : recNorm === 'SKIP' ? 'var(--color-excluded-text)' : 'var(--gray-8)'
                    }`,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    sessionStorage.setItem(
                      DASHBOARD_FILTERS_KEY,
                      JSON.stringify({ search, recommendationFilter, deadlineFilter, sortKey, page })
                    )
                    router.push(detailHref)
                  }}
                >
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="start" gap="2">
                      <NextLink href={detailHref} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none', flex: 1, minWidth: 0 }}>
                        <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
                          {maxWords(getDisplayTitle(tender.title, tender.title_en, locale, titleSummaryMap ?? translationMap) || '—', 8)}
                        </Text>
                      </NextLink>
                      <Checkbox
                        checked={selectedIds.has(tender.id)}
                        onCheckedChange={() => toggleSelection(tender.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t('selectTender', { ref: tender.reference_no ?? tender.id })}
                      />
                    </Flex>
                    <Text size="1" style={{ color: 'var(--gray-11)' }}>
                      {getDisplayEntity(tender.entity, tender.entity_en, locale, entitySummaryMap ?? translationMap) || '—'}
                    </Text>
                    <Flex justify="between" align="center" wrap="wrap" gap="2">
                      <Text size="1" style={{ color: 'var(--text-secondary)' }}>{formatDeadline(tender.deadline, locale)}</Text>
                      {tender.evaluation != null ? (
                        <Badge
                          size="1"
                          style={{
                            fontSize: '0.6875rem',
                            backgroundColor:
                              recNorm === 'INVEST' ? 'var(--color-qualified-bg)' : recNorm === 'REVIEW' ? 'var(--color-conditional-bg)' : recNorm === 'SKIP' ? 'var(--color-excluded-bg)' : 'var(--gray-a3)',
                            color: getScoreColor(tender.evaluation?.score ?? null),
                          }}
                        >
                          {Math.round(Math.min(100, Math.max(0, Number(tender.evaluation.score))))}%
                        </Badge>
                      ) : (
                        <Text size="1" style={{ color: 'var(--text-tertiary)' }}>—</Text>
                      )}
                    </Flex>
                    <Flex gap="2" align="center" onClick={(e) => e.stopPropagation()}>
                      <Button size="1" variant="ghost" color="gray" asChild>
                        <NextLink href={detailHref}>
                          <Eye size={14} style={{ marginInlineEnd: 4 }} />
                          {tTender('viewDetails')}
                        </NextLink>
                      </Button>
                      <Button
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={(e) => handleRowEvaluate(e, tender.id)}
                        disabled={rowEvaluatingId === tender.id}
                        aria-label={tDashboard('runAnalysis')}
                      >
                        <Play size={14} style={{ marginInlineEnd: 4 }} />
                        {tDashboard('runAnalysis')}
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              )
            })}
          </Box>
          {/* Pagination at bottom right of table (Figma spec) — inside same container */}
          <Flex
            justify="end"
            align="center"
            gap="2"
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderTop: '1px solid var(--border-default)',
            }}
          >
            <Text size="2" style={{ color: 'var(--text-secondary)', marginInlineEnd: 'var(--space-2)' }}>
              {t('showingXToYOfZ', { from: filteredAndSorted.length === 0 ? 0 : from + 1, to, total: filteredAndSorted.length })}
            </Text>
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
        </section>

      </Flex>
  )
}
