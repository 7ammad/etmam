'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Box, Flex, Text, Heading } from '@radix-ui/themes'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const tCommon = useTranslations('common')
  const tHeader = useTranslations('header')
  const { locale } = useI18n()
  const pathname = usePathname()
  const isRTL = locale === 'ar'
  const [searchQuery, setSearchQuery] = useState('')

  const userName = tHeader('userName')

  return (
    <Box
      asChild
      position="sticky"
      top="0"
      style={{
        zIndex: 'var(--z-sticky)',
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--surface-ground)',
      }}
    >
      <header>
        <Flex 
          align="center" 
          gap="4" 
          style={{ 
            height: 'var(--header-height)',
            paddingInline: 'var(--space-6)',
          }}
        >
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            aria-label={isRTL ? 'فتح القائمة' : 'Open menu'}
            className="focus-ring mobile-only"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'var(--transition-colors)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-muted)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <Menu size={22} />
          </button>

          {/* Greeting */}
          <Heading 
            size="5" 
            weight="bold" 
            style={{ 
              color: 'var(--text-primary)',
              marginInlineEnd: 'auto',
            }}
          >
            {isRTL ? `مرحباً ${userName} 👋` : `Hello ${userName} 👋`}
          </Heading>

          {/* Global Search */}
          <Flex 
            align="center" 
            gap="2"
            style={{
              position: 'relative',
              flex: '0 1 400px',
            }}
            className="desktop-only"
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
              }}
            >
              <Search 
                size={18} 
                style={{
                  position: 'absolute',
                  [isRTL ? 'right' : 'left']: 'var(--space-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'بحث...' : 'Search...'}
                style={{
                  width: '100%',
                  height: '40px',
                  paddingInline: isRTL ? 'var(--space-3) var(--space-10)' : 'var(--space-10) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--surface-ground)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  transition: 'var(--transition-colors)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-focus)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                }}
              />
            </div>
          </Flex>

          {/* Actions */}
          <Flex align="center" gap="2">
            {/* Theme toggle */}
            <ThemeToggle />
          </Flex>
        </Flex>
      </header>
    </Box>
  )
}
