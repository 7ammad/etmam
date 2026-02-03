'use client'

import { useState } from 'react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { updateProfileAction } from '@/actions/profile'
import type { Profile } from '@/lib/queries/profile'
import { Box, Flex, Text, TextField, Button } from '@radix-ui/themes'
import { Loader2 } from 'lucide-react'

interface ProfileSectionProps {
  profile: Profile | null
  userEmail: string | null
}

export function ProfileSection({ profile, userEmail }: ProfileSectionProps) {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const result = await updateProfileAction({
      display_name: displayName.trim() || null,
      company: profile?.company ?? null,
      role: profile?.role ?? null,
    })
    setLoading(false)
    if (result.success) {
      setMessage({ type: 'success', text: t('changesSaved') })
    } else {
      setMessage({ type: 'error', text: result.error ?? t('saveFailed') })
    }
  }

  return (
    <section aria-labelledby="profile-section-heading" style={{ maxWidth: 480 }}>
      <Flex direction="column" gap="4">
        <Text id="profile-section-heading" size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('profileTitle')}
        </Text>
        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
          {t('profileDescription')}
        </Text>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                {t('displayName')}
              </Text>
              <TextField.Root
                aria-label={t('displayName')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('displayName')}
                autoComplete="name"
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                {t('email')}
              </Text>
              <TextField.Root
                type="email"
                value={userEmail ?? ''}
                disabled
                readOnly
                aria-label={t('email')}
                style={{ opacity: 0.9 }}
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                {t('role')}
              </Text>
              <TextField.Root
                value={profile?.role ?? ''}
                disabled
                readOnly
                aria-label={t('role')}
                style={{ opacity: 0.9 }}
              />
            </Box>
            {message && (
              <Text
                size="2"
                style={{
                  color: message.type === 'success' ? 'var(--green-11)' : 'var(--red-11)',
                }}
              >
                {message.text}
              </Text>
            )}
            <Flex gap="3" align="center">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    {tCommon('loading')}
                  </>
                ) : (
                  t('saveChanges')
                )}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </section>
  )
}
