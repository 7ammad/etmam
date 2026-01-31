-- Migration: Add Award Columns for Historical Tenders
-- Purpose: Store award data from historical (awarded) tender scrapes
--
-- This migration adds columns to tenders for:
-- - award_amount_sar: Final awarded contract value (SAR)
-- - award_date: Date of award announcement (ISO or raw string)
-- - winning_bidder: Name of winning vendor

-- ============================================================
-- 1. Add award columns to tenders table
-- ============================================================

-- Award amount in SAR (from scraper: "قيمة الترسية")
ALTER TABLE tenders
  ADD COLUMN IF NOT EXISTS award_amount_sar NUMERIC(15, 2);

-- Award date (from scraper: "تاريخ الترسية")
ALTER TABLE tenders
  ADD COLUMN IF NOT EXISTS award_date TEXT;

-- Winning bidder name (from scraper: "المورد الفائز")
ALTER TABLE tenders
  ADD COLUMN IF NOT EXISTS winning_bidder TEXT;

-- ============================================================
-- 2. Comments for documentation
-- ============================================================

COMMENT ON COLUMN tenders.award_amount_sar IS
  'Award amount in SAR (قيمة الترسية) - only for historical/awarded tenders';

COMMENT ON COLUMN tenders.award_date IS
  'Award date (تاريخ الترسية) - ISO or raw string, only for historical tenders';

COMMENT ON COLUMN tenders.winning_bidder IS
  'Winning bidder name (المورد الفائز) - only for historical/awarded tenders';

-- ============================================================
-- 3. Index for querying by award date/amount (optional)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tenders_award_amount_sar
  ON tenders(award_amount_sar)
  WHERE award_amount_sar IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenders_award_date
  ON tenders(award_date)
  WHERE award_date IS NOT NULL;
