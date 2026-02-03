'use client'

import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Section, Container, Grid, Flex, Heading, Text, Box, Card } from '@radix-ui/themes'
import { Shield, Cpu } from 'lucide-react'

/**
 * Split-screen section: Infratech Shield (Cyber/OT) left, Exotech Engine (AI/Data) right.
 * Copy derived from docs/Knowledge/infratech_profile.md and exotech_profile.md.
 */
export function CapabilityShowcase() {
  const t = useTranslations('landing')
  const { locale } = useI18n()
  const isRTL = locale === 'ar'

  const infratechContent = {
    title: t('showcaseInfratechTitle'),
    tagline: t('showcaseInfratechTagline'),
    identity: t('showcaseInfratechIdentity'),
    value: t('showcaseInfratechValue'),
    capabilities: [
      t('showcaseInfratechCap1'),
      t('showcaseInfratechCap2'),
      t('showcaseInfratechCap3'),
    ],
  }

  const exotechContent = {
    title: t('showcaseExotechTitle'),
    tagline: t('showcaseExotechTagline'),
    identity: t('showcaseExotechIdentity'),
    value: t('showcaseExotechValue'),
    capabilities: [
      t('showcaseExotechCap1'),
      t('showcaseExotechCap2'),
      t('showcaseExotechCap3'),
    ],
  }

  return (
    <Section size="3" id="dual-track" style={{ background: 'var(--gray-a2)' }}>
      <Container size="3">
        <Flex direction="column" align="center" gap="6" mb="8" style={{ textAlign: 'center' }}>
          <Heading size="8" weight="bold">
            {t('showcaseTitle')}
          </Heading>
          <Text size="3" style={{ color: 'var(--text-secondary)', maxWidth: 560 }}>
            {t('showcaseSubtitle')}
          </Text>
        </Flex>

        <Grid
          columns={{ initial: '1', md: '2' }}
          gap="6"
          style={{ alignItems: 'stretch' }}
        >
          {/* Left: Infratech Shield */}
          <Card
            size="3"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Flex direction="column" gap="4" p="4" style={{ flex: 1 }}>
              <Flex align="center" gap="3">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-3)',
                    background: 'var(--teal-3)',
                    color: 'var(--teal-11)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={24} />
                </Box>
                <Box>
                  <Text size="1" weight="bold" style={{ color: 'var(--teal-11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {infratechContent.tagline}
                  </Text>
                  <Heading size="6" weight="bold">
                    {infratechContent.title}
                  </Heading>
                </Box>
              </Flex>
              <Text size="2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {infratechContent.identity}
              </Text>
              <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
                {infratechContent.value}
              </Text>
              <ul style={{ margin: 0, paddingLeft: isRTL ? 0 : 20, paddingRight: isRTL ? 20 : 0, listStyle: 'disc' }}>
                {infratechContent.capabilities.map((cap, i) => (
                  <li key={i}>
                    <Text size="2" as="span" style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {cap}
                    </Text>
                  </li>
                ))}
              </ul>
            </Flex>
          </Card>

          {/* Right: Exotech Engine */}
          <Card
            size="3"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Flex direction="column" gap="4" p="4" style={{ flex: 1 }}>
              <Flex align="center" gap="3">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-3)',
                    background: 'var(--iris-3)',
                    color: 'var(--iris-11)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Cpu size={24} />
                </Box>
                <Box>
                  <Text size="1" weight="bold" style={{ color: 'var(--iris-11)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {exotechContent.tagline}
                  </Text>
                  <Heading size="6" weight="bold">
                    {exotechContent.title}
                  </Heading>
                </Box>
              </Flex>
              <Text size="2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {exotechContent.identity}
              </Text>
              <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
                {exotechContent.value}
              </Text>
              <ul style={{ margin: 0, paddingLeft: isRTL ? 0 : 20, paddingRight: isRTL ? 20 : 0, listStyle: 'disc' }}>
                {exotechContent.capabilities.map((cap, i) => (
                  <li key={i}>
                    <Text size="2" as="span" style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {cap}
                    </Text>
                  </li>
                ))}
              </ul>
            </Flex>
          </Card>
        </Grid>
      </Container>
    </Section>
  )
}
