'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileUpdateInput = {
  display_name?: string | null
  company?: string | null
  role?: string | null
}

export type ProfileActionResponse =
  | { success: true }
  | { success: false; error: string }

/**
 * Update the current user's profile. Uses session client; RLS enforces own profile only.
 * If no profile row exists (e.g. user created before trigger), inserts one.
 */
export async function updateProfileAction(
  input: ProfileUpdateInput
): Promise<ProfileActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not signed in' }
    }

    const payload = {
      display_name: input.display_name ?? null,
      company: input.company ?? null,
      role: input.role ?? null,
      updated_at: new Date().toISOString(),
    }

    // Type escape: client may not infer profiles until types are regenerated after migration
    const table = (supabase as { from: (t: string) => unknown }).from('profiles') as {
      select: (cols: string) => { eq: (col: string, id: string) => { maybeSingle: () => Promise<{ data: { id: string } | null }> } }
      update: (v: typeof payload) => { eq: (col: string, id: string) => Promise<{ error: { message: string } | null }> }
      insert: (v: { id: string } & typeof payload) => Promise<{ error: { message: string } | null }>
    }

    const { data: existing } = await table.select('id').eq('id', user.id).maybeSingle()

    if (existing) {
      const { error } = await table.update(payload).eq('id', user.id)
      if (error) {
        console.error('updateProfile error:', error)
        return { success: false, error: error.message }
      }
    } else {
      const { error } = await table.insert({ id: user.id, ...payload })
      if (error) {
        console.error('updateProfile insert error:', error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error('updateProfile error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update profile',
    }
  }
}
