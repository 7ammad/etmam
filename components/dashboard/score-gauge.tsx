'use client'

import { Flex, Box, Text, Badge } from '@radix-ui/themes'

/** Stored recommendation: INVEST / REVIEW / SKIP or legacy qualified / conditional / excluded */
export type RecommendationDisplay = 'INVEST' | 'REVIEW' | 'SKIP' | 'qualified' | 'conditional' | 'excluded'

export interface ScoreGaugeProps {
  score: number
  recommendation: RecommendationDisplay
  recommendationLabel: string
  size?: number
}

const RADIUS = 40
const STROKE = 6

function getRecommendationColors(recommendation: RecommendationDisplay): {
  primary: string
  bg: string
  stroke: string
} {
  const isInvest = recommendation === 'INVEST' || recommendation === 'qualified'
  const isReview = recommendation === 'REVIEW' || recommendation === 'conditional'
  if (isInvest) {
    return {
      primary: 'var(--color-qualified-text)',
      bg: 'var(--color-qualified-bg)',
      stroke: '#10b981',
    }
  }
  if (isReview) {
    return {
      primary: 'var(--color-conditional-text)',
      bg: 'var(--color-conditional-bg)',
      stroke: '#f59e0b',
    }
  }
  return {
    primary: 'var(--color-excluded-text)',
    bg: 'var(--color-excluded-bg)',
    stroke: '#ef4444',
  }
}

export function ScoreGauge({ score, recommendation, recommendationLabel, size = 140 }: ScoreGaugeProps) {
  const normalized = Math.min(100, Math.max(0, Math.round(score)))
  const circumference = 2 * Math.PI * RADIUS
  const strokeDashoffset = circumference - (normalized / 100) * circumference
  const colors = getRecommendationColors(recommendation)

  const viewBoxSize = 100
  const center = viewBoxSize / 2

  return (
    <Box className="score-gauge-container" style={{ width: size, height: size, position: 'relative' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        aria-hidden
      >
        {/* Track (background ring) */}
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke="var(--surface-muted)"
          strokeWidth={STROKE}
        />

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={STROKE}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 0.6s ease-out',
          }}
        />
      </svg>

      {/* Center content */}
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="1"
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        <Text
          style={{
            fontSize: size * 0.22,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {normalized}
        </Text>
        <Badge
          size="1"
          style={{
            backgroundColor: colors.bg,
            color: colors.primary,
            fontWeight: 600,
            fontSize: '0.65rem',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {recommendationLabel}
        </Badge>
      </Flex>
    </Box>
  )
}
