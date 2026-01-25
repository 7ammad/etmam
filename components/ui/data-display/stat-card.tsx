'use client'

import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type TrendDirection = 'up' | 'down' | 'neutral'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: string | number
    direction: TrendDirection
    label?: string
  }
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' | 'orange'
  liveIndicator?: ReactNode
  className?: string
}

const iconColorMap: Record<string, string> = {
  primary: 'var(--color-primary-500)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
  neutral: 'var(--color-neutral-500)',
  purple: '#8b5cf6',
  orange: '#f97316',
}

const iconBgMap: Record<string, string> = {
  primary: 'var(--stat-icon-primary-bg)',
  success: 'var(--color-success-100)',
  warning: 'var(--color-warning-100)',
  error: 'var(--color-error-100)',
  info: 'var(--stat-icon-blue-bg)',
  neutral: 'var(--color-neutral-100)',
  purple: 'var(--stat-icon-purple-bg)',
  orange: 'var(--stat-icon-orange-bg)',
}

const trendColorMap: Record<TrendDirection, string> = {
  up: 'var(--color-success)',
  down: 'var(--color-error)',
  neutral: 'var(--color-neutral-500)',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  liveIndicator,
  className = '',
}: StatCardProps) {
  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
      ? TrendingDown 
      : Minus

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 'var(--space-4)',
        transition: 'var(--transition-shadow)',
        border: '1px solid var(--border-muted)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
    >
      {/* Large Circular Icon Container - Figma style */}
      {icon && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: iconBgMap[color],
            color: iconColorMap[color],
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          minWidth: 0,
        }}
      >
        {/* Title */}
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {title}
        </span>

        {/* Value */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'var(--space-2)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-4xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {value}
          </span>
          
          {subtitle && (
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>

        {/* Trend or Live Indicator */}
        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                color: trendColorMap[trend.direction],
              }}
            >
              <TrendIcon size={12} />
              {trend.value}
            </span>
            
            {trend.label && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {trend.label}
              </span>
            )}
          </div>
        )}

        {liveIndicator && (
          <div>{liveIndicator}</div>
        )}
      </div>
    </div>
  )
}

// Grid wrapper for stat cards
interface StatCardGridProps {
  children: ReactNode
  className?: string
}

export function StatCardGrid({ children, className = '' }: StatCardGridProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: 'var(--space-4)',
      }}
    >
      <style>{`
        @media (min-width: 640px) {
          .stat-card-grid-crm {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .stat-card-grid-crm {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
      <div className="stat-card-grid-crm" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: 'var(--space-4)',
      }}>
        {children}
      </div>
    </div>
  )
}
