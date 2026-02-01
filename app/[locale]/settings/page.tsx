import { getProfile } from '@/lib/queries/profile'
import { getOdooConfigForForm } from '@/actions/crm'
import { ProfileForm } from '@/components/settings/profile-form'
import { OdooIntegrationForm } from '@/components/settings/odoo-integration-form'
import { getServerT } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { Container, Flex, Text, Box } from '@radix-ui/themes'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params
  const t = getServerT(locale as Locale, 'settings')
  const [profile, odooConfigResult] = await Promise.all([getProfile(), getOdooConfigForForm()])
  const odooInitial = odooConfigResult.success ? odooConfigResult.data : null

  return (
    <Container size="3" py="8">
      <Flex direction="column" gap="6">
        <Text size="8" weight="bold" style={{ color: 'var(--text-primary)' }}>
          {t('title')}
        </Text>
        <Text size="2" style={{ color: 'var(--text-secondary)' }}>
          {t('description')}
        </Text>

        <Flex gap="6" wrap="wrap" align="stretch">
          <Box
            asChild
            className="fancy-card"
            style={{ flex: '1 1 320px', minWidth: 0 }}
          >
            <section aria-labelledby="profile-heading">
              <Flex direction="column" gap="4">
                <Text id="profile-heading" size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
                  {t('profileTitle')}
                </Text>
                <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                  {t('profileDescription')}
                </Text>
                <ProfileForm profile={profile} />
              </Flex>
            </section>
          </Box>

          <Box style={{ flex: '1 1 320px', minWidth: 0 }}>
            <section aria-labelledby="integrations-heading">
              <Flex direction="column" gap="3">
                <Text id="integrations-heading" size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
                  {t('integrationsTitle')}
                </Text>
                <OdooIntegrationForm initial={odooInitial} />
              </Flex>
            </section>
          </Box>
        </Flex>
      </Flex>
    </Container>
  )
}
