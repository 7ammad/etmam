'use client'

import { FileText, CheckCircle, AlertCircle, XCircle, HelpCircle, Clock, Calendar } from 'lucide-react'
import { StatCard, type StatCardVariant } from './stat-card'

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

const kpiConfig: { key: keyof DashboardKpiStats; variant: StatCardVariant; icon: typeof FileText }[] = [
  { key: 'total', variant: 'default', icon: FileText },
  { key: 'qualified', variant: 'qualified', icon: CheckCircle },
  { key: 'conditional', variant: 'conditional', icon: AlertCircle },
  { key: 'excluded', variant: 'excluded', icon: XCircle },
  { key: 'notEvaluated', variant: 'neutral', icon: HelpCircle },
  { key: 'deadlinesNext7', variant: 'deadline', icon: Clock },
  { key: 'deadlinesNext30', variant: 'deadline', icon: Calendar },
]

export function DashboardKpiRow({ stats, labels }: DashboardKpiRowProps) {
  return (
    <div className="dashboard-kpi-grid">
      {kpiConfig.map(({ key, variant, icon }) => (
        <StatCard
          key={key}
          label={labels[key]}
          value={stats[key]}
          variant={variant}
          icon={icon}
        />
      ))}
    </div>
  )
}
