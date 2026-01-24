'use client'

import NextLink from 'next/link'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button, Flex, Container, Box, Text, IconButton, Link } from '@radix-ui/themes'
import { Menu, X, Crown } from 'lucide-react'
import { useState, useEffect } from 'react'

export function LandingHeader() {
  const t = useTranslations('common')
  const tLanding = useTranslations('landing')
  const { locale } = useI18n()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const otherLocale = locale === 'ar' ? 'en' : 'ar'
  const otherLocaleLabel = locale === 'ar' ? 'EN' : 'عربي'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <Box 
      position="fixed" 
      top="0" 
      left="0" 
      right="0" 
      style={{ 
        zIndex: 50,
        transition: 'all 0.3s ease',
        backgroundColor: scrolled ? 'var(--color-panel-translucent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--gray-a3)' : 'none',
      }}
    >
      <Container size="4">
        <Flex justify="between" align="center" height="80px" px="4">
          {/* Logo */}
          <NextLink href={`/${locale}`} style={{ textDecoration: 'none' }}>
            <Flex align="center" gap="3" style={{ cursor: 'pointer' }}>
              <Flex 
                align="center" 
                justify="center" 
                width="40px" 
                height="40px" 
                style={{ 
                  borderRadius: 'var(--radius-3)',
                  background: 'linear-gradient(135deg, var(--iris-9), var(--iris-11))',
                  boxShadow: '0 4px 12px var(--iris-a5)',
                }}
              >
                <Crown size={20} color="white" />
              </Flex>
              <Text size="5" weight="bold" style={{ color: 'var(--gray-12)' }}>
                {t('appName')}
              </Text>
            </Flex>
          </NextLink>

          {/* Desktop Navigation */}
          <Flex display={{ initial: 'none', md: 'flex' }} gap="6" align="center">
            {[
              { href: '#features', label: locale === 'ar' ? 'المميزات الرئيسية' : 'Key Features' },
              { href: '#how-it-works', label: locale === 'ar' ? 'كيف يعمل' : 'How It Works' },
              { href: '#faq', label: 'FAQ' },
            ].map((link) => (
              <Link key={link.href} asChild size="2" weight="medium" color="gray" highContrast underline="none">
                <NextLink href={`/${locale}${link.href}`}>
                  {link.label}
                </NextLink>
              </Link>
            ))}
          </Flex>

          {/* Actions */}
          <Flex align="center" gap="3">
            {/* Language toggle */}
            <Button asChild variant="ghost" color="gray" size="2">
              <NextLink href={`/${otherLocale}`}>
                {otherLocaleLabel}
              </NextLink>
            </Button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* CTA Button */}
            <Box display={{ initial: 'none', sm: 'block' }}>
              <Button asChild size="2" variant="solid" color="iris">
                <NextLink href={`/${locale}/dashboard`}>
                  {tLanding('getStarted')}
                </NextLink>
              </Button>
            </Box>

            {/* Mobile menu button */}
            <Box display={{ md: 'none' }}>
              <IconButton 
                variant="ghost" 
                color="gray" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </IconButton>
            </Box>
          </Flex>
        </Flex>
      </Container>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <Box 
          position="absolute" 
          top="100%" 
          left="0" 
          right="0" 
          p="4"
          style={{ 
            backgroundColor: 'var(--color-panel-solid)',
            borderBottom: '1px solid var(--gray-a3)',
          }}
        >
          <Flex direction="column" gap="4">
            {[
              { href: '#features', label: locale === 'ar' ? 'المميزات الرئيسية' : 'Key Features' },
              { href: '#how-it-works', label: locale === 'ar' ? 'كيف يعمل' : 'How It Works' },
              { href: '#faq', label: 'FAQ' },
            ].map((link) => (
              <Link 
                key={link.href} 
                asChild 
                size="3" 
                weight="medium" 
                color="gray"
                underline="none"
                onClick={() => setMobileMenuOpen(false)}
              >
                <NextLink href={`/${locale}${link.href}`}>
                  {link.label}
                </NextLink>
              </Link>
            ))}
            <Button asChild size="3" variant="solid" color="iris" style={{ width: '100%' }}>
              <NextLink href={`/${locale}/dashboard`}>
                {tLanding('getStarted')}
              </NextLink>
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  )
}
