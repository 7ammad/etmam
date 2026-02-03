/**
 * Loading UI for the [locale] segment.
 * Shown while the locale layout is resolving (getCurrentUser, getMessages).
 * Without this, users see a blank/white screen for several seconds on dashboard load.
 */
import { Box, Container, Flex } from '@radix-ui/themes'

const SKELETON_BG = 'var(--surface-muted)'

export default function LocaleLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--surface-page)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar skeleton */}
      <Box
        style={{
          height: 56,
          borderBottom: '1px solid var(--border-default)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Box
          style={{ height: 24, width: 120, borderRadius: 'var(--radius-2)', background: SKELETON_BG }}
          className="animate-pulse"
        />
        <Box
          style={{ height: 24, width: 80, borderRadius: 'var(--radius-2)', background: SKELETON_BG }}
          className="animate-pulse"
        />
      </Box>
      {/* Main content skeleton */}
      <Container size="4" py="6" style={{ flex: 1 }}>
        <Flex direction="column" gap="6">
          <Box
            style={{ height: 32, width: 180, borderRadius: 'var(--radius-2)', background: SKELETON_BG }}
            className="animate-pulse"
          />
          <Flex gap="4" wrap="wrap">
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                style={{
                  height: 80,
                  flex: '1 1 140px',
                  minWidth: 140,
                  borderRadius: 'var(--radius-3)',
                  background: SKELETON_BG,
                }}
                className="animate-pulse"
              />
            ))}
          </Flex>
        </Flex>
      </Container>
    </div>
  )
}
