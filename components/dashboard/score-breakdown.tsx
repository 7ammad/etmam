'use client'

import { Flex, Box, Text } from '@radix-ui/themes'
import {
  Wallet,
  Cpu,
  Clock,
  Target,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'

// Map dimension keys to icons
const dimensionIcons: Record<string, LucideIcon> = {
  budget_fit: Wallet,
  technical_fit: Cpu,
  timeline_fit: Clock,
  strategic_fit: Target,
  risk_score: ShieldAlert,
}

function getScoreColor(value: number): {
  text: string
  bar: string
  bg: string
} {
  if (value >= 70) {
    return {
      text: 'var(--color-qualified-text)',
      bar: '#10b981',
      bg: 'var(--color-qualified-bg)',
    }
  }
  if (value >= 40) {
    return {
      text: 'var(--color-conditional-text)',
      bar: '#f59e0b',
      bg: 'var(--color-conditional-bg)',
    }
  }
  return {
    text: 'var(--color-excluded-text)',
    bar: '#ef4444',
    bg: 'var(--color-excluded-bg)',
  }
}

export interface ScoreBreakdownItem {
  key: string
  label: string
  value: number
}

export interface ScoreBreakdownProps {
  items: ScoreBreakdownItem[]
}

function ScoreBreakdownRow({ item }: { item: ScoreBreakdownItem }) {
  const normalized = Math.min(100, Math.max(0, Math.round(item.value)))
  const colors = getScoreColor(normalized)
  const Icon = dimensionIcons[item.key] || Target

  return (
    <Box className="breakdown-row">
      <Flex align="center" gap="3">
        {/* Icon with colored background */}
        <Box
          className="breakdown-icon"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={16} style={{ color: colors.text }} />
        </Box>

        {/* Label and bar */}
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          <Flex justify="between" align="center">
            <Text
              size="2"
              weight="medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.label}
            </Text>
            <Text
              size="2"
              weight="bold"
              style={{
                fontVariantNumeric: 'tabular-nums',
                color: colors.text,
                minWidth: 28,
                textAlign: 'end',
              }}
            >
              {normalized}
            </Text>
          </Flex>

          {/* Progress bar with glow */}
          <Box
            className="breakdown-bar-track"
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--surface-muted)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              className="breakdown-bar-fill"
              style={{
                width: `${normalized}%`,
                height: '100%',
                background: colors.bar,
                borderRadius: 3,
                transition: 'width 0.5s ease-out',
              }}
            />
          </Box>
        </Flex>
      </Flex>
    </Box>
  )
}

export function ScoreBreakdownList({ items }: ScoreBreakdownProps) {
  return (
    <Flex direction="column" gap="4" className="score-breakdown-list">
      {items.map((item) => (
        <ScoreBreakdownRow key={item.key} item={item} />
      ))}
    </Flex>
  )
}
