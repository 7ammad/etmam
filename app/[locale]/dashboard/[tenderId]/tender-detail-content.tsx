'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Calendar, Building2, Hash, Banknote, FileText } from 'lucide-react'
import { Card, Flex, Text, Heading, Badge, Box, Button, Grid, Callout } from '@radix-ui/themes'
import { EvaluationDisplay, EvaluateButton } from '@/components/tender'
import { PushToCrmModal } from '@/components/modals/push-to-crm-modal'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import type { TenderWithEvaluation } from '@/lib/queries/tender'
import type { Recommendation } from '@/types/evaluation'

interface TenderDetailContentProps {
  locale: string
  tender: TenderWithEvaluation
}

export function TenderDetailContent({ locale, tender }: TenderDetailContentProps) {
  const t = useTranslations('tender')
  const tEval = useTranslations('evaluation')
  const tCommon = useTranslations('common')
  const tCrm = useTranslations('crm')
  const { locale: currentLocale } = useI18n()
  const isRTL = currentLocale === 'ar'
  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [showPushModal, setShowPushModal] = useState(false)

  // Format values
  const valueFormatted = tender.estimated_value
    ? new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
      }).format(Number(tender.estimated_value))
    : '-'

  const deadlineFormatted = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'long',
  }).format(new Date(tender.deadline))

  const createdAtFormatted = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(tender.created_at))

  // Status badge colors
  const statusColors: Record<string, 'gray' | 'blue' | 'green' | 'purple' | 'red'> = {
    pending: 'gray',
    evaluating: 'blue',
    evaluated: 'green',
    approved: 'green',
    pushed: 'purple',
    rejected: 'red',
  }

  const handleEvaluationComplete = (_result: { score: number; recommendation: string }) => {
    setError(null)
    // Reload the page to get fresh data
    window.location.reload()
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft

  return (
    <Flex direction="column" gap="5">
      <PushToCrmModal
        tender={tender}
        open={showPushModal}
        onClose={() => setShowPushModal(false)}
        onConfirm={() => router.push(`/${locale}/dashboard/${tender.id}/push-success`)}
      />

      {/* Breadcrumb */}
      <Flex align="center" gap="2">
        <Link href={`/${locale}/tenders-list`} style={{ textDecoration: 'none' }}>
          <Text size="2" color="gray" highContrast style={{ cursor: 'pointer' }}>
            {t('title')}
          </Text>
        </Link>
        <Text size="2" color="gray">/</Text>
        <Text size="2">{t('detailTitle')}</Text>
      </Flex>

      {/* Back Button */}
      <Box>
        <Link href={`/${locale}/dashboard`} style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="2">
            <Flex align="center" gap="2">
              <ArrowIcon style={{ width: '16px', height: '16px' }} />
              <Text>{tCommon('back')}</Text>
            </Flex>
          </Button>
        </Link>
      </Box>

      {/* Header */}
      <Card className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <Flex direction={{ initial: 'column', sm: 'row' }} align={{ initial: 'start', sm: 'center' }} justify="between" gap="4">
          <Box>
            <Heading size="6" weight="bold" mb="2">{tender.title}</Heading>
            <Text size="3" color="gray" mb="3">{tender.entity}</Text>
            <Flex wrap="wrap" gap="4">
              <Text size="2" color="gray">{t('referenceNo')}: {tender.reference_no}</Text>
              <Text size="2" color="gray">{t('deadline')}: {deadlineFormatted}</Text>
              <Text size="2" color="gray">{t('estimatedValue')}: {valueFormatted}</Text>
            </Flex>
          </Box>
          <Flex direction="column" align="end" gap="3">
            <Badge size="2" color={statusColors[tender.status] || 'gray'} variant="soft">
              {t(`statuses.${tender.status}`)}
            </Badge>
            {tender.evaluation && (
              <Button size="2" variant="solid" color="iris" onClick={() => setShowPushModal(true)}>
                {tCrm('createOpportunity')}
              </Button>
            )}
          </Flex>
        </Flex>
      </Card>

      {/* Error Message */}
      {error && (
        <Callout.Root color="red">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      {/* Tender Details Card */}
      <Card className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <Flex direction="column" gap="4">
          <Heading size="4">{t('viewDetails')}</Heading>
          <Grid columns={{ initial: '1', sm: '2' }} gap="4">
            <Flex align="start" gap="3">
              <Building2 style={{ width: '20px', height: '20px', color: 'var(--gray-11)', marginTop: '2px' }} />
              <Box>
                <Text size="2" color="gray">{t('entity')}</Text>
                <Text weight="medium" style={{ display: 'block' }}>{tender.entity}</Text>
              </Box>
            </Flex>

            <Flex align="start" gap="3">
              <Hash style={{ width: '20px', height: '20px', color: 'var(--gray-11)', marginTop: '2px' }} />
              <Box>
                <Text size="2" color="gray">{t('referenceNo')}</Text>
                <Text weight="medium" style={{ display: 'block' }}>{tender.reference_no}</Text>
              </Box>
            </Flex>

            <Flex align="start" gap="3">
              <Banknote style={{ width: '20px', height: '20px', color: 'var(--gray-11)', marginTop: '2px' }} />
              <Box>
                <Text size="2" color="gray">{t('estimatedValue')}</Text>
                <Text weight="medium" style={{ display: 'block' }}>{valueFormatted}</Text>
              </Box>
            </Flex>

            <Flex align="start" gap="3">
              <Calendar style={{ width: '20px', height: '20px', color: 'var(--gray-11)', marginTop: '2px' }} />
              <Box>
                <Text size="2" color="gray">{t('deadline')}</Text>
                <Text weight="medium" style={{ display: 'block' }}>{deadlineFormatted}</Text>
              </Box>
            </Flex>

            {tender.description && (
              <Box style={{ gridColumn: '1 / -1' }}>
                <Flex align="start" gap="3">
                  <FileText style={{ width: '20px', height: '20px', color: 'var(--gray-11)', marginTop: '2px' }} />
                  <Box>
                    <Text size="2" color="gray">{t('description')}</Text>
                    <Text weight="medium" style={{ display: 'block' }}>{tender.description}</Text>
                  </Box>
                </Flex>
              </Box>
            )}

            <Flex align="start" gap="3">
              <Box style={{ width: '20px', height: '20px' }} />
              <Box>
                <Text size="2" color="gray">{t('source')}</Text>
                <Text weight="medium" style={{ display: 'block' }}>{tender.source || '-'}</Text>
              </Box>
            </Flex>

            <Flex align="start" gap="3">
              <Box style={{ width: '20px', height: '20px' }} />
              <Box>
                <Text size="2" color="gray">{t('createdAt')}</Text>
                <Text weight="medium" style={{ display: 'block' }}>{createdAtFormatted}</Text>
              </Box>
            </Flex>
          </Grid>
        </Flex>
      </Card>

      {/* Evaluation Section */}
      <Flex direction="column" gap="4">
        <Flex align="center" justify="between">
          <Heading size="5">{tEval('title')}</Heading>
          <EvaluateButton
            tenderId={tender.id}
            hasEvaluation={!!tender.evaluation}
            onEvaluationComplete={handleEvaluationComplete}
            onError={handleError}
          />
        </Flex>

        {tender.evaluation ? (
          <EvaluationDisplay
            evaluation={{
              score: tender.evaluation.score,
              recommendation: tender.evaluation.recommendation as Recommendation,
              summary: tender.evaluation.summary,
              strengths: tender.evaluation.strengths || [],
              risks: tender.evaluation.risks || [],
              missing_requirements: tender.evaluation.missing_requirements || [],
              action_items: tender.evaluation.action_items || [],
              breakdown: tender.evaluation.breakdown as {
                budget_fit: number
                technical_fit: number
                timeline_fit: number
                strategic_fit: number
                risk_score: number
              },
              model_used: tender.evaluation.model_used,
              created_at: tender.evaluation.created_at,
            }}
          />
        ) : (
          <Card className="glass-card">
            <Flex direction="column" align="center" justify="center" py="9" style={{ textAlign: 'center' }}>
              <Text color="gray">{tEval('runEvaluation')}</Text>
            </Flex>
          </Card>
        )}
      </Flex>
    </Flex>
  )
}
