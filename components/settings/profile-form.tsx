'use client'

import { useState } from 'react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { updateProfileAction } from '@/actions/profile'
import type { Profile } from '@/lib/queries/profile'
import { Box, Flex, Text, TextField, Button, Card } from '@radix-ui/themes'
import { Loader2 } from 'lucide-react'

interface ProfileFormProps {
  profile: Profile | null
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [company, setCompany] = useState(profile?.company ?? '')
  const [role, setRole] = useState(profile?.role ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const result = await updateProfileAction({
      display_name: displayName.trim() || null,
      company: company.trim() || null,
      role: role.trim() || null,
    })
    setLoading(false)
    if (result.success) {
      setMessage({ type: 'success', text: t('changesSaved') })
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  return (
    <Card size="3" style={{ maxWidth: 480 }}>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="4">
          <Text size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
            {t('profileTitle')}
          </Text>
          <Text size="2" style={{ color: 'var(--gray-11)' }}>
            {t('profileDescription')}
          </Text>
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
              {t('company')}
            </Text>
            <TextField.Root
              aria-label={t('company')}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t('company')}
              autoComplete="organization"
            />
          </Box>
          <Box>
            <Text as="label" size="2" weight="medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
              {t('role')}
            </Text>
            <TextField.Root
              aria-label={t('role')}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={t('role')}
              autoComplete="organization-title"
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
    </Card>
  )
}
