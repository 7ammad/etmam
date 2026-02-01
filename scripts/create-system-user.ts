/**
 * Create System User Script
 *
 * Creates the system user in Supabase Auth that owns all scraped tenders.
 * Either uses the fixed UUID (00000000-0000-0000-0000-000000000001) via SQL,
 * or creates a user via Admin API and updates app_config + .env instructions.
 *
 * Usage:
 *   pnpm tsx scripts/create-system-user.ts
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { randomBytes } from 'crypto'
import { existsSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FIXED_SYSTEM_ID = '00000000-0000-0000-0000-000000000001'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function createSystemUser() {
  console.log('🔧 Creating system user (system@etmam.local)...')

  try {
    const { data: existing, error: checkErr } = await supabase.auth.admin.getUserById(FIXED_SYSTEM_ID)
    if (existing?.user && !checkErr) {
      console.log('✅ System user already exists:', FIXED_SYSTEM_ID)
      return
    }

    // Prefer SQL so we keep the fixed UUID (matches migration + .env.local.template)
    const sqlPath = join(process.cwd(), 'scripts', 'create-system-user.sql')
    if (existsSync(sqlPath)) {
      try {
        execSync(`pnpm exec supabase db execute -f "${sqlPath}"`, {
          stdio: 'pipe',
          encoding: 'utf-8',
        })
        console.log('✅ System user created via SQL:', FIXED_SYSTEM_ID)
        console.log('   Ensure .env.local has: SYSTEM_USER_ID=' + FIXED_SYSTEM_ID)
        return
      } catch (_) {
        // CLI not linked or not available; fall back to Admin API
      }
    }

    // Fallback: create via Admin API (assigns a new UUID; we update app_config)
    const password = 'system-' + randomBytes(16).toString('hex')
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: 'system@etmam.local',
      password,
      email_confirm: true,
    })

    if (createErr || !created?.user?.id) {
      console.error('❌ Create user failed:', createErr?.message ?? 'unknown')
      printManualInstructions()
      process.exit(1)
    }

    const newId = created.user.id
    const { error: updateErr } = await supabase
      .from('app_config')
      .update({ value: newId })
      .eq('key', 'system_user_id')

    if (updateErr) {
      console.warn('⚠️  app_config update failed:', updateErr.message)
      console.log('   Run in SQL: UPDATE public.app_config SET value = \'' + newId + '\' WHERE key = \'system_user_id\';')
    }

    console.log('✅ System user created via Admin API.')
    console.log('   Add to .env.local:')
    console.log('   SYSTEM_USER_ID=' + newId)
  } catch (err) {
    console.error('❌ Error:', err)
    printManualInstructions()
    process.exit(1)
  }
}

function printManualInstructions() {
  console.log('')
  console.log('📝 Manual options:')
  console.log('   1. Supabase Dashboard → Authentication → Users → Add user')
  console.log('      User ID: ' + FIXED_SYSTEM_ID + ', Email: system@etmam.local')
  console.log('   2. Run in SQL Editor: scripts/create-system-user.sql')
  console.log('   3. CLI: pnpm exec supabase db execute -f scripts/create-system-user.sql')
}

createSystemUser()
