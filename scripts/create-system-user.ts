/**
 * Create System User Script
 * 
 * This script creates the system user in Supabase Auth that owns all scraped tenders.
 * 
 * Usage:
 *   pnpm tsx scripts/create-system-user.ts
 * 
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - SUPABASE_URL in .env.local
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
// Note: When running with tsx, env vars are loaded automatically from .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || '00000000-0000-0000-0000-000000000001'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// TypeScript now knows these are strings after the check above
const supabaseUrl: string = SUPABASE_URL
const supabaseKey: string = SUPABASE_SERVICE_ROLE_KEY

async function createSystemUser() {
  console.log('🔧 Creating system user...')
  console.log(`   User ID: ${SYSTEM_USER_ID}`)
  console.log(`   Email: system@etmam.local`)

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserById(
      SYSTEM_USER_ID
    )

    if (existingUser && !checkError) {
      console.log('✅ System user already exists!')
      console.log(`   Email: ${existingUser.user.email}`)
      console.log(`   Created: ${existingUser.user.created_at}`)
      return
    }

    // Create the system user
    // Note: Supabase Admin API doesn't support creating users with specific UUIDs directly
    // We need to use the database directly or create via auth.signUp and then update
    
    console.log('⚠️  Supabase Admin API cannot create users with specific UUIDs.')
    console.log('📝 Please use one of these methods:')
    console.log('')
    console.log('   Option 1: Via Supabase Dashboard')
    console.log('   1. Go to Authentication → Users → Add User')
    console.log('   2. Set User ID: ' + SYSTEM_USER_ID)
    console.log('   3. Set Email: system@etmam.local')
    console.log('   4. Set a secure password')
    console.log('')
    console.log('   Option 2: Via SQL (run in Supabase SQL Editor)')
    console.log('   See: scripts/create-system-user.sql')
    console.log('')
    console.log('   Option 3: Use Supabase CLI')
    console.log('   supabase db execute -f scripts/create-system-user.sql')

    // Alternative: Try to create via database function if available
    // This would require a custom database function

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createSystemUser()
