'use client'

import { Flex, Box, Text, Tooltip } from '@radix-ui/themes'
import {
  Wallet,
  Cpu,
  Clock,
  Target,
  ShieldAlert,
  Crosshair,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

// V2 Engine: 6 dimensions (WORLD_CLASS_UX_PLAN)
const dimensionIcons: Record<string, LucideIcon> = {
  service_fit: Crosshair,
  budget_fit: Wallet,
  timeline_fit: Clock,
  complexity_fit: Wrench,
  strategic_fit: Target,
  risk_score: ShieldAlert,
  // Legacy 5-dim
  technical_fit: Cpu,
}

function getScoreColor(value: number): {
  text: string
  bar: string
  bg: string
} {
  if (value >= 70) {
    return {
      text: 'var(--color-qualified-text)',
      bar: 'var(--color-primary-500)',
      bg: 'var(--color-qualified-bg)',
    }
  }
  if (value >= 40) {
    return {
      text: 'var(--color-conditional-text)',
      bar: 'var(--color-conditional)',
      bg: 'var(--color-conditional-bg)',
    }
  }
  return {
    text: 'var(--color-excluded-text)',
    bar: 'var(--color-excluded)',
    bg: 'var(--color-excluded-bg)',
  }
}

export interface ScoreBreakdownItem {
  key: string
  label: string
  value: number
  /** Optional weight e.g. "20%" for tooltip (V2 Engine) */
  weight?: string
}

export interface ScoreBreakdownProps {
  items: ScoreBreakdownItem[]
  /** Show tooltip with dimension: score/100 — description */
  showTooltip?: boolean
}

function ScoreBreakdownRow({ item, showTooltip }: { item: ScoreBreakdownItem; showTooltip?: boolean }) {
  const normalized = Math.min(100, Math.max(0, Math.round(item.value)))
  /** AC-2.4: Risk Score inverted — lower = better; bar shows "safety" so longer bar = lower risk */
  const isRiskScore = item.key === 'risk_score'
  const barPercent = isRiskScore ? 100 - normalized : normalized
  const colors = getScoreColor(isRiskScore ? 100 - normalized : normalized)
  const Icon = dimensionIcons[item.key] || Target
  const tooltipContent = showTooltip
    ? `${item.label}: ${normalized}/100${item.weight ? ` (${item.weight} weight)` : ''}${isRiskScore ? ' — lower is better' : ''}`
    : undefined

  const row = (
    <Box className="breakdown-row">
      <Flex align="center" gap="3">
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
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          <Flex justify="between" align="center">
            <Text size="2" weight="medium" style={{ color: 'var(--text-secondary)' }}>
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
              {normalized}%
            </Text>
          </Flex>
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
                width: `${barPercent}%`,
                height: '100%',
                background: colors.bar,
                borderRadius: 3,
              }}
            />
          </Box>
          {item.weight && (
            <Text size="1" style={{ color: 'var(--text-tertiary)' }}>{item.weight} weight</Text>
          )}
        </Flex>
      </Flex>
    </Box>
  )

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent}>
        {row}
      </Tooltip>
    )
  }
  return row
}

const V2_WEIGHTS: Record<string, string> = {
  service_fit: '25%',
  budget_fit: '20%',
  timeline_fit: '20%',
  complexity_fit: '15%',
  strategic_fit: '10%',
  risk_score: '10%',
}

export function ScoreBreakdownList({ items, showTooltip = true }: ScoreBreakdownProps) {
  return (
    <Flex direction="column" gap="4" className="score-breakdown-list">
      {items.map((item) => (
        <ScoreBreakdownRow
          key={item.key}
          item={{ ...item, weight: item.weight ?? V2_WEIGHTS[item.key] }}
          showTooltip={showTooltip}
        />
      ))}
    </Flex>
  )
}
