'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Flex, Text } from '@radix-ui/themes'
import { FileText, Briefcase, Settings, BarChart3 } from 'lucide-react'

interface AppSidebarProps {
  locale: string
  /** On mobile: when true drawer is visible; when false off-screen. */
  mobileOpen?: boolean
  /** Call when drawer should close (e.g. overlay click or nav link click on mobile). */
  onClose?: () => void
}

/** Sidebar: design tokens (CC-1); logo "E Etmam" top; white nav. Selected = lighter teal. On mobile: drawer (CC-4). */
const SIDEBAR_WIDTH = 240

export function AppSidebar({ locale, mobileOpen = true, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('common')
  const tNav = useTranslations('navigation')

  const dashboardHref = `/${locale}/dashboard`
  const opportunitiesHref = `/${locale}/dashboard/opportunities`
  const analysisHref = `/${locale}/dashboard/analysis`
  const settingsHref = `/${locale}/settings`

  /** Tenders: active on /dashboard (exact) or /dashboard/[tenderId], not on /dashboard/opportunities or /dashboard/analysis. */
  const isTendersActive =
    pathname === dashboardHref ||
    ((pathname?.startsWith(dashboardHref + '/') ?? false) && pathname !== opportunitiesHref && pathname !== analysisHref)
  /** Opportunities: active only on /dashboard/opportunities. */
  const isOpportunitiesActive = pathname === opportunitiesHref
  /** Analysis: active only on /dashboard/analysis. */
  const isAnalysisActive = pathname === analysisHref
  const isSettingsActive = pathname?.startsWith(settingsHref) ?? false

  const navLinkStyle = (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    backgroundColor: active ? 'var(--sidebar-active-bg)' : 'transparent',
    color: 'var(--sidebar-text)',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 'var(--text-sm)',
  })

  const disabledNavStyle = () => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: 'var(--sidebar-text-muted)',
    cursor: 'not-allowed',
    fontWeight: 500,
    fontSize: 'var(--text-sm)',
  })

  const linkProps = (href: string, active: boolean) => ({
    href,
    style: navLinkStyle(active),
    onClick: onClose,
    'aria-current': active ? ('page' as const) : undefined,
  })

  return (
    <div className={`sidebar-drawer ${!mobileOpen ? 'sidebar-drawer-closed' : ''}`} style={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
    <aside
      role="navigation"
      aria-label="Main navigation"
      style={{
        width: SIDEBAR_WIDTH,
        minHeight: '100%',
        alignSelf: 'stretch',
        backgroundColor: 'var(--sidebar-bg)',
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
          color: 'var(--sidebar-text)',
        }}
      >
        <Flex
          align="center"
          justify="center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'var(--sidebar-logo-bg)',
            color: 'var(--sidebar-text)',
            fontWeight: 700,
            fontSize: '1.125rem',
          }}
        >
          E
        </Flex>
        <Text size="3" weight="bold" style={{ color: 'var(--sidebar-text)' }}>
          {t('appName')}
        </Text>
      </NextLink>

      <Flex direction="column" gap="1">
        <NextLink {...linkProps(dashboardHref, isTendersActive)}>
          <FileText size={18} aria-hidden />
          {tNav('tenders')}
        </NextLink>
        <NextLink {...linkProps(opportunitiesHref, isOpportunitiesActive)}>
          <Briefcase size={18} aria-hidden />
          {tNav('opportunities')}
        </NextLink>
        <NextLink {...linkProps(settingsHref, isSettingsActive)}>
          <Settings size={18} aria-hidden />
          {t('settings')}
        </NextLink>
        <NextLink {...linkProps(analysisHref, isAnalysisActive)}>
          <BarChart3 size={18} aria-hidden />
          {tNav('analytics')}
        </NextLink>
      </Flex>
    </aside>
    </div>
  )
}
