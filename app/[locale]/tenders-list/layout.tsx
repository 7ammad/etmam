import { AppShell } from '@/components/layout/app-shell'

export default function TendersListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
