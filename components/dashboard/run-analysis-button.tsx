'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import { runEvaluationAction, rerunEvaluationAction } from '@/actions/evaluation'
import { Button, Text, Flex } from '@radix-ui/themes'
import { Sparkles } from 'lucide-react'

type Props = {
  tenderId: string
  hasEvaluation: boolean
}

export function RunAnalysisButton({ tenderId, hasEvaluation }: Props) {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const tEval = useTranslations('evaluation')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = hasEvaluation
        ? await rerunEvaluationAction(tenderId)
        : await runEvaluationAction(tenderId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : tEval('evaluationError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex direction="column" gap="2">
      <Button
        size="2"
        onClick={handleRun}
        disabled={loading}
        aria-label={hasEvaluation ? t('rerunAnalysis') : t('runAnalysis')}
        data-testid="run-analysis-button"
      >
        {loading ? (
          t('evaluating')
        ) : hasEvaluation ? (
          t('rerunAnalysis')
        ) : (
          <>
            <Sparkles size={16} style={{ marginInlineEnd: 6 }} />
            {t('runAnalysis')}
          </>
        )}
      </Button>
      {error != null && (
        <Text size="1" style={{ color: 'var(--red-11)' }}>
          {error}
        </Text>
      )}
    </Flex>
  )
}
