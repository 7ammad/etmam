/**
 * Analytics events per final UX/UI plan (dashboard_view, filter_change, tender_detail_view).
 * Dispatches custom events so the app can forward to GA/Vercel/PostHog later.
 * No PII: only locale, path, filter types, and tender id.
 */

export type DashboardViewPayload = { locale: string; path: string }
export type FilterChangePayload = { filter_type: 'recommendation' | 'deadline' | 'search' | 'sort'; value: string }
export type TenderDetailViewPayload = { tender_id: string; locale: string }

const EVENT_PREFIX = 'etmam_'

export function trackDashboardView(payload: DashboardViewPayload): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(EVENT_PREFIX + 'dashboard_view', { detail: payload })
  )
}

export function trackFilterChange(payload: FilterChangePayload): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(EVENT_PREFIX + 'filter_change', { detail: payload })
  )
}

export function trackTenderDetailView(payload: TenderDetailViewPayload): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(EVENT_PREFIX + 'tender_detail_view', { detail: payload })
  )
}
