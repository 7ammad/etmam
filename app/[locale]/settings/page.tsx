import { getProfile } from '@/lib/queries/profile'
import { getCurrentUser } from '@/lib/auth/guard'
import { getOdooConfigForForm } from '@/actions/crm'
import { SettingsPageClient } from '@/components/settings/settings-page-client'
import { Container, Box } from '@radix-ui/themes'

type Props = {
  params: Promise<{ locale: string }>
}

/** Version from package or env (for About section). */
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params
  const [profile, user, odooConfigResult] = await Promise.all([
    getProfile(),
    getCurrentUser(),
    getOdooConfigForForm(),
  ])
  const userEmail = user?.email ?? null
  const odooInitial = odooConfigResult.success ? odooConfigResult.data : null

  return (
    <Container size="3" py="6" style={{ width: '100%', maxWidth: '100%' }}>
      <Box style={{ width: '100%' }}>
        <SettingsPageClient
          locale={locale}
          profile={profile}
          userEmail={userEmail}
          odooInitial={odooInitial}
          version={APP_VERSION}
        />
      </Box>
    </Container>
  )
}
