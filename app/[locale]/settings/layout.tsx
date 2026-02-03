import { requireAuth } from '@/lib/auth/guard'
import { AuthenticatedShellClient } from '@/components/layout/authenticated-shell-client'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function SettingsLayout({ children, params }: Props) {
  await requireAuth()
  const { locale } = await params
  return <AuthenticatedShellClient locale={locale}>{children}</AuthenticatedShellClient>
}
