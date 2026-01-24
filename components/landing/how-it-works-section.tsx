'use client'

import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Section, Container, Grid, Flex, Heading, Text, Box, Card, Badge } from '@radix-ui/themes'
import { Upload, Brain, Send, ChevronLeft, ChevronRight, Workflow } from 'lucide-react'

export function HowItWorksSection() {
  const t = useTranslations('landing')
  const { locale } = useI18n()
  const isRTL = locale === 'ar'

  const steps = [
    {
      number: '01',
      icon: Upload,
      title: t('step1Title'),
      description: t('step1Description'),
      color: 'teal',
    },
    {
      number: '02',
      icon: Brain,
      title: t('step2Title'),
      description: t('step2Description'),
      color: 'iris',
    },
    {
      number: '03',
      icon: Send,
      title: t('step3Title'),
      description: t('step3Description'),
      color: 'blue',
    },
  ]

  return (
    <Section size="3" id="how-it-works">
      <Container size="3">
        <Flex direction="column" align="center" gap="5" mb="9" style={{ textAlign: 'center' }}>
          <Box 
            style={{ 
              backgroundColor: 'var(--teal-3)', 
              color: 'var(--teal-11)', 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--font-size-2)',
              fontWeight: '500'
            }}
          >
            <Workflow size={14} />
            {t('howItWorksSubtitle')}
          </Box>
          <Heading size="8" weight="bold" style={{ color: 'var(--gray-12)' }}>
            {t('howItWorksTitle')}
          </Heading>
        </Flex>

        <Grid columns={{ initial: '1', md: '3' }} gap="6" style={{ position: 'relative' }}>
          {/* Connector Line (Desktop) */}
          <Box 
            display={{ initial: 'none', md: 'block' }}
            style={{ 
              position: 'absolute', 
              top: '40px', 
              left: '10%', 
              right: '10%', 
              height: '2px', 
              background: 'linear-gradient(to right, var(--teal-6), var(--iris-6), var(--blue-6))',
              zIndex: 0,
              opacity: 0.3
            }} 
          />

          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1
            
            return (
              <Flex key={step.number} direction="column" align="center" style={{ position: 'relative', zIndex: 1 }}>
                <Card 
                  size="3" 
                  variant="surface"
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    backgroundColor: 'var(--color-panel-translucent)',
                    backdropFilter: 'blur(10px)',
                    textAlign: 'center',
                    borderTop: `4px solid var(--${step.color}-9)`
                  }}
                >
                  <Flex direction="column" align="center" gap="4">
                    <Flex 
                      align="center" 
                      justify="center" 
                      width="64px" 
                      height="64px" 
                      style={{ 
                        borderRadius: 'var(--radius-full)', 
                        backgroundColor: `var(--${step.color}-3)`,
                        color: `var(--${step.color}-11)`,
                        boxShadow: `0 0 0 4px var(--color-page-background)`
                      }}
                    >
                      <Icon size={32} />
                    </Flex>
                    
                    <Badge size="1" color={step.color as any} variant="soft" radius="full">
                      Step {step.number}
                    </Badge>

                    <Box>
                      <Heading size="4" weight="bold" mb="2">
                        {step.title}
                      </Heading>
                      <Text size="3" color="gray" style={{ lineHeight: 1.6 }}>
                        {step.description}
                      </Text>
                    </Box>
                  </Flex>
                </Card>

                {/* Mobile Arrow */}
                {!isLast && (
                  <Box display={{ md: 'none' }} my="4">
                    <ChevronRight size={24} color="var(--gray-8)" style={{ transform: 'rotate(90deg)' }} />
                  </Box>
                )}
              </Flex>
            )
          })}
        </Grid>
      </Container>
    </Section>
  )
}
