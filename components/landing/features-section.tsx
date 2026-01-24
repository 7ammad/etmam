'use client'

import { useTranslations } from '@/components/providers/i18n-provider'
import { Section, Container, Grid, Flex, Heading, Text, Box, Card } from '@radix-ui/themes'
import {
  Sparkles,
  Link2,
  Languages,
  Shield,
  BarChart3,
  Zap,
} from 'lucide-react'

export function FeaturesSection() {
  const t = useTranslations('landing')

  const features = [
    {
      icon: Sparkles,
      title: t('feature1Title'),
      description: t('feature1Description'),
      color: 'var(--amber-9)',
      bg: 'var(--amber-3)',
    },
    {
      icon: Link2,
      title: t('feature2Title'),
      description: t('feature2Description'),
      color: 'var(--indigo-9)',
      bg: 'var(--indigo-3)',
    },
    {
      icon: Languages,
      title: t('feature3Title'),
      description: t('feature3Description'),
      color: 'var(--teal-9)',
      bg: 'var(--teal-3)',
    },
    {
      icon: Shield,
      title: t('feature4Title'),
      description: t('feature4Description'),
      color: 'var(--ruby-9)',
      bg: 'var(--ruby-3)',
    },
    {
      icon: BarChart3,
      title: t('feature5Title'),
      description: t('feature5Description'),
      color: 'var(--plum-9)',
      bg: 'var(--plum-3)',
    },
    {
      icon: Zap,
      title: t('feature6Title'),
      description: t('feature6Description'),
      color: 'var(--cyan-9)',
      bg: 'var(--cyan-3)',
    },
  ]

  return (
    <Section size="3" id="features">
      <Container size="3">
        <Flex direction="column" align="center" gap="5" mb="9" style={{ textAlign: 'center' }}>
          <Box 
            style={{ 
              backgroundColor: 'var(--iris-3)', 
              color: 'var(--iris-11)', 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--font-size-2)',
              fontWeight: '500'
            }}
          >
            <Sparkles size={14} />
            {t('featuresSubtitle')}
          </Box>
          <Heading size="8" weight="bold" style={{ color: 'var(--gray-12)' }}>
            {t('featuresTitle')}
          </Heading>
        </Flex>

        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="5">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card 
                key={index} 
                size="3" 
                variant="surface"
                style={{ 
                  backgroundColor: 'var(--color-panel-translucent)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                className="hover:translate-y-[-4px] hover:shadow-lg"
              >
                <Flex direction="column" gap="4">
                  <Flex 
                    align="center" 
                    justify="center" 
                    width="48px" 
                    height="48px" 
                    style={{ 
                      borderRadius: 'var(--radius-3)', 
                      backgroundColor: feature.bg,
                      color: feature.color
                    }}
                  >
                    <Icon size={24} />
                  </Flex>
                  <Box>
                    <Heading size="4" weight="bold" mb="2">
                      {feature.title}
                    </Heading>
                    <Text size="3" color="gray" style={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Text>
                  </Box>
                </Flex>
              </Card>
            )
          })}
        </Grid>
      </Container>
    </Section>
  )
}
