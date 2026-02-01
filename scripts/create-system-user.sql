-- Create System User for Scraped Tenders (fixed UUID)
-- Run once: Supabase Dashboard SQL Editor, or: supabase db execute -f scripts/create-system-user.sql
-- Requires: auth schema (Supabase managed). Uses pgcrypto for password hash.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_id UUID := '00000000-0000-0000-0000-000000000001';
  v_encrypted_pw TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_id) THEN
    RAISE NOTICE 'System user already exists.';
    RETURN;
  END IF;

  v_encrypted_pw := crypt('system-' || gen_random_uuid()::text, gen_salt('bf'));

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    v_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'system@etmam.local',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_id,
    v_id,
    format('{"sub":"%s","email":"system@etmam.local"}', v_id)::jsonb,
    'email',
    v_id::text,
    now(),
    now(),
    now()
  );

  RAISE NOTICE 'System user created: %', v_id;
END
$$;
