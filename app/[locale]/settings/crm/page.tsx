import { getOdooStatus } from '@/actions/crm'
import { CRMOdooCard } from '@/components/settings/crm-odoo-card'
import { Container, Flex } from '@radix-ui/themes'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CRMSettingsPage({ params }: Props) {
  await params
  const odooStatusResult = await getOdooStatus()
  const initialOdooStatus = odooStatusResult.success && odooStatusResult.data
    ? { configured: odooStatusResult.data.configured, pushEnabled: odooStatusResult.data.pushEnabled, message: odooStatusResult.data.message }
    : null

  return (
    <Container size="3" py="8">
      <Flex direction="column" gap="6">
        <CRMOdooCard initialStatus={initialOdooStatus} />
      </Flex>
    </Container>
  )
}
