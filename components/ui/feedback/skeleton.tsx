'use client'

import type { CSSProperties, ReactNode } from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
  style?: CSSProperties
}

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  className = '',
  style,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  )
}

// Convenience components for common skeleton patterns

export function SkeletonText({
  lines = 3,
  gap = 'var(--space-2)',
  lastLineWidth = '70%',
}: {
  lines?: number
  gap?: string
  lastLineWidth?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          borderRadius="var(--radius-sm)"
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({
  size = '40px',
}: {
  size?: string | number
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="var(--radius-full)"
    />
  )
}

export function SkeletonButton({
  width = '120px',
  height = '36px',
}: {
  width?: string | number
  height?: string | number
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius="var(--radius-md)"
    />
  )
}

// Card skeleton for dashboard stats
export function SkeletonStatCard() {
  return (
    <div
      className="glass-card-static"
      style={{
        padding: 'var(--space-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width="80px" height="16px" />
        <Skeleton width="40px" height="40px" borderRadius="var(--radius-md)" />
      </div>
      <Skeleton width="60px" height="32px" />
      <Skeleton width="100px" height="20px" borderRadius="var(--radius-full)" />
    </div>
  )
}

// Table row skeleton
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td
          key={i}
          style={{
            padding: 'var(--space-4)',
          }}
        >
          <Skeleton
            width={i === 0 ? '60%' : i === columns - 1 ? '80px' : '100%'}
            height="16px"
          />
        </td>
      ))}
    </tr>
  )
}

// Table skeleton
export function SkeletonTable({ 
  rows = 5, 
  columns = 5 
}: { 
  rows?: number
  columns?: number 
}) {
  return (
    <div
      className="glass-card-static"
      style={{ overflow: 'hidden' }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            {Array.from({ length: columns }).map((_, i) => (
              <th
                key={i}
                style={{
                  padding: 'var(--space-4)',
                  textAlign: 'start',
                }}
              >
                <Skeleton width="80px" height="14px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Page header skeleton
export function SkeletonPageHeader() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <Skeleton width="200px" height="28px" />
        <Skeleton width="300px" height="16px" />
      </div>
      <SkeletonButton width="140px" />
    </div>
  )
}

// Dashboard skeleton (combines multiple elements)
export function SkeletonDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <SkeletonPageHeader />
      
      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      
      {/* Table */}
      <SkeletonTable rows={5} columns={6} />
    </div>
  )
}

// Wrapper to show skeleton while loading
interface SkeletonLoaderProps {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
}

export function SkeletonLoader({ isLoading, skeleton, children }: SkeletonLoaderProps) {
  if (isLoading) {
    return <>{skeleton}</>
  }
  return <>{children}</>
}
