'use client'

import { FileText, CheckCircle, AlertCircle, XCircle, HelpCircle, Clock, Calendar } from 'lucide-react'
import { Card, Flex, Box, Text } from '@radix-ui/themes'
import type { LucideIcon } from 'lucide-react'

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

type KpiAccent = 'primary' | 'success' | 'warning' | 'danger' | 'muted'

const kpiConfig: {
  key: keyof DashboardKpiStats
  accent: KpiAccent
  icon: LucideIcon
  featured?: boolean
}[] = [
  { key: 'total', accent: 'primary', icon: FileText, featured: true },
  { key: 'qualified', accent: 'success', icon: CheckCircle, featured: true },
  { key: 'conditional', accent: 'warning', icon: AlertCircle, featured: true },
  { key: 'excluded', accent: 'danger', icon: XCircle, featured: true },
  { key: 'notEvaluated', accent: 'muted', icon: HelpCircle },
  { key: 'deadlinesNext7', accent: 'primary', icon: Clock },
  { key: 'deadlinesNext30', accent: 'primary', icon: Calendar },
]

function formatKpiValue(value: number, locale: string): string {
  return value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en')
}

export function DashboardKpiRow({ stats, locale = 'en', labels }: DashboardKpiRowProps) {
  return (
    <section className="dashboard-kpi-section" aria-label="Tender statistics">
      <div className="dashboard-kpi-grid">
        {kpiConfig.map(({ key, accent, icon: Icon, featured }) => (
          <Card
            key={key}
            className="kpi-card"
            data-accent={accent}
            data-featured={featured ? 'true' : undefined}
            data-testid={`kpi-${key}`}
          >
            <Flex gap="3" align="center">
              <Box className="kpi-icon-wrapper" data-accent={accent}>
                <Icon size={20} aria-hidden />
              </Box>
              <Flex direction="column" gap="0">
                <Text className="kpi-value" as="span">
                  {formatKpiValue(stats[key], locale)}
                </Text>
                <Text className="kpi-label" as="span">
                  {labels[key]}
                </Text>
              </Flex>
            </Flex>
          </Card>
        ))}
      </div>
    </section>
  )
}
