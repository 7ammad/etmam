'use client'

import { useState } from 'react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { testCRMConnection, saveCRMConnection, getOdooStatus } from '@/actions/crm'
import { Box, Card, Flex, Text, Button } from '@radix-ui/themes'
import { Loader2 } from 'lucide-react'

type OdooStatus = {
  configured: boolean
  pushEnabled: boolean
  message: string
}

export function CRMOdooCard({ initialStatus }: { initialStatus: OdooStatus | null }) {
  const t = useTranslations('crm')
  const tCommon = useTranslations('common')
  const [status, setStatus] = useState<OdooStatus | null>(initialStatus)
  const [testing, setTesting] = useState(false)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const refreshStatus = async () => {
    const res = await getOdooStatus()
    if (res.success && res.data) setStatus(res.data)
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)
    const result = await testCRMConnection('odoo', { use_env: true })
    setTesting(false)
    if (result.success) {
      setMessage({ type: 'success', text: t('connectionSuccess') })
      refreshStatus()
    } else {
      setMessage({ type: 'error', text: result.error ?? t('connectionFailed') })
    }
  }

  const handleAddOdoo = async () => {
    setAdding(true)
    setMessage(null)
    const result = await saveCRMConnection('odoo', { use_env: true }, 'Odoo (env)')
    setAdding(false)
    if (result.success) {
      setMessage({ type: 'success', text: 'Odoo connection added. Credentials will be read from environment.' })
      refreshStatus()
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Failed to add' })
    }
  }

  return (
    <Card size="3" style={{ maxWidth: 520 }}>
      <Flex direction="column" gap="4">
        <Text size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('odoo')}
        </Text>
        <Text size="2" style={{ color: 'var(--gray-11)' }}>
          {t('odooFromEnv')}
        </Text>
        {status && (
          <Box>
            <Text size="2" style={{ color: 'var(--gray-11)' }}>
              {status.configured ? t('odooConfigured') : t('odooNotConfigured')}
              {status.pushEnabled && ` ${t('odooPushEnabled')}`}
            </Text>
            <Text size="1" style={{ color: 'var(--gray-10)', marginTop: 'var(--space-1)', display: 'block' }}>
              {status.message}
            </Text>
          </Box>
        )}
        {message && (
          <Text size="2" style={{ color: message.type === 'success' ? 'var(--green-11)' : 'var(--red-11)' }}>
            {message.text}
          </Text>
        )}
        <Flex gap="3" wrap="wrap">
          <Button
            type="button"
            disabled={!status?.configured || testing}
            onClick={handleTest}
          >
            {testing ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                {t('testingConnection')}
              </>
            ) : (
              t('testConnection')
            )}
          </Button>
          <Button
            type="button"
            variant="soft"
            disabled={adding}
            onClick={handleAddOdoo}
          >
            {adding ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                {tCommon('loading')}
              </>
            ) : (
              t('addOdooFromEnv')
            )}
          </Button>
        </Flex>
      </Flex>
    </Card>
  )
}
