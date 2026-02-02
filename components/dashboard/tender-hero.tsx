'use client'

import { Flex, Box, Text, Badge } from '@radix-ui/themes'
import { Building2, Hash, Calendar, Banknote } from 'lucide-react'

export interface TenderHeroProps {
  title: string
  entity: string
  referenceNo: string
  deadlineFormatted: string
  daysUntilDeadline: number | null
  valueFormatted: string
  isEstimated: boolean
  locale: string
  /** Actions (e.g. Run analysis, Push to CRM) shown on the right side of the hero card */
  actions?: React.ReactNode
  labels: {
    entity: string
    title: string
    ref: string
    deadline: string
    estimated: string
    provided: string
    closingSoon: string
    past: string
  }
}

export function TenderHero({
  title,
  entity,
  referenceNo,
  deadlineFormatted,
  daysUntilDeadline,
  valueFormatted,
  isEstimated,
  locale,
  actions,
  labels,
}: TenderHeroProps) {
  const deadlineBadge =
    daysUntilDeadline === null
      ? null
      : daysUntilDeadline < 0
        ? { label: labels.past, color: 'red' as const }
        : daysUntilDeadline <= 7
          ? { label: labels.closingSoon, color: 'amber' as const }
          : null

  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 7

  return (
    <Box
      className="tender-hero-card"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      style={{
        background: isUrgent
          ? 'linear-gradient(135deg, var(--surface-card) 0%, rgba(239, 68, 68, 0.05) 100%)'
          : 'var(--surface-card)',
        border: isUrgent ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-default)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-6)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient overlay for depth */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.02) 100%)',
          pointerEvents: 'none',
        }}
      />

      <Flex justify="between" align="start" gap="6" wrap="wrap" style={{ position: 'relative', zIndex: 1 }}>
        <Flex direction="column" gap="4" style={{ flex: 1, minWidth: 0 }}>
          {/* Entity with icon */}
          <Flex align="center" gap="2">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'var(--surface-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={14} style={{ color: 'var(--text-tertiary)' }} />
            </Box>
            <Text size="2" style={{ color: 'var(--text-secondary)' }}>
              {entity}
            </Text>
          </Flex>

          {/* Title - the main focal point */}
          <Text
            size="6"
            weight="bold"
            style={{
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Text>

          {/* Meta row with icons */}
          <Flex gap="5" wrap="wrap" align="center" className="tender-hero-meta">
            {/* Reference */}
            <Flex gap="2" align="center">
              <Hash size={14} style={{ color: 'var(--text-tertiary)' }} />
              <Text size="1" style={{ color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                {referenceNo}
              </Text>
            </Flex>

            {/* Deadline */}
            <Flex gap="2" align="center">
              <Calendar size={14} style={{ color: deadlineBadge ? 'var(--color-excluded-text)' : 'var(--text-tertiary)' }} />
              <Text
                size="2"
                weight={deadlineBadge ? 'medium' : 'regular'}
                style={{ color: deadlineBadge ? 'var(--color-excluded-text)' : 'var(--text-secondary)' }}
              >
                {deadlineFormatted}
              </Text>
              {deadlineBadge && (
                <Badge
                  size="1"
                  variant="soft"
                  color={deadlineBadge.color}
                  style={{ fontWeight: 600 }}
                >
                  {deadlineBadge.label}
                </Badge>
              )}
            </Flex>

            {/* Value - highlighted */}
            <Flex gap="2" align="center">
              <Banknote size={14} style={{ color: 'var(--color-primary-500)' }} />
              <Text
                size="2"
                weight="bold"
                style={{
                  color: 'var(--color-primary-500)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {valueFormatted}
              </Text>
              {isEstimated && (
                <Badge
                  size="1"
                  variant="soft"
                  color="amber"
                  style={{ fontWeight: 500, fontSize: '0.65rem' }}
                >
                  {labels.estimated}
                </Badge>
              )}
              {!isEstimated && valueFormatted && valueFormatted !== '—' && (
                <Badge
                  size="1"
                  variant="soft"
                  color="green"
                  style={{ fontWeight: 500, fontSize: '0.65rem' }}
                >
                  {labels.provided}
                </Badge>
              )}
            </Flex>
          </Flex>
        </Flex>

        {/* Actions */}
        {actions != null && (
          <Flex
            direction="column"
            gap="3"
            align="end"
            className="tender-hero-actions"
            style={{ flexShrink: 0 }}
          >
            {actions}
          </Flex>
        )}
      </Flex>
    </Box>
  )
}
