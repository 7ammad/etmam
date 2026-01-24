'use client'

import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Shield, Clock, Target, DollarSign } from 'lucide-react'
import { Card, Flex, Text, Heading, Badge, Box, Grid } from '@radix-ui/themes'
import { useTranslations } from '@/components/providers/i18n-provider'
import { RECOMMENDATION_COLORS, type Recommendation } from '@/types/evaluation'

interface EvaluationDisplayProps {
  evaluation: {
    score: number
    recommendation: Recommendation
    summary: string
    strengths: string[]
    risks: string[]
    missing_requirements: string[]
    action_items: string[]
    breakdown: {
      budget_fit: number
      technical_fit: number
      timeline_fit: number
      strategic_fit: number
      risk_score: number
    }
    model_used: string
    created_at: string
  }
}

export function EvaluationDisplay({ evaluation }: EvaluationDisplayProps) {
  const t = useTranslations('evaluation')

  const breakdownItems = [
    { key: 'budgetFit', value: evaluation.breakdown.budget_fit, icon: DollarSign, max: 100 },
    { key: 'technicalFit', value: evaluation.breakdown.technical_fit, icon: Target, max: 100 },
    { key: 'timelineFit', value: evaluation.breakdown.timeline_fit, icon: Clock, max: 100 },
    { key: 'strategicFit', value: evaluation.breakdown.strategic_fit, icon: TrendingUp, max: 100 },
    { key: 'riskScore', value: evaluation.breakdown.risk_score, icon: Shield, max: 100 },
  ]

  // Map recommendation to Radix color
  const recommendationColors: Record<Recommendation, { color: 'green' | 'yellow' | 'red'; icon: typeof CheckCircle }> = {
    qualified: { color: 'green', icon: CheckCircle },
    conditional: { color: 'yellow', icon: AlertTriangle },
    excluded: { color: 'red', icon: XCircle },
  }

  const recConfig = recommendationColors[evaluation.recommendation]
  const RecIcon = recConfig.icon

  return (
    <Flex direction="column" gap="5">
      {/* Score and Recommendation Header */}
      <Card className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <Flex direction={{ initial: 'column', sm: 'row' }} align="center" justify="between" gap="6">
          {/* Score Circle */}
          <Flex direction="column" align="center">
            <Box position="relative">
              <svg style={{ width: '128px', height: '128px', transform: 'rotate(-90deg)' }}>
                <circle
                  stroke="var(--gray-a5)"
                  strokeWidth="8"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                />
                <circle
                  stroke={
                    evaluation.score >= 70
                      ? 'var(--green-9)'
                      : evaluation.score >= 40
                        ? 'var(--yellow-9)'
                        : 'var(--red-9)'
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                  strokeDasharray={`${(evaluation.score / 100) * 352} 352`}
                />
              </svg>
              <Flex
                direction="column"
                align="center"
                justify="center"
                position="absolute"
                inset="0"
              >
                <Text size="8" weight="bold">{evaluation.score}</Text>
                <Text size="2" color="gray">/100</Text>
              </Flex>
            </Box>
            <Text size="2" color="gray" mt="2">{t('score')}</Text>
          </Flex>

          {/* Recommendation Badge */}
          <Flex direction="column" align="center" gap="2">
            <Badge size="3" color={recConfig.color} variant="soft" style={{ padding: 'var(--space-2) var(--space-4)' }}>
              <Flex align="center" gap="2">
                <RecIcon style={{ width: '20px', height: '20px' }} />
                <Text size="4">{t(evaluation.recommendation)}</Text>
              </Flex>
            </Badge>
            <Text size="2" color="gray">{t('recommendation')}</Text>
          </Flex>
        </Flex>
      </Card>

      {/* Summary */}
      <Card className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <Flex direction="column" gap="3">
          <Heading size="4">{t('summary')}</Heading>
          <Text color="gray" style={{ lineHeight: 1.7 }}>{evaluation.summary}</Text>
        </Flex>
      </Card>

      {/* Score Breakdown */}
      <Card className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <Flex direction="column" gap="4">
          <Heading size="4">{t('breakdown')}</Heading>
          {breakdownItems.map((item) => (
            <Flex key={item.key} direction="column" gap="1">
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  <item.icon style={{ width: '16px', height: '16px', color: 'var(--gray-11)' }} />
                  <Text size="2">{t(item.key)}</Text>
                </Flex>
                <Text size="2" weight="medium">{item.value}/{item.max}</Text>
              </Flex>
              <Box
                style={{
                  height: '8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--gray-a4)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    height: '100%',
                    borderRadius: 'var(--radius-full)',
                    width: `${(item.value / item.max) * 100}%`,
                    backgroundColor:
                      item.value >= 70
                        ? 'var(--green-9)'
                        : item.value >= 40
                          ? 'var(--yellow-9)'
                          : 'var(--red-9)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
            </Flex>
          ))}
        </Flex>
      </Card>

      {/* Strengths and Risks */}
      <Grid columns={{ initial: '1', md: '2' }} gap="5">
        {/* Strengths */}
        <Card className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <CheckCircle style={{ width: '20px', height: '20px', color: 'var(--green-11)' }} />
              <Heading size="4" style={{ color: 'var(--green-11)' }}>{t('strengths')}</Heading>
            </Flex>
            {evaluation.strengths.length > 0 ? (
              <Box asChild style={{ paddingInlineStart: 'var(--space-4)' }}>
                <ul style={{ listStyleType: 'disc', margin: 0 }}>
                  {evaluation.strengths.map((strength, index) => (
                    <li key={index} style={{ marginBottom: 'var(--space-2)' }}>
                      <Text color="gray">{strength}</Text>
                    </li>
                  ))}
                </ul>
              </Box>
            ) : (
              <Text color="gray">-</Text>
            )}
          </Flex>
        </Card>

        {/* Risks */}
        <Card className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <AlertTriangle style={{ width: '20px', height: '20px', color: 'var(--red-11)' }} />
              <Heading size="4" style={{ color: 'var(--red-11)' }}>{t('risks')}</Heading>
            </Flex>
            {evaluation.risks.length > 0 ? (
              <Box asChild style={{ paddingInlineStart: 'var(--space-4)' }}>
                <ul style={{ listStyleType: 'disc', margin: 0 }}>
                  {evaluation.risks.map((risk, index) => (
                    <li key={index} style={{ marginBottom: 'var(--space-2)' }}>
                      <Text color="gray">{risk}</Text>
                    </li>
                  ))}
                </ul>
              </Box>
            ) : (
              <Text color="gray">-</Text>
            )}
          </Flex>
        </Card>
      </Grid>

      {/* Missing Requirements */}
      {evaluation.missing_requirements.length > 0 && (
        <Card className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <AlertTriangle style={{ width: '20px', height: '20px', color: 'var(--yellow-11)' }} />
              <Heading size="4" style={{ color: 'var(--yellow-11)' }}>{t('missingRequirements')}</Heading>
            </Flex>
            <Box asChild style={{ paddingInlineStart: 'var(--space-4)' }}>
              <ul style={{ listStyleType: 'disc', margin: 0 }}>
                {evaluation.missing_requirements.map((req, index) => (
                  <li key={index} style={{ marginBottom: 'var(--space-2)' }}>
                    <Text color="gray">{req}</Text>
                  </li>
                ))}
              </ul>
            </Box>
          </Flex>
        </Card>
      )}

      {/* Action Items */}
      {evaluation.action_items.length > 0 && (
        <Card className="glass-card" style={{ padding: 'var(--space-5)' }}>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <Target style={{ width: '20px', height: '20px', color: 'var(--iris-11)' }} />
              <Heading size="4" style={{ color: 'var(--iris-11)' }}>{t('actionItems')}</Heading>
            </Flex>
            <Box asChild style={{ paddingInlineStart: 'var(--space-4)' }}>
              <ol style={{ listStyleType: 'decimal', margin: 0 }}>
                {evaluation.action_items.map((item, index) => (
                  <li key={index} style={{ marginBottom: 'var(--space-2)' }}>
                    <Text color="gray">{item}</Text>
                  </li>
                ))}
              </ol>
            </Box>
          </Flex>
        </Card>
      )}
    </Flex>
  )
}
