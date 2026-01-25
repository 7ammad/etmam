'use client'

import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Box, Flex, Text } from '@radix-ui/themes'
import { Crown, LayoutDashboard, FileText, Users, Settings as SettingsIcon, LogOut, X, ChevronRight, Sparkles } from 'lucide-react'

type SidebarProps = {
  className?: string
  style?: CSSProperties
  onClose?: () => void
  isMobileDrawer?: boolean
}

export function Sidebar({ className, style, onClose, isMobileDrawer = false }: SidebarProps) {
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

  const handleNavClick = () => {
    if (isMobileDrawer && onClose) {
      onClose()
    }
  }

  return (
    <Box
      className={className}
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        backgroundColor: 'var(--surface-sidebar)',
        boxShadow: 'var(--shadow-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* Logo Header */}
      <Flex 
        align="center" 
        justify="between"
        gap="3" 
        style={{ 
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <Flex align="center" gap="3">
          <Flex 
            align="center" 
            justify="center" 
            style={{ 
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
              boxShadow: 'var(--shadow-primary)',
            }}
          >
            <Crown size={18} color="white" />
          </Flex>
          <Text 
            size="5" 
            weight="bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {tCommon('appName')}
          </Text>
        </Flex>
        
        {/* Close button for mobile drawer */}
        {isMobileDrawer && onClose && (
          <button
            onClick={onClose}
            aria-label={isRTL ? 'إغلاق القائمة' : 'Close menu'}
            className="focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'var(--transition-colors)',
            }}
          >
            <X size={20} />
          </button>
        )}
      </Flex>

      {/* Navigation */}
      <nav 
        aria-label={isRTL ? 'القائمة الرئيسية' : 'Main navigation'}
        style={{ 
          flex: 1, 
          padding: 'var(--space-4)',
          overflowY: 'auto',
        }}
      >
        <Flex direction="column" gap="1">
          {navItems.map((item) => {
            const isActive = activeId === item.id
            const Icon = item.icon
            
            return (
              <NextLink 
                key={item.id} 
                href={item.href}
                onClick={handleNavClick}
                aria-current={isActive ? 'page' : undefined}
                className="focus-ring"
                style={{ 
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <Flex
                  align="center"
                  justify="between"
                  gap="3"
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--color-primary-500)' : 'transparent',
                    color: isActive ? 'var(--text-inverted)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-all)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--surface-muted)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <Flex align="center" gap="3">
                    <Icon 
                      size={20} 
                      style={{ 
                        flexShrink: 0,
                        opacity: isActive ? 1 : 0.8,
                      }} 
                    />
                    <Text 
                      size="2" 
                      weight={isActive ? 'bold' : 'medium'}
                      style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.label}
                    </Text>
                  </Flex>
                  {isActive && (
                    <ChevronRight 
                      size={16} 
                      className="flip-rtl"
                      style={{ flexShrink: 0 }} 
                    />
                  )}
                </Flex>
              </NextLink>
            )
          })}
        </Flex>

        {/* CTA Card - Upgrade to PRO (Compact) */}
        <Box
          style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-cta-card)',
            color: 'var(--text-inverted)',
          }}
        >
          <Flex align="center" gap="3">
            <Flex
              align="center"
              justify="center"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={16} />
            </Flex>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="2" weight="bold" style={{ display: 'block' }}>
                {isRTL ? 'ترقية PRO' : 'Upgrade PRO'}
              </Text>
              <Text size="1" style={{ opacity: 0.85 }}>
                {isRTL ? 'جميع الميزات' : 'All Features'}
              </Text>
            </Box>
          </Flex>
        </Box>
      </nav>

      {/* User Profile Section */}
      <Box 
        style={{ 
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <Flex align="center" gap="3" style={{ marginBottom: 'var(--space-3)' }}>
          <Flex
            align="center"
            justify="center"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-bold)',
              flexShrink: 0,
            }}
          >
            {isRTL ? 'م' : 'E'}
          </Flex>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text 
              size="2" 
              weight="bold"
              style={{ 
                display: 'block',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isRTL ? 'مستخدم إتمام' : 'Etmaam User'}
            </Text>
            <Text 
              size="1" 
              style={{ 
                display: 'block',
                color: 'var(--text-secondary)',
              }}
            >
              {isRTL ? 'مدير المشروع' : 'Project Manager'}
            </Text>
          </Box>
        </Flex>

        {/* Logout Button */}
        <button
          onClick={() => {
            // TODO: Implement logout logic
            console.log('Logout clicked')
          }}
          className="focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            width: '100%',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'var(--transition-all)',
            fontFamily: 'inherit',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            textAlign: isRTL ? 'right' : 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-error-50)'
            e.currentTarget.style.color = 'var(--color-error-600)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          <span>{tCommon('logout')}</span>
        </button>
      </Box>
    </Box>
  )
}
