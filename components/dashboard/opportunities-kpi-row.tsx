'use client'

/**
 * Opportunities KPI row: 3 cards — Total Opportunities, Ready to Push, Already Pushed.
 * Same motion and card styling as DashboardKpiRow; simpler than Tenders (no 7-card grid).
 */

import { motion } from 'framer-motion'
import { useTranslations } from '@/components/providers/i18n-provider'
import { useKpiCardVariants, useMotionConfig } from '@/lib/motion'
import { Target, Send, CheckCircle } from 'lucide-react'

export interface OpportunitiesKpiStats {
  total: number
  readyToPush: number
  alreadyPushed: number
}

interface OpportunitiesKpiRowProps {
  stats: OpportunitiesKpiStats
  locale?: string
  labels: {
    total: string
    readyToPush: string
    alreadyPushed: string
    /** i18n for section aria-label (CC-3) */
    kpiAriaLabel?: string
  }
}

const KPI_KEYS: (keyof OpportunitiesKpiStats)[] = ['total', 'readyToPush', 'alreadyPushed']

const KPI_ICONS: Record<keyof OpportunitiesKpiStats, typeof Target> = {
  total: Target,
  readyToPush: Send,
  alreadyPushed: CheckCircle,
}

function formatKpiValue(value: number, locale: string): string {
  return value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en')
}

export function OpportunitiesKpiRow({ stats, locale = 'en', labels }: OpportunitiesKpiRowProps) {
  const { container, card } = useKpiCardVariants()
  const { reduceMotion, transition } = useMotionConfig()

  const ariaLabel = labels.kpiAriaLabel ?? 'Opportunity statistics'
  return (
    <section className="dashboard-kpi-section opportunities-kpi-section" aria-label={ariaLabel}>
      <motion.div
        className="dashboard-kpi-grid opportunities-kpi-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {KPI_KEYS.map((key) => {
          const value = stats[key]
          const formattedValue = formatKpiValue(value, locale)
          const labelId = `opportunities-kpi-label-${key}`
          const Icon = KPI_ICONS[key]

          return (
            <motion.div
              key={key}
              variants={card}
              className="kpi-card"
              data-testid={`opportunities-kpi-${key}`}
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
                    initial={
                      reduceMotion
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 4 }
                    }
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
                      color: key === 'total' ? 'var(--color-info-600)' : key === 'readyToPush' ? 'var(--amber-11)' : 'var(--green-11)',
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
