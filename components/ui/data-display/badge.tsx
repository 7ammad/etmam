'use client'

import type { ReactNode } from 'react'

export type BadgeVariant = 'status' | 'recommendation' | 'count'
export type BadgeColor = 
  | 'qualified' 
  | 'conditional' 
  | 'excluded' 
  | 'pending' 
  | 'evaluating'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  color: BadgeColor
  size?: BadgeSize
  dot?: boolean
  children: ReactNode
  className?: string
}

const colorStyles: Record<BadgeColor, { bg: string; text: string; dot: string }> = {
  qualified: {
    bg: 'var(--color-qualified-bg)',
    text: 'var(--color-qualified-text)',
    dot: 'var(--color-qualified)',
  },
  conditional: {
    bg: 'var(--color-conditional-bg)',
    text: 'var(--color-conditional-text)',
    dot: 'var(--color-conditional)',
  },
  excluded: {
    bg: 'var(--color-excluded-bg)',
    text: 'var(--color-excluded-text)',
    dot: 'var(--color-excluded)',
  },
  pending: {
    bg: 'var(--color-pending-bg)',
    text: 'var(--color-pending-text)',
    dot: 'var(--color-pending)',
  },
  evaluating: {
    bg: 'var(--color-evaluating-bg)',
    text: 'var(--color-evaluating-text)',
    dot: 'var(--color-evaluating)',
  },
  neutral: {
    bg: 'var(--color-neutral-100)',
    text: 'var(--color-neutral-700)',
    dot: 'var(--color-neutral-500)',
  },
  success: {
    bg: 'var(--color-success-50)',
    text: 'var(--color-success-600)',
    dot: 'var(--color-success)',
  },
  warning: {
    bg: 'var(--color-warning-50)',
    text: 'var(--color-warning-600)',
    dot: 'var(--color-warning)',
  },
  error: {
    bg: 'var(--color-error-50)',
    text: 'var(--color-error-600)',
    dot: 'var(--color-error)',
  },
  info: {
    bg: 'var(--color-info-50)',
    text: 'var(--color-info-600)',
    dot: 'var(--color-info)',
  },
}

const sizeStyles: Record<BadgeSize, { padding: string; fontSize: string; dotSize: string }> = {
  sm: {
    padding: 'var(--space-1) var(--space-2)',
    fontSize: 'var(--text-xs)',
    dotSize: '6px',
  },
  md: {
    padding: 'var(--space-1) var(--space-3)',
    fontSize: 'var(--text-sm)',
    dotSize: '8px',
  },
}

export function Badge({ 
  variant = 'status', 
  color, 
  size = 'sm', 
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  const colors = colorStyles[color]
  const sizes = sizeStyles[size]

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: sizes.padding,
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: sizes.fontSize,
        fontWeight: 'var(--font-medium)',
        lineHeight: 1.2,
        borderRadius: 'var(--radius-full)',
        whiteSpace: 'nowrap',
        transition: 'var(--transition-colors)',
      }}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: sizes.dotSize,
            height: sizes.dotSize,
            borderRadius: '50%',
            backgroundColor: colors.dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}

// Convenience component for recommendation badges
export function RecommendationBadge({ 
  recommendation 
}: { 
  recommendation: 'qualified' | 'conditional' | 'excluded' | 'pending' | 'evaluating' | string 
}) {
  const colorMap: Record<string, BadgeColor> = {
    qualified: 'qualified',
    conditional: 'conditional',
    excluded: 'excluded',
    pending: 'pending',
    evaluating: 'evaluating',
    QUALIFIED: 'qualified',
    CONDITIONAL: 'conditional',
    EXCLUDED: 'excluded',
    PENDING: 'pending',
    EVALUATING: 'evaluating',
  }

  const labelMap: Record<string, string> = {
    qualified: 'Qualified',
    conditional: 'Conditional',
    excluded: 'Excluded',
    pending: 'Pending',
    evaluating: 'Evaluating',
    QUALIFIED: 'Qualified',
    CONDITIONAL: 'Conditional',
    EXCLUDED: 'Excluded',
    PENDING: 'Pending',
    EVALUATING: 'Evaluating',
  }

  const color = colorMap[recommendation] || 'neutral'
  const label = labelMap[recommendation] || recommendation

  return (
    <Badge color={color} dot size="md">
      {label}
    </Badge>
  )
}

// Score badge with visual indicator
export function ScoreBadge({ 
  score,
  size = 'md',
}: { 
  score: number
  size?: BadgeSize
}) {
  let color: BadgeColor = 'neutral'
  
  if (score >= 80) {
    color = 'qualified'
  } else if (score >= 60) {
    color = 'conditional'
  } else if (score >= 40) {
    color = 'warning'
  } else {
    color = 'excluded'
  }

  return (
    <Badge color={color} size={size}>
      {score}%
    </Badge>
  )
}
