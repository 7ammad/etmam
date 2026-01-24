'use client'

import NextLink from 'next/link'
import { useI18n, useTranslations } from '@/components/providers/i18n-provider'
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Card, 
  Button, 
  Table,
  TextField,
  Select,
  Badge,
  Grid,
} from '@radix-ui/themes'
import {
  Search,
  Send,
  Clock,
  CheckCircle2,
  Plane,
  AlertTriangle,
  XCircle,
  Loader2,
} from 'lucide-react'

export default function TendersListPage() {
  const { locale } = useI18n()
  const tTender = useTranslations('tender')
  const tEvaluation = useTranslations('evaluation')
  const tCommon = useTranslations('common')
  const tList = useTranslations('tendersList')

  const formatValue = (value: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(value)

  const tenders = [
    {
      entityKey: 'sampleEntity1',
      titleKey: 'sampleTitle1',
      referenceNo: 'TEN-2025-001',
      deadline: '2025-02-28',
      value: 1200000,
      status: 'pending',
      score: null,
      recommendation: null,
    },
    {
      entityKey: 'sampleEntity2',
      titleKey: 'sampleTitle2',
      referenceNo: 'TEN-2025-002',
      deadline: '2025-03-15',
      value: 2500000,
      status: 'evaluated',
      score: 85,
      recommendation: 'qualified',
    },
    {
      entityKey: 'sampleEntity3',
      titleKey: 'sampleTitle3',
      referenceNo: 'TEN-2025-003',
      deadline: '2025-03-20',
      value: 800000,
      status: 'pushed',
      score: 72,
      recommendation: 'conditional',
    },
    {
      entityKey: 'sampleEntity4',
      titleKey: 'sampleTitle4',
      referenceNo: 'TEN-2025-004',
      deadline: '2025-04-10',
      value: 1800000,
      status: 'evaluated',
      score: 68,
      recommendation: 'excluded',
    },
    {
      entityKey: 'sampleEntity5',
      titleKey: 'sampleTitle5',
      referenceNo: 'TEN-2025-005',
      deadline: '2025-04-25',
      value: 3200000,
      status: 'evaluating',
      score: null,
      recommendation: null,
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'gray' as const, icon: Clock, label: tTender('statuses.pending') },
      evaluating: { color: 'blue' as const, icon: Loader2, label: tTender('statuses.evaluating') },
      evaluated: { color: 'green' as const, icon: CheckCircle2, label: tTender('statuses.evaluated') },
      pushed: { color: 'purple' as const, icon: Plane, label: tTender('statuses.pushed') },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null
    
    const Icon = config.icon
    
    return (
      <Badge color={config.color} variant="soft">
        <Flex align="center" gap="1">
          <Icon size={12} />
          {config.label}
        </Flex>
      </Badge>
    )
  }

  const getRecommendationBadge = (recommendation: string | null) => {
    if (!recommendation) return '-'
    
    const recConfig = {
      qualified: { color: 'green' as const, icon: CheckCircle2, label: tEvaluation('qualified') },
      conditional: { color: 'yellow' as const, icon: AlertTriangle, label: tEvaluation('conditional') },
      excluded: { color: 'red' as const, icon: XCircle, label: tEvaluation('excluded') },
    }

    const config = recConfig[recommendation as keyof typeof recConfig]
    if (!config) return '-'
    
    const Icon = config.icon
    
    return (
      <Badge color={config.color} variant="soft">
        <Flex align="center" gap="1">
          <Icon size={12} />
          {config.label}
        </Flex>
      </Badge>
    )
  }

  return (
    <Box style={{ flex: 1 }}>
          {/* Breadcrumb */}
          <Flex align="center" gap="2" mb="6">
            <NextLink href={`/${locale}/dashboard`} style={{ textDecoration: 'none' }}>
              <Text size="2" color="gray" highContrast style={{ cursor: 'pointer' }}>
                {tCommon('dashboard')}
              </Text>
            </NextLink>
            <Text size="2" color="gray">/</Text>
            <Text size="2">{tList('title')}</Text>
          </Flex>

          {/* Filter Bar */}
          <Card className="glass-card" mb="6">
            <Flex direction="column" gap="4" p="5">
              <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
                {/* Status Filter */}
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    {tList('status')}
                  </Text>
                  <Select.Root defaultValue="all">
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value="all">
                        {tList('allStatuses')}
                      </Select.Item>
                      <Select.Item value="pending">
                        {tTender('statuses.pending')}
                      </Select.Item>
                      <Select.Item value="evaluating">
                        {tTender('statuses.evaluating')}
                      </Select.Item>
                      <Select.Item value="evaluated">
                        {tTender('statuses.evaluated')}
                      </Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Recommendation Filter */}
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    {tEvaluation('recommendation')}
                  </Text>
                  <Select.Root defaultValue="all">
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value="all">
                        {tList('allRecommendations')}
                      </Select.Item>
                      <Select.Item value="qualified">
                        {tEvaluation('qualified')}
                      </Select.Item>
                      <Select.Item value="conditional">
                        {tEvaluation('conditional')}
                      </Select.Item>
                      <Select.Item value="excluded">
                        {tEvaluation('excluded')}
                      </Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Score Min */}
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    {tList('minScore')}
                  </Text>
                  <TextField.Root 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="0"
                    style={{ width: '100%' }}
                  />
                </Box>

                {/* Score Max */}
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    {tList('maxScore')}
                  </Text>
                  <TextField.Root 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="100"
                    style={{ width: '100%' }}
                  />
                </Box>
              </Grid>

              {/* Search */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  {tCommon('search')}
                </Text>
                <TextField.Root 
                  placeholder={tList('searchPlaceholder')}
                  style={{ width: '100%' }}
                >
                  <TextField.Slot>
                    <Search size={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Box>

              {/* Filter Actions */}
              <Flex gap="3">
                <Button size="2" variant="solid" color="iris">
                  {tList('applyFilters')}
                </Button>
                <Button size="2" variant="outline" color="gray">
                  {tList('clearFilters')}
                </Button>
              </Flex>
            </Flex>
          </Card>

          {/* Tenders Table */}
          <Card className="glass-card">
            <Flex direction="column">
              <Flex p="5" style={{ borderBottom: '1px solid var(--gray-a3)' }}>
                <Heading size="4">{tList('tableTitle')}</Heading>
              </Flex>
              
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>{tTender('entity')}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{tTender('title')}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{tTender('referenceNo')}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{tTender('deadline')}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{tTender('estimatedValue')}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{tTender('status')}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{tEvaluation('score')}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{tEvaluation('recommendation')}</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>{tTender('actions')}</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {tenders.map((tender, index) => (
                    <Table.Row key={index}>
                      <Table.Cell>{tList(tender.entityKey)}</Table.Cell>
                      <Table.Cell>{tList(tender.titleKey)}</Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">{tender.referenceNo}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">{tender.deadline}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">{formatValue(tender.value)}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        {getStatusBadge(tender.status)}
                      </Table.Cell>
                      <Table.Cell>
                        {tender.score || '-'}
                      </Table.Cell>
                      <Table.Cell>
                        {getRecommendationBadge(tender.recommendation)}
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          {tender.status === 'pending' ? (
                            <Button size="1" variant="ghost">
                              {tTender('evaluate')}
                            </Button>
                          ) : tender.status === 'evaluated' ? (
                            <Button size="1" variant="ghost">
                              <Send size={14} />
                            </Button>
                          ) : tender.status === 'pushed' ? (
                            <Button size="1" variant="ghost">
                              {tList('openInCrm')}
                            </Button>
                          ) : null}
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>

              {/* Pagination */}
              <Flex justify="between" align="center" p="5" style={{ borderTop: '1px solid var(--gray-a3)' }}>
                <Text size="2" color="gray">
                  {tList('paginationSummary')}
                </Text>
                <Flex gap="2">
                  <Button size="1" variant="outline" disabled>
                    {tList('prev')}
                  </Button>
                  <Button size="1" variant="solid" color="iris">1</Button>
                  <Button size="1" variant="outline">2</Button>
                  <Button size="1" variant="outline">3</Button>
                  <Button size="1" variant="outline">
                    {tList('next')}
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          </Card>
    </Box>
  )
}
