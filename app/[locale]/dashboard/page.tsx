import { getTenders } from '@/lib/queries/tender'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import { getServerT } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { Suspense } from 'react'
import { ErrorState } from '@/components/dashboard/error-state'
import { TendersListClient } from '@/components/dashboard/tenders-list-client'
import { TendersListTranslated } from '@/components/dashboard/tenders-list-translated'
import { TendersListSkeleton } from '@/components/dashboard/tenders-list-skeleton'
import { DashboardViewTracker } from '@/components/dashboard/dashboard-view-tracker'
import { Container, Flex, Box } from '@radix-ui/themes'

type Props = {
  params: Promise<{ locale: string }>
}

/**
 * Dashboard always uses the new design (DASHBOARD_SPEC): Section A (KPI row) + TenderDataBlock + Section B (filters) + Section C (table).
 * Empty DB shows the same layout with zeros and an empty table state (no separate "old" empty-state layout).
 */
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
    <Box className="dashboard-page" style={{ width: '100%', maxWidth: '100%' }}>
      <DashboardViewTracker locale={locale} path={`/${locale}/dashboard`} />
      {/* Visible page title is "Tenders" with dynamic subtitle in TendersListClient (WORLD_CLASS_UX_PLAN). Screen-reader fallback for route. */}
      <h1 className="sr-only" data-testid="dashboard-page-title">{t('pageTitle')}</h1>
      <Flex direction="column" gap="3">
        {/* Approved design: KPI first. No big Command center / Export to Odoo cards in main content; header has Run analysis, Export to CRM, Upload. */}
        {/* Always: KPI row + TenderDataBlock + Filters + Table (same layout empty or not). */}
        {locale === 'en' ? (
          <Suspense fallback={<TendersListSkeleton />}>
            <TendersListTranslated tenders={tenders} locale={locale} />
          </Suspense>
        ) : (
          <TendersListClient tenders={tenders} locale={locale} translationMap={null} />
        )}
      </Flex>
    </Box>
  )
}
