import { getOpportunityReadyTendersWithPushStatus } from '@/lib/queries/tender'
import type { TenderWithEvaluationAndPushStatus } from '@/lib/queries/tender'
import { ErrorState } from '@/components/dashboard/error-state'
import { OpportunitiesListClient } from '@/components/dashboard/opportunities-list-client'
import { Container, Box } from '@radix-ui/themes'

type Props = {
  params: Promise<{ locale: string }>
}

/**
 * Opportunities list page. Shows tenders that are opportunity-ready (evaluation recommendation INVEST, REVIEW, or qualified),
 * with push status (ready / pushed / failed) for CRM workflow.
 */
export default async function OpportunitiesPage({ params }: Props) {
  const { locale } = await params

  let tenders: TenderWithEvaluationAndPushStatus[]
  try {
    tenders = await getOpportunityReadyTendersWithPushStatus()
  } catch {
    return (
      <Container size="4" py="8">
        <ErrorState />
      </Container>
    )
  }

  return (
    <Box className="opportunities-page" style={{ width: '100%', maxWidth: '100%' }}>
      <OpportunitiesListClient tenders={tenders} locale={locale} />
    </Box>
  )
}
