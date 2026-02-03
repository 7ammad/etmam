'use client'

/**
 * Analysis page client wrapper.
 * Combines KPI row, charts, and competitors leaderboard.
 */

import { Box, Flex, Heading, Text } from '@radix-ui/themes'
import { useTranslations } from '@/components/providers/i18n-provider'
import { AnalysisKpiRow } from './analysis-kpi-row'
import { CompetitorBarChart } from './competitor-bar-chart'
import { TrendAreaChart } from './trend-area-chart'
import { CompetitorsLeaderboard } from './competitors-leaderboard'
import type { AnalysisKpiStats, CompetitorStats, AwardTrend } from '@/lib/queries/analysis'

interface AnalysisPageClientProps {
  kpis: AnalysisKpiStats
  competitors: CompetitorStats[]
  trends: AwardTrend[]
  locale: string
}

export function AnalysisPageClient({
  kpis,
  competitors,
  trends,
  locale,
}: AnalysisPageClientProps) {
  const t = useTranslations('analysis')

  const hasData = kpis.totalHistoricTenders > 0

  return (
    <Box className="analysis-page-content" p="4">
      {/* Header */}
      <Flex direction="column" gap="1" mb="5">
        <Heading size="6" weight="bold">
          {t('pageTitle')}
        </Heading>
        <Text size="2" color="gray">
          {t('subtitle', { count: kpis.totalHistoricTenders })}
        </Text>
      </Flex>

      {hasData ? (
        <>
          {/* KPI Row */}
          <Box mb="5">
            <AnalysisKpiRow stats={kpis} locale={locale} />
          </Box>

          {/* Charts Row */}
          <Flex gap="4" mb="5" wrap="wrap" className="analysis-charts-row">
            <Box style={{ flex: 1, minWidth: 300 }}>
              <CompetitorBarChart competitors={competitors} locale={locale} />
            </Box>
            <Box style={{ flex: 1, minWidth: 300 }}>
              <TrendAreaChart trends={trends} locale={locale} />
            </Box>
          </Flex>

          {/* Competitors Leaderboard */}
          <Box>
            <CompetitorsLeaderboard competitors={competitors} locale={locale} />
          </Box>
        </>
      ) : (
        /* Empty State */
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="3"
          py="9"
          className="empty-state card-surface"
        >
          <Heading size="4" color="gray">
            {t('empty.title')}
          </Heading>
          <Text size="2" color="gray">
            {t('empty.guidance')}
          </Text>
        </Flex>
      )}
    </Box>
  )
}
