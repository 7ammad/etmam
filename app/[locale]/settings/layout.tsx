import { requireAuth } from '@/lib/auth/guard'
import { AuthenticatedShell } from '@/components/layout/authenticated-shell'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function SettingsLayout({ children, params }: Props) {
  await requireAuth()
  const { locale } = await params
  return <AuthenticatedShell locale={locale}>{children}</AuthenticatedShell>
}
