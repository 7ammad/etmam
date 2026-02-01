'use client'

import NextLink from 'next/link'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LogoutButton } from '@/components/auth/logout-button'
import { Button, Flex, Container, Box, Text, Link } from '@radix-ui/themes'
import { Crown, LayoutDashboard, Settings } from 'lucide-react'

interface DashboardHeaderProps {
  locale: string
}

export function DashboardHeader({ locale }: DashboardHeaderProps) {
  const t = useTranslations('common')
  const { locale: currentLocale } = useI18n()

  const otherLocale = currentLocale === 'ar' ? 'en' : 'ar'
  const otherLocaleLabel = currentLocale === 'ar' ? 'EN' : 'عربي'

  return (
    <Box
      style={{
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--surface-raised)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <Container size="4">
        <Flex justify="between" align="center" height="64px" px="4">
          <NextLink href={`/${locale}/dashboard`} style={{ textDecoration: 'none' }}>
            <Flex align="center" gap="3" style={{ cursor: 'pointer' }}>
              <Flex
                align="center"
                justify="center"
                width="40px"
                height="40px"
                style={{
                  borderRadius: 'var(--radius-3)',
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                  boxShadow: 'var(--shadow-primary)',
                }}
              >
                <Crown size={20} color="white" />
              </Flex>
              <Text size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
                {t('appName')}
              </Text>
            </Flex>
          </NextLink>

          <Flex display={{ initial: 'none', sm: 'flex' }} gap="4" align="center">
            <Link asChild size="2" weight="medium" color="green" highContrast underline="none">
              <NextLink href={`/${locale}/dashboard`}>
                <Flex align="center" gap="2">
                  <LayoutDashboard size={16} />
                  {t('dashboard')}
                </Flex>
              </NextLink>
            </Link>
            <Link asChild size="2" weight="medium" color="gray" underline="none">
              <NextLink href={`/${locale}/settings`}>
                <Flex align="center" gap="2">
                  <Settings size={16} />
                  {t('settings')}
                </Flex>
              </NextLink>
            </Link>
          </Flex>

          <Flex align="center" gap="3">
            <Button asChild variant="ghost" color="gray" size="2">
              <NextLink href={`/${otherLocale}/dashboard`}>{otherLocaleLabel}</NextLink>
            </Button>
            <ThemeToggle />
            <LogoutButton variant="ghost" size="2" showIcon showText />
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}
