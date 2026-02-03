'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Button, Flex } from '@radix-ui/themes'
import { Sparkles, FileSpreadsheet, Upload } from 'lucide-react'
import { UploadTenderTrigger } from './upload-tender-trigger'

interface HeaderToolsStripProps {
  locale: string
}

export function HeaderToolsStrip({ locale }: HeaderToolsStripProps) {
  const tDashboard = useTranslations('dashboard')
  const tExport = useTranslations('export')
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
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
    } finally {
      setExporting(false)
    }
  }

  return (
    <Flex gap="2" align="center" wrap="wrap" style={{ minHeight: 44 }}>
      <Button asChild size="2" variant="soft" color="gray">
        <NextLink href={`/${locale}/dashboard`}>
          <Flex align="center" gap="2">
            <Sparkles size={16} />
            {tDashboard('runAnalysis')}
          </Flex>
        </NextLink>
      </Button>
      <Button size="2" variant="soft" color="gray" disabled={exporting} onClick={handleExport} aria-label={tExport('exportToCrm')}>
        <Flex align="center" gap="2">
          <FileSpreadsheet size={16} />
          {tExport('exportToCrm')}
        </Flex>
      </Button>
      <UploadTenderTrigger locale={locale} testId="upload-tender-button" />
    </Flex>
  )
}
