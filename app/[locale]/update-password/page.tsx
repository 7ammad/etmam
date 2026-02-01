'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { useI18n, useTranslations } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Box, Flex, Heading, Text, Button, TextField, Card } from '@radix-ui/themes'
import { Crown, Lock, Loader2, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { updatePasswordAction } from '@/actions/auth'

export default function UpdatePasswordPage() {
  const { locale } = useI18n()
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const isRTL = locale === 'ar'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const formData = new FormData(event.currentTarget)
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setErrorMessage(tAuth('updatePasswordMismatch'))
      setStatus('error')
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage(tAuth('updatePasswordTooShort'))
      setStatus('error')
      return
    }

    const result = await updatePasswordAction(newPassword)

    if (result.success) {
      setStatus('success')
      setTimeout(() => {
        router.push(`/${locale}/login?message=password_updated`)
        router.refresh()
      }, 1500)
    } else {
      setErrorMessage(result.error)
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
            {tAuth('updatePasswordTitle')}
          </Heading>
          <Text size="2" color="gray">
            {tAuth('updatePasswordSubtitle')}
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
                <Text size="2" weight="medium">{tAuth('updatePasswordSuccess')}</Text>
                <Text size="1" color="gray">{tAuth('updatePasswordRedirect')}</Text>
              </Box>
            </Flex>
          )}

          {status === 'error' && errorMessage && (
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
              <Text size="2">{errorMessage}</Text>
            </Flex>
          )}

          {status !== 'success' && (
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="4">
                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    {tAuth('newPassword')}
                  </Text>
                  <TextField.Root
                    name="newPassword"
                    size="3"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={tAuth('newPasswordPlaceholder')}
                    style={{ width: '100%' }}
                  >
                    <TextField.Slot>
                      <Lock size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                </Box>

                <Box>
                  <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                    {tAuth('confirmPassword')}
                  </Text>
                  <TextField.Root
                    name="confirmPassword"
                    size="3"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={tAuth('confirmPasswordPlaceholder')}
                    style={{ width: '100%' }}
                  >
                    <TextField.Slot>
                      <Lock size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                </Box>

                <Button size="3" variant="solid" color="iris" style={{ width: '100%' }} disabled={status === 'loading'}>
                  {status === 'loading' ? (
                    <Flex align="center" gap="2">
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <Text>{tAuth('updating')}</Text>
                    </Flex>
                  ) : (
                    <Text>{tAuth('updatePassword')}</Text>
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
          )}
        </Card>

        <Flex justify="center" align="center" gap="4" mb="4">
          <ThemeToggle />
        </Flex>

        <Text size="1" color="gray" align="center" style={{ display: 'block' }}>
          {tAuth('copyright')}
        </Text>
      </Box>
    </Box>
  )
}
