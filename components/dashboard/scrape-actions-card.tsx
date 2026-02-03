'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Box, Flex, Text, Button, Dialog } from '@radix-ui/themes'
import { Trash2, RefreshCw, Square, AlertCircle, Copy } from 'lucide-react'
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
const PROGRESS_TICK_MS = 120
const PROGRESS_CAP_RUNNING = 95

export function ScrapeActionsCard({ locale: _locale = 'en' }: ScrapeActionsCardProps) {
  const t = useTranslations('scrape')
  const router = useRouter()
  const [clearing, setClearing] = useState(false)
  const [syncingFromFile, setSyncingFromFile] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>({ status: 'idle' })
  const [confirmClear, setConfirmClear] = useState(false)
  const [displayPercent, setDisplayPercent] = useState(0)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const stopProgressAnimation = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current)
      progressRef.current = null
    }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scrape')
      const data = (await res.json()) as ScrapeStatus
      setScrapeStatus(data)
      if (data.status !== 'running') {
        stopPolling()
        stopProgressAnimation()
        if (data.status === 'completed') {
          setDisplayPercent(100)
          router.refresh()
        }
        if (data.status === 'failed') {
          setDisplayPercent(0)
        }
      }
    } catch {
      stopPolling()
      stopProgressAnimation()
      setScrapeStatus({ status: 'idle' })
      setDisplayPercent(0)
    }
  }, [stopPolling, stopProgressAnimation, router])

  useEffect(() => {
    if (scrapeStatus.status === 'running') {
      setDisplayPercent(0)
      progressRef.current = setInterval(() => {
        setDisplayPercent((p) => {
          if (p >= PROGRESS_CAP_RUNNING) return p
          const next = p + Math.max(1, Math.floor((PROGRESS_CAP_RUNNING - p) * 0.08))
          return Math.min(next, PROGRESS_CAP_RUNNING)
        })
      }, PROGRESS_TICK_MS)
      return () => {
        stopProgressAnimation()
      }
    }
  }, [scrapeStatus.status, stopProgressAnimation])

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
      setDisplayPercent(100)
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
    setDisplayPercent(0)
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
        setDisplayPercent(0)
        stopProgressAnimation()
        return
      }
      pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS)
    } catch (err) {
      setScrapeStatus({
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
      setDisplayPercent(0)
      stopProgressAnimation()
    }
  }

  const running = scrapeStatus.status === 'running'
  const showProgress =
    running || scrapeStatus.status === 'completed' || scrapeStatus.status === 'failed'

  async function handleStopScrape() {
    try {
      const res = await fetch('/api/scrape/stop', { method: 'POST' })
      const data = (await res.json()) as { status?: string; message?: string; error?: string }
      setScrapeStatus({
        status: 'failed',
        error: data.error ?? data.message ?? t('stopScraping'),
      })
      setDisplayPercent(0)
      stopPolling()
      stopProgressAnimation()
      router.refresh()
    } catch {
      setScrapeStatus({ status: 'idle' })
      setDisplayPercent(0)
      stopPolling()
      stopProgressAnimation()
    }
  }

  function handleCopyError() {
    const msg = scrapeStatus.error ?? ''
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
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
    <Box className="fancy-card fancy-card-accent-amber dashboard-tool-card">
      {/* Vertical split: line top-to-bottom → left = buttons, right = counter */}
      <Flex direction="row" gap="4" wrap="wrap" align="stretch">
        {/* Left: buttons — 75% */}
        <Flex direction="column" gap="4" style={{ flex: '1 1 75%', minWidth: 0 }} className="scrape-buttons-column">
          <Flex align="center" gap="2">
            <Box className="dashboard-tool-icon dashboard-tool-icon-amber" aria-hidden>
              <RefreshCw size={18} />
            </Box>
            <Text size="2" weight="bold" style={{ color: 'var(--text-primary)' }}>
              {t('commandCenter')}
            </Text>
          </Flex>

          <Flex direction="column" gap="2" style={{ width: '100%' }}>
            <Button
              size="3"
              onClick={() => handleRunScrape(false)}
              disabled={running}
              style={{ cursor: running ? 'wait' : undefined, width: '100%' }}
            >
              <RefreshCw size={18} style={{ flexShrink: 0 }} />
              {running ? t('running') : t('runScrape')}
            </Button>
            <Button
              size="3"
              variant="soft"
              color="gray"
              onClick={() => handleRunScrape(true)}
              disabled={running}
              style={{ cursor: running ? 'wait' : undefined, width: '100%' }}
            >
              {t('runScrapeHistorical')}
            </Button>
            {running && (
              <Button
                size="2"
                color="red"
                variant="soft"
                onClick={handleStopScrape}
                aria-label={t('stopScraping')}
                style={{ width: '100%' }}
              >
                <Square size={14} />
                {t('stopScraping')}
              </Button>
            )}
          </Flex>

          <Flex gap="2" wrap="wrap" align="center">
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
              variant="outline"
              color="green"
              onClick={handleSyncFromFile}
              disabled={running || syncingFromFile}
              style={{ cursor: syncingFromFile ? 'wait' : undefined }}
            >
              {syncingFromFile ? t('syncing') : t('syncFromLastFile')}
            </Button>
          </Flex>
        </Flex>

        {/* Right: square counter + error indicator when failed — 25% */}
        {showProgress && (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap="2"
            style={{ flex: '0 0 25%', minWidth: 120, minHeight: 120 }}
            className="scrape-counter-column"
          >
            <Box
              className={`scrape-digital-watch scrape-digital-watch--square ${running ? 'scrape-digital-watch--running' : ''} scrape-digital-watch--${scrapeStatus.status}`}
              style={{
                width: 120,
                height: 120,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
              }}
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Progress ${scrapeStatus.status === 'failed' ? 0 : displayPercent} percent`}
            >
              <Text
                className="scrape-progress-counter"
                size="8"
                weight="bold"
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                  color:
                    scrapeStatus.status === 'failed'
                      ? 'var(--red-11)'
                      : scrapeStatus.status === 'completed'
                        ? 'var(--green-11)'
                        : 'var(--amber-11)',
                  lineHeight: 1,
                }}
              >
                {scrapeStatus.status === 'failed' ? 0 : displayPercent}%
              </Text>
            </Box>
            {scrapeStatus.status === 'failed' && scrapeStatus.error && (
              <Button
                size="1"
                variant="ghost"
                color="red"
                onClick={() => setErrorDialogOpen(true)}
                style={{ gap: 6, padding: '6px 10px', cursor: 'pointer', textDecoration: 'underline' }}
                aria-label={t('errorDetails')}
              >
                <AlertCircle size={14} />
                {t('errorDetails')}
              </Button>
            )}
          </Flex>
        )}
      </Flex>

      <Dialog.Root open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <Dialog.Content style={{ maxWidth: 420 }}>
          <Dialog.Title>{t('errorDetails')}</Dialog.Title>
          <Box
            style={{
              display: 'block',
              marginTop: 8,
              marginBottom: 0,
              padding: 12,
              borderRadius: 6,
              background: 'var(--gray-a2)',
              color: 'var(--red-11)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 240,
              overflow: 'auto',
              fontSize: 'var(--font-size-1)',
            }}
          >
            {scrapeStatus.error ?? t('failed')}
          </Box>
          <Flex gap="2" mt="3" justify="end">
            <Button
              size="2"
              variant="soft"
              onClick={handleCopyError}
              style={{ gap: 6 }}
            >
              <Copy size={14} />
              {copied ? t('copied') : t('copyError')}
            </Button>
            <Dialog.Close>
              <Button size="2" variant="soft" color="gray">
                {t('close')}
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  )
}
