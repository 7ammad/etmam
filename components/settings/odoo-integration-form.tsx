'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { testCRMConnection, saveCRMConnection } from '@/actions/crm'
import { Box, Flex, Text, TextField, Button } from '@radix-ui/themes'
import { Loader2, Plug } from 'lucide-react'

type OdooFormData = {
  base_url: string
  db: string
  username: string
  password: string
}

interface OdooIntegrationFormProps {
  initial?: { base_url: string; db: string; username: string; hasPassword: boolean } | null
}

export function OdooIntegrationForm({ initial }: OdooIntegrationFormProps) {
  const t = useTranslations('crm')
  const tSettings = useTranslations('settings')
  const [form, setForm] = useState<OdooFormData>({
    base_url: initial?.base_url ?? '',
    db: initial?.db ?? '',
    username: initial?.username ?? '',
    password: '',
  })
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (initial) {
      queueMicrotask(() =>
        setForm((prev) => ({
          ...prev,
          base_url: initial.base_url,
          db: initial.db,
          username: initial.username,
        }))
      )
    }
  }, [initial])

  const handleTest = async () => {
    const url = form.base_url.trim().replace(/\/$/, '')
    if (!url || !form.db.trim() || !form.username.trim() || !form.password) {
      setMessage({ type: 'error', text: t('connectionFailed') })
      return
    }
    setMessage(null)
    setTesting(true)
    const result = await testCRMConnection('odoo', {
      base_url: url.startsWith('http') ? url : `https://${url}`,
      db: form.db.trim(),
      username: form.username.trim(),
      password: form.password,
    })
    setTesting(false)
    if (result.success) {
      setMessage({ type: 'success', text: t('connectionSuccess') })
    } else {
      setMessage({ type: 'error', text: result.error ?? t('connectionFailed') })
    }
  }

  const handleSave = async () => {
    const url = form.base_url.trim().replace(/\/$/, '')
    if (!url || !form.db.trim() || !form.username.trim() || !form.password) {
      setMessage({ type: 'error', text: tSettings('saveFailed') })
      return
    }
    setMessage(null)
    setSaving(true)
    const result = await saveCRMConnection(
      'odoo',
      {
        base_url: url.startsWith('http') ? url : `https://${url}`,
        db: form.db.trim(),
        username: form.username.trim(),
        password: form.password,
      },
      'Odoo'
    )
    setSaving(false)
    if (result.success) {
      setMessage({ type: 'success', text: tSettings('changesSaved') })
    } else {
      setMessage({ type: 'error', text: result.error ?? tSettings('saveFailed') })
    }
  }

  return (
    <Box className="fancy-card fancy-card-accent-blue">
      <Flex direction="column" gap="4">
        <Flex align="center" gap="2">
          <Plug size={20} style={{ color: 'var(--color-info-600)' }} />
          <Text size="3" weight="bold" style={{ color: 'var(--text-primary)' }}>
            {t('odoo')}
          </Text>
        </Flex>
        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
          {tSettings('integrationsDescription')}
        </Text>
        <Flex direction="column" gap="3">
          <label>
            <Text size="2" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              {t('odooBaseUrl')}
            </Text>
            <TextField.Root
              type="url"
              placeholder={t('odooBaseUrlPlaceholder')}
              value={form.base_url}
              onChange={(e) => setForm((prev) => ({ ...prev, base_url: e.target.value }))}
              style={{ width: '100%', maxWidth: 400 }}
            />
          </label>
          <label>
            <Text size="2" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              {t('odooDatabase')}
            </Text>
            <TextField.Root
              placeholder={t('odooDatabasePlaceholder')}
              value={form.db}
              onChange={(e) => setForm((prev) => ({ ...prev, db: e.target.value }))}
              style={{ width: '100%', maxWidth: 400 }}
            />
          </label>
          <label>
            <Text size="2" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              {t('odooUsername')}
            </Text>
            <TextField.Root
              placeholder={t('odooUsernamePlaceholder')}
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              style={{ width: '100%', maxWidth: 400 }}
            />
          </label>
          <label>
            <Text size="2" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              {t('odooPassword')}
            </Text>
            <TextField.Root
              type="password"
              placeholder={initial?.hasPassword ? '••••••••' : t('odooPasswordPlaceholder')}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              style={{ width: '100%', maxWidth: 400 }}
            />
            {initial?.hasPassword && (
              <Text size="1" style={{ color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                Re-enter password to update credentials.
              </Text>
            )}
          </label>
        </Flex>
        {message && (
          <Text size="2" style={{ color: message.type === 'success' ? 'var(--green-11)' : 'var(--red-11)' }}>
            {message.text}
          </Text>
        )}
        <Flex gap="3" wrap="wrap">
          <Button type="button" disabled={testing || saving} onClick={handleTest}>
            {testing ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {t('testingConnection')}
              </>
            ) : (
              t('testConnection')
            )}
          </Button>
          <Button type="button" variant="soft" disabled={testing || saving} onClick={handleSave}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {tSettings('saving')}
              </>
            ) : (
              t('saveOdooCredentials')
            )}
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}
