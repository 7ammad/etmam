'use client'

import { useTranslations } from '@/components/providers/i18n-provider'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Container, Flex, Box, Text, Button } from '@radix-ui/themes'
import { FileQuestion } from 'lucide-react'

export default function TenderNotFound() {
  const t = useTranslations('dashboard')
  const tCrm = useTranslations('crm')
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'

  return (
    <Container size="4" py="8">
      <Flex direction="column" align="center" gap="4" style={{ textAlign: 'center' }}>
        <Box
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-3)',
            background: 'var(--gray-a2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileQuestion size={32} style={{ color: 'var(--gray-9)' }} />
        </Box>
        <Text size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('tenderNotFound')}
        </Text>
        <Button size="3" variant="soft" asChild>
          <NextLink href={`/${locale}/dashboard`}>{tCrm('backToDashboard')}</NextLink>
        </Button>
      </Flex>
    </Container>
  )
}
