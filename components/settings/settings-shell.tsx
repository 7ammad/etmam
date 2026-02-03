'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import NextLink from 'next/link'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Flex, Box, Text, Tabs } from '@radix-ui/themes'
import { User, Plug, Palette, FileDown, Info } from 'lucide-react'

export type SettingsSection = 'profile' | 'crm' | 'appearance' | 'export' | 'about'

const SECTION_PARAM = 'section'
const SECTIONS: SettingsSection[] = ['profile', 'crm', 'appearance', 'export', 'about']

interface SettingsShellProps {
  locale: string
  children: React.ReactNode
  /** Initial section from server (from URL or default). */
  initialSection?: SettingsSection
}

export function SettingsShell({ locale, children, initialSection = 'profile' }: SettingsShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tNav = useTranslations('settingsNav')
  const t = useTranslations('settings')

  const currentSection = (searchParams.get(SECTION_PARAM) as SettingsSection) || initialSection
  const validSection = SECTIONS.includes(currentSection) ? currentSection : 'profile'

  const setSection = useCallback(
    (section: SettingsSection) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(SECTION_PARAM, section)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const navItems: { id: SettingsSection; label: string; icon: typeof User }[] = [
    { id: 'profile', label: tNav('profile'), icon: User },
    { id: 'crm', label: tNav('crm'), icon: Plug },
    { id: 'appearance', label: tNav('appearance'), icon: Palette },
    { id: 'export', label: tNav('export'), icon: FileDown },
    { id: 'about', label: tNav('about'), icon: Info },
  ]

  return (
    <Flex direction="column" gap="4" style={{ width: '100%', maxWidth: '100%' }}>
      <Box>
        <Text size="6" weight="bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {t('title')}
        </Text>
      </Box>

      {/* Mobile: horizontal tabs */}
      <Box display={{ initial: 'block', sm: 'none' }} style={{ width: '100%' }}>
        <Tabs.Root value={validSection} onValueChange={(v) => setSection(v as SettingsSection)}>
          <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap', borderBottom: '1px solid var(--border-default)' }}>
            {navItems.map(({ id, label, icon: Icon }) => (
              <Tabs.Trigger key={id} value={id} style={{ whiteSpace: 'nowrap' }}>
                <Icon style={{ width: 16, height: 16 }} aria-hidden />
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>
      </Box>

      <Flex gap="6" direction={{ initial: 'column', sm: 'row' }} style={{ alignItems: 'stretch' }}>
        {/* Desktop: sidebar */}
        <Box display={{ initial: 'none', sm: 'block' }} style={{ minWidth: 200, flexShrink: 0 }}>
          <nav aria-label={t('title')} style={{ position: 'sticky', top: 24 }}>
            <Flex direction="column" gap="1">
              {navItems.map(({ id, label, icon: Icon }) => {
                const isActive = validSection === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSection(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      width: '100%',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-2)',
                      border: 'none',
                      background: isActive ? 'var(--gray-a4)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'start',
                      fontSize: 'var(--font-size-2)',
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden />
                    {label}
                  </button>
                )
              })}
            </Flex>
          </nav>
        </Box>

        {/* Content */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          {children}
        </Box>
      </Flex>
    </Flex>
  )
}
