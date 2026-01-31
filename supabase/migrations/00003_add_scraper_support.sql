-- Migration: Add Scraper Support
-- Purpose: Enable upsert operations for scraped tenders and create system user
--
-- This migration:
-- 1. Adds unique constraint on (user_id, reference_no) for upsert support
-- 2. Creates a system user for scraped tenders
-- 3. Adds index for efficient querying by source

-- ============================================================
-- 1. Add unique constraint for upsert operations
-- ============================================================
-- The scraper uses reference_no to identify tenders for upsert.
-- We need a unique constraint on (user_id, reference_no) to support this.

DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenders_user_reference_unique'
  ) THEN
    ALTER TABLE tenders
      ADD CONSTRAINT tenders_user_reference_unique
      UNIQUE (user_id, reference_no);
  END IF;
END $$;

-- ============================================================
-- 2. Create system user for scraped tenders
-- ============================================================
-- All tenders scraped from Etimad will be associated with this system user.
-- This allows for multi-tenant architecture where each user can also have
-- their own manually entered tenders.
--
-- System User ID: 00000000-0000-0000-0000-000000000001
-- Email: system@etmam.local

-- Note: In production, you may need to create this user via Supabase Auth
-- or use a service role. This is a placeholder for the concept.
--
-- For local development, we can insert directly:
-- INSERT INTO auth.users (id, email, role)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'system@etmam.local', 'service_role')
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Add index for querying by source
-- ============================================================
-- This index speeds up queries filtering by source (e.g., 'etimad', 'excel')

CREATE INDEX IF NOT EXISTS idx_tenders_source
  ON tenders(source);

-- ============================================================
-- 4. Add index for querying by scraped_at (in raw_data)
-- ============================================================
-- This enables efficient queries for recently scraped tenders

CREATE INDEX IF NOT EXISTS idx_tenders_raw_data_scraped_at
  ON tenders((raw_data->>'scraped_at'));

-- ============================================================
-- 5. Add comments for documentation
-- ============================================================

COMMENT ON CONSTRAINT tenders_user_reference_unique ON tenders IS
  'Enables upsert operations: scraper can update existing tenders by reference_no';

COMMENT ON INDEX idx_tenders_source IS
  'Speeds up filtering tenders by source (etimad, excel, csv, manual)';

COMMENT ON INDEX idx_tenders_raw_data_scraped_at IS
  'Speeds up queries for recently scraped tenders';
