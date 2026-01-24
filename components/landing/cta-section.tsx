'use client'

import NextLink from 'next/link'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Button, Section, Container, Flex, Heading, Text, Box } from '@radix-ui/themes'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

export function CTASection() {
  const t = useTranslations('landing')
  const { locale } = useI18n()
  const isRTL = locale === 'ar'

  return (
    <Section size="4" style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--iris-9)' }}>
      {/* Background Pattern */}
      <Box 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          backgroundImage: 'radial-gradient(circle at top right, var(--iris-8) 0%, transparent 40%), radial-gradient(circle at bottom left, var(--indigo-8) 0%, transparent 40%)',
          opacity: 0.5
        }} 
      />
      
      <Container size="3" style={{ position: 'relative', zIndex: 1 }}>
        <Flex direction="column" align="center" gap="6" style={{ textAlign: 'center' }}>
          {/* Badge */}
          <Box 
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(10px)',
              padding: '8px 16px', 
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--font-size-2)',
              fontWeight: '500'
            }}
          >
            <Sparkles size={16} />
            {locale === 'ar' ? 'ابدأ مجاناً اليوم' : 'Start Free Today'}
          </Box>
          
          <Heading size="9" weight="bold" style={{ color: 'white', lineHeight: 1.1 }}>
            {t('ctaTitle')}
          </Heading>
          
          <Text size="5" style={{ color: 'var(--iris-3)', maxWidth: '600px', lineHeight: 1.6 }}>
            {t('ctaDescription')}
          </Text>
          
          <Button 
            asChild
            size="4" 
            variant="solid" 
            style={{ 
              backgroundColor: 'white', 
              color: 'var(--iris-9)', 
              fontWeight: 'bold',
              marginTop: '16px'
            }}
          >
            <NextLink href={`/${locale}/dashboard`}>
              {t('ctaButton')}
              {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
            </NextLink>
          </Button>
          
          {/* Trust indicators */}
          <Flex gap="5" wrap="wrap" justify="center" mt="6" style={{ color: 'var(--iris-4)', fontSize: 'var(--font-size-2)' }}>
            <Text>{locale === 'ar' ? 'بدون بطاقة ائتمان' : 'No credit card required'}</Text>
            <Text>•</Text>
            <Text>{locale === 'ar' ? 'إعداد سريع' : 'Quick setup'}</Text>
            <Text>•</Text>
            <Text>{locale === 'ar' ? 'دعم فني مجاني' : 'Free support'}</Text>
          </Flex>
        </Flex>
      </Container>
    </Section>
  )
}
