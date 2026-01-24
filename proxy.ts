import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Use next-intl middleware for locale handling
const intlMiddleware = createMiddleware(routing)

export function proxy(request: Request) {
  return intlMiddleware(request as any)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Files with extensions (.png, .jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
}
