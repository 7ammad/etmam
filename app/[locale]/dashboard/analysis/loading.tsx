import { Box, Flex, Skeleton } from '@radix-ui/themes'

/**
 * Loading skeleton for the Analysis page.
 */
export default function AnalysisLoading() {
  return (
    <Box p="4" style={{ width: '100%' }}>
      {/* Header skeleton */}
      <Flex direction="column" gap="2" mb="6">
        <Skeleton style={{ width: 200, height: 32 }} />
        <Skeleton style={{ width: 300, height: 20 }} />
      </Flex>

      {/* KPI row skeleton */}
      <Flex gap="4" mb="6" wrap="wrap">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} style={{ width: 220, height: 100, borderRadius: 12 }} />
        ))}
      </Flex>

      {/* Charts skeleton */}
      <Flex gap="4" mb="6" wrap="wrap">
        <Skeleton style={{ flex: 1, minWidth: 300, height: 300, borderRadius: 12 }} />
        <Skeleton style={{ flex: 1, minWidth: 300, height: 300, borderRadius: 12 }} />
      </Flex>

      {/* Leaderboard skeleton */}
      <Skeleton style={{ width: '100%', height: 400, borderRadius: 12 }} />
    </Box>
  )
}
