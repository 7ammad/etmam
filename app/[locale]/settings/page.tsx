import { isValidLocale, type Locale } from '@/lib/i18n'
import { SettingsClient } from '@/components/settings/settings-client'
import '@/app/globals-settings.css'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params
  const validLocale: Locale = isValidLocale(locale) ? locale : 'ar'

  return <SettingsClient locale={validLocale} />
}
