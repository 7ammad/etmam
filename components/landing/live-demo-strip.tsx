'use client'

import { useTranslations } from '@/components/providers/i18n-provider'
import { Section, Container, Flex, Heading, Text, Box } from '@radix-ui/themes'

/**
 * Wide container: placeholder dashboard screenshot + "See the command center in action."
 * Replace placeholder with real image (e.g. /dashboard-screenshot.png) when available.
 */
export function LiveDemoStrip() {
  const t = useTranslations('landing')

  return (
    <Section size="4" style={{ background: 'var(--surface-page)', paddingTop: 0, paddingBottom: 0 }}>
      <Container size="4" style={{ maxWidth: 1200 }}>
        <Flex direction="column" align="center" gap="4">
          <Heading size="6" weight="bold" align="center">
            {t('demoStripTitle')}
          </Heading>
          <Box
            style={{
              width: '100%',
              maxWidth: 1000,
              aspectRatio: '16 / 9',
              borderRadius: 'var(--radius-4)',
              border: '1px solid var(--border-default)',
              background: 'var(--gray-a3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Placeholder: replace src with /dashboard-screenshot.png when available */}
            <img
              src="/dashboard-placeholder.png"
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent && !parent.querySelector('.demo-strip-fallback')) {
                  const fallback = document.createElement('div')
                  fallback.className = 'demo-strip-fallback'
                  fallback.setAttribute('style', 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: var(--gray-9); font-size: var(--font-size-3);')
                  fallback.textContent = 'Dashboard command center'
                  parent.appendChild(fallback)
                }
              }}
            />
          </Box>
          <Text size="2" style={{ color: 'var(--text-secondary)' }}>
            {t('demoStripCta')}
          </Text>
        </Flex>
      </Container>
    </Section>
  )
}
