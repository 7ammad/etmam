import { CRMSettingsClient } from '@/components/settings/crm-settings-client'
import '@/app/globals-settings.css'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CRMSettingsPage({ params }: Props) {
  const { locale } = await params
  
  return <CRMSettingsClient locale={locale} />
}
