'use client'

import NextLink from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import { Button, Section, Container, Flex, Heading, Text, Box, Badge } from '@radix-ui/themes'
import { ArrowLeft, ArrowRight, Crown } from 'lucide-react'

export function HeroSection() {
  const t = useTranslations('landing')
  const { locale } = useI18n()
  const isRTL = locale === 'ar'
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <Section 
      size="4" 
      style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        overflow: 'hidden',
        borderBottom: 'none',
        paddingBottom: 0,
        marginBottom: 0,
      }}
    >
      {/* Video Background */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            transform: 'translate(-50%, -50%)',
            objectFit: 'cover',
          }}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>

        {/* Dark gradient overlay for better text readability - same for both themes */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
            zIndex: 1,
          }}
        />
      </Box>

      {/* Content */}
      <Container size="3" style={{ position: 'relative', zIndex: 10 }}>
        <Flex direction="column" align="center" gap="6" style={{ textAlign: 'center' }}>
          
          {/* Premium badge */}
          <Badge 
            size="2" 
            variant="surface" 
            color="iris" 
            radius="full" 
            style={{ 
              padding: '8px 16px', 
              gap: '8px', 
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <Crown size={16} />
            <Text weight="medium" style={{ color: '#ffffff' }}>{t('tagline')}</Text>
          </Badge>

          {/* Main heading */}
          <Box>
            <Heading 
              as="h1" 
              size="9" 
              weight="bold" 
              style={{ 
                lineHeight: 1.1, 
                marginBottom: '16px',
                color: '#ffffff',
                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              }}
            >
              {t('heroTitle')}
            </Heading>
            <Heading 
              as="h2" 
              size="8" 
              weight="bold" 
              style={{ 
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              }}
            >
              {t('subtitle')}
            </Heading>
          </Box>

          {/* Description */}
          <Text 
            size="5" 
            style={{ 
              maxWidth: '700px', 
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 1px 10px rgba(0,0,0,0.5)',
            }}
          >
            {t('heroDescription')}
          </Text>

          {/* CTA Buttons */}
          <Flex gap="4" wrap="wrap" justify="center" mt="4">
            <Button asChild size="4" variant="solid" color="iris" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
              <NextLink href={`/${locale}/dashboard`}>
                {t('getStarted')}
                {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
              </NextLink>
            </Button>
            <Button 
              asChild 
              size="4" 
              variant="soft"
              color="gray" 
              style={{ 
                paddingLeft: '32px', 
                paddingRight: '32px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
              }}
            >
              <NextLink href={`/${locale}#how-it-works`}>
                {t('learnMore')}
              </NextLink>
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Section>
  )
}
