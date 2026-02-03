'use client'

import { useEffect } from 'react'
import { trackTenderDetailView } from '@/lib/analytics'

interface TenderDetailViewTrackerProps {
  tenderId: string
  locale: string
}

export function TenderDetailViewTracker({ tenderId, locale }: TenderDetailViewTrackerProps) {
  useEffect(() => {
    trackTenderDetailView({ tender_id: tenderId, locale })
  }, [tenderId, locale])
  return null
}
