import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AppSidebar } from '@/components/layout/app-sidebar'

interface AuthenticatedShellProps {
  locale: string
  children: React.ReactNode
}

/**
 * Standard web layout: sidebar + (header + main). Height fits content; min-height 100vh so short pages fill viewport.
 * LTR = sidebar left, content right. RTL = sidebar right, content left. Responsive via CSS.
 */
export function AuthenticatedShell({ locale, children }: AuthenticatedShellProps) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--surface-page)',
        display: 'flex',
        flexDirection: 'row',
        minWidth: 0,
        width: '100%',
      }}
      dir={dir}
    >
      <AppSidebar locale={locale} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 'var(--container-max-width, 1280px)',
          minHeight: 0,
        }}
      >
        <DashboardHeader locale={locale} />
        <main
          className="main-content"
          style={{
            flex: '0 1 auto',
            padding: 'var(--space-4)',
            paddingBottom: 'var(--space-12)',
            minWidth: 0,
            overflowX: 'auto',
            width: '100%',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
