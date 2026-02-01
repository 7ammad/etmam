'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AuthActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

/**
 * Login with email and password
 */
export async function loginAction(
  email: string,
  password: string
): Promise<AuthActionResponse> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Map common Supabase auth errors to user-friendly messages
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid email or password' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'Please verify your email before logging in' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Logout the current user
 */
export async function logoutAction(): Promise<AuthActionResponse> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: 'Failed to sign out' }
  }
}

/**
 * Request password reset email
 */
export async function resetPasswordAction(
  email: string
): Promise<AuthActionResponse> {
  try {
    const supabase = await createClient()

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?type=recovery`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, error: 'Failed to send reset email' }
  }
}

/**
 * Update password (after password reset)
 */
export async function updatePasswordAction(
  newPassword: string
): Promise<AuthActionResponse> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Update password error:', error)
    return { success: false, error: 'Failed to update password' }
  }
}

/**
 * Sign up with email and password
 */
export async function signupAction(
  email: string,
  password: string
): Promise<AuthActionResponse> {
  try {
    const supabase = await createClient()

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, error: 'An account with this email already exists' }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: 'Failed to create account' }
  }
}
