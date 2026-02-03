import { createClient } from '@/lib/supabase/server'

/**
 * Analysis queries for competitors/market insights based on historic tender data.
 * Historic tenders have award_amount_sar populated.
 */

export interface CompetitorStats {
  bidderName: string
  winCount: number
  totalValue: number
  avgValue: number
  lastWinDate: string | null
}

export interface AnalysisKpiStats {
  totalAwardedValue: number
  uniqueCompetitors: number
  averageAwardValue: number
  totalHistoricTenders: number
}

export interface AwardTrend {
  period: string
  totalValue: number
  count: number
}

// Row type for KPI query
type KpiRow = {
  award_amount_sar: number | null
  winning_bidder: string | null
}

// Row type for competitor stats query
type CompetitorRow = {
  winning_bidder: string | null
  award_amount_sar: number | null
  award_date: string | null
}

// Row type for trends query
type TrendRow = {
  award_amount_sar: number | null
  award_date: string | null
}

/**
 * Get aggregated KPI stats for the analysis page.
 */
export async function getAnalysisKpis(): Promise<AnalysisKpiStats> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tenders')
    .select('award_amount_sar, winning_bidder')
    .not('award_amount_sar', 'is', null)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching analysis KPIs:', error)
    throw new Error('Failed to fetch analysis KPIs')
  }

  const rows = (data ?? []) as KpiRow[]
  const totalHistoricTenders = rows.length
  const totalAwardedValue = rows.reduce((sum, r) => sum + (r.award_amount_sar ?? 0), 0)
  const uniqueBidders = new Set(rows.map((r) => r.winning_bidder).filter(Boolean))
  const uniqueCompetitors = uniqueBidders.size
  const averageAwardValue = totalHistoricTenders > 0 ? totalAwardedValue / totalHistoricTenders : 0

  return {
    totalAwardedValue,
    uniqueCompetitors,
    averageAwardValue,
    totalHistoricTenders,
  }
}

/**
 * Get competitor stats for leaderboard and bar chart.
 * Returns competitors sorted by win count descending.
 */
export async function getCompetitorStats(limit = 20): Promise<CompetitorStats[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tenders')
    .select('winning_bidder, award_amount_sar, award_date')
    .not('award_amount_sar', 'is', null)
    .not('winning_bidder', 'is', null)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching competitor stats:', error)
    throw new Error('Failed to fetch competitor stats')
  }

  const rows = (data ?? []) as CompetitorRow[]

  // Aggregate by winning_bidder
  const competitorMap = new Map<
    string,
    { winCount: number; totalValue: number; lastWinDate: string | null }
  >()

  for (const row of rows) {
    const bidder = row.winning_bidder as string
    const existing = competitorMap.get(bidder)
    const awardDate = row.award_date

    if (existing) {
      existing.winCount += 1
      existing.totalValue += row.award_amount_sar ?? 0
      if (awardDate && (!existing.lastWinDate || awardDate > existing.lastWinDate)) {
        existing.lastWinDate = awardDate
      }
    } else {
      competitorMap.set(bidder, {
        winCount: 1,
        totalValue: row.award_amount_sar ?? 0,
        lastWinDate: awardDate,
      })
    }
  }

  // Convert to array and sort by win count
  const competitors: CompetitorStats[] = Array.from(competitorMap.entries())
    .map(([bidderName, stats]) => ({
      bidderName,
      winCount: stats.winCount,
      totalValue: stats.totalValue,
      avgValue: stats.winCount > 0 ? stats.totalValue / stats.winCount : 0,
      lastWinDate: stats.lastWinDate,
    }))
    .sort((a, b) => b.winCount - a.winCount)
    .slice(0, limit)

  return competitors
}

/**
 * Get award trends over time for the area chart.
 */
export async function getAwardTrends(
  period: 'month' | 'quarter' = 'month'
): Promise<AwardTrend[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tenders')
    .select('award_amount_sar, award_date')
    .not('award_amount_sar', 'is', null)
    .not('award_date', 'is', null)
    .is('deleted_at', null)
    .order('award_date', { ascending: true })

  if (error) {
    console.error('Error fetching award trends:', error)
    throw new Error('Failed to fetch award trends')
  }

  const rows = (data ?? []) as TrendRow[]

  // Group by period
  const trendMap = new Map<string, { totalValue: number; count: number }>()

  for (const row of rows) {
    const date = new Date(row.award_date as string)
    let periodKey: string

    if (period === 'month') {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    } else {
      const quarter = Math.floor(date.getMonth() / 3) + 1
      periodKey = `${date.getFullYear()}-Q${quarter}`
    }

    const existing = trendMap.get(periodKey)
    if (existing) {
      existing.totalValue += row.award_amount_sar ?? 0
      existing.count += 1
    } else {
      trendMap.set(periodKey, {
        totalValue: row.award_amount_sar ?? 0,
        count: 1,
      })
    }
  }

  // Convert to array sorted by period
  return Array.from(trendMap.entries())
    .map(([periodKey, stats]) => ({
      period: periodKey,
      totalValue: stats.totalValue,
      count: stats.count,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}
