'use client'

import { useMemo, useState, useEffect } from 'react'
import { Flex, Box, Text, Badge } from '@radix-ui/themes'
import { Building2, Hash, Calendar, Banknote } from 'lucide-react'

export interface TenderHeroProps {
  title: string
  entity: string
  referenceNo: string
  deadlineFormatted: string
  /** ISO date string for countdown when deadline ≤7 days (AC-2.5) */
  deadline?: string | null
  daysUntilDeadline: number | null
  valueFormatted: string
  isEstimated: boolean
  locale: string
  /** Actions (e.g. Run analysis, Push to CRM) shown on the right side of the hero card */
  actions?: React.ReactNode
  /** AI Price Intelligence block (Financials: Booklet, Tender Estimate, AI Model Estimate) */
  aiPriceBlock?: React.ReactNode
  labels: {
    entity: string
    title: string
    ref: string
    deadline: string
    estimated: string
    provided: string
    closingSoon: string
    past: string
    /** AC-2.5: "X days Y hours remaining" when deadline ≤7 days */
    countdownRemaining?: string
  }
}

export function TenderHero({
  title,
  entity,
  referenceNo,
  deadlineFormatted,
  deadline: deadlineIso,
  daysUntilDeadline,
  valueFormatted,
  isEstimated,
  locale,
  actions,
  aiPriceBlock,
  labels,
}: TenderHeroProps) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!deadlineIso || daysUntilDeadline == null || daysUntilDeadline < 0 || daysUntilDeadline > 7) return
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [deadlineIso, daysUntilDeadline])

  const countdown = useMemo(() => {
    if (!deadlineIso || daysUntilDeadline == null || daysUntilDeadline < 0 || daysUntilDeadline > 7) return null
    const end = new Date(deadlineIso).getTime()
    const diff = end - now
    if (diff <= 0) return null
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    return { days, hours }
  }, [deadlineIso, daysUntilDeadline, now])

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
          ? 'linear-gradient(135deg, var(--surface-card) 0%, var(--color-urgency-overlay) 100%)'
          : 'var(--surface-card)',
        border: isUrgent ? '1px solid var(--color-urgency-border)' : '1px solid var(--border-default)',
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

            {/* Deadline — AC-2.5: countdown "X days Y hours remaining" when ≤7 days */}
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
              {countdown && labels.countdownRemaining && (
                <Text size="2" style={{ color: 'var(--color-excluded-text)', fontVariantNumeric: 'tabular-nums' }}>
                  {labels.countdownRemaining.replace('{days}', String(countdown.days)).replace('{hours}', String(countdown.hours))}
                </Text>
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
          {aiPriceBlock != null && aiPriceBlock}
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
