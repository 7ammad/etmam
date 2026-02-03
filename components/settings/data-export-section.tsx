'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Flex, Text, Box, Button } from '@radix-ui/themes'
import { FileDown, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react'

interface DataExportSectionProps {
  locale: string
}

interface LastExportMeta {
  timestamp: string
  path: string
  rowCount: number
}

export function DataExportSection({ locale }: DataExportSectionProps) {
  const t = useTranslations('settings')
  const [lastExport, setLastExport] = useState<LastExportMeta | null>(null)
  const [loadingLast, setLoadingLast] = useState(true)

  useEffect(() => {
    fetch('/api/export/last')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LastExportMeta | null) => {
        setLastExport(data ?? null)
      })
      .catch(() => setLastExport(null))
      .finally(() => setLoadingLast(false))
  }, [])

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en')
    } catch {
      return iso
    }
  }

  return (
    <section aria-labelledby="export-section-heading" style={{ maxWidth: 480 }}>
      <Flex direction="column" gap="4">
        <Text id="export-section-heading" size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('dataExportTitle')}
        </Text>
        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
          {t('dataExportDescription')}
        </Text>

        <Flex direction="column" gap="3">
          <Button size="2" variant="soft" color="gray" disabled title={t('exportTendersCsvComing')}>
            <FileDown style={{ width: 18, height: 18 }} />
            {t('exportTendersCsv')}
          </Button>
          <Button size="2" variant="soft" color="gray" asChild>
            <a href="/api/export/odoo-excel" download="Odoo_Leads_Import.xlsx">
              <FileSpreadsheet style={{ width: 18, height: 18 }} />
              {t('exportOpportunitiesExcel')}
            </a>
          </Button>
          <Button size="2" variant="soft" color="gray" disabled title={t('exportEvaluationsJsonComing')}>
            <FileJson style={{ width: 18, height: 18 }} />
            {t('exportEvaluationsJson')}
          </Button>
        </Flex>

        <Box>
          <Text size="2" weight="medium" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-1)' }}>
            {t('lastExport')}
          </Text>
          {loadingLast ? (
            <Flex align="center" gap="2">
              <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
              <Text size="2" style={{ color: 'var(--text-tertiary)' }}>—</Text>
            </Flex>
          ) : lastExport ? (
            <Text size="2" style={{ color: 'var(--text-primary)' }}>
              {formatDate(lastExport.timestamp)}
              {lastExport.rowCount != null && ` (${lastExport.rowCount} rows)`}
            </Text>
          ) : (
            <Text size="2" style={{ color: 'var(--text-tertiary)' }}>
              {t('lastExportNever')}
            </Text>
          )}
        </Box>
      </Flex>
    </section>
  )
}
