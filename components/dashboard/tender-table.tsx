'use client'

import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Eye, Sparkles, Send, Trash2 } from 'lucide-react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Badge, Table, IconButton, Flex, Text, Box } from '@radix-ui/themes'
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

interface TenderTableProps {
  tenders: Tender[]
  onView?: (id: string) => void
  onEvaluate?: (id: string) => void
  onPushToCRM?: (id: string) => void
  onDelete?: (id: string) => void
}

export function TenderTable({
  tenders,
  onView,
  onEvaluate,
  onPushToCRM,
  onDelete,
}: TenderTableProps) {
  const t = useTranslations('tender')
  const { locale } = useI18n()

  const getStatusBadge = (status: TenderStatus) => {
    const colorMap: Record<TenderStatus, 'gray' | 'amber' | 'blue' | 'green' | 'purple' | 'red'> = {
      pending: 'gray',
      evaluating: 'amber',
      evaluated: 'blue',
      approved: 'green',
      pushed: 'purple',
      rejected: 'red',
    }
    return (
      <Badge color={colorMap[status]} variant="soft">
        {t(`statuses.${status}`)}
      </Badge>
    )
  }

  const getScoreBadge = (evaluation: Tender['evaluation']) => {
    if (!evaluation) return null
    
    const colorMap: Record<string, 'green' | 'amber' | 'red'> = {
      qualified: 'green',
      conditional: 'amber',
      excluded: 'red',
    }
    
    return (
      <Badge color={colorMap[evaluation.recommendation]} variant="solid">
        {evaluation.score}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, 'dd MMM yyyy', { locale: locale === 'ar' ? ar : undefined })
  }

  const formatValue = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (tenders.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" py="9" gap="2">
        <Text size="3" color="gray">{t('noTenders')}</Text>
      </Flex>
    )
  }

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>{t('entity')}</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>{t('title')}</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>{t('referenceNo')}</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>{t('deadline')}</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>{t('estimatedValue')}</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>{t('status')}</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">{t('actions')}</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {tenders.map((tender) => (
          <Table.Row key={tender.id}>
            <Table.Cell>
              <Text weight="medium">{tender.entity}</Text>
            </Table.Cell>
            <Table.Cell>
              <Box maxWidth="250px">
                <Text truncate>{tender.title}</Text>
              </Box>
            </Table.Cell>
            <Table.Cell>
              <Text color="gray" size="2" style={{ fontFamily: 'monospace' }}>
                {tender.reference_no}
              </Text>
            </Table.Cell>
            <Table.Cell>{formatDate(tender.deadline)}</Table.Cell>
            <Table.Cell>{formatValue(tender.estimated_value)}</Table.Cell>
            <Table.Cell>
              <Flex gap="2" align="center">
                {getStatusBadge(tender.status)}
                {getScoreBadge(tender.evaluation)}
              </Flex>
            </Table.Cell>
            <Table.Cell>
              <Flex justify="center" gap="2">
                <IconButton
                  variant="ghost"
                  color="gray"
                  onClick={() => onView?.(tender.id)}
                  title={t('viewDetails')}
                >
                  <Eye size={16} />
                </IconButton>
                {tender.status === 'pending' && (
                  <IconButton
                    variant="ghost"
                    color="amber"
                    onClick={() => onEvaluate?.(tender.id)}
                    title={t('evaluate')}
                  >
                    <Sparkles size={16} />
                  </IconButton>
                )}
                {tender.status === 'evaluated' && (
                  <IconButton
                    variant="ghost"
                    color="purple"
                    onClick={() => onPushToCRM?.(tender.id)}
                    title={t('pushToCRM')}
                  >
                    <Send size={16} />
                  </IconButton>
                )}
                <IconButton
                  variant="ghost"
                  color="red"
                  onClick={() => onDelete?.(tender.id)}
                  title={t('delete')}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
