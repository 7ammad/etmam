import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const DEFAULT_LOCALE = 'ar'
const SUPPORTED_LOCALES = ['ar', 'en']

/** Base URL for redirects — use x-forwarded-host in production when behind a load balancer */
function getRedirectOrigin(request: Request): string {
  const url = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocal = process.env.NODE_ENV === 'development'
  if (isLocal || !forwardedHost) return url.origin
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${forwardedHost}`
}

/**
 * Auth Callback Handler
 *
 * Handles redirects from Supabase after:
 * - Email confirmation
 * - Password reset
 * - OAuth provider authentication
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const origin = getRedirectOrigin(request)

  // Try to get locale from cookies or use default
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
  const locale = localeCookie && SUPPORTED_LOCALES.includes(localeCookie)
    ? localeCookie
    : DEFAULT_LOCALE

  // Handle error from Supabase
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // For password recovery, redirect to password update page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/${locale}/update-password`)
      }
      // For email confirmation or other flows, redirect to next or dashboard
      const redirectPath = next?.startsWith('/') ? next : `/${locale}/dashboard`
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }

    console.error('Code exchange error:', exchangeError)
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/${locale}/login?error=auth_callback_error`)
}
