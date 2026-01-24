'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { useI18n, useTranslations } from '@/components/providers/i18n-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Box, Flex, Heading, Text, Button, TextField, Card } from '@radix-ui/themes'
import { Crown, Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { locale } = useI18n()
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const otherLocale = locale === 'ar' ? 'en' : 'ar'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simulate login
    setTimeout(() => {
      router.push(`/${locale}/dashboard`)
    }, 1500)
  }

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Box style={{ width: '100%', maxWidth: '440px' }}>
        
        {/* Logo & Title */}
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
            {tAuth('platformTitle')}
          </Heading>
          <Text size="2" color="gray">
            {tAuth('loginSubtitle')}
          </Text>
        </Flex>

        {/* Login Card */}
        <Card size="4" className="glass-card" style={{ marginBottom: '1.5rem' }}>
          {error && (
            <Flex 
              p="4" 
              mb="4"
              style={{ 
                backgroundColor: 'var(--red-3)', 
                border: '1px solid var(--red-6)',
                borderRadius: 'var(--radius-2)',
              }}
            >
              <Text size="2" color="red">{error}</Text>
            </Flex>
          )}

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              {/* Email */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  {tAuth('email')}
                </Text>
                <TextField.Root
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

              {/* Password */}
              <Box>
                <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                  {tAuth('password')}
                </Text>
                <TextField.Root
                  size="3"
                  type="password"
                  required
                  minLength={8}
                  placeholder={tAuth('passwordPlaceholder')}
                  style={{ width: '100%' }}
                >
                  <TextField.Slot>
                    <Lock size={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Box>

              {/* Submit Button */}
              <Button 
                size="3" 
                variant="solid" 
                color="iris" 
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? (
                  <Flex align="center" gap="2">
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <Text>{tAuth('signingIn')}</Text>
                  </Flex>
                ) : (
                  <Text>{tAuth('login')}</Text>
                )}
              </Button>

              {/* Forgot Password */}
              <Flex justify="center">
                <NextLink href={`/${locale}/forgot-password`} style={{ textDecoration: 'none' }}>
                  <Text size="2" color="gray" highContrast style={{ cursor: 'pointer' }}>
                    {tAuth('forgotPassword')}
                  </Text>
                </NextLink>
              </Flex>
            </Flex>
          </form>
        </Card>

        {/* Language & Theme Toggles */}
        <Flex justify="center" align="center" gap="4" mb="4">
          <Button asChild variant="ghost" size="2" color="gray">
            <NextLink href={`/${otherLocale}`}>
              {tAuth('switchLanguage')}
            </NextLink>
          </Button>
          
          <Box style={{ width: '1px', height: '16px', backgroundColor: 'var(--gray-a5)' }} />
          
          <ThemeToggle />
        </Flex>

        {/* Footer */}
        <Text size="1" color="gray" align="center" style={{ display: 'block' }}>
          {tAuth('copyright')}
        </Text>
      </Box>
    </Box>
  )
}
