'use client'

import { Box, Flex, Heading, Text, Card, Button } from '@radix-ui/themes'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'

type EvaluationProgressModalProps = {
  onClose: () => void
}

export function EvaluationProgressModal({ onClose }: EvaluationProgressModalProps) {
  const tDashboard = useTranslations('dashboard')
  const { locale } = useI18n()
  const isRTL = locale === 'ar'

  const progress = 58
  const currentIndex = 7
  const totalCount = 12

  const logItems = [
    { status: 'done', entity: tDashboard('logItem1Entity'), title: tDashboard('logItem1Title'), score: 85 },
    { status: 'done', entity: tDashboard('logItem2Entity'), title: tDashboard('logItem2Title'), score: 72 },
    { status: 'done', entity: tDashboard('logItem3Entity'), title: tDashboard('logItem3Title'), score: 68 },
    { status: 'done', entity: tDashboard('logItem4Entity'), title: tDashboard('logItem4Title'), score: 91 },
    { status: 'done', entity: tDashboard('logItem5Entity'), title: tDashboard('logItem5Title'), score: 79 },
    { status: 'warning', entity: tDashboard('logItem6Entity'), title: tDashboard('logItem6Title'), note: tDashboard('logItem6Note') },
    { status: 'running', entity: tDashboard('logItem7Entity'), title: tDashboard('logItem7Title') },
  ] as const

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
      <Card className="glass-card" style={{ width: '100%', maxWidth: '640px' }}>
        <Flex direction="column">
          <Flex
            align="center"
            justify="between"
            style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-a3)' }}
          >
            <Heading size="5">{tDashboard('evaluationProgressTitle')}</Heading>
          </Flex>

          <Flex direction="column" gap="4" style={{ padding: '24px' }}>
            <Flex direction="column" gap="2">
              <Flex align="center" justify="between">
                <Text size="2" weight="medium">{tDashboard('progressLabel')}</Text>
                <Text size="2" color="gray">
                  {currentIndex} / {totalCount}
                </Text>
              </Flex>
              <Box
                style={{
                  width: '100%',
                  height: '10px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--gray-a3)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: 'var(--iris-9)',
                  }}
                />
              </Box>
            </Flex>

            <Card className="glass-card" style={{ padding: '16px' }}>
              <Flex align="center" gap="2" mb="2">
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <Text size="2">{tDashboard('evaluatingNow')}</Text>
              </Flex>
              <Text size="2" weight="medium">
                {tDashboard('currentEntity')}
              </Text>
              <Text size="2" color="gray">
                {tDashboard('currentTitle')}
              </Text>
            </Card>

            <Card className="glass-card" style={{ padding: '16px', maxHeight: '220px', overflowY: 'auto' }}>
              <Heading size="3" mb="3">{tDashboard('logTitle')}</Heading>
              <Flex direction="column" gap="3">
                {logItems.map((item, index) => (
                  <Flex key={`${item.entity}-${index}`} align="start" gap="2">
                    {item.status === 'warning' ? (
                      <AlertTriangle size={14} style={{ color: 'var(--yellow-11)', marginTop: 2 }} />
                    ) : item.status === 'running' ? (
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginTop: 2 }} />
                    ) : (
                      <CheckCircle2 size={14} style={{ color: 'var(--green-11)', marginTop: 2 }} />
                    )}
                    <Box>
                      <Text size="2" weight="medium">
                        {item.entity} - {item.title}
                      </Text>
                      {item.status === 'warning' ? (
                        <Text size="1" color="gray">{item.note}</Text>
                      ) : item.status === 'done' ? (
                        <Text size="1" color="gray">
                          {tDashboard('completedWithScore', { score: item.score.toString() })}
                        </Text>
                      ) : (
                        <Text size="1" color="gray">{tDashboard('inProgress')}</Text>
                      )}
                    </Box>
                  </Flex>
                ))}
              </Flex>
            </Card>

            <Card className="glass-card" style={{ padding: '16px' }}>
              <Flex align="start" gap="2">
                <AlertTriangle size={16} style={{ color: 'var(--yellow-11)', marginTop: 2 }} />
                <Box>
                  <Text size="2" weight="medium">{tDashboard('warningsTitle')}</Text>
                  <Text size="1" color="gray">{tDashboard('warningsText')}</Text>
                </Box>
              </Flex>
            </Card>
          </Flex>

          <Flex
            justify={isRTL ? 'start' : 'end'}
            style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-a3)' }}
          >
            <Button variant="outline" color="gray" onClick={onClose}>
              {tDashboard('cancelEvaluation')}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Box>
  )
}
