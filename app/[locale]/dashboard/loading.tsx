import { Box, Container, Flex, Card } from '@radix-ui/themes'

const SKELETON_BG = 'var(--surface-muted)'

export default function DashboardLoading() {
  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Page title skeleton */}
        <Box style={{ height: 32, width: 180, borderRadius: 'var(--radius-2)', background: SKELETON_BG }} className="animate-pulse" />

        {/* Section A: KPI cards skeleton (per DASHBOARD_SPEC) */}
        <Flex gap="4" wrap="wrap">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Card key={i} size="2" style={{ background: 'var(--surface-card)', minWidth: 140, flex: '1 1 140px' }}>
              <Flex gap="3" align="start">
                <Box style={{ width: 36, height: 36, borderRadius: 'var(--radius-stat-icon)', background: SKELETON_BG }} className="animate-pulse" />
                <Flex direction="column" gap="2">
                  <Box style={{ height: 12, width: 72, borderRadius: 'var(--radius-1)', background: SKELETON_BG }} className="animate-pulse" />
                  <Box style={{ height: 24, width: 48, borderRadius: 'var(--radius-1)', background: SKELETON_BG }} className="animate-pulse" />
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>

        {/* Filters row skeleton */}
        <Flex gap="4" wrap="wrap" align="center">
          <Box style={{ height: 36, width: 240, borderRadius: 'var(--radius-2)', background: SKELETON_BG }} className="animate-pulse" />
          <Box style={{ height: 36, width: 140, borderRadius: 'var(--radius-2)', background: SKELETON_BG }} className="animate-pulse" />
          <Box style={{ height: 36, width: 160, borderRadius: 'var(--radius-2)', background: SKELETON_BG }} className="animate-pulse" />
        </Flex>

        {/* Section C: Table skeleton — header + rows */}
        <Box style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
          <Flex gap="4" wrap="wrap" style={{ padding: 16, borderBottom: '1px solid var(--border-default)' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Box key={i} style={{ height: 14, flex: '1 1 80px', minWidth: 60, borderRadius: 'var(--radius-1)', background: SKELETON_BG }} className="animate-pulse" />
            ))}
          </Flex>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <Flex key={row} gap="4" wrap="wrap" align="center" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-muted)' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Box key={i} style={{ height: 16, flex: '1 1 80px', minWidth: 60, borderRadius: 'var(--radius-1)', background: SKELETON_BG }} className="animate-pulse" />
              ))}
            </Flex>
          ))}
        </Box>
      </Flex>
    </Container>
  )
}
