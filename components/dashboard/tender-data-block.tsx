'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Box, Flex, Text, Button } from '@radix-ui/themes'
import { RefreshCw, FileUp, Square } from 'lucide-react'
import { UploadTenderTrigger } from './upload-tender-trigger'

interface ScrapeStatus {
  status: 'idle' | 'running' | 'completed' | 'failed'
  message?: string
  error?: string
}

const POLL_INTERVAL_MS = 2000

/**
 * Slim "Tender data" block for the Tenders list page: ingestion only (Get Active, Get Historic, Stop, Upload).
 * No Opportunities actions — those live on the Opportunities page.
 */
export function TenderDataBlock({ locale: _locale = 'en' }: { locale?: string }) {
  const tDM = useTranslations('dataManagement')
  const tScrape = useTranslations('scrape')
  const router = useRouter()
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>({ status: 'idle' })
  const [syncing, setSyncing] = useState(false)
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

  async function handleRunScrape() {
    setScrapeStatus({ status: 'running', message: tScrape('starting') })
    try {
      const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (res.status === 409) {
        setScrapeStatus({ status: 'running', message: tScrape('alreadyRunning') })
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
      setScrapeStatus({ status: 'failed', error: err instanceof Error ? err.message : String(err) })
    }
  }

  async function handleSyncFile() {
    setSyncing(true)
    try {
      const res = await fetch('/api/scrape/sync-latest', { method: 'POST' })
      const data = (await res.json()) as { upserted?: number; error?: string; errors?: string[] }
      if (!res.ok) {
        setScrapeStatus({ status: 'failed', error: data.error ?? data.errors?.[0] ?? res.statusText })
      } else {
        setScrapeStatus({
          status: 'completed',
          message: data.upserted != null ? tScrape('done', { count: data.upserted }) : undefined,
        })
        router.refresh()
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
  const disabledScrape = running || syncing

  return (
    <section
      className="tender-data-block"
      aria-label={tDM('tenderDataLabel')}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        marginBottom: 'var(--space-3)',
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
          {tDM('tenderDataLabel')}
        </Text>
      </Flex>

      <Flex gap="3" wrap="wrap" style={{ padding: 'var(--space-3)', alignItems: 'stretch' }}>
        <Box style={{ flex: '1 1 280px', minWidth: 280, maxWidth: '100%', boxSizing: 'border-box' }}>
          <Text size="2" weight="bold" style={{ color: 'var(--text-primary)', marginBottom: 12, display: 'block' }}>
            {tDM('tenders')}
          </Text>
          <Flex direction="column" gap="3">
            <Box
              style={{
                background: 'var(--color-panel)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-2)',
                padding: 'var(--space-2)',
              }}
            >
              <Text
                size="1"
                weight="medium"
                style={{
                  color: 'var(--text-tertiary)',
                  marginBottom: 8,
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {tDM('automatic')}
              </Text>
              <Flex align="center" gap="2" wrap="nowrap">
                <Button
                  size="2"
                  variant="solid"
                  color="green"
                  onClick={handleRunScrape}
                  disabled={disabledScrape}
                  aria-label={tScrape('runScrape')}
                  style={{
                    width: 88,
                    height: 88,
                    padding: 'var(--space-1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <RefreshCw size={18} style={{ opacity: running ? 0.7 : 1 }} />
                  <Text size="1" weight="medium" style={{ textAlign: 'center', lineHeight: 1.2 }}>
                    {tDM('getActiveTender')}
                  </Text>
                </Button>
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  onClick={handleSyncFile}
                  disabled={disabledScrape}
                  aria-label={tScrape('syncFromLastFile')}
                  style={{
                    width: 88,
                    height: 88,
                    padding: 'var(--space-1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <FileUp size={18} />
                  <Text size="1" weight="medium" style={{ textAlign: 'center', lineHeight: 1.2 }}>
                    {tDM('getHistoricTender')}
                  </Text>
                </Button>
                <Box style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <Button
                    size="2"
                    color="red"
                    variant="solid"
                    onClick={handleStopScrape}
                    aria-label={tScrape('stopScraping')}
                    style={{
                      padding: 'var(--space-1) var(--space-2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Square size={14} fill="currentColor" />
                    {tDM('stop')}
                  </Button>
                </Box>
              </Flex>
            </Box>
            <Box
              style={{
                background: 'var(--color-panel)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-2)',
                padding: 'var(--space-2)',
              }}
            >
              <Text
                size="1"
                weight="medium"
                style={{
                  color: 'var(--text-tertiary)',
                  marginBottom: 8,
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {tDM('manual')}
              </Text>
              <Box style={{ width: '100%' }}>
                <UploadTenderTrigger locale={_locale} testId="upload-tender-button" />
              </Box>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </section>
  )
}
