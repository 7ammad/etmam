'use client'

import { useEffect } from 'react'
import { trackDashboardView } from '@/lib/analytics'

interface DashboardViewTrackerProps {
  locale: string
  path: string
}

export function DashboardViewTracker({ locale, path }: DashboardViewTrackerProps) {
  useEffect(() => {
    trackDashboardView({ locale, path })
  }, [locale, path])
  return null
}
