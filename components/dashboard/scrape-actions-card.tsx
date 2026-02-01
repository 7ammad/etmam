'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Box, Flex, Text, Button } from '@radix-ui/themes'
import { Trash2, RefreshCw, Square } from 'lucide-react'
import { clearAllTendersAction } from '@/actions/tender'

interface ScrapeStatus {
  status: 'idle' | 'running' | 'completed' | 'failed'
  message?: string
  tendersScraped?: number
  upserted?: number
  syncErrors?: string[]
  savedTo?: string
  error?: string
  completedAt?: number | string
}

interface ScrapeActionsCardProps {
  locale?: string
}

const POLL_INTERVAL_MS = 2000

export function ScrapeActionsCard({ locale: _locale = 'en' }: ScrapeActionsCardProps) {
  const t = useTranslations('scrape')
  const router = useRouter()
  const [clearing, setClearing] = useState(false)
  const [syncingFromFile, setSyncingFromFile] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>({ status: 'idle' })
  const [confirmClear, setConfirmClear] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scrape')
      const data = (await res.json()) as ScrapeStatus
      setScrapeStatus(data)
      if (data.status !== 'running') {
        stopPolling()
        if (data.status === 'completed') {
          router.refresh()
        }
      }
    } catch {
      stopPolling()
      setScrapeStatus({ status: 'idle' })
    }
  }, [stopPolling, router])

  async function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    setClearing(true)
    setConfirmClear(false)
    try {
      const result = await clearAllTendersAction()
      if (result.success) {
        router.refresh()
      }
    } finally {
      setClearing(false)
    }
  }

  async function handleSyncFromFile() {
    setSyncingFromFile(true)
    try {
      const res = await fetch('/api/scrape/sync-latest', { method: 'POST' })
      const data = (await res.json()) as { upserted?: number; error?: string; errors?: string[] }
      if (!res.ok) {
        setScrapeStatus({
          status: 'failed',
          error: data.error ?? (data.errors?.[0]) ?? res.statusText,
        })
        return
      }
      setScrapeStatus({
        status: 'completed',
        tendersScraped: data.upserted,
        upserted: data.upserted ?? 0,
        completedAt: Date.now(),
      })
      router.refresh()
    } catch (err) {
      setScrapeStatus({
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setSyncingFromFile(false)
    }
  }

  async function handleRunScrape(historical = false) {
    setScrapeStatus({ status: 'running', message: t('starting') })
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: historical ? JSON.stringify({ historical: true }) : undefined,
      })
      if (res.status === 409) {
        setScrapeStatus({ status: 'running', message: t('alreadyRunning') })
        pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setScrapeStatus({ status: 'failed', error: (body?.error as string) ?? res.statusText })
        return
      }
      pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS)
    } catch (err) {
      setScrapeStatus({
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const running = scrapeStatus.status === 'running'
  const showProgress = running || scrapeStatus.status === 'completed' || scrapeStatus.status === 'failed'

  async function handleStopScrape() {
    try {
      const res = await fetch('/api/scrape/stop', { method: 'POST' })
      const data = (await res.json()) as { status?: string; message?: string; error?: string }
      setScrapeStatus({
        status: 'failed',
        error: data.error ?? data.message ?? t('stopScraping'),
      })
      stopPolling()
      router.refresh()
    } catch {
      setScrapeStatus({ status: 'idle' })
      stopPolling()
    }
  }

  useEffect(() => {
    let cancelled = false
    fetch('/api/scrape')
      .then((r) => r.json())
      .then((data: ScrapeStatus) => {
        if (!cancelled) setScrapeStatus(data as ScrapeStatus)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Box className="fancy-card fancy-card-accent-amber">
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <RefreshCw size={20} style={{ color: 'var(--color-primary-600)' }} />
          <Text size="3" weight="bold" style={{ color: 'var(--text-primary)' }}>
            {t('title')}
          </Text>
        </Flex>
        <Flex gap="3" wrap="wrap" align="center">
          <Button
            size="2"
            color="gray"
            variant="soft"
            onClick={handleClearAll}
            disabled={clearing}
            style={{ cursor: clearing ? 'wait' : undefined }}
          >
            <Trash2 size={16} />
            {confirmClear ? t('confirmClear') : t('clearAll')}
          </Button>
          <Button
            size="2"
            onClick={() => handleRunScrape(false)}
            disabled={running}
            style={{ cursor: running ? 'wait' : undefined }}
          >
            <RefreshCw size={16} />
            {running ? t('running') : t('runScrape')}
          </Button>
          {running && (
            <Button
              size="2"
              color="red"
              variant="soft"
              onClick={handleStopScrape}
              aria-label={t('stopScraping')}
            >
              <Square size={16} />
              {t('stopScraping')}
            </Button>
          )}
          <Button
            size="2"
            variant="soft"
            color="gray"
            onClick={() => handleRunScrape(true)}
            disabled={running}
            style={{ cursor: running ? 'wait' : undefined }}
          >
            {t('runScrapeHistorical')}
          </Button>
          <Button
            size="2"
            variant="outline"
            color="green"
            onClick={handleSyncFromFile}
            disabled={running || syncingFromFile}
            style={{ cursor: syncingFromFile ? 'wait' : undefined }}
          >
            {syncingFromFile ? t('syncing') : t('syncFromLastFile')}
          </Button>
        </Flex>
        {showProgress && (
          <Flex direction="column" gap="1" style={{ marginTop: 2 }}>
            <Box
              style={{
                height: 4,
                borderRadius: 2,
                background: 'var(--gray-a3)',
                overflow: 'hidden',
              }}
            >
              <Box
                className={running ? 'scrape-progress-bar' : undefined}
                style={{
                  height: '100%',
                  width: running ? '40%' : scrapeStatus.status === 'completed' ? '100%' : '100%',
                  background:
                    scrapeStatus.status === 'failed'
                      ? 'var(--color-error)'
                      : 'var(--color-primary-600)',
                }}
              />
            </Box>
            <Text size="1" style={{ color: 'var(--text-secondary)' }}>
              {running && (scrapeStatus.message ?? t('scraping'))}
              {scrapeStatus.status === 'completed' && (
                <>
                  {scrapeStatus.tendersScraped !== undefined &&
                  scrapeStatus.tendersScraped !== (scrapeStatus.upserted ?? 0)
                    ? t('doneScrapedSynced', {
                        scraped: String(scrapeStatus.tendersScraped),
                        synced: String(scrapeStatus.upserted ?? 0),
                      })
                    : t('done', { count: String(scrapeStatus.upserted ?? scrapeStatus.tendersScraped ?? 0) })}
                  {(scrapeStatus.upserted === 0 || scrapeStatus.tendersScraped === 0) && (
                    <> · {t('zeroHint')}</>
                  )}
                  {scrapeStatus.syncErrors && scrapeStatus.syncErrors.length > 0 && (
                    <> · {scrapeStatus.syncErrors[0]}</>
                  )}
                  {scrapeStatus.savedTo && (
                    <>
                      {' '}
                      {t('savedTo', { path: scrapeStatus.savedTo })}
                    </>
                  )}
                </>
              )}
              {scrapeStatus.status === 'failed' && (scrapeStatus.error ?? t('failed'))}
            </Text>
          </Flex>
        )}
      </Flex>
    </Box>
  )
}
