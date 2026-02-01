import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Layout Guard for authentication (defense-in-depth; proxy already protects routes).
 * Use in layout.tsx to protect routes:
 *
 * export default async function ProtectedLayout({ children }) {
 *   await requireAuth()
 *   return <>{children}</>
 * }
 * Default redirect is locale-aware (/ar/login) since app uses [locale] routes.
 */
export async function requireAuth(redirectTo = '/ar/login') {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect(redirectTo)
  }

  return user
}

/**
 * Get current user without redirecting
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Refresh session - call this in layouts to keep session fresh
 */
export async function refreshSession() {
  const supabase = await createClient()
  await supabase.auth.getUser()
}
