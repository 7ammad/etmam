'use client'

import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Section, Container, Grid, Flex, Heading, Text, Box, Card } from '@radix-ui/themes'
import { Building2, Brain, Shield, TrendingUp } from 'lucide-react'

export function BriefSection() {
  const t = useTranslations('landing')
  const { locale } = useI18n()

  const highlights = [
    {
      icon: Building2,
      title: locale === 'ar' ? 'ربط مباشر' : 'Direct Integration',
      description: locale === 'ar' ? 'ربط سلس مع منصة اعتماد وأنظمة CRM' : 'Seamless connection with Etimad and CRM systems',
    },
    {
      icon: Brain,
      title: locale === 'ar' ? 'ذكاء اصطناعي' : 'AI Powered',
      description: locale === 'ar' ? 'تحليل ذكي وتقييم دقيق للمنافسات' : 'Smart analysis and accurate tender evaluation',
    },
    {
      icon: Shield,
      title: locale === 'ar' ? 'آمن ومحمي' : 'Secure & Protected',
      description: locale === 'ar' ? 'حماية متقدمة لبياناتك' : 'Advanced protection for your data',
    },
    {
      icon: TrendingUp,
      title: locale === 'ar' ? 'زيادة الكفاءة' : 'Increased Efficiency',
      description: locale === 'ar' ? 'توفير الوقت والجهد' : 'Save time and effort',
    },
  ]

  return (
    <Section size="3" py="9">
      <Container size="3">
        <Flex direction="column" align="center" gap="6">
          {/* Title */}
          <Flex direction="column" align="center" gap="3" style={{ textAlign: 'center' }}>
            <Heading size="8" weight="bold">
              {t('briefTitle')}
            </Heading>
            <Text size="4" color="gray" style={{ maxWidth: '42rem' }}>
              {t('briefText')}
            </Text>
          </Flex>

          {/* Highlights grid */}
          <Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="5" width="100%">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon
              return (
                <Card key={index} className="glass-card" style={{ padding: 'var(--space-5)' }}>
                  <Flex direction="column" gap="3">
                    <Box
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-3)',
                        background: 'var(--iris-a3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon style={{ width: '24px', height: '24px', color: 'var(--iris-11)' }} />
                    </Box>
                    <Heading size="4" weight="medium">
                      {highlight.title}
                    </Heading>
                    <Text size="2" color="gray">
                      {highlight.description}
                    </Text>
                  </Flex>
                </Card>
              )
            })}
          </Grid>
        </Flex>
      </Container>
    </Section>
  )
}
