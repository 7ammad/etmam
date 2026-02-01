-- Migration: Insert system user for scraped tenders (fixed UUID)
-- Ensures auth.users has 00000000-0000-0000-0000-000000000001 so tenders_user_id_fkey is satisfied.
-- SYSTEM_USER_ID in .env.local and app_config must match this UUID.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_id UUID := '00000000-0000-0000-0000-000000000001';
  v_encrypted_pw TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_id) THEN
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
END
$$;
