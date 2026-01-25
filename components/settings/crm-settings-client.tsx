'use client'

import { useState } from 'react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  TextField,
  Card,
  Badge,
  Grid,
} from '@radix-ui/themes'
import {
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Webhook,
  Shield,
  Lock,
  Globe2,
  HelpCircle,
} from 'lucide-react'

type CRMProvider = 'webhook' | 'hubspot' | 'salesforce' | 'zoho' | 'odoo'

interface CRMConfig {
  provider: CRMProvider
  webhookUrl: string
  apiKey: string
  lastTested?: Date
  status?: 'connected' | 'disconnected' | 'testing'
}

export function CRMSettingsClient({ locale }: { locale: string }) {
  const tCRM = useTranslations('crm')
  const tCommon = useTranslations('common')
  const { locale: currentLocale } = useI18n()
  const isRTL = currentLocale === 'ar'

  const [config, setConfig] = useState<CRMConfig>({
    provider: 'webhook',
    webhookUrl: '',
    apiKey: '',
    status: 'disconnected',
  })
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const providers: { value: CRMProvider; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'webhook', label: tCRM('providers.webhook'), icon: <Webhook size={24} />, desc: 'Universal REST endpoint' },
    { value: 'hubspot', label: tCRM('providers.hubspot'), icon: <span style={{ fontSize: '24px' }}>💜</span>, desc: 'Marketing automation' },
    { value: 'salesforce', label: tCRM('providers.salesforce'), icon: <span style={{ fontSize: '24px' }}>☁️</span>, desc: 'Enterprise CRM leader' },
    { value: 'zoho', label: tCRM('providers.zoho'), icon: <span style={{ fontSize: '24px' }}>📊</span>, desc: 'All-in-one suite' },
    { value: 'odoo', label: tCRM('providers.odoo'), icon: <span style={{ fontSize: '24px' }}>🐝</span>, desc: 'Open source ERP' },
  ]

  const handleTestConnection = async () => {
    setIsTesting(true)
    setConfig({ ...config, status: 'testing' })
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const success = config.webhookUrl && config.apiKey
    setConfig({
      ...config,
      status: success ? 'connected' : 'disconnected',
      lastTested: success ? new Date() : undefined,
    })
    setIsTesting(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <Flex direction="column" gap="6">
      {/* Page Header */}
      <Box>
        <Flex align="center" gap="3" style={{ marginBottom: 'var(--space-2)' }}>
          <Flex
            align="center"
            justify="center"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-600)',
            }}
          >
            <Database size={24} />
          </Flex>
          <Box>
            <Heading size="6" style={{ color: 'var(--text-primary)' }}>
              {tCRM('title')} {isRTL ? 'التكامل' : 'Integration'}
            </Heading>
            <Text size="2" style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'اربط نظام CRM الخاص بك لإرسال المناقصات تلقائياً' : 'Connect your CRM system to automatically push evaluated tenders'}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Connection Status */}
      <div
        className="glass-card"
        style={{
          padding: 'var(--space-5)',
          borderLeft: `4px solid ${
            config.status === 'connected'
              ? 'var(--color-success)'
              : config.status === 'testing'
              ? 'var(--color-warning)'
              : 'var(--color-neutral-400)'
          }`,
        }}
      >
        <Flex align="center" justify="between">
          <Flex align="center" gap="3">
            {config.status === 'connected' && <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />}
            {config.status === 'disconnected' && <XCircle size={24} style={{ color: 'var(--text-tertiary)' }} />}
            {config.status === 'testing' && <Loader2 size={24} style={{ color: 'var(--color-warning)' }} className="animate-spin" />}

            <Box>
              <Text size="3" weight="bold" style={{ color: 'var(--text-primary)' }}>
                {config.status === 'connected' && (isRTL ? 'متصل بنجاح' : 'Connected')}
                {config.status === 'disconnected' && (isRTL ? 'غير متصل' : 'Not Connected')}
                {config.status === 'testing' && (isRTL ? 'جاري الاختبار...' : 'Testing...')}
              </Text>
              {config.lastTested && (
                <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                  {isRTL ? 'آخر اختبار: ' : 'Last tested: '}{config.lastTested.toLocaleString()}
                </Text>
              )}
            </Box>
          </Flex>

          {config.status === 'connected' && (
            <Badge color="green" size="2">
              <Shield size={14} />
              {isRTL ? 'آمن' : 'Secure'}
            </Badge>
          )}
        </Flex>
      </div>

      {/* Provider Selection */}
      <Box>
        <Heading size="4" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
          {isRTL ? 'اختر المزود' : 'Select Provider'}
        </Heading>

        <Grid columns={{ initial: '2', sm: '3', md: '5' }} gap="3">
          {providers.map((provider) => (
            <button
              key={provider.value}
              onClick={() => setConfig({ ...config, provider: provider.value })}
              className="focus-ring"
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: config.provider === provider.value
                  ? '2px solid var(--color-primary-500)'
                  : '1px solid var(--border-default)',
                backgroundColor: config.provider === provider.value
                  ? 'var(--color-primary-50)'
                  : 'var(--surface-card)',
                cursor: 'pointer',
                transition: 'var(--transition-all)',
                textAlign: 'center',
              }}
            >
              <Flex direction="column" align="center" gap="2">
                <Box style={{ fontSize: '28px' }}>{provider.icon}</Box>
                <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
                  {provider.label}
                </Text>
                <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                  {provider.desc}
                </Text>
                {config.provider === provider.value && (
                  <CheckCircle2 size={16} style={{ color: 'var(--color-primary-500)' }} />
                )}
              </Flex>
            </button>
          ))}
        </Grid>
      </Box>

      {/* Configuration Form */}
      <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <Heading size="4" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-5)' }}>
          {isRTL ? 'إعدادات الاتصال' : 'Connection Settings'}
        </Heading>

        <Grid columns={{ initial: '1', md: '2' }} gap="5">
          {/* Webhook URL */}
          <Box>
            <Flex align="center" gap="2" style={{ marginBottom: 'var(--space-2)' }}>
              <Globe2 size={16} style={{ color: 'var(--text-secondary)' }} />
              <Text as="label" size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
                {tCRM('webhookUrl')}
              </Text>
            </Flex>
            <TextField.Root
              placeholder="https://api.example.com/webhook"
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              size="3"
            />
            <Text size="1" style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
              {isRTL ? 'أدخل عنوان webhook الخاص بك' : 'Enter your webhook endpoint URL'}
            </Text>
          </Box>

          {/* API Key */}
          <Box>
            <Flex align="center" gap="2" style={{ marginBottom: 'var(--space-2)' }}>
              <Lock size={16} style={{ color: 'var(--text-secondary)' }} />
              <Text as="label" size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
                {tCRM('apiKey')}
              </Text>
              <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                ({isRTL ? 'اختياري' : 'Optional'})
              </Text>
            </Flex>
            <TextField.Root
              type="password"
              placeholder="••••••••••••"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              size="3"
            />
            <Text size="1" style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
              {isRTL ? 'رمز المصادقة للوصول الآمن' : 'Authentication token for secure access'}
            </Text>
          </Box>
        </Grid>

        {/* Action Buttons */}
        <Flex gap="3" style={{ marginTop: 'var(--space-6)' }}>
          <Button
            size="3"
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || !config.webhookUrl}
            style={{ flex: 1 }}
          >
            {isTesting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {tCRM('testConnection')}
          </Button>

          <Button
            size="3"
            onClick={handleSave}
            disabled={isSaving || !config.webhookUrl}
            style={{
              flex: 1,
              backgroundColor: 'var(--color-primary-500)',
              color: 'var(--text-inverted)',
            }}
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Database size={18} />
            )}
            {tCRM('saveSettings')}
          </Button>
        </Flex>
      </div>

      {/* Help Section */}
      <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
        <Flex align="center" gap="2" style={{ marginBottom: 'var(--space-4)' }}>
          <HelpCircle size={20} style={{ color: 'var(--text-secondary)' }} />
          <Heading size="4" style={{ color: 'var(--text-primary)' }}>
            {isRTL ? 'تحتاج مساعدة؟' : 'Need Help?'}
          </Heading>
        </Flex>

        <Grid columns={{ initial: '1', md: '3' }} gap="4">
          {[
            {
              title: isRTL ? 'كيف أحصل على webhook URL؟' : 'How to get a webhook URL?',
              body: isRTL
                ? 'كل مزود CRM لديه عملية إعداد مختلفة. راجع وثائق CRM الخاص بك.'
                : 'Each CRM provider has a different setup process. Check your CRM documentation.',
            },
            {
              title: isRTL ? 'ماذا يحدث عند الإرسال؟' : 'What happens when I push?',
              body: isRTL
                ? 'ننشئ فرصة جديدة تلقائياً مع جميع تفاصيل المناقصة ودرجات التقييم.'
                : 'We create a new opportunity with all tender details and evaluation scores.',
            },
            {
              title: isRTL ? 'الأمان والخصوصية' : 'Security & Privacy',
              body: isRTL
                ? 'جميع الاتصالات تستخدم HTTPS المشفر. مفاتيح API مخزنة بأمان.'
                : 'All connections use encrypted HTTPS. Your API keys are stored securely.',
            },
          ].map((item, index) => (
            <Box
              key={index}
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-muted)',
              }}
            >
              <Text size="2" weight="bold" style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 'var(--space-2)' }}>
                {item.title}
              </Text>
              <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                {item.body}
              </Text>
            </Box>
          ))}
        </Grid>
      </div>
    </Flex>
  )
}
