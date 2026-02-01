'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useI18n, useTranslations } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Box, Flex, Heading, Text, Button, TextField, Card } from '@radix-ui/themes'
import { Crown, Mail, Loader2, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { resetPasswordAction } from '@/actions/auth'

export default function ForgotPasswordPage() {
  const { locale } = useI18n()
  const tAuth = useTranslations('auth')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const otherLocale = locale === 'ar' ? 'en' : 'ar'
  const isRTL = locale === 'ar'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string

    const result = await resetPasswordAction(email)

    if (result.success) {
      setStatus('success')
    } else {
      setStatus('error')
    }
  }

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Box style={{ width: '100%', maxWidth: '440px' }}>
        <Flex direction="column" align="center" mb="8" style={{ textAlign: 'center' }}>
          <Flex
            align="center"
            justify="center"
            width="64px"
            height="64px"
            mb="4"
            style={{
              borderRadius: 'var(--radius-3)',
              background: 'linear-gradient(135deg, var(--iris-9), var(--iris-11))',
              boxShadow: '0 8px 24px var(--iris-a5)',
            }}
          >
            <Crown size={32} color="white" />
          </Flex>
          <Heading size="7" weight="bold" mb="2">
            {tAuth('resetTitle')}
          </Heading>
          <Text size="2" color="gray">
            {tAuth('resetSubtitle')}
          </Text>
        </Flex>

        <Card size="4" className="glass-card" style={{ marginBottom: '1.5rem' }}>
          {status === 'success' && (
            <Flex
              p="4"
              mb="4"
              gap="3"
              style={{
                backgroundColor: 'var(--green-2)',
                border: '1px solid var(--green-6)',
                borderRadius: 'var(--radius-2)',
              }}
            >
              <CheckCircle2 size={18} style={{ color: 'var(--green-11)', marginTop: '2px' }} />
              <Box>
                <Text size="2" weight="medium">{tAuth('resetSuccessTitle')}</Text>
                <Text size="1" color="gray">{tAuth('resetSuccessMessage')}</Text>
              </Box>
            </Flex>
          )}

          {status === 'error' && (
            <Flex
              p="4"
              mb="4"
              gap="3"
              style={{
                backgroundColor: 'var(--red-2)',
                border: '1px solid var(--red-6)',
                borderRadius: 'var(--radius-2)',
              }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--red-11)', marginTop: '2px' }} />
              <Text size="2">{tAuth('resetError')}</Text>
            </Flex>
          )}

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  {tAuth('email')}
                </Text>
                <TextField.Root
                  name="email"
                  size="3"
                  type="email"
                  required
                  placeholder={tAuth('emailPlaceholder')}
                  style={{ width: '100%' }}
                >
                  <TextField.Slot>
                    <Mail size={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Box>

              <Button size="3" variant="solid" color="iris" style={{ width: '100%' }} disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <Flex align="center" gap="2">
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <Text>{tAuth('sendingReset')}</Text>
                  </Flex>
                ) : (
                  <Text>{tAuth('sendResetLink')}</Text>
                )}
              </Button>

              <Flex justify="center">
                <NextLink href={`/${locale}/login`} style={{ textDecoration: 'none' }}>
                  <Flex align="center" gap="2">
                    {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                    <Text size="2" color="gray" highContrast>
                      {tAuth('backToLogin')}
                    </Text>
                  </Flex>
                </NextLink>
              </Flex>
            </Flex>
          </form>
        </Card>

        <Flex justify="center" align="center" gap="4" mb="4">
          <Button asChild variant="ghost" size="2" color="gray">
            <NextLink href={`/${otherLocale}`}>
              {tAuth('switchLanguage')}
            </NextLink>
          </Button>

          <Box style={{ width: '1px', height: '16px', backgroundColor: 'var(--gray-a5)' }} />

          <ThemeToggle />
        </Flex>

        <Text size="1" color="gray" align="center" style={{ display: 'block' }}>
          {tAuth('copyright')}
        </Text>
      </Box>
    </Box>
  )
}
