'use client'

import { FileText, CheckCircle, XCircle, DollarSign, Clock, Send } from 'lucide-react'
import { Card, Grid, Flex, Text, Box } from '@radix-ui/themes'
import { useTranslations } from '@/components/providers/i18n-provider'

interface StatsCardsProps {
  stats: {
    totalTenders: number
    qualified: number
    conditional?: number
    excluded: number
    totalValue: number
    pendingEvaluation: number
    pushedToCRM: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('stats')

  const cards = [
    {
      label: t('totalTenders'),
      value: stats.totalTenders,
      icon: FileText,
      color: 'blue',
    },
    {
      label: t('qualified'),
      value: stats.qualified,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: t('excluded'),
      value: stats.excluded,
      icon: XCircle,
      color: 'red',
    },
    {
      label: t('totalValue'),
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: 'iris', // Primary
      isValue: true,
    },
    {
      label: t('pendingEvaluation'),
      value: stats.pendingEvaluation,
      icon: Clock,
      color: 'yellow',
    },
    {
      label: t('pushedToCRM'),
      value: stats.pushedToCRM,
      icon: Send,
      color: 'purple',
    },
  ]

  return (
    <Grid columns={{ initial: '1', sm: '2', lg: '3', xl: '6' }} gap="4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} size="2">
            <Flex align="center" gap="3">
              <Flex 
                align="center" 
                justify="center" 
                width="40px" 
                height="40px" 
                style={{ 
                  borderRadius: 'var(--radius-3)', 
                  backgroundColor: `var(--${card.color}-3)`,
                  color: `var(--${card.color}-11)`
                }}
              >
                <Icon size={20} />
              </Flex>
              <Box>
                <Text as="p" size="2" color="gray" truncate>
                  {card.label}
                </Text>
                <Text as="p" size="5" weight="bold">
                  {card.value}
                </Text>
              </Box>
            </Flex>
          </Card>
        )
      })}
    </Grid>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    notation: value >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(value)
}
