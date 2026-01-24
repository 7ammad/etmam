'use client'

import { Box, Flex, Heading, Text, Card, Badge, Button } from '@radix-ui/themes'
import { X, Plug, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import type { TenderWithEvaluation } from '@/lib/queries/tender'

type PushToCrmModalProps = {
  tender: TenderWithEvaluation
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function PushToCrmModal({ tender, open, onClose, onConfirm }: PushToCrmModalProps) {
  const tCrm = useTranslations('crm')
  const tTender = useTranslations('tender')
  const tEvaluation = useTranslations('evaluation')
  const { locale } = useI18n()
  const isRTL = locale === 'ar'

  if (!open) return null

  const valueFormatted = tender.estimated_value
    ? new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
      }).format(Number(tender.estimated_value))
    : '-'

  const deadlineFormatted = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(tender.deadline))

  return (
    <Box
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <Card className="glass-card" style={{ width: '100%', maxWidth: '720px' }}>
        <Flex direction="column">
          <Flex
            align="center"
            justify="between"
            style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-a3)' }}
          >
            <Heading size="5">{tCrm('pushConfirmTitle')}</Heading>
            <Button variant="ghost" size="1" onClick={onClose}>
              <X size={16} />
            </Button>
          </Flex>

          <Flex direction="column" gap="4" style={{ padding: '24px' }}>
            <Card className="glass-card" style={{ padding: '16px' }}>
              <Text size="2" color="gray" mb="3" style={{ display: 'block' }}>
                {tCrm('pushSummaryTitle')}
              </Text>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '120px' }}>{tTender('entity')}</Text>
                  <Text size="2" weight="medium">{tender.entity}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '120px' }}>{tTender('title')}</Text>
                  <Text size="2" weight="medium">{tender.title}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '120px' }}>{tTender('referenceNo')}</Text>
                  <Text size="2" weight="medium">{tender.reference_no}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '120px' }}>{tTender('estimatedValue')}</Text>
                  <Text size="2" weight="medium">{valueFormatted}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '120px' }}>{tTender('deadline')}</Text>
                  <Text size="2" weight="medium">{deadlineFormatted}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '120px' }}>{tEvaluation('score')}</Text>
                  <Text size="2" weight="medium">{tender.evaluation?.score ?? '-'}</Text>
                </Flex>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '120px' }}>{tEvaluation('recommendation')}</Text>
                  {tender.evaluation ? (
                    <Badge color="green" variant="soft">
                      {tEvaluation(tender.evaluation.recommendation)}
                    </Badge>
                  ) : (
                    <Text size="2" weight="medium">-</Text>
                  )}
                </Flex>
                <Flex align="start" gap="3">
                  <Text size="2" color="gray" style={{ minWidth: '120px' }}>{tEvaluation('summary')}</Text>
                  <Text size="2" weight="medium" style={{ lineHeight: 1.6 }}>
                    {tender.evaluation?.summary ?? tCrm('pushSummaryFallback')}
                  </Text>
                </Flex>
              </Flex>
            </Card>

            <Card className="glass-card" style={{ padding: '16px' }}>
              <Flex align="center" justify="between">
                <Flex align="center" gap="3">
                  <Flex
                    align="center"
                    justify="center"
                    width="40px"
                    height="40px"
                    style={{
                      borderRadius: 'var(--radius-2)',
                      background: 'var(--gray-a3)',
                      color: 'var(--gray-11)',
                    }}
                  >
                    <Plug size={18} />
                  </Flex>
                  <Box>
                    <Text size="2" weight="medium">{tCrm('providerName')}</Text>
                    <Flex align="center" gap="2">
                      <CheckCircle2 size={12} style={{ color: 'var(--green-11)' }} />
                      <Text size="1" color="gray">{tCrm('providerConnected')}</Text>
                    </Flex>
                  </Box>
                </Flex>
                <Text size="1" color="gray">{tCrm('lastTestedAt')}</Text>
              </Flex>
            </Card>

            <Card className="glass-card" style={{ padding: '16px' }}>
              <Flex align="start" gap="3">
                <AlertTriangle size={16} style={{ color: 'var(--yellow-11)', marginTop: 2 }} />
                <Box>
                  <Text size="2" weight="medium">{tCrm('inlineWarningsTitle')}</Text>
                  <Text size="1" color="gray">{tCrm('inlineWarningsText')}</Text>
                </Box>
              </Flex>
            </Card>
          </Flex>

          <Flex
            justify={isRTL ? 'start' : 'end'}
            gap="3"
            style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-a3)' }}
          >
            <Button variant="outline" color="gray" onClick={onClose}>
              {tCrm('cancelPush')}
            </Button>
            <Button variant="solid" color="iris" onClick={onConfirm}>
              {tCrm('confirmPush')}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Box>
  )
}
