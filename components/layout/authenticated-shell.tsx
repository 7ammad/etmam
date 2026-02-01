import { DashboardHeader } from '@/components/dashboard/dashboard-header'

interface AuthenticatedShellProps {
  locale: string
  children: React.ReactNode
}

/**
 * Shared app shell for authenticated routes (dashboard, settings).
 * Same header + main wrapper so navigation and layout are consistent.
 */
export function AuthenticatedShell({ locale, children }: AuthenticatedShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--surface-page)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DashboardHeader locale={locale} />
      <main style={{ flex: 1, paddingBottom: 'var(--space-12)' }}>{children}</main>
    </div>
  )
}
