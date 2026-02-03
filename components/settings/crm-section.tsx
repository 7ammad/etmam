'use client'

import { useTranslations } from '@/components/providers/i18n-provider'
import NextLink from 'next/link'
import { Flex, Text, Box } from '@radix-ui/themes'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { OdooIntegrationForm } from './odoo-integration-form'

type OdooInitial = { base_url: string; db: string; username: string; hasPassword: boolean } | null

interface CRMSectionProps {
  odooInitial: OdooInitial
  locale: string
}

export function CRMSection({ odooInitial, locale }: CRMSectionProps) {
  const t = useTranslations('settings')
  const tCrm = useTranslations('settingsCrm')
  const isConnected = odooInitial != null

  return (
    <section aria-labelledby="crm-section-heading" style={{ maxWidth: 520 }}>
      <Flex direction="column" gap="4">
        <Text id="crm-section-heading" size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('integrationsTitle')}
        </Text>
        <Flex align="center" gap="2">
          {isConnected ? (
            <>
              <CheckCircle style={{ width: 20, height: 20, color: 'var(--green-11)' }} aria-hidden />
              <Text size="2" weight="medium" style={{ color: 'var(--green-11)' }}>
                {tCrm('connected')}
              </Text>
            </>
          ) : (
            <>
              <XCircle style={{ width: 20, height: 20, color: 'var(--gray-10)' }} aria-hidden />
              <Text size="2" weight="medium" style={{ color: 'var(--text-secondary)' }}>
                {tCrm('notConnected')}
              </Text>
            </>
          )}
        </Flex>
        <OdooIntegrationForm initial={odooInitial} />
        <Box
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-2)',
            background: 'var(--gray-a2)',
            border: '1px solid var(--border-default)',
          }}
        >
          <Flex gap="2" align="start">
            <Info style={{ width: 18, height: 18, color: 'var(--gray-11)', flexShrink: 0, marginTop: 2 }} aria-hidden />
            <Flex direction="column" gap="1">
              <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                {t('manualExportInfo')}
              </Text>
              <NextLink
                href={`/${locale}/dashboard/opportunities`}
                style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-info-600)', textDecoration: 'underline' }}
              >
                {t('manualExportLink')}
              </NextLink>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </section>
  )
}
