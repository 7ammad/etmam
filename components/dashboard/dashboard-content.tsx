'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  CheckCircle2,
  XCircle,
  DollarSign,
  Play,
  Upload,
  Eye,
  Send,
  Loader2,
  Info,
  Sparkles,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import {
  Button,
  Flex,
  Heading,
  Text,
  Card,
  Box,
  Callout,
  Grid,
  Table,
  Badge,
} from '@radix-ui/themes'
import { FileUpload } from './file-upload'
import { EvaluationProgressModal } from '@/components/modals/evaluation-progress-modal'
import { importTendersAction, deleteTenderAction } from '@/actions/tender'
import { runEvaluationAction } from '@/actions/evaluation'
import type { TenderStatus } from '@/types/tender'

interface Tender {
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

interface DashboardContentProps {
  locale: string
  stats: {
    totalTenders: number
    qualified: number
    conditional?: number
    excluded: number
    totalValue: number
    pendingEvaluation: number
    pushedToCRM: number
  }
  tenders: Tender[]
}

export function DashboardContent({ locale, stats, tenders }: DashboardContentProps) {
  const tTender = useTranslations('tender')
  const tCommon = useTranslations('common')
  const tStats = useTranslations('stats')
  const tDashboard = useTranslations('dashboard')
  const tEvaluation = useTranslations('evaluation')
  const { locale: currentLocale } = useI18n()
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)

  const handleFileSelect = async (file: File) => {
    setIsUploading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await importTendersAction(formData)

      if (result.success) {
        setMessage({
          type: 'success',
          text: tTender('importSuccess', { count: result.data.created.toString() }),
        })
        setShowUpload(false)
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: tTender('importError') })
    } finally {
      setIsUploading(false)
    }
  }

  const handleView = (id: string) => {
    router.push(`/${locale}/dashboard/${id}`)
  }

  const handleEvaluate = (id: string) => {
    startTransition(async () => {
      const result = await runEvaluationAction(id)
      if (result.success) {
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  const handlePushToCRM = (id: string) => {
    router.push(`/${locale}/dashboard/${id}`)
  }

  const handleDelete = (id: string) => {
    if (!confirm(tCommon('confirm'))) return

    startTransition(async () => {
      const result = await deleteTenderAction(id)
      if (result.success) {
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  const formatValue = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat(currentLocale === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat(currentLocale === 'ar' ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
    }).format(new Date(dateStr))
  }

  const statsCards = [
    {
      id: 'total',
      icon: FileText,
      label: tStats('totalTenders'),
      value: stats.totalTenders.toString(),
    },
    {
      id: 'qualified',
      icon: CheckCircle2,
      label: tStats('qualified'),
      value: stats.qualified.toString(),
    },
    {
      id: 'excluded',
      icon: XCircle,
      label: tStats('excluded'),
      value: stats.excluded.toString(),
    },
    {
      id: 'value',
      icon: DollarSign,
      label: tStats('totalValue'),
      value: formatValue(stats.totalValue),
    },
  ]

  const statusColors: Record<TenderStatus, 'gray' | 'blue' | 'green' | 'purple' | 'red' | 'amber'> = {
    pending: 'gray',
    evaluating: 'blue',
    evaluated: 'green',
    approved: 'green',
    pushed: 'purple',
    rejected: 'red',
  }

  return (
    <Flex direction="column" gap="6">
      {showEvaluationModal && (
        <EvaluationProgressModal onClose={() => setShowEvaluationModal(false)} />
      )}

      {/* Message */}
      {message && (
        <Callout.Root color={message.type === 'success' ? 'green' : 'red'}>
          <Callout.Icon>
            <Info size={16} />
          </Callout.Icon>
          <Callout.Text>{message.text}</Callout.Text>
        </Callout.Root>
      )}

      {/* KPI Cards */}
      <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="5">
        {statsCards.map((card) => (
          <Card key={card.id} className="glass-card">
            <Flex direction="column" gap="3" p="4">
              <Flex align="center" gap="2">
                <card.icon size={18} style={{ color: 'var(--gray-11)' }} />
                <Text size="2" color="gray">{card.label}</Text>
              </Flex>
              <Text size="7" weight="bold">{card.value}</Text>
            </Flex>
          </Card>
        ))}
      </Grid>

      {/* Next Action Panel */}
      <Card className="glass-card">
        <Flex direction="column" gap="4" p="5">
          {stats.totalTenders > 0 ? (
            <Flex align="center" justify="between" gap="4">
              <Box>
                <Heading size="4" mb="1">{tDashboard('nextAction')}</Heading>
                <Text size="2" color="gray">
                  {tDashboard('pendingEvaluation', { count: (stats.pendingEvaluation ?? 0).toString() })}
                </Text>
              </Box>
              <Button
                size="3"
                variant="solid"
                color="iris"
                onClick={() => setShowEvaluationModal(true)}
              >
                <Play size={16} />
                {tDashboard('evaluateAll')}
              </Button>
            </Flex>
          ) : (
            <Flex direction="column" align="center" gap="3" py="6">
              <Flex
                align="center"
                justify="center"
                width="64px"
                height="64px"
                style={{
                  borderRadius: 'var(--radius-3)',
                  background: 'var(--gray-a3)',
                  color: 'var(--gray-11)',
                }}
              >
                <Upload size={24} />
              </Flex>
              <Box style={{ textAlign: 'center' }}>
                <Heading size="4" mb="1">{tDashboard('uploadFirstTitle')}</Heading>
                <Text size="2" color="gray">{tDashboard('uploadFirstDescription')}</Text>
              </Box>
              <Button size="3" variant="solid" color="iris" onClick={() => setShowUpload(true)}>
                <Upload size={16} />
                {tTender('uploadFile')}
              </Button>
            </Flex>
          )}
        </Flex>
      </Card>

      {/* File Upload */}
      {showUpload && (
        <Card className="glass-card">
          <Heading size="4" mb="4">{tTender('uploadFile')}</Heading>
          <FileUpload onFileSelect={handleFileSelect} isUploading={isUploading} />
        </Card>
      )}

      {/* Loading */}
      {isPending && (
        <Flex align="center" gap="2" style={{ color: 'var(--gray-11)' }}>
          <Loader2 size={16} className="animate-spin" />
          <Text size="2">{tCommon('loading')}</Text>
        </Flex>
      )}

      {/* Recent Tenders Table */}
      <Card className="glass-card">
        <Flex direction="column">
          <Flex justify="between" align="center" p="5" style={{ borderBottom: '1px solid var(--gray-a3)' }}>
            <Heading size="4">{tDashboard('recentTenders')}</Heading>
            <Button variant="ghost" size="2" onClick={() => router.push(`/${locale}/tenders-list`)}>
              {tDashboard('viewAll')}
            </Button>
          </Flex>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>{tTender('entity')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>{tTender('title')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>{tTender('deadline')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>{tTender('estimatedValue')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>{tTender('status')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>{tEvaluation('score')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>{tEvaluation('recommendation')}</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>{tTender('actions')}</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tenders.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8}>
                    <Flex align="center" justify="center" py="6">
                      <Text size="2" color="gray">{tTender('noTenders')}</Text>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : (
                tenders.slice(0, 6).map((tender) => (
                  <Table.Row key={tender.id}>
                    <Table.Cell>{tender.entity}</Table.Cell>
                    <Table.Cell>{tender.title}</Table.Cell>
                    <Table.Cell>{formatDate(tender.deadline)}</Table.Cell>
                    <Table.Cell>{formatValue(tender.estimated_value)}</Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[tender.status] || 'gray'} variant="soft">
                        {tTender(`statuses.${tender.status}`)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{tender.evaluation?.score ?? '-'}</Table.Cell>
                    <Table.Cell>
                      {tender.evaluation ? (
                        <Badge
                          color={
                            tender.evaluation.recommendation === 'qualified'
                              ? 'green'
                              : tender.evaluation.recommendation === 'conditional'
                                ? 'yellow'
                                : 'red'
                          }
                          variant="soft"
                        >
                          {tEvaluation(tender.evaluation.recommendation)}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2">
                        <Button variant="ghost" size="1" onClick={() => handleView(tender.id)}>
                          <Eye size={14} />
                        </Button>
                        {tender.status === 'pending' && (
                          <Button variant="ghost" size="1" onClick={() => handleEvaluate(tender.id)}>
                            <Sparkles size={14} />
                          </Button>
                        )}
                        {tender.status === 'evaluated' && (
                          <Button variant="ghost" size="1" onClick={() => handlePushToCRM(tender.id)}>
                            <Send size={14} />
                          </Button>
                        )}
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Flex>
      </Card>
    </Flex>
  )
}
