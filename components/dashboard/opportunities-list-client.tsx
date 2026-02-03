'use client'

import { useState, useCallback } from 'react'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import type { TenderWithEvaluationAndPushStatus } from '@/lib/queries/tender'
import { Flex, Box, Text, Badge, Table, Button, Checkbox, Dialog, Tooltip, Card } from '@radix-ui/themes'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { getEffectiveValueDisplay } from '@/lib/display-ev'
import { PushToCRMButton } from './push-to-crm-button'
import { OpportunitiesKpiRow } from './opportunities-kpi-row'
import { Loader2, X, CheckCircle, AlertCircle, Target, FileDown } from 'lucide-react'
import { pushToCRM } from '@/actions/crm'

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
  tenders: TenderWithEvaluationAndPushStatus[]
  locale: string
}

/**
 * Opportunities list: KPI row (3 cards), filters + bulk bar, table with Status badges and row actions (Push/Retry/View Tender).
 */
export function OpportunitiesListClient({ tenders, locale }: OpportunitiesListClientProps) {
  const router = useRouter()
  const tList = useTranslations('tendersList')
  const tOpp = useTranslations('opportunities')
  const tOppPage = useTranslations('opportunitiesPage')
  const tEval = useTranslations('evaluation')
  const tCommon = useTranslations('common')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPushOpen, setBulkPushOpen] = useState(false)
  const [bulkPushState, setBulkPushState] = useState<'idle' | 'pushing' | 'done'>('idle')
  const [bulkPushProgress, setBulkPushProgress] = useState({ current: 0, total: 0 })
  const [bulkPushResult, setBulkPushResult] = useState({ success: 0, failed: 0 })

  const readyCount = tenders.filter((t) => t.pushStatus === 'ready' || t.pushStatus === 'failed').length
  const pushedCount = tenders.filter((t) => t.pushStatus === 'pushed').length
  const kpiStats = { total: tenders.length, readyToPush: readyCount, alreadyPushed: pushedCount }
  const kpiLabels = {
    total: tOppPage('kpiTotal'),
    readyToPush: tOppPage('kpiReady'),
    alreadyPushed: tOppPage('kpiPushed'),
    kpiAriaLabel: tOppPage('kpiAriaLabel'),
  }

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === tenders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(tenders.map((x) => x.id)))
    }
  }, [tenders, selectedIds.size])
  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const selectedTenders = tenders.filter((x) => selectedIds.has(x.id))
  const selectedPushable = selectedTenders.filter((x) => x.pushStatus === 'ready' || x.pushStatus === 'failed')

  const handleBulkPushConfirm = useCallback(async () => {
    if (selectedPushable.length === 0) {
      setBulkPushOpen(false)
      return
    }
    setBulkPushState('pushing')
    setBulkPushProgress({ current: 0, total: selectedPushable.length })
    let success = 0
    let failed = 0
    for (let i = 0; i < selectedPushable.length; i++) {
      setBulkPushProgress({ current: i + 1, total: selectedPushable.length })
      const result = await pushToCRM(selectedPushable[i].id)
      if (result.success) success++
      else failed++
    }
    setBulkPushResult({ success, failed })
    setBulkPushState('done')
    router.refresh()
  }, [selectedPushable, router])

  const handleBulkPushClose = useCallback(() => {
    setBulkPushOpen(false)
    setBulkPushState('idle')
    setSelectedIds(new Set())
  }, [])

  if (tenders.length === 0) {
    return (
      <Flex direction="column" gap="3">
        <header style={{ marginBottom: 'var(--space-1)' }}>
          <h1 className="opportunities-page-title" style={{ fontSize: 'var(--font-size-5)', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {tOppPage('title')}
          </h1>
          <p className="opportunities-page-subtitle" style={{ fontSize: 'var(--font-size-2)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0', lineHeight: 1.4 }}>
            {tOppPage('subtitle', { ready: 0, pushed: 0 })}
          </p>
        </header>
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
            direction="column"
            align="center"
            gap="4"
            style={{ padding: 'var(--space-8)', textAlign: 'center' }}
          >
            <Target style={{ width: 64, height: 64, color: 'var(--gray-9)' }} aria-hidden />
            <Text size="4" weight="bold" style={{ color: 'var(--text-primary)' }}>
              {tOpp('empty')}
            </Text>
            <Text size="2" style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
              {tOpp('emptyHint')}
            </Text>
            <Button size="2" variant="soft" color="gray" asChild>
              <NextLink href={`/${locale}/dashboard`}>{tOpp('goToTenders')}</NextLink>
            </Button>
          </Flex>
        </section>
      </Flex>
    )
  }

  return (
    <Flex direction="column" gap="3">
      <header style={{ marginBottom: 'var(--space-1)' }}>
        <h1 className="opportunities-page-title" style={{ fontSize: 'var(--font-size-5)', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          {tOppPage('title')}
        </h1>
        <p className="opportunities-page-subtitle" style={{ fontSize: 'var(--font-size-2)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0', lineHeight: 1.4 }}>
          {tOppPage('subtitle', { ready: readyCount, pushed: pushedCount })}
        </p>
      </header>

      <OpportunitiesKpiRow stats={kpiStats} locale={locale} labels={kpiLabels} />

      {selectedIds.size > 0 && (
        <Flex
          align="center"
          gap="3"
          style={{
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--surface-muted)',
            borderRadius: 'var(--radius-2)',
            border: '1px solid var(--border-default)',
          }}
        >
          <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
            {tOppPage('selectedCount', { count: selectedIds.size })}
          </Text>
          <Button
            size="1"
            onClick={() => setBulkPushOpen(true)}
            disabled={selectedPushable.length === 0}
            data-testid="opportunities-bulk-push"
          >
            {tOppPage('pushAll')}
          </Button>
          <Tooltip content={tOppPage('downloadExcelTooltip')}>
            <Button size="1" variant="soft" color="gray" asChild>
              <a href="/api/export/odoo-excel" download="Odoo_Leads_Import.xlsx">
                <FileDown style={{ width: 14, height: 14 }} />
                {tOppPage('downloadExcel')}
              </a>
            </Button>
          </Tooltip>
          <Button size="1" variant="ghost" color="gray" onClick={clearSelection} aria-label={tOppPage('clearSelection')}>
            <X style={{ width: 16, height: 16 }} />
          </Button>
        </Flex>
      )}

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
          justify="between"
          gap="2"
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <Text size="3" weight="bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {tOpp('title')}
          </Text>
          {selectedIds.size === 0 && (
            <Tooltip content={tOppPage('downloadExcelTooltip')}>
              <Button size="1" variant="soft" color="gray" asChild>
                <a href="/api/export/odoo-excel" download="Odoo_Leads_Import.xlsx">
                  <FileDown style={{ width: 14, height: 14 }} />
                  {tOppPage('downloadExcel')}
                </a>
              </Button>
            </Tooltip>
          )}
        </Flex>
        {/* CC-4: Desktop table */}
        <Box className="dashboard-table-scroll opportunities-table-desktop" style={{ background: 'transparent' }}>
          <Table.Root variant="surface" size="2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell scope="col" style={{ width: 40 }}>
                  <Checkbox
                    checked={selectedIds.size === tenders.length && tenders.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label={selectedIds.size === tenders.length ? tOppPage('clearSelection') : tOppPage('selectedCount', { count: tenders.length })}
                  />
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-th-title">
                  {tList('tableTenderName')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-th-entity">
                  {tList('entity')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-th-deadline">
                  {tList('deadline')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-table-numeric dashboard-th-value">
                  {tList('tableEstValue')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-table-numeric dashboard-th-score">
                  {tList('score')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" className="dashboard-th-rec">
                  {tList('recommendation')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col">
                  {tOpp('pushStatusColumn')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell scope="col" style={{ width: 200 }}>
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
                const pushStatus = tender.pushStatus
                const titleDisplay = (tender.title ?? '').trim() || '—'
                const entityDisplay = (tender.entity ?? '').trim() || '—'

                return (
                  <Table.Row key={tender.id}>
                    <Table.Cell>
                      <Checkbox
                        checked={selectedIds.has(tender.id)}
                        onCheckedChange={() => toggleSelection(tender.id)}
                        aria-label={titleDisplay}
                      />
                    </Table.Cell>
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
                      {pushStatus === 'pushed' && (
                        <Badge size="1" color="green" style={{ gap: 4 }}>
                          <CheckCircle style={{ width: 12, height: 12 }} />
                          {tOppPage('status.pushed')}
                        </Badge>
                      )}
                      {pushStatus === 'ready' && (
                        <Badge size="1" color="gray">
                          {tOppPage('status.ready')}
                        </Badge>
                      )}
                      {pushStatus === 'failed' && (
                        <Badge size="1" color="red" style={{ gap: 4 }}>
                          <AlertCircle style={{ width: 12, height: 12 }} />
                          {tOppPage('status.failed')}
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2" align="center" wrap="wrap">
                        <Button size="1" variant="ghost" color="gray" asChild>
                          <NextLink href={detailHref}>{tOppPage('viewTender')}</NextLink>
                        </Button>
                        <PushToCRMButton
                          tenderId={tender.id}
                          tenderTitle={titleDisplay}
                          hasEvaluation={tender.evaluation != null}
                          currentStatus={tender.status}
                          pushStatus={pushStatus}
                        />
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table.Root>
        </Box>
        {/* CC-4: Mobile card view (< 768px) */}
        <Box className="opportunities-table-mobile" style={{ padding: 'var(--space-3)' }} aria-label="Opportunities list (mobile cards)">
          {tenders.map((tender) => {
            const detailHref = `/${locale}/dashboard/${tender.id}`
            const pushStatus = tender.pushStatus
            const titleDisplay = (tender.title ?? '').trim() || '—'
            const entityDisplay = (tender.entity ?? '').trim() || '—'
            return (
              <Card
                key={tender.id}
                size="2"
                className="dashboard-opportunity-card-mobile"
                style={{ marginBottom: 'var(--space-3)', cursor: 'pointer' }}
                onClick={() => router.push(detailHref)}
              >
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="start" gap="2">
                    <NextLink href={detailHref} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none', flex: 1, minWidth: 0 }}>
                      <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
                        {titleDisplay.length > 50 ? titleDisplay.slice(0, 50) + '…' : titleDisplay}
                      </Text>
                    </NextLink>
                    <Checkbox
                      checked={selectedIds.has(tender.id)}
                      onCheckedChange={() => toggleSelection(tender.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={titleDisplay}
                    />
                  </Flex>
                  <Text size="1" style={{ color: 'var(--gray-11)' }}>{entityDisplay.length > 35 ? entityDisplay.slice(0, 35) + '…' : entityDisplay}</Text>
                  <Flex justify="between" align="center" wrap="wrap" gap="2">
                    <Text size="1" style={{ color: 'var(--text-secondary)' }}>{formatDeadline(tender.deadline, locale)}</Text>
                    {pushStatus === 'pushed' && (
                      <Badge size="1" color="green" style={{ gap: 4 }}>
                        <CheckCircle style={{ width: 12, height: 12 }} />
                        {tOppPage('status.pushed')}
                      </Badge>
                    )}
                    {pushStatus === 'ready' && <Badge size="1" color="gray">{tOppPage('status.ready')}</Badge>}
                    {pushStatus === 'failed' && (
                      <Badge size="1" color="red" style={{ gap: 4 }}>
                        <AlertCircle style={{ width: 12, height: 12 }} />
                        {tOppPage('status.failed')}
                      </Badge>
                    )}
                  </Flex>
                  <Flex gap="2" align="center" onClick={(e) => e.stopPropagation()}>
                    <Button size="1" variant="ghost" color="gray" asChild>
                      <NextLink href={detailHref}>{tOppPage('viewTender')}</NextLink>
                    </Button>
                    <PushToCRMButton
                      tenderId={tender.id}
                      tenderTitle={titleDisplay}
                      hasEvaluation={tender.evaluation != null}
                      currentStatus={tender.status}
                      pushStatus={pushStatus}
                    />
                  </Flex>
                </Flex>
              </Card>
            )
          })}
        </Box>
      </section>

      <Dialog.Root
        open={bulkPushOpen}
        onOpenChange={(open) => {
          if (!open && bulkPushState !== 'pushing') handleBulkPushClose()
        }}
      >
        <Dialog.Content style={{ maxWidth: 420 }} data-testid="bulk-push-dialog">
          <Dialog.Title>
            {bulkPushState === 'idle' || bulkPushState === 'pushing'
              ? tOppPage('pushConfirmTitleWithCount', { count: selectedPushable.length })
              : tOppPage('pushConfirmTitle')}
          </Dialog.Title>
          <Dialog.Description size="2" style={{ color: 'var(--gray-11)' }}>
            {tOppPage('pushConfirmMessage', { count: selectedPushable.length })}
          </Dialog.Description>
          {bulkPushState === 'pushing' && (
            <Flex align="center" gap="2" mt="3">
              <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
              <Text size="2">{tOppPage('pushProgress', { current: bulkPushProgress.current, total: bulkPushProgress.total })}</Text>
            </Flex>
          )}
          {bulkPushState === 'done' && (
            <Flex direction="column" gap="2" mt="3">
              <Text size="2" style={{ color: 'var(--text-primary)' }}>
                {tOppPage('pushResultSummary', { success: bulkPushResult.success, failed: bulkPushResult.failed })}
              </Text>
              <Button size="1" variant="ghost" color="gray" onClick={handleBulkPushClose} style={{ alignSelf: 'start' }}>
                {tOppPage('viewDetails')}
              </Button>
            </Flex>
          )}
          {(bulkPushState === 'idle' || bulkPushState === 'pushing') && (
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" disabled={bulkPushState === 'pushing'}>
                  {tCommon('cancel')}
                </Button>
              </Dialog.Close>
              <Button onClick={handleBulkPushConfirm} disabled={bulkPushState === 'pushing' || selectedPushable.length === 0} data-testid="bulk-push-confirm">
                {bulkPushState === 'pushing' ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                    {tOppPage('pushProgress', { current: bulkPushProgress.current, total: bulkPushProgress.total })}
                  </>
                ) : (
                  tOppPage('pushAll')
                )}
              </Button>
            </Flex>
          )}
          {bulkPushState === 'done' && (
            <Flex mt="4" justify="end">
              <Dialog.Close>
                <Button>{tCommon('close')}</Button>
              </Dialog.Close>
            </Flex>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  )
}
