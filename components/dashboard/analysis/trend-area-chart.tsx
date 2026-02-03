'use client'

/**
 * Area chart showing award trends over time.
 * Uses Tremor AreaChart component.
 */

import { AreaChart } from '@tremor/react'
import { useTranslations } from '@/components/providers/i18n-provider'
import type { AwardTrend } from '@/lib/queries/analysis'

interface TrendAreaChartProps {
  trends: AwardTrend[]
  locale?: string
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B SAR`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M SAR`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K SAR`
  }
  return `${value} SAR`
}

export function TrendAreaChart({ trends, locale = 'en' }: TrendAreaChartProps) {
  const t = useTranslations('analysis')

  if (trends.length === 0) {
    return null
  }

  const chartData = trends.map((trend) => ({
    period: trend.period,
    [t('kpi.totalAwarded')]: trend.totalValue,
    [t('kpi.historicTenders')]: trend.count,
  }))

  return (
    <div className="chart-card card-surface" data-testid="trend-area-chart">
      <h3 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
        {t('charts.trendsOverTime')}
      </h3>
      <AreaChart
        data={chartData}
        index="period"
        categories={[t('kpi.totalAwarded')]}
        colors={['emerald']}
        valueFormatter={formatCurrencyShort}
        yAxisWidth={80}
        showAnimation
        className="h-72"
      />
    </div>
  )
}
