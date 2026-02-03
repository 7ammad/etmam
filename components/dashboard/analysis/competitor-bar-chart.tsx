'use client'

/**
 * Bar chart showing top competitors by win count.
 * Uses Tremor BarChart component.
 */

import { BarChart } from '@tremor/react'
import { useTranslations } from '@/components/providers/i18n-provider'
import type { CompetitorStats } from '@/lib/queries/analysis'

interface CompetitorBarChartProps {
  competitors: CompetitorStats[]
  locale?: string
}

export function CompetitorBarChart({ competitors, locale = 'en' }: CompetitorBarChartProps) {
  const t = useTranslations('analysis')

  if (competitors.length === 0) {
    return null
  }

  // Take top 10 for the chart
  const chartData = competitors.slice(0, 10).map((c) => ({
    name: c.bidderName.length > 20 ? c.bidderName.substring(0, 20) + '...' : c.bidderName,
    [t('competitors.wins')]: c.winCount,
  }))

  return (
    <div className="chart-card card-surface" data-testid="competitor-bar-chart">
      <h3 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
        {t('charts.winsByBidder')}
      </h3>
      <BarChart
        data={chartData}
        index="name"
        categories={[t('competitors.wins')]}
        colors={['teal']}
        yAxisWidth={40}
        showAnimation
        className="h-72"
      />
    </div>
  )
}
