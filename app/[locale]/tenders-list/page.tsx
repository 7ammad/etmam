'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useI18n, useTranslations } from '@/components/providers/i18n-provider'
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Button, 
  Table,
  TextField,
  Select,
  Grid,
} from '@radix-ui/themes'
import {
  Search,
  Send,
  Eye,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react'
import { Badge, ScoreBadge, RecommendationBadge } from '@/components/ui/data-display'
import { SearchEmptyState } from '@/components/ui/data-display'

export default function TendersListPage() {
  const { locale } = useI18n()
  const tTender = useTranslations('tender')
  const tEvaluation = useTranslations('evaluation')
  const tCommon = useTranslations('common')
  const tList = useTranslations('tendersList')
  const isRTL = locale === 'ar'
  
  const [showFilters, setShowFilters] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [recommendationFilter, setRecommendationFilter] = useState('all')

  const formatValue = (value: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(value)

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
    }).format(new Date(dateStr))

  const tenders = [
    {
      id: '1',
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
      id: '2',
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
      id: '3',
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
      id: '4',
      entityKey: 'sampleEntity4',
      titleKey: 'sampleTitle4',
      referenceNo: 'TEN-2025-004',
      deadline: '2025-04-10',
      value: 1800000,
      status: 'evaluated',
      score: 45,
      recommendation: 'excluded',
    },
    {
      id: '5',
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

  const statusToBadgeColor: Record<string, 'pending' | 'evaluating' | 'qualified' | 'success' | 'info'> = {
    pending: 'pending',
    evaluating: 'evaluating',
    evaluated: 'info',
    approved: 'success',
    pushed: 'qualified',
  }

  return (
    <Flex direction="column" gap="6">
      {/* Breadcrumb */}
      <nav aria-label={isRTL ? 'مسار التنقل' : 'Breadcrumb'}>
        <Flex align="center" gap="2">
          <NextLink 
            href={`/${locale}/dashboard`} 
            className="focus-ring"
            style={{ 
              textDecoration: 'none',
              color: 'var(--text-link)',
              fontSize: 'var(--text-sm)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {tCommon('dashboard')}
          </NextLink>
          <Text size="2" style={{ color: 'var(--text-tertiary)' }}>/</Text>
          <Text size="2" style={{ color: 'var(--text-primary)' }} aria-current="page">
            {tList('title')}
          </Text>
        </Flex>
      </nav>

      {/* Page Header */}
      <Flex justify="between" align="center" wrap="wrap" gap="4">
        <Box>
          <Heading 
            size="6" 
            style={{ 
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-1)',
            }}
          >
            {tList('title')}
          </Heading>
          <Text size="2" style={{ color: 'var(--text-secondary)' }}>
            {isRTL ? `${tenders.length} مناقصة` : `${tenders.length} tenders`}
          </Text>
        </Box>
        <Button
          variant="ghost"
          onClick={() => setShowFilters(!showFilters)}
          style={{ color: 'var(--text-secondary)' }}
        >
          {showFilters ? <X size={18} /> : <Filter size={18} />}
          <span className="desktop-only">
            {showFilters 
              ? (isRTL ? 'إخفاء الفلاتر' : 'Hide Filters')
              : (isRTL ? 'إظهار الفلاتر' : 'Show Filters')
            }
          </span>
        </Button>
      </Flex>

      {/* Filter Bar */}
      {showFilters && (
        <div 
          className="glass-card animate-fade-in-down" 
          style={{ padding: 'var(--space-5)' }}
        >
          <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
            {/* Status Filter */}
            <Box>
              <Text 
                as="label" 
                size="2" 
                weight="medium" 
                style={{ 
                  display: 'block',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {tList('status')}
              </Text>
              <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
                <Select.Trigger style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value="all">{tList('allStatuses')}</Select.Item>
                  <Select.Item value="pending">{tTender('statuses.pending')}</Select.Item>
                  <Select.Item value="evaluating">{tTender('statuses.evaluating')}</Select.Item>
                  <Select.Item value="evaluated">{tTender('statuses.evaluated')}</Select.Item>
                  <Select.Item value="pushed">{tTender('statuses.pushed')}</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Recommendation Filter */}
            <Box>
              <Text 
                as="label" 
                size="2" 
                weight="medium" 
                style={{ 
                  display: 'block',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {tEvaluation('recommendation')}
              </Text>
              <Select.Root value={recommendationFilter} onValueChange={setRecommendationFilter}>
                <Select.Trigger style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value="all">{tList('allRecommendations')}</Select.Item>
                  <Select.Item value="qualified">{tEvaluation('qualified')}</Select.Item>
                  <Select.Item value="conditional">{tEvaluation('conditional')}</Select.Item>
                  <Select.Item value="excluded">{tEvaluation('excluded')}</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Search - spans 2 columns on desktop */}
            <Box style={{ gridColumn: 'span 2' }} className="desktop-only">
              <Text 
                as="label" 
                size="2" 
                weight="medium" 
                style={{ 
                  display: 'block',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {tCommon('search')}
              </Text>
              <TextField.Root 
                placeholder={tList('searchPlaceholder')}
                style={{ width: '100%' }}
              >
                <TextField.Slot>
                  <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
                </TextField.Slot>
              </TextField.Root>
            </Box>
          </Grid>

          {/* Mobile Search */}
          <Box className="mobile-only" style={{ marginTop: 'var(--space-4)' }}>
            <TextField.Root 
              placeholder={tList('searchPlaceholder')}
              style={{ width: '100%' }}
            >
              <TextField.Slot>
                <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {/* Filter Actions */}
          <Flex gap="3" style={{ marginTop: 'var(--space-4)' }}>
            <Button 
              size="2" 
              style={{ 
                backgroundColor: 'var(--color-primary-500)',
                color: 'var(--text-inverted)',
              }}
            >
              {tList('applyFilters')}
            </Button>
            <Button 
              size="2" 
              variant="outline"
              style={{ 
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              {tList('clearFilters')}
            </Button>
          </Flex>
        </div>
      )}

      {/* Tenders Table/Cards */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {/* Desktop Table */}
        <div className="desktop-only">
          <Table.Root>
            <Table.Header>
              <Table.Row style={{ backgroundColor: 'var(--surface-muted)' }}>
                <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-semibold)' }}>
                  {tTender('entity')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-semibold)' }}>
                  {tTender('title')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-semibold)' }}>
                  {tTender('deadline')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-semibold)' }}>
                  {tTender('estimatedValue')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-semibold)' }}>
                  {tTender('status')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-semibold)' }}>
                  {tEvaluation('recommendation')}
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center" style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-semibold)' }}>
                  {tTender('actions')}
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tenders.map((tender) => (
                <Table.Row 
                  key={tender.id}
                  style={{ borderBottom: '1px solid var(--border-default)' }}
                >
                  <Table.Cell style={{ color: 'var(--text-primary)' }}>
                    <Text weight="medium">{tList(tender.entityKey)}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Box style={{ maxWidth: '250px' }}>
                      <Text style={{ color: 'var(--text-primary)' }} truncate>
                        {tList(tender.titleKey)}
                      </Text>
                      <Text 
                        size="1" 
                        style={{ 
                          color: 'var(--text-tertiary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {tender.referenceNo}
                      </Text>
                    </Box>
                  </Table.Cell>
                  <Table.Cell style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(tender.deadline)}
                  </Table.Cell>
                  <Table.Cell style={{ color: 'var(--text-primary)' }}>
                    {formatValue(tender.value)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={statusToBadgeColor[tender.status] || 'pending'} size="sm">
                      {tTender(`statuses.${tender.status}`)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {tender.recommendation ? (
                      <Flex gap="2" align="center">
                        <RecommendationBadge recommendation={tender.recommendation} />
                        {tender.score && <ScoreBadge score={tender.score} size="sm" />}
                      </Flex>
                    ) : (
                      <Text style={{ color: 'var(--text-tertiary)' }}>-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex justify="center" gap="1">
                      <ActionButton
                        icon={<Eye size={16} />}
                        title={tTender('viewDetails')}
                      />
                      {tender.status === 'pending' && (
                        <ActionButton
                          icon={<Sparkles size={16} />}
                          title={tTender('evaluate')}
                          color="warning"
                        />
                      )}
                      {tender.status === 'evaluated' && (
                        <ActionButton
                          icon={<Send size={16} />}
                          title={tTender('pushToCRM')}
                          color="primary"
                        />
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </div>

        {/* Mobile Card View */}
        <div className="mobile-only" style={{ padding: 'var(--space-4)' }}>
          <Flex direction="column" gap="3">
            {tenders.map((tender) => (
              <TenderCard
                key={tender.id}
                tender={tender}
                formatDate={formatDate}
                formatValue={formatValue}
                tList={tList}
                tTender={tTender}
                statusToBadgeColor={statusToBadgeColor}
              />
            ))}
          </Flex>
        </div>

        {/* Pagination */}
        <Flex 
          justify="between" 
          align="center" 
          wrap="wrap"
          gap="4"
          style={{ 
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <Text size="2" style={{ color: 'var(--text-secondary)' }}>
            {tList('paginationSummary')}
          </Text>
          <Flex gap="2">
            <PaginationButton disabled>
              <ChevronLeft size={16} className={isRTL ? 'flip-rtl' : ''} />
              <span className="desktop-only">{tList('prev')}</span>
            </PaginationButton>
            <PaginationButton active>1</PaginationButton>
            <PaginationButton>2</PaginationButton>
            <PaginationButton>3</PaginationButton>
            <PaginationButton>
              <span className="desktop-only">{tList('next')}</span>
              <ChevronRight size={16} className={isRTL ? 'flip-rtl' : ''} />
            </PaginationButton>
          </Flex>
        </Flex>
      </div>
    </Flex>
  )
}

// Action Button
function ActionButton({
  icon,
  title,
  color = 'neutral',
}: {
  icon: React.ReactNode
  title: string
  color?: 'neutral' | 'primary' | 'warning'
}) {
  const colorMap = {
    neutral: {
      default: 'var(--text-tertiary)',
      hover: 'var(--text-primary)',
      bg: 'var(--surface-muted)',
    },
    primary: {
      default: 'var(--color-primary-500)',
      hover: 'var(--color-primary-600)',
      bg: 'var(--color-primary-50)',
    },
    warning: {
      default: 'var(--color-warning)',
      hover: 'var(--color-warning-600)',
      bg: 'var(--color-warning-50)',
    },
  }
  const colors = colorMap[color]

  return (
    <button
      title={title}
      aria-label={title}
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: 'transparent',
        color: colors.default,
        cursor: 'pointer',
        transition: 'var(--transition-all)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg
        e.currentTarget.style.color = colors.hover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color = colors.default
      }}
    >
      {icon}
    </button>
  )
}

// Pagination Button
function PaginationButton({
  children,
  active,
  disabled,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      disabled={disabled}
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-1)',
        minWidth: '36px',
        height: '36px',
        padding: '0 var(--space-3)',
        borderRadius: 'var(--radius-md)',
        border: active ? 'none' : '1px solid var(--border-default)',
        background: active ? 'var(--color-primary-500)' : 'var(--surface-raised)',
        color: active ? 'var(--text-inverted)' : disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'var(--transition-all)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

// Mobile Tender Card
function TenderCard({
  tender,
  formatDate,
  formatValue,
  tList,
  tTender,
  statusToBadgeColor,
}: {
  tender: {
    id: string
    entityKey: string
    titleKey: string
    referenceNo: string
    deadline: string
    value: number
    status: string
    score: number | null
    recommendation: string | null
  }
  formatDate: (date: string) => string
  formatValue: (value: number) => string
  tList: (key: string) => string
  tTender: (key: string) => string
  statusToBadgeColor: Record<string, 'pending' | 'evaluating' | 'qualified' | 'success' | 'info'>
}) {
  return (
    <div
      className="glass-card"
      style={{ padding: 'var(--space-4)' }}
    >
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex justify="between" align="start">
          <Box style={{ flex: 1 }}>
            <Text 
              size="1" 
              style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}
            >
              {tList(tender.entityKey)}
            </Text>
            <Text 
              size="3" 
              weight="bold"
              style={{ 
                color: 'var(--text-primary)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {tList(tender.titleKey)}
            </Text>
          </Box>
          <Badge color={statusToBadgeColor[tender.status] || 'pending'} size="sm">
            {tTender(`statuses.${tender.status}`)}
          </Badge>
        </Flex>

        {/* Details */}
        <Flex gap="4" wrap="wrap">
          <Box>
            <Text size="1" style={{ color: 'var(--text-tertiary)' }}>{tTender('deadline')}</Text>
            <Text size="2" style={{ color: 'var(--text-primary)' }}>{formatDate(tender.deadline)}</Text>
          </Box>
          <Box>
            <Text size="1" style={{ color: 'var(--text-tertiary)' }}>{tTender('estimatedValue')}</Text>
            <Text size="2" style={{ color: 'var(--text-primary)' }}>{formatValue(tender.value)}</Text>
          </Box>
          {tender.recommendation && (
            <Box>
              <Text size="1" style={{ color: 'var(--text-tertiary)' }}>Score</Text>
              <Flex gap="2" align="center">
                {tender.score && <ScoreBadge score={tender.score} size="sm" />}
              </Flex>
            </Box>
          )}
        </Flex>

        {/* Actions */}
        <Flex 
          gap="2" 
          justify="end" 
          style={{ 
            borderTop: '1px solid var(--border-default)', 
            paddingTop: 'var(--space-3)',
          }}
        >
          <ActionButton icon={<Eye size={16} />} title={tTender('viewDetails')} />
          {tender.status === 'pending' && (
            <ActionButton icon={<Sparkles size={16} />} title={tTender('evaluate')} color="warning" />
          )}
          {tender.status === 'evaluated' && (
            <ActionButton icon={<Send size={16} />} title={tTender('pushToCRM')} color="primary" />
          )}
        </Flex>
      </Flex>
    </div>
  )
}
