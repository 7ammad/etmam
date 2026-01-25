import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { getTenders, getTenderStats } from '@/lib/queries/tender'
import type { TenderStatus } from '@/types/tender'

type Props = {
  params: Promise<{ locale: string }>
}

type Tender = {
  id: string
  entity: string
  title: string
  reference_no: string
  deadline: string
  estimated_value: number | null
  status: TenderStatus
  evaluation?: {
    score: number
    recommendation: 'qualified' | 'conditional' | 'excluded'
  } | null
}

type Stats = {
  totalTenders: number
  qualified: number
  conditional?: number
  excluded: number
  totalValue: number
  pendingEvaluation: number
  pushedToCRM: number
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params

  // Fetch real data from Supabase
  let stats: Stats
  let tenders: Tender[]

  try {
    const [statsData, tendersData] = await Promise.all([
      getTenderStats(),
      getTenders(),
    ])
    stats = statsData as Stats
    tenders = tendersData.map((tender) => ({
      id: tender.id,
      entity: tender.entity,
      title: tender.title,
      reference_no: tender.reference_no,
      deadline: tender.deadline,
      estimated_value: tender.estimated_value ? Number(tender.estimated_value) : null,
      status: tender.status,
      evaluation: tender.evaluation
        ? {
            score: tender.evaluation.score,
            recommendation: tender.evaluation.recommendation,
          }
        : null,
    })) as Tender[]
  } catch (error) {
    // Fallback to empty data if database is not available
    console.error('Failed to fetch dashboard data:', error)
    stats = {
      totalTenders: 0,
      qualified: 0,
      excluded: 0,
      totalValue: 0,
      pendingEvaluation: 0,
      pushedToCRM: 0,
    }
    tenders = []
  }

  return (
    <DashboardContent
      locale={locale}
      stats={stats}
      tenders={tenders}
    />
  )
}
