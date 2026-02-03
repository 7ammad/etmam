'use client'

import { useState, useCallback } from 'react'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AppSidebar } from '@/components/layout/app-sidebar'

interface AuthenticatedShellClientProps {
  locale: string
  children: React.ReactNode
}

/**
 * Client layout: sidebar + (header + main). On mobile (<768px) sidebar is hidden by default
 * and shown as overlay when hamburger is clicked (CC-4: Sidebar → Hamburger).
 */
export function AuthenticatedShellClient({ locale, children }: AuthenticatedShellClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

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
      {/* Mobile overlay when sidebar open — click to close */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay-visible' : ''}`}
        role="button"
        tabIndex={-1}
        aria-label="Close menu"
        onClick={closeSidebar}
        onKeyDown={(e) => e.key === 'Escape' && closeSidebar()}
      />

      <AppSidebar locale={locale} mobileOpen={sidebarOpen} onClose={closeSidebar} />

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
        <DashboardHeader locale={locale} onMenuClick={openSidebar} />
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
