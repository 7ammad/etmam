'use client'

import { useTranslations } from '@/components/providers/i18n-provider'
import NextLink from 'next/link'
import { Flex, Text, Box, Button } from '@radix-ui/themes'
import { ExternalLink, Mail } from 'lucide-react'

interface AboutSectionProps {
  version: string
}

export function AboutSection({ version }: AboutSectionProps) {
  const t = useTranslations('settings')

  return (
    <section aria-labelledby="about-section-heading" style={{ maxWidth: 480 }}>
      <Flex direction="column" gap="4">
        <Text id="about-section-heading" size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('aboutTitle')}
        </Text>
        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
          {t('aboutDescription')}
        </Text>

        <Flex direction="column" gap="2">
          <Text size="2" style={{ color: 'var(--text-secondary)' }}>
            {t('versionLabel')}: <strong style={{ color: 'var(--text-primary)' }}>{version}</strong>
          </Text>
          <Text size="2" style={{ color: 'var(--text-secondary)' }}>
            {t('builtBy')}
          </Text>
        </Flex>

        <Flex gap="3" wrap="wrap">
          <Button size="2" variant="soft" color="gray" asChild>
            <a href="https://github.com/etmam-app/docs" target="_blank" rel="noopener noreferrer">
              <ExternalLink style={{ width: 16, height: 16 }} />
              {t('viewDocumentation')}
            </a>
          </Button>
          <Button size="2" variant="soft" color="gray" asChild>
            <a href="mailto:support@etmam.example.com">
              <Mail style={{ width: 16, height: 16 }} />
              {t('contactSupport')}
            </a>
          </Button>
        </Flex>
      </Flex>
    </section>
  )
}
