'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { useI18n, useTranslations } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Box, Flex, Heading, Text, Button, TextField } from '@radix-ui/themes'
import { Crown, Mail, Lock, Loader2, Globe } from 'lucide-react'
import { signupAction } from '@/actions/auth'

export default function SignupPage() {
  const { locale } = useI18n()
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const isRTL = locale === 'ar'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const otherLocale = locale === 'ar' ? 'en' : 'ar'
  const otherLocaleLabel = locale === 'ar' ? 'English' : 'العربية'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string).trim()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError(tAuth('updatePasswordMismatch'))
      setLoading(false)
      return
    }
    if (password.length < 8) {
      setError(tAuth('updatePasswordTooShort'))
      setLoading(false)
      return
    }

    const result = await signupAction(email, password)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/login`)
        router.refresh()
      }, 3000)
    } else {
      setError(result.error ?? tAuth('signUpError'))
      setLoading(false)
    }
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        backgroundColor: 'var(--surface-ground)',
      }}
    >
      {/* Background decoration */}
      <Box
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: '-20%',
            [isRTL ? 'left' : 'right']: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, var(--color-primary-200) 0%, transparent 70%)',
            opacity: 0.3,
            borderRadius: '50%',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: '-20%',
            [isRTL ? 'right' : 'left']: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, var(--color-primary-300) 0%, transparent 70%)',
            opacity: 0.2,
            borderRadius: '50%',
          }}
        />
      </Box>

      <Box
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo & Title */}
        <Flex
          direction="column"
          align="center"
          style={{
            textAlign: 'center',
            marginBottom: 'var(--space-8)',
          }}
        >
          <Flex
            align="center"
            justify="center"
            style={{
              width: '72px',
              height: '72px',
              marginBottom: 'var(--space-5)',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
              boxShadow: 'var(--shadow-primary), var(--shadow-lg)',
            }}
          >
            <Crown size={36} color="white" />
          </Flex>
          <Heading
            size="7"
            weight="bold"
            style={{
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            {tAuth('platformTitle')}
          </Heading>
          <Text size="2" style={{ color: 'var(--text-secondary)' }}>
            {tAuth('signUpSubtitle')}
          </Text>
        </Flex>

        {/* Signup Card */}
        <div
          className="glass-card animate-fade-in-up"
          style={{
            padding: 'var(--space-8)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {success && (
            <Box
              style={{
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-5)',
                backgroundColor: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-200)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Text size="2" style={{ color: 'var(--color-primary-800)' }}>
                {tAuth('signUpSuccess')}
              </Text>
            </Box>
          )}

          {error && !success && (
            <Box
              style={{
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-5)',
                backgroundColor: 'var(--color-error-50)',
                border: '1px solid var(--color-error-200)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Text size="2" style={{ color: 'var(--color-error-600)' }}>{error}</Text>
            </Box>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="5">
                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="email"
                    style={{
                      display: 'block',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {tAuth('email')}
                  </Text>
                  <TextField.Root
                    id="email"
                    name="email"
                    size="3"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={tAuth('emailPlaceholder')}
                    style={{ width: '100%' }}
                  >
                    <TextField.Slot>
                      <Mail size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </TextField.Slot>
                  </TextField.Root>
                </Box>

                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="password"
                    style={{
                      display: 'block',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {tAuth('password')}
                  </Text>
                  <TextField.Root
                    id="password"
                    name="password"
                    size="3"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    placeholder={tAuth('passwordPlaceholder')}
                    style={{ width: '100%' }}
                  >
                    <TextField.Slot>
                      <Lock size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </TextField.Slot>
                  </TextField.Root>
                </Box>

                <Box>
                  <Text
                    as="label"
                    size="2"
                    weight="medium"
                    htmlFor="confirmPassword"
                    style={{
                      display: 'block',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {tAuth('confirmPassword')}
                  </Text>
                  <TextField.Root
                    id="confirmPassword"
                    name="confirmPassword"
                    size="3"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={8}
                    placeholder={tAuth('confirmPasswordPlaceholderSignup')}
                    style={{ width: '100%' }}
                  >
                    <TextField.Slot>
                      <Lock size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </TextField.Slot>
                  </TextField.Root>
                </Box>

                <Button
                  size="3"
                  type="submit"
                  disabled={loading}
                  className="focus-ring"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-primary-500)',
                    color: 'var(--text-inverted)',
                    fontWeight: 'var(--font-semibold)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <Flex align="center" gap="2">
                      <Loader2 size={18} className="animate-spin" />
                      <span>{tAuth('signingUp')}</span>
                    </Flex>
                  ) : (
                    <span>{tAuth('signUp')}</span>
                  )}
                </Button>

                <Flex justify="center" align="center" gap="2" style={{ marginTop: 'var(--space-2)' }}>
                  <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                    {tAuth('haveAccount')}
                  </Text>
                  <NextLink
                    href={`/${locale}/login`}
                    className="focus-ring"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-primary-600)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {tAuth('login')}
                  </NextLink>
                </Flex>
              </Flex>
            </form>
          )}
        </div>

        {/* Language & Theme Toggles */}
        <Flex
          justify="center"
          align="center"
          gap="4"
          style={{ marginBottom: 'var(--space-6)' }}
        >
          <NextLink
            href={`/${otherLocale}/signup`}
            className="focus-ring"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              transition: 'var(--transition-colors)',
            }}
          >
            <Globe size={16} />
            {otherLocaleLabel}
          </NextLink>

          <Box
            style={{
              width: '1px',
              height: '20px',
              backgroundColor: 'var(--border-default)',
            }}
          />

          <ThemeToggle />
        </Flex>

        <Text
          size="1"
          align="center"
          style={{
            display: 'block',
            color: 'var(--text-tertiary)',
          }}
        >
          {tAuth('copyright')}
        </Text>
      </Box>
    </Box>
  )
}
