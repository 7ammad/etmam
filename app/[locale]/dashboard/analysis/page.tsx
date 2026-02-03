import { getAnalysisKpis, getCompetitorStats, getAwardTrends } from '@/lib/queries/analysis'
import { ErrorState } from '@/components/dashboard/error-state'
import { AnalysisPageClient } from '@/components/dashboard/analysis/analysis-page-client'
import { Box } from '@radix-ui/themes'

type Props = {
  params: Promise<{ locale: string }>
}

/**
 * Market Analysis page. Shows competitor stats and award trends based on historic tender data.
 */
export default async function AnalysisPage({ params }: Props) {
  const { locale } = await params

  try {
    const [kpis, competitors, trends] = await Promise.all([
      getAnalysisKpis(),
      getCompetitorStats(20),
      getAwardTrends('month'),
    ])

    return (
      <Box className="analysis-page" style={{ width: '100%', maxWidth: '100%' }}>
        <AnalysisPageClient
          kpis={kpis}
          competitors={competitors}
          trends={trends}
          locale={locale}
        />
      </Box>
    )
  } catch {
    return <ErrorState />
  }
}
