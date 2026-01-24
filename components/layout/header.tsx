'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Settings } from 'lucide-react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Box, Flex, Text, Button, IconButton, Heading } from '@radix-ui/themes'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const tCommon = useTranslations('common')
  const tNav = useTranslations('navigation')
  const tSettings = useTranslations('settings')
  const tTender = useTranslations('tender')
  const tCrm = useTranslations('crm')
  const tHeader = useTranslations('header')
  const { locale } = useI18n()
  const pathname = usePathname()

  const otherLocale = locale === 'ar' ? 'en' : 'ar'
  const otherLocaleLabel = locale === 'ar' ? 'EN' : 'عربي'
  const currentPath = pathname ?? `/${locale}/dashboard`
  const otherLocaleHref = currentPath.startsWith(`/${locale}`)
    ? currentPath.replace(`/${locale}`, `/${otherLocale}`)
    : `/${otherLocale}/dashboard`

  const pageTitle = useMemo(() => {
    const normalized = currentPath.startsWith(`/${locale}`)
      ? currentPath.slice(`/${locale}`.length)
      : currentPath

    if (normalized.includes('/push-success')) return tCrm('pushSuccessTitle')
    if (normalized.startsWith('/tenders-list')) return tNav('tenders')
    if (normalized.startsWith('/dashboard/') && normalized !== '/dashboard') return tTender('detailTitle')
    if (normalized.startsWith('/dashboard')) return tCommon('dashboard')
    if (normalized.startsWith('/settings/crm')) return tSettings('crm')
    if (normalized.startsWith('/settings')) return tSettings('title')
    if (normalized.startsWith('/crm/push-success')) return tCrm('pushSuccessTitle')
    return tCommon('dashboard')
  }, [currentPath, locale, tCommon, tNav, tSettings, tTender, tCrm])

  return (
    <Box
      asChild
      position="sticky"
      top="0"
      style={{
        zIndex: 50,
        borderBottom: '1px solid var(--gray-a5)',
        backgroundColor: 'var(--color-panel-translucent)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <header>
        <Flex align="center" gap="4" px="4" style={{ height: '64px' }}>
          {/* Mobile menu button */}
          <IconButton
            variant="ghost"
            size="2"
            onClick={onMenuClick}
            style={{ display: 'none' }}
            className="mobile-only"
          >
            <Menu style={{ width: '20px', height: '20px' }} />
          </IconButton>

          <Heading size="4" weight="medium" style={{ color: 'var(--gray-12)' }}>
            {pageTitle}
          </Heading>

          {/* Spacer */}
          <Box flexGrow="1" />

          {/* Actions */}
          <Flex align="center" gap="3">
            <Flex align="center" gap="3">
              <Flex
                align="center"
                justify="center"
                width="32px"
                height="32px"
                style={{
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, var(--iris-8), var(--iris-10))',
                  boxShadow: '0 4px 12px var(--iris-a4)',
                }}
              >
                <Text size="2" weight="bold" style={{ color: 'white' }}>
                  {tHeader('userInitials')}
                </Text>
              </Flex>
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                {tHeader('userName')}
              </Text>
            </Flex>

            {/* Language toggle */}
            <Link href={otherLocaleHref} style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="2">
                {otherLocaleLabel}
              </Button>
            </Link>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Settings */}
            <Link href={`/${locale}/settings`} style={{ textDecoration: 'none' }}>
              <IconButton variant="ghost" size="2">
                <Settings style={{ width: '20px', height: '20px' }} />
              </IconButton>
            </Link>
          </Flex>
        </Flex>
      </header>
    </Box>
  )
}
