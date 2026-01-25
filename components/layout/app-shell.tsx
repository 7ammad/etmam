'use client'

import { useState, useCallback } from 'react'
import { Box, Flex } from '@radix-ui/themes'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileDrawer } from '@/components/layout/mobile-drawer'
import { useI18n } from '@/components/providers/i18n-provider'

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const { locale } = useI18n()
  const isRTL = locale === 'ar'

  const handleOpenDrawer = useCallback(() => {
    setIsMobileDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false)
  }, [])

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-link"
      >
        {isRTL ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>

      <Flex direction="column" style={{ minHeight: '100vh' }}>
        {/* Header */}
        <Header onMenuClick={handleOpenDrawer} />

        <Flex style={{ flex: 1 }}>
          {/* Desktop Sidebar */}
          <Box
            className="desktop-only"
            style={{
              position: 'sticky',
              top: 'var(--header-height)',
              height: 'calc(100vh - var(--header-height))',
              flexShrink: 0,
            }}
          >
            <Sidebar 
              style={{ 
                height: '100%',
                borderTop: 'none',
              }} 
            />
          </Box>

          {/* Main Content */}
          <Box 
            asChild 
            style={{ 
              flex: 1, 
              backgroundColor: 'var(--surface-page)',
              minHeight: 'calc(100vh - var(--header-height))',
            }}
          >
            <main 
              id="main-content"
              tabIndex={-1}
              style={{ 
                padding: 'var(--space-page-y) var(--space-page-x)',
                outline: 'none',
              }}
            >
              <Box 
                style={{ 
                  maxWidth: 'var(--container-max-width)',
                  marginInline: 'auto',
                }}
              >
                {children}
              </Box>
            </main>
          </Box>
        </Flex>
      </Flex>

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen} 
        onClose={handleCloseDrawer} 
      />
    </>
  )
}
