import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client with service role privileges
 * 
 * ⚠️ DEVELOPMENT ONLY - Bypasses RLS for testing
 * 
 * IMPORTANT: This uses createClient from @supabase/supabase-js (NOT @supabase/ssr)
 * because createServerClient from @supabase/ssr shares user sessions from cookies,
 * which override the service role key.
 * 
 * Reference: https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z
 * 
 * This should ONLY be used:
 * - During development/testing before auth is implemented
 * - For server-side queries that need to bypass RLS temporarily
 * 
 * TODO: Remove this and switch to proper auth-based queries before production
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables')
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
    throw new Error('Service role key not configured')
  }
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not defined')
    throw new Error('Supabase URL not configured')
  }
  
  console.log('✅ Service client configuration:')
  console.log('  - URL:', supabaseUrl)
  console.log('  - Key length:', serviceRoleKey.length)
  console.log('  - Key prefix:', serviceRoleKey.substring(0, 30) + '...')
  
  // Verify the key is a valid JWT with service_role
  let decodedRole = 'unknown'
  try {
    const payload = serviceRoleKey.split('.')[1]
    let paddedPayload = payload
    const padding = 4 - (payload.length % 4)
    if (padding !== 4) {
      paddedPayload += '='.repeat(padding)
    }
    const decoded = JSON.parse(Buffer.from(paddedPayload, 'base64').toString())
    decodedRole = decoded.role
    console.log('  - JWT Role:', decoded.role)
    if (decoded.role !== 'service_role') {
      console.error('❌ Warning: JWT role is not service_role!', decoded.role)
    }
  } catch (e) {
    console.error('❌ Failed to decode JWT:', e)
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b22f8891-a0d3-4eaa-a284-fd7127c7ef55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:createServiceClient',message:'Creating service client',data:{supabaseUrl,keyLength:serviceRoleKey.length,keyPrefix:serviceRoleKey.substring(0,20),decodedRole},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H3'})}).catch(()=>{});
  // #endregion
  
  // Use createClient from @supabase/supabase-js (NOT createServerClient from @supabase/ssr)
  // with auth disabled to properly bypass RLS
  const client = createSupabaseClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b22f8891-a0d3-4eaa-a284-fd7127c7ef55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:createServiceClient:after',message:'Service client created',data:{clientType:typeof client,hasFrom:typeof client.from},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H3'})}).catch(()=>{});
  // #endregion
  
  console.log('✅ Service client created successfully')
  return client
}
