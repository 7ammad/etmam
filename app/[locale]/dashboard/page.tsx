import { getTenders } from '@/lib/queries/tender'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import { getServerT } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { ErrorState } from '@/components/dashboard/error-state'
import { TendersListClient } from '@/components/dashboard/tenders-list-client'
import { ExportOdooCard } from '@/components/dashboard/export-odoo-card'
import { ScrapeActionsCard } from '@/components/dashboard/scrape-actions-card'
import { UploadTenderForm } from '@/components/dashboard/upload-tender-form'
import { Container, Flex, Box, Text } from '@radix-ui/themes'
import { FileSearch } from 'lucide-react'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params
  const t = getServerT(locale as Locale, 'dashboard')

  let tenders: TenderWithEvaluation[]
  try {
    tenders = await getTenders()
  } catch {
    return (
      <Container size="4" py="8">
        <ErrorState />
      </Container>
    )
  }

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Top: page title — primary task per DASHBOARD_DESIGN */}
        <h1 style={{ margin: 0 }}>
          <Text size="6" weight="bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-latin)' }}>
            {t('pageTitle')}
          </Text>
        </h1>

        {/* Tools row: scrape + export — secondary, compact */}
        <Flex gap="4" wrap="wrap" align="stretch">
          <ScrapeActionsCard locale={locale} />
          <ExportOdooCard locale={locale} />
        </Flex>

        {tenders.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            gap="6"
            style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}
          >
            <Box
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-3)',
                background: 'var(--gray-a2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSearch size={32} style={{ color: 'var(--gray-9)' }} />
            </Box>
            <Flex direction="column" gap="2">
              <Text size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
                {t('noTendersFound')}
              </Text>
              <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                {t('emptyGuidance')}
              </Text>
            </Flex>
            <UploadTenderForm locale={locale} />
          </Flex>
        ) : (
          <TendersListClient tenders={tenders} locale={locale} />
        )}
      </Flex>
    </Container>
  )
}
