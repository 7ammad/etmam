'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Box, Flex, Text, Button } from '@radix-ui/themes'
import { FileSpreadsheet } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface LastExportMeta {
  timestamp: string
  path: string
  rowCount: number
}

interface ExportOdooCardProps {
  locale?: string
}

export function ExportOdooCard({ locale: localeProp = 'en' }: ExportOdooCardProps) {
  const t = useTranslations('export')
  const [lastExport, setLastExport] = useState<LastExportMeta | null>(null)
  const [loadingLast, setLoadingLast] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingLast(true)
    fetch('/api/export/last')
      .then((res) => {
        if (res.ok) return res.json() as Promise<LastExportMeta>
        return null
      })
      .then((data) => {
        if (!cancelled) setLastExport(data ?? null)
      })
      .catch(() => {
        if (!cancelled) setLastExport(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingLast(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleExport() {
    setExportError(null)
    setExporting(true)
    try {
      const res = await fetch('/api/export/odoo-excel')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = (body?.message as string) ?? body?.error ?? t('exportError')
        setExportError(msg)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Odoo_Leads_Import.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      // Refresh last export so UI updates
      const metaRes = await fetch('/api/export/last')
      if (metaRes.ok) {
        const meta = (await metaRes.json()) as LastExportMeta
        setLastExport(meta)
      }
    } catch {
      setExportError(t('exportError'))
    } finally {
      setExporting(false)
    }
  }

  const locale = localeProp === 'ar' ? ar : enUS

  return (
    <Box className="fancy-card fancy-card-accent-blue">
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <FileSpreadsheet size={20} style={{ color: 'var(--color-info-600)' }} />
          <Text size="3" weight="bold" style={{ color: 'var(--text-primary)' }}>
            {t('exportToOdoo')}
          </Text>
        </Flex>
        <Flex gap="4" wrap="wrap" align="center">
          <Button
            size="2"
            onClick={handleExport}
            disabled={exporting}
            style={{ cursor: exporting ? 'wait' : undefined }}
          >
            {exporting ? t('exporting') : t('downloadOdooExcel')}
          </Button>
          <Box>
            <Text size="1" style={{ color: 'var(--text-secondary)' }}>
              {t('lastExport')}:{' '}
              {loadingLast ? (
                '…'
              ) : lastExport ? (
                <>
                  {format(new Date(lastExport.timestamp), 'PPp', { locale })}
                  {' · '}
                  {lastExport.path}
                  {' · '}
                  {lastExport.rowCount} rows
                </>
              ) : (
                t('noExportYet')
              )}
            </Text>
          </Box>
        </Flex>
        {exportError && (
          <Text size="1" style={{ color: 'var(--color-error)' }}>
            {exportError}
          </Text>
        )}
      </Flex>
    </Box>
  )
}
