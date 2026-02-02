'use client'

import { Box, Container, Flex, Card } from '@radix-ui/themes'

/**
 * Skeleton for tender detail page. Used as Suspense fallback while translation streams in.
 */
export function TenderDetailSkeleton() {
  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        <Box style={{ height: 28, width: '80%', maxWidth: 200, borderRadius: 'var(--radius-2)', background: 'var(--gray-a3)' }} className="animate-pulse" />
        <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Box style={{ height: 28, width: '100%', maxWidth: 480, borderRadius: 'var(--radius-2)', background: 'var(--gray-a3)' }} className="animate-pulse" />
          <Box style={{ height: 20, width: 200, borderRadius: 'var(--radius-1)', background: 'var(--gray-a3)' }} className="animate-pulse" />
          <Box style={{ height: 20, width: 140, borderRadius: 'var(--radius-1)', background: 'var(--gray-a3)' }} className="animate-pulse" />
        </Box>
        <Card size="2" style={{ background: 'var(--surface-card)' }}>
          <Flex gap="4" align="center" wrap="wrap">
            <Box style={{ height: 32, width: 64, borderRadius: 'var(--radius-2)', background: 'var(--gray-a3)' }} className="animate-pulse" />
            <Box style={{ height: 24, width: 100, borderRadius: 'var(--radius-2)', background: 'var(--gray-a3)' }} className="animate-pulse" />
          </Flex>
          <Box style={{ height: 48, width: '100%', marginTop: 12, borderRadius: 'var(--radius-2)', background: 'var(--gray-a3)' }} className="animate-pulse" />
        </Card>
        {[1, 2, 3].map((i) => (
          <Card key={i} size="2" style={{ background: 'var(--surface-card)' }}>
            <Box style={{ height: 20, width: 120, marginBottom: 8, borderRadius: 'var(--radius-1)', background: 'var(--gray-a3)' }} className="animate-pulse" />
            <Flex direction="column" gap="2">
              <Box style={{ height: 16, width: '100%', borderRadius: 'var(--radius-1)', background: 'var(--gray-a3)' }} className="animate-pulse" />
              <Box style={{ height: 16, width: '90%', borderRadius: 'var(--radius-1)', background: 'var(--gray-a3)' }} className="animate-pulse" />
            </Flex>
          </Card>
        ))}
      </Flex>
    </Container>
  )
}
