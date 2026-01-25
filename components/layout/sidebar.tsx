'use client'

import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Box, Flex, Text } from '@radix-ui/themes'
import { Crown, LayoutDashboard, FileText, Users, Settings as SettingsIcon, LogOut } from 'lucide-react'

type SidebarProps = {
  className?: string
  style?: CSSProperties
}

export function Sidebar({ className, style }: SidebarProps) {
  const tNav = useTranslations('navigation')
  const tCommon = useTranslations('common')
  const { locale } = useI18n()
  const pathname = usePathname()
  const isRTL = locale === 'ar'

  const activeId = useMemo(() => {
    const path = pathname ?? `/${locale}/dashboard`
    const normalized = path.startsWith(`/${locale}`) ? path.slice(`/${locale}`.length) : path

    if (normalized.startsWith('/tenders-list')) return 'tenders'
    if (normalized.startsWith('/dashboard/') && normalized !== '/dashboard') return 'tenders'
    if (normalized.startsWith('/dashboard')) return 'dashboard'
    if (normalized.startsWith('/settings/crm') || normalized.startsWith('/crm')) return 'crm'
    if (normalized.startsWith('/settings')) return 'settings'
    return 'dashboard'
  }, [pathname, locale])

  const navItems = [
    {
      id: 'dashboard',
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
      label: tCommon('dashboard'),
    },
    {
      id: 'tenders',
      href: `/${locale}/tenders-list`,
      icon: FileText,
      label: tNav('tenders'),
    },
    {
      id: 'crm',
      href: `/${locale}/settings/crm`,
      icon: Users,
      label: tNav('crm'),
    },
    {
      id: 'settings',
      href: `/${locale}/settings`,
      icon: SettingsIcon,
      label: tNav('settings'),
    },
  ]

  return (
    <Box
      className={className}
      style={{
        width: '256px',
        height: '100vh',
        backgroundColor: 'var(--gray-2)',
        borderRight: isRTL ? 'none' : '1px solid var(--gray-a3)',
        borderLeft: isRTL ? '1px solid var(--gray-a3)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* Logo */}
      <Flex 
        align="center" 
        gap="3" 
        p="6"
        style={{ borderBottom: '1px solid var(--gray-a3)' }}
      >
        <Flex 
          align="center" 
          justify="center" 
          width="32px" 
          height="32px" 
          style={{ 
            borderRadius: 'var(--radius-2)',
            background: 'linear-gradient(135deg, var(--iris-9), var(--iris-11))',
          }}
        >
          <Crown size={16} color="white" />
        </Flex>
        <Text size="4" weight="bold">{tCommon('appName')}</Text>
      </Flex>

      {/* Navigation */}
      <Flex direction="column" p="4" style={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = activeId === item.id
          const Icon = item.icon
          
          return (
            <NextLink 
              key={item.id} 
              href={item.href}
              style={{ textDecoration: 'none' }}
            >
              <Flex
                align="center"
                gap="3"
                px="4"
                py="3"
                style={{
                  borderRadius: 'var(--radius-2)',
                  backgroundColor: isActive ? 'var(--iris-9)' : 'transparent',
                  color: isActive ? 'white' : 'var(--gray-11)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} />
                <Text size="2" weight="medium">{item.label}</Text>
              </Flex>
            </NextLink>
          )
        })}
      </Flex>

      {/* Logout */}
      <Box p="4" style={{ borderTop: '1px solid var(--gray-a3)' }}>
        <Flex
          align="center"
          gap="3"
          px="4"
          py="3"
          style={{
            borderRadius: 'var(--radius-2)',
            color: 'var(--gray-11)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <LogOut size={18} />
          <Text size="2" weight="medium">
            {tCommon('logout')}
          </Text>
        </Flex>
      </Box>
    </Box>
  )
}
