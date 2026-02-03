'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Flex, Button, Text, DropdownMenu } from '@radix-ui/themes'
import { RefreshCw, FileUp, Loader2, Square, ChevronDown } from 'lucide-react'
import { UploadTenderTrigger } from './upload-tender-trigger'

interface ScrapeStatus {
  status: 'idle' | 'running' | 'completed' | 'failed'
  message?: string
  error?: string
  count?: number
}

const POLL_INTERVAL_MS = 2000
const SUCCESS_DISMISS_MS = 5000

/**
 * Slim ingestion strip per WORLD_CLASS_UX_PLAN: single row 48px, Get Active / Get Historic / Upload left, status right.
 * Replaces TenderDataBlock for reduced visual weight; same API (scrape, sync-latest, stop).
 */
export function TenderIngestionStrip({ locale: _locale = 'en' }: { locale?: string }) {
  const tTenders = useTranslations('tenders')
  const tDM = useTranslations('dataManagement')
  const tScrape = useTranslations('scrape')
  const router = useRouter()
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>({ status: 'idle' })
  const [syncing, setSyncing] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        if (data.status === 'completed') router.refresh()
      }
    } catch {
      stopPolling()
      setScrapeStatus({ status: 'idle' })
    }
  }, [stopPolling, router])

  useEffect(() => {
    let cancelled = false
    fetch('/api/scrape')
      .then((r) => r.json())
      .then((data: ScrapeStatus) => {
        if (!cancelled) setScrapeStatus(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (dismissRef.current) clearTimeout(dismissRef.current)
    }
  }, [])

  async function handleRunScrape(historical = false) {
    setScrapeStatus({ status: 'running', message: tScrape('starting') })
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historical }),
      })
      if (res.status === 409) {
        setScrapeStatus({ status: 'running', message: tScrape('alreadyRunning') })
        pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: unknown }
        const errMsg = typeof body?.error === 'string' ? body.error : res.statusText
        setScrapeStatus({ status: 'failed', error: errMsg })
        return
      }
      pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS)
    } catch (err) {
      setScrapeStatus({ status: 'failed', error: err instanceof Error ? err.message : String(err) })
    }
  }

  async function handleSyncFile(mode?: 'active' | 'historical') {
    setSyncing(true)
    try {
      const res = await fetch('/api/scrape/sync-latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const data = (await res.json()) as { upserted?: number; error?: string; errors?: string[] }
      if (!res.ok) {
        setScrapeStatus({ status: 'failed', error: data.error ?? data.errors?.[0] ?? res.statusText })
      } else {
        const count = data.upserted ?? 0
        setScrapeStatus({ status: 'completed', message: tTenders('ingestion.found', { count }), count })
        router.refresh()
        if (dismissRef.current) clearTimeout(dismissRef.current)
        dismissRef.current = setTimeout(() => {
          dismissRef.current = null
          setScrapeStatus({ status: 'idle' })
        }, SUCCESS_DISMISS_MS)
      }
    } catch (err) {
      setScrapeStatus({ status: 'failed', error: err instanceof Error ? err.message : String(err) })
    } finally {
      setSyncing(false)
    }
  }

  async function handleStopScrape() {
    try {
      await fetch('/api/scrape/stop', { method: 'POST' })
      setScrapeStatus({ status: 'idle' })
      stopPolling()
      router.refresh()
    } catch {
      setScrapeStatus({ status: 'idle' })
      stopPolling()
    }
  }

  const running = scrapeStatus.status === 'running'
  const disabled = running || syncing

  function renderStatus() {
    if (scrapeStatus.status === 'running') {
      return (
        <Flex align="center" gap="2" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 size={16} className="animate-spin" aria-hidden />
          <Text size="2">{tTenders('ingestion.fetching')}</Text>
        </Flex>
      )
    }
    if (scrapeStatus.status === 'completed' && scrapeStatus.message) {
      return (
        <Text size="2" style={{ color: 'var(--color-qualified-text)' }}>
          {scrapeStatus.message}
        </Text>
      )
    }
    if (scrapeStatus.status === 'failed') {
      return (
        <Flex align="center" gap="2">
          <Text size="2" style={{ color: 'var(--color-excluded-text)' }}>
            {scrapeStatus.error ?? tScrape('failed')}
          </Text>
          <Button size="1" variant="soft" color="red" onClick={() => setScrapeStatus({ status: 'idle' })}>
            {tScrape('close')}
          </Button>
        </Flex>
      )
    }
    return (
      <Text size="2" style={{ color: 'var(--text-tertiary)' }}>
        {tTenders('ingestion.ready')}
      </Text>
    )
  }

  return (
    <section
      className="tender-ingestion-strip"
      aria-label={tDM('tenderDataLabel')}
      style={{
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        padding: '0 var(--space-3)',
        background: 'var(--surface-muted)',
        borderRadius: 'var(--radius-card)',
        marginBottom: 'var(--space-3)',
        flexWrap: 'wrap',
      }}
    >
      <Flex align="center" gap="2" wrap="wrap">
        <Button
          size="2"
          variant="soft"
          color="green"
          onClick={() => handleRunScrape(false)}
          disabled={disabled}
          aria-label={tScrape('runScrape')}
        >
          <RefreshCw size={16} style={{ opacity: running ? 0.7 : 1 }} />
          {tDM('getActiveTender')}
        </Button>
        <Button
          size="2"
          variant="soft"
          color="gray"
          onClick={() => handleRunScrape(true)}
          disabled={disabled}
          aria-label={tDM('getHistoricTender')}
        >
          <RefreshCw size={16} style={{ opacity: running ? 0.7 : 1 }} />
          {tDM('getHistoricTender')}
        </Button>
        {running && (
          <Button size="2" color="red" variant="solid" onClick={handleStopScrape} aria-label={tScrape('stopScraping')}>
            <Square size={14} fill="currentColor" />
            {tDM('stop')}
          </Button>
        )}
        <UploadTenderTrigger locale={_locale} testId="upload-tender-strip" />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button size="2" variant="outline" color="gray" disabled={disabled}>
              <FileUp size={16} />
              {tDM('syncFromFile')}
              <ChevronDown size={14} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onClick={() => handleSyncFile('active')}>
              {tDM('syncActiveFile')}
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={() => handleSyncFile('historical')}>
              {tDM('syncHistoricFile')}
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onClick={() => handleSyncFile()}>
              {tDM('syncLatestFile')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>
      <Flex align="center" style={{ marginInlineStart: 'auto' }}>
        {renderStatus()}
      </Flex>
    </section>
  )
}
