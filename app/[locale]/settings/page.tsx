import { NextIntlClientProvider } from 'next-intl'
import { getMessages, isValidLocale, type Locale } from '@/lib/i18n'
import { SettingsClient } from '@/components/settings/settings-client'
import '@/app/globals-settings.css'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params
  const validLocale: Locale = isValidLocale(locale) ? locale : 'ar'
  const messages = getMessages(validLocale)
  
  return (
    <NextIntlClientProvider messages={messages} locale={validLocale}>
      <SettingsClient locale={validLocale} />
    </NextIntlClientProvider>
  )
}
