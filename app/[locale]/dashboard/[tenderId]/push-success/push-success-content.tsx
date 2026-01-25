'use client'

import NextLink from 'next/link'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { Box, Flex, Heading, Text, Card, Button, Badge } from '@radix-ui/themes'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import type { TenderWithEvaluation } from '@/lib/queries/tender'

type PushSuccessContentProps = {
  locale: string
  tender: TenderWithEvaluation
}

export function PushSuccessContent({ locale, tender }: PushSuccessContentProps) {
  const tCrm = useTranslations('crm')
  const tTender = useTranslations('tender')
  const { locale: currentLocale } = useI18n()

  const valueFormatted = tender.estimated_value
    ? new Intl.NumberFormat(currentLocale === 'ar' ? 'ar-SA' : 'en-SA', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
      }).format(Number(tender.estimated_value))
    : '-'

  const pushedAt = new Intl.DateTimeFormat(currentLocale === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  return (
    <Flex direction="column" align="center" justify="center" style={{ minHeight: '70vh' }}>
      <Card className="glass-card" style={{ width: '100%', maxWidth: '720px' }}>
        <Flex direction="column">
          <Flex direction="column" align="center" style={{ padding: '32px', borderBottom: '1px solid var(--gray-a3)' }}>
            <Flex
              align="center"
              justify="center"
              width="64px"
              height="64px"
              style={{
                borderRadius: '999px',
                background: 'linear-gradient(135deg, var(--iris-9), var(--iris-11))',
                boxShadow: '0 8px 24px var(--iris-a4)',
              }}
            >
              <CheckCircle2 size={28} color="white" />
            </Flex>
            <Heading size="6" mt="4">{tCrm('pushSuccessTitle')}</Heading>
            <Text size="2" color="gray">{tCrm('pushSuccessSubtitle')}</Text>
          </Flex>

          <Flex direction="column" gap="4" style={{ padding: '24px' }}>
            <Card className="glass-card" style={{ padding: '16px' }}>
              <Heading size="3" mb="3">{tCrm('opportunityDetails')}</Heading>
              <Flex direction="column" gap="2">
                <Flex justify="between">
                  <Text size="2" color="gray">{tCrm('opportunityId')}</Text>
                  <Text size="2" weight="medium">{tCrm('opportunityIdValue')}</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" color="gray">{tCrm('pushTime')}</Text>
                  <Text size="2" weight="medium">{pushedAt}</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" color="gray">{tCrm('crmStatus')}</Text>
                  <Badge variant="soft" color="green">{tCrm('crmLinked')}</Badge>
                </Flex>
                <Flex justify="between">
                  <Text size="2" color="gray">{tCrm('provider')}</Text>
                  <Text size="2" weight="medium">{tCrm('providerName')}</Text>
                </Flex>
              </Flex>
            </Card>

            <Card className="glass-card" style={{ padding: '16px' }}>
              <Heading size="3" mb="3">{tCrm('tenderSummaryTitle')}</Heading>
              <Flex direction="column" gap="2">
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '110px' }}>{tTender('entity')}</Text>
                  <Text size="2" weight="medium">{tender.entity}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '110px' }}>{tTender('title')}</Text>
                  <Text size="2" weight="medium">{tender.title}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '110px' }}>{tTender('estimatedValue')}</Text>
                  <Text size="2" weight="medium">{valueFormatted}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '110px' }}>{tCrm('scoreLabel')}</Text>
                  <Text size="2" weight="medium">{tender.evaluation?.score ?? '-'}</Text>
                </Flex>
              </Flex>
            </Card>

            <Flex wrap="wrap" gap="3">
              <Button asChild variant="solid" color="iris">
                <NextLink href={tCrm('crmExternalLink')}>
                  <Flex align="center" gap="2">
                    <ExternalLink size={16} />
                    {tCrm('openInCrm')}
                  </Flex>
                </NextLink>
              </Button>
              <Button asChild variant="outline" color="gray">
                <NextLink href={`/${locale}/dashboard`}>
                  {tCrm('backToDashboard')}
                </NextLink>
              </Button>
              <Button asChild variant="outline" color="gray">
                <NextLink href={`/${locale}/tenders-list`}>
                  {tCrm('viewTenders')}
                </NextLink>
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}
