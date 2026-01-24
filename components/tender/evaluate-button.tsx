'use client'

import { useTransition } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { Button, Flex, Text } from '@radix-ui/themes'
import { useTranslations } from '@/components/providers/i18n-provider'
import { runEvaluationAction, rerunEvaluationAction } from '@/actions/evaluation'

interface EvaluateButtonProps {
  tenderId: string
  hasEvaluation?: boolean
  onEvaluationComplete?: (result: { score: number; recommendation: string }) => void
  onError?: (error: string) => void
  variant?: 'solid' | 'soft' | 'outline' | 'ghost'
  size?: '1' | '2' | '3' | '4'
  className?: string
}

export function EvaluateButton({
  tenderId,
  hasEvaluation = false,
  onEvaluationComplete,
  onError,
  variant = 'solid',
  size = '2',
  className,
}: EvaluateButtonProps) {
  const t = useTranslations('evaluation')
  const [isPending, startTransition] = useTransition()

  const handleEvaluate = () => {
    startTransition(async () => {
      const action = hasEvaluation ? rerunEvaluationAction : runEvaluationAction
      const result = await action(tenderId)

      if (result.success) {
        onEvaluationComplete?.(result.data)
      } else {
        onError?.(result.error)
      }
    })
  }

  return (
    <Button
      onClick={handleEvaluate}
      disabled={isPending}
      variant={variant}
      size={size}
      className={className}
    >
      <Flex align="center" gap="2">
        {isPending ? (
          <>
            <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
            <Text>{t('evaluating')}</Text>
          </>
        ) : hasEvaluation ? (
          <>
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            <Text>{t('runEvaluation')}</Text>
          </>
        ) : (
          <>
            <Sparkles style={{ width: '16px', height: '16px' }} />
            <Text>{t('runEvaluation')}</Text>
          </>
        )}
      </Flex>
    </Button>
  )
}
