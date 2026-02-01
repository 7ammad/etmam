import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'

export type Profile = Tables<'profiles'>

/**
 * Get the current user's profile. Uses session client so RLS applies.
 * Returns null if not signed in or no profile row (e.g. existing user before trigger).
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('getProfile error:', error)
    return null
  }
  return data as Profile | null
}
