import { Box, Flex } from '@radix-ui/themes'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Header />
      <Flex style={{ flex: 1 }}>
        <Sidebar />
        <Box asChild style={{ flex: 1, backgroundColor: 'var(--gray-1)' }}>
          <main style={{ padding: '24px' }}>{children}</main>
        </Box>
      </Flex>
    </Flex>
  )
}
