'use client'

import { FileText, CheckCircle, XCircle, DollarSign, Clock, Send } from 'lucide-react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { StatCard, StatCardGrid } from '@/components/ui/data-display'

interface StatsCardsProps {
  stats: {
    totalTenders: number
    qualified: number
    conditional?: number
    excluded: number
    totalValue: number
    pendingEvaluation: number
    pushedToCRM: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('stats')
  const { locale } = useI18n()

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calculate trends (example - these could come from actual data)
  const qualifiedRate = stats.totalTenders > 0 
    ? Math.round((stats.qualified / stats.totalTenders) * 100) 
    : 0

  const excludedRate = stats.totalTenders > 0 
    ? Math.round((stats.excluded / stats.totalTenders) * 100) 
    : 0

  return (
    <StatCardGrid>
      <StatCard
        title={t('totalTenders')}
        value={stats.totalTenders}
        icon={<FileText size={24} />}
        color="primary"
        trend={stats.totalTenders > 0 ? {
          value: '18%',
          direction: 'up' as const,
          label: locale === 'ar' ? 'هذا الشهر' : 'this month'
        } : undefined}
      />
      
      <StatCard
        title={t('qualified')}
        value={stats.qualified}
        icon={<CheckCircle size={24} />}
        color="purple"
        trend={stats.qualified > 0 ? {
          value: '1%',
          direction: 'down' as const,
          label: locale === 'ar' ? 'هذا الشهر' : 'this month'
        } : undefined}
      />
      
      <StatCard
        title={locale === 'ar' ? 'نشط الآن' : 'Active Now'}
        value={stats.pushedToCRM}
        icon={<Send size={24} />}
        color="orange"
        liveIndicator={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginTop: 'var(--space-1)',
          }}>
            {/* Placeholder for avatar group */}
            <div style={{
              display: 'flex',
              marginInlineEnd: 'var(--space-2)',
            }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-primary-200)',
                    border: '2px solid var(--surface-card)',
                    marginInlineStart: i > 1 ? '-8px' : '0',
                  }}
                />
              ))}
            </div>
          </div>
        }
      />
    </StatCardGrid>
  )
}

// Compact version for smaller displays
export function StatsCardsCompact({ stats }: StatsCardsProps) {
  const t = useTranslations('stats')
  const { locale } = useI18n()

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-3)',
      }}
    >
      <StatCard
        title={t('totalTenders')}
        value={stats.totalTenders}
        icon={<FileText size={18} />}
        color="primary"
      />
      <StatCard
        title={t('qualified')}
        value={stats.qualified}
        icon={<CheckCircle size={18} />}
        color="success"
      />
      <StatCard
        title={t('excluded')}
        value={stats.excluded}
        icon={<XCircle size={18} />}
        color="error"
      />
      <StatCard
        title={t('totalValue')}
        value={formatCurrency(stats.totalValue)}
        icon={<DollarSign size={18} />}
        color="info"
      />
    </div>
  )
}
