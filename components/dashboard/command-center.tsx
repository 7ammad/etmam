'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Box, Flex, Text, Button } from '@radix-ui/themes'
import { RefreshCw, FileUp, Square, FileSpreadsheet } from 'lucide-react'
import { UploadTenderTrigger } from './upload-tender-trigger'

interface ScrapeStatus {
  status: 'idle' | 'running' | 'completed' | 'failed'
  message?: string
  error?: string
}

const POLL_INTERVAL_MS = 2000

export function CommandCenter({ locale: _locale = 'en' }: { locale?: string }) {
  const tDM = useTranslations('dataManagement')
  const tScrape = useTranslations('scrape')
  const tExport = useTranslations('export')
  const router = useRouter()
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>({ status: 'idle' })
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)
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
        setScrapeStatus({ status: 'completed', message: data.upserted != null ? tScrape('done', { count: data.upserted }) : undefined })
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

  async function handleExportOdoo() {
    setExporting(true)
    try {
      const res = await fetch('/api/export/odoo-excel')
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Odoo_Leads_Import.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      router.refresh()
    } finally {
      setExporting(false)
    }
  }

  const running = scrapeStatus.status === 'running'
  const disabledScrape = running || syncing

  return (
    <section
      className="data-management-section"
      aria-label={tDM('title')}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        marginBottom: 'var(--space-3)',
      }}
    >
      {/* Title bar — same style as Tender Opportunities */}
      <Flex
        align="center"
        gap="2"
        style={{
          padding: 'var(--space-2) var(--space-3)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <Text size="3" weight="bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {tDM('title')}
        </Text>
      </Flex>

      {/* Content: split by type (Tenders | Opportunities), then Automatic / Manual under each */}
      <Flex gap="3" wrap="wrap" style={{ padding: 'var(--space-3)', alignItems: 'stretch' }}>
        {/* Tenders — Automatic + Manual */}
        <Box style={{ flex: '1 1 280px', minWidth: 280, maxWidth: '100%', boxSizing: 'border-box' }}>
          <Text size="2" weight="bold" style={{ color: 'var(--text-primary)', marginBottom: 12, display: 'block' }}>
            {tDM('tenders')}
          </Text>
          <Flex direction="column" gap="3">
            {/* Tenders > Automatic: two identical square buttons + red circular Stop on center right */}
            <Box
              style={{
                background: 'var(--color-panel)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-2)',
                padding: 'var(--space-3)',
              }}
            >
              <Text size="1" weight="medium" style={{ color: 'var(--text-tertiary)', marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                    width: 72,
                    height: 72,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <RefreshCw size={18} style={{ opacity: running ? 0.7 : 1 }} />
                  <Text size="1" weight="medium">{tDM('active')}</Text>
                </Button>
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  onClick={handleSyncFile}
                  disabled={disabledScrape}
                  aria-label={tScrape('syncFromLastFile')}
                  style={{
                    width: 72,
                    height: 72,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <FileUp size={18} />
                  <Text size="1" weight="medium">{tDM('historic')}</Text>
                </Button>
                <Box style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <Button
                    size="2"
                    color="red"
                    variant="solid"
                    onClick={handleStopScrape}
                    disabled={!running}
                    aria-label={tScrape('stopScraping')}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      padding: 0,
                      minWidth: 44,
                    }}
                  >
                    <Square size={18} fill="currentColor" />
                  </Button>
                </Box>
              </Flex>
            </Box>
            {/* Tenders > Manual */}
            <Box
              style={{
                background: 'var(--color-panel)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-2)',
                padding: 'var(--space-3)',
              }}
            >
              <Text size="1" weight="medium" style={{ color: 'var(--text-tertiary)', marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {tDM('manual')}
              </Text>
              <Box style={{ width: '100%' }}>
                <UploadTenderTrigger locale={_locale} testId="upload-tender-data-management" />
              </Box>
            </Box>
          </Flex>
        </Box>

        {/* Opportunities — Automatic + Manual */}
        <Box style={{ flex: '1 1 240px', minWidth: 240, maxWidth: '100%', boxSizing: 'border-box' }}>
          <Text size="2" weight="bold" style={{ color: 'var(--text-primary)', marginBottom: 12, display: 'block' }}>
            {tDM('opportunities')}
          </Text>
          <Flex direction="column" gap="3">
            {/* Opportunities > Automatic */}
            <Box
              style={{
                background: 'var(--color-panel)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-2)',
                padding: 'var(--space-3)',
              }}
            >
              <Text size="1" weight="medium" style={{ color: 'var(--text-tertiary)', marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {tDM('automatic')}
              </Text>
              <Flex direction="column" gap="2">
                <Button
                  size="2"
                  variant="outline"
                  color="gray"
                  onClick={handleExportOdoo}
                  disabled={exporting}
                  aria-label={tExport('downloadOdooExcel')}
                  style={{ width: '100%' }}
                >
                  <FileSpreadsheet size={16} />
                  {tDM('push')}
                </Button>
                <Button size="2" variant="ghost" color="gray" disabled aria-label={tDM('stop')} style={{ width: '100%' }}>
                  {tDM('stop')}
                </Button>
              </Flex>
            </Box>
            {/* Opportunities > Manual */}
            <Box
              style={{
                background: 'var(--color-panel)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-2)',
                padding: 'var(--space-3)',
              }}
            >
              <Text size="1" weight="medium" style={{ color: 'var(--text-tertiary)', marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {tDM('manual')}
              </Text>
              <Button
                size="2"
                variant="outline"
                color="gray"
                onClick={handleExportOdoo}
                disabled={exporting}
                aria-label={tExport('downloadOdooExcel')}
                style={{ width: '100%' }}
              >
                <FileSpreadsheet size={16} />
                {tDM('downloadOpportunity')}
              </Button>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </section>
  )
}
