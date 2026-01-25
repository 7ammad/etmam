'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Eye, Sparkles, Send, Trash2, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Table, Flex, Text, Box } from '@radix-ui/themes'
import { Badge, ScoreBadge } from '@/components/ui/data-display'
import { NoDataEmptyState } from '@/components/ui/data-display'
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

const statusToBadgeColor: Record<TenderStatus, 'pending' | 'evaluating' | 'qualified' | 'success' | 'info' | 'error'> = {
  pending: 'pending',
  evaluating: 'evaluating',
  evaluated: 'info',
  approved: 'success',
  pushed: 'qualified',
  rejected: 'error',
}

export function TenderTable({
  tenders,
  onView,
  onEvaluate,
  onPushToCRM,
  onDelete,
}: TenderTableProps) {
  const t = useTranslations('tender')
  const tEval = useTranslations('evaluation')
  const { locale } = useI18n()
  const isRTL = locale === 'ar'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

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
      <NoDataEmptyState 
        title={t('noTenders')}
        description={isRTL ? 'قم بتحميل مناقصات للبدء' : 'Upload tenders to get started'}
      />
    )
  }

  // Pagination state
  const itemsPerPage = 8
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(tenders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTenders = tenders.slice(startIndex, endIndex)

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    color = 'var(--text-secondary)',
    hoverColor = 'var(--color-primary-500)'
  }: { 
    icon: React.ElementType
    label: string
    onClick: () => void
    color?: string
    hoverColor?: string
  }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: 'transparent',
        color: color,
        cursor: 'pointer',
        transition: 'var(--transition-colors)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = hoverColor
        e.currentTarget.style.backgroundColor = `${hoverColor}15`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = color
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <Icon size={18} />
    </button>
  )

  return (
    <div 
      style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-muted)',
        overflow: 'hidden',
      }}
    >
      {/* Card Header */}
      <Flex 
        direction="column"
        gap="3"
        style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <Flex align="center" justify="between" wrap="wrap" gap="4">
          <Box>
            <Text 
              size="5" 
              weight="bold" 
              style={{ 
                display: 'block',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {isRTL ? 'كافة المناقصات' : 'All Tenders'}
            </Text>
            <Text 
              size="2" 
              style={{ 
                display: 'block',
                color: 'var(--color-primary-600)',
              }}
            >
              {isRTL ? 'المناقصات النشطة' : 'Active Tenders'}
            </Text>
          </Box>

          {/* Search and Sort */}
          <Flex align="center" gap="3">
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                width: '240px',
              }}
            >
              <Search 
                size={16} 
                style={{
                  position: 'absolute',
                  [isRTL ? 'right' : 'left']: 'var(--space-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'بحث...' : 'Search...'}
                style={{
                  width: '100%',
                  height: '36px',
                  paddingInline: isRTL ? 'var(--space-3) var(--space-9)' : 'var(--space-9) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--surface-ground)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  transition: 'var(--transition-colors)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-focus)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                }}
              />
            </div>

            {/* Sort Dropdown */}
            <Flex 
              align="center" 
              gap="2"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--surface-ground)',
                cursor: 'pointer',
                transition: 'var(--transition-colors)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              <Text size="2">
                {isRTL ? 'ترتيب حسب: الأحدث' : 'Sort by: Newest'}
              </Text>
              <ChevronDown size={16} />
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      {/* Desktop Table */}
      <div className="desktop-only">
        <Table.Root>
          <Table.Header>
            <Table.Row style={{ backgroundColor: 'transparent' }}>
              <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                {t('entity')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                {t('title')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                {t('referenceNo')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                {t('deadline')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                {t('estimatedValue')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                {t('status')}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="center" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}>
                {t('actions')}
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentTenders.map((tender) => (
              <Table.Row 
                key={tender.id}
                style={{ 
                  borderBottom: 'none',
                  transition: 'var(--transition-colors)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-muted)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Table.Cell style={{ color: 'var(--text-primary)' }}>
                  <Text size="2" weight="medium">{tender.entity}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--text-primary)' }}>
                    {tender.title}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                    {tender.reference_no}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(tender.deadline)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                    {formatValue(tender.estimated_value)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    color={statusToBadgeColor[tender.status]}
                  >
                    {t(tender.status)}
                  </Badge>
                </Table.Cell>
                <Table.Cell align="center">
                  <Flex gap="1" justify="center">
                    {onView && (
                      <ActionButton
                        icon={Eye}
                        label={isRTL ? 'عرض' : 'View'}
                        onClick={() => onView(tender.id)}
                        hoverColor="var(--color-info)"
                      />
                    )}
                    {tender.status === 'pending' && onEvaluate && (
                      <ActionButton
                        icon={Sparkles}
                        label={isRTL ? 'تقييم' : 'Evaluate'}
                        onClick={() => onEvaluate(tender.id)}
                        hoverColor="var(--color-primary-500)"
                      />
                    )}
                    {tender.status === 'evaluated' && tender.evaluation?.recommendation === 'qualified' && onPushToCRM && (
                      <ActionButton
                        icon={Send}
                        label={isRTL ? 'إرسال إلى CRM' : 'Push to CRM'}
                        onClick={() => onPushToCRM(tender.id)}
                        hoverColor="var(--color-success)"
                      />
                    )}
                    {onDelete && (
                      <ActionButton
                        icon={Trash2}
                        label={isRTL ? 'حذف' : 'Delete'}
                        onClick={() => onDelete(tender.id)}
                        hoverColor="var(--color-error)"
                      />
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-only" style={{ padding: 'var(--space-4)' }}>
        <Flex direction="column" gap="3">
          {currentTenders.map((tender) => (
            <TenderCard
              key={tender.id}
              tender={tender}
              onView={onView}
              onEvaluate={onEvaluate}
              onPushToCRM={onPushToCRM}
              onDelete={onDelete}
              formatDate={formatDate}
              formatValue={formatValue}
              t={t}
              tEval={tEval}
              isRTL={isRTL}
            />
          ))}
        </Flex>
      </div>

      {/* Pagination Footer */}
      <Flex 
        align="center" 
        justify="between" 
        wrap="wrap"
        gap="4"
        style={{
          padding: 'var(--space-6)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
          {isRTL 
            ? `عرض ${startIndex + 1} إلى ${Math.min(endIndex, tenders.length)} من ${tenders.length} مناقصة`
            : `Showing ${startIndex + 1} to ${Math.min(endIndex, tenders.length)} of ${tenders.length} entries`
          }
        </Text>

        <Flex align="center" gap="1">
          <PaginationButton
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            isRTL={isRTL}
          >
            <ChevronLeft size={16} className="flip-rtl" />
          </PaginationButton>

          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const page = i + 1
            return (
              <PaginationButton
                key={page}
                onClick={() => setCurrentPage(page)}
                active={currentPage === page}
                isRTL={isRTL}
              >
                {page}
              </PaginationButton>
            )
          })}

          {totalPages > 5 && (
            <>
              <Text size="2" style={{ padding: '0 var(--space-2)', color: 'var(--text-tertiary)' }}>
                ...
              </Text>
              <PaginationButton
                onClick={() => setCurrentPage(totalPages)}
                active={currentPage === totalPages}
                isRTL={isRTL}
              >
                {totalPages}
              </PaginationButton>
            </>
          )}

          <PaginationButton
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            isRTL={isRTL}
          >
            <ChevronRight size={16} className="flip-rtl" />
          </PaginationButton>
        </Flex>
      </Flex>
    </div>
  )
}

// Pagination Button Component
function PaginationButton({ 
  children, 
  onClick, 
  active = false, 
  disabled = false,
  isRTL = false
}: { 
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  isRTL?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '32px',
        height: '32px',
        padding: '0 var(--space-2)',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        backgroundColor: active ? 'var(--color-primary-500)' : 'transparent',
        color: active ? 'var(--text-inverted)' : 'var(--text-secondary)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'var(--transition-colors)',
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.backgroundColor = 'var(--surface-muted)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      {children}
    </button>
  )
}

// Mobile Card Component
function TenderCard({
  tender,
  onView,
  onEvaluate,
  onPushToCRM,
  onDelete,
  formatDate,
  formatValue,
  t,
  tEval,
  isRTL,
}: {
  tender: Tender
  onView?: (id: string) => void
  onEvaluate?: (id: string) => void
  onPushToCRM?: (id: string) => void
  onDelete?: (id: string) => void
  formatDate: (date: string) => string
  formatValue: (value: number | null) => string
  t: any
  tEval: any
  isRTL: boolean
}) {
  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    color = 'var(--text-secondary)',
    hoverColor = 'var(--color-primary-500)'
  }: { 
    icon: React.ElementType
    label: string
    onClick: () => void
    color?: string
    hoverColor?: string
  }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: 'transparent',
        color: color,
        cursor: 'pointer',
        transition: 'var(--transition-colors)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = hoverColor
        e.currentTarget.style.backgroundColor = `${hoverColor}15`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = color
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <Icon size={18} />
    </button>
  )

  return (
    <div
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--surface-ground)',
        transition: 'var(--transition-colors)',
      }}
    >
      <Flex direction="column" gap="3">
        {/* Title and Status */}
        <Flex align="start" justify="between" gap="3">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text 
              size="3" 
              weight="bold" 
              style={{ 
                display: 'block',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {tender.title}
            </Text>
            <Text size="2" style={{ display: 'block', color: 'var(--text-secondary)' }}>
              {tender.entity}
            </Text>
          </Box>
          <Badge
            color={statusToBadgeColor[tender.status]}
          >
            {t(tender.status)}
          </Badge>
        </Flex>

        {/* Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-3)',
          }}
        >
          <Box>
            <Text size="1" style={{ display: 'block', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              {t('referenceNo')}
            </Text>
            <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
              {tender.reference_no}
            </Text>
          </Box>
          <Box>
            <Text size="1" style={{ display: 'block', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              {t('deadline')}
            </Text>
            <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
              {formatDate(tender.deadline)}
            </Text>
          </Box>
          <Box>
            <Text size="1" style={{ display: 'block', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              {t('estimatedValue')}
            </Text>
            <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
              {formatValue(tender.estimated_value)}
            </Text>
          </Box>
          {tender.evaluation && (
            <Box>
              <Text size="1" style={{ display: 'block', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
                {tEval('score')}
              </Text>
              <ScoreBadge score={tender.evaluation.score} />
            </Box>
          )}
        </div>

        {/* Actions */}
        <Flex gap="1" justify="end">
          {onView && (
            <ActionButton
              icon={Eye}
              label={isRTL ? 'عرض' : 'View'}
              onClick={() => onView(tender.id)}
              hoverColor="var(--color-info)"
            />
          )}
          {tender.status === 'pending' && onEvaluate && (
            <ActionButton
              icon={Sparkles}
              label={isRTL ? 'تقييم' : 'Evaluate'}
              onClick={() => onEvaluate(tender.id)}
              hoverColor="var(--color-primary-500)"
            />
          )}
          {tender.status === 'evaluated' && tender.evaluation?.recommendation === 'qualified' && onPushToCRM && (
            <ActionButton
              icon={Send}
              label={isRTL ? 'إرسال إلى CRM' : 'Push to CRM'}
              onClick={() => onPushToCRM(tender.id)}
              hoverColor="var(--color-success)"
            />
          )}
          {onDelete && (
            <ActionButton
              icon={Trash2}
              label={isRTL ? 'حذف' : 'Delete'}
              onClick={() => onDelete(tender.id)}
              hoverColor="var(--color-error)"
            />
          )}
        </Flex>
      </Flex>
    </div>
  )
}
