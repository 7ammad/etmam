'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Flex, Text } from '@radix-ui/themes'
import { LayoutDashboard, FileText, Briefcase, Settings } from 'lucide-react'

interface AppSidebarProps {
  locale: string
}

/** Sidebar: dark teal #153331; logo "E Etmam" top; white nav. Selected = same lighter teal as Settings page; unselected = no extra color. */
const SIDEBAR_WIDTH = 240
const SIDEBAR_BG = '#153331'
/** Same selected state as Settings page: lighter shade of dark teal (not green). */
const SIDEBAR_ACTIVE_BG = 'rgba(255,255,255,0.12)'

export function AppSidebar({ locale }: AppSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('common')
  const tNav = useTranslations('navigation')

  const dashboardHref = `/${locale}/dashboard`
  const opportunitiesHref = `/${locale}/dashboard/opportunities`
  const settingsHref = `/${locale}/settings`
  /** Dashboard (tenders list) active only on exact /dashboard. */
  const isDashboardActive = pathname === dashboardHref
  /** Tenders active on /dashboard/[tenderId] (tender detail), not on /dashboard/opportunities. */
  const isTendersActive =
    (pathname?.startsWith(dashboardHref + '/') ?? false) && pathname !== opportunitiesHref
  /** Opportunities active only on /dashboard/opportunities. */
  const isOpportunitiesActive = pathname === opportunitiesHref
  const isSettingsActive = pathname?.startsWith(settingsHref) ?? false

  const navLinkStyle = (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    backgroundColor: active ? SIDEBAR_ACTIVE_BG : 'transparent',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 'var(--text-sm)',
  })

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      style={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        alignSelf: 'stretch',
        backgroundColor: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-4)',
        gap: 'var(--space-4)',
      }}
    >
      {/* Logo: E Etmam per Figma */}
      <NextLink
        href={dashboardHref}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 'var(--space-2) 0',
          textDecoration: 'none',
          color: '#ffffff',
        }}
      >
        <Flex
          align="center"
          justify="center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1.125rem',
          }}
        >
          E
        </Flex>
        <Text size="3" weight="bold" style={{ color: '#ffffff' }}>
          {t('appName')}
        </Text>
      </NextLink>

      <Flex direction="column" gap="1">
        <NextLink href={dashboardHref} style={navLinkStyle(isDashboardActive)}>
          <LayoutDashboard size={18} />
          {t('dashboard')}
        </NextLink>
        <NextLink href={dashboardHref} style={navLinkStyle(isTendersActive)}>
          <FileText size={18} />
          {tNav('tenders')}
        </NextLink>
        <NextLink href={opportunitiesHref} style={navLinkStyle(isOpportunitiesActive)}>
          <Briefcase size={18} />
          {tNav('opportunities')}
        </NextLink>
        <NextLink href={settingsHref} style={navLinkStyle(isSettingsActive)}>
          <Settings size={18} />
          {t('settings')}
        </NextLink>
      </Flex>
    </aside>
  )
}
