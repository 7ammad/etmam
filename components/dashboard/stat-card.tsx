'use client'

import { Card, Text, Flex } from '@radix-ui/themes'
import type { LucideIcon } from 'lucide-react'

export type StatCardVariant = 'default' | 'qualified' | 'conditional' | 'excluded' | 'neutral' | 'deadline'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  /** Semantic accent: qualified (green), conditional (amber), excluded (red), neutral (gray), deadline (blue) */
  variant?: StatCardVariant
  /** Optional icon; shown in a tinted circle when variant is set */
  icon?: LucideIcon
}

const variantStyles: Record<StatCardVariant, { bg: string; text: string }> = {
  default: { bg: 'var(--stat-icon-primary-bg)', text: 'var(--color-primary-600)' },
  qualified: { bg: 'var(--color-qualified-bg)', text: 'var(--color-qualified-text)' },
  conditional: { bg: 'var(--color-conditional-bg)', text: 'var(--color-conditional-text)' },
  excluded: { bg: 'var(--color-excluded-bg)', text: 'var(--color-excluded-text)' },
  neutral: { bg: 'var(--surface-muted)', text: 'var(--text-secondary)' },
  deadline: { bg: 'var(--stat-icon-blue-bg)', text: 'var(--color-info-600)' },
}

export function StatCard({ label, value, sublabel, variant = 'default', icon: Icon }: StatCardProps) {
  const style = variantStyles[variant]
  return (
    <Card
      size="2"
      style={{
        background: 'var(--surface-card)',
        minWidth: 0,
        boxShadow: 'var(--shadow-card)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border-default)',
      }}
    >
      {Icon ? (
        <Flex gap="3" align="start">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-stat-icon)',
              background: style.bg,
              color: style.text,
              flexShrink: 0,
            }}
          >
            <Icon size={18} />
          </Flex>
          <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
            <Text size="1" style={{ color: 'var(--text-tertiary)', display: 'block' }}>{label}</Text>
            <Text size="5" weight="bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</Text>
            {sublabel != null && sublabel !== '' && <Text size="1" style={{ color: 'var(--text-tertiary)' }}>{sublabel}</Text>}
          </Flex>
        </Flex>
      ) : (
        <Flex direction="column" gap="1">
          <Text size="1" style={{ color: 'var(--text-tertiary)', display: 'block' }}>{label}</Text>
          <Text size="5" weight="bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</Text>
          {sublabel != null && sublabel !== '' && <Text size="1" style={{ color: 'var(--text-tertiary)' }}>{sublabel}</Text>}
        </Flex>
      )}
    </Card>
  )
}
