import { createServerClient, type CookieOptions } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/settings', '/tenders', '/update-password']
// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login', '/forgot-password', '/signup']
// Default locale
const DEFAULT_LOCALE = 'ar'

// Create i18n middleware
const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: Request) {
  const nextRequest = request as unknown as import('next/server').NextRequest
  const url = new URL(request.url)
  const { pathname } = url

  // First, run the intl middleware to handle locale routing
  let response = intlMiddleware(nextRequest)

  // Create Supabase client for auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return nextRequest.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            nextRequest.cookies.set(name, value)
          )
          // Update response cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — Supabase SSR: use getUser() (not getSession()) so expired tokens are refreshed
  const { data: { user } } = await supabase.auth.getUser()

  // Extract locale from pathname (e.g., /ar/dashboard -> ar)
  const localeMatch = pathname.match(/^\/(ar|en)/)
  const locale = localeMatch ? localeMatch[1] : DEFAULT_LOCALE
  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, '') || '/'

  // Check if current path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathWithoutLocale.startsWith(route)
  )

  // Check if current path is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route =>
    pathWithoutLocale.startsWith(route)
  )

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - auth (auth callback — Supabase redirects here; must not be rewritten by intl)
     * - _next/static, _next/image, favicon, sitemap, robots, static files
     */
    '/((?!api|auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
}
