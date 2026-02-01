import { getOdooStatus } from '@/actions/crm'
import { CRMOdooCard } from '@/components/settings/crm-odoo-card'
import { getServerT } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { Container, Flex, Text } from '@radix-ui/themes'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CRMSettingsPage({ params }: Props) {
  const { locale } = await params
  const t = getServerT(locale as Locale, 'crm')
  const tSettings = getServerT(locale as Locale, 'settings')
  const odooStatusResult = await getOdooStatus()
  const initialOdooStatus = odooStatusResult.success && odooStatusResult.data
    ? { configured: odooStatusResult.data.configured, pushEnabled: odooStatusResult.data.pushEnabled, message: odooStatusResult.data.message }
    : null

  return (
    <Container size="3" py="8">
      <Flex direction="column" gap="6">
        <Text size="8" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('settings')}
        </Text>
        <Text size="2" style={{ color: 'var(--gray-11)' }}>
          {tSettings('crmDescription')}
        </Text>
        <CRMOdooCard initialStatus={initialOdooStatus} />
      </Flex>
    </Container>
  )
}
