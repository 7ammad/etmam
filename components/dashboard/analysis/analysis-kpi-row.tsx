'use client'

/**
 * Analysis KPI row: 4 cards — Total Awarded Value, Unique Competitors, Average Award, Historic Tenders.
 * Same motion and card styling as OpportunitiesKpiRow.
 */

import { motion } from 'framer-motion'
import { useTranslations } from '@/components/providers/i18n-provider'
import { useKpiCardVariants, useMotionConfig } from '@/lib/motion'
import { DollarSign, Users, TrendingUp, FileText } from 'lucide-react'
import type { AnalysisKpiStats } from '@/lib/queries/analysis'

interface AnalysisKpiRowProps {
  stats: AnalysisKpiStats
  locale?: string
}

const KPI_KEYS: (keyof AnalysisKpiStats)[] = [
  'totalAwardedValue',
  'uniqueCompetitors',
  'averageAwardValue',
  'totalHistoricTenders',
]

const KPI_ICONS: Record<keyof AnalysisKpiStats, typeof DollarSign> = {
  totalAwardedValue: DollarSign,
  uniqueCompetitors: Users,
  averageAwardValue: TrendingUp,
  totalHistoricTenders: FileText,
}

const KPI_COLORS: Record<keyof AnalysisKpiStats, string> = {
  totalAwardedValue: 'var(--green-11)',
  uniqueCompetitors: 'var(--color-info-600)',
  averageAwardValue: 'var(--amber-11)',
  totalHistoricTenders: 'var(--violet-11)',
}

function formatKpiValue(key: keyof AnalysisKpiStats, value: number, locale: string): string {
  const localeStr = locale === 'ar' ? 'ar-SA' : 'en'

  if (key === 'totalAwardedValue' || key === 'averageAwardValue') {
    // Format as SAR currency, compact for large values
    if (value >= 1_000_000) {
      return new Intl.NumberFormat(localeStr, {
        style: 'currency',
        currency: 'SAR',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)
    }
    return new Intl.NumberFormat(localeStr, {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return value.toLocaleString(localeStr)
}

export function AnalysisKpiRow({ stats, locale = 'en' }: AnalysisKpiRowProps) {
  const t = useTranslations('analysis')
  const { container, card } = useKpiCardVariants()
  const { reduceMotion, transition } = useMotionConfig()

  const labels: Record<keyof AnalysisKpiStats, string> = {
    totalAwardedValue: t('kpi.totalAwarded'),
    uniqueCompetitors: t('kpi.uniqueCompetitors'),
    averageAwardValue: t('kpi.avgAward'),
    totalHistoricTenders: t('kpi.historicTenders'),
  }

  return (
    <section className="dashboard-kpi-section analysis-kpi-section" aria-label={t('pageTitle')}>
      <motion.div
        className="dashboard-kpi-grid analysis-kpi-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {KPI_KEYS.map((key) => {
          const value = stats[key]
          const formattedValue = formatKpiValue(key, value, locale)
          const labelId = `analysis-kpi-label-${key}`
          const Icon = KPI_ICONS[key]

          return (
            <motion.div
              key={key}
              variants={card}
              className="kpi-card"
              data-testid={`analysis-kpi-${key}`}
              aria-describedby={labelId}
            >
              <div className="kpi-card-inner">
                <div className="kpi-card-text">
                  <span id={labelId} className="kpi-label">
                    {labels[key]}
                  </span>
                  <motion.span
                    key={formattedValue}
                    className="kpi-value"
                    initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transition}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {formattedValue}
                  </motion.span>
                </div>
                <div className="kpi-icon-wrapper kpi-icon-3d">
                  <Icon
                    style={{
                      width: 48,
                      height: 48,
                      color: KPI_COLORS[key],
                    }}
                    aria-hidden
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}
