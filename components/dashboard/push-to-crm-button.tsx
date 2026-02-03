'use client'

import { useState } from 'react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { pushToCRM, pushToCRMDryRun } from '@/actions/crm'
import { Box, Flex, Text, Button, Dialog } from '@radix-ui/themes'
import { Loader2, Send, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'

type TenderStatus = 'pending' | 'evaluating' | 'evaluated' | 'approved' | 'pushed' | 'rejected'

/** When provided (e.g. from Opportunities list), overrides display: Retry for failed, Pushed for pushed. */
export type PushStatusOverride = 'ready' | 'pushed' | 'failed'

interface PushToCRMButtonProps {
  tenderId: string
  tenderTitle: string
  hasEvaluation: boolean
  currentStatus: TenderStatus
  /** Optional: from getOpportunityReadyTendersWithPushStatus; enables Retry label and correct disabled state. */
  pushStatus?: PushStatusOverride
}

type ButtonState = 'idle' | 'previewing' | 'pushing' | 'success' | 'error'

interface PreviewPayload {
  provider: string
  opportunityData: {
    entity: string
    title: string
    reference_no: string
    score: number
    recommendation: string
    summary: string
  }
}

// Helper to safely get value with fallback
function safeString(val: string | null | undefined, fallback = ''): string {
  return val ?? fallback
}

export function PushToCRMButton({
  tenderId,
  tenderTitle,
  hasEvaluation,
  currentStatus,
  pushStatus,
}: PushToCRMButtonProps) {
  const t = useTranslations('crm')
  const tOpp = useTranslations('opportunitiesPage')
  const tCommon = useTranslations('common')
  const [state, setState] = useState<ButtonState>('idle')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [preview, setPreview] = useState<PreviewPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isPushed = pushStatus === 'pushed' || (!pushStatus && currentStatus === 'pushed')
  const isFailed = pushStatus === 'failed'
  const isDisabled = (isPushed && !isFailed) || !hasEvaluation || state === 'previewing' || state === 'pushing'

  const getDisabledReason = (): string | null => {
    if (isPushed && !isFailed) return t('alreadyPushed')
    if (!hasEvaluation) return t('noEvaluation')
    return null
  }

  const buttonLabel = isPushed && !isFailed
    ? tOpp('pushedDisabled')
    : isFailed
      ? tOpp('retry')
      : t('pushButton')
  const ButtonIcon = isPushed && !isFailed ? CheckCircle : isFailed ? RotateCcw : Send

  const handleOpenDialog = async () => {
    setState('previewing')
    setError(null)

    const result = await pushToCRMDryRun(tenderId)

    if (result.success && result.data) {
      setPreview({
        provider: result.data.provider,
        opportunityData: {
          entity: safeString(result.data.opportunityData.entity),
          title: safeString(result.data.opportunityData.title),
          reference_no: safeString(result.data.opportunityData.reference_no),
          score: result.data.opportunityData.score ?? 0,
          recommendation: safeString(result.data.opportunityData.recommendation, 'pending'),
          summary: safeString(result.data.opportunityData.summary),
        },
      })
      setDialogOpen(true)
      setState('idle')
    } else {
      setError(result.success === false ? result.error : t('pushError'))
      setState('error')
    }
  }

  const handleConfirmPush = async () => {
    setState('pushing')
    setError(null)

    const result = await pushToCRM(tenderId)

    if (result.success) {
      setState('success')
      // Close dialog after a short delay to show success state
      setTimeout(() => {
        setDialogOpen(false)
        setState('idle')
      }, 2000)
    } else {
      setError(result.success === false ? result.error : t('pushError'))
      setState('error')
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setPreview(null)
    setError(null)
    if (state !== 'success') {
      setState('idle')
    }
  }

  const disabledReason = getDisabledReason()

  return (
    <>
      <Box>
        <Button
          size="2"
          onClick={handleOpenDialog}
          disabled={isDisabled}
          title={disabledReason ?? undefined}
          style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
          data-testid="push-to-crm-button"
        >
          {state === 'previewing' ? (
            <>
              <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
              {tCommon('loading')}
            </>
          ) : (
            <>
              <ButtonIcon style={{ width: 16, height: 16 }} />
              {buttonLabel}
            </>
          )}
        </Button>
        {disabledReason && (
          <Text size="1" style={{ display: 'block', marginTop: 'var(--space-1)', color: 'var(--gray-10)' }}>
            {disabledReason}
          </Text>
        )}
        {state === 'error' && !dialogOpen && error && (
          <Flex align="center" gap="1" style={{ marginTop: 'var(--space-2)' }} data-testid="push-error-message">
            <AlertCircle style={{ width: 14, height: 14, color: 'var(--red-11)' }} />
            <Text size="1" style={{ color: 'var(--red-11)' }}>
              {error}
            </Text>
          </Flex>
        )}
      </Box>

      <Dialog.Root open={dialogOpen} onOpenChange={handleCloseDialog}>
        <Dialog.Content style={{ maxWidth: 480 }} data-testid="push-confirm-dialog">
          <Dialog.Title>{t('pushConfirmTitle')}</Dialog.Title>
          <Dialog.Description size="2" style={{ color: 'var(--gray-11)' }}>
            {tenderTitle}
          </Dialog.Description>

          {state === 'success' ? (
            <Flex direction="column" align="center" gap="3" py="4">
              <CheckCircle style={{ width: 48, height: 48, color: 'var(--green-11)' }} />
              <Text size="3" weight="bold" style={{ color: 'var(--green-11)' }}>
                {t('pushSuccessTitle')}
              </Text>
              <Text size="2" style={{ color: 'var(--gray-11)' }}>
                {t('pushSuccessSubtitle')}
              </Text>
            </Flex>
          ) : (
            <>
              {preview && (
                <Box
                  style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-2)',
                    background: 'var(--gray-a2)',
                  }}
                >
                  <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', marginBottom: 'var(--space-2)', display: 'block' }}>
                    {t('pushSummaryTitle')}
                  </Text>
                  <Flex direction="column" gap="2">
                    <Flex justify="between">
                      <Text size="2" style={{ color: 'var(--gray-10)' }}>Provider:</Text>
                      <Text size="2" style={{ color: 'var(--text-primary)' }}>{preview.provider}</Text>
                    </Flex>
                    <Flex justify="between">
                      <Text size="2" style={{ color: 'var(--gray-10)' }}>{t('scoreLabel')}:</Text>
                      <Text size="2" style={{ color: 'var(--text-primary)' }}>{preview.opportunityData.score}</Text>
                    </Flex>
                    <Flex justify="between" wrap="wrap">
                      <Text size="2" style={{ color: 'var(--gray-10)' }}>{t('tenderSummaryTitle')}:</Text>
                      <Text size="2" style={{ color: 'var(--text-primary)', maxWidth: 280 }}>
                        {preview.opportunityData.summary || t('pushSummaryFallback')}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              )}

              {error && (
                <Flex align="center" gap="2" style={{ marginTop: 'var(--space-3)' }}>
                  <AlertCircle style={{ width: 16, height: 16, color: 'var(--red-11)' }} />
                  <Text size="2" style={{ color: 'var(--red-11)' }}>
                    {error}
                  </Text>
                </Flex>
              )}

              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray" data-testid="push-cancel-button">
                    {t('cancelPush')}
                  </Button>
                </Dialog.Close>
                <Button onClick={handleConfirmPush} disabled={state === 'pushing'} data-testid="push-confirm-button">
                  {state === 'pushing' ? (
                    <>
                      <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                      {t('pushing')}
                    </>
                  ) : (
                    <>
                      <Send style={{ width: 16, height: 16 }} />
                      {t('confirmPush')}
                    </>
                  )}
                </Button>
              </Flex>
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}
