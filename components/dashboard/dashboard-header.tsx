'use client'

import NextLink from 'next/link'
import { useI18n } from '@/components/providers/i18n-provider'
import { Button, Flex, Box, Text } from '@radix-ui/themes'
import { HeaderToolsStrip } from './header-tools-strip'
import { UserProfileDropdown } from './user-profile-dropdown'

interface DashboardHeaderProps {
  locale: string
}

/**
 * Figma: white header bar. Left: Run Analysis (green), Export to CRM, Upload Tenders.
 * Right: EN | AR language toggle, user menu (avatar + dropdown). No logo (logo in sidebar).
 */
export function DashboardHeader({ locale }: DashboardHeaderProps) {
  const { locale: currentLocale } = useI18n()

  return (
    <Box
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--surface-card)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <Flex justify="between" align="center" height="64px" px="4" wrap="wrap" gap="3" style={{ width: '100%' }}>
        <HeaderToolsStrip locale={locale} />

        <Flex align="center" gap="3">
          <Flex align="center" gap="1" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }} role="group" aria-label="Language">
            <Button asChild variant="ghost" color="gray" size="1">
              <NextLink href="/en/dashboard" style={{ fontWeight: currentLocale === 'en' ? 600 : 400, color: 'inherit' }}>
                EN
              </NextLink>
            </Button>
            <Text size="1" style={{ color: 'var(--text-tertiary)' }}>|</Text>
            <Button asChild variant="ghost" color="gray" size="1">
              <NextLink href="/ar/dashboard" style={{ fontWeight: currentLocale === 'ar' ? 600 : 400, color: 'inherit' }}>
                AR
              </NextLink>
            </Button>
          </Flex>
          <UserProfileDropdown locale={locale} />
        </Flex>
      </Flex>
    </Box>
  )
}
