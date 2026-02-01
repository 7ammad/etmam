'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Flex, Box, Text, Button } from '@radix-ui/themes'
import { AlertCircle } from 'lucide-react'

export function ErrorState() {
  const router = useRouter()
  const t = useTranslations('dashboard')

  return (
    <Flex direction="column" align="center" gap="4" py="8" style={{ textAlign: 'center' }}>
      <Box
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-3)',
          background: 'var(--color-error-50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertCircle size={32} style={{ color: 'var(--color-error-600)' }} />
      </Box>
      <Text size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
        {t('loadFailed')}
      </Text>
      <Button size="3" variant="soft" color="red" onClick={() => router.refresh()}>
        {t('retry')}
      </Button>
    </Flex>
  )
}
