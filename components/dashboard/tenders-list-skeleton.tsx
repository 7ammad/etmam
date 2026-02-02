'use client'

import { Box, Flex, Card } from '@radix-ui/themes'

const SKELETON_BG = 'var(--surface-muted)'

/**
 * Skeleton for the tenders list section (KPI row + filters + table).
 * Used as Suspense fallback while translation streams in.
 */
export function TendersListSkeleton() {
  return (
    <Flex direction="column" gap="6">
      <Flex gap="4" wrap="wrap" className="dashboard-kpi-grid" style={{ display: 'grid' }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card key={i} size="2" style={{ background: 'var(--surface-card)', minWidth: 140 }}>
            <Flex gap="3" align="center">
              <Box style={{ width: 42, height: 42, borderRadius: 12, background: SKELETON_BG }} className="animate-pulse" />
              <Flex direction="column" gap="1">
                <Box style={{ height: 20, width: 40, borderRadius: 4, background: SKELETON_BG }} className="animate-pulse" />
                <Box style={{ height: 12, width: 64, borderRadius: 4, background: SKELETON_BG }} className="animate-pulse" />
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
      <Card className="filters-container">
        <Flex gap="4" wrap="wrap" align="center">
          <Box style={{ height: 36, width: 240, borderRadius: 8, background: SKELETON_BG }} className="animate-pulse" />
          <Box style={{ height: 36, width: 140, borderRadius: 8, background: SKELETON_BG }} className="animate-pulse" />
          <Box style={{ height: 36, width: 160, borderRadius: 8, background: SKELETON_BG }} className="animate-pulse" />
        </Flex>
      </Card>
      <Box style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        <Flex gap="4" wrap="wrap" style={{ padding: 16, borderBottom: '1px solid var(--border-default)' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Box key={i} style={{ height: 14, flex: '1 1 80px', minWidth: 60, borderRadius: 4, background: SKELETON_BG }} className="animate-pulse" />
          ))}
        </Flex>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
          <Flex key={row} gap="4" wrap="wrap" align="center" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-muted)' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Box key={i} style={{ height: 16, flex: '1 1 80px', minWidth: 60, borderRadius: 4, background: SKELETON_BG }} className="animate-pulse" />
            ))}
          </Flex>
        ))}
      </Box>
    </Flex>
  )
}
