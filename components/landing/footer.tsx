'use client'

import NextLink from 'next/link'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Grid, Flex, Text, Link, Box, Container } from '@radix-ui/themes'
import { Mail, Crown } from 'lucide-react'

export function Footer() {
  const t = useTranslations('common')
  const { locale } = useI18n()

  return (
    <Box 
      style={{ 
        borderTop: '1px solid var(--gray-a3)', 
        backgroundColor: 'var(--color-panel-translucent)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Container size="4" py="8">
        <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="8" pb="8">
          {/* Brand */}
          <Flex direction="column" gap="4">
            <NextLink href={`/${locale}`} style={{ textDecoration: 'none' }}>
              <Flex align="center" gap="3" style={{ cursor: 'pointer' }}>
                <Flex 
                  align="center" 
                  justify="center" 
                  width="32px" 
                  height="32px" 
                  style={{ 
                    borderRadius: 'var(--radius-3)',
                    background: 'linear-gradient(135deg, var(--iris-9), var(--iris-11))',
                  }}
                >
                  <Crown size={16} color="white" />
                </Flex>
                <Text size="4" weight="bold" style={{ color: 'var(--gray-12)' }}>
                  {t('appName')}
                </Text>
              </Flex>
            </NextLink>
            <Text size="2" color="gray" style={{ lineHeight: 1.6 }}>
              {locale === 'ar'
                ? 'منصة ذكية لربط المنافسات الحكومية بأنظمة CRM وتحويلها إلى فرص تلقائياً'
                : 'Intelligent platform connecting government tenders with CRM systems, automatically converting them into opportunities'}
            </Text>
          </Flex>

          {/* Quick Links */}
          <Flex direction="column" gap="4">
            <Text size="3" weight="bold">{locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}</Text>
            <Flex direction="column" gap="2">
              {[
                { href: `/${locale}/dashboard`, label: t('dashboard') },
                { href: `/${locale}#features`, label: locale === 'ar' ? 'المميزات' : 'Features' },
                { href: `/${locale}#how-it-works`, label: locale === 'ar' ? 'كيف يعمل' : 'How it Works' },
              ].map((link) => (
                <Link key={link.href} asChild size="2" color="gray" highContrast>
                  <NextLink href={link.href}>
                    {link.label}
                  </NextLink>
                </Link>
              ))}
            </Flex>
          </Flex>

          {/* Resources */}
          <Flex direction="column" gap="4">
            <Text size="3" weight="bold">{locale === 'ar' ? 'الموارد' : 'Resources'}</Text>
            <Flex direction="column" gap="2">
              {[
                { href: `/${locale}#faq`, label: locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQ' },
                { href: `/${locale}/settings`, label: t('settings') },
              ].map((link) => (
                <Link key={link.href} asChild size="2" color="gray" highContrast>
                  <NextLink href={link.href}>
                    {link.label}
                  </NextLink>
                </Link>
              ))}
            </Flex>
          </Flex>

          {/* Contact & Theme */}
          <Flex direction="column" gap="4">
            <Text size="3" weight="bold">{locale === 'ar' ? 'التواصل' : 'Contact'}</Text>
            <Flex direction="column" gap="3">
              <Flex align="center" gap="2">
                <Mail size={16} color="var(--gray-11)" />
                <Link href="mailto:info@etmaam.sa" size="2" color="gray" highContrast>
                  info@etmaam.sa
                </Link>
              </Flex>
              
              <Flex align="center" gap="3" mt="2">
                <ThemeToggle />
                <Text size="2" color="gray">
                  {locale === 'ar' ? 'تبديل المظهر' : 'Toggle Theme'}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Grid>

        {/* Bottom bar */}
        <Box 
          pt="6" 
          mt="6" 
          style={{ borderTop: '1px solid var(--gray-a3)' }}
        >
          <Flex 
            direction={{ initial: 'column', sm: 'row' }} 
            justify="between" 
            align="center" 
            gap="4"
          >
            <Text size="2" color="gray">
              © {new Date().getFullYear()} {t('appName')}.{' '}
              {locale === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </Text>
            <Flex gap="5">
              <Link asChild size="2" color="gray">
                <NextLink href="#">
                  {locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </NextLink>
              </Link>
              <Link asChild size="2" color="gray">
                <NextLink href="#">
                  {locale === 'ar' ? 'شروط الاستخدام' : 'Terms of Service'}
                </NextLink>
              </Link>
            </Flex>
          </Flex>
        </Box>
      </Container>
    </Box>
  )
}
