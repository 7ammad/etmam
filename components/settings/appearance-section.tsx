'use client'

import { useState, useEffect } from 'react'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Flex, Text, Box, Button, Checkbox } from '@radix-ui/themes'
import { Loader2, Sun, Moon, Monitor } from 'lucide-react'

const REDUCE_MOTION_KEY = 'etmam-reduce-motion'

interface AppearanceSectionProps {
  locale: string
}

export function AppearanceSection({ locale }: AppearanceSectionProps) {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const section = searchParams.get('section') ?? 'appearance'
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(REDUCE_MOTION_KEY)
        setReduceMotion(stored === 'true')
      } catch {
        setReduceMotion(false)
      }
    })
  }, [])

  const handleSavePreferences = () => {
    setSaving(true)
    setMessage(null)
    try {
      localStorage.setItem(REDUCE_MOTION_KEY, String(reduceMotion))
      setMessage({ type: 'success', text: t('changesSaved') })
    } catch {
      setMessage({ type: 'error', text: t('saveFailed') })
    }
    setSaving(false)
  }

  const otherLocale = locale === 'ar' ? 'en' : 'ar'
  const otherLocaleLabel = locale === 'ar' ? t('english') : t('arabic')

  if (!mounted) {
    return (
      <section aria-labelledby="appearance-section-heading" style={{ maxWidth: 480 }}>
        <Text id="appearance-section-heading" size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('appearanceTitle')}
        </Text>
        <Text size="2" style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)', display: 'block' }}>
          {tCommon('loading')}
        </Text>
      </section>
    )
  }

  return (
    <section aria-labelledby="appearance-section-heading" style={{ maxWidth: 480 }}>
      <Flex direction="column" gap="4">
        <Text id="appearance-section-heading" size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('appearanceTitle')}
        </Text>
        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
          {t('appearanceDescription')}
        </Text>

        <Box>
          <Text size="2" weight="medium" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
            {t('theme')}
          </Text>
          <Flex gap="3" wrap="wrap">
            {[
              { value: 'light' as const, label: t('light'), icon: Sun },
              { value: 'dark' as const, label: t('dark'), icon: Moon },
              { value: 'system' as const, label: t('system'), icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-2)',
                  border: theme === value ? '2px solid var(--color-info-600)' : '1px solid var(--border-default)',
                  background: theme === value ? 'var(--gray-a3)' : 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-2)',
                }}
                aria-pressed={theme === value}
              >
                <Icon style={{ width: 18, height: 18 }} aria-hidden />
                {label}
              </button>
            ))}
          </Flex>
        </Box>

        <Box>
          <Text size="2" weight="medium" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
            {t('language')}
          </Text>
          <NextLink
            href={`/${otherLocale}/settings?section=${section}`}
            style={{
              fontSize: 'var(--font-size-2)',
              color: 'var(--color-info-600)',
              textDecoration: 'underline',
            }}
          >
            {otherLocaleLabel}
          </NextLink>
        </Box>

        <Box>
          <Flex gap="2" align="center">
            <Checkbox
              id="reduce-motion"
              checked={reduceMotion}
              onCheckedChange={(checked) => setReduceMotion(checked === true)}
              aria-label={t('reduceMotionLabel')}
            />
            <Text as="label" htmlFor="reduce-motion" size="2" style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
              {t('reduceMotionLabel')}
            </Text>
          </Flex>
        </Box>

        {message && (
          <Text size="2" style={{ color: message.type === 'success' ? 'var(--green-11)' : 'var(--red-11)' }}>
            {message.text}
          </Text>
        )}

        <Button onClick={handleSavePreferences} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              {tCommon('loading')}
            </>
          ) : (
            t('savePreferences')
          )}
        </Button>
      </Flex>
    </section>
  )
}
