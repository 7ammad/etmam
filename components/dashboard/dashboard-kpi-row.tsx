'use client'

/**
 * Dashboard KPI row: label + value center-left, 3D icon center-right per card.
 * No trend/delta. Thin containers, theme-bound.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from '@/components/providers/i18n-provider'
import { useKpiCardVariants, useMotionConfig } from '@/lib/motion'

export interface DashboardKpiStats {
  total: number
  qualified: number
  conditional: number
  excluded: number
  notEvaluated: number
  deadlinesNext7: number
  deadlinesNext30: number
}

interface DashboardKpiRowProps {
  stats: DashboardKpiStats
  locale?: string
  labels: {
    total: string
    qualified: string
    conditional: string
    excluded: string
    notEvaluated: string
    deadlinesNext7: string
    deadlinesNext30: string
  }
}

/** 3D icons: no background, no box; center-right in card. */
const KPI_3D_ICONS: Record<keyof DashboardKpiStats, { src: string; alt: string }> = {
  total: {
    src: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/07b98ecce0-a80c538653e02ad849b1.png',
    alt: '3D document folder icon',
  },
  qualified: {
    src: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/a641eed81f-bee62f8dbf00eda3dcdf.png',
    alt: '3D checkmark shield icon',
  },
  conditional: {
    src: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/380af74fbb-25fa7e3162ea7a51e6da.png',
    alt: '3D warning clock icon',
  },
  excluded: {
    src: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/fa52a60bcc-a1aac58ec10a9cebb475.png',
    alt: '3D cross x mark icon',
  },
  notEvaluated: {
    src: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/a45fe1cafc-0d5fd6d47c623fe149f8.png',
    alt: '3D question mark icon',
  },
  deadlinesNext7: {
    src: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/9b65a7cb9e-4c70191a00c0b0c8eda7.png',
    alt: '3D alarm clock icon',
  },
  deadlinesNext30: {
    src: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/5d1527ddc0-4f01b87f240084346d99.png',
    alt: '3D calendar icon',
  },
}

const kpiConfig: { key: keyof DashboardKpiStats }[] = [
  { key: 'total' },
  { key: 'qualified' },
  { key: 'conditional' },
  { key: 'excluded' },
  { key: 'notEvaluated' },
  { key: 'deadlinesNext7' },
  { key: 'deadlinesNext30' },
]

function formatKpiValue(value: number, locale: string): string {
  return value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en')
}

export function DashboardKpiRow({ stats, locale = 'en', labels }: DashboardKpiRowProps) {
  const { container, card } = useKpiCardVariants()
  const { reduceMotion, transition } = useMotionConfig()

  return (
    <section className="dashboard-kpi-section" aria-label="Tender statistics">
      <motion.div
        className="dashboard-kpi-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {kpiConfig.map(({ key }) => {
          const value = stats[key]
          const formattedValue = formatKpiValue(value, locale)
          const labelId = `kpi-label-${key}`

          return (
            <motion.div
              key={key}
              variants={card}
              className="kpi-card"
              data-testid={`kpi-${key}`}
              aria-describedby={labelId}
            >
              <div className="kpi-card-inner">
                <div className="kpi-card-text">
                  <span id={labelId} className="kpi-label">
                    {labels[key]}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={formattedValue}
                      className="kpi-value"
                      initial={
                        reduceMotion
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: 4 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: -4 }
                      }
                      transition={transition}
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {formattedValue}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="kpi-icon-wrapper kpi-icon-3d">
                  <img
                    src={KPI_3D_ICONS[key].src}
                    alt={KPI_3D_ICONS[key].alt}
                    className="kpi-icon-3d-img"
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
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
