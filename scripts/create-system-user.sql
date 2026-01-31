-- Create System User for Scraped Tenders
-- This script creates the system user that owns all scraped tenders
-- 
-- IMPORTANT: Direct insertion into auth.users is complex and may break Supabase Auth.
-- RECOMMENDED: Use Supabase Dashboard instead (see instructions below)
--
-- If you must use SQL, this is a simplified version that may work,
-- but it's better to use the Dashboard method.

-- ============================================================
-- RECOMMENDED METHOD: Via Supabase Dashboard
-- ============================================================
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
-- 2. Click "Add User" → "Create new user"
-- 3. Set:
--    - User ID: 00000000-0000-0000-0000-000000000001
--    - Email: system@etmam.local
--    - Password: (generate a secure random password - you won't need to log in)
-- 4. Click "Create User"

-- ============================================================
-- ALTERNATIVE: SQL Method (Use with caution)
-- ============================================================
-- This requires service role permissions and may not work in all Supabase setups.
-- The auth.users table structure can vary, so this is a template.

-- Check if user already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
  ) THEN
    -- Note: This is a simplified version. Actual auth.users table has more required fields.
    -- You may need to adjust based on your Supabase version.
    RAISE NOTICE 'User does not exist. Please create via Dashboard or Supabase CLI.';
    RAISE NOTICE 'See: https://supabase.com/docs/guides/auth/managing-users';
  ELSE
    RAISE NOTICE 'System user already exists!';
  END IF;
END $$;

-- Verify the user exists
SELECT 
  id, 
  email, 
  created_at,
  email_confirmed_at IS NOT NULL as is_confirmed
FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
