'use client'

/**
 * Competitors Leaderboard: Table showing top competitors by win count.
 * Columns: Rank, Bidder Name, Wins, Total Value, Avg Value, Last Win Date.
 */

import { Table } from '@radix-ui/themes'
import { useTranslations } from '@/components/providers/i18n-provider'
import type { CompetitorStats } from '@/lib/queries/analysis'

interface CompetitorsLeaderboardProps {
  competitors: CompetitorStats[]
  locale?: string
}

function formatCurrency(value: number, locale: string): string {
  const localeStr = locale === 'ar' ? 'ar-SA' : 'en'
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

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function CompetitorsLeaderboard({ competitors, locale = 'en' }: CompetitorsLeaderboardProps) {
  const t = useTranslations('analysis')

  if (competitors.length === 0) {
    return null
  }

  return (
    <div className="competitors-leaderboard card-surface" data-testid="competitors-leaderboard">
      <h3 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
        {t('competitors.title')}
      </h3>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell style={{ width: 60 }}>{t('competitors.rank')}</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>{t('competitors.bidder')}</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: 'center' }}>{t('competitors.wins')}</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: 'end' }}>{t('competitors.totalValue')}</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: 'end' }}>{t('competitors.avgValue')}</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: 'end' }}>{t('competitors.lastWin')}</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {competitors.map((competitor, index) => (
            <Table.Row key={competitor.bidderName}>
              <Table.Cell>
                <span
                  className="rank-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor:
                      index === 0
                        ? 'var(--amber-9)'
                        : index === 1
                          ? 'var(--gray-8)'
                          : index === 2
                            ? 'var(--orange-9)'
                            : 'var(--gray-4)',
                    color: index < 3 ? 'white' : 'var(--gray-12)',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {index + 1}
                </span>
              </Table.Cell>
              <Table.Cell style={{ fontWeight: 500 }}>{competitor.bidderName}</Table.Cell>
              <Table.Cell style={{ textAlign: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 32,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-2)',
                    backgroundColor: 'var(--green-3)',
                    color: 'var(--green-11)',
                    fontWeight: 600,
                  }}
                >
                  {competitor.winCount}
                </span>
              </Table.Cell>
              <Table.Cell style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(competitor.totalValue, locale)}
              </Table.Cell>
              <Table.Cell style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(competitor.avgValue, locale)}
              </Table.Cell>
              <Table.Cell style={{ textAlign: 'end', color: 'var(--gray-11)' }}>
                {formatDate(competitor.lastWinDate, locale)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </div>
  )
}
